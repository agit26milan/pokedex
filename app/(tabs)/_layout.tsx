import { Tabs } from 'expo-router';

import { colors, font } from '@/theme/tokens';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.ink },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: {
          backgroundColor: colors.inkDeep,
          borderTopColor: colors.stroke,
          height: 66,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontFamily: font.mono, letterSpacing: 1.5 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'PLAY' }} />
      <Tabs.Screen name="glossary" options={{ title: 'GLOSSARY' }} />
    </Tabs>
  );
}
