import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Sprite } from '@/shared/components/Sprite';
import { TypeBadge } from '@/shared/components/TypeBadge';
import { getEntry } from '@/shared/data/dex';
import { titleCase } from '@/shared/lib/format';
import { colors, font, radius, spacing } from '@/theme/tokens';
import { strengthOf, xpProgress } from '../logic/strength';
import type { PartyMember } from '../types';

interface LeadRowProps {
  member: PartyMember;
  isLead: boolean;
  selected: boolean;
  onPress: () => void;
}

const hpTone = (hp: number, maxHp: number): string => {
  if (hp <= 0) return colors.danger;
  return hp / Math.max(1, maxHp) > 0.5 ? colors.accent : colors.warn;
};

export function LeadRow({ member, isLead, selected, onPress }: LeadRowProps) {
  const entry = getEntry(member.id);
  const { combatRating, grade } = strengthOf(member);
  const xp = xpProgress(member);
  const hpRatio = Math.max(0, Math.min(1, member.hp / Math.max(1, member.maxHp)));
  const fainted = member.hp <= 0;
  const readout = `${titleCase(member.name)}${isLead ? ', lead saat ini' : ''}, level ${member.level}, combat rating ${combatRating}, grade ${grade}`;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, isLead && styles.rowLead, selected && styles.rowSelected]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={readout}
      accessibilityHint="Buka rincian kekuatan dan pilihan lead"
    >
      <View style={[styles.art, isLead && styles.artLead]}>
        <Sprite id={member.id} size={40} />
        {isLead ? (
          <View style={styles.signOnArt}>
            <Text style={styles.signStar}>★</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <View style={styles.top}>
          <Text style={styles.number}>#{String(member.id).padStart(3, '0')}</Text>
          <Text style={styles.name}>{titleCase(member.name)}</Text>
          {isLead ? (
            <View style={styles.sign}>
              <Text style={styles.signLabel}>★ LEAD</Text>
            </View>
          ) : null}
          {fainted ? (
            <View style={styles.fainted}>
              <Text style={styles.faintedLabel}>FAINTED</Text>
            </View>
          ) : null}
          <View style={styles.levelTag}>
            <Text style={styles.levelLabel}>LV {member.level}</Text>
          </View>
        </View>

        {entry ? (
          <View style={styles.badges}>
            {entry.types.map((type) => (
              <TypeBadge key={type} type={type} compact />
            ))}
          </View>
        ) : null}

        <View style={styles.bars}>
          <View style={styles.barRow}>
            <Text style={styles.barKey}>HP</Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${hpRatio * 100}%`, backgroundColor: hpTone(member.hp, member.maxHp) }]} />
            </View>
            <Text style={[styles.barValue, fainted && styles.barValueBad]}>{member.hp}</Text>
          </View>
          <View style={styles.barRow}>
            <Text style={styles.barKey}>XP</Text>
            <View style={styles.track}>
              <View style={[styles.fill, styles.xpFill, { width: `${xp.ratio * 100}%` }]} />
            </View>
            <Text style={styles.barValue}>{Math.round(xp.ratio * 100)}%</Text>
          </View>
        </View>

        <View style={styles.rating}>
          <View style={[styles.gradeBox, isLead && styles.gradeBoxLead]}>
            <Text style={styles.grade}>{grade}</Text>
          </View>
          <Text style={styles.ratingLabel}>COMBAT RATING</Text>
          <Text style={styles.ratingValue}>{combatRating}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  rowLead: {
    borderColor: 'rgba(124,255,107,0.45)',
    backgroundColor: 'rgba(124,255,107,0.08)',
  },
  rowSelected: { borderColor: colors.info },
  art: {
    width: 52,
    height: 52,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0E1428',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  artLead: { borderColor: 'rgba(124,255,107,0.55)' },
  signOnArt: {
    position: 'absolute',
    top: -7,
    right: -7,
    width: 18,
    height: 18,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  signStar: { color: colors.accentOn, fontSize: 10, fontWeight: '800' },
  body: { flex: 1, gap: 5 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  number: { color: colors.textFaint, fontFamily: font.mono, fontSize: 8.5 },
  name: { color: colors.text, fontSize: 12.5, fontWeight: '800' },
  sign: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 99, backgroundColor: colors.accent },
  signLabel: { color: colors.accentOn, fontFamily: font.mono, fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  fainted: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 99,
    backgroundColor: 'rgba(255,92,122,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,92,122,0.35)',
  },
  faintedLabel: { color: '#FFC0CD', fontFamily: font.mono, fontSize: 8, letterSpacing: 0.8 },
  levelTag: {
    marginLeft: 'auto',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(79,209,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(79,209,255,0.25)',
  },
  levelLabel: { color: colors.info, fontFamily: font.mono, fontSize: 8.5, fontWeight: '700' },
  badges: { flexDirection: 'row', gap: 5 },
  bars: { gap: 4 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  barKey: { width: 22, color: colors.textFaint, fontFamily: font.mono, fontSize: 8, fontWeight: '700' },
  track: { flex: 1, height: 5, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.10)', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 99 },
  xpFill: { backgroundColor: colors.info },
  barValue: { width: 26, textAlign: 'right', color: colors.text, fontFamily: font.mono, fontSize: 8.5, fontWeight: '700' },
  barValueBad: { color: colors.danger },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  gradeBox: {
    width: 20,
    height: 20,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.info,
  },
  gradeBoxLead: { backgroundColor: colors.accent },
  grade: { color: colors.accentOn, fontFamily: font.mono, fontSize: 9.5, fontWeight: '800' },
  ratingLabel: { color: colors.textDim, fontFamily: font.mono, fontSize: 8, letterSpacing: 1 },
  ratingValue: { marginLeft: 'auto', color: colors.text, fontFamily: font.mono, fontSize: 11, fontWeight: '800' },
});
