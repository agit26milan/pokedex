import { createSide, memberFromSide, sideFromMember } from '@/features/battle/logic/createSide';
import { applyXp } from '@/features/battle/logic/levelUp';
import { xpForLevel } from '@/features/battle/logic/stats';
import { createMember } from '@/features/party/store/partySlice';
import { maxPpOf } from '@/shared/data/moves';
import { createRunStore } from './index';

/** A member that has already spent some PP, the way a real save would look mid-run. */
const drained = () => {
  const member = createMember(25, 12)!;
  return {
    ...member,
    moves: member.moves.map((slot, index) => (index === 0 ? { ...slot, pp: 2 } : slot)),
  };
};

describe('PP persists across battles', () => {
  it('carries spent PP from one battle into the next', () => {
    const member = drained();
    const first = sideFromMember(member)!;
    const persisted = memberFromSide(member, { ...first, hp: 12 });
    const second = sideFromMember(persisted)!;

    expect(first.moves[0]!.pp).toBe(2);
    expect(second.moves[0]!.pp).toBe(2);
    expect(second.moves[0]!.maxPp).toBe(maxPpOf(second.moves[0]!.name));
  });

  it('keeps the spent PP on the member itself, not just in the battle', () => {
    const member = drained();
    const side = createSide(25, 12)!;
    expect(side.moves[0]!.pp).toBe(side.moves[0]!.maxPp); // a wild is always fresh
    expect(member.moves[0]!.pp).toBe(2);
  });

  it('refills every move on level up', () => {
    const member = drained();
    const grown = applyXp(member, xpForLevel(member.level + 1) - member.xp);

    expect(grown.levelsGained).toBeGreaterThan(0);
    grown.member.moves.forEach((slot) => expect(slot.pp).toBe(maxPpOf(slot.name)));
  });

  it('refills every move after a defeat, alongside the partial heal', () => {
    const store = createRunStore();
    store.setState({ party: [drained()] });

    store.getState().healParty(0.5);

    const healed = store.getState().party[0]!;
    healed.moves.forEach((slot) => expect(slot.pp).toBe(maxPpOf(slot.name)));
    expect(healed.hp).toBeGreaterThan(0);
  });

  it('never lets a charged move report more PP than it can hold', () => {
    const member = drained();
    const inflated = { ...member, moves: member.moves.map((slot) => ({ ...slot, pp: 999 })) };
    const side = sideFromMember(inflated)!;

    side.moves.forEach((move) => expect(move.pp).toBeLessThanOrEqual(move.maxPp));
  });
});
