import { createMember } from '@/features/party/store/partySlice';
import type { PartyMember } from '../types';
import { combatRatingOf, gradeOf, movesOf, ppOf, rankInParty, strengthOf, xpProgress } from './strength';

const member = (id: number, level: number, patch: Partial<PartyMember> = {}): PartyMember => ({
  ...createMember(id, level)!,
  ...patch,
});

describe('combat rating', () => {
  it('matches the stats the battle screen actually uses', () => {
    expect(combatRatingOf(member(99, 16))).toBe(158);
    expect(combatRatingOf(member(2, 16))).toBe(133);
    expect(combatRatingOf(member(35, 17))).toBe(109);
    expect(combatRatingOf(member(7, 14))).toBe(99);
  });

  it('maps the rating onto the A/B/C/D grades', () => {
    expect(gradeOf(158)).toBe('A');
    expect(gradeOf(150)).toBe('A');
    expect(gradeOf(149)).toBe('B');
    expect(gradeOf(133)).toBe('B');
    expect(gradeOf(120)).toBe('B');
    expect(gradeOf(119)).toBe('C');
    expect(gradeOf(100)).toBe('C');
    expect(gradeOf(99)).toBe('D');
  });

  it('reports the base stat total next to the rating', () => {
    expect(strengthOf(member(99, 16)).baseTotal).toBe(475);
    expect(strengthOf(member(2, 16)).stats?.attack).toBe(24);
  });

  it('survives a member whose dex entry is unknown', () => {
    const ghost = { ...member(1, 5), id: 999999 };
    expect(strengthOf(ghost)).toEqual({ stats: null, combatRating: 0, grade: 'D', baseTotal: 0 });
  });
});

describe('xpProgress', () => {
  it('measures progress inside the current level, not the lifetime total', () => {
    const kingler = member(99, 16, { xp: 4166 });
    expect(xpProgress(kingler)).toEqual({ into: 70, span: 817, ratio: 70 / 817 });
  });

  it('clamps a member sitting exactly on the level floor', () => {
    expect(xpProgress(member(2, 16, { xp: 4096 })).into).toBe(0);
  });
});

describe('ppOf', () => {
  it('sums the slots against their max pp', () => {
    const drained = member(99, 16, {
      moves: [
        { name: 'bubble', pp: 12 },
        { name: 'vice-grip', pp: 30 },
      ],
    });
    expect(ppOf(drained)).toEqual({ current: 42, max: 60 });
  });
});

describe('movesOf', () => {
  it('exposes type, power and pp for each slot', () => {
    const lines = movesOf(member(99, 16));
    expect(lines[0]).toMatchObject({ name: 'bubble', type: 'water', power: 40, maxPp: 30 });
    expect(lines.every((line) => line.pp > 0)).toBe(true);
  });
});

describe('rankInParty', () => {
  const party = [member(2, 16), member(99, 16), member(35, 17), member(7, 14)];

  it('orders members by combat rating', () => {
    expect(rankInParty(party, 99)).toEqual({ rank: 1, total: 4 });
    expect(rankInParty(party, 2)).toEqual({ rank: 2, total: 4 });
    expect(rankInParty(party, 35)).toEqual({ rank: 3, total: 4 });
    expect(rankInParty(party, 7)).toEqual({ rank: 4, total: 4 });
  });

  it('breaks a tie by name', () => {
    const tied = [member(45, 10), member(55, 10)];
    expect(combatRatingOf(tied[0]!)).toBe(combatRatingOf(tied[1]!));
    expect(rankInParty(tied, 55)).toEqual({ rank: 1, total: 2 });
    expect(rankInParty(tied, 45)).toEqual({ rank: 2, total: 2 });
  });

  it('returns rank 0 when the member is not in the party', () => {
    expect(rankInParty(party, 151)).toEqual({ rank: 0, total: 4 });
  });
});
