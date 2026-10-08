import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Sprite } from '@/shared/components/Sprite';
import { TypeBadge } from '@/shared/components/TypeBadge';
import { getEntry } from '@/shared/data/dex';
import { titleCase } from '@/shared/lib/format';
import { colors, font, radius, spacing } from '@/theme/tokens';
import { combatRatingOf } from '../logic/strength';
import type { PartyMember } from '../types';

export type RowState = 'idle' | 'selected' | 'tappable';

interface StorageRowProps {
  member: PartyMember;
  index: number;
  state: RowState;
  onPress: () => void;
}

export const StorageRow = memo(function StorageRow({ member, index, state, onPress }: StorageRowProps) {
  const entry = getEntry(member.id);
  const name = titleCase(member.name);
  const fainted = member.hp <= 0;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, state === 'selected' && styles.selected, state === 'tappable' && styles.tappable]}
      accessibilityRole="button"
      accessibilityState={{ selected: state === 'selected' }}
      accessibilityLabel={`${name}, level ${member.level}, storage ${index + 1}`}
      accessibilityHint="Pilih untuk ditarik ke party"
    >
      <View style={styles.art}>
        <Sprite id={member.id} size={32} />
        {state === 'selected' ? (
          <View style={styles.sign}>
            <Text style={styles.signLabel}>↑</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.meta}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <View style={styles.badges}>
          {entry ? entry.types.map((type) => <TypeBadge key={type} type={type} compact />) : null}
          <View style={styles.tag}>
            <Text style={styles.tagLabel}>LV {member.level}</Text>
          </View>
          {fainted ? (
            <View style={[styles.tag, styles.tagBad]}>
              <Text style={[styles.tagLabel, styles.tagBadLabel]}>FAINTED</Text>
            </View>
          ) : (
            <View style={styles.tag}>
              <Text style={styles.tagLabel}>CR {combatRatingOf(member)}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  selected: { borderColor: colors.info, backgroundColor: 'rgba(79,209,255,0.07)' },
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
  sign: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 17,
    height: 17,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.info,
  },
  signLabel: { color: '#04222E', fontSize: 10, fontWeight: '800' },
  meta: { flex: 1, gap: 5, justifyContent: 'center' },
  name: { color: colors.text, fontSize: 11.5, fontWeight: '800' },
  badges: { flexDirection: 'row', gap: 4, flexWrap: 'wrap', alignItems: 'center' },
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  tagLabel: { color: colors.textDim, fontFamily: font.mono, fontSize: 8, fontWeight: '700', letterSpacing: 0.8 },
  tagBad: { borderColor: 'rgba(255,92,122,0.35)', backgroundColor: 'rgba(255,92,122,0.14)' },
  tagBadLabel: { color: '#FFC0CD' },
});
