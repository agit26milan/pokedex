import { render } from '@testing-library/react-native';
import * as mockReact from 'react';
import { View as mockView } from 'react-native';

import TabsLayout from '../../../../app/(tabs)/_layout';
import { colors } from '@/theme/tokens';


jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

jest.mock('expo-router', () => {
  const probe = { screenOptions: undefined as Record<string, unknown> | undefined, screens: [] as string[] };

  function Tabs({ screenOptions, children }: { screenOptions?: Record<string, unknown>; children?: React.ReactNode }) {
    probe.screenOptions = screenOptions;
    return mockReact.createElement(mockView, null, children);
  }

  Tabs.Screen = function Screen({ name }: { name: string }) {
    probe.screens.push(name);
    return mockReact.createElement(mockView, { testID: `tab-${name}` });
  };

  return { Tabs, __probe: probe };
});

const probe = jest.requireMock('expo-router').__probe as {
  screenOptions?: { tabBarStyle?: Record<string, unknown>; headerShown?: boolean };
  screens: string[];
};

const tabBarStyle = () => probe.screenOptions?.tabBarStyle ?? {};

describe('Tabs layout', () => {
  beforeEach(() => {
    probe.screenOptions = undefined;
    probe.screens.length = 0;
  });

  it('declares the four tabs in order', async () => {
    await render(<TabsLayout />);

    expect(probe.screens).toEqual(['index', 'storage', 'bags', 'glossary']);
  });

  it('does not pin a numeric tab bar height', async () => {
    await render(<TabsLayout />);

    expect(tabBarStyle()).not.toHaveProperty('height');
  });

  it('does not fake a taller bar with a minimum height', async () => {
    await render(<TabsLayout />);

    expect(tabBarStyle()).not.toHaveProperty('minHeight');
  });

  it('keeps the tab bar presentation it always had', async () => {
    await render(<TabsLayout />);

    expect(tabBarStyle()).toMatchObject({
      backgroundColor: colors.inkDeep,
      borderTopColor: colors.stroke,
    });
  });

  it('keeps the headers hidden so each screen owns its own top inset', async () => {
    await render(<TabsLayout />);

    expect(probe.screenOptions?.headerShown).toBe(false);
  });
});
