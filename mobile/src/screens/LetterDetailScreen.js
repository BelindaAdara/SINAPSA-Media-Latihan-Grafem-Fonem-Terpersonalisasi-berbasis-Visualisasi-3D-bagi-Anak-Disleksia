import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api';
import { useChild } from '../context/ChildContext';
import { useChildPreferences } from '../hooks/useChildPreferences';
import { speakLetter } from '../hooks/useSpeech';
import { useTheme } from '../theme/ThemeContext';
import { masteryLabel, masteryStatus, masteryIcon } from '../utils/mastery';
import { BackButton, CategoryCard, Chip, ErrorState, LoadingState, PrimaryButton, Screen, SectionTitle, ThemedText } from '../components/ui';
import { Letter3D } from '../three/Letter3D';
import { letterCategory } from '../theme/tokens';

export function LetterDetailScreen({ route, navigation }) {
  const { symbol } = route.params || {};
  const { child } = useChild();
  const { speechRate } = useChildPreferences();
  const { colors } = useTheme();
  const [letter, setLetter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mirrored, setMirrored] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setLetter(await api.letter(symbol, { child_id: child?.id }));
    } catch (requestError) {
      setError(requestError);
    } finally {
      setLoading(false);
    }
  }, [symbol, child]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) return <Screen><LoadingState message="Menyiapkan huruf..." /></Screen>;
  if (error) return <Screen><ErrorState error={error} onRetry={load} /></Screen>;
  if (!letter) return <Screen><ErrorState error={new Error('Huruf belum tersedia.')} onRetry={load} /></Screen>;

  const status = masteryStatus(letter.mastery);
  return (
    <Screen>
      <BackButton navigation={navigation} />
      <View style={styles.title}>
        <ThemedText variant="title">Kenali huruf</ThemedText>
        <ThemedText variant="title" style={{ color: colors.accent, fontSize: 44 }}>{letter.symbol}</ThemedText>
      </View>
      <Letter3D symbol={letter.symbol} strokes={letter.strokes} mirrored={mirrored} autoRotate />
      <View style={styles.row}>
        <PrimaryButton title={mirrored ? 'Kembalikan ⇄' : 'Cermin ⇄'} secondary onPress={() => setMirrored((value) => !value)} style={styles.flex} />
        <PrimaryButton title="🔊 Dengar bunyi" onPress={() => speakLetter(letter.tts_syllable, speechRate)} style={styles.flex} />
      </View>
      {letter.is_lookalike ? (
        <CardLike colors={colors}>
          <ThemedText style={styles.center}>{lookalikeNote(letter.symbol)}</ThemedText>
        </CardLike>
      ) : null}
      <CategoryCard isVowel={letter.category === 'vowel'} lookalike={letter.is_lookalike} style={styles.phonemeCard}>
        <ThemedText variant="subtitle" style={{ color: letterCategory.onCategory }}>Bunyi {letter.phoneme_ipa}</ThemedText>
        <ThemedText style={{ color: letterCategory.onCategory }}>{letter.phoneme_hint}</ThemedText>
      </CategoryCard>
      <View style={styles.section}>
        <SectionTitle>Contoh kata</SectionTitle>
        <View style={styles.examples}>
          {letter.example_words.map((example) => (
            <View key={example.word} style={[styles.example, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <ThemedText style={styles.exampleEmoji}>{example.emoji || '🔤'}</ThemedText>
              <ThemedText>{example.word}</ThemedText>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.section}>
        <SectionTitle>Tips mengenali</SectionTitle>
        <ThemedText>{letter.tips}</ThemedText>
      </View>
      <View style={styles.section}>
        <SectionTitle>Langkah menulis</SectionTitle>
        {letter.writing_steps.map((step, index) => (
          <ThemedText key={`${index}-${step}`}>{index + 1}. {step}</ThemedText>
        ))}
      </View>
      <View style={styles.section}>
        <SectionTitle>Sering tertukar dengan</SectionTitle>
        <View style={styles.examples}>
          {(letter.confusions?.length ? letter.confusions.map((item) => item.chosen) : letter.similar_to).map((other) => (
            <Chip key={other} title={other} onPress={() => navigation.push('LetterDetail', { symbol: other })} />
          ))}
          {!letter.similar_to.length && !letter.confusions?.length ? <ThemedText variant="caption">Belum ada pasangan huruf.</ThemedText> : null}
        </View>
      </View>
      <View style={styles.section}>
        <SectionTitle>Penguasaan</SectionTitle>
        <ThemedText>{masteryIcon(status)} {masteryLabel(status)} · {letter.mastery?.score || 0}/100</ThemedText>
        <View style={[styles.progressTrack, { backgroundColor: colors.secondary }]}>
          <View style={[styles.progressValue, { width: `${letter.mastery?.score || 0}%`, backgroundColor: colors.success }]} />
        </View>
      </View>
    </Screen>
  );
}

function lookalikeNote(symbol) {
  if (symbol === 'b' || symbol === 'd') return 'Huruf b dan d bentuknya sama, hanya menghadap arah berbeda.';
  if (symbol === 'p' || symbol === 'q') return 'Huruf p dan q bentuknya mirip, perhatikan arah batangnya.';
  if (symbol === 'm' || symbol === 'w') return 'Huruf m dan w punya lengkungan yang mirip, perhatikan arahnya.';
  if (symbol === 'n' || symbol === 'u') return 'Huruf n dan u punya lengkungan yang mirip, perhatikan arah batangnya.';
  return `Huruf ${symbol} bisa tertukar dengan huruf lain. Perhatikan bentuk dan arahnya.`;
}

function CardLike({ children, colors }) {
  return <View style={[styles.noteCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>{children}</View>;
}

const styles = StyleSheet.create({
  title: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  row: { flexDirection: 'row', gap: 10 },
  flex: { flex: 1, paddingHorizontal: 8 },
  center: { textAlign: 'center' },
  noteCard: { borderWidth: 1, borderRadius: 18, padding: 14 },
  phonemeCard: { gap: 4 },
  section: { gap: 8 },
  examples: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  example: { minWidth: 100, borderWidth: 1, borderRadius: 16, padding: 12, alignItems: 'center', gap: 4 },
  exampleEmoji: { fontSize: 28, lineHeight: 34 },
  progressTrack: { height: 12, borderRadius: 8, overflow: 'hidden' },
  progressValue: { height: '100%', borderRadius: 8 },
});
