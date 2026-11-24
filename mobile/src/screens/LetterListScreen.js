import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api';
import { useChild } from '../context/ChildContext';
import { useTheme } from '../theme/ThemeContext';
import { CategoryCard, Chip, EmptyState, ErrorState, LoadingState, Screen, ThemedText } from '../components/ui';
import { masteryStatus } from '../utils/mastery';
import { letterCategory } from '../theme/tokens';

const filters = [
  { key: 'all', label: 'Semua' },
  { key: 'vowel', label: 'Vokal' },
  { key: 'consonant', label: 'Konsonan' },
  { key: 'lookalike', label: 'Mirip' },
];
const masteryFilters = [
  { key: 'all', label: 'Semua status' },
  { key: 'unseen', label: 'Belum' },
  { key: 'needs_practice', label: 'Perlu diulang' },
  { key: 'learning', label: 'Sedang' },
  { key: 'mastered', label: 'Dikuasai' },
];

export function LetterListScreen({ navigation }) {
  const { child } = useChild();
  const { colors } = useTheme();
  const [letters, setLetters] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [masteryFilter, setMasteryFilter] = useState('all');

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      setLetters(await api.letters({ child_id: child?.id }));
      setStatus('ready');
    } catch (requestError) {
      setError(requestError);
      setStatus('error');
    }
  }, [child]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const visible = useMemo(() => letters.filter((letter) => {
    const term = query.trim().toLocaleLowerCase();
    const matchesText = !term || [letter.symbol, letter.phoneme_ipa, letter.phoneme_hint, letter.tts_syllable]
      .some((value) => value?.toLocaleLowerCase().includes(term));
    const matchesCategory = category === 'all'
      || (category === 'lookalike' ? letter.is_lookalike : letter.category === category);
    const matchesMastery = masteryFilter === 'all' || masteryStatus(letter.mastery) === masteryFilter;
    return matchesText && matchesCategory && matchesMastery;
  }), [letters, query, category, masteryFilter]);

  if (status === 'loading') return <Screen><LoadingState message="Menyiapkan pustaka huruf..." /></Screen>;
  if (status === 'error') return <Screen><ErrorState error={error} onRetry={load} /></Screen>;

  return (
    <Screen scroll={false} style={styles.container} contentStyle={styles.content}>
      <ThemedText variant="title">Pustaka Huruf</ThemedText>
      <TextInput
        accessibilityLabel="Cari huruf atau bunyi"
        value={query}
        onChangeText={setQuery}
        placeholder="Cari huruf atau bunyi"
        placeholderTextColor={colors.textSecondary}
        style={[styles.search, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
      />
      <View style={styles.filterBlock}>
        <View style={styles.filterRow}>
          {filters.map((item) => (
            <Chip
              key={item.key}
              title={item.label}
              compact
              selected={category === item.key}
              onPress={() => setCategory(item.key)}
              style={styles.filterChip}
            />
          ))}
        </View>
        <View style={styles.filterRow}>
          {masteryFilters.map((item) => (
            <Chip
              key={item.key}
              title={item.label}
              compact
              selected={masteryFilter === item.key}
              onPress={() => setMasteryFilter(item.key)}
              style={styles.filterChip}
            />
          ))}
        </View>
      </View>
      <FlatList
        data={visible}
        style={styles.letterList}
        numColumns={3}
        keyExtractor={(item) => item.symbol}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.gridRow}
        ListEmptyComponent={<EmptyState title="Huruf belum ditemukan" message="Coba kata pencarian yang lain ya." />}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Huruf ${item.symbol}, ${item.phoneme_ipa}${item.is_lookalike ? ', huruf mirip' : ''}`}
            onPress={() => navigation.navigate('LetterDetail', { symbol: item.symbol })}
            style={({ pressed }) => [styles.tile, { opacity: pressed ? 0.88 : 1 }]}
          >
            <CategoryCard isVowel={item.category === 'vowel'} lookalike={item.is_lookalike} style={styles.letterCard}>
              <View style={styles.letterRow}>
                <ThemedText variant="title" style={{ color: letterCategory.onCategory, fontSize: 42, lineHeight: 50 }}>{item.symbol}</ThemedText>
                {item.is_lookalike ? <ThemedText variant="caption" style={{ color: letterCategory.onCategory }}>⇄</ThemedText> : null}
              </View>
              <ThemedText variant="caption" style={[styles.center, { color: letterCategory.onCategory }]}>{item.phoneme_ipa}</ThemedText>
              <ThemedText variant="caption" style={[styles.center, { color: letterCategory.onCategory, fontWeight: '700' }]}>Lihat detail</ThemedText>
            </CategoryCard>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingBottom: 8, gap: 8 },
  search: { borderWidth: 1, borderRadius: 16, minHeight: 46, paddingHorizontal: 14, fontSize: 16 },
  filterBlock: { gap: 6 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  filterChip: { flexGrow: 0 },
  grid: { gap: 10, paddingBottom: 32 },
  letterList: { flex: 1 },
  gridRow: { gap: 10 },
  tile: { flex: 1 },
  letterCard: { minHeight: 128, padding: 10, alignItems: 'center', justifyContent: 'center', gap: 2, borderWidth: 2 },
  letterRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 3 },
  center: { textAlign: 'center' },
});
