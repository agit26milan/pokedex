import type { Rng } from '@/shared/lib/rng';
import type { MoveInfo } from '@/shared/data/moves';
import type { Stats } from './stats';
import { effectiveness, hasStab } from './typeChart';

export const CRIT_CHANCE = 0.0625;
export const STAB_MULTIPLIER = 1.5;
export const CRIT_MULTIPLIER = 2;

export interface DamageInput {
  attackerLevel: number;
  attackerAttack: number;
  defenderDefense: number;
  movePower: number;
  moveType: string;
  attackerTypes: readonly string[];
  defenderTypes: readonly string[];
  rng: Rng;
}

export interface DamageResult {
  damage: number;
  critical: boolean;
  effectiveness: number;
}


/** A special move fights with special attack and special defence; everything else uses the physical pair. */
export function pickStats(
  attacker: Stats,
  defender: Stats,
  damageClass: MoveInfo['damageClass'],
): { attackerAttack: number; defenderDefense: number } {
  const special = damageClass === 'special';
  return {
    attackerAttack: special ? attacker.specialAttack : attacker.attack,
    defenderDefense: special ? defender.specialDefense : defender.defense,
  };
}

export function computeDamage(input: DamageInput): DamageResult {
  const typeMultiplier = effectiveness(input.moveType, input.defenderTypes);
  if (typeMultiplier === 0 || input.movePower <= 0) {
    return { damage: 0, critical: false, effectiveness: typeMultiplier };
  }

  const critical = input.rng() < CRIT_CHANCE;
  const base = Math.floor((((2 * input.attackerLevel) / 5 + 2) * input.movePower * input.attackerAttack) / input.defenderDefense / 50) + 2;
  const stab = hasStab(input.moveType, input.attackerTypes) ? STAB_MULTIPLIER : 1;
  const spread = 0.85 + input.rng() * 0.15;

  const damage = Math.floor(base * stab * typeMultiplier * (critical ? CRIT_MULTIPLIER : 1) * spread);
  return { damage: Math.max(1, damage), critical, effectiveness: typeMultiplier };
}
