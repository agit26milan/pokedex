import { rollChance, type Rng } from '@/shared/lib/rng';
import { ENCOUNTER_TILE, type TileType } from './world';

export const ENCOUNTER_RATE = 0.18;

export interface EncounterRoll {
  encounter: boolean;
  firstEncounterDone: boolean;
}

export interface EncounterInput {
  rng: Rng;
  tile: TileType;
  firstEncounterDone: boolean;
}

export function rollEncounter({ rng, tile, firstEncounterDone }: EncounterInput): EncounterRoll {
  if (tile !== ENCOUNTER_TILE) return { encounter: false, firstEncounterDone };

  if (!firstEncounterDone) return { encounter: true, firstEncounterDone: true };

  return { encounter: rollChance(rng, ENCOUNTER_RATE), firstEncounterDone };
}
