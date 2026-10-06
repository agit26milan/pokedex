import type { Rng } from '@/shared/lib/rng';
import { createSide } from './createSide';
import { consumedFrom, POTION_HEAL, resolveTurn, type BattleState } from './turnEngine';

const fixed = (value: number): Rng => () => value;

const battle = (playerHp?: number): BattleState => {
  const player = createSide(1, 10)!; // bulbasaur
  const foe = createSide(19, 8)!; // rattata
  return { player: playerHp === undefined ? player : { ...player, hp: playerHp }, foe, turn: 0, outcome: 'ongoing' };
};

const textOf = (events: readonly { text: string }[]): string => events.map((event) => event.text).join(' | ');

describe('item consumption signal', () => {
  it('refuses a potion at full HP, consumes nothing and costs no turn', () => {
    const result = resolveTurn(battle(), { kind: 'item', item: 'potion' }, fixed(0.5));

    expect(consumedFrom(result.events)).toBe(false);
    expect(textOf(result.events)).toMatch(/already at full HP/);
    expect(result.state.player.hp).toBe(result.state.player.maxHp);
    expect(result.state.turn).toBe(0);
  });

  it('heals and reports consumption when the Pokémon is hurt', () => {
    const result = resolveTurn(battle(5), { kind: 'item', item: 'potion' }, fixed(0.5));

    expect(consumedFrom(result.events)).toBe(true);
    expect(textOf(result.events)).toMatch(new RegExp(`recovered \\d+ HP`));
    expect(result.state.player.hp).toBeGreaterThan(5);
    expect(result.state.turn).toBe(1);
  });

  it('never heals past the maximum, and still charges for what it did heal', () => {
    const player = createSide(1, 10)!;
    const nearlyFull = battle(player.maxHp - 1);
    const result = resolveTurn(nearlyFull, { kind: 'item', item: 'potion' }, fixed(0.5));

    expect(consumedFrom(result.events)).toBe(true);
    expect(textOf(result.events)).toMatch(new RegExp(`recovered 1 HP`));
    expect(result.state.player.hp).toBeLessThanOrEqual(player.maxHp);
    expect(POTION_HEAL).toBeGreaterThan(1);
  });

  it('marks a ball as consumed whether it catches or not', () => {
    const caught = resolveTurn(battle(1), { kind: 'ball', ball: 'pokeBall' }, fixed(0));
    expect(consumedFrom(caught.events)).toBe(true);
    expect(caught.state.outcome).toBe('caught');

    // Enough HP that the wild's answering attack cannot end the battle, so the assertion is about the ball.
    const failed = resolveTurn(battle(20), { kind: 'ball', ball: 'pokeBall' }, fixed(0.99));
    expect(consumedFrom(failed.events)).toBe(true);
    expect(failed.state.outcome).toBe('ongoing');
    expect(textOf(failed.events)).toMatch(/broke free/);
  });

  it('does not report a consumed item when the player simply runs', () => {
    expect(consumedFrom(resolveTurn(battle(), { kind: 'run' }, fixed(0)).events)).toBe(false);
  });
});
