import { useCallback, useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api';
import { EXERCISE_LABELS } from '../config';
import { useTheme } from '../theme/ThemeContext';
import { BackButton, Card, Chip, ErrorState, LoadingState, PrimaryButton, Screen, ThemedText } from '../components/ui';
import { formatDuration } from '../utils/format';

const moods = [
  { key: 'happy', label: '😊 Senang' },
  { key: 'neutral', label: '😐 Biasa' },
  { key: 'sad', label: '😟 Sedih' },
];

export function SessionDetailScreen({ route, navigation }) {
  const { sessionId } = route.params || {};
  const { colors } = useTheme();
  const [session, setSession] = useState(null);
  const [note, setNote] = useState('');
  const [mood, setMood] = useState('happy');
  const [status, setStatus] = useState('loading');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [errorAction, setErrorAction] = useState('load');
  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const detail = await api.session(sessionId);
      setSession(detail);
      setNote(detail.note || '');
      setMood(detail.mood || 'happy');
      setStatus('ready');
    } catch (requestError) {
      setError(requestError);
      setStatus('error');
    }
  }, [sessionId]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const updated = await api.updateSession(sessionId, { mood, note: note.trim() || null });
      setSession((current) => ({ ...current, ...updated }));
    } catch (requestError) {
      setError(requestError);
      setErrorAction('save');
    } finally {
      setBusy(false);
    }
  }

  async function deleteSession() {
    setBusy(true);
    setError(null);
    try {
      await api.deleteSession(sessionId);
      navigation.goBack();
    } catch (requestError) {
      setError(requestError);
      setErrorAction('delete');
    } finally {
      setBusy(false);
    }
  }

  function remove() {
    Alert.alert('Hapus sesi ini?', 'Progres huruf akan dihitung ulang dari sesi yang tersisa.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus sesi', style: 'destructive', onPress: deleteSession },
    ]);
  }

  if (status === 'loading') return <Screen><LoadingState message="Memuat detail sesi..." /></Screen>;
  if (status === 'error' && !session) return <Screen><ErrorState error={error} onRetry={load} /></Screen>;
  return (
    <Screen>
      <BackButton navigation={navigation} />
      <ThemedText variant="title">{session.name}</ThemedText>
      <Card>
        <ThemedText variant="subtitle">{EXERCISE_LABELS[session.exercise_type] || session.exercise_type}</ThemedText>
        <ThemedText>{new Date(session.started_at).toLocaleString('id-ID')}</ThemedText>
        <ThemedText>Skor {session.score} · {session.correct_items}/{session.total_items} benar langsung</ThemedText>
        <ThemedText>Durasi {formatDuration(session.duration_seconds)}</ThemedText>
      </Card>
      <Card style={styles.results}>
        <ThemedText variant="subtitle">Jawaban sesi</ThemedText>
        {session.items.map((item) => (
          <View key={item.item_index} style={styles.resultRow}>
            <ThemedText variant="subtitle">{item.letter}</ThemedText>
            <ThemedText style={styles.flex}>{item.is_correct ? 'Langsung benar' : item.resolved ? 'Berhasil setelah petunjuk' : 'Sudah ikut mencoba'}</ThemedText>
            <ThemedText variant="caption">{item.attempts} percobaan</ThemedText>
          </View>
        ))}
      </Card>
      <Card style={styles.edit}>
        <ThemedText variant="subtitle">Catatan sesi</ThemedText>
        <View style={styles.moods}>
          {moods.map((option) => <Chip key={option.key} title={option.label} selected={mood === option.key} onPress={() => setMood(option.key)} />)}
        </View>
        <TextInput value={note} onChangeText={setNote} maxLength={500} multiline
          placeholder="Catatan pendamping" placeholderTextColor={colors.textSecondary}
          style={[styles.note, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }]} />
        {error ? <ErrorState error={error} onRetry={errorAction === 'delete' ? deleteSession : errorAction === 'save' ? save : load} /> : null}
        <PrimaryButton title={busy ? 'Menyimpan...' : 'Simpan perubahan'} onPress={save} disabled={busy} />
      </Card>
      <PrimaryButton title="Hapus sesi" secondary onPress={remove} disabled={busy} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  results: { gap: 10 },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  flex: { flex: 1 },
  edit: { gap: 12 },
  moods: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  note: { minHeight: 100, borderWidth: 1, borderRadius: 14, padding: 12, textAlignVertical: 'top', fontSize: 17 },
});
