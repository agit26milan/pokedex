import { fireEvent, render } from '@testing-library/react-native';

import BagsScreen, { BALL_EFFECT } from '../../../../app/(tabs)/bags';
import { INITIAL_BAG, type Bag } from '@/features/party/types';
import { useStore } from '@/store';

jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(() => Promise.resolve()),
  impactAsync: jest.fn(() => Promise.resolve()),
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

const seed = (bag: Partial<Bag>) => useStore.setState({ bag: { ...INITIAL_BAG, ...bag } });

describe('Bags screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    seed({ pokeBall: 10, greatBall: 10, potion: 3, hyperPotion: 1, money: 132 });
  });

  it('lists every item with its count and the money in the header', async () => {
    const view = await render(<BagsScreen />);

    expect(view.getByLabelText('Poke Ball, 10 in bag')).toBeTruthy();
    expect(view.getByLabelText('Great Ball, 10 in bag')).toBeTruthy();
    expect(view.getByLabelText('Potion, 3 in bag')).toBeTruthy();
    expect(view.getByLabelText('Hyper Potion, 1 in bag')).toBeTruthy();
    expect(view.getByLabelText('Money 132')).toBeTruthy();
    expect(view.getAllByText(BALL_EFFECT).length).toBeGreaterThan(0);
  });

  it('sells every item, potions and balls alike', async () => {
    const view = await render(<BagsScreen />);

    expect(view.getByLabelText('Buy 1 Potion for $10')).toBeTruthy();
    expect(view.getByLabelText('Buy 1 Hyper Potion for $20')).toBeTruthy();
    expect(view.getByLabelText('Buy 1 Poke Ball for $10')).toBeTruthy();
    expect(view.getByLabelText('Buy 1 Great Ball for $15')).toBeTruthy();
  });

  it('moves the money into the item and reports what is left', async () => {
    const view = await render(<BagsScreen />);

    await fireEvent.press(view.getByLabelText('Increase Potion quantity'));
    await fireEvent.press(view.getByLabelText('Buy 2 Potion for $20'));

    expect(useStore.getState().bag.potion).toBe(5);
    expect(useStore.getState().bag.money).toBe(112);
    expect(view.getByText('2 POTION ADDED TO BAG · $112 LEFT')).toBeTruthy();
  });

  it('cannot raise the quantity past what the money can afford', async () => {
    seed({ money: 25, potion: 0 });
    const view = await render(<BagsScreen />);

    await fireEvent.press(view.getByLabelText('Increase Potion quantity'));
    await fireEvent.press(view.getByLabelText('Increase Potion quantity'));
    await fireEvent.press(view.getByLabelText('Increase Potion quantity'));
    await fireEvent.press(view.getByLabelText('Increase Potion quantity'));

    expect(view.getByLabelText('Buy 2 Potion for $20')).toBeTruthy();
    expect(view.queryByLabelText('Buy 3 Potion for $30')).toBeNull();
  });

  it('names the shortfall instead of selling what the money cannot cover', async () => {
    seed({ money: 5, potion: 0, hyperPotion: 0 });
    const view = await render(<BagsScreen />);

    expect(view.getByLabelText('Short $5 for Potion')).toBeTruthy();
    expect(view.getByLabelText('Short $5 for Poke Ball')).toBeTruthy();
    expect(view.getByLabelText('Short $10 for Great Ball')).toBeTruthy();
    expect(view.getByLabelText('Short $15 for Hyper Potion')).toBeTruthy();

    await fireEvent.press(view.getByLabelText('Short $5 for Potion'));

    expect(useStore.getState().bag.potion).toBe(0);
    expect(useStore.getState().bag.money).toBe(5);
    expect(view.getByText(/Not enough money/)).toBeTruthy();
  });

  it('buys a hyper potion without touching the potions', async () => {
    const view = await render(<BagsScreen />);

    await fireEvent.press(view.getByLabelText('Buy 1 Hyper Potion for $20'));

    expect(useStore.getState().bag.hyperPotion).toBe(2);
    expect(useStore.getState().bag.potion).toBe(3);
    expect(useStore.getState().bag.money).toBe(112);
  });

  it('keeps listing an item the run has none of', async () => {
    seed({ pokeBall: 0, greatBall: 0, potion: 0, hyperPotion: 0, money: 132 });
    const view = await render(<BagsScreen />);

    expect(view.getByLabelText('Poke Ball, 0 in bag')).toBeTruthy();
    expect(view.getByLabelText('Hyper Potion, 0 in bag')).toBeTruthy();
  });

  it('still offers the shop when the run has no money at all', async () => {
    seed({ money: 0, potion: 0, hyperPotion: 0 });
    const view = await render(<BagsScreen />);

    expect(view.getByLabelText('Money 0')).toBeTruthy();
    expect(view.getByLabelText('Short $10 for Potion')).toBeTruthy();
    expect(view.getByLabelText('Short $10 for Poke Ball')).toBeTruthy();
    expect(view.getByLabelText('Short $15 for Great Ball')).toBeTruthy();
    expect(view.getByLabelText('Short $20 for Hyper Potion')).toBeTruthy();
  });
});
