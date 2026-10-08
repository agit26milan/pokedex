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

export type RosterRefusal = 'lead' | 'last-one' | 'party-full' | 'missing';
export type RosterMoveKind = 'sent' | 'pulled' | 'swapped';

export type RosterOutcome =
  | { ok: true; moved: RosterMoveKind; party: PartyMember[]; storage: PartyMember[] }
  | { ok: false; reason: RosterRefusal };

const refused = (reason: RosterRefusal): RosterOutcome => ({ ok: false, reason });

export function sendToStorage(
  party: readonly PartyMember[],
  storage: readonly PartyMember[],
  id: number,
  leaderId: number | null,
): RosterOutcome {
  const member = party.find((current) => current.id === id);
  if (!member) return refused('missing');
  if (id === leaderId) return refused('lead');
  if (party.length <= 1) return refused('last-one');

  return {
    ok: true,
    moved: 'sent',
    party: party.filter((current) => current.id !== id),
    storage: [...storage, member],
  };
}

export function pullToParty(
  party: readonly PartyMember[],
  storage: readonly PartyMember[],
  id: number,
): RosterOutcome {
  const member = storage.find((current) => current.id === id);
  if (!member) return refused('missing');
  if (partyIsFull(party)) return refused('party-full');

  return {
    ok: true,
    moved: 'pulled',
    party: [...party, member],
    storage: storage.filter((current) => current.id !== id),
  };
}

export function swapRoster(
  party: readonly PartyMember[],
  storage: readonly PartyMember[],
  partyId: number,
  storageId: number,
  leaderId: number | null,
): RosterOutcome {
  const outgoing = party.find((current) => current.id === partyId);
  const incoming = storage.find((current) => current.id === storageId);
  if (!outgoing || !incoming) return refused('missing');
  if (partyId === leaderId) return refused('lead');

  return {
    ok: true,
    moved: 'swapped',
    party: party.map((current) => (current.id === partyId ? incoming : current)),
    storage: storage.map((current) => (current.id === storageId ? outgoing : current)),
  };
}
