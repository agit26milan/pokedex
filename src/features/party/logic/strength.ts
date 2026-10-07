import { getEntry } from '@/shared/data/dex';
import { maxPpOf, moveInfo } from '@/shared/data/moves';
import { statsAt, xpForLevel, type Stats } from '@/features/battle/logic/stats';
import type { PartyMember } from '../types';

export type Grade = 'A' | 'B' | 'C' | 'D';

export interface MoveLine {
  name: string;
  type: string;
  power: number;
  pp: number;
  maxPp: number;
}

export interface Strength {
  stats: Stats | null;
  combatRating: number;
  grade: Grade;
  baseTotal: number;
}

export const GRADE_CUTOFF = { a: 150, b: 120, c: 100 } as const;

export function gradeOf(combatRating: number): Grade {
  if (combatRating >= GRADE_CUTOFF.a) return 'A';
  if (combatRating >= GRADE_CUTOFF.b) return 'B';
  if (combatRating >= GRADE_CUTOFF.c) return 'C';
  return 'D';
}

export function strengthOf(member: PartyMember): Strength {
  const entry = getEntry(member.id);
  if (!entry) return { stats: null, combatRating: 0, grade: 'D', baseTotal: 0 };

  const stats = statsAt(entry, member.level);
  const combatRating =
    stats.attack + stats.defense + stats.specialAttack + stats.specialDefense + stats.speed;
  const baseTotal = Object.values(entry.baseStats).reduce((total, value) => total + value, 0);

  return { stats, combatRating, grade: gradeOf(combatRating), baseTotal };
}

export const combatRatingOf = (member: PartyMember): number => strengthOf(member).combatRating;

export function xpProgress(member: PartyMember): { into: number; span: number; ratio: number } {
  const floor = xpForLevel(member.level);
  const span = Math.max(1, xpForLevel(member.level + 1) - floor);
  const into = Math.max(0, Math.min(span, member.xp - floor));
  return { into, span, ratio: into / span };
}

export function ppOf(member: PartyMember): { current: number; max: number } {
  const current = member.moves.reduce((total, slot) => total + slot.pp, 0);
  const max = member.moves.reduce((total, slot) => total + maxPpOf(slot.name), 0);
  return { current, max };
}

export function movesOf(member: PartyMember): MoveLine[] {
  return member.moves.map((slot) => {
    const info = moveInfo(slot.name);
    return {
      name: slot.name,
      type: info?.type ?? 'normal',
      power: info?.power ?? 0,
      pp: slot.pp,
      maxPp: maxPpOf(slot.name),
    };
  });
}

export function rankInParty(party: readonly PartyMember[], id: number): { rank: number; total: number } {
  const scored = party.map((member) => ({
    id: member.id,
    name: member.name,
    rating: combatRatingOf(member),
  }));

  const mine = scored.find((entry) => entry.id === id);
  if (!mine) return { rank: 0, total: scored.length };

  const ahead = scored.filter((entry) => {
    if (entry.rating !== mine.rating) return entry.rating > mine.rating;
    if (entry.name !== mine.name) return entry.name < mine.name;
    return entry.id < mine.id;
  }).length;

  return { rank: ahead + 1, total: scored.length };
}
