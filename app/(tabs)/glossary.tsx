import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PokemonList } from '@/features/pokedex/ui/PokemonList';
import { SearchBar } from '@/features/pokedex/ui/SearchBar';
import { TypeFilter } from '@/features/pokedex/ui/TypeFilter';
import { ALL_TYPES, DEX_SIZE } from '@/shared/data/dex';
import { caughtIdsFrom, useStore } from '@/store';
import { colors, font, spacing } from '@/theme/tokens';

export default function GlossaryScreen() {
  const router = useRouter();

  const query = useStore((state) => state.query);
  const typeFilters = useStore((state) => state.typeFilters);
  const setQuery = useStore((state) => state.setQuery);
  const toggleType = useStore((state) => state.toggleType);
  const clearFilters = useStore((state) => state.clearFilters);
  const party = useStore((state) => state.party);
  const storage = useStore((state) => state.storage);

  const caughtIds = useMemo(() => caughtIdsFrom(party, storage), [party, storage]);
  const filtersActive = query.length > 0 || typeFilters.length > 0;

  const openDetail = useCallback(
    (id: number) => router.push({ pathname: '/pokemon/[id]', params: { id: String(id) } }),
    [router],
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>GLOSSARY</Text>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{DEX_SIZE} Pokémon</Text>
          <Text style={styles.caught}>{caughtIds.length} CAUGHT</Text>
        </View>
        <SearchBar value={query} onChangeText={setQuery} />
      </View>

      <TypeFilter types={ALL_TYPES} active={typeFilters} onToggle={toggleType} />

      <View style={styles.filterRow}>
        {filtersActive ? (
          <Pressable onPress={clearFilters} accessibilityRole="button" style={styles.clear}>
            <Text style={styles.clearLabel}>CLEAR FILTERS</Text>
          </Pressable>
        ) : (
          <Text style={styles.hint}>SEARCH NAME OR DEX NUMBER · TAP A TYPE TO FILTER</Text>
        )}
      </View>

      <PokemonList query={query} typeFilters={typeFilters} caughtIds={caughtIds} onSelect={openDetail} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.sm },
  eyebrow: { color: colors.accent, fontFamily: font.mono, fontSize: 10, letterSpacing: 2.4 },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  title: { color: colors.text, fontSize: 24, fontWeight: '800' },
  caught: { color: colors.textDim, fontFamily: font.mono, fontSize: 10, letterSpacing: 1.4 },
  filterRow: { minHeight: 34, justifyContent: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  hint: { color: colors.textFaint, fontFamily: font.mono, fontSize: 9, letterSpacing: 1.2 },
  clear: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: `${colors.accent}55`,
    backgroundColor: `${colors.accent}14`,
  },
  clearLabel: { color: colors.accent, fontFamily: font.mono, fontSize: 9, letterSpacing: 1.2, fontWeight: '700' },
});
