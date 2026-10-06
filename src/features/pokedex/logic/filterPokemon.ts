import type { DexEntry } from '@/shared/data/dex';

export interface DexFilter {
  query: string;
  types: readonly string[];
}

const normalise = (value: string): string => value.trim().toLowerCase();

/**
 * Search matches the name or the dex number ("pika", "25", "#025").
 * Type filters combine as OR between selected types and AND with the search,
 * so the result is the intersection of both conditions.
 */
export function filterPokemon(entries: readonly DexEntry[], { query, types }: DexFilter): DexEntry[] {
  const needle = normalise(query).replace(/^#/, '');
  return entries.filter((entry) => {
    const matchesQuery =
      needle.length === 0 ||
      entry.name.includes(needle) ||
      String(entry.id).padStart(3, '0').includes(needle) ||
      String(entry.id) === needle;
    const matchesType = types.length === 0 || types.some((type) => entry.types.includes(type));
    return matchesQuery && matchesType;
  });
}
