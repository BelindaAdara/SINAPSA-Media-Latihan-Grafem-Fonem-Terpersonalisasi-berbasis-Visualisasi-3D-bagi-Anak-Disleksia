import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api';
import { EXERCISE_LABELS } from '../config';
import { useChild } from '../context/ChildContext';
import { useChildPreferences } from '../hooks/useChildPreferences';
import { useTheme } from '../theme/ThemeContext';
import { BackButton, Card, Chip, ErrorState, LoadingState, PrimaryButton, Screen, SectionTitle, ThemedText } from '../components/ui';
import { dateInTimezone } from '../utils/date';

export function ExerciseDetailScreen({ route, navigation }) {
  const { exerciseType, targetLetters: presetTargets } = route.params || {};
  const { child } = useChild();
  const { sessionLength } = useChildPreferences();
  const { colors } = useTheme();
  const [exercise, setExercise] = useState(null);
  const [letters, setLetters] = useState([]);
  const [words, setWords] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [selectionMode, setSelectionMode] = useState(presetTargets?.length ? 'custom' : 'recommended');
  const [selected, setSelected] = useState(presetTargets || []);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [type, letterRows, recs, wordRows] = await Promise.all([
        api.exerciseType(exerciseType),
        api.letters(),
        api.recommendations(child.id, 8),
        exerciseType === 'syllable_build' ? api.words(100) : Promise.resolve([]),
      ]);
      setExercise(type);
      setLetters(letterRows);
      setWords(wordRows);
      const eligible = eligibleLetters(exerciseType, letterRows, wordRows);
      const recommendedTargets = (presetTargets?.length ? presetTargets : recs.map((entry) => entry.letter))
        .filter((symbol) => eligible.some((letter) => letter.symbol === symbol));
      const safeTargets = recommendedTargets.length ? recommendedTargets.slice(0, 3) : eligible.slice(0, 3).map((letter) => letter.symbol);
      setRecommended(safeTargets);
      if (!presetTargets?.length || !recommendedTargets.length) {
        setSelected(safeTargets);
        if (presetTargets?.length && !recommendedTargets.length) setSelectionMode('recommended');
      }
    } catch (requestError) {
      setError(requestError);
    } finally {
      setLoading(false);
    }
  }, [exerciseType, child, presetTargets]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  function toggleLetter(symbol) {
    setSelected((value) => value.includes(symbol) ? value.filter((item) => item !== symbol) : [...value, symbol]);
  }

  function start() {
    const targets = selectionMode === 'recommended' ? recommended : selected;
    if (!targets.length || !exercise?.is_active) return;
    navigation.navigate('ExerciseSession', {
      exerciseType,
      sessionName: name.trim() || `Latihan ${dateInTimezone(new Date())}`,
      targetLetters: targets,
      length: sessionLength,
    });
  }

  if (loading) return <Screen><LoadingState message="Menyiapkan cara bermain..." /></Screen>;
  if (error) return <Screen><ErrorState error={error} onRetry={load} /></Screen>;
  if (!exercise) return <Screen><ErrorState error={new Error('Jenis latihan belum tersedia.')} onRetry={load} /></Screen>;

  const eligible = eligibleLetters(exerciseType, letters, words);
  const shownSelection = selectionMode === 'recommended' ? recommended : selected;
  return (
    <Screen>
      <BackButton navigation={navigation} />
      <ThemedText variant="title">{EXERCISE_LABELS[exercise.id] || exercise.name}</ThemedText>
      <Card><ThemedText variant="subtitle">Cara bermain</ThemedText><ThemedText>{exercise.how_to_play}</ThemedText></Card>
      <SectionTitle>Pilih huruf target</SectionTitle>
      <View style={styles.row}>
        <Chip title="Pilihan Sinapsa" selected={selectionMode === 'recommended'} onPress={() => setSelectionMode('recommended')} />
        <Chip title="Pilih sendiri" selected={selectionMode === 'custom'} onPress={() => setSelectionMode('custom')} />
      </View>
      <View style={styles.letters}>
        {eligible.map((letter) => {
          const chosen = shownSelection.includes(letter.symbol);
          return (
            <Pressable key={letter.symbol} onPress={() => selectionMode === 'custom' && toggleLetter(letter.symbol)} disabled={selectionMode !== 'custom'}>
              <Chip title={letter.symbol} selected={chosen} accessibilityLabel={`Huruf ${letter.symbol}`} />
            </Pressable>
          );
        })}
      </View>
      {selectionMode === 'recommended' ? (
        <Card><ThemedText variant="caption" style={{ color: colors.textSecondary }}>
          Huruf dipilih dari latihan sebelumnya agar kamu bisa berlatih lagi dengan santai.
        </ThemedText></Card>
      ) : null}
      <Card>
        <ThemedText>Nama sesi</ThemedText>
        <TextInput value={name} onChangeText={setName} maxLength={60} accessibilityLabel="Nama sesi" placeholder="Nama latihan"
          style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }]} />
        <ThemedText variant="caption">Jumlah item: {sessionLength}</ThemedText>
      </Card>
      <PrimaryButton title="Mulai" onPress={start} disabled={!shownSelection.length || !exercise.is_active} />
    </Screen>
  );
}

function eligibleLetters(exerciseType, letters, words) {
  if (exerciseType === 'discriminate') return letters.filter((letter) => letter.is_lookalike);
  if (exerciseType === 'syllable_build') {
    const initials = new Set(words.map((word) => word.word[0]));
    return letters.filter((letter) => initials.has(letter.symbol));
  }
  return letters;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  letters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  input: { borderWidth: 1, borderRadius: 14, minHeight: 50, paddingHorizontal: 12, fontSize: 18 },
});
