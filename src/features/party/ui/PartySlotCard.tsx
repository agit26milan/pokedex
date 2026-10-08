import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Sprite } from '@/shared/components/Sprite';
import { titleCase } from '@/shared/lib/format';
import { colors, font, radius, spacing } from '@/theme/tokens';
import { combatRatingOf } from '../logic/strength';
import type { PartyMember } from '../types';

export type SlotState = 'idle' | 'selected' | 'victim' | 'tappable';

interface PartySlotCardProps {
  member: PartyMember | undefined;
  index: number;
  isLead: boolean;
  state: SlotState;
  onPress: () => void;
}

const hpTone = (member: PartyMember): string => {
  if (member.hp <= 0) return colors.danger;
  return member.hp / Math.max(1, member.maxHp) > 0.5 ? colors.accent : colors.warn;
};

export const PartySlotCard = memo(function PartySlotCard({
  member,
  index,
  isLead,
  state,
  onPress,
}: PartySlotCardProps) {
  if (!member) {
    return (
      <View style={styles.empty} accessibilityLabel={`Empty party slot ${index + 1}`}>
        <Text style={styles.emptyPlus}>＋</Text>
        <Text style={styles.emptyLabel}>EMPTY SLOT</Text>
      </View>
    );
  }

  const name = titleCase(member.name);
  const fainted = member.hp <= 0;
  const ratio = Math.max(0, Math.min(1, member.hp / Math.max(1, member.maxHp)));

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.slot,
        isLead && styles.lead,
        state === 'selected' && styles.selected,
        state === 'victim' && styles.victim,
        state === 'tappable' && styles.tappable,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: state === 'selected' || state === 'victim' }}
      accessibilityLabel={`${name}, level ${member.level}, party slot ${index + 1}${isLead ? ', lead' : ''}`}
      accessibilityHint="Pick to send to storage, or to swap in"
    >
      <View style={[styles.art, isLead && styles.leadArt]}>
        <Sprite id={member.id} size={32} />
        {isLead ? (
          <View style={styles.star}>
            <Text style={styles.starLabel}>★</Text>
          </View>
        ) : null}
        {state === 'victim' ? (
          <View style={[styles.star, styles.down]}>
            <Text style={styles.starLabel}>↓</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.meta}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={[styles.level, fainted && styles.levelBad]} numberOfLines={1}>
          {fainted ? `LV ${member.level} · FAINTED` : `LV ${member.level} · CR ${combatRatingOf(member)}`}
        </Text>
        <View style={styles.barRow}>
          <Text style={styles.barKey}>HP</Text>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${ratio * 100}%`, backgroundColor: hpTone(member) }]} />
          </View>
          <Text style={[styles.barValue, fainted && styles.levelBad]}>{member.hp}</Text>
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  slot: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  lead: { borderColor: 'rgba(124,255,107,0.40)', backgroundColor: 'rgba(124,255,107,0.08)' },
  selected: { borderColor: colors.info, backgroundColor: 'rgba(79,209,255,0.07)' },
  victim: { borderColor: colors.warn, backgroundColor: 'rgba(255,176,32,0.08)' },
  tappable: { borderStyle: 'dashed', borderColor: 'rgba(79,209,255,0.40)' },
  art: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0E1428',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  leadArt: { borderColor: 'rgba(124,255,107,0.55)' },
  star: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 17,
    height: 17,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  down: { backgroundColor: colors.warn },
  starLabel: { color: colors.accentOn, fontSize: 9, fontWeight: '800' },
  meta: { flex: 1, gap: 3, justifyContent: 'center' },
  name: { color: colors.text, fontSize: 11.5, fontWeight: '800' },
  level: { color: colors.info, fontFamily: font.mono, fontSize: 8.5, fontWeight: '600' },
  levelBad: { color: colors.danger },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  barKey: { color: colors.textFaint, fontFamily: font.mono, fontSize: 7.5, fontWeight: '700' },
  track: { flex: 1, height: 5, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.10)', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 99 },
  barValue: { width: 20, textAlign: 'right', color: colors.text, fontFamily: font.mono, fontSize: 8, fontWeight: '700' },
  empty: {
    flex: 1,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.14)',
  },
  emptyPlus: { color: colors.textFaint, fontSize: 15, lineHeight: 17 },
  emptyLabel: { color: colors.textFaint, fontFamily: font.mono, fontSize: 8, letterSpacing: 1.2 },
});
