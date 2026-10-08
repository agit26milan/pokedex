import { fireEvent, render } from '@testing-library/react-native';

import type { Bag } from '@/features/party/types';
import { createSide } from '../logic/createSide';
import type { BattleSide } from '../logic/turnEngine';
import { BattleView, type BattlePanel } from './BattleView';

jest.mock('@/shared/components/Sprite', () => ({ Sprite: () => null }));

const BAG: Bag = { pokeBall: 5, greatBall: 0, potion: 2, hyperPotion: 0, money: 100 };

/** A side whose move list is written by hand, so a test can pin the exact slot count. */
const sideWith = (moves: string[]): BattleSide => ({
  ...createSide(16, 5)!,
  moves: moves.map((name, index) => ({ name, pp: index === 0 ? 0 : 10, maxPp: 10 })),
});

async function setup(player: BattleSide, panel: BattlePanel = 'moves') {
  const onMove = jest.fn();
  const onBall = jest.fn();
  const onPotion = jest.fn();
  const onHyperPotion = jest.fn();
  const view = await render(
    <BattleView
      player={player}
      foe={createSide(4, 5)!}
      party={[]}
      bag={BAG}
      events={[]}
      panel={panel}
      catchChance={0.5}
      onPanel={jest.fn()}
      onMove={onMove}
      onBall={onBall}
      onPotion={onPotion}
      onHyperPotion={onHyperPotion}
      onSwitch={jest.fn()}
      onRun={jest.fn()}
    />,
  );
  return { view, onMove, onBall, onPotion, onHyperPotion };
}

describe('BattleView move grid', () => {
  it('fits three moves on one row with no spacers', async () => {
    const { view } = await setup(sideWith(['tackle', 'ember', 'growl']));

    expect(view.getAllByTestId('grid-row')).toHaveLength(1);
    expect(view.queryAllByTestId('grid-spacer')).toHaveLength(0);
    expect(view.getByLabelText('Use Tackle, 0 PP left')).toBeTruthy();
  });

  it('wraps a fourth move onto a second row instead of shrinking the first', async () => {
    const { view } = await setup(sideWith(['tackle', 'ember', 'growl', 'scratch']));

    expect(view.getAllByTestId('grid-row')).toHaveLength(2);
    // Three on the first row, so the lone fourth gets two spacers to keep the same card width.
    expect(view.getAllByTestId('grid-spacer')).toHaveLength(2);
    expect(view.getByLabelText('Use Scratch, 10 PP left')).toBeTruthy();
  });

  it('caps every row at three even when STRUGGLE makes five slots', async () => {
    const { view } = await setup(sideWith(['tackle', 'ember', 'growl', 'scratch', 'struggle']));

    expect(view.getAllByTestId('grid-row')).toHaveLength(2);
    expect(view.getAllByTestId('grid-spacer')).toHaveLength(1);
  });

  it('reports the move that was pressed', async () => {
    const { view, onMove } = await setup(sideWith(['tackle', 'ember', 'growl', 'scratch']));

    await fireEvent.press(view.getByLabelText('Use Ember, 10 PP left'));

    expect(onMove).toHaveBeenCalledWith('ember');
  });

  it('refuses a move with no PP left', async () => {
    const { view, onMove } = await setup(sideWith(['tackle', 'ember', 'growl', 'scratch']));

    await fireEvent.press(view.getByLabelText('Use Tackle, 0 PP left'));

    expect(onMove).not.toHaveBeenCalled();
  });
});

describe('BattleView bag grid', () => {
  it('lays the five bag actions out three to a row', async () => {
    const { view } = await setup(sideWith(['tackle']), 'bag');

    expect(view.getAllByTestId('grid-row')).toHaveLength(2);
    // Three on the first row (ball, great ball, potion), two on the second plus one spacer.
    expect(view.getAllByTestId('grid-spacer')).toHaveLength(1);
    expect(view.getByText('BACK')).toBeTruthy();
  });

  it('never puts more than three cards on a row', async () => {
    const { view } = await setup(sideWith(['tackle']), 'bag');

    const counts = view.getAllByTestId('grid-row').map((row) =>
      row.children.filter((child) => typeof child !== 'string' && child.props.testID !== 'grid-spacer').length,
    );

    // A full trio then a pair, so no row ever carries more than three cards.
    expect(counts).toEqual([3, 2]);
  });

  it('reports the ball that was thrown', async () => {
    const { view, onBall } = await setup(sideWith(['tackle']), 'bag');

    await fireEvent.press(view.getByText('POKé BALL'));

    expect(onBall).toHaveBeenCalledWith('pokeBall');
  });

  it('refuses an item the bag has run out of', async () => {
    const { view, onBall, onHyperPotion } = await setup(sideWith(['tackle']), 'bag');

    await fireEvent.press(view.getByText('GREAT BALL'));
    await fireEvent.press(view.getByText('HYPER POTION'));

    expect(onBall).not.toHaveBeenCalled();
    expect(onHyperPotion).not.toHaveBeenCalled();
  });

  it('keeps the move grid hidden while the bag is open', async () => {
    const { view } = await setup(sideWith(['tackle']), 'bag');

    expect(view.queryByLabelText('Use Tackle, 0 PP left')).toBeNull();
  });
});
