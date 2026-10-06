import raw from './pokedex.gen1.json';

export interface MoveInfo {
  type: string;
  power: number;
  accuracy: number;
  pp: number;
  damageClass: 'physical' | 'special' | 'status';
}

/** The generated move table. Owned here so nothing has to import dex just to read a move. */
export const MOVES = raw.moves as Record<string, MoveInfo>;

/**
 * Struggle is not a Red-Blue level-up move, so it is absent from the seed. It is the shared
 * fallback for Pokémon whose learnset cannot damage anything (Abra, Ditto, Metapod, Kakuna) —
 * without it, a player who fields one could never win a battle.
 */
export const STRUGGLE = 'struggle';
export const STRUGGLE_POWER = 50;
export const STRUGGLE_INFO: MoveInfo = { power: STRUGGLE_POWER, type: 'normal', accuracy: 100, pp: 0, damageClass: 'physical' };

export const moveInfo = (name: string): MoveInfo | undefined => (name === STRUGGLE ? STRUGGLE_INFO : MOVES[name]);

export const isDamaging = (name: string): boolean => (moveInfo(name)?.power ?? 0) > 0;

export const hasDamagingMove = (names: readonly string[]): boolean => names.some(isDamaging);
