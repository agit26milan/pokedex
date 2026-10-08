import { Tabs } from 'expo-router';
import { StyleSheet, View, type ColorValue } from 'react-native';

import { colors, font } from '@/theme/tokens';
import { Ionicons } from '@expo/vector-icons';

const ICON = 15;

function TabIcon({ shape, color }: { shape: 'play' | 'box' | 'bag' | 'list'; color: ColorValue }) {
  if (shape === 'play') {
    return <View  > <Ionicons name="play-outline" size={24} color={color} /></View>;
  }
  if (shape === 'box') {
    return <View><Ionicons name="albums-outline" size={24} color={color} /></View>;
  }
  if (shape === 'bag') {
    return <View><Ionicons name="bag-handle-outline" size={24} color={color} /></View>;
  }
  return (
    <View style={styles.stack}>
      <Ionicons name="list-outline" size={24} color={color} />
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
        name="storage"
        options={{
          title: 'STORAGE',
          tabBarIcon: ({ color }) => <TabIcon shape="box" color={color} />,
        }}
      />
      <Tabs.Screen
        name="bags"
        options={{
          title: 'BAGS',
          tabBarIcon: ({ color }) => <TabIcon shape="bag" color={color} />,
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
