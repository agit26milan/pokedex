import { mulberry32, type Rng } from '@/shared/lib/rng';
import { isDamaging } from '@/shared/data/moves';
import { createSide } from './createSide';
import { resolveTurn, type BattleAction, type BattleSide, type BattleState } from './turnEngine';

const fixed = (value: number): Rng => () => value;

const charmander = createSide(4, 8)!;
const pikachu = createSide(25, 8)!;

const battle = (overrides: Partial<{ player: BattleSide; foe: BattleSide }> = {}): BattleState => ({
  player: overrides.player ?? charmander,
  foe: overrides.foe ?? pikachu,
  turn: 0,
  outcome: 'ongoing',
});

const withHp = (side: BattleSide, hp: number): BattleSide => ({ ...side, hp });

describe('resolveTurn — move selection', () => {
  it('rejects a move with no PP without consuming the turn', () => {
    const state = battle({
      player: { ...charmander, moves: charmander.moves.map((move) => ({ ...move, pp: 0 })) },
    });
    const result = resolveTurn(state, { kind: 'move', move: charmander.moves[0]!.name }, fixed(0));

    expect(result.state).toBe(state);
    expect(result.state.turn).toBe(0);
    expect(result.events[0]?.kind).toBe('nopp');
    expect(result.state.player.hp).toBe(state.player.hp);
  });

  it('lets the faster side strike first', () => {
    const slow = { ...createSide(1, 5)!, stats: { ...createSide(1, 5)!.stats, speed: 1 } };
    const result = resolveTurn(battle({ player: slow }), { kind: 'move', move: slow.moves[0]!.name }, fixed(0.5));
    const firstSide = result.events.find((event) => event.kind === 'move')?.side;

    expect(firstSide).toBe('foe');
  });

  it('resolves the player first when speeds are equal', () => {
    const twin = { ...charmander, stats: { ...charmander.stats, speed: pikachu.stats.speed } };
    const result = resolveTurn(battle({ player: twin }), { kind: 'move', move: twin.moves[0]!.name }, fixed(0.5));

    expect(result.events.find((event) => event.kind === 'move')?.side).toBe('player');
  });
});

describe('resolveTurn — other actions', () => {
  it('swaps the active Pokémon and hands the turn to the opponent', () => {
    const replacement = createSide(7, 8)!;
    const action: BattleAction = { kind: 'switch', to: replacement };
    const result = resolveTurn(battle(), action, fixed(0.5));

    expect(result.events[0]?.kind).toBe('switch');
    expect(result.state.player.id).toBe(7);
    expect(result.state.player.hp).toBeLessThan(replacement.maxHp);
    expect(result.state.turn).toBe(1);
  });

  it('spends a turn on a potion and heals no more than the missing HP', () => {
    const wounded = withHp(charmander, 1);
    const result = resolveTurn(battle({ player: wounded }), { kind: 'item', item: 'potion' }, fixed(0.5));

    expect(result.state.player.hp).toBeGreaterThan(1);
    expect(result.state.player.hp).toBeLessThanOrEqual(charmander.maxHp);
  });

  it('catches a weakened target and ends the battle', () => {
    const state = battle({ foe: withHp(pikachu, 1) });
    const result = resolveTurn(state, { kind: 'ball', ball: 'greatBall' }, fixed(0));

    expect(result.state.outcome).toBe('caught');
    expect(result.events.at(-1)?.kind).toBe('ball');
  });

  it('lets a throw fail and the opponent retaliate', () => {
    const state = battle({ foe: withHp(pikachu, pikachu.maxHp) });
    const result = resolveTurn(state, { kind: 'ball', ball: 'pokeBall' }, fixed(0.99));

    expect(result.state.outcome).toBe('ongoing');
    expect(result.events.some((event) => event.kind === 'ball')).toBe(true);
    expect(result.state.player.hp).toBeLessThan(state.player.hp);
  });

  it('flees on a successful run and stays on a failed one', () => {
    expect(resolveTurn(battle(), { kind: 'run' }, fixed(0.1)).state.outcome).toBe('fled');
    expect(resolveTurn(battle(), { kind: 'run' }, fixed(0.9)).state.outcome).toBe('ongoing');
  });
});

describe('resolveTurn — fainting and fallbacks', () => {
  it('declares a win when the foe reaches zero HP', () => {
    const state = battle({ foe: withHp(pikachu, 1) });
    const strong = { ...charmander, moves: [{ name: 'ember', pp: 25, maxPp: 25 }] };
    const result = resolveTurn(battle({ player: strong, foe: state.foe }), { kind: 'move', move: 'ember' }, fixed(0.9));

    expect(result.state.foe.hp).toBe(0);
    expect(result.state.outcome).toBe('won');
  });

  it('declares a loss when the active Pokémon faints', () => {
    const result = resolveTurn(battle({ player: withHp(charmander, 1) }), { kind: 'move', move: charmander.moves[0]!.name }, fixed(0));

    expect(result.state.player.hp).toBe(0);
    expect(result.state.outcome).toBe('lost');
  });

  it('lets a Pokémon with no damaging move still attack (Struggle fallback)', () => {
    const abra = createSide(63, 10)!;
    const learnset = abra.moves.map((move) => move.name).filter((name) => name !== 'struggle');

    expect(learnset.every((name) => !isDamaging(name))).toBe(true);
    expect(abra.moves.map((move) => move.name)).toContain('struggle');

    const result = resolveTurn(battle({ foe: abra }), { kind: 'move', move: charmander.moves[0]!.name }, fixed(0.5));
    const foeMove = result.events.find((event) => event.kind === 'move' && event.side === 'foe');

    expect(foeMove?.text).toContain('struggle');
  });

  it('ignores actions once the battle is over', () => {
    const finished: BattleState = { ...battle(), outcome: 'won' };
    const result = resolveTurn(finished, { kind: 'run' }, fixed(0));

    expect(result.state).toBe(finished);
    expect(result.events).toEqual([]);
  });
});

describe('resolveTurn — determinism', () => {
  it('replays identically for the same state, action and seed', () => {
    const action: BattleAction = { kind: 'move', move: charmander.moves[0]!.name };
    const first = resolveTurn(battle(), action, mulberry32(4242));
    const second = resolveTurn(battle(), action, mulberry32(4242));

    expect(first.state).toEqual(second.state);
    expect(first.events).toEqual(second.events);
  });
});
