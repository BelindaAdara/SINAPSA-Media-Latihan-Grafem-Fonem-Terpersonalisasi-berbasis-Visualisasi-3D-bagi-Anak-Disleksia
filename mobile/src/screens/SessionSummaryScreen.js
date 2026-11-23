import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { api } from '../api';
import { useChild } from '../context/ChildContext';
import { useTheme } from '../theme/ThemeContext';
import { EXERCISE_LABELS } from '../config';
import { Card, Chip, ErrorState, PrimaryButton, Screen, ThemedText } from '../components/ui';
import { formatDuration } from '../utils/format';

const moods = [
  { key: 'happy', label: '😊 Senang' },
  { key: 'neutral', label: '😐 Biasa' },
  { key: 'sad', label: '😟 Sedih' },
];

export function SessionSummaryScreen({ route, navigation }) {
  const { sessionName, exerciseType, startedAt, endedAt, results = [] } = route.params || {};
  const { child } = useChild();
  const { colors } = useTheme();
  const [mood, setMood] = useState('happy');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const correctCount = results.filter((item) => item.is_correct).length;
  const score = results.length ? Math.round((correctCount / results.length) * 100) : 0;
  const stars = score >= 80 ? 3 : score >= 50 ? 2 : 1;
  const duration = Math.max(0, Math.round((Date.parse(endedAt) - Date.parse(startedAt)) / 1000));
  const goodLetters = [...new Set(results.filter((item) => item.is_correct).map((item) => item.letter))];
  const retryLetters = [...new Set(results.filter((item) => !item.is_correct).map((item) => item.letter))];

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await api.createSession({
        child_id: child.id,
        name: sessionName,
        exercise_type: exerciseType,
        started_at: startedAt,
        ended_at: endedAt,
        mood,
        note: note.trim() || null,
        items: results,
      });
      setSaved(true);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setBusy(false);
    }
  }

  if (saved) {
    return (
      <Screen contentStyle={styles.centerContent}>
        <ThemedText variant="title" style={styles.center}>Kamu hebat!</ThemedText>
        <ThemedText style={styles.center}>Latihanmu sudah tersimpan. Sampai jumpa di latihan berikutnya.</ThemedText>
        <PrimaryButton title="Kembali ke Beranda" onPress={() => navigation.popToTop()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ThemedText variant="title">Selesai berlatih!</ThemedText>
      <Card style={styles.scoreCard}>
        <ThemedText style={styles.center}>✨ {EXERCISE_LABELS[exerciseType] || exerciseType}</ThemedText>
        <ThemedText variant="title" style={styles.score}>{score}</ThemedText>
        <ThemedText style={styles.center}>Skor latihan</ThemedText>
        <ThemedText variant="title" style={styles.center}>{'★'.repeat(stars)}{'☆'.repeat(3 - stars)}</ThemedText>
        <ThemedText style={styles.center}>{formatDuration(duration)} · {correctCount} dari {results.length} benar langsung</ThemedText>
      </Card>
      <Card>
        <ThemedText variant="subtitle">Sudah bagus</ThemedText>
        <ThemedText>{goodLetters.length ? goodLetters.join(' · ') : 'Kamu sudah berusaha dengan baik.'}</ThemedText>
        <ThemedText variant="subtitle" style={styles.groupTitle}>Ayo latihan lagi</ThemedText>
        <ThemedText>{retryLetters.length ? retryLetters.join(' · ') : 'Semua huruf sudah kamu coba.'}</ThemedText>
      </Card>
      <Card style={styles.moodCard}>
        <ThemedText variant="subtitle">Bagaimana perasaanmu?</ThemedText>
        <View style={styles.moods}>
          {moods.map((option) => <Chip key={option.key} title={option.label} selected={mood === option.key} onPress={() => setMood(option.key)} />)}
        </View>
        <ThemedText>Catatan pendamping</ThemedText>
        <TextInput
          value={note}
          onChangeText={setNote}
          maxLength={500}
          multiline
          placeholder="Hari ini lebih percaya diri"
          placeholderTextColor={colors.textSecondary}
          style={[styles.note, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }]}
        />
        <ThemedText variant="caption">{note.length}/500</ThemedText>
      </Card>
      {error ? <ErrorState error={error} onRetry={save} /> : null}
      <PrimaryButton title={busy ? 'Menyimpan...' : 'Simpan latihan'} onPress={save} disabled={busy} />
      <PrimaryButton title="Simpan nanti" secondary onPress={() => navigation.popToTop()} disabled={busy} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  centerContent: { flexGrow: 1, justifyContent: 'center' },
  center: { textAlign: 'center' },
  scoreCard: { alignItems: 'center', gap: 4 },
  score: { fontSize: 56, lineHeight: 68, fontWeight: '800' },
  groupTitle: { marginTop: 12 },
  moodCard: { gap: 10 },
  moods: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  note: { minHeight: 100, borderWidth: 1, borderRadius: 14, padding: 12, textAlignVertical: 'top', fontSize: 17 },
});
