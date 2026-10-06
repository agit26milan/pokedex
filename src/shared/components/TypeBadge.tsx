import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, font, radius, typeColors } from '@/theme/tokens';

interface TypeBadgeProps {
  type: string;
  compact?: boolean;
}

export const TypeBadge = memo(function TypeBadge({ type, compact = false }: TypeBadgeProps) {
  const color = typeColors[type] ?? colors.textDim;
  return (
    <View style={[styles.badge, compact && styles.compact, { backgroundColor: `${color}22`, borderColor: `${color}55` }]}>
      <Text style={[styles.label, compact && styles.compactLabel, { color }]}>{type.toUpperCase()}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  compact: { paddingHorizontal: 6, paddingVertical: 3 },
  label: { fontFamily: font.mono, fontSize: 9, letterSpacing: 0.9, fontWeight: '700' },
  compactLabel: { fontSize: 8 },
});
