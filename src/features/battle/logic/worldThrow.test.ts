import { mulberry32, type Rng } from '@/shared/lib/rng';
import { throwBall } from './worldThrow';

const fixed = (value: number): Rng => () => value;

describe('throwBall', () => {
  it('returns undefined outside the dex, so a ball can never be spent on nothing', () => {
    expect(throwBall(999, 'pokeBall', fixed(0.5))).toBeUndefined();
    expect(throwBall(0, 'greatBall', fixed(0.5))).toBeUndefined();
  });

  it('catches when the roll beats the odds and fails when it does not', () => {
    expect(throwBall(16, 'pokeBall', fixed(0))?.caught).toBe(true); // pidgey is easy
    expect(throwBall(16, 'pokeBall', fixed(0.99))?.caught).toBe(false);
  });

  it('keeps the odds inside the engine floor and ceiling', () => {
    const easy = throwBall(16, 'pokeBall', fixed(0.5))!;
    const hard = throwBall(150, 'pokeBall', fixed(0.5))!; // mewtwo

    expect(easy.chance).toBeLessThanOrEqual(0.95);
    expect(hard.chance).toBeGreaterThanOrEqual(0.03);
    expect(easy.chance).toBeGreaterThan(hard.chance);
  });

  it('gives a great ball better odds than a Poké Ball', () => {
    const poke = throwBall(1, 'pokeBall', fixed(0.5))!;
    const great = throwBall(1, 'greatBall', fixed(0.5))!;

    expect(great.chance).toBeGreaterThan(poke.chance);
  });

  it('is deterministic for the same stream', () => {
    expect(throwBall(25, 'pokeBall', mulberry32(7))).toEqual(throwBall(25, 'pokeBall', mulberry32(7)));
  });
});
