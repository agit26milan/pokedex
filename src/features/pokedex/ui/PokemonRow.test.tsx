import { fireEvent, render } from '@testing-library/react-native';
import { useCallback, useState } from 'react';
import { Pressable, Text } from 'react-native';

import { titleCase } from '@/shared/lib/format';
import { PokemonRow } from './PokemonRow';

// babel-plugin-jest-hoist lifts these above the imports at runtime, so the source order is honest.
jest.mock('@/shared/lib/format', () => {
  const actual = jest.requireActual('@/shared/lib/format');
  return { ...actual, titleCase: jest.fn(actual.titleCase) };
});
jest.mock('@/shared/components/Sprite', () => ({ Sprite: () => null }));

const titleCaseCalls = () => (titleCase as unknown as jest.Mock).mock.calls.length;

const ROWS = [
  { id: 1, name: 'bulbasaur', types: ['grass', 'poison'] },
  { id: 2, name: 'charmander', types: ['fire'] },
  { id: 3, name: 'squirtle', types: ['water'] },
];

/**
 * Render-count evidence for the memoization claim: `titleCase` runs inside PokemonRow's render,
 * so counting its calls counts the row renders. A stable onPress is what the app passes in
 * (useCallback); a fresh inline arrow stands in for the usual mistake.
 */
function Harness({ stable }: { stable: boolean }) {
  const [bump, setBump] = useState(0);
  const stablePress = useCallback(() => undefined, []);

  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel="bump" onPress={() => setBump((value) => value + 1)}>
        <Text>re-render {bump}</Text>
      </Pressable>
      {ROWS.map((row) => (
        <PokemonRow
          key={row.id}
          id={row.id}
          name={row.name}
          types={row.types}
          caught={false}
          onPress={stable ? stablePress : () => undefined}
        />
      ))}
    </>
  );
}

describe('PokemonRow memoization', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders each row on mount, once per row', async () => {
    await render(<Harness stable />);
    const calls = titleCaseCalls();

    // PokemonRow calls titleCase twice per render (accessibility label + visible name), so the
    // assertions below are proportional rather than hard-coded to that number.
    expect(calls).toBeGreaterThanOrEqual(ROWS.length);
    expect(calls % ROWS.length).toBe(0);
  });

  it('does not re-render rows when the parent re-renders with the same props', async () => {
    const view = await render(<Harness stable />);
    const afterMount = titleCaseCalls();

    const bump = view.getByLabelText('bump');
    await fireEvent.press(bump);
    await fireEvent.press(bump);
    await fireEvent.press(bump);

    expect(titleCaseCalls()).toBe(afterMount);
  });

  it('re-renders every row when a prop identity changes, which is why callbacks are held stable', async () => {
    const view = await render(<Harness stable={false} />);
    const afterMount = titleCaseCalls();
    const perRow = afterMount / ROWS.length;

    await fireEvent.press(view.getByLabelText('bump'));

    expect(titleCaseCalls()).toBe(afterMount + ROWS.length * perRow);
  });

  it('re-renders a row when its own data changes', async () => {
    const view = await render(<PokemonRow id={1} name="bulbasaur" types={['grass']} caught={false} onPress={() => undefined} />);

    await view.rerender(<PokemonRow id={1} name="bulbasaur" types={['grass']} caught onPress={() => undefined} />);

    expect(view.getByText('✓')).toBeTruthy();
  });
});
