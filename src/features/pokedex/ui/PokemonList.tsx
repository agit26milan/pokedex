import { useCallback, useMemo } from 'react';
import { FlatList, StyleSheet, Text, View, type ListRenderItemInfo } from 'react-native';

import type { DexEntry } from '@/shared/data/dex';
import { POKEDEX } from '@/shared/data/dex';
import { colors, spacing } from '@/theme/tokens';
import { filterPokemon } from '../logic/filterPokemon';
import { PokemonRow, ROW_GAP, ROW_HEIGHT } from './PokemonRow';

interface PokemonListProps {
  query: string;
  typeFilters: readonly string[];
  caughtIds: readonly number[];
  onSelect: (id: number) => void;
}

const keyExtractor = (item: DexEntry): string => String(item.id);

// Stride must match the row height plus the gap baked into the row style.
const getItemLayout = (_data: unknown, index: number) => ({
  length: ROW_HEIGHT,
  offset: (ROW_HEIGHT + ROW_GAP) * index,
  index,
});

export function PokemonList({ query, typeFilters, caughtIds, onSelect }: PokemonListProps) {
  // Real work on real data: filtering 151 entries is worth memoizing; a useMemo around
  // anything smaller than this would just be noise.
  const visible = useMemo(() => filterPokemon(POKEDEX, { query, types: typeFilters }), [query, typeFilters]);
  const caught = useMemo(() => new Set(caughtIds), [caughtIds]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<DexEntry>) => (
      <PokemonRow id={item.id} name={item.name} types={item.types} caught={caught.has(item.id)} onPress={onSelect} />
    ),
    [caught, onSelect],
  );

  return (
    <FlatList
      data={visible}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      getItemLayout={getItemLayout}
      initialNumToRender={12}
      maxToRenderPerBatch={12}
      windowSize={5}
      removeClippedSubviews
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      ListEmptyComponent={EmptyState}
      contentContainerStyle={styles.content}
    />
  );
}

function EmptyState() {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>No Pokémon match</Text>
      <Text style={styles.emptyHint}>Try another name, a dex number, or fewer type filters.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xl, paddingHorizontal: spacing.md },
  empty: { alignItems: 'center', paddingTop: spacing.xxl, gap: spacing.xs },
  emptyTitle: { color: colors.text, fontWeight: '700', fontSize: 14 },
  emptyHint: { color: colors.textDim, fontSize: 12, textAlign: 'center' },
});
