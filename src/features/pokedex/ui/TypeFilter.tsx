import { memo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { colors, font, radius, spacing, typeColors } from '@/theme/tokens';

interface TypeFilterProps {
  types: readonly string[];
  active: readonly string[];
  onToggle: (type: string) => void;
}

const TypeChip = memo(function TypeChip({
  type,
  active,
  onToggle,
}: {
  type: string;
  active: boolean;
  onToggle: (type: string) => void;
}) {
  const color = typeColors[type] ?? colors.textDim;
  return (
    <Pressable
      onPress={() => onToggle(type)}
      style={[styles.chip, active && { backgroundColor: `${color}22`, borderColor: `${color}88` }]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`Filter by ${type}`}
    >
      <Text style={[styles.label, { color: active ? color : colors.textDim }]}>{type.toUpperCase()}</Text>
    </Pressable>
  );
});

export function TypeFilter({ types, active, onToggle }: TypeFilterProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroller}
      contentContainerStyle={styles.row}
      keyboardShouldPersistTaps="handled"
    >
      {types.map((type) => (
        <TypeChip key={type} type={type} active={active.includes(type)} onToggle={onToggle} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({

  scroller: { height: 40, flexGrow: 0, marginTop: spacing.md },
  row: { gap: 6, paddingHorizontal: spacing.lg, alignItems: 'center' },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  label: { fontFamily: font.mono, fontSize: 10, lineHeight: 15, fontWeight: '700', letterSpacing: 0.9 },
});
