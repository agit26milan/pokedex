import { getEntry, type DexEntry } from '@/shared/data/dex';
import { levelFromXp, maxHpFor, statsAt, xpForLevel } from './stats';

const bulbasaur = getEntry(1)!;

/** A synthetic entry whose six base stats are all different, so a swapped field cannot hide. */
const distinct = (): DexEntry => ({
  id: 1,
  name: 'test',
  captureRate: 45,
  types: ['normal'],
  baseStats: { hp: 10, attack: 20, defense: 30, specialAttack: 40, specialDefense: 50, speed: 60 },
  evolution: { from: null, to: [] },
  moves: [],
});

const STAT_KEYS = ['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed'] as const;

describe('statsAt', () => {
  it('matches the Gen-1 formula for Bulbasaur at every milestone level', () => {
    // hp   = floor(2 * base * level / 100) + level + 10
    // rest = floor(2 * base * level / 100) + 5
    expect(statsAt(bulbasaur, 1)).toEqual({
      hp: 11,
      attack: 5,
      defense: 5,
      specialAttack: 6,
      specialDefense: 6,
      speed: 5,
    });
    expect(statsAt(bulbasaur, 5)).toEqual({
      hp: 19,
      attack: 9,
      defense: 9,
      specialAttack: 11,
      specialDefense: 11,
      speed: 9,
    });
    expect(statsAt(bulbasaur, 50)).toEqual({
      hp: 105,
      attack: 54,
      defense: 54,
      specialAttack: 70,
      specialDefense: 70,
      speed: 50,
    });
    expect(statsAt(bulbasaur, 100)).toEqual({
      hp: 200,
      attack: 103,
      defense: 103,
      specialAttack: 135,
      specialDefense: 135,
      speed: 95,
    });
  });

  it('routes each base stat into its own field', () => {
    // Distinct bases mean a copy-paste slip (e.g. specialAttack fed by specialDefense) changes the result.
    expect(statsAt(distinct(), 100)).toEqual({
      hp: 130,
      attack: 45,
      defense: 65,
      specialAttack: 85,
      specialDefense: 105,
      speed: 125,
    });
  });

  it('truncates the contribution instead of rounding it', () => {
    // Bulbasaur level 5: hp 4.5 -> 4 (rounding would give 20 hp) and attack 4.9 -> 4 (would give 10).
    const level5 = statsAt(bulbasaur, 5);
    expect(level5.hp).toBe(19);
    expect(level5.attack).toBe(9);
  });

  it('gives HP the extra level term, so it outgrows the other stats', () => {
    const low = statsAt(bulbasaur, 1);
    const high = statsAt(bulbasaur, 100);

    expect(high.hp - low.hp).toBe(189);
    // attack/defence/speed share base 45-49, so pure base * 2 scaling applies to them.
    expect(high.attack - low.attack).toBe(98);
  });

  it('falls back to the bare constants at level 0', () => {
    expect(statsAt(distinct(), 0)).toEqual({
      hp: 10,
      attack: 5,
      defense: 5,
      specialAttack: 5,
      specialDefense: 5,
      speed: 5,
    });
  });

  it('never decreases as the level rises', () => {
    for (let level = 1; level < 100; level += 1) {
      const before = statsAt(bulbasaur, level);
      const after = statsAt(bulbasaur, level + 1);
      for (const key of STAT_KEYS) expect(after[key]).toBeGreaterThanOrEqual(before[key]);
      // HP strictly climbs because of the + level term.
      expect(after.hp).toBeGreaterThan(before.hp);
    }
  });

  it('always returns whole numbers', () => {
    for (const level of [1, 7, 33, 66, 100]) {
      const stats = statsAt(bulbasaur, level);
      for (const key of STAT_KEYS) expect(Number.isInteger(stats[key])).toBe(true);
    }
  });
});

describe('maxHpFor', () => {
  it('is exactly the hp field of statsAt', () => {
    for (const entry of [bulbasaur, distinct()]) {
      for (const level of [1, 5, 50, 100]) {
        expect(maxHpFor(entry, level)).toBe(statsAt(entry, level).hp);
      }
    }
  });

  it('grows with the level', () => {
    expect(maxHpFor(bulbasaur, 50)).toBeGreaterThan(maxHpFor(bulbasaur, 5));
  });
});

describe('xpForLevel', () => {
  it('is the cube of the level', () => {
    expect(xpForLevel(1)).toBe(1);
    expect(xpForLevel(2)).toBe(8);
    expect(xpForLevel(5)).toBe(125);
    expect(xpForLevel(10)).toBe(1000);
    expect(xpForLevel(100)).toBe(1_000_000);
  });

  it('rises with the level', () => {
    for (let level = 1; level < 100; level += 1) {
      expect(xpForLevel(level + 1)).toBeGreaterThan(xpForLevel(level));
    }
  });
});

describe('levelFromXp', () => {
  it('round-trips every level through xpForLevel', () => {
    for (let level = 1; level <= 100; level += 1) {
      expect(levelFromXp(xpForLevel(level))).toBe(level);
    }
  });

  it('floors down between two thresholds', () => {
    expect(xpForLevel(5)).toBe(125);
    expect(xpForLevel(6)).toBe(216);

    expect(levelFromXp(125)).toBe(5);
    expect(levelFromXp(126)).toBe(5);
    expect(levelFromXp(215)).toBe(5);
    expect(levelFromXp(216)).toBe(6);
  });

  it('treats zero and negative XP as level 1', () => {
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(-1)).toBe(1);
    expect(levelFromXp(-9999)).toBe(1);
  });

  it('clamps at level 100 once the XP passes the last threshold', () => {
    expect(levelFromXp(xpForLevel(100))).toBe(100);
    expect(levelFromXp(xpForLevel(101))).toBe(100);
    expect(levelFromXp(Number.MAX_SAFE_INTEGER)).toBe(100);
  });

  it('never returns a level outside 1..100', () => {
    for (const xp of [-1000, 0, 1, 999, 1_000_000, 500_000_000]) {
      const level = levelFromXp(xp);
      expect(level).toBeGreaterThanOrEqual(1);
      expect(level).toBeLessThanOrEqual(100);
      expect(Number.isInteger(level)).toBe(true);
    }
  });
});
