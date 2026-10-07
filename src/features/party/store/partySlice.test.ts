import { evolutionFor, evolveMember } from '@/features/battle/logic/evolve';
import { createMember } from '@/features/party/store/partySlice';
import { createRunStore } from '@/store';

describe('updateMember and the leader', () => {
  it('keeps the lead on the evolved form, so the win still pays out XP', () => {
    const store = createRunStore();
    store.getState().choosePartner(1);
    const step = evolutionFor(1, 16);
    expect(step?.id).toBe(2);

    const evolved = evolveMember(store.getState().party[0]!, step!);
    expect(evolved?.id).toBe(2);

    store.getState().updateMember(0, evolved!);

    expect(store.getState().leaderId).toBe(2);
  });

  it('leaves the lead alone when a bench member changes', () => {
    const store = createRunStore();
    store.getState().choosePartner(1);
    store.getState().addCaught(createMember(4, 5)!);

    store.getState().updateMember(1, { ...store.getState().party[1]!, hp: 3 });

    expect(store.getState().leaderId).toBe(1);
  });

  it('does not invent a leader when none is set', () => {
    const store = createRunStore();
    store.setState({ party: [createMember(1, 5)!], leaderId: null });

    store.getState().updateMember(0, { ...store.getState().party[0]!, id: 7, name: 'squirtle' });

    expect(store.getState().leaderId).toBeNull();
  });
});

describe('swapLeader', () => {
  it('accepts a party member and rejects everyone else', () => {
    const store = createRunStore();
    store.getState().choosePartner(1);
    store.getState().addCaught(createMember(4, 5)!);

    store.getState().swapLeader(4);
    expect(store.getState().leaderId).toBe(4);

    store.getState().swapLeader(151);
    expect(store.getState().leaderId).toBe(4);
  });
});
