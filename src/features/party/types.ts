import type { MoveSlot } from '@/shared/data/moves';

export type { MoveSlot };

export interface PartyMember {
  id: number;
  name: string;
  level: number;
  xp: number;
  hp: number;
  maxHp: number;
  moves: MoveSlot[];
}

export interface Bag {
  pokeBall: number;
  greatBall: number;
  potion: number;
  money: number;
  hyperPotion: number;
}

export type BagItem = keyof Bag;
export type BuyableItem = 'potion' | 'hyperPotion' | 'pokeBall' | 'greatBall';

export const PARTY_LIMIT = 6;
export const STARTER_IDS = [1, 4, 7] as const;
export const STARTER_LEVEL = 5;
export const INITIAL_BAG: Bag = { pokeBall: 10, greatBall: 10, potion: 3, money: 100, hyperPotion: 1 };
export const REVIVE_HP = 0.5;
export const POKE_BALL_PRICE = 10;
export const GREAT_BALL_PRICE = 15;