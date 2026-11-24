import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Polygon } from 'react-native-svg';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';
import { useTheme } from '../theme/ThemeContext';
import { useChildPreferences } from '../hooks/useChildPreferences';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { letterCategory } from '../theme/tokens';

export function ThemedText({ children, variant = 'body', style, ...props }) {
  const { colors } = useTheme();
  const { fontScale, letterSpacing } = useChildPreferences();
  const sizes = { title: 28, subtitle: 22, body: 18, caption: 15 };
  const fontSize = (sizes[variant] || sizes.body) * fontScale;
  return (
    <Text
      {...props}
      style={[
        { color: colors.text, fontSize, lineHeight: Math.round(fontSize * 1.5), letterSpacing: fontSize * letterSpacing },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function Screen({ children, scroll = true, contentStyle, style, ...props }) {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }, style]} edges={['top', 'left', 'right']}>
      {scroll ? (
        <ScrollView
          {...props}
          contentContainerStyle={[styles.screenContent, contentStyle]}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : <View style={[styles.screenContent, contentStyle]}>{children}</View>}
    </SafeAreaView>
  );
}

export function Card({ children, style, ...props }) {
  const { colors } = useTheme();
  return (
    <View {...props} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.text }, style]}>
      {children}
    </View>
  );
}

export function PrimaryButton({ title, onPress, disabled = false, secondary = false, style, accessibilityLabel }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: secondary ? colors.surface : colors.accent,
          borderColor: secondary ? colors.accent : colors.accent,
          opacity: disabled ? 0.55 : pressed ? 0.86 : 1,
        },
        style,
      ]}
    >
      <Text style={{ color: secondary ? colors.accent : colors.onAccent, fontSize: 18, fontWeight: '700', textAlign: 'center' }}>
        {title}
      </Text>
    </Pressable>
  );
}

export function BackButton({ navigation, title = 'Kembali' }) {
  const { colors } = useTheme();
  if (!navigation?.canGoBack()) return null;
  return (
    <Pressable onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel={title} style={styles.backButton}>
      <ThemedText style={{ color: colors.accent, fontWeight: '700' }}>‹ {title}</ThemedText>
    </Pressable>
  );
}

export function Chip({ title, selected, onPress, disabled = false, style, accessibilityLabel }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(selected), disabled }}
      accessibilityLabel={accessibilityLabel || title}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? colors.secondary : colors.surface,
          borderColor: selected ? colors.accent : colors.border,
          borderWidth: selected ? 2 : 1,
          opacity: disabled ? 0.65 : pressed ? 0.86 : 1,
        },
        style,
      ]}
    >
      <ThemedText variant="caption" style={{ fontWeight: selected ? '700' : '600' }}>{title}</ThemedText>
    </Pressable>
  );
}

export function EmptyState({ title = 'Belum ada data', message = 'Ayo mulai berlatih bersama.', action, icon = '🌱' }) {
  const { colors } = useTheme();
  return (
    <Card style={styles.stateCard}>
      <ThemedText style={styles.stateIcon}>{icon}</ThemedText>
      <ThemedText variant="subtitle" style={styles.center}>{title}</ThemedText>
      <ThemedText style={[styles.center, { color: colors.textSecondary }]}>{message}</ThemedText>
      {action}
    </Card>
  );
}

export function ErrorState({ error, onRetry }) {
  const { colors } = useTheme();
  return (
    <Card style={styles.stateCard}>
      <ThemedText style={styles.stateIcon}>☁️</ThemedText>
      <ThemedText variant="subtitle" style={styles.center}>Koneksi belum tersambung.</ThemedText>
      <ThemedText style={[styles.center, { color: colors.textSecondary }]}>{error?.message || 'Coba lagi ya.'}</ThemedText>
      {onRetry ? <PrimaryButton title="Coba lagi" onPress={onRetry} style={styles.stateButton} /> : null}
    </Card>
  );
}

export function Skeleton({ height = 88, style }) {
  const { colors } = useTheme();
  return <View style={[styles.skeleton, { height, backgroundColor: colors.secondary }, style]} accessibilityLabel="Memuat data" />;
}

export function LoadingState({ message = 'Sedang menyiapkan...' }) {
  const { colors } = useTheme();
  return <ThemedText style={[styles.center, { color: colors.textSecondary, marginVertical: 28 }]}>{message}</ThemedText>;
}

