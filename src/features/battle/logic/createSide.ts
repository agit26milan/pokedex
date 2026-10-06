import type { PartyMember } from '@/features/party/types';
import { MOVES, getEntry, movesetFor } from '@/shared/data/dex';
import { hasDamagingMove, STRUGGLE } from '@/shared/data/moves';
import { statsAt } from './stats';
import type { BattleSide } from './turnEngine';

const FALLBACK_PP = 10;
const DEFAULT_MOVE_COUNT = 4;

/**
 * Abra, Ditto, Metapod and Kakuna have no damaging level-up move. Without this the player
 * could field one and be unable to ever win, so Struggle joins the moveset as a last resort.
 */
const withFallback = (names: readonly string[]): string[] =>
  hasDamagingMove(names) ? [...names] : [...names, STRUGGLE];

const toBattleMoves = (names: readonly string[]) =>
  withFallback(names).map((name) => {
    const pp = MOVES[name]?.pp ?? FALLBACK_PP;
    return { name, pp, maxPp: pp };
  });

/** Wild or freshly built opponent straight from the seed. */
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
    moves: toBattleMoves(movesetFor(entry, level, DEFAULT_MOVE_COUNT)),
    captureRate: entry.captureRate,
  };
}

/** Player side keeps the HP and moves the party member already earned. */
export function sideFromMember(member: PartyMember): BattleSide | undefined {
  const entry = getEntry(member.id);
  if (!entry) return undefined;
  const stats = statsAt(entry, member.level);
  const moves = member.moves.length > 0 ? member.moves : movesetFor(entry, member.level, DEFAULT_MOVE_COUNT);
  return {
    id: member.id,
    name: member.name,
    level: member.level,
    hp: member.hp,
    maxHp: member.maxHp,
    stats,
    types: entry.types,
    moves: toBattleMoves(moves),
    captureRate: entry.captureRate,
  };
}

/** Writes the battle result back onto the party member. */
export function memberFromSide(member: PartyMember, side: BattleSide): PartyMember {
  return { ...member, hp: side.hp, maxHp: side.maxHp, moves: side.moves.map((move) => move.name) };
}
