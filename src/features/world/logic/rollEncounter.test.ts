import type { Rng } from '@/shared/lib/rng';
import { ENCOUNTER_RATE, rollEncounter } from './rollEncounter';

const fixed = (value: number): Rng => () => value;

describe('rollEncounter', () => {
  it('never triggers outside tall grass, even on a perfect roll', () => {
    expect(rollEncounter({ rng: fixed(0), tile: 'grass', firstEncounterDone: true }).encounter).toBe(false);
    expect(rollEncounter({ rng: fixed(0), tile: 'path', firstEncounterDone: true }).encounter).toBe(false);
    expect(rollEncounter({ rng: fixed(0), tile: 'water', firstEncounterDone: false }).encounter).toBe(false);
  });

  it('always triggers on the first tall grass step of a run', () => {
    const result = rollEncounter({ rng: fixed(0.99), tile: 'tallGrass', firstEncounterDone: false });
    expect(result.encounter).toBe(true);
    expect(result.firstEncounterDone).toBe(true);
  });

  it('uses the configured rate afterwards', () => {
    expect(rollEncounter({ rng: fixed(0.1), tile: 'tallGrass', firstEncounterDone: true }).encounter).toBe(true);
    expect(rollEncounter({ rng: fixed(0.5), tile: 'tallGrass', firstEncounterDone: true }).encounter).toBe(false);
  });

  it('keeps the flag set once the guaranteed encounter has happened', () => {
    expect(rollEncounter({ rng: fixed(0.5), tile: 'tallGrass', firstEncounterDone: true }).firstEncounterDone).toBe(true);
  });

  it('exposes a rate that matches the spec', () => {
    expect(ENCOUNTER_RATE).toBe(0.18);
  });
});
