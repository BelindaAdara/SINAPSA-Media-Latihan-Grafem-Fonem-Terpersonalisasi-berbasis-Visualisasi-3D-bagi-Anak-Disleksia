import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api';
import { EXERCISE_LABELS } from '../config';
import { useChild } from '../context/ChildContext';
import { useTheme } from '../theme/ThemeContext';
import { BackButton, Card, EmptyState, ErrorState, LoadingState, PrimaryButton, Screen, ThemedText } from '../components/ui';
import { formatDuration } from '../utils/format';

const PAGE_SIZE = 30;

export function HistoryScreen({ navigation }) {
  const { child } = useChild();
  const { colors } = useTheme();
  const [sessions, setSessions] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const load = useCallback(async (nextOffset = 0, append = false) => {
    if (!child?.id) return;
    setStatus('loading');
    setError(null);
    try {
      const rows = await api.sessions({ child_id: child.id, limit: PAGE_SIZE, offset: nextOffset });
      setSessions((current) => append ? [...current, ...rows] : rows);
      setOffset(nextOffset);
      setHasMore(rows.length === PAGE_SIZE);
      setStatus('ready');
    } catch (requestError) {
      setError(requestError);
      setStatus('error');
    }
  }, [child]);
  useFocusEffect(useCallback(() => { load(0); }, [load]));

  if (status === 'loading' && !sessions.length) return <Screen><LoadingState message="Memuat riwayat sesi..." /></Screen>;
  if (status === 'error' && !sessions.length) return <Screen><ErrorState error={error} onRetry={() => load(0)} /></Screen>;

  return (
    <Screen>
      <BackButton navigation={navigation} />
      <ThemedText variant="title">Riwayat Latihan</ThemedText>
      {status === 'error' ? <ErrorState error={error} onRetry={() => load(offset, true)} /> : null}
      {!sessions.length && status === 'ready'
        ? <EmptyState title="Belum ada riwayat" message="Sesi latihan yang tersimpan akan muncul di sini." />
        : sessions.map((session) => (
          <Pressable key={session.id} onPress={() => navigation.navigate('SessionDetail', { sessionId: session.id })} accessibilityRole="button">
            <Card style={styles.session}>
              <View style={styles.sessionHeading}>
                <ThemedText variant="subtitle" style={styles.flex}>{session.name}</ThemedText>
                <ThemedText variant="subtitle" style={{ color: colors.accent }}>{session.score}</ThemedText>
              </View>
              <ThemedText>{EXERCISE_LABELS[session.exercise_type] || session.exercise_type}</ThemedText>
              <ThemedText variant="caption" style={{ color: colors.textSecondary }}>
                {new Date(session.started_at).toLocaleString('id-ID')} · {formatDuration(session.duration_seconds)}
              </ThemedText>
              <ThemedText variant="caption">{session.correct_items} dari {session.total_items} benar langsung</ThemedText>
            </Card>
          </Pressable>
        ))}
      {hasMore ? <PrimaryButton title="Muat sesi sebelumnya" secondary onPress={() => load(offset + PAGE_SIZE, true)} disabled={status === 'loading'} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  session: { gap: 3 },
  sessionHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flex: 1 },
});
