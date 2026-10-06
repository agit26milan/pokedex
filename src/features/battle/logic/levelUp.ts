import type { PartyMember } from '@/features/party/types';
import { getEntry, movesetFor } from '@/shared/data/dex';
import { levelFromXp, maxHpFor } from './stats';

const XP_PER_FOE_LEVEL = 12;
const MOVE_SLOTS = 4;

/** Beating something above your level is worth more, so grinding stays optional. */
export function xpReward(foeLevel: number, winnerLevel: number): number {
  const underdogBonus = 1 + Math.max(0, foeLevel - winnerLevel) * 0.1;
  return Math.max(1, Math.floor(XP_PER_FOE_LEVEL * foeLevel * underdogBonus));
}

export interface LevelUpResult {
  member: PartyMember;
  levelsGained: number;
  learned: string[];
}

/**
 * Adds XP, levels up across any thresholds crossed and learns the newly legal moves without
 * interrupting the player — the spec asks for no prompt, and the demo tour cannot afford one.
 */
export function applyXp(member: PartyMember, gained: number): LevelUpResult {
  const xp = member.xp + Math.max(0, gained);
  const entry = getEntry(member.id);
  if (!entry) return { member: { ...member, xp }, levelsGained: 0, learned: [] };

  const level = Math.max(member.level, levelFromXp(xp));
  if (level === member.level) return { member: { ...member, xp }, levelsGained: 0, learned: [] };

  const moves = movesetFor(entry, level, MOVE_SLOTS);
  const maxHp = maxHpFor(entry, level);

  return {
    member: {
      ...member,
      xp,
      level,
      maxHp,
      // Level up grants the HP the new maximum added, without a free full heal.
      hp: Math.min(maxHp, member.hp + Math.max(0, maxHp - member.maxHp)),
      moves,
    },
    levelsGained: level - member.level,
    learned: moves.filter((move) => !member.moves.includes(move)),
  };
}