export function Avatar({ avatarKey = 'bintang', size = 56 }) {
  const { colors } = useTheme();
  const accent = colors.accent;
  const secondary = colors.secondary;
  let shape;
  if (avatarKey === 'awan') shape = <><Circle cx="31" cy="40" r="13" fill={secondary} /><Circle cx="48" cy="32" r="17" fill={secondary} /><Circle cx="66" cy="41" r="13" fill={secondary} /><Path d="M22 40h48v13H22z" fill={secondary} /></>;
  else if (avatarKey === 'bulan') shape = <Path d="M58 14a29 29 0 1 0 27 47A31 31 0 0 1 58 14Z" fill={colors.star} />;
  else if (avatarKey === 'daun') shape = <><Path d="M18 64C20 24 48 14 82 18 80 54 60 79 25 74Z" fill={colors.success} /><Path d="M25 72 69 30" stroke={colors.text} strokeWidth="4" /></>;
  else if (avatarKey === 'roket') shape = <><Path d="M50 12c18 10 24 31 11 51L50 76 39 63C26 43 32 22 50 12Z" fill={accent} /><Circle cx="50" cy="38" r="7" fill={colors.surface} /><Path d="m39 56-13 9 10 1m25-10 13 9-10 1" stroke={colors.text} strokeWidth="4" strokeLinecap="round" /><Path d="m43 70 7 12 7-12" fill={colors.star} /></>;
  else if (avatarKey === 'kucing') shape = <><Circle cx="50" cy="48" r="28" fill={secondary} /><Path d="m27 30-7-17 20 9m13 0 20-9-7 19" fill={secondary} /><Circle cx="41" cy="47" r="3" fill={colors.text} /><Circle cx="59" cy="47" r="3" fill={colors.text} /><Path d="M46 57q4 4 8 0m-34-4h18m26 0h18" stroke={colors.text} strokeWidth="3" strokeLinecap="round" /></>;
  else shape = <Polygon points="50,10 61,36 89,39 68,58 74,86 50,72 26,86 32,58 11,39 39,36" fill={colors.star} />;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityLabel={`Avatar ${avatarKey}`}>
      {shape}
      {avatarKey !== 'roket' && avatarKey !== 'daun' && avatarKey !== 'bulan' ? (
        <><Circle cx="43" cy="48" r="2.5" fill={colors.text} /><Circle cx="57" cy="48" r="2.5" fill={colors.text} /><Path d="M45 58q5 5 10 0" stroke={colors.text} strokeWidth="3" fill="none" strokeLinecap="round" /></>
      ) : null}
    </Svg>
  );
}

export function Letter2D({ strokes, width = 112, height = 132, color, mirrored = false, style }) {
  const { colors } = useTheme();
  const list = Array.isArray(strokes) ? strokes : strokes?.strokes || [];
  return (
    <Svg width={width} height={height} viewBox="0 0 100 140" style={style} accessibilityLabel="Gambar garis huruf">
      {list.map((stroke, index) => {
        const toPoint = ([x, y]) => `${10 + x * 80},${100 - y * 65}`;
        if (stroke.type === 'dot') {
          const [x, y] = stroke.points[0];
          return <Circle key={`${stroke.order}-${index}`} cx={10 + x * 80} cy={100 - y * 65} r="5.5" fill={color || colors.accent} />;
        }
        const points = stroke.points.map(toPoint).join(' ');
        return (
          <Polygon
            key={`${stroke.order}-${index}`}
            points={stroke.closed ? points : `${points} ${toPoint(stroke.points[0])}`}
            fill="none"
            stroke={color || colors.accent}
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            transform={mirrored ? 'translate(100 0) scale(-1 1)' : undefined}
          />
        );
      })}
    </Svg>
  );
}

export function ProgressRing({ value = 0, total = 5, size = 112 }) {
  const { colors } = useTheme();
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const ratio = total ? Math.min(value / total, 1) : 0;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Circle cx="50" cy="50" r={radius} stroke={colors.secondary} strokeWidth="9" fill="none" />
      <Circle
        cx="50" cy="50" r={radius} stroke={colors.accent} strokeWidth="9" fill="none"
        strokeDasharray={`${circumference * ratio} ${circumference}`}
        strokeLinecap="round" rotation="-90" origin="50,50"
      />
    </Svg>
  );
}

