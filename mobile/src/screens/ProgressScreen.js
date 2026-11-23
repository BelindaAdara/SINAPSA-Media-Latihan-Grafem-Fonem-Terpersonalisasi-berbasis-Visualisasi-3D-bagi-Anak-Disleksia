import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api';
import { useChild } from '../context/ChildContext';
import { useTheme } from '../theme/ThemeContext';
import { Card, EmptyState, ErrorState, LoadingState, PrimaryButton, Screen, SectionTitle, ThemedText } from '../components/ui';
import { CalendarGrid, Heatmap, LineChart, MasteryGrid, SessionFrequencyToggle } from '../components/charts';
import { formatDuration } from '../utils/format';
import { dateInTimezone } from '../utils/date';

function currentMonth(timezone) {
  return dateInTimezone(new Date(), timezone).slice(0, 7);
}

export function ProgressScreen({ navigation }) {
  const { child } = useChild();
  const { colors } = useTheme();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [month, setMonth] = useState(() => currentMonth(child?.timezone || 'Asia/Jakarta'));
  const [frequency, setFrequency] = useState('calendar');
  const load = useCallback(async () => {
    if (!child?.id) return;
    setStatus('loading');
    setError(null);
    try {
      setData(await api.progress(child.id, month));
      setStatus('ready');
    } catch (requestError) {
      setError(requestError);
      setStatus('error');
    }
  }, [child, month]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (status === 'loading') return <Screen><LoadingState message="Merangkum perjalanan belajarmu..." /></Screen>;
  if (status === 'error') return <Screen><ErrorState error={error} onRetry={load} /></Screen>;
  const hasSessions = data.totals.sessions > 0;

  return (
    <Screen>
      <ThemedText variant="title">Progres Belajar</ThemedText>
      <View style={styles.stats}>
        <StatCard label="Sesi" value={data.totals.sessions} colors={colors} />
        <StatCard label="Benar langsung" value={data.totals.correct_items} colors={colors} />
        <StatCard label="Waktu belajar" value={formatDuration(data.totals.study_seconds)} colors={colors} />
      </View>
      <Card>
        <SectionTitle>Akurasi Mingguan</SectionTitle>
        {hasSessions ? <LineChart data={data.weekly_accuracy} /> : <EmptyState title="Grafik akan muncul di sini" message="Ayo mulai sesi latihan pertamamu." />}
      </Card>
      <Card>
        <SectionTitle>Frekuensi Latihan</SectionTitle>
        <SessionFrequencyToggle value={frequency} onChange={setFrequency} />
        {frequency === 'calendar'
          ? <CalendarGrid data={data.calendar} month={month} onChangeMonth={setMonth} />
          : <Heatmap data={data.heatmap} />}
      </Card>
      <Card>
        <SectionTitle>Rekor Pribadi</SectionTitle>
        <ThemedText>🔥 Streak terpanjang: {data.records.longest_streak} hari</ThemedText>
        <ThemedText>⭐ Skor tertinggi: {data.records.best_score}</ThemedText>
        <ThemedText>⚡ Waktu respons tercepat: {data.records.fastest_avg_response_ms == null ? 'Belum ada' : `${Math.round(data.records.fastest_avg_response_ms)} ms`}</ThemedText>
      </Card>
      <Card>
        <SectionTitle>Peta Penguasaan Huruf</SectionTitle>
        <MasteryGrid data={data.mastery_map} onSelect={(symbol) => navigation.navigate('Huruf', { screen: 'LetterDetail', params: { symbol } })} />
      </Card>
      <Card>
        <SectionTitle>Pasangan yang sering tertukar</SectionTitle>
        {data.top_confusions.length ? data.top_confusions.map((item) => (
          <ThemedText key={`${item.target}-${item.chosen}`}>{item.target} → {item.chosen} ({item.count} kali)</ThemedText>
        )) : <ThemedText variant="caption" style={{ color: colors.textSecondary }}>Pasangan huruf akan muncul setelah beberapa latihan.</ThemedText>}
      </Card>
      <PrimaryButton title="Lihat riwayat" secondary onPress={() => navigation.navigate('History')} />
    </Screen>
  );
}

function StatCard({ label, value, colors }) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <ThemedText variant="subtitle">{value}</ThemedText>
      <ThemedText variant="caption" style={styles.center}>{label}</ThemedText>
    </View>
  );
}

const styles = {
  stats: { flexDirection: 'row', gap: 8 },
  statCard: { flex: 1, minHeight: 88, borderRadius: 16, borderWidth: 1, padding: 10, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
};
