import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, font, radius, spacing } from '@/theme/tokens';
import type { BuyableItem } from '../types';
import { ItemGlyph } from './ItemGlyph';

interface BagRowProps {
  item: BuyableItem;
  name: string;
  effect: string;
  count: number;
  delta?: number;
}

export const BagRow = memo(function BagRow({ item, name, effect, count, delta }: BagRowProps) {
  return (
    <View style={styles.row} accessibilityLabel={`${name}, ${count} in bag`}>
      <ItemGlyph item={item} />

      <View style={styles.body}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.effect}>{effect}</Text>
      </View>

      <View style={styles.countWrap}>
        <Text style={[styles.count, count <= 0 && styles.countZero]}>{count}</Text>
        {delta && delta > 0 ? (
          <View style={styles.delta}>
            <Text style={styles.deltaLabel}>+{delta}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: 10,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  body: { flex: 1, minWidth: 0 },
  name: { color: colors.text, fontSize: 11.5, fontWeight: '800' },
  effect: { color: colors.textFaint, fontFamily: font.mono, fontSize: 8, letterSpacing: 0.5, marginTop: 3 },
  countWrap: { flexDirection: 'row', alignItems: 'center' },
  count: { color: colors.text, fontFamily: font.mono, fontSize: 17, fontWeight: '800' },
  countZero: { color: colors.danger },
  delta: {
    marginLeft: 5,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  deltaLabel: { color: colors.accentOn, fontFamily: font.mono, fontSize: 9, fontWeight: '700' },
});
