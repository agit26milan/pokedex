import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { persist } from 'zustand/middleware';
import { createStore, type StateCreator } from 'zustand/vanilla';

import { createPartySlice, INITIAL_BAG, type PartySlice } from '@/features/party/store/partySlice';
import { createPokedexSlice, type PokedexSlice } from '@/features/pokedex/store/pokedexSlice';
import { createWorldSlice, NEW_RUN_WORLD, type WorldSlice } from '@/features/world/store/worldSlice';
import { STORE_VERSION, zustandStorage } from '@/shared/lib/storage';

export type RunState = PartySlice & WorldSlice & PokedexSlice;

const runState: StateCreator<RunState> = (set, get, api) => ({
  ...createPartySlice(set, get, api),
  ...createWorldSlice(set, get, api),
  ...createPokedexSlice(set, get, api),
});

/** Unpersisted store: tests and the reset flow use this shape. */
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

/** Shape check for anything coming back out of storage: a bad run must never crash the app. */
export function isValidRun(value: unknown): value is Partial<RunState> {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<RunState>;
  if (!Array.isArray(candidate.party) || !Array.isArray(candidate.storage)) return false;
  if (typeof candidate.worldSeed !== 'number' || !Number.isFinite(candidate.worldSeed)) return false;
  if (typeof candidate.position?.x !== 'number' || typeof candidate.position?.y !== 'number') return false;
  if (!candidate.bag || typeof candidate.bag.pokeBall !== 'number' || typeof candidate.bag.potion !== 'number') return false;
  return candidate.party.every((member) => typeof member?.id === 'number' && typeof member?.hp === 'number');
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
    // Battle state and list filters stay transient: a reload must never restore a
    // half-finished battle, and filters are not worth persisting.
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
    migrate: (persisted, version) =>
      version === STORE_VERSION ? (persisted as RunState) : (freshRun() as RunState),
    merge: mergePersisted,
  }),
);

export const useRunSelectorShallow = <T>(selector: (state: RunState) => T): T => useStore(useShallow(selector));

/** Caught = in the party or in storage. Derived, never stored twice. */
export function caughtIdsFrom(party: readonly { id: number }[], storage: readonly { id: number }[]): number[] {
  return [...new Set([...party, ...storage].map((member) => member.id))];
}

export const caughtIdsOf = (state: RunState): number[] => caughtIdsFrom(state.party, state.storage);
