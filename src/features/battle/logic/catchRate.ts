import { rollChance, type Rng } from '@/shared/lib/rng';

export interface CatchInput {
  captureRate: number;
  hp: number;
  maxHp: number;
  ballBonus: number;
}

export const MIN_CHANCE = 0.03;
export const MAX_CHANCE = 0.95;

export function catchChance({ captureRate, hp, maxHp, ballBonus }: CatchInput): number {
  if (maxHp <= 0) return MIN_CHANCE;
  const weakened = (3 * maxHp - 2 * Math.max(0, hp)) / (3 * maxHp);
  return Math.min(MAX_CHANCE, Math.max(MIN_CHANCE, (weakened * captureRate * ballBonus) / 255));
}

export function rollCatch(input: CatchInput, rng: Rng): { caught: boolean; chance: number } {
  const chance = catchChance(input);
  return { caught: rollChance(rng, chance), chance };
}
