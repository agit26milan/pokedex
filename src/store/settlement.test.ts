import { createMember } from '@/features/party/store/partySlice';
import { caughtIdsFrom, createRunStore } from './index';

const SIX_IDS = [1, 4, 7, 25, 16, 19];

describe('catch settlement', () => {
  it('adds the caught Pokémon to the party while there is room, leaving the leader alone', () => {
    const store = createRunStore();
    store.setState({ party: [createMember(1, 5)!], leaderId: 1 });

    store.getState().addCaught(createMember(16, 4)!);

    expect(store.getState().party.map((member) => member.id)).toEqual([1, 16]);
    expect(store.getState().leaderId).toBe(1);
  });

  it('sends the seventh catch to storage and still marks it caught in the Glossary', () => {
    const store = createRunStore();
    store.setState({ party: SIX_IDS.map((id) => createMember(id, 5)!), leaderId: 1 });

    store.getState().addCaught(createMember(150, 10)!);

    const { party, storage } = store.getState();
    expect(party).toHaveLength(6);
    expect(storage.map((member) => member.id)).toEqual([150]);
    expect(caughtIdsFrom(party, storage)).toContain(150);
    expect(caughtIdsFrom(party, storage)).toHaveLength(7);
  });

  it('keeps a caught Pokémon at the HP it was caught with, without a free full heal', () => {
    const store = createRunStore();
    const caught = { ...createMember(16, 4)!, hp: 3 };

    store.getState().addCaught(caught);

    expect(store.getState().party[0]!.hp).toBe(3);
  });

  it('makes the first caught Pokémon the leader when the party was empty', () => {
    const store = createRunStore();
    store.getState().addCaught(createMember(16, 4)!);

    expect(store.getState().leaderId).toBe(16);
  });
});
