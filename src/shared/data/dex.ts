import raw from './pokedex.gen1.json';
import { isDamaging } from './moves';

export { hasDamagingMove, MOVES, moveInfo, STRUGGLE } from './moves';
export { isDamaging };

export interface BaseStats {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

export interface DexEntry {
  id: number;
  name: string;
  captureRate: number;
  types: string[];
  baseStats: BaseStats;
  evolution: { id: number; name: string }[];
  moves: { name: string; level: number }[];
}

export interface MoveInfo {
  type: string;
  power: number;
  accuracy: number;
  pp: number;
  damageClass: 'physical' | 'special' | 'status';
}

export const POKEDEX = raw.pokemon as DexEntry[];
export const DEX_SIZE = POKEDEX.length;
export const ALL_TYPES: string[] = [...new Set(POKEDEX.flatMap((entry) => entry.types))].sort();

const byId = new Map(POKEDEX.map((entry) => [entry.id, entry]));

export const getEntry = (id: number): DexEntry | undefined => byId.get(id);

/** Moves as of a level. Entries with no damaging move in Gen 1 keep their status-only list. */
export const learnedBy = (entry: DexEntry, level: number): string[] =>
  entry.moves.filter((move) => move.level <= level).map((move) => move.name);

/**
 * Up to `max` moves a Pokémon of this level would know. Prefers the most recently
 * learned damaging moves so an attacker always has something to hit with.
 */
export function movesetFor(entry: DexEntry, level: number, max = 4): string[] {
  const learned = entry.moves.filter((move) => move.level <= level);
  const damaging = learned.filter((move) => isDamaging(move.name));
  const pool = damaging.length > 0 ? damaging : learned;
  return pool.slice(-max).map((move) => move.name);
}
