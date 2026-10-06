import type { MoveSlot, PartyMember } from '@/features/party/types';
import { getEntry, movesetFor } from '@/shared/data/dex';
import { maxPpOf, toSlots, withUsableMove } from '@/shared/data/moves';
import { statsAt } from './stats';
import type { BattleSide } from './turnEngine';

const DEFAULT_MOVE_COUNT = 4;

const battleMoves = (slots: readonly MoveSlot[]) =>
  withUsableMove(slots).map((slot) => {
    const maxPp = maxPpOf(slot.name);
    return { name: slot.name, pp: Math.min(slot.pp, maxPp), maxPp };
  });

export function createSide(id: number, level: number): BattleSide | undefined {
  const entry = getEntry(id);
  if (!entry) return undefined;
  const stats = statsAt(entry, level);
  return {
    id,
    name: entry.name,
    level,
    hp: stats.hp,
    maxHp: stats.hp,
    stats,
    types: entry.types,
    moves: battleMoves(toSlots(movesetFor(entry, level, DEFAULT_MOVE_COUNT))),
    captureRate: entry.captureRate,
  };
}

export function sideFromMember(member: PartyMember): BattleSide | undefined {
  const entry = getEntry(member.id);
  if (!entry) return undefined;
  const stats = statsAt(entry, member.level);
  const slots = member.moves.length > 0 ? member.moves : toSlots(movesetFor(entry, member.level, DEFAULT_MOVE_COUNT));
  return {
    id: member.id,
    name: member.name,
    level: member.level,
    hp: member.hp,
    maxHp: member.maxHp,
    stats,
    types: entry.types,
    moves: battleMoves(slots),
    captureRate: entry.captureRate,
  };
}

export function memberFromSide(member: PartyMember, side: BattleSide): PartyMember {
  return {
    ...member,
    hp: side.hp,
    maxHp: side.maxHp,
    moves: side.moves.map((move) => ({ name: move.name, pp: move.pp })),
  };
}
