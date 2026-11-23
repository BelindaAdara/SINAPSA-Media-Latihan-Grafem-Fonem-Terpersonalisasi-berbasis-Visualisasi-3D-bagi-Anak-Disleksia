import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api';
import { EXERCISE_LABELS } from '../config';
import { useTheme } from '../theme/ThemeContext';
import { Card, EmptyState, ErrorState, LoadingState, Screen, ThemedText } from '../components/ui';

const icons = {
  suara: '🔊',
  cermin: '⇄',
  pasangan: '🧩',
  telusuri: '✍️',
  susun: '🧱',
};

export function ExerciseListScreen({ navigation }) {
  const { colors } = useTheme();
  const [types, setTypes] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      setTypes(await api.exerciseTypes());
      setStatus('ready');
    } catch (requestError) {
      setError(requestError);
      setStatus('error');
    }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (status === 'loading') return <Screen><LoadingState message="Menyiapkan pilihan latihan..." /></Screen>;
  if (status === 'error') return <Screen><ErrorState error={error} onRetry={load} /></Screen>;

  return (
    <Screen>
      <ThemedText variant="title">Pilih Latihan</ThemedText>
      <ThemedText>Latihan singkat untuk mengenal bunyi dan bentuk huruf.</ThemedText>
      {types.length === 0 ? <EmptyState title="Latihan belum tersedia" /> : null}
      {types.map((type) => (
        <Pressable
          key={type.id}
          accessibilityRole="button"
          accessibilityState={{ disabled: !type.is_active }}
          disabled={!type.is_active}
          onPress={() => navigation.navigate('ExerciseDetail', { exerciseType: type.id })}
        >
          <Card style={[styles.exercise, { borderColor: type.is_active ? colors.border : colors.secondary, opacity: type.is_active ? 1 : 0.72 }]}>
            <View style={[styles.icon, { backgroundColor: colors.secondary }]}>
              <ThemedText style={styles.iconText}>{icons[type.icon_key] || '🌟'}</ThemedText>
            </View>
            <View style={styles.details}>
              <ThemedText variant="subtitle">{EXERCISE_LABELS[type.id] || type.name}</ThemedText>
              <ThemedText variant="caption" style={{ color: colors.textSecondary }}>{type.description}</ThemedText>
              {!type.is_active ? <ThemedText variant="caption" style={{ color: colors.textSecondary, fontWeight: '700' }}>Segera hadir</ThemedText> : null}
            </View>
            <ThemedText variant="subtitle" style={{ color: colors.accent }}>›</ThemedText>
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  exercise: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 112 },
  icon: { width: 58, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 28, lineHeight: 36 },
  details: { flex: 1, gap: 2 },
});
