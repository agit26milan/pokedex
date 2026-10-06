import type { PartyMember } from '@/features/party/types';
import { getEntry, movesetFor, type EvolutionStep } from '@/shared/data/dex';
import { toSlots, withUsableMove } from '@/shared/data/moves';
import { maxHpFor } from './stats';

const MOVE_SLOTS = 4;

export function evolutionFor(id: number, level: number): EvolutionStep | null {
  const entry = getEntry(id);
  if (!entry) return null;
  const step = entry.evolution.to.find(
    (candidate) =>
      candidate.method === 'level' && (candidate.level ?? 0) <= level && getEntry(candidate.id) !== undefined,
  );
  return step ?? null;
}

export function evolveMember(member: PartyMember, step: EvolutionStep): PartyMember | null {
  const entry = getEntry(step.id);
  if (!entry) return null;

  const maxHp = maxHpFor(entry, member.level);
  const ratio = member.maxHp > 0 ? member.hp / member.maxHp : 1;

  return {
    ...member,
    id: entry.id,
    name: entry.name,
    maxHp,
    hp: Math.max(1, Math.min(maxHp, Math.round(maxHp * ratio))),
    moves: withUsableMove(toSlots(movesetFor(entry, member.level, MOVE_SLOTS))),
  };
}
