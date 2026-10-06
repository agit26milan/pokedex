import type { StateCreator } from 'zustand';

import { maxHpFor } from '@/features/battle/logic/stats';
import { getEntry, movesetFor } from '@/shared/data/dex';

export interface PartyMember {
  id: number;
  name: string;
  level: number;
  xp: number;
  hp: number;
  maxHp: number;
  moves: string[];
}

export interface Bag {
  pokeBall: number;
  greatBall: number;
  potion: number;
}

export type BagItem = keyof Bag;

export interface PartySlice {
  party: PartyMember[];
  storage: PartyMember[];
  bag: Bag;
  leaderId: number | null;
  choosePartner: (id: number) => void;
  addCaught: (member: PartyMember) => void;
  swapLeader: (id: number) => void;
  setMemberHp: (index: number, hp: number) => void;
  healParty: (fraction?: number) => void;
  spendItem: (item: BagItem) => boolean;
  grantItem: (item: BagItem, amount: number) => void;
}

export const PARTY_LIMIT = 6;
export const STARTER_IDS = [1, 4, 7] as const;
export const STARTER_LEVEL = 5;
export const INITIAL_BAG: Bag = { pokeBall: 10, greatBall: 2, potion: 3 };

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
    moves: movesetFor(entry, level),
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
    const { party, storage } = get();
    // The seventh catch goes to storage but still counts as caught in the Glossary.
    if (party.length < PARTY_LIMIT) {
      set({ party: [...party, member], leaderId: get().leaderId ?? member.id });
      return;
    }
    set({ storage: [...storage, member] });
  },

  swapLeader: (id) => {
    if (get().party.some((member) => member.id === id)) set({ leaderId: id });
  },

  setMemberHp: (index, hp) => {
    const party = get().party.map((member, i) =>
      i === index ? { ...member, hp: Math.max(0, Math.min(member.maxHp, hp)) } : member,
    );
    set({ party });
  },

  healParty: (fraction = 1) => {
    set({
      party: get().party.map((member) => ({
        ...member,
        hp: Math.min(member.maxHp, Math.max(member.hp, Math.round(member.maxHp * fraction))),
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
