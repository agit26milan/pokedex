import { maxPpOf } from '@/shared/data/moves';
import { STORE_VERSION } from '@/shared/lib/storage';
import { isValidRun, migratePersisted } from './index';

/** A save as version 1 wrote it: moves were bare names, and there was no PP anywhere. */
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
    // Guards the store against a save written by something that never went through the migration.
    expect(isValidRun(versionOneSave())).toBe(false);
  });
});
