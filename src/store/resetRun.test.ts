import { createMember } from '@/features/party/store/partySlice';
import { INITIAL_BAG } from '@/features/party/types';
import { createRunStore } from './index';

describe('resetRun', () => {
  it('wipes the run back to the state a fresh install would have', () => {
    const store = createRunStore();

    store.getState().choosePartner(1);
    store.getState().addCaught(createMember(4, 7)!);
    store.getState().spendItem('potion');
    store.getState().setPendingEncounter('tallGrass');
    store.getState().setQuery('pika');
    store.getState().toggleType('FIRE');
    store.getState().markFirstEncounterDone();

    expect(store.getState().party).toHaveLength(2);
    expect(store.getState().bag.potion).toBe(INITIAL_BAG.potion - 1);
    expect(store.getState().firstEncounterDone).toBe(true);

    store.getState().resetRun();

    const reset = store.getState();
    expect(reset.party).toEqual([]);
    expect(reset.storage).toEqual([]);
    expect(reset.leaderId).toBeNull();
    expect(reset.bag).toEqual(INITIAL_BAG);
    expect(reset.steps).toBe(0);
    expect(reset.pendingEncounter).toBeNull();
    expect(reset.firstEncounterDone).toBe(false);
    expect(reset.encounterRisk).toBe(0);
    expect(reset.query).toBe('');
    expect(reset.typeFilters).toEqual([]);
  });

  it('leaves the store usable, so a new run can be played straight after', () => {
    const store = createRunStore();

    store.getState().choosePartner(4);
    store.getState().resetRun();
    store.getState().choosePartner(7);

    expect(store.getState().party.map((member) => member.id)).toEqual([7]);
    expect(store.getState().party[0]!.moves.length).toBeGreaterThan(0);
    expect(store.getState().party[0]!.moves[0]!.pp).toBeGreaterThan(0);
  });

  it('empties storage again, so the party limit resets with the run', () => {
    const store = createRunStore();

    [1, 4, 7, 25, 16, 19].forEach((id) => store.getState().addCaught(createMember(id, 5)!));
    store.getState().addCaught(createMember(150, 50)!);
    expect(store.getState().storage).toHaveLength(1);

    store.getState().resetRun();

    expect(store.getState().storage).toEqual([]);
  });
});
