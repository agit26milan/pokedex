import type { DexEntry } from '@/shared/data/dex';
import { filterPokemon } from './filterPokemon';

const entry = (id: number, name: string, types: string[]): DexEntry =>
  ({ id, name, types, captureRate: 45, baseStats: {} as DexEntry['baseStats'], evolution: { from: null, to: [] }, moves: [] });

const PIKACHU = entry(25, 'pikachu', ['electric']);
const RAICHU = entry(26, 'raichu', ['electric']);
const BULBASAUR = entry(1, 'bulbasaur', ['grass', 'poison']);
const CHARMANDER = entry(4, 'charmander', ['fire']);

const dex = [BULBASAUR, CHARMANDER, PIKACHU, RAICHU];
const ids = (result: DexEntry[]): number[] => result.map((item) => item.id);

describe('filterPokemon', () => {
  it('returns everything for an empty filter', () => {
    expect(filterPokemon(dex, { query: '', types: [] })).toHaveLength(4);
  });

  it('matches a partial name, case-insensitively', () => {
    expect(ids(filterPokemon(dex, { query: 'PIKA', types: [] }))).toEqual([25]);
  });

  it('matches by dex number, padded or not', () => {
    expect(ids(filterPokemon(dex, { query: '25', types: [] }))).toEqual([25]);
    expect(ids(filterPokemon(dex, { query: '#025', types: [] }))).toEqual([25]);
  });

  it('filters by a single type', () => {
    expect(ids(filterPokemon(dex, { query: '', types: ['electric'] }))).toEqual([25, 26]);
  });

  it('combines multiple types with OR', () => {
    expect(ids(filterPokemon(dex, { query: '', types: ['fire', 'electric'] }))).toEqual([4, 25, 26]);
  });

  it('intersects type filters with the search query', () => {
    expect(ids(filterPokemon(dex, { query: 'rai', types: ['electric'] }))).toEqual([26]);
    expect(ids(filterPokemon(dex, { query: 'bulba', types: ['electric'] }))).toEqual([]);
  });

  it('matches either type of a dual-type Pokémon', () => {
    expect(ids(filterPokemon(dex, { query: '', types: ['poison'] }))).toEqual([1]);
    expect(ids(filterPokemon(dex, { query: '', types: ['grass'] }))).toEqual([1]);
  });

  it('returns an empty list instead of throwing when nothing matches', () => {
    expect(filterPokemon(dex, { query: 'mewtwo', types: [] })).toEqual([]);
    expect(filterPokemon(dex, { query: '', types: ['dragon'] })).toEqual([]);
  });

  it('ignores surrounding whitespace in the query', () => {
    expect(ids(filterPokemon(dex, { query: '  pikachu  ', types: [] }))).toEqual([25]);
  });
});
