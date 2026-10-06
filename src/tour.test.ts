import { createSide, sideFromMember } from '@/features/battle/logic/createSide';
import { resolveTurn, type BattleState } from '@/features/battle/logic/turnEngine';
import { createMember } from '@/features/party/store/partySlice';
import { ENCOUNTER_RATE, rollEncounter } from '@/features/world/logic/rollEncounter';
import { rollWild } from '@/features/world/logic/rollWild';
import { isBlocked, nextPosition, SPAWN, tileAt, type Direction } from '@/features/world/logic/world';
import { caughtIdsFrom, createRunStore } from '@/store';
import { mulberry32 } from '@/shared/lib/rng';

const DIRECTIONS: Direction[] = ['up', 'down', 'left', 'right'];

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

describe('the two-minute tour, end to end through the real store and logic', () => {
  it('runs partner → tall grass → encounter → battle → catch → glossary', () => {
    const store = createRunStore();
    const rng = mulberry32(20261006);

    store.getState().choosePartner(1);
    const partner = store.getState().party[0]!;
    expect(partner.name).toBe('bulbasaur');
    expect(partner.level).toBe(5);
    expect(partner.hp).toBe(partner.maxHp);

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

    const wild = rollWild(rng, partner.level);
    expect(wild.level).toBeLessThanOrEqual(partner.level + 3);
    const foe = createSide(wild.id, wild.level)!;
    expect(foe.hp).toBeGreaterThan(0);

    let battle: BattleState = { player: sideFromMember(partner)!, foe, turn: 0, outcome: 'ongoing' };
    const move = battle.player.moves[0]!.name;
    battle = resolveTurn(battle, { kind: 'move', move }, rng).state;
    expect(battle.foe.hp).toBeLessThan(foe.hp);

    if (battle.outcome === 'ongoing') battle = { ...battle, foe: { ...battle.foe, hp: 1 } };

    let caught = battle.outcome === 'caught';
    for (let attempt = 0; attempt < 20 && !caught && battle.outcome === 'ongoing'; attempt += 1) {
      battle = resolveTurn(battle, { kind: 'ball', ball: 'greatBall' }, rng).state;
      caught = battle.outcome === 'caught';
    }
    expect(caught).toBe(true);

    const gained = createMember(battle.foe.id, battle.foe.level)!;
    store.getState().addCaught({ ...gained, hp: Math.max(1, battle.foe.hp) });
    store.getState().markEncounterResolved();

    expect(store.getState().party.map((member) => member.id)).toEqual([1, battle.foe.id]);
    expect(caughtIdsFrom(store.getState().party, store.getState().storage)).toContain(battle.foe.id);
    expect(store.getState().pendingEncounter).toBeNull();
    expect(store.getState().encounterRisk).toBe(0);

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
