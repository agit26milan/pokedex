import { fireEvent, render } from '@testing-library/react-native';

import { createMember, INITIAL_BAG, REVIVE_HP } from '@/features/party/store/partySlice';
import { useStore } from '@/store';
import type { PartyMember } from '../types';
import { LeadPickerSheet } from './LeadPickerSheet';

jest.mock('@/shared/components/Sprite', () => ({ Sprite: () => null }));

const ivysaur = createMember(2, 16)!;
const kingler = createMember(99, 16)!;
const squirtle: PartyMember = { ...createMember(7, 14)!, hp: 0 };
const party = [ivysaur, kingler, squirtle];

const potionValue = (member: PartyMember) => Math.round(member.maxHp * REVIVE_HP);

beforeEach(() => {
  useStore.setState({ party, leaderId: ivysaur.id, bag: { ...INITIAL_BAG, potion: 1, hyperPotion: 0 } });
});

/** Which potions the bag holds. `hyperPotion` defaults to 0 so a test never silently drinks one. */
interface Potions {
  potion?: number;
  hyperPotion?: number;
}

async function setup(list: PartyMember[] = party, leaderId: number | null = ivysaur.id, potions: Potions = { potion: 1 }) {
  const onPick = jest.fn();
  const onClose = jest.fn();
  // The buttons write through the store and look members up by id, so the store has to
  // hold the same roster that is rendered - otherwise a test would assert on a stale member.
  useStore.setState({ party: list, leaderId, bag: { ...INITIAL_BAG, potion: 0, hyperPotion: 0, ...potions } });
  const view = await render(
    <LeadPickerSheet visible party={list} leaderId={leaderId} onPick={onPick} onClose={onClose} />,
  );
  return { view, onPick, onClose };
}

describe('LeadPickerSheet', () => {
  it('renders nothing while it is closed', async () => {
    const view = await render(
      <LeadPickerSheet visible={false} party={party} leaderId={ivysaur.id} onPick={jest.fn()} onClose={jest.fn()} />,
    );
    expect(view.queryByText('Pilih Pokémon lead')).toBeNull();
  });

  it('lists the whole party and marks the current lead', async () => {
    const { view } = await setup();

    expect(view.getByText('Pilih Pokémon lead')).toBeTruthy();
    expect(view.getByText('Ivysaur')).toBeTruthy();
    expect(view.getByText('Kingler')).toBeTruthy();
    expect(view.getByText('Squirtle')).toBeTruthy();
    expect(view.getByText('★ LEAD')).toBeTruthy();
  });

  it('shows the strength breakdown when a row is opened', async () => {
    const { view } = await setup();

    await fireEvent.press(view.getByLabelText(/^Kingler,/));

    expect(view.getByText('COMBAT RATING 158')).toBeTruthy();
    expect(view.getByText('ATTACK')).toBeTruthy();
    expect(view.getByText('#1 / 3')).toBeTruthy();
  });

  it('picks a member as the new lead', async () => {
    const { view, onPick } = await setup();

    await fireEvent.press(view.getByLabelText(/^Kingler,/));
    await fireEvent.press(view.getByLabelText('Jadikan Kingler lead'));

    expect(onPick).toHaveBeenCalledTimes(1);
    expect(onPick).toHaveBeenCalledWith(99);
  });

  it('refuses to pick the member that is already the lead', async () => {
    const { view, onPick } = await setup();

    await fireEvent.press(view.getByLabelText(/^Ivysaur,/));

    expect(view.getByText('SUDAH JADI LEAD')).toBeTruthy();
    await fireEvent.press(view.getByLabelText('Ivysaur sudah menjadi lead'));
    expect(onPick).not.toHaveBeenCalled();
  });

  it('blocks a fainted member from becoming lead, even with potions in the bag', async () => {
    const { view, onPick } = await setup();
    expect(useStore.getState().bag.potion).toBe(1);

    await fireEvent.press(view.getByLabelText(/^Squirtle,/));
    await fireEvent.press(view.getByLabelText('Jadikan Squirtle lead'));

    expect(onPick).not.toHaveBeenCalled();
    expect(view.getByText(/pingsan/i)).toBeTruthy();
    expect(useStore.getState().bag.potion).toBe(1);
    expect(useStore.getState().party[2]!.hp).toBe(0);
  });
});

