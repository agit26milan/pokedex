import { createMember } from '@/features/party/store/partySlice';
import { xpForLevel } from './stats';
import { applyXp, xpReward } from './levelUp';

const bulbasaur = () => createMember(1, 5)!;

describe('xpReward', () => {
  it('grows with the defeated level', () => {
    expect(xpReward(10, 5)).toBeGreaterThan(xpReward(3, 5));
  });

  it('pays a bonus for beating something stronger', () => {
    expect(xpReward(12, 5)).toBeGreaterThan(xpReward(5, 12));
  });

  it('always pays at least one point', () => {
    expect(xpReward(1, 100)).toBeGreaterThanOrEqual(1);
  });
});

describe('applyXp', () => {
  it('banks XP without levelling when the threshold is not crossed', () => {
    const before = bulbasaur();
    const result = applyXp(before, 5);

    expect(result.levelsGained).toBe(0);
    expect(result.learned).toEqual([]);
    expect(result.member.xp).toBe(before.xp + 5);
    expect(result.member.level).toBe(before.level);
  });

  it('levels up when the threshold is crossed and learns the newly legal move', () => {
    const before = bulbasaur();
    const toLevel13 = xpForLevel(13) - before.xp;
    const result = applyXp(before, toLevel13);

    expect(result.member.level).toBe(13);
    expect(result.levelsGained).toBe(8);
    expect(result.learned).toContain('vine-whip');
  });

  it('grants the extra HP the new maximum added, without a free full heal', () => {
    const before = { ...bulbasaur(), hp: 1 };
    const result = applyXp(before, xpForLevel(20) - before.xp);

    expect(result.member.maxHp).toBeGreaterThan(before.maxHp);
    expect(result.member.hp).toBeGreaterThan(1);
    expect(result.member.hp).toBeLessThan(result.member.maxHp);
  });

  it('never carries more than four moves', () => {
    const before = bulbasaur();
    const result = applyXp(before, xpForLevel(48) - before.xp);

    expect(result.member.moves.length).toBeLessThanOrEqual(4);
    expect(new Set(result.member.moves).size).toBe(result.member.moves.length);
  });

  it('is a no-op for negative or zero XP', () => {
    const before = bulbasaur();
    expect(applyXp(before, 0).member).toEqual(before);
    expect(applyXp(before, -50).member.xp).toBe(before.xp);
  });
});
