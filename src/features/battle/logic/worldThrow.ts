import { BALL_BONUS, type BallName } from '@/features/battle/logic/turnEngine';
import { rollCatch } from '@/features/battle/logic/catchRate';
import { getEntry } from '@/shared/data/dex';
import type { Rng } from '@/shared/lib/rng';

export interface ThrowResult {
  caught: boolean;
  chance: number;
}

/**
 * Throwing at a wild Pokémon from the encounter sheet, before any battle. The wild is at full HP here, so the odds
 * are the worst they will ever be — which is what makes walking into a battle the better play. Returns undefined for
 * an id outside the dex so the caller can never spend a ball on nothing.
 */
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
