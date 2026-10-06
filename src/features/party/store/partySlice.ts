import type { StateCreator } from 'zustand';

import { maxHpFor } from '@/features/battle/logic/stats';
import { getEntry, movesetFor } from '@/shared/data/dex';
import { fullPp, toSlots } from '@/shared/data/moves';
import { placeInRoster } from '../logic/partyRules';
import {
  INITIAL_BAG,
  STARTER_IDS,
  STARTER_LEVEL,
  type Bag,
  type BagItem,
  type PartyMember,
} from '../types';

export type { Bag, BagItem, PartyMember } from '../types';
export { INITIAL_BAG, PARTY_LIMIT, STARTER_IDS, STARTER_LEVEL } from '../types';

export interface PartySlice {
  party: PartyMember[];
  storage: PartyMember[];
  bag: Bag;
  leaderId: number | null;
  choosePartner: (id: number) => void;
  addCaught: (member: PartyMember) => void;
  swapLeader: (id: number) => void;
  updateMember: (index: number, member: PartyMember) => void;
  setMemberHp: (index: number, hp: number) => void;
  healParty: (fraction?: number) => void;
  spendItem: (item: BagItem) => boolean;
  grantItem: (item: BagItem, amount: number) => void;
}

export function createMember(id: number, level: number): PartyMember | undefined {
  const entry = getEntry(id);
  if (!entry) return undefined;
  const maxHp = maxHpFor(entry, level);
  return {
    id: entry.id,
    name: entry.name,
    level,
    xp: level ** 3,
    hp: maxHp,
    maxHp,
    moves: toSlots(movesetFor(entry, level)),
  };
}

export function createStarter(id: number): PartyMember | undefined {
  if (!STARTER_IDS.includes(id as (typeof STARTER_IDS)[number])) return undefined;
  return createMember(id, STARTER_LEVEL);
}

export const createPartySlice: StateCreator<PartySlice, [], [], PartySlice> = (set, get) => ({
  party: [],
  storage: [],
  bag: { ...INITIAL_BAG },
  leaderId: null,

  choosePartner: (id) => {
    const member = createStarter(id);
    if (!member) return;
    set({ party: [member], leaderId: member.id });
  },

  addCaught: (member) => {
    const { party, storage, leaderId } = get();
    const change = placeInRoster(party, storage, member);
    set({
      party: change.party,
      storage: change.storage,
      leaderId: leaderId ?? member.id,
    });
  },

  swapLeader: (id) => {
    if (get().party.some((member) => member.id === id)) set({ leaderId: id });
  },

  updateMember: (index, member) => {
    set({ party: get().party.map((current, i) => (i === index ? member : current)) });
  },

  setMemberHp: (index, hp) => {
    set({
      party: get().party.map((member, i) =>
        i === index ? { ...member, hp: Math.max(0, Math.min(member.maxHp, hp)) } : member,
      ),
    });
  },

  healParty: (fraction = 1) => {
    set({
      party: get().party.map((member) => ({
        ...member,
        hp: Math.min(member.maxHp, Math.max(member.hp, Math.round(member.maxHp * fraction))),

        moves: fullPp(member.moves),
      })),
    });
  },

  spendItem: (item) => {
    const bag = get().bag;
    if (bag[item] <= 0) return false;
    set({ bag: { ...bag, [item]: bag[item] - 1 } });
    return true;
  },

  grantItem: (item, amount) => {
    const bag = get().bag;
    set({ bag: { ...bag, [item]: Math.max(0, bag[item] + amount) } });
  },
});
