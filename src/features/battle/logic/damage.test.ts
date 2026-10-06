import type { Rng } from '@/shared/lib/rng';
import { getEntry } from '@/shared/data/dex';
import { computeDamage, pickStats } from './damage';
import { statsAt } from './stats';

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

// F1: before this fix every move resolved against attack/defence, so a special attacker hit like a physical one.
// Gengar (130 special attack / 65 attack) against Snorlax (65 defence / 110 special defence) is the cleanest probe:
// the two pairs point in opposite directions, so a special move must do more and a physical move must do less.
describe('damage class decides which stats fight', () => {
  const attacker = statsAt(getEntry(94)!, 30); // gengar
  const defender = statsAt(getEntry(143)!, 30); // snorlax

  it('a special move fights with special attack against special defence', () => {
    expect(pickStats(attacker, defender, 'special')).toEqual({
      attackerAttack: attacker.specialAttack,
      defenderDefense: defender.specialDefense,
    });
  });

  it('a physical move keeps attack against defence', () => {
    expect(pickStats(attacker, defender, 'physical')).toEqual({
      attackerAttack: attacker.attack,
      defenderDefense: defender.defense,
    });
  });

  it('a status move resolves as physical and then deals nothing', () => {
    expect(pickStats(attacker, defender, 'status')).toEqual({
      attackerAttack: attacker.attack,
      defenderDefense: defender.defense,
    });
  });

  it('makes a special attacker special, not physical', () => {
    const same = { attackerLevel: 30, movePower: 60, moveType: 'normal', attackerTypes: ['ghost'], defenderTypes: ['normal'] };
    const special = computeDamage({ ...same, ...pickStats(attacker, defender, 'special'), rng: fixed(0.5) });
    const physical = computeDamage({ ...same, ...pickStats(attacker, defender, 'physical'), rng: fixed(0.5) });

    expect(special.damage).toBeGreaterThan(physical.damage);
  });
});
