import type { Rng } from '@/shared/lib/rng';
import { catchChance, MAX_CHANCE, MIN_CHANCE, rollCatch } from './catchRate';

const fixed = (value: number): Rng => () => value;
const base = { captureRate: 190, maxHp: 40, ballBonus: 1 };

describe('catchChance', () => {
  it('improves as the target loses HP', () => {
    const healthy = catchChance({ ...base, hp: 40 });
    const weakened = catchChance({ ...base, hp: 8 });
    const almostOut = catchChance({ ...base, hp: 1 });

    expect(weakened).toBeGreaterThan(healthy);
    expect(almostOut).toBeGreaterThan(weakened);
  });

  it('improves with a better ball', () => {
    expect(catchChance({ ...base, hp: 10, ballBonus: 1.5 })).toBeGreaterThan(catchChance({ ...base, hp: 10 }));
  });

  it('is bounded at both ends', () => {
    expect(catchChance({ captureRate: 1, maxHp: 300, hp: 300, ballBonus: 1 })).toBeGreaterThanOrEqual(MIN_CHANCE);
    expect(catchChance({ captureRate: 255, maxHp: 10, hp: 0, ballBonus: 1.5 })).toBeLessThanOrEqual(MAX_CHANCE);
  });

  it('never returns a probability outside 0..1', () => {
    for (const hp of [0, 1, 20, 39, 40]) {
      const chance = catchChance({ ...base, hp, ballBonus: 2 });
      expect(chance).toBeGreaterThan(0);
      expect(chance).toBeLessThanOrEqual(1);
    }
  });
});

describe('rollCatch', () => {
  it('catches exactly when the roll beats the chance', () => {
    const easy = { ...base, hp: 1, captureRate: 255 };
    expect(rollCatch(easy, fixed(0)).caught).toBe(true);
    expect(rollCatch({ ...base, hp: 40, captureRate: 3 }, fixed(0.999)).caught).toBe(false);
  });

  it('reports the chance it used so the UI cannot disagree with it', () => {
    const input = { ...base, hp: 10 };
    expect(rollCatch(input, fixed(0.5)).chance).toBe(catchChance(input));
  });
});
