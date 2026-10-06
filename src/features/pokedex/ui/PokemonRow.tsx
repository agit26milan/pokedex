import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Sprite } from '@/shared/components/Sprite';
import { TypeBadge } from '@/shared/components/TypeBadge';
import { dexNumber, titleCase } from '@/shared/lib/format';
import { colors, font, radius, spacing } from '@/theme/tokens';

export const ROW_HEIGHT = 56;
export const ROW_GAP = 8;

interface PokemonRowProps {
  id: number;
  name: string;
  types: string[];
  caught: boolean;
  onPress: (id: number) => void;
}

export const PokemonRow = memo(function PokemonRow({ id, name, types, caught, onPress }: PokemonRowProps) {
  return (
    <Pressable
      onPress={() => onPress(id)}
      style={styles.row}
      accessibilityRole="button"
      accessibilityLabel={`${titleCase(name)}, ${caught ? 'caught' : 'not caught'}`}
    >
      <Sprite id={id} size={36} />
      <Text style={styles.number}>{dexNumber(id)}</Text>
      <Text style={styles.name} numberOfLines={1}>
        {titleCase(name)}
      </Text>
      <View style={styles.types}>
        {types.map((type) => (
          <TypeBadge key={type} type={type} compact />
        ))}
      </View>
      {caught ? <Text style={styles.caught}>✓</Text> : <View style={styles.caughtSpacer} />}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    height: ROW_HEIGHT,
    marginBottom: ROW_GAP,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  number: { color: colors.textDim, fontFamily: font.mono, fontSize: 10, width: 34 },
  name: { color: colors.text, fontWeight: '700', fontSize: 13, flex: 1 },
  types: { flexDirection: 'row', gap: 4 },
  caught: { color: colors.accent, fontSize: 13, fontWeight: '900', width: 16, textAlign: 'center' },
  caughtSpacer: { width: 16 },
});
