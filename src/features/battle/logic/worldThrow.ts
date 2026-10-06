import { BALL_BONUS, type BallName } from '@/features/battle/logic/turnEngine';
import { rollCatch } from '@/features/battle/logic/catchRate';
import { getEntry } from '@/shared/data/dex';
import type { Rng } from '@/shared/lib/rng';

export interface ThrowResult {
  caught: boolean;
  chance: number;
}

export function throwBall(id: number, ball: BallName, rng: Rng): ThrowResult | undefined {
  const entry = getEntry(id);
  if (!entry) return undefined;
  const stats = entry.baseStats;
  return rollCatch(
    {
      captureRate: entry.captureRate,
      hp: stats.hp,
      maxHp: stats.hp,
      ballBonus: BALL_BONUS[ball],
    },
    rng,
  );
}
