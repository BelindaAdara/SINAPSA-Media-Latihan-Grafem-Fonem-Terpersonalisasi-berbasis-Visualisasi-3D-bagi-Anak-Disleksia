import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api';
import { useChild } from '../context/ChildContext';
import { useTheme } from '../theme/ThemeContext';
import { Avatar, Card, EmptyState, ErrorState, LoadingState, PrimaryButton, ProgressRing, Screen, SectionTitle, StarSparkle, ThemeToggle, ThemedText } from '../components/ui';
import { formatDuration } from '../utils/format';
import { dateInTimezone } from '../utils/date';

export function HomeScreen({ navigation }) {
  const { child } = useChild();
  const { colors, preference, setPreference } = useTheme();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!child?.id) return;
    setStatus('loading');
    setError(null);
    try {
      setData(await api.dashboard(child.id));
      setStatus('ready');
    } catch (requestError) {
      setError(requestError);
      setStatus('error');
    }
  }, [child]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (status === 'loading') return <Screen><LoadingState /></Screen>;
  if (status === 'error') return <Screen><ErrorState error={error} onRetry={load} /></Screen>;
  const trained = data.week.days.filter((day) => day.trained).length;
  const today = dateInTimezone(new Date(), child?.timezone || 'Asia/Jakarta');

  return (
    <Screen>
      <View style={styles.greeting}>
        <View style={styles.greetingText}>
          <ThemedText variant="title">Halo, {data.child.name}!</ThemedText>
          <ThemedText style={{ color: colors.textSecondary }}>Senang belajar bersamamu hari ini.</ThemedText>
        </View>
        <Avatar avatarKey={data.child.avatar_key} size={64} />
      </View>
      <View style={styles.row}>
        <ThemedText variant="subtitle" style={{ flex: 1 }}>Rumah belajar</ThemedText>
        <ThemeToggle preference={preference} onChange={setPreference} compact />
      </View>
      <Card>
        <SectionTitle>Latihan Minggu Ini</SectionTitle>
        <View style={styles.week}>
          {data.week.days.map((day) => (
            <View key={day.date} style={styles.day}>
              {day.trained ? <StarSparkle size={27} /> : <View style={[styles.emptyStar, { borderColor: colors.border }]} />}
              <ThemedText variant="caption" style={{ fontWeight: day.date === today ? '800' : '500', color: day.date === today ? colors.accent : colors.textSecondary }}>
                {day.label}
              </ThemedText>
              {day.date === today ? <View style={[styles.todayDot, { backgroundColor: colors.accent }]} /> : <View style={styles.todaySpace} />}
            </View>
          ))}
        </View>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <ThemedText variant="title">{data.week.sessions_count}</ThemedText>
            <ThemedText variant="caption">sesi minggu ini</ThemedText>
          </View>
          <View style={styles.stat}>
            <ThemedText variant="title">{formatDuration(data.week.duration_seconds)}</ThemedText>
            <ThemedText variant="caption">waktu belajar</ThemedText>
          </View>
        </View>
      </Card>
      <Card style={styles.targetCard}>
        <View style={styles.targetText}>
          <ThemedText variant="subtitle">Target mingguan</ThemedText>
          <ThemedText>{trained} dari {data.child.weekly_target} sesi</ThemedText>
          <ThemedText variant="caption" style={{ color: colors.textSecondary }}>Sedikit demi sedikit, kamu hebat!</ThemedText>
        </View>
        <View>
          <ProgressRing value={trained} total={data.child.weekly_target} />
          <ThemedText variant="caption" style={styles.ringLabel}>{trained}/{data.child.weekly_target}</ThemedText>
        </View>
      </Card>
      {data.last_session ? (
        <Card>
          <SectionTitle action="Lihat semua riwayat" onAction={() => navigation.navigate('History')}>Latihan Terakhir</SectionTitle>
          <Pressable onPress={() => navigation.navigate('SessionDetail', { sessionId: data.last_session.id })} accessibilityRole="button">
            <ThemedText variant="subtitle">{data.last_session.name}</ThemedText>
            <ThemedText>{data.last_session.exercise_type} · skor {data.last_session.score}</ThemedText>
            <ThemedText variant="caption" style={{ color: colors.textSecondary }}>
              {new Date(data.last_session.started_at).toLocaleDateString('id-ID')}
            </ThemedText>
          </Pressable>
        </Card>
      ) : (
        <EmptyState
          title="Belum ada sesi"
          message="Pilih latihan yang kamu suka, lalu kita mulai bersama."
          action={<PrimaryButton title="Pilih latihan" onPress={() => navigation.navigate('Latihan')} />}
        />
      )}
      <Card>
        <SectionTitle action="Lihat huruf" onAction={() => navigation.navigate('Huruf')}>Rekomendasi Hari Ini</SectionTitle>
        <View style={styles.recommendations}>
          {data.recommended_letters.map((entry) => (
            <Pressable
              key={entry.letter}
              style={[styles.recommend, { backgroundColor: colors.secondary }]}
              onPress={() => navigation.navigate('Huruf', { screen: 'LetterDetail', params: { symbol: entry.letter } })}
              accessibilityRole="button"
              accessibilityLabel={`Huruf ${entry.letter}, ${entry.reason}`}
            >
              <ThemedText variant="title">{entry.letter}</ThemedText>
              <ThemedText variant="caption" style={styles.center}>{entry.reason}</ThemedText>
            </Pressable>
          ))}
        </View>
        <PrimaryButton
          title="Latih sekarang"
          onPress={() => navigation.navigate('Latihan', { screen: 'ExerciseDetail', params: { exerciseType: 'listen_choose', targetLetters: data.recommended_letters.map((entry) => entry.letter) } })}
        />
      </Card>
      <PrimaryButton title="Lihat semua riwayat" secondary onPress={() => navigation.navigate('History')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  greeting: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  greetingText: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  week: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
  day: { alignItems: 'center', gap: 5, flex: 1 },
  emptyStar: { width: 27, height: 27, borderRadius: 14, borderWidth: 1.5 },
  todayDot: { width: 6, height: 6, borderRadius: 3 },
  todaySpace: { height: 6 },
  stats: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 18, gap: 12 },
  stat: { flex: 1, alignItems: 'center' },
  targetCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  targetText: { flex: 1 },
  ringLabel: { textAlign: 'center', marginTop: -55, marginBottom: 39, fontWeight: '700' },
  recommendations: { flexDirection: 'row', gap: 8, marginVertical: 12 },
  recommend: { flex: 1, minHeight: 90, borderRadius: 18, alignItems: 'center', justifyContent: 'center', padding: 6 },
  center: { textAlign: 'center' },
});
