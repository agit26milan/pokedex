import { fireEvent, render } from '@testing-library/react-native';

import { createMember } from '@/features/party/store/partySlice';
import type { PartyMember } from '../types';
import { LeadPickerSheet } from './LeadPickerSheet';

jest.mock('@/shared/components/Sprite', () => ({ Sprite: () => null }));

const ivysaur = createMember(2, 16)!;
const kingler = createMember(99, 16)!;
const squirtle: PartyMember = { ...createMember(7, 14)!, hp: 0 };
const party = [ivysaur, kingler, squirtle];

async function setup(leaderId: number | null = ivysaur.id) {
  const onPick = jest.fn();
  const onClose = jest.fn();
  const view = await render(
    <LeadPickerSheet visible party={party} leaderId={leaderId} onPick={onPick} onClose={onClose} />,
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

  it('blocks a fainted member and explains why', async () => {
    const { view, onPick } = await setup();

    await fireEvent.press(view.getByLabelText(/^Squirtle,/));
    expect(view.getByText('HEAL DULU')).toBeTruthy();

    await fireEvent.press(view.getByLabelText(/pingsan/));

    expect(onPick).not.toHaveBeenCalled();
    expect(view.getByText(/heal dulu sebelum dijadikan lead/i)).toBeTruthy();
  });

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
