import { createMember, INITIAL_BAG, PARTY_LIMIT } from '@/features/party/store/partySlice';
import { isBlocked, nextPosition, SPAWN, tileAt, type Direction } from '@/features/world/logic/world';
import { caughtIdsOf, createRunStore, freshRun } from './index';

const store = () => createRunStore();
const DIRECTIONS: Direction[] = ['up', 'down', 'left', 'right'];

describe('party slice', () => {
  it('starts empty with the documented starter kit', () => {
    const state = store().getState();
    expect(state.party).toEqual([]);
    expect(state.leaderId).toBeNull();
    expect(state.bag).toEqual(INITIAL_BAG);
  });

  it('accepts only a real starter as partner', () => {
    const run = store();
    run.getState().choosePartner(25);
    expect(run.getState().party).toHaveLength(0);

    run.getState().choosePartner(1);
    expect(run.getState().party).toHaveLength(1);
    expect(run.getState().leaderId).toBe(1);
    expect(run.getState().party[0]).toMatchObject({ name: 'bulbasaur', level: 5 });
    expect(run.getState().party[0]?.hp).toBe(run.getState().party[0]?.maxHp);
  });

  it('sends the seventh Pokémon to storage but keeps it caught', () => {
    const run = store();
    for (const id of [1, 2, 3, 4, 5, 6, 7]) {
      const member = createMember(id, 5);
      if (member) run.getState().addCaught(member);
    }
    expect(run.getState().party).toHaveLength(PARTY_LIMIT);
    expect(run.getState().storage.map((member) => member.id)).toEqual([7]);
    expect(caughtIdsOf(run.getState()).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('never spends an item the bag does not hold', () => {
    const run = store();
    for (let i = 0; i < INITIAL_BAG.potion; i += 1) expect(run.getState().spendItem('potion')).toBe(true);
    expect(run.getState().bag.potion).toBe(0);
    expect(run.getState().spendItem('potion')).toBe(false);
    expect(run.getState().bag.potion).toBe(0);
  });

  it('clamps granted items at zero', () => {
    const run = store();
    run.getState().grantItem('greatBall', -99);
    expect(run.getState().bag.greatBall).toBe(0);
  });

  it('heals at least to the requested fraction without exceeding max HP', () => {
    const run = store();
    run.getState().choosePartner(4);
    run.getState().setMemberHp(0, 1);
    run.getState().healParty(0.5);
    const member = run.getState().party[0];
    expect(member?.hp).toBe(Math.round((member?.maxHp ?? 0) * 0.5));
    run.getState().healParty(1);
    expect(run.getState().party[0]?.hp).toBe(run.getState().party[0]?.maxHp);
  });

  it('clamps hp between 0 and max HP', () => {
    const run = store();
    run.getState().choosePartner(4);
    run.getState().setMemberHp(0, -50);
    expect(run.getState().party[0]?.hp).toBe(0);
    run.getState().setMemberHp(0, 9999);
    expect(run.getState().party[0]?.hp).toBe(run.getState().party[0]?.maxHp);
  });
});

describe('world slice', () => {
  it('walks one step and counts it', () => {
    const run = store();
    const moved = DIRECTIONS.filter((direction) => run.getState().walk(direction));
    expect(moved.length).toBeGreaterThan(0);
    expect(run.getState().steps).toBe(moved.length);
    expect(run.getState().position).not.toEqual(SPAWN);
  });

  it('refuses a step into water or rock and does not count it', () => {
    const run = store();
    const seed = run.getState().worldSeed;
    const blocked = DIRECTIONS.find((direction) => {
      const target = nextPosition(SPAWN, direction);
      return isBlocked(tileAt(seed, target.x, target.y));
    });

    expect(run.getState().walk(blocked as Direction)).toBe(false);
    expect(run.getState().position).toEqual(SPAWN);
    expect(run.getState().steps).toBe(0);
  });

  it('resets the encounter risk when an encounter resolves', () => {
    const run = store();
    run.getState().stepInto('tallGrass');
    expect(run.getState().pendingEncounter).toBe('tallGrass');
    run.getState().markEncounterResolved();
    expect(run.getState().pendingEncounter).toBeNull();
    expect(run.getState().encounterRisk).toBe(0);
  });
});

describe('freshRun', () => {
  it('describes a clean slate that carries no party and no steps', () => {
    const fresh = freshRun();
    expect(fresh.party).toEqual([]);
    expect(fresh.storage).toEqual([]);
    expect(fresh.steps).toBe(0);
    expect(fresh.firstEncounterDone).toBe(false);
  });
});
