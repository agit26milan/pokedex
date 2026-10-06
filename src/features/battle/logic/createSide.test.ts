import { createMember } from '@/features/party/store/partySlice';
import { isDamaging } from '@/shared/data/moves';
import { createSide, memberFromSide, sideFromMember } from './createSide';

describe('createSide', () => {
  it('builds a side from the seed with full HP and the level-appropriate moveset', () => {
    const side = createSide(25, 8)!;
    expect(side.name).toBe('pikachu');
    expect(side.hp).toBe(side.maxHp);
    expect(side.types).toEqual(['electric']);
    expect(side.moves.length).toBeGreaterThan(0);
    expect(side.captureRate).toBeGreaterThan(0);
  });

  it('gives a Pokémon with no damaging move a Struggle fallback', () => {
    const abra = createSide(63, 10)!;
    expect(abra.moves.map((move) => move.name)).toContain('struggle');
    expect(abra.moves.some((move) => isDamaging(move.name))).toBe(true);
  });

  it('does not add a fallback when a damaging move already exists', () => {
    const bulbasaur = createSide(1, 10)!;
    expect(bulbasaur.moves.map((move) => move.name)).not.toContain('struggle');
  });

  it('only ever returns moves the level allows', () => {
    const early = createSide(1, 1)!;
    expect(early.moves.map((move) => move.name).sort()).toEqual(['tackle']);
  });

  it('returns undefined for an id outside Gen 1', () => {
    expect(createSide(999, 5)).toBeUndefined();
  });
});

describe('sideFromMember', () => {
  it('keeps the HP the member already earned', () => {
    const member = { ...createMember(4, 5)!, hp: 7 };
    const side = sideFromMember(member)!;

    expect(side.hp).toBe(7);
    expect(side.maxHp).toBe(member.maxHp);
    expect(side.moves.map((move) => move.name)).toEqual(member.moves);
  });

  it('round-trips the battle result back onto the member', () => {
    const member = createMember(4, 5)!;
    const side = sideFromMember(member)!;
    const updated = memberFromSide(member, { ...side, hp: 3 });

    expect(updated.hp).toBe(3);
    expect(updated.id).toBe(member.id);
    expect(updated.moves).toEqual(side.moves.map((move) => move.name));
  });
});
