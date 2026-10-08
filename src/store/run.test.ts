import { createMember, INITIAL_BAG, PARTY_LIMIT } from '@/features/party/store/partySlice';
import { isBlocked, nextPosition, SPAWN, tileAt, type Direction, type Position } from '@/features/world/logic/world';
import { caughtIdsOf, createRunStore, freshRun } from './index';

const store = () => createRunStore();
const DIRECTIONS: Direction[] = ['up', 'down', 'left', 'right'];

/** The spawn is always a path, so its neighbours depend entirely on the seed. */
const neighbourType = (seed: number, from: Position, direction: Direction) => {
  const target = nextPosition(from, direction);
  return tileAt(seed, target.x, target.y);
};

const openAtSpawn = (seed: number): Direction => {
  const found = DIRECTIONS.find((direction) => !isBlocked(neighbourType(seed, SPAWN, direction)));
  if (!found) throw new Error('this seed leaves the spawn with no walkable neighbour');
  return found;
};

const blockedEdge = (seed: number): { from: Position; direction: Direction } => {
  for (let y = SPAWN.y - 30; y <= SPAWN.y + 30; y += 1) {
    for (let x = SPAWN.x - 30; x <= SPAWN.x + 30; x += 1) {
      for (const direction of DIRECTIONS) {
        if (isBlocked(neighbourType(seed, { x, y }, direction))) return { from: { x, y }, direction };
      }
    }
  }
  throw new Error('no water or rock next to any tile near the spawn');
};

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
    // Exactly one step: walking all four directions in turn cancels out and lands back on the spawn.
    const direction = openAtSpawn(run.getState().worldSeed);

    expect(run.getState().walk(direction)).toBe(true);
    expect(run.getState().steps).toBe(1);
    expect(run.getState().position).toEqual(nextPosition(SPAWN, direction));
  });

  it('refuses a step into water or rock and does not count it', () => {
    const run = store();
    // The spawn is ringed by walkable tiles, so hunt for a tile that does border water
    // or rock instead of assuming one sits next door.
    const edge = blockedEdge(run.getState().worldSeed);

    run.setState({ position: edge.from, steps: 3 });

    expect(run.getState().walk(edge.direction)).toBe(false);
    expect(run.getState().position).toEqual(edge.from);
    expect(run.getState().steps).toBe(3);
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
