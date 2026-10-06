import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { persist } from 'zustand/middleware';
import { createStore, type StateCreator } from 'zustand/vanilla';

import { createPartySlice, INITIAL_BAG, type PartySlice } from '@/features/party/store/partySlice';
import { createPokedexSlice, type PokedexSlice } from '@/features/pokedex/store/pokedexSlice';
import { createWorldSlice, NEW_RUN_WORLD, type WorldSlice } from '@/features/world/store/worldSlice';
import { maxPpOf } from '@/shared/data/moves';
import { STORE_VERSION, zustandStorage } from '@/shared/lib/storage';

export type RunState = PartySlice & WorldSlice & PokedexSlice;

const runState: StateCreator<RunState> = (set, get, api) => ({
  ...createPartySlice(set, get, api),
  ...createWorldSlice(set, get, api),
  ...createPokedexSlice(set, get, api),
});

export const createRunStore = () => createStore<RunState>()(runState);

export function freshRun(): Partial<RunState> {
  return {
    party: [],
    storage: [],
    leaderId: null,
    bag: { ...INITIAL_BAG },
    ...NEW_RUN_WORLD,
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

/** v1 stored a member's moves as bare names; v2 stores { name, pp }. Upgrade in place, never drop the save. */
const upgradeMemberV1 = (member: unknown): unknown => {
  if (!isRecord(member) || !Array.isArray(member.moves)) return member;
  return {
    ...member,
    moves: member.moves.map((move) => (typeof move === 'string' ? { name: move, pp: maxPpOf(move) } : move)),
  };
};

const upgradeRunV1 = (value: unknown): unknown => {
  if (!isRecord(value)) return value;
  return {
    ...value,
    party: Array.isArray(value.party) ? value.party.map(upgradeMemberV1) : value.party,
    storage: Array.isArray(value.storage) ? value.storage.map(upgradeMemberV1) : value.storage,
  };
};

/** Exported so the upgrade path is unit-tested rather than trusted. */
export function migratePersisted(persisted: unknown, version: number): unknown {
  if (version >= STORE_VERSION) return persisted;
  if (version === 1) return upgradeRunV1(persisted);
  return freshRun();
}

export function isValidRun(value: unknown): value is Partial<RunState> {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<RunState>;
  if (!Array.isArray(candidate.party) || !Array.isArray(candidate.storage)) return false;
  if (typeof candidate.worldSeed !== 'number' || !Number.isFinite(candidate.worldSeed)) return false;
  if (typeof candidate.position?.x !== 'number' || typeof candidate.position?.y !== 'number') return false;
  if (!candidate.bag || typeof candidate.bag.pokeBall !== 'number' || typeof candidate.bag.potion !== 'number') return false;
  return candidate.party.every(
    (member) =>
      typeof member?.id === 'number' &&
      typeof member?.hp === 'number' &&
      Array.isArray(member?.moves) &&
      member.moves.every((slot) => typeof slot?.name === 'string' && typeof slot?.pp === 'number'),
  );
}

/** Exported so the fallback path is unit-tested rather than trusted. */
export function mergePersisted(persisted: unknown, current: RunState): RunState {
  if (!isValidRun(persisted)) return { ...current, ...freshRun() } as RunState;
  return { ...current, ...persisted };
}

export const useStore = create<RunState>()(
  persist(runState, {
    name: 'pokedex-quest/run',
    version: STORE_VERSION,
    storage: zustandStorage,
    partialize: (state) => ({
      party: state.party,
      storage: state.storage,
      bag: state.bag,
      leaderId: state.leaderId,
      worldSeed: state.worldSeed,
      position: state.position,
      steps: state.steps,
      encounterRisk: state.encounterRisk,
      firstEncounterDone: state.firstEncounterDone,
    }),
    migrate: migratePersisted,
    merge: mergePersisted,
  }),
);

export const useRunSelectorShallow = <T>(selector: (state: RunState) => T): T => useStore(useShallow(selector));

export function caughtIdsFrom(party: readonly { id: number }[], storage: readonly { id: number }[]): number[] {
  return [...new Set([...party, ...storage].map((member) => member.id))];
}

export const caughtIdsOf = (state: RunState): number[] => caughtIdsFrom(state.party, state.storage);
