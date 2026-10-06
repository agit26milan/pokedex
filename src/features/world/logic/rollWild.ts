import { POKEDEX } from '@/shared/data/dex';
import { pickOne, randomInt, type Rng } from '@/shared/lib/rng';

export interface WildEncounter {
  id: number;
  level: number;
}

const MIN_LEVEL = 2;
const LEVEL_SPREAD = 3;

export function wildLevelFor(partnerLevel: number, rng: Rng): number {
  const floor = Math.max(MIN_LEVEL, partnerLevel - 2);
  return randomInt(rng, floor, floor + LEVEL_SPREAD);
}

export function rollWild(rng: Rng, partnerLevel: number): WildEncounter {
  return { id: pickOne(rng, POKEDEX).id, level: wildLevelFor(partnerLevel, rng) };
}
