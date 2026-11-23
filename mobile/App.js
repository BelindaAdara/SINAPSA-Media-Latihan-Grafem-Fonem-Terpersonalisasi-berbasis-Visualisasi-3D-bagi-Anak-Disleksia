import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { ChildProvider, useChild } from './src/context/ChildContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ThemedText } from './src/components/ui';

function AppContent() {
  const { theme, colors } = useTheme();
  const { status, error, retry } = useChild();

  if (status === 'loading') {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.accent} size="large" />
        <ThemedText style={styles.centerText}>Sebentar ya, kita siapkan belajar.</ThemedText>
      </View>
    );
  }
  if (status === 'error') {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <ThemedText variant="title">Koneksi belum tersambung.</ThemedText>
        <ThemedText style={styles.centerText}>{error?.message || 'Coba lagi ya.'}</ThemedText>
        <ThemedText accessibilityRole="button" onPress={retry} style={styles.retry}>Coba lagi</ThemedText>
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
  centerText: { marginTop: 16, textAlign: 'center' },
  retry: { marginTop: 20, fontWeight: '700' },
});
