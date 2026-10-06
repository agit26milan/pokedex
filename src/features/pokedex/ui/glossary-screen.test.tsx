import { fireEvent, render } from '@testing-library/react-native';

import GlossaryScreen from '../../../../app/(tabs)/glossary';
import { createMember } from '@/features/party/store/partySlice';
import { useStore } from '@/store';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@/shared/components/Sprite', () => ({ Sprite: () => null }));

const reset = () =>
  useStore.setState({ query: '', typeFilters: [], party: [], storage: [], leaderId: null });

describe('Glossary screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    reset();
  });

  it('renders the real dex size and the first page of entries', async () => {
    const view = await render(<GlossaryScreen />);

    expect(view.getByText('151 Pokémon')).toBeTruthy();
    expect(view.getByText('0 CAUGHT')).toBeTruthy();
    expect(view.getByLabelText('Bulbasaur, not caught')).toBeTruthy();
  });

  it('counts what the run has caught, from party and storage together', async () => {
    useStore.setState({ party: [createMember(1, 5)!], storage: [createMember(25, 5)!], leaderId: 1 });

    const view = await render(<GlossaryScreen />);

    expect(view.getByText('2 CAUGHT')).toBeTruthy();
    expect(view.getByLabelText('Bulbasaur, caught')).toBeTruthy();
  });

  it('filters by name as the user types', async () => {
    const view = await render(<GlossaryScreen />);

    await fireEvent.changeText(view.getByPlaceholderText('Search name or dex number…'), 'pikachu');

    expect(view.getByLabelText('Pikachu, not caught')).toBeTruthy();
    expect(view.queryByLabelText('Bulbasaur, not caught')).toBeNull();
  });

  it('filters by dex number too', async () => {
    const view = await render(<GlossaryScreen />);

    await fireEvent.changeText(view.getByPlaceholderText('Search name or dex number…'), '#025');

    expect(view.getByLabelText('Pikachu, not caught')).toBeTruthy();
  });

  it('shows the empty state instead of a blank list, and can clear the filters', async () => {
    const view = await render(<GlossaryScreen />);

    await fireEvent.changeText(view.getByPlaceholderText('Search name or dex number…'), 'zzzz');
    expect(view.getByText('No Pokémon match')).toBeTruthy();

    await fireEvent.press(view.getByText('CLEAR FILTERS'));
    expect(view.getByLabelText('Bulbasaur, not caught')).toBeTruthy();
  });

  it('filters by type chip', async () => {
    const view = await render(<GlossaryScreen />);

    await fireEvent.press(view.getByLabelText('Filter by water'));

    expect(view.getByLabelText('Squirtle, not caught')).toBeTruthy();
    expect(view.queryByLabelText('Bulbasaur, not caught')).toBeNull();
  });

  it('opens the detail route for the row that was pressed', async () => {
    const view = await render(<GlossaryScreen />);

    await fireEvent.press(view.getByLabelText('Bulbasaur, not caught'));

    expect(mockPush).toHaveBeenCalledWith({ pathname: '/pokemon/[id]', params: { id: '1' } });
  });
});
