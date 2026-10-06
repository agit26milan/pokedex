import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Sprite } from '@/shared/components/Sprite';
import { TypeBadge } from '@/shared/components/TypeBadge';
import { STARTER_IDS } from '@/features/party/types';
import { getEntry, movesetFor } from '@/shared/data/dex';
import { titleCase } from '@/shared/lib/format';
import { colors, font, radius, spacing } from '@/theme/tokens';

interface StarterCardProps {
  id: number;
  selected: boolean;
  onPick: (id: number) => void;
}

const StarterCard = memo(function StarterCard({ id, selected, onPick }: StarterCardProps) {
  const entry = getEntry(id);
  if (!entry) return null;

  const stats = entry.baseStats;
  return (
    <Pressable
      onPress={() => onPick(id)}
      style={[styles.card, selected && styles.selected]}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`Choose ${titleCase(entry.name)}`}
    >
      <View style={styles.art}>
        <Sprite id={id} size={52} />
      </View>
      <View style={styles.info}>
        <Text style={styles.number}>#{String(id).padStart(3, '0')}</Text>
        <Text style={styles.name}>{titleCase(entry.name)}</Text>
        <View style={styles.types}>
          {entry.types.map((type) => (
            <TypeBadge key={type} type={type} compact />
          ))}
        </View>
        <Text style={styles.stats}>
          HP {stats.hp} · ATK {stats.attack} · SPD {stats.speed}
        </Text>
      </View>
    </Pressable>
  );
});

interface PartnerPickerProps {
  selectedId: number | null;
  onSelect: (id: number) => void;
  onConfirm: () => void;
}

export function PartnerPicker({ selectedId, onSelect, onConfirm }: PartnerPickerProps) {
  const selectedEntry = selectedId ? getEntry(selectedId) : undefined;
  const moves = selectedEntry ? movesetFor(selectedEntry, 5) : [];

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>STEP 1 OF 2</Text>
      <Text style={styles.title}>Choose your partner</Text>
      <Text style={styles.subtitle}>Your partner starts at level 5 and walks with you.</Text>

      <View style={styles.list}>
        {STARTER_IDS.map((id) => (
          <StarterCard key={id} id={id} selected={selectedId === id} onPick={onSelect} />
        ))}
      </View>

      {selectedEntry ? (
        <Text style={styles.moves}>
          STARTS WITH: {moves.map((move) => titleCase(move)).join(' · ')}
        </Text>
      ) : null}

      <Pressable
        onPress={onConfirm}
        disabled={selectedId === null}
        style={[styles.cta, selectedId === null && styles.ctaDisabled]}
        accessibilityRole="button"
        accessibilityState={{ disabled: selectedId === null }}
      >
        <Text style={styles.ctaLabel}>
          {selectedEntry ? `Walk out with ${titleCase(selectedEntry.name)}` : 'Pick a partner to continue'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.sm },
  eyebrow: { color: colors.accent, fontFamily: font.mono, fontSize: 10, letterSpacing: 2.4 },
  title: { color: colors.text, fontSize: 26, fontWeight: '800' },
  subtitle: { color: colors.textDim, fontSize: 12.5 },
  list: { gap: spacing.sm, marginTop: spacing.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  selected: {
    borderColor: `${colors.accent}88`,
    backgroundColor: `${colors.accent}14`,
  },
  art: {
    width: 62,
    height: 62,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  info: { flex: 1, gap: 3 },
  number: { color: colors.textDim, fontFamily: font.mono, fontSize: 9.5 },
  name: { color: colors.text, fontSize: 16, fontWeight: '800' },
  types: { flexDirection: 'row', gap: 5, marginVertical: 3 },
  stats: { color: colors.textDim, fontFamily: font.mono, fontSize: 9.5 },
  moves: { color: colors.textFaint, fontFamily: font.mono, fontSize: 9.5, letterSpacing: 1, marginTop: 4 },
  cta: {
    marginTop: 'auto',
    marginBottom: spacing.lg,
    paddingVertical: 16,
    borderRadius: radius.lg,
    alignItems: 'center',
    backgroundColor: colors.accent,
  },
  ctaDisabled: { backgroundColor: 'rgba(255,255,255,0.08)' },
  ctaLabel: { color: colors.accentOn, fontWeight: '800', fontSize: 14 },
});
