import { Tabs } from 'expo-router';
import { StyleSheet, View, type ColorValue } from 'react-native';

import { colors, font } from '@/theme/tokens';

const ICON = 15;

/**
 * Dependency-free tab glyphs. @expo/vector-icons is not a dependency here, and pulling a font
 * package in for two icons is not worth it — a triangle and a stack of bars render everywhere.
 */
function TabIcon({ shape, color }: { shape: 'play' | 'list'; color: ColorValue }) {
  if (shape === 'play') {
    return <View style={[styles.triangle, { borderLeftColor: color }]} />;
  }
  return (
    <View style={styles.stack}>
      {[0, 1, 2].map((row) => (
        <View key={row} style={[styles.bar, { backgroundColor: color }]} />
      ))}
    </View>
  );
}

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
      <Tabs.Screen
        name="index"
        options={{
          title: 'PLAY',
          tabBarIcon: ({ color }) => <TabIcon shape="play" color={color} />,
        }}
      />
      <Tabs.Screen
        name="glossary"
        options={{
          title: 'GLOSSARY',
          tabBarIcon: ({ color }) => <TabIcon shape="list" color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  triangle: {
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderTopWidth: ICON * 0.62,
    borderBottomWidth: ICON * 0.62,
    borderLeftWidth: ICON,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  stack: { gap: 3, justifyContent: 'center' },
  bar: { width: ICON, height: 2.5, borderRadius: 1 },
});
