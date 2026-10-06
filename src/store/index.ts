import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { persist } from 'zustand/middleware';
import { createStore, type StateCreator } from 'zustand/vanilla';

import { createPartySlice, type PartySlice } from '@/features/party/store/partySlice';
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
    ...NEW_RUN_WORLD,
  };
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
  }),
);

export const useRunSelectorShallow = <T>(selector: (state: RunState) => T): T => useStore(useShallow(selector));

/** Caught = in the party or in storage. Derived, never stored twice. */
export function caughtIdsOf(state: RunState): number[] {
  return [...new Set([...state.party, ...state.storage].map((member) => member.id))];
}