export function ProgressRingLabel({ value, total }) {
  return <ThemedText style={styles.ringLabel}>{value} dari {total} sesi</ThemedText>;
}

export function StarSparkle({ active = true, size = 28, style }) {
  const { colors } = useTheme();
  const reduceMotion = useReduceMotion();
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = reduceMotion || !active ? 1 : withRepeat(withTiming(1.1, { duration: 800 }), -1, true);
  }, [active, pulse, reduceMotion]);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  return (
    <Animated.View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, animatedStyle, style]}>
      <Svg width={size} height={size} viewBox="0 0 32 32">
        <Polygon points="16,1 19.8,11.8 31,12.4 22.3,19.5 25.2,30 16,24 6.8,30 9.7,19.5 1,12.4 12.2,11.8" fill={active ? colors.star : colors.border} />
        {active ? <Circle cx="16" cy="16" r="3" fill={colors.surface} opacity="0.8" /> : null}
      </Svg>
    </Animated.View>
  );
}

export function ThemeToggle({ preference, onChange, compact = false }) {
  const options = compact
    ? [{ key: preference === 'dark' ? 'light' : 'dark', label: preference === 'dark' ? '☀️' : '🌙' }]
    : [
      { key: 'light', label: '☀️ Terang' },
      { key: 'system', label: '🖥 Sistem' },
      { key: 'dark', label: '🌙 Gelap' },
    ];
  return (
    <View style={styles.toggleRow}>
      {options.map((option) => (
        <Chip
          key={option.key}
          title={option.label}
          selected={preference === option.key}
          onPress={() => onChange(option.key)}
          accessibilityLabel={compact ? 'Ganti tema' : `Tema ${option.label}`}
          style={compact ? styles.compactToggle : styles.toggleOption}
        />
      ))}
    </View>
  );
}

export function SectionTitle({ children, action, onAction }) {
  const { colors } = useTheme();
  return (
    <View style={styles.sectionTitle}>
      <ThemedText variant="subtitle" style={{ flex: 1 }}>{children}</ThemedText>
      {action ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          style={({ pressed }) => [styles.inlineAction, { borderColor: colors.border, backgroundColor: colors.surface, opacity: pressed ? 0.85 : 1 }]}
        >
          <ThemedText style={{ color: colors.accent, fontWeight: '700' }}>{action}</ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

export function ConfirmDialog({ title, message, confirmTitle, onConfirm }) {
  Alert.alert(title, message, [
    { text: 'Nanti dulu', style: 'cancel' },
    { text: confirmTitle, onPress: onConfirm },
  ]);
}

export function CategoryCard({ children, isVowel, lookalike, style, ...props }) {
  const backgroundColor = lookalike ? letterCategory.lookalike : isVowel ? letterCategory.vowel : letterCategory.consonant;
  return <Card {...props} style={[{ backgroundColor, borderColor: backgroundColor }, style]}>{children}</Card>;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  screenContent: { padding: 20, gap: 16, paddingBottom: 36 },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    shadowOpacity: 0.08,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  button: { minHeight: 56, borderRadius: 20, borderWidth: 2, paddingHorizontal: 20, paddingVertical: 15, justifyContent: 'center', alignItems: 'center' },
  chip: { minHeight: 44, paddingHorizontal: 14, paddingVertical: 8, justifyContent: 'center', alignItems: 'center', borderRadius: 24, borderWidth: 1 },
  stateCard: { alignItems: 'center', gap: 12, marginTop: 16 },
  stateIcon: { fontSize: 42, lineHeight: 52 },
  center: { textAlign: 'center' },
  backButton: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, borderWidth: 1 },
  inlineAction: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, borderWidth: 1 },
  stateButton: { width: '100%', marginTop: 4 },
  skeleton: { borderRadius: 20, opacity: 0.45 },
  toggleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  toggleOption: { flex: 1, minWidth: 94 },
  compactToggle: { minWidth: 52, paddingHorizontal: 10 },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  ringLabel: { fontSize: 15, fontWeight: '700', textAlign: 'center', marginTop: -54, marginBottom: 38 },
});
