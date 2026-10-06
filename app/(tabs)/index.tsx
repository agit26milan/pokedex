import { StyleSheet, Text, View } from 'react-native';

import { colors, font, spacing } from '@/theme/tokens';

export default function PlayScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>STEP 1 OF 2</Text>
      <Text style={styles.title}>Choose your partner</Text>
      <Text style={styles.note}>Partner picker and world map land here next.</Text>
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
