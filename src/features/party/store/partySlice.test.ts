import { evolutionFor, evolveMember } from '@/features/battle/logic/evolve';
import { createMember, INITIAL_BAG, REVIVE_HP } from '@/features/party/store/partySlice';
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

describe('reviveMember', () => {
  const wounded = (firstHp = 0) => {
    const store = createRunStore();
    store.setState({
      party: [{ ...createMember(1, 5)!, hp: firstHp }, { ...createMember(4, 5)!, hp: 0 }],
      leaderId: 1,
      bag: { ...INITIAL_BAG, potion: 2 },
    });
    return store;
  };

  it('finds the member by id, not by array index', () => {
    const store = wounded();
    const target = store.getState().party[1]!;

    expect(store.getState().reviveMember(4)).toBe(true);

    expect(store.getState().party[1]!.hp).toBe(Math.round(target.maxHp * REVIVE_HP));
    expect(store.getState().party[0]!.hp).toBe(0);
  });

  it('revives at the documented fraction of maximum HP, not at full health', () => {
    const store = wounded();
    const target = store.getState().party[1]!;

    store.getState().reviveMember(4);

    const hp = store.getState().party[1]!.hp;
    expect(hp).toBeGreaterThan(0);
    expect(hp).toBeLessThan(target.maxHp);
    expect(REVIVE_HP).toBeGreaterThan(0);
    expect(REVIVE_HP).toBeLessThan(1);
  });

  it('leaves whole-number HP behind', () => {
    const store = createRunStore();
    store.setState({
      party: [{ ...createMember(1, 5)!, hp: 0 }],
      leaderId: 1,
      bag: { ...INITIAL_BAG, potion: 2 },
    });

    store.getState().reviveMember(1);

    expect(store.getState().party[0]!.hp).toBe(10);
    expect(Number.isInteger(store.getState().party[0]!.hp)).toBe(true);
  });

  it('spends the potion and heals in a single update', () => {
    const store = wounded();
    let bagUpdates = 0;
    let partyUpdates = 0;
    store.subscribe((state, previous) => {
      if (state.bag !== previous.bag) bagUpdates += 1;
      if (state.party !== previous.party) partyUpdates += 1;
    });

    store.getState().reviveMember(4);

    expect(store.getState().bag.potion).toBe(1);
    expect(bagUpdates).toBe(1);
    expect(partyUpdates).toBe(1);
  });

  it('refuses an unknown id without spending anything', () => {
    const store = wounded();
    const before = store.getState().party;

    expect(store.getState().reviveMember(151)).toBe(false);
    expect(store.getState().party).toBe(before);
    expect(store.getState().bag.potion).toBe(2);
  });

  it('refuses a member that is still standing', () => {
    const store = wounded(12);

    expect(store.getState().reviveMember(1)).toBe(false);
    expect(store.getState().party[0]!.hp).toBe(12);
    expect(store.getState().bag.potion).toBe(2);
  });

  it('refuses when the bag holds neither potion nor hyper potion', () => {
    const store = wounded();
    store.setState({ bag: { ...INITIAL_BAG, potion: 0, hyperPotion: 0 } });

    expect(store.getState().reviveMember(4)).toBe(false);
    expect(store.getState().party[1]!.hp).toBe(0);
  });

  it('drinks the plain potion first and leaves the hyper potion alone', () => {
    const store = wounded();
    store.setState({ bag: { ...INITIAL_BAG, potion: 1, hyperPotion: 2 } });

    expect(store.getState().reviveMember(4)).toBe(true);

    expect(store.getState().bag.potion).toBe(0);
    expect(store.getState().bag.hyperPotion).toBe(2);
  });

  it('falls back to a hyper potion once the plain potions are gone', () => {
    const store = wounded();
    store.setState({ bag: { ...INITIAL_BAG, potion: 0, hyperPotion: 2 } });

    expect(store.getState().reviveMember(4)).toBe(true);

    expect(store.getState().bag.potion).toBe(0);
    expect(store.getState().bag.hyperPotion).toBe(1);
    expect(store.getState().party[1]!.hp).toBe(Math.round(store.getState().party[1]!.maxHp * REVIVE_HP));
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

describe('moving between party and storage through the store', () => {
  const ids = (list: readonly { id: number }[]) => list.map((member) => member.id);

  const fullRoster = () => {
    const store = createRunStore();
    store.setState({
      party: [1, 2, 3, 4, 5, 6].map((id) => createMember(id, 5)!),
      storage: [createMember(151, 5)!],
      leaderId: 1,
    });
    return store;
  };

  it('applies a send and keeps the same lead', () => {
    const store = fullRoster();

    const outcome = store.getState().moveToStorage(4);

    expect(outcome).toMatchObject({ ok: true, moved: 'sent' });
    expect(ids(store.getState().party)).toEqual([1, 2, 3, 5, 6]);
    expect(ids(store.getState().storage)).toEqual([151, 4]);
    expect(store.getState().leaderId).toBe(1);
  });

  it('leaves the state untouched when the send is refused', () => {
    const store = fullRoster();
    const before = store.getState().party;

    expect(store.getState().moveToStorage(1)).toEqual({ ok: false, reason: 'lead' });
    expect(store.getState().party).toBe(before);
    expect(ids(store.getState().storage)).toEqual([151]);
  });

  it('pulls only while the party has room', () => {
    const store = fullRoster();

    expect(store.getState().moveToParty(151)).toEqual({ ok: false, reason: 'party-full' });

    store.getState().moveToStorage(6);
    const outcome = store.getState().moveToParty(151);

    expect(outcome).toMatchObject({ ok: true, moved: 'pulled' });
    expect(ids(store.getState().party)).toEqual([1, 2, 3, 4, 5, 151]);
    expect(ids(store.getState().storage)).toEqual([6]);
  });

  it('swaps a party member with a stored one in place', () => {
    const store = fullRoster();

    const outcome = store.getState().swapWithStorage(4, 151);

    expect(outcome).toMatchObject({ ok: true, moved: 'swapped' });
    expect(ids(store.getState().party)).toEqual([1, 2, 3, 151, 5, 6]);
    expect(ids(store.getState().storage)).toEqual([4]);
  });

  it('refuses a swap that would take the lead out of the party', () => {
    const store = fullRoster();

    expect(store.getState().swapWithStorage(1, 151)).toEqual({ ok: false, reason: 'lead' });
    expect(ids(store.getState().party)).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

describe('buying from the shop', () => {
  const stocked = (money: number, potion = 3) => {
    const store = createRunStore();
    store.setState({ bag: { ...INITIAL_BAG, money, potion, hyperPotion: 1 } });
    return store;
  };

  it('moves the money into the potion and reports what it spent', () => {
    const store = stocked(132);

    const outcome = store.getState().buyItem('potion', 2);

    expect(outcome).toMatchObject({ ok: true, spent: 20 });
    expect(store.getState().bag.money).toBe(112);
    expect(store.getState().bag.potion).toBe(5);
  });

  it('leaves the very same bag object behind when the money is short', () => {
    const store = stocked(15);
    const before = store.getState().bag;

    expect(store.getState().buyItem('potion', 2)).toEqual({ ok: false, reason: 'money' });
    expect(store.getState().bag).toBe(before);
  });

  it('tops up hyper potions without touching the rest of the bag', () => {
    const store = stocked(100);

    store.getState().buyItem('hyperPotion', 3);

    expect(store.getState().bag.hyperPotion).toBe(4);
    expect(store.getState().bag.money).toBe(40);
    expect(store.getState().bag.pokeBall).toBe(INITIAL_BAG.pokeBall);
    expect(store.getState().bag.greatBall).toBe(INITIAL_BAG.greatBall);
  });

  it('refuses a quantity that makes no sense instead of buying one', () => {
    const store = stocked(132);
    const before = store.getState().bag;

    expect(store.getState().buyItem('potion', 0)).toEqual({ ok: false, reason: 'qty' });
    expect(store.getState().bag).toBe(before);
  });
});
