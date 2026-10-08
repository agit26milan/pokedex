import { createMember } from '@/features/party/store/partySlice';
import type { PartyMember } from '../types';
import { leadOf } from './activeMember';

const member = (id: number, level: number, patch: Partial<PartyMember> = {}): PartyMember => ({
  ...createMember(id, level)!,
  ...patch,
});

describe('leadOf', () => {
  it('returns the chosen leader', () => {
    const party = [member(2, 16), member(99, 16)];
    expect(leadOf(party, 99)?.id).toBe(99);
  });

  it('falls back to the first member when no leader was picked', () => {
    const party = [member(2, 16), member(99, 16)];
    expect(leadOf(party, null)?.id).toBe(2);
  });

  it('skips a fainted leader so the battle never starts with a downed Pokémon', () => {
    const party = [member(2, 16), member(99, 16, { hp: 0 })];
    expect(leadOf(party, 99)?.id).toBe(2);
  });

  it('keeps a fainted leader when nobody is healthy, so the switch prompt still makes sense', () => {
    const party = [member(2, 16, { hp: 0 }), member(99, 16, { hp: 0 })];
    expect(leadOf(party, 99)?.id).toBe(99);
  });

  it('ignores a stale leader id left over from an evolution', () => {
    const party = [member(2, 16), member(99, 16)];
    expect(leadOf(party, 1)?.id).toBe(2);
  });

  it('returns undefined for an empty party', () => {
    expect(leadOf([], 1)).toBeUndefined();
  });
});
