import { createMember, PARTY_LIMIT } from '../store/partySlice';
import { isInRoster, partyIsFull, placeInRoster, remainingSlots } from './partyRules';

const member = (id: number) => createMember(id, 5)!;
const party = (count: number) => Array.from({ length: count }, (_, i) => member(i + 1));

describe('party rules', () => {
  it('reports remaining slots and fullness', () => {
    expect(remainingSlots(party(0))).toBe(PARTY_LIMIT);
    expect(remainingSlots(party(4))).toBe(2);
    expect(remainingSlots(party(6))).toBe(0);
    expect(partyIsFull(party(5))).toBe(false);
    expect(partyIsFull(party(6))).toBe(true);
  });

  it('puts the first six catches in the party', () => {
    const result = placeInRoster(party(5), [], member(150));
    expect(result.destination).toBe('party');
    expect(result.party).toHaveLength(6);
    expect(result.storage).toEqual([]);
  });

  it('overflows the seventh catch into storage without touching the party', () => {
    const existing = party(6);
    const result = placeInRoster(existing, [], member(151));
    expect(result.destination).toBe('storage');
    expect(result.party).toEqual(existing);
    expect(result.storage.map((m) => m.id)).toEqual([151]);
  });

  it('never mutates the arrays it is given', () => {
    const existing = party(5);
    const storage: ReturnType<typeof party> = [];
    placeInRoster(existing, storage, member(150));
    expect(existing).toHaveLength(5);
    expect(storage).toHaveLength(0);
  });

  it('treats both party and storage as caught', () => {
    expect(isInRoster(party(1), [member(151)], 151)).toBe(true);
    expect(isInRoster(party(1), [member(151)], 1)).toBe(true);
    expect(isInRoster(party(1), [], 151)).toBe(false);
  });
});
