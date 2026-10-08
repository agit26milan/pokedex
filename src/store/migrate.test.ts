import { maxPpOf } from '@/shared/data/moves';
import { STORE_VERSION } from '@/shared/lib/storage';
import { createRunStore, isValidRun, mergePersisted, migratePersisted } from './index';

const versionOneSave = () => ({
  party: [
    { id: 25, name: 'pikachu', level: 12, xp: 1728, hp: 30, maxHp: 40, moves: ['thundershock', 'growl'] },
  ],
  storage: [{ id: 1, name: 'bulbasaur', level: 5, xp: 125, hp: 12, maxHp: 19, moves: ['tackle'] }],
  leaderId: 25,
  bag: { pokeBall: 7, greatBall: 2, potion: 1 },
  worldSeed: 4242,
  position: { x: 3, y: -2 },
  steps: 41,
  encounterRisk: 0.18,
  firstEncounterDone: true,
});

describe('migratePersisted', () => {
  it('upgrades a version 1 save instead of throwing it away', () => {
    const upgraded = migratePersisted(versionOneSave(), 1) as ReturnType<typeof versionOneSave>;

    expect(upgraded.party[0]!.moves).toEqual([
      { name: 'thundershock', pp: maxPpOf('thundershock') },
      { name: 'growl', pp: maxPpOf('growl') },
    ]);
    expect(upgraded.storage[0]!.moves).toEqual([{ name: 'tackle', pp: maxPpOf('tackle') }]);
  });

  it('keeps the rest of the save intact while upgrading it', () => {
    const original = versionOneSave();
    const upgraded = migratePersisted(original, 1) as ReturnType<typeof versionOneSave>;

    expect(upgraded.party[0]!.hp).toBe(30);
    expect(upgraded.bag).toEqual(original.bag);
    expect(upgraded.position).toEqual(original.position);
    expect(upgraded.steps).toBe(41);
    expect(upgraded.worldSeed).toBe(4242);
  });

  it('produces a save that passes validation, so it is not dropped on load', () => {
    expect(isValidRun(migratePersisted(versionOneSave(), 1))).toBe(true);
  });

  it('leaves a current-version save untouched', () => {
    const current = { party: [], storage: [], worldSeed: 1, position: { x: 0, y: 0 }, bag: { pokeBall: 1, potion: 1 } };
    expect(migratePersisted(current, STORE_VERSION)).toBe(current);
  });

  it('falls back to a fresh run for an unknown version rather than guessing', () => {
    const output = migratePersisted({ party: 'nonsense' }, 0) as { party: unknown[]; storage: unknown[] };
    expect(output.party).toEqual([]);
    expect(output.storage).toEqual([]);
  });

  it('rejects a payload whose moves are still bare names at the current version', () => {

    expect(isValidRun(versionOneSave())).toBe(false);
  });
});

describe('upgrading the bag for version 3', () => {
  const versionTwoSave = () => ({
    party: [{ id: 25, name: 'pikachu', level: 12, xp: 1728, hp: 30, maxHp: 40, moves: [{ name: 'thundershock', pp: 30 }] }],
    storage: [],
    leaderId: 25,
    bag: { pokeBall: 7, greatBall: 2, potion: 1 },
    worldSeed: 4242,
    position: { x: 3, y: -2 },
    steps: 41,
    encounterRisk: 0.18,
    firstEncounterDone: true,
  });

  it('fills the new bag fields without wiping the run', () => {
    const upgraded = migratePersisted(versionTwoSave(), 2) as ReturnType<typeof versionTwoSave> & {
      bag: Record<string, number>;
    };

    expect(upgraded.party[0]!.hp).toBe(30);
    expect(upgraded.leaderId).toBe(25);
    expect(upgraded.position).toEqual({ x: 3, y: -2 });
    expect(upgraded.steps).toBe(41);
    expect(upgraded.worldSeed).toBe(4242);
    expect(upgraded.storage).toEqual([]);
    expect(upgraded.bag).toEqual({ pokeBall: 7, greatBall: 2, potion: 1, money: 100, hyperPotion: 1 });
    expect(isValidRun(upgraded)).toBe(true);
  });

  it('keeps money a save already carries', () => {
    const save = { ...versionTwoSave(), bag: { pokeBall: 1, greatBall: 0, potion: 2, money: 55, hyperPotion: 4 } };

    const upgraded = migratePersisted(save, 2) as { bag: Record<string, number> };

    expect(upgraded.bag.money).toBe(55);
    expect(upgraded.bag.hyperPotion).toBe(4);
    expect(upgraded.bag.pokeBall).toBe(1);
  });

  it('fills a bag that still arrives without money when the save is merged', () => {
    const merged = mergePersisted(versionTwoSave(), createRunStore().getState());

    expect(merged.bag.money).toBe(100);
    expect(merged.bag.hyperPotion).toBe(1);
    expect(merged.bag.potion).toBe(1);
  });
});
