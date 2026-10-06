import { PARTY_LIMIT, type PartyMember } from '../types';

export type Destination = 'party' | 'storage';

export interface RosterChange {
  party: PartyMember[];
  storage: PartyMember[];
  destination: Destination;
}

export const partyIsFull = (party: readonly PartyMember[]): boolean => party.length >= PARTY_LIMIT;

export const remainingSlots = (party: readonly PartyMember[]): number => Math.max(0, PARTY_LIMIT - party.length);

export const isInRoster = (
  party: readonly PartyMember[],
  storage: readonly PartyMember[],
  id: number,
): boolean => party.some((m) => m.id === id) || storage.some((m) => m.id === id);


export function placeInRoster(
  party: readonly PartyMember[],
  storage: readonly PartyMember[],
  member: PartyMember,
): RosterChange {
  if (!partyIsFull(party)) {
    return { party: [...party, member], storage: [...storage], destination: 'party' };
  }
  return { party: [...party], storage: [...storage, member], destination: 'storage' };
}
