import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api';
import { EXERCISE_LABELS } from '../config';
import { useChild } from '../context/ChildContext';
import { useChildPreferences } from '../hooks/useChildPreferences';
import { useTheme } from '../theme/ThemeContext';
import { BackButton, Card, Chip, ErrorState, LoadingState, PrimaryButton, Screen, SectionTitle, ThemedText } from '../components/ui';
import { randomTargets } from '../exercises/targetSelection';
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
      const validPresetTargets = (presetTargets || [])
        .filter((symbol) => eligible.some((letter) => letter.symbol === symbol));
      const recommendedTargets = (validPresetTargets.length ? validPresetTargets : recs.map((entry) => entry.letter))
        .filter((symbol) => eligible.some((letter) => letter.symbol === symbol));
      const safeTargets = recommendedTargets.length ? recommendedTargets.slice(0, 3) : eligible.slice(0, 3).map((letter) => letter.symbol);
      setRecommended(safeTargets);
      setSelected(validPresetTargets.length ? validPresetTargets : safeTargets);
      if (presetTargets?.length && !validPresetTargets.length) setSelectionMode('recommended');
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

  function chooseMode(mode) {
    if (mode === 'custom' && selectionMode === 'recommended') setSelected(recommended);
    setSelectionMode(mode);
  }

  function randomizeRecommended() {
    const symbols = eligible.map((letter) => letter.symbol);
    setRecommended((current) => randomTargets(symbols, current));
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
      <View style={styles.modeRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: selectionMode === 'recommended' }}
          onPress={() => chooseMode('recommended')}
          style={({ pressed }) => [
            styles.modeCard,
            {
              backgroundColor: selectionMode === 'recommended' ? colors.secondary : colors.surface,
              borderColor: selectionMode === 'recommended' ? colors.accent : colors.border,
              opacity: pressed ? 0.82 : 1,
            },
          ]}
        >
          <ThemedText variant="subtitle">✨ Pilihan Sinapsa</ThemedText>
          <ThemedText variant="caption" style={{ color: colors.textSecondary }}>Saran adaptif untuk latihanmu</ThemedText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: selectionMode === 'custom' }}
          onPress={() => chooseMode('custom')}
          style={({ pressed }) => [
            styles.modeCard,
            {
              backgroundColor: selectionMode === 'custom' ? colors.secondary : colors.surface,
              borderColor: selectionMode === 'custom' ? colors.accent : colors.border,
              opacity: pressed ? 0.82 : 1,
            },
          ]}
        >
          <ThemedText variant="subtitle">🔤 Pilih sendiri</ThemedText>
          <ThemedText variant="caption" style={{ color: colors.textSecondary }}>Tentukan huruf yang ingin dilatih</ThemedText>
        </Pressable>
      </View>
      {selectionMode === 'recommended' ? (
        <Card style={styles.recommendationCard}>
          <View style={styles.recommendationText}>
            <ThemedText variant="subtitle">Racikan Sinapsa</ThemedText>
            <ThemedText variant="caption" style={{ color: colors.textSecondary }}>
              Coba saran lain kapan saja.
            </ThemedText>
          </View>
          <PrimaryButton
            title="🎲 Acak lagi"
            onPress={randomizeRecommended}
            disabled={eligible.length <= 3}
            secondary
          />
        </Card>
      ) : (
        <Card style={styles.selectionHint}>
          <ThemedText variant="caption" style={{ color: colors.textSecondary }}>
            Ketuk satu atau beberapa huruf untuk memilih. Ketuk lagi untuk membatalkan pilihan.
          </ThemedText>
        </Card>
      )}
      <View style={styles.letters}>
        {eligible.map((letter) => {
          const chosen = shownSelection.includes(letter.symbol);
          return (
            <Chip
              key={letter.symbol}
              title={letter.symbol}
              selected={chosen}
              disabled={selectionMode !== 'custom'}
              onPress={() => toggleLetter(letter.symbol)}
              accessibilityLabel={`Huruf ${letter.symbol}`}
              style={styles.letterChip}
            />
          );
        })}
      </View>
      <ThemedText variant="caption" style={{ color: colors.textSecondary }}>
        {shownSelection.length} huruf dipilih dari {eligible.length} yang tersedia.
      </ThemedText>
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
  modeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  modeCard: { flexGrow: 1, flexBasis: 150, minHeight: 92, justifyContent: 'center', gap: 4, padding: 14, borderRadius: 20, borderWidth: 1 },
  recommendationCard: { gap: 12 },
  recommendationText: { gap: 2 },
  selectionHint: { paddingVertical: 12 },
  letters: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  letterChip: { minWidth: 52, minHeight: 52, borderRadius: 18 },
  input: { borderWidth: 1, borderRadius: 14, minHeight: 50, paddingHorizontal: 12, fontSize: 18 },
});