describe('LeadPickerSheet revive and heal', () => {
  it('labels the potion button REVIVE for a fainted member and HEAL for a standing one', async () => {
    const { view } = await setup();

    await fireEvent.press(view.getByLabelText(/^Squirtle,/));
    expect(view.getByText(/^REVIVE/)).toBeTruthy();

    await fireEvent.press(view.getByLabelText(/^Kingler,/));
    expect(view.getByText(/^HEAL/)).toBeTruthy();
  });

  it('revives a fainted member to half its maximum HP and spends one potion', async () => {
    const { view } = await setup();

    await fireEvent.press(view.getByLabelText(/^Squirtle,/));
    await fireEvent.press(view.getByLabelText('Revive member'));

    expect(useStore.getState().party[2]!.hp).toBe(potionValue(squirtle));
    expect(useStore.getState().bag.potion).toBe(0);
  });

  it('offers no potion button when the bag cannot help at all', async () => {
    const { view } = await setup(party, ivysaur.id, { potion: 0, hyperPotion: 0 });

    await fireEvent.press(view.getByLabelText(/^Squirtle,/));

    expect(view.queryByLabelText('Revive member')).toBeNull();
    expect(view.queryByText(/^REVIVE/)).toBeNull();
    expect(useStore.getState().party[2]!.hp).toBe(0);
  });

  it('drinks the plain potion first and keeps the hyper potion for later', async () => {
    const { view } = await setup(party, ivysaur.id, { potion: 1, hyperPotion: 1 });

    await fireEvent.press(view.getByLabelText(/^Squirtle,/));
    await fireEvent.press(view.getByLabelText('Revive member'));

    expect(useStore.getState().bag.potion).toBe(0);
    expect(useStore.getState().bag.hyperPotion).toBe(1);
  });

  it('falls back to a hyper potion once the potions have run out', async () => {
    const { view } = await setup(party, ivysaur.id, { potion: 0, hyperPotion: 1 });

    await fireEvent.press(view.getByLabelText(/^Squirtle,/));
    await fireEvent.press(view.getByLabelText('Revive member'));

    expect(useStore.getState().party[2]!.hp).toBe(potionValue(squirtle));
    expect(useStore.getState().bag.hyperPotion).toBe(0);
    expect(useStore.getState().bag.potion).toBe(0);
  });

  it('does not make the revived member the lead on its own', async () => {
    const { view, onPick } = await setup();

    await fireEvent.press(view.getByLabelText(/^Squirtle,/));
    await fireEvent.press(view.getByLabelText('Revive member'));

    expect(onPick).not.toHaveBeenCalled();
  });

  it('heals a wounded member by the potion value and spends one potion', async () => {
    const wounded: PartyMember = { ...createMember(99, 16)!, hp: 1 };
    const { view } = await setup([ivysaur, wounded, squirtle]);

    await fireEvent.press(view.getByLabelText(/^Kingler,/));
    await fireEvent.press(view.getByLabelText('Revive member'));

    expect(useStore.getState().party[1]!.hp).toBe(1 + potionValue(wounded));
    expect(useStore.getState().bag.potion).toBe(0);
  });

  it('spends nothing when the bag is empty, whatever the button is called', async () => {
    const { view } = await setup(party, ivysaur.id, { potion: 0, hyperPotion: 0 });

    await fireEvent.press(view.getByLabelText(/^Squirtle,/));
    expect(view.queryByLabelText('Revive member')).toBeNull();
    expect(useStore.getState().party[2]!.hp).toBe(0);

    await fireEvent.press(view.getByLabelText(/^Kingler,/));
    expect(view.queryByLabelText('Revive member')).toBeNull();
    expect(useStore.getState().party[1]!.hp).toBe(kingler.maxHp);

    expect(useStore.getState().bag.potion).toBe(0);
    expect(useStore.getState().bag.hyperPotion).toBe(0);
  });

  it('is a no-op when a full-HP member is healed', async () => {
    const { view } = await setup();
    expect(kingler.hp).toBe(kingler.maxHp);

    await fireEvent.press(view.getByLabelText(/^Kingler,/));
    await fireEvent.press(view.getByLabelText('Revive member'));

    expect(useStore.getState().party[1]!.hp).toBe(kingler.maxHp);
    expect(useStore.getState().bag.potion).toBe(1);
  });

  it('lets healing push HP past the maximum', async () => {
    const nearlyFull: PartyMember = { ...createMember(99, 16)!, hp: kingler.maxHp - 1 };
    const { view } = await setup([ivysaur, nearlyFull, squirtle]);

    await fireEvent.press(view.getByLabelText(/^Kingler,/));
    await fireEvent.press(view.getByLabelText('Revive member'));

    const hp = useStore.getState().party[1]!.hp;
    expect(hp).toBeGreaterThan(nearlyFull.maxHp);
  });
});

describe('LeadPickerSheet dismissal', () => {
  it('closes from the close button and from the scrim', async () => {
    const first = await setup();
    await fireEvent.press(first.view.getByLabelText('Tutup panel party'));
    expect(first.onClose).toHaveBeenCalledTimes(1);

    const second = await setup();
    await fireEvent.press(second.view.getByLabelText('Ketuk latar untuk tutup'));
    expect(second.onClose).toHaveBeenCalledTimes(1);
  });

  it('shows the confirmation notice after a switch', async () => {
    const view = await render(
      <LeadPickerSheet
        visible
        party={party}
        leaderId={kingler.id}
        notice="KINGLER jadi lead"
        onPick={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    expect(view.getByText('KINGLER jadi lead')).toBeTruthy();
  });
});
