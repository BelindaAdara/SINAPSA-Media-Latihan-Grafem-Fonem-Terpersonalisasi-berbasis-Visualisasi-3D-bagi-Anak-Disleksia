import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, useColorScheme } from 'react-native';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { themes } from './tokens';

const STORAGE_KEY = 'sinapsa.theme';
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [preference, setPreference] = useState('system');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === 'light' || saved === 'system' || saved === 'dark') setPreference(saved);
      })
      .catch(() => setPreference('system'))
      .finally(() => setReady(true));
  }, []);

  const updatePreference = useCallback(async (next) => {
    if (!['light', 'system', 'dark'].includes(next)) throw new Error('Pilihan tema tidak dikenal.');
    await AsyncStorage.setItem(STORAGE_KEY, next);
    setPreference(next);
  }, []);

  const theme = preference === 'system' ? (systemScheme || Appearance.getColorScheme() || 'light') : preference;
  const value = useMemo(() => ({
    preference,
    theme,
    colors: themes[theme],
    ready,
    setPreference: updatePreference,
  }), [preference, theme, ready, updatePreference]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme harus dipakai di dalam ThemeProvider.');
  return context;
}
