import { StyleSheet, Text, View } from 'react-native';

import { colors, font, spacing } from '@/theme/tokens';

export default function GlossaryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>GLOSSARY</Text>
      <Text style={styles.title}>151 Pokémon</Text>
      <Text style={styles.note}>Search, type filters and detail land here next.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ink,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  eyebrow: { color: colors.accent, fontFamily: font.mono, fontSize: 11, letterSpacing: 2.4 },
  title: { color: colors.text, fontSize: 26, fontWeight: '800' },
  note: { color: colors.textDim, fontSize: 13 },
});
