import { mulberry32, type Rng } from '@/shared/lib/rng';
import { POKEDEX } from '@/shared/data/dex';
import { rollWild, wildLevelFor } from './rollWild';

const fixed = (value: number): Rng => () => value;

describe('wildLevelFor', () => {
  it.each([0, 0.25, 0.5, 0.75, 0.99])('keeps a level-5 partner facing levels 3 to 6 (%s)', (roll) => {
    const level = wildLevelFor(5, fixed(roll));
    expect(level).toBeGreaterThanOrEqual(3);
    expect(level).toBeLessThanOrEqual(6);
  });

  it('never drops below level 2 for a low-level partner', () => {
    for (const roll of [0, 0.5, 0.99]) expect(wildLevelFor(1, fixed(roll))).toBeGreaterThanOrEqual(2);
  });

  it('is deterministic for the same seed', () => {
    expect(rollWild(mulberry32(7), 5)).toEqual(rollWild(mulberry32(7), 5));
  });
});

describe('rollWild', () => {
  it('always returns a real Gen-1 entry with a plausible level', () => {
    const rng = mulberry32(99);
    const ids = new Set<number>();
    for (let i = 0; i < 200; i += 1) {
      const encounter = rollWild(rng, 5);
      ids.add(encounter.id);
      expect(POKEDEX.some((entry) => entry.id === encounter.id)).toBe(true);
      expect(encounter.level).toBeGreaterThanOrEqual(2);
      expect(encounter.level).toBeLessThanOrEqual(6);
    }
    expect(ids.size).toBeGreaterThan(50);
  });
});
