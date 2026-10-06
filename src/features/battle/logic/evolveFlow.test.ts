import { createMember } from '@/features/party/store/partySlice';
import type { PartyMember } from '@/features/party/types';
import { evolveMember, evolutionFor } from './evolve';
import { applyXp } from './levelUp';
import { xpForLevel } from './stats';

/** Exactly what the battle screen does with a reward: grow the member, then ask if an evolution is due. */
const afterReward = (member: PartyMember, reward: number): PartyMember => {
  const grown = applyXp(member, reward);
  const step = evolutionFor(grown.member.id, grown.member.level);
  const next = step ? evolveMember(grown.member, step) : null;
  return next ?? grown.member;
};

describe('a won battle that crosses the threshold', () => {
  it('evolves the member on the reward that reaches level 16', () => {
    const fresh = createMember(1, 15)!;
    const gap = xpForLevel(16) - fresh.xp;

    expect(fresh.level).toBe(15);
    expect(afterReward(fresh, gap - 1).name).toBe('bulbasaur');
    expect(afterReward(fresh, gap - 1).level).toBe(15);

    const evolved = afterReward(fresh, gap);
    expect(evolved.level).toBe(16);
    expect(evolved.id).toBe(2);
    expect(evolved.name).toBe('ivysaur');
    expect(evolved.maxHp).toBeGreaterThan(fresh.maxHp);
  });

  it('keeps evolving along the chain on later level ups', () => {
    const ivysaur = afterReward(createMember(1, 15)!, xpForLevel(16) - createMember(1, 15)!.xp);
    expect(ivysaur.name).toBe('ivysaur');

    const venusaur = afterReward(ivysaur, xpForLevel(32) - ivysaur.xp);
    expect(venusaur.level).toBe(32);
    expect(venusaur.name).toBe('venusaur');
  });

  it('does not evolve a member whose step needs something else', () => {
    const pikachu = createMember(25, 30)!;
    expect(afterReward(pikachu, 4000).name).toBe('pikachu');
  });
});
