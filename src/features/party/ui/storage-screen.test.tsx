import { fireEvent, render } from '@testing-library/react-native';

import StorageScreen from '../../../../app/(tabs)/storage';
import { createMember } from '@/features/party/store/partySlice';
import { useStore } from '@/store';

jest.mock('@/shared/components/Sprite', () => ({ Sprite: () => null }));
jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(() => Promise.resolve()),
  impactAsync: jest.fn(() => Promise.resolve()),
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

const ids = (list: readonly { id: number }[]) => list.map((member) => member.id);

const seed = (partySize: number, stored: number[] = []) =>
  useStore.setState({
    party: Array.from({ length: partySize }, (_, i) => createMember(i + 1, 5)!),
    storage: stored.map((id) => createMember(id, 5)!),
    leaderId: partySize > 0 ? 1 : null,
  });

describe('Storage screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    seed(0);
  });

  it('lays out six fixed party slots and the storage list', async () => {
    seed(6, [151]);
    const view = await render(<StorageScreen />);

    expect(view.getByLabelText('Bulbasaur, level 5, party slot 1, lead')).toBeTruthy();
    expect(view.getByLabelText('Charizard, level 5, party slot 6')).toBeTruthy();
    expect(view.getByLabelText('Mew, level 5, storage 1')).toBeTruthy();
    expect(view.getByText('PARTY 6/6')).toBeTruthy();
    expect(view.getByText('STORAGE 1')).toBeTruthy();
    expect(view.getByText('CAUGHT 7')).toBeTruthy();
  });

  it('shows an empty slot while the party still has room', async () => {
    seed(3, [151]);
    const view = await render(<StorageScreen />);

    expect(view.getByLabelText('Empty party slot 4')).toBeTruthy();
    expect(view.getByText('PARTY 3/6')).toBeTruthy();
  });

  it('offers to send the picked party member to storage', async () => {
    seed(6, [151]);
    const view = await render(<StorageScreen />);

    await fireEvent.press(view.getByLabelText('Charmander, level 5, party slot 4'));

    expect(view.getByLabelText('SEND CHARMANDER TO STORAGE')).toBeTruthy();
  });

  it('moves the picked member into storage and reports the new party size', async () => {
    seed(6, [151]);
    const view = await render(<StorageScreen />);

    await fireEvent.press(view.getByLabelText('Charmander, level 5, party slot 4'));
    await fireEvent.press(view.getByLabelText('SEND CHARMANDER TO STORAGE'));

    expect(ids(useStore.getState().party)).toEqual([1, 2, 3, 5, 6]);
    expect(ids(useStore.getState().storage)).toEqual([151, 4]);
    expect(view.getByText('Charmander sent to storage · party now 5/6.')).toBeTruthy();
  });

  it('blocks the lead and explains why instead of failing later', async () => {
    seed(6, [151]);
    const view = await render(<StorageScreen />);

    await fireEvent.press(view.getByLabelText('Bulbasaur, level 5, party slot 1, lead'));

    expect(view.getByLabelText('LEAD CANNOT BE STORED')).toBeTruthy();
    expect(ids(useStore.getState().party)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('pulls a stored member into a party that still has room', async () => {
    seed(5, [151]);
    const view = await render(<StorageScreen />);

    await fireEvent.press(view.getByLabelText('Mew, level 5, storage 1'));
    await fireEvent.press(view.getByLabelText('PULL MEW INTO PARTY →'));

    expect(ids(useStore.getState().party)).toEqual([1, 2, 3, 4, 5, 151]);
    expect(ids(useStore.getState().storage)).toEqual([]);
    expect(view.getByText('Mew joined the party · party 6/6.')).toBeTruthy();
  });

  it('turns a pull into a swap when the party is already full', async () => {
    seed(6, [151]);
    const view = await render(<StorageScreen />);

    await fireEvent.press(view.getByLabelText('Mew, level 5, storage 1'));
    expect(view.getByLabelText('PARTY FULL · PICK A PARTY SLOT')).toBeTruthy();

    await fireEvent.press(view.getByLabelText('Charmander, level 5, party slot 4'));
    await fireEvent.press(view.getByLabelText('SWAP 2 POKÉMON'));

    expect(ids(useStore.getState().party)).toEqual([1, 2, 3, 151, 5, 6]);
    expect(ids(useStore.getState().storage)).toEqual([4]);
  });

  it('swaps the other way round when the party member is picked first', async () => {
    seed(6, [151]);
    const view = await render(<StorageScreen />);

    await fireEvent.press(view.getByLabelText('Charmeleon, level 5, party slot 5'));
    await fireEvent.press(view.getByLabelText('Mew, level 5, storage 1'));
    await fireEvent.press(view.getByLabelText('SWAP 2 POKÉMON'));

    expect(ids(useStore.getState().party)).toEqual([1, 2, 3, 4, 151, 6]);
    expect(ids(useStore.getState().storage)).toEqual([5]);
  });

  it('keeps the storage side picked when the paired party member is tapped again', async () => {
    seed(6, [151]);
    const view = await render(<StorageScreen />);

    await fireEvent.press(view.getByLabelText('Charmander, level 5, party slot 4'));
    await fireEvent.press(view.getByLabelText('Mew, level 5, storage 1'));
    expect(view.getByLabelText('SWAP 2 POKÉMON')).toBeTruthy();

    await fireEvent.press(view.getByLabelText('Charmander, level 5, party slot 4'));

    expect(view.queryByLabelText('SWAP 2 POKÉMON')).toBeNull();
    expect(view.getByLabelText('PARTY FULL · PICK A PARTY SLOT')).toBeTruthy();
  });

  it('keeps the party side picked when the paired storage row is tapped again', async () => {
    seed(6, [151]);
    const view = await render(<StorageScreen />);

    await fireEvent.press(view.getByLabelText('Mew, level 5, storage 1'));
    await fireEvent.press(view.getByLabelText('Charmander, level 5, party slot 4'));
    expect(view.getByLabelText('SWAP 2 POKÉMON')).toBeTruthy();

    await fireEvent.press(view.getByLabelText('Mew, level 5, storage 1'));

    expect(view.queryByLabelText('SWAP 2 POKÉMON')).toBeNull();
    expect(view.getByLabelText('SEND CHARMANDER TO STORAGE')).toBeTruthy();
  });

  it('re-targets the pair instead of clearing it when a different counterpart is tapped', async () => {
    seed(6, [25, 151]);
    const view = await render(<StorageScreen />);

    await fireEvent.press(view.getByLabelText('Charmander, level 5, party slot 4'));
    await fireEvent.press(view.getByLabelText('Pikachu, level 5, storage 1'));

    await fireEvent.press(view.getByLabelText('Charmeleon, level 5, party slot 5'));
    await fireEvent.press(view.getByLabelText('SWAP 2 POKÉMON'));

    expect(ids(useStore.getState().party)).toEqual([1, 2, 3, 4, 25, 6]);
    expect(ids(useStore.getState().storage)).toEqual([5, 151]);
  });

  it('cancels a selection without moving anything', async () => {
    seed(6, [151]);
    const view = await render(<StorageScreen />);

    await fireEvent.press(view.getByLabelText('Charmander, level 5, party slot 4'));
    await fireEvent.press(view.getByLabelText('Clear the selection'));

    expect(view.getByLabelText('PICK A POKÉMON FIRST')).toBeTruthy();
    expect(ids(useStore.getState().party)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('explains an empty storage instead of showing a blank list', async () => {
    seed(6);
    const view = await render(<StorageScreen />);

    expect(view.getByText('NOTHING STORED YET')).toBeTruthy();
    expect(view.getByText('STORAGE 0')).toBeTruthy();
  });
});
