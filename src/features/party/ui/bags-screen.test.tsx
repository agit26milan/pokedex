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

    expect(view.getByLabelText('Poke Ball, 10 di tas')).toBeTruthy();
    expect(view.getByLabelText('Great Ball, 10 di tas')).toBeTruthy();
    expect(view.getByLabelText('Potion, 3 di tas')).toBeTruthy();
    expect(view.getByLabelText('Hyper Potion, 1 di tas')).toBeTruthy();
    expect(view.getByLabelText('Uang 132')).toBeTruthy();
    // The description shows twice: once on the bag row, once on the matching shop row.
    expect(view.getAllByText(BALL_EFFECT).length).toBeGreaterThan(0);
  });

  it('sells every item, potions and balls alike', async () => {
    const view = await render(<BagsScreen />);

    expect(view.getByLabelText('Beli 1 Potion seharga $10')).toBeTruthy();
    expect(view.getByLabelText('Beli 1 Hyper Potion seharga $20')).toBeTruthy();
    expect(view.getByLabelText('Beli 1 Poke Ball seharga $10')).toBeTruthy();
    expect(view.getByLabelText('Beli 1 Great Ball seharga $15')).toBeTruthy();
  });

  it('moves the money into the item and reports what is left', async () => {
    const view = await render(<BagsScreen />);

    await fireEvent.press(view.getByLabelText('Tambah jumlah Potion'));
    await fireEvent.press(view.getByLabelText('Beli 2 Potion seharga $20'));

    expect(useStore.getState().bag.potion).toBe(5);
    expect(useStore.getState().bag.money).toBe(112);
    expect(view.getByText('2 POTION MASUK TAS · SISA $112')).toBeTruthy();
  });

  it('cannot raise the quantity past what the money can afford', async () => {
    seed({ money: 25, potion: 0 });
    const view = await render(<BagsScreen />);

    await fireEvent.press(view.getByLabelText('Tambah jumlah Potion'));
    await fireEvent.press(view.getByLabelText('Tambah jumlah Potion'));
    await fireEvent.press(view.getByLabelText('Tambah jumlah Potion'));
    await fireEvent.press(view.getByLabelText('Tambah jumlah Potion'));

    expect(view.getByLabelText('Beli 2 Potion seharga $20')).toBeTruthy();
    expect(view.queryByLabelText('Beli 3 Potion seharga $30')).toBeNull();
  });

  it('names the shortfall instead of selling what the money cannot cover', async () => {
    seed({ money: 5, potion: 0, hyperPotion: 0 });
    const view = await render(<BagsScreen />);

    expect(view.getByLabelText('Uang kurang $5 untuk Potion')).toBeTruthy();
    expect(view.getByLabelText('Uang kurang $5 untuk Poke Ball')).toBeTruthy();
    expect(view.getByLabelText('Uang kurang $10 untuk Great Ball')).toBeTruthy();
    expect(view.getByLabelText('Uang kurang $15 untuk Hyper Potion')).toBeTruthy();

    await fireEvent.press(view.getByLabelText('Uang kurang $5 untuk Potion'));

    expect(useStore.getState().bag.potion).toBe(0);
    expect(useStore.getState().bag.money).toBe(5);
    expect(view.getByText(/Uang tidak cukup/)).toBeTruthy();
  });

  it('buys a hyper potion without touching the potions', async () => {
    const view = await render(<BagsScreen />);

    await fireEvent.press(view.getByLabelText('Beli 1 Hyper Potion seharga $20'));

    expect(useStore.getState().bag.hyperPotion).toBe(2);
    expect(useStore.getState().bag.potion).toBe(3);
    expect(useStore.getState().bag.money).toBe(112);
  });

  it('keeps listing an item the run has none of', async () => {
    seed({ pokeBall: 0, greatBall: 0, potion: 0, hyperPotion: 0, money: 132 });
    const view = await render(<BagsScreen />);

    expect(view.getByLabelText('Poke Ball, 0 di tas')).toBeTruthy();
    expect(view.getByLabelText('Hyper Potion, 0 di tas')).toBeTruthy();
  });

  it('still offers the shop when the run has no money at all', async () => {
    seed({ money: 0, potion: 0, hyperPotion: 0 });
    const view = await render(<BagsScreen />);

    expect(view.getByLabelText('Uang 0')).toBeTruthy();
    // Even when every row is short, the label still says which item it belongs to.
    expect(view.getByLabelText('Uang kurang $10 untuk Potion')).toBeTruthy();
    expect(view.getByLabelText('Uang kurang $10 untuk Poke Ball')).toBeTruthy();
    expect(view.getByLabelText('Uang kurang $15 untuk Great Ball')).toBeTruthy();
    expect(view.getByLabelText('Uang kurang $20 untuk Hyper Potion')).toBeTruthy();
  });
});
