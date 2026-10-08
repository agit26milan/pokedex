import type { StateCreator } from 'zustand';

import { maxHpFor } from '@/features/battle/logic/stats';
import { getEntry, movesetFor } from '@/shared/data/dex';
import { fullPp, toSlots } from '@/shared/data/moves';
import { placeInRoster, pullToParty, sendToStorage, swapRoster, type RosterOutcome } from '../logic/partyRules';
import { buyItem as purchase, type BuyOutcome } from '../logic/shop';
import {
  INITIAL_BAG,
  REVIVE_HP,
  STARTER_IDS,
  STARTER_LEVEL,
  type Bag,
  type BagItem,
  type BuyableItem,
  type PartyMember,
} from '../types';

export type { Bag, BagItem, PartyMember } from '../types';
export { INITIAL_BAG, PARTY_LIMIT, REVIVE_HP, STARTER_IDS, STARTER_LEVEL } from '../types';

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
  reviveMember: (id: number) => boolean;
  healParty: (fraction?: number) => void;
  spendItem: (item: BagItem) => boolean;
  grantItem: (item: BagItem, amount: number) => void;
  rewardPotion: (number: number) => void;
  moveToStorage: (id: number) => RosterOutcome;
  moveToParty: (id: number) => RosterOutcome;
  swapWithStorage: (partyId: number, storageId: number) => RosterOutcome;
  addMoney: (amount: number) => void;
  buyItem: (item: BuyableItem, qty: number) => BuyOutcome;
  healMember: (id: number) => boolean;
  releasePokemon: (id: number[]) => void;
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
    const { party, leaderId } = get();
    const previous = party[index];
    set({
      party: party.map((current, i) => (i === index ? member : current)),
      leaderId: previous && previous.id === leaderId ? member.id : leaderId,
    });
  },

  setMemberHp: (index, hp) => {
    set({
      party: get().party.map((member, i) =>
        i === index ? { ...member, hp: Math.max(0, Math.min(member.maxHp, hp)) } : member,
      ),
    });
  },
 
  reviveMember: (id: number) => {
    const { party, bag } = get();
    const index = party.findIndex((member) => member.id === id);
    let potion = bag.potion;
    let name = 'potion';
    if (potion <= 0) {
      potion = bag.hyperPotion;
      name = 'hyperPotion';
    }
    if (index < 0 || potion <= 0 || party[index]!.hp > 0) return false;

    const revivedHp = Math.round(party[index]!.maxHp * REVIVE_HP);
    set({
      bag: { ...bag, [name]: bag[name as keyof Bag] - 1 },
      party: party.map((member, i) => (i === index ? { ...member, hp: revivedHp } : member)),
    });
    return true;
  },

  healMember: (id:number) => {
    const { party, bag } = get();
    const index = party.findIndex((member) => member.id === id);
    let name = 'potion';
    let potion = bag.potion;
    if (potion <= 0) {
      potion = bag.hyperPotion;
      name = 'hyperPotion';
    }
    if (index < 0 || potion <= 0 || party[index]!.hp >= party[index]!.maxHp) return false;
    const healedHp = Math.round(party[index]!.maxHp * REVIVE_HP);
    set({
      bag: { ...bag, [name as keyof Bag]: bag[name as keyof Bag] - 1 },
      party: party.map((member, i) => (i === index ? { ...member, hp: member.hp + healedHp } : member)),
    });
    return true;
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

  rewardPotion: (number: number) => {
    const bag = get().bag;
    set({ bag: { ...bag, potion: bag.potion + number } });
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

  moveToStorage: (id) => {
    const outcome = sendToStorage(get().party, get().storage, id, get().leaderId);
    if (outcome.ok) set({ party: outcome.party, storage: outcome.storage });
    return outcome;
  },

  moveToParty: (id) => {
    const outcome = pullToParty(get().party, get().storage, id);
    if (outcome.ok) set({ party: outcome.party, storage: outcome.storage });
    return outcome;
  },

  swapWithStorage: (partyId, storageId) => {
    const outcome = swapRoster(get().party, get().storage, partyId, storageId, get().leaderId);
    if (outcome.ok) set({ party: outcome.party, storage: outcome.storage });
    return outcome;
  },
  addMoney: (amount: number) => {
    const bag = get().bag;
    set({ bag: { ...bag, money: Math.max(0, bag.money + amount) } });
  },
  buyItem: (item, qty) => {
    const outcome = purchase(get().bag, item, qty);
    if (outcome.ok) set({ bag: outcome.bag });
    return outcome;
  },
  releasePokemon: (id: number[]) => {
    const { storage, party } = get();
    console.log(party, storage,id, 'party')
    const newStorage = storage.filter((member) => !id.includes(member.id));
    set({  storage: newStorage });
  }
});
