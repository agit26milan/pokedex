import { StyleSheet, Text, View } from 'react-native';

import { TypeBadge } from '@/shared/components/TypeBadge';
import { titleCase } from '@/shared/lib/format';
import { colors, font, radius, spacing } from '@/theme/tokens';
import { movesOf, strengthOf } from '../logic/strength';
import type { PartyMember } from '../types';

interface StrengthPanelProps {
  member: PartyMember;
  rank?: { rank: number; total: number };
}

export function StrengthPanel({ member, rank }: StrengthPanelProps) {
  const { stats, combatRating, grade, baseTotal } = strengthOf(member);
  if (!stats) return null;

  const rows = [
    { label: 'ATTACK', value: stats.attack },
    { label: 'DEFENSE', value: stats.defense },
    { label: 'SP. ATK', value: stats.specialAttack },
    { label: 'SP. DEF', value: stats.specialDefense },
    { label: 'SPEED', value: stats.speed },
    { label: 'MAX HP', value: stats.hp },
  ];
  const peak = Math.max(...rows.map((row) => row.value), 1);
  const moves = movesOf(member);

  return (
    <View style={styles.panel}>
      <View style={styles.head}>
        <Text style={styles.eyebrow}>STRENGTH · LV {member.level}</Text>
        <Text style={styles.source}>statsAt() · BST {baseTotal}</Text>
      </View>

      <View style={styles.grid}>
        {rows.map((row) => (
          <View key={row.label} style={styles.cell}>
            <View style={styles.cellHead}>
              <Text style={styles.cellLabel}>{row.label}</Text>
              <Text style={styles.cellValue}>{row.value}</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${Math.round((row.value / peak) * 100)}%` }]} />
            </View>
          </View>
        ))}
      </View>

      <View style={styles.moves}>
        {moves.map((move) => (
          <View key={move.name} style={styles.move}>
            <Text style={styles.moveName}>{titleCase(move.name)}</Text>
            <TypeBadge type={move.type} compact />
            <Text style={styles.movePower}>{move.power} PWR</Text>
            <Text style={styles.movePp}>
              {move.pp}/{move.maxPp}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.rating}>
        <View style={styles.gradeBox}>
          <Text style={styles.grade}>{grade}</Text>
        </View>
        <Text style={styles.ratingLabel}>COMBAT RATING {combatRating}</Text>
        {rank && rank.rank > 0 ? (
          <Text style={styles.ratingRank}>
            #{rank.rank} / {rank.total}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: '#0A0E1A',
    borderWidth: 1,
    borderColor: 'rgba(79,209,255,0.20)',
    gap: spacing.sm,
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  eyebrow: { color: colors.info, fontFamily: font.mono, fontSize: 9, letterSpacing: 1.6 },
  source: { color: colors.textFaint, fontFamily: font.mono, fontSize: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: spacing.sm },
  cell: { width: '48%', gap: 4 },
  cellHead: { flexDirection: 'row', justifyContent: 'space-between' },
  cellLabel: { color: colors.textDim, fontFamily: font.mono, fontSize: 8, letterSpacing: 0.6 },
  cellValue: { color: colors.text, fontFamily: font.mono, fontSize: 9 },
  track: { height: 5, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.10)', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 99, backgroundColor: colors.info },
  moves: { gap: 5 },
  move: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  moveName: { color: colors.text, fontSize: 11, fontWeight: '700', flexShrink: 1 },
  movePower: { marginLeft: 'auto', color: colors.warn, fontFamily: font.mono, fontSize: 9 },
  movePp: { color: colors.info, fontFamily: font.mono, fontSize: 9 },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  gradeBox: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  grade: { color: colors.accentOn, fontFamily: font.mono, fontSize: 12, fontWeight: '800' },
  ratingLabel: { color: colors.textDim, fontFamily: font.mono, fontSize: 9, letterSpacing: 1 },
  ratingRank: { marginLeft: 'auto', color: colors.text, fontFamily: font.mono, fontSize: 12, fontWeight: '800' },
});
