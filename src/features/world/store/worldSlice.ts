import type { StateCreator } from 'zustand';

import { movePlayer, SPAWN, type Direction, type Position, type TileType } from '@/features/world/logic/world';

export interface WorldSlice {
  worldSeed: number;
  position: Position;
  steps: number;
  encounterRisk: number;
  firstEncounterDone: boolean;
  pendingEncounter: TileType | null;
  walk: (direction: Direction) => boolean;
  stepInto: (tile: TileType) => void;
  markEncounterResolved: () => void;
  setPendingEncounter: (tile: TileType | null) => void;
}

export const DEFAULT_WORLD_SEED = 1_013_1987;
export const NEW_RUN_WORLD = {
  worldSeed: DEFAULT_WORLD_SEED,
  position: SPAWN,
  steps: 0,
  encounterRisk: 0,
  firstEncounterDone: false,
  pendingEncounter: null,
} as const;

export const createWorldSlice: StateCreator<WorldSlice, [], [], WorldSlice> = (set, get) => ({
  ...NEW_RUN_WORLD,

  walk: (direction) => {
    const result = movePlayer(get().worldSeed, get().position, direction);
    if (!result.moved) return false;
    set({ position: result.position, steps: get().steps + 1 });
    return true;
  },

  stepInto: (tile) => set({ pendingEncounter: tile }),

  markEncounterResolved: () => set({ encounterRisk: 0, pendingEncounter: null }),

  setPendingEncounter: (tile) => set({ pendingEncounter: tile }),
});
