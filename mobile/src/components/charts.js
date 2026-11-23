import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line, Polyline, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../theme/ThemeContext';
import { Chip, ThemedText } from './ui';

const DAY_HEADERS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export function LineChart({ data }) {
  const { colors } = useTheme();
  const width = 330;
  const height = 190;
  const left = 28;
  const right = 12;
  const top = 14;
  const bottom = 34;
  const usableWidth = width - left - right;
  const usableHeight = height - top - bottom;
  const points = data.map((entry, index) => entry.accuracy == null ? null : {
    x: left + (data.length <= 1 ? 0 : (usableWidth * index) / (data.length - 1)),
    y: top + usableHeight * (1 - entry.accuracy),
    entry,
  });
  const segments = [];
  let segment = [];
  points.forEach((point) => {
    if (!point) {
      if (segment.length) segments.push(segment);
      segment = [];
    } else segment.push(point);
  });
  if (segment.length) segments.push(segment);
  return (
    <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
      {[0, 0.5, 1].map((ratio) => {
        const y = top + usableHeight * (1 - ratio);
        return (
          <G key={ratio}>
            <Line x1={left} y1={y} x2={width - right} y2={y} stroke={colors.border} strokeWidth="1" />
            <SvgText x="2" y={y + 5} fill={colors.textSecondary} fontSize="12">{`${Math.round(ratio * 100)}%`}</SvgText>
          </G>
        );
      })}
      {segments.map((pointsInSegment, index) => (
        <Polyline
          key={`segment-${index}`}
          points={pointsInSegment.map((point) => `${point.x},${point.y}`).join(' ')}
          fill="none"
          stroke={colors.accent}
          strokeWidth="4"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ))}
      {points.filter(Boolean).map((point) => (
        <Circle key={point.entry.week_start} cx={point.x} cy={point.y} r="5" fill={colors.accent} />
      ))}
      {data.map((entry, index) => (
        <SvgText key={entry.week_start} x={left + (data.length <= 1 ? 0 : (usableWidth * index) / (data.length - 1))} y={height - 8} fill={colors.textSecondary} fontSize="10" textAnchor="middle">
          {entry.week_start.slice(5)}
        </SvgText>
      ))}
    </Svg>
  );
}

export function CalendarGrid({ data, month, onChangeMonth }) {
  const { colors } = useTheme();
  const first = new Date(`${month}-01T00:00:00.000Z`);
  const firstDay = (first.getUTCDay() + 6) % 7;
  const count = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: count }, (_, index) => index + 1)];
  while (cells.length % 7) cells.push(null);
  const countByDate = new Map(data.map((entry) => [entry.date, entry.sessions]));
  const previous = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() - 1, 1));
  const next = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 1));
  const label = first.toLocaleDateString('id-ID', { month: 'long', year: 'numeric', timeZone: 'UTC' });

  return (
    <View style={styles.calendar}>
      <View style={styles.monthHeader}>
        <Pressable onPress={() => onChangeMonth(formatMonth(previous))} accessibilityLabel="Bulan sebelumnya"><ThemedText variant="subtitle">‹</ThemedText></Pressable>
        <ThemedText variant="subtitle">{label}</ThemedText>
        <Pressable onPress={() => onChangeMonth(formatMonth(next))} accessibilityLabel="Bulan berikutnya"><ThemedText variant="subtitle">›</ThemedText></Pressable>
      </View>
      <View style={styles.calendarGrid}>
        {DAY_HEADERS.map((day) => <ThemedText key={day} variant="caption" style={[styles.calendarCell, { color: colors.textSecondary }]}>{day}</ThemedText>)}
        {cells.map((day, index) => {
          if (!day) return <View key={`empty-${index}`} style={styles.calendarCell} />;
          const date = `${month}-${String(day).padStart(2, '0')}`;
          const sessions = countByDate.get(date) || 0;
          return (
            <View key={date} style={[styles.calendarCell, styles.dateCell, { backgroundColor: sessions ? colors.success : colors.surface, borderColor: colors.border }]}>
              <ThemedText variant="caption" style={styles.dateText}>{day}</ThemedText>
              {sessions ? <ThemedText variant="caption" style={styles.dateCount}>{sessions}</ThemedText> : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

function formatMonth(value) {
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function Heatmap({ data }) {
  const { colors } = useTheme();
  const columns = Array.from({ length: 12 }, (_, index) => data.slice(index * 7, index * 7 + 7));
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View>
        <View style={styles.heatmap}>
          {columns.map((column, index) => (
            <View key={index} style={styles.heatColumn}>
              {column.map((entry) => (
                <View
                  key={entry.date}
                  accessibilityLabel={`${entry.date}: ${entry.sessions} sesi`}
                  style={[
                    styles.heatCell,
                    { backgroundColor: entry.sessions > 0 ? colors.success : colors.surface, borderColor: colors.border },
                  ]}
                />
              ))}
            </View>
          ))}
        </View>
        <ThemedText variant="caption" style={{ color: colors.textSecondary, marginTop: 8 }}>Setiap kotak menunjukkan satu hari latihan.</ThemedText>
      </View>
    </ScrollView>
  );
}

export function MasteryGrid({ data, onSelect }) {
  const { colors } = useTheme();
  return (
    <View style={styles.masteryGrid}>
      {data.map((entry) => {
        const color = entry.status === 'mastered'
          ? colors.success
          : entry.status === 'needs_practice'
            ? colors.retry
            : entry.status === 'learning' ? colors.accent : colors.border;
        return (
          <Pressable
            key={entry.letter}
            accessibilityRole="button"
            accessibilityLabel={`Huruf ${entry.letter}, ${entry.status}, skor ${entry.score}`}
            onPress={() => onSelect(entry.letter)}
            style={[
              styles.masteryCell,
              {
                borderColor: color,
                borderWidth: entry.status === 'needs_practice' ? 3 : entry.status === 'mastered' ? 2 : 1,
                borderStyle: entry.status === 'unseen' ? 'dashed' : 'solid',
              },
            ]}
          >
            <ThemedText variant="caption" style={{ fontWeight: '700' }}>{entry.letter}</ThemedText>
            <ThemedText variant="caption">{entry.status === 'unseen' ? '·' : entry.status === 'needs_practice' ? '↻' : entry.status === 'learning' ? '◐' : '★'}</ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

export function SessionFrequencyToggle({ value, onChange }) {
  return (
    <View style={styles.frequency}>
      <Chip title="Kalender" selected={value === 'calendar'} onPress={() => onChange('calendar')} />
      <Chip title="12 minggu" selected={value === 'heatmap'} onPress={() => onChange('heatmap')} />
    </View>
  );
}

const styles = StyleSheet.create({
  calendar: { gap: 12 },
  monthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarCell: { width: '14.285%', height: 42, alignItems: 'center', justifyContent: 'center' },
  dateCell: { borderWidth: 1, borderRadius: 9, marginBottom: 3 },
  dateText: { lineHeight: 18 },
  dateCount: { fontWeight: '800', lineHeight: 16 },
  heatmap: { flexDirection: 'row', gap: 4 },
  heatColumn: { gap: 4 },
  heatCell: { width: 17, height: 17, borderWidth: 1, borderRadius: 4 },
  masteryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  masteryCell: { width: '11%', minWidth: 38, height: 54, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  frequency: { flexDirection: 'row', gap: 8 },
});
