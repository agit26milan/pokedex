import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';

import { colors } from '@/theme/tokens';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.ink },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="battle" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack>
    </>
  );
}
