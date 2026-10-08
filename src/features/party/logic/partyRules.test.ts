import { createMember, PARTY_LIMIT } from '../store/partySlice';
import {
  isInRoster,
  partyIsFull,
  placeInRoster,
  pullToParty,
  remainingSlots,
  sendToStorage,
  swapRoster,
} from './partyRules';

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

describe('roster moves', () => {
  const ids = (list: readonly { id: number }[]) => list.map((m) => m.id);

  it('sends a party member to the end of the storage list', () => {
    const result = sendToStorage(party(6), [member(151)], 4, 1);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.moved).toBe('sent');
    expect(ids(result.party)).toEqual([1, 2, 3, 5, 6]);
    expect(ids(result.storage)).toEqual([151, 4]);
  });

  it('refuses to store the lead, because a battle needs one', () => {
    const result = sendToStorage(party(6), [], 1, 1);

    expect(result).toEqual({ ok: false, reason: 'lead' });
  });

  it('refuses to leave the party empty even when nobody is the lead', () => {
    expect(sendToStorage(party(1), [], 1, null)).toEqual({ ok: false, reason: 'last-one' });
  });

  it('refuses to store a Pokémon that is not in the party', () => {
    expect(sendToStorage(party(3), [], 151, 1)).toEqual({ ok: false, reason: 'missing' });
  });

  it('pulls a stored Pokémon into the party while there is room', () => {
    const result = pullToParty(party(5), [member(151)], 151);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.moved).toBe('pulled');
    expect(ids(result.party)).toEqual([1, 2, 3, 4, 5, 151]);
    expect(result.storage).toEqual([]);
  });

  it('refuses to pull when the party is already full', () => {
    expect(pullToParty(party(6), [member(151)], 151)).toEqual({ ok: false, reason: 'party-full' });
  });

  it('swaps two members in place, keeping both list orders', () => {
    const result = swapRoster(party(6), [member(150), member(151)], 4, 151, 1);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.moved).toBe('swapped');
    expect(ids(result.party)).toEqual([1, 2, 3, 151, 5, 6]);
    expect(ids(result.storage)).toEqual([150, 4]);
  });

  it('refuses to swap the lead out of the party', () => {
    expect(swapRoster(party(6), [member(151)], 1, 151, 1)).toEqual({ ok: false, reason: 'lead' });
  });

  it('refuses a swap when either side is gone', () => {
    expect(swapRoster(party(6), [member(151)], 99, 151, 1)).toEqual({ ok: false, reason: 'missing' });
    expect(swapRoster(party(6), [member(151)], 4, 99, 1)).toEqual({ ok: false, reason: 'missing' });
  });

  it('never mutates the arrays it is given, on success or refusal', () => {
    const roster = party(6);
    const stored = [member(151)];

    swapRoster(roster, stored, 4, 151, 1);
    sendToStorage(roster, stored, 1, 1);
    pullToParty(roster, stored, 999);

    expect(ids(roster)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(ids(stored)).toEqual([151]);
  });
});
