import { createSide, sideFromMember } from '@/features/battle/logic/createSide';
import { resolveTurn, type BattleState } from '@/features/battle/logic/turnEngine';
import { createMember } from '@/features/party/store/partySlice';
import { ENCOUNTER_RATE, rollEncounter } from '@/features/world/logic/rollEncounter';
import { rollWild } from '@/features/world/logic/rollWild';
import { isBlocked, nextPosition, SPAWN, tileAt, type Direction } from '@/features/world/logic/world';
import { caughtIdsFrom, createRunStore } from '@/store';
import { mulberry32 } from '@/shared/lib/rng';

const DIRECTIONS: Direction[] = ['up', 'down', 'left', 'right'];

/** A walkable tile with tall grass right next to it, found from the seed rather than hard-coded. */
function findTallGrassStep(seed: number) {
  for (let y = SPAWN.y - 8; y <= SPAWN.y + 8; y += 1) {
    for (let x = SPAWN.x - 8; x <= SPAWN.x + 8; x += 1) {
      if (isBlocked(tileAt(seed, x, y))) continue;
      for (const direction of DIRECTIONS) {
        if (tileAt(seed, nextPosition({ x, y }, direction).x, nextPosition({ x, y }, direction).y) === 'tallGrass') {
          return { position: { x, y }, direction };
        }
      }
    }
  }
  throw new Error('the seeded world has no tall grass near spawn');
}

/**
 * The whole two-minute tour, headless: partner → tall grass → encounter → battle → catch → glossary.
 * Every step goes through the same store actions and pure logic the screens call, so this fails if
 * the product loop breaks even when each unit still passes on its own.
 */
describe('the two-minute tour, end to end through the real store and logic', () => {
  it('runs partner → tall grass → encounter → battle → catch → glossary', () => {
    const store = createRunStore();
    const rng = mulberry32(20261006);

    // 1. Choose a partner.
    store.getState().choosePartner(1);
    const partner = store.getState().party[0]!;
    expect(partner.name).toBe('bulbasaur');
    expect(partner.level).toBe(5);
    expect(partner.hp).toBe(partner.maxHp);

    // 2. Step into tall grass: the first one must encounter, whatever the RNG says.
    const { position, direction } = findTallGrassStep(store.getState().worldSeed);
    store.setState({ position });
    expect(store.getState().walk(direction)).toBe(true);

    const landed = nextPosition(position, direction);
    const tile = tileAt(store.getState().worldSeed, landed.x, landed.y);
    const roll = rollEncounter({ rng, tile, firstEncounterDone: store.getState().firstEncounterDone });
    expect(roll.encounter).toBe(true);
    expect(store.getState().steps).toBe(1);

    store.getState().markFirstEncounterDone();
    store.getState().setPendingEncounter(tile);

    // 3. A wild Pokémon appears, at a level the partner can actually beat.
    const wild = rollWild(rng, partner.level);
    expect(wild.level).toBeLessThanOrEqual(partner.level + 3);
    const foe = createSide(wild.id, wild.level)!;
    expect(foe.hp).toBeGreaterThan(0);

    // 4. Land one real turn to prove the engine runs inside this flow...
    let battle: BattleState = { player: sideFromMember(partner)!, foe, turn: 0, outcome: 'ongoing' };
    const move = battle.player.moves[0]!.name;
    battle = resolveTurn(battle, { kind: 'move', move }, rng).state;
    expect(battle.foe.hp).toBeLessThan(foe.hp);

    // ...then treat it as weakened. Chipping a foe to exactly 1 HP depends on damage rolls, which
    // the engine tests already cover; this test is about the catch reaching the rest of the game.
    if (battle.outcome === 'ongoing') battle = { ...battle, foe: { ...battle.foe, hp: 1 } };

    // 5. Throw balls until it is caught, then settle the catch the way the screen does.
    let caught = battle.outcome === 'caught';
    for (let attempt = 0; attempt < 20 && !caught && battle.outcome === 'ongoing'; attempt += 1) {
      battle = resolveTurn(battle, { kind: 'ball', ball: 'greatBall' }, rng).state;
      caught = battle.outcome === 'caught';
    }
    expect(caught).toBe(true);

    const gained = createMember(battle.foe.id, battle.foe.level)!;
    store.getState().addCaught({ ...gained, hp: Math.max(1, battle.foe.hp) });
    store.getState().markEncounterResolved();

    // 6. The catch shows up in the party and therefore in the glossary.
    expect(store.getState().party.map((member) => member.id)).toEqual([1, battle.foe.id]);
    expect(caughtIdsFrom(store.getState().party, store.getState().storage)).toContain(battle.foe.id);
    expect(store.getState().pendingEncounter).toBeNull();
    expect(store.getState().encounterRisk).toBe(0);

    // 7. And the run state that a reload would restore is coherent.
    const restored = store.getState();
    expect(restored.firstEncounterDone).toBe(true);
    expect(restored.party.every((member) => member.hp > 0)).toBe(true);
  });

  it('keeps the risk meter honest after an encounter that did not happen', () => {
    const store = createRunStore();
    const start = store.getState().encounterRisk;

    store.getState().setEncounterRisk(start + ENCOUNTER_RATE);
    expect(store.getState().encounterRisk).toBeCloseTo(ENCOUNTER_RATE);

    store.getState().markEncounterResolved();
    expect(store.getState().encounterRisk).toBe(0);
  });
});
