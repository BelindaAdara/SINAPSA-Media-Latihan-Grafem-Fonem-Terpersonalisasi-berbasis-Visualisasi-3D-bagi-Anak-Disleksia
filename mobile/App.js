import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { ChildProvider, useChild } from './src/context/ChildContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { StarSparkle, ThemedText } from './src/components/ui';

function SplashScreen() {
  const { colors } = useTheme();
  const letters = ['S', 'I', 'N', 'A', 'P', 'S', 'A'];
  return (
    <View style={[styles.center, { backgroundColor: colors.bg }]}>
      <View style={styles.sparkleRow}>
        <StarSparkle size={30} />
        <StarSparkle size={24} style={{ marginTop: 18 }} />
        <StarSparkle size={34} />
        <StarSparkle size={22} style={{ marginTop: 14 }} />
      </View>
      <View style={styles.letterRow}>
        {letters.map((letter, index) => (
          <View
            key={`${letter}-${index}`}
            style={[
              styles.letterBubble,
              {
                backgroundColor: index % 2 === 0 ? colors.secondary : colors.surface,
                borderColor: colors.accent,
                transform: [{ rotate: index % 2 === 0 ? '-4deg' : '4deg' }],
              },
            ]}
          >
            <Text style={[styles.splashLetter, { color: colors.accent }]}>{letter}</Text>
          </View>
        ))}
      </View>
      <ThemedText variant="title" style={[styles.centerText, { marginTop: 10 }]}>Belajar huruf jadi seru!</ThemedText>
      <ThemedText style={[styles.centerText, { color: colors.textSecondary }]}>Sebentar ya, kita siapkan petualanganmu.</ThemedText>
      <ActivityIndicator color={colors.accent} size="large" style={{ marginTop: 22 }} />
      <View style={styles.sparkleRowBottom}>
        <Text style={styles.funEmoji}>🌈</Text>
        <Text style={styles.funEmoji}>🔤</Text>
        <Text style={styles.funEmoji}>✨</Text>
        <Text style={styles.funEmoji}>🎈</Text>
      </View>
    </View>
  );
}

function AppContent() {
  const { theme, colors } = useTheme();
  const { status, error, retry } = useChild();

  if (status === 'loading') return <SplashScreen />;
  if (status === 'error') {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <ThemedText style={{ fontSize: 52 }}>☁️</ThemedText>
        <ThemedText variant="title" style={styles.centerText}>Koneksi belum tersambung.</ThemedText>
        <ThemedText style={styles.centerText}>{error?.message || 'Coba lagi ya.'}</ThemedText>
        <ThemedText accessibilityRole="button" onPress={retry} style={[styles.retry, { color: colors.accent }]}>Coba lagi</ThemedText>
      </View>
    );
  }

  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <RootNavigator />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider>
        <ChildProvider>
          <AppContent />
        </ChildProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  centerText: { marginTop: 12, textAlign: 'center' },
  retry: { marginTop: 20, fontWeight: '700', fontSize: 18 },
  sparkleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 14, marginBottom: 16 },
  sparkleRowBottom: { flexDirection: 'row', gap: 14, marginTop: 24 },
  letterRow: { flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8, width: '100%' },
  letterBubble: { width: 38, height: 46, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center', flexShrink: 1 },
  splashLetter: { fontSize: 24, fontWeight: '800' },
  funEmoji: { fontSize: 30 },
});
