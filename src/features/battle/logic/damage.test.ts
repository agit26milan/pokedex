import type { Rng } from '@/shared/lib/rng';
import { computeDamage } from './damage';

const fixed = (value: number): Rng => () => value;

const base = {
  attackerLevel: 10,
  attackerAttack: 50,
  defenderDefense: 50,
  movePower: 40,
  moveType: 'normal',
  attackerTypes: ['normal'],
  defenderTypes: ['normal'],
};

describe('computeDamage', () => {
  it('deals nothing against an immune target, however strong the attacker', () => {
    const result = computeDamage({ ...base, attackerLevel: 100, attackerAttack: 400, moveType: 'normal', defenderTypes: ['ghost'], rng: fixed(0) });
    expect(result.damage).toBe(0);
    expect(result.effectiveness).toBe(0);
  });

  it('deals nothing for a status move', () => {
    expect(computeDamage({ ...base, movePower: 0, rng: fixed(0) }).damage).toBe(0);
  });

  it('never rounds a landed hit down to zero', () => {
    const result = computeDamage({ ...base, attackerAttack: 1, defenderDefense: 999, rng: fixed(0.99) });
    expect(result.damage).toBeGreaterThanOrEqual(1);
  });

  it('scales with level, attack and type advantage', () => {
    const weak = computeDamage({ ...base, rng: fixed(0.5) }).damage;
    const stronger = computeDamage({ ...base, attackerLevel: 30, attackerAttack: 120, rng: fixed(0.5) }).damage;
    const effective = computeDamage({ ...base, moveType: 'grass', defenderTypes: ['water'], rng: fixed(0.5) }).damage;

    expect(stronger).toBeGreaterThan(weak);
    expect(effective).toBeGreaterThan(weak);
  });

  it('hits harder on a critical', () => {
    const normal = computeDamage({ ...base, rng: fixed(0.9) });
    const critical = computeDamage({ ...base, rng: fixed(0) });

    expect(critical.critical).toBe(true);
    expect(normal.critical).toBe(false);
    expect(critical.damage).toBeGreaterThan(normal.damage);
  });

  it('is deterministic for the same RNG stream', () => {
    const a = computeDamage({ ...base, rng: fixed(0.42) });
    const b = computeDamage({ ...base, rng: fixed(0.42) });
    expect(a).toEqual(b);
  });
});
