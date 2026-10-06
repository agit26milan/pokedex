import { hashSeed, mulberry32, pickOne, randomInt, rollChance, type Rng } from './rng';

describe('mulberry32', () => {
  it('produces the same sequence for the same seed', () => {
    const a = mulberry32(12345);
    const b = mulberry32(12345);
    const first = [a(), a(), a(), a(), a()];
    const second = [b(), b(), b(), b(), b()];
    expect(first).toEqual(second);
  });

  it('produces different sequences for different seeds', () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    expect([a(), a(), a()]).not.toEqual([b(), b(), b()]);
  });

  it('stays within [0, 1)', () => {
    const rng = mulberry32(7);
    for (let i = 0; i < 500; i += 1) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('hashSeed', () => {
  it('is stable for the same inputs', () => {
    expect(hashSeed(42, -1, 3)).toBe(hashSeed(42, -1, 3));
  });

  it('changes when a coordinate changes', () => {
    expect(hashSeed(42, 0, 0)).not.toBe(hashSeed(42, 0, 1));
    expect(hashSeed(42, 0, 0)).not.toBe(hashSeed(43, 0, 0));
  });
});

describe('rollChance', () => {
  it('short-circuits the impossible and the certain', () => {
    const alwaysHalf: Rng = () => 0.5;
    expect(rollChance(alwaysHalf, 0)).toBe(false);
    expect(rollChance(alwaysHalf, 1)).toBe(true);
  });

  it('compares against the generated value', () => {
    expect(rollChance(() => 0.1, 0.2)).toBe(true);
    expect(rollChance(() => 0.3, 0.2)).toBe(false);
  });
});

describe('randomInt', () => {
  it('never leaves the inclusive range', () => {
    const rng = mulberry32(99);
    for (let i = 0; i < 300; i += 1) {
      const value = randomInt(rng, 3, 5);
      expect([3, 4, 5]).toContain(value);
    }
  });
});

describe('pickOne', () => {
  it('returns a member of the list', () => {
    expect(['a', 'b']).toContain(pickOne(() => 0.99, ['a', 'b']));
  });

  it('throws on an empty list', () => {
    expect(() => pickOne(() => 0.5, [])).toThrow('pickOne: empty list');
  });
});
