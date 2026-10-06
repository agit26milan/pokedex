import raw from './pokedex.gen1.json';

export interface MoveInfo {
  type: string;
  power: number;
  accuracy: number;
  pp: number;
  damageClass: 'physical' | 'special' | 'status';
}

export const MOVES = raw.moves as Record<string, MoveInfo>;

export const STRUGGLE = 'struggle';
export const STRUGGLE_POWER = 50;
export const STRUGGLE_INFO: MoveInfo = { power: STRUGGLE_POWER, type: 'normal', accuracy: 100, pp: 0, damageClass: 'physical' };

export const moveInfo = (name: string): MoveInfo | undefined => (name === STRUGGLE ? STRUGGLE_INFO : MOVES[name]);

export const isDamaging = (name: string): boolean => (moveInfo(name)?.power ?? 0) > 0;

export const hasDamagingMove = (names: readonly string[]): boolean => names.some(isDamaging);

export interface MoveSlot {
  name: string;
  pp: number;
}

const MAX_PP_FALLBACK = 10;

export const maxPpOf = (name: string): number => {
  const pp = moveInfo(name)?.pp ?? 0;
  return pp > 0 ? pp : MAX_PP_FALLBACK;
};

export const toSlots = (names: readonly string[]): MoveSlot[] => names.map((name) => ({ name, pp: maxPpOf(name) }));

export const fullPp = (slots: readonly MoveSlot[]): MoveSlot[] => slots.map((slot) => ({ ...slot, pp: maxPpOf(slot.name) }));

export const withUsableMove = (slots: readonly MoveSlot[]): MoveSlot[] =>
  hasDamagingMove(slots.map((slot) => slot.name)) ? [...slots] : [...slots, { name: STRUGGLE, pp: maxPpOf(STRUGGLE) }];
