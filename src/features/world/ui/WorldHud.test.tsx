import { fireEvent, render } from '@testing-library/react-native';

import { createMember } from '@/features/party/store/partySlice';
import { maxPpOf } from '@/shared/data/moves';
import { WorldHud } from './WorldHud';

jest.mock('@/shared/components/Sprite', () => ({ Sprite: () => null }));

const bag = { pokeBall: 10, greatBall: 2, potion: 3, money: 132, hyperPotion: 1 };
const base = { bag, steps: 12, encounterRisk: 0.2, chunkLabel: 'CHUNK 0,-1' };

describe('WorldHud', () => {
  it('offers a new run only once a run exists', async () => {
    const empty = await render(<WorldHud partner={undefined} {...base} onNewRun={jest.fn()} />);
    expect(empty.queryByLabelText('Start a new run')).toBeNull();

    const playing = await render(<WorldHud partner={createMember(1, 5)} {...base} onNewRun={jest.fn()} />);
    expect(playing.getByLabelText('Start a new run')).toBeTruthy();
  });

  it('calls back once when the wipe button is pressed', async () => {
    const onNewRun = jest.fn();
    const view = await render(<WorldHud partner={createMember(1, 5)} {...base} onNewRun={onNewRun} />);

    await fireEvent.press(view.getByLabelText('Start a new run'));

    expect(onNewRun).toHaveBeenCalledTimes(1);
  });

  it('shows the persisted PP next to HP so a drained partner is never a surprise', async () => {
    const partner = {
      ...createMember(1, 5)!,
      moves: [
        { name: 'tackle', pp: 30 },
        { name: 'growl', pp: 40 },
      ],
    };
    const view = await render(<WorldHud partner={partner} {...base} />);

    const spent = partner.moves.reduce((total, slot) => total + slot.pp, 0);
    const max = partner.moves.reduce((total, slot) => total + maxPpOf(slot.name), 0);
    expect(view.getByText(new RegExp(`PP ${spent}/${max}`))).toBeTruthy();
  });

  it('shows the money next to the ball and potion counts', async () => {
    const view = await render(<WorldHud partner={createMember(1, 5)} {...base} />);

    expect(view.getByText(/\$ 132/)).toBeTruthy();
  });
});
