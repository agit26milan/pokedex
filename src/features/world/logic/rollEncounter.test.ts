import type { Rng } from '@/shared/lib/rng';
import { ENCOUNTER_RATE, rollEncounter, wildLevelFor } from './rollEncounter';

const fixed = (value: number): Rng => () => value;

describe('rollEncounter', () => {
  it('never triggers outside tall grass, even on a perfect roll', () => {
    expect(rollEncounter({ rng: fixed(0), tile: 'grass', firstEncounterDone: true }).encounter).toBe(false);
    expect(rollEncounter({ rng: fixed(0), tile: 'path', firstEncounterDone: true }).encounter).toBe(false);
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
    const result = rollEncounter({ rng: fixed(0.5), tile: 'tallGrass', firstEncounterDone: true });
    expect(result.firstEncounterDone).toBe(true);
  });

  it('exposes a rate that matches the spec', () => {
    expect(ENCOUNTER_RATE).toBe(0.18);
  });
});

describe('wildLevelFor', () => {
  it('stays in a beatable band around the partner level', () => {
    for (const roll of [0, 0.25, 0.5, 0.75, 0.99]) {
      const level = wildLevelFor(5, fixed(roll));
      expect(level).toBeGreaterThanOrEqual(3);
      expect(level).toBeLessThanOrEqual(6);
    }
  });

  it('never drops below level 2 for a low-level partner', () => {
    for (const roll of [0, 0.5, 0.99]) expect(wildLevelFor(1, fixed(roll))).toBeGreaterThanOrEqual(2);
  });
});
