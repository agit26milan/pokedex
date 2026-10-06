import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Sprite } from '@/shared/components/Sprite';
import { TypeBadge } from '@/shared/components/TypeBadge';
import { getEntry } from '@/shared/data/dex';
import { titleCase } from '@/shared/lib/format';
import { colors, font, radius, spacing } from '@/theme/tokens';
import type { WildEncounter } from '../logic/rollWild';

interface EncounterSheetProps {
  wild: WildEncounter;
  balls: number;
  onBattle: () => void;
  onRun: () => void;
}

/** Shown over the map so the player never loses the sense of where they were. */
export function EncounterSheet({ wild, balls, onBattle, onRun }: EncounterSheetProps) {
  const entry = getEntry(wild.id);
  if (!entry) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.scrim} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.alert}>A WILD POKÉMON APPEARED</Text>

        <View style={styles.card}>
          <Sprite id={entry.id} size={72} />
          <View style={styles.info}>
            <Text style={styles.name}>{titleCase(entry.name)}</Text>
            <Text style={styles.level}>LV {wild.level}</Text>
            <View style={styles.types}>
              {entry.types.map((type) => (
                <TypeBadge key={type} type={type} compact />
              ))}
            </View>
          </View>
        </View>

        <Pressable style={styles.primary} onPress={onBattle} accessibilityRole="button">
          <Text style={styles.primaryLabel}>BATTLE</Text>
          <Text style={styles.primaryHint}>WEAKEN IT, THEN CATCH IT</Text>
        </Pressable>

        <View style={styles.secondaryRow}>
          <View style={[styles.ghost, styles.disabled]}>
            <Text style={styles.ghostLabel}>THROW BALL</Text>
            <Text style={styles.ghostHint}>{balls > 0 ? `${balls} LEFT · IN BATTLE` : 'NONE LEFT'}</Text>
          </View>
          <Pressable style={styles.ghost} onPress={onRun} accessibilityRole="button">
            <Text style={styles.ghostLabel}>RUN AWAY</Text>
            <Text style={styles.ghostHint}>80% AGAINST WILD</Text>
          </Pressable>
        </View>

        <Text style={styles.note}>
          Ball throws resolve inside the battle, where the remaining HP of the wild Pokémon sets the odds.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, justifyContent: 'flex-end' },
  scrim: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(4,6,13,0.72)' },
  sheet: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: '#0B101F',
  },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.18)' },
  alert: { color: colors.warn, fontFamily: font.mono, fontSize: 10.5, letterSpacing: 2, textAlign: 'center' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  info: { gap: 4 },
  name: { color: colors.text, fontSize: 17, fontWeight: '800' },
  level: { color: colors.accent, fontFamily: font.mono, fontSize: 10 },
  types: { flexDirection: 'row', gap: 5, marginTop: 3 },
  primary: { paddingVertical: 15, borderRadius: radius.lg, alignItems: 'center', backgroundColor: colors.accent },
  primaryLabel: { color: colors.accentOn, fontWeight: '800', fontSize: 14, letterSpacing: 1 },
  primaryHint: { color: '#06240b99', fontFamily: font.mono, fontSize: 8.5, letterSpacing: 1, marginTop: 4 },
  secondaryRow: { flexDirection: 'row', gap: spacing.sm },
  ghost: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  disabled: { opacity: 0.5 },
  ghostLabel: { color: colors.text, fontFamily: font.mono, fontSize: 10, letterSpacing: 1.2 },
  ghostHint: { color: colors.textFaint, fontFamily: font.mono, fontSize: 8, marginTop: 4, letterSpacing: 0.8 },
  note: { color: colors.textFaint, fontSize: 11, lineHeight: 16 },
});
