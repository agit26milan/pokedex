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

/** A move the party carries, with the PP it has left. This is persisted, so the shape is part of the save format. */
export interface MoveSlot {
  name: string;
  pp: number;
}

const MAX_PP_FALLBACK = 10;

/** Struggle is not in the seed and reports no PP, so it falls back like any other unknown move. */
export const maxPpOf = (name: string): number => {
  const pp = moveInfo(name)?.pp ?? 0;
  return pp > 0 ? pp : MAX_PP_FALLBACK;
};

export const toSlots = (names: readonly string[]): MoveSlot[] => names.map((name) => ({ name, pp: maxPpOf(name) }));

/** Refills every move. Used by the two recovery paths (level up, defeat) so a run can never dead-end. */
export const fullPp = (slots: readonly MoveSlot[]): MoveSlot[] => slots.map((slot) => ({ ...slot, pp: maxPpOf(slot.name) }));

/** Guarantees the slots contain something that can actually deal damage. */
export const withUsableMove = (slots: readonly MoveSlot[]): MoveSlot[] =>
  hasDamagingMove(slots.map((slot) => slot.name)) ? [...slots] : [...slots, { name: STRUGGLE, pp: maxPpOf(STRUGGLE) }];
