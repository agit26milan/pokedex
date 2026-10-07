import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Sprite } from '@/shared/components/Sprite';
import { maxPpOf } from '@/shared/data/moves';
import { titleCase } from '@/shared/lib/format';
import type { Bag, PartyMember } from '@/features/party/types';
import { colors, font, radius, spacing } from '@/theme/tokens';

interface WorldHudProps {
  partner: PartyMember | undefined;
  bag: Bag;
  steps: number;
  encounterRisk: number;
  chunkLabel: string;
  isLead?: boolean;
  leadHint?: string;

  onNewRun?: () => void;
  onOpenParty?: () => void;
}

export function WorldHud({
  partner,
  bag,
  steps,
  encounterRisk,
  chunkLabel,
  isLead = true,
  leadHint,
  onNewRun,
  onOpenParty,
}: WorldHudProps) {
  const hpRatio = partner ? Math.max(0, Math.min(1, partner.hp / partner.maxHp)) : 0;

  const pp = partner ? partner.moves.reduce((total, slot) => total + slot.pp, 0) : 0;
  const maxPp = partner ? partner.moves.reduce((total, slot) => total + maxPpOf(slot.name), 0) : 0;

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        <Pressable
          style={styles.card}
          onPress={onOpenParty}
          disabled={!onOpenParty}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Buka party dan pilih lead"
          accessibilityHint="Pilih Pokémon yang turun pertama saat battle"
        >
          {partner ? (
            <>
              <View style={styles.who}>
                <View style={[styles.art, isLead && styles.artLead]}>
                  <Sprite id={partner.id} size={30} />
                  {isLead ? (
                    <View style={styles.sign}>
                      <Text style={styles.signLabel}>★</Text>
                    </View>
                  ) : null}
                </View>
                <View>
                  <Text style={styles.name}>{titleCase(partner.name)}</Text>
                  <Text style={[styles.level, pp <= 0 && styles.levelEmpty]}>
                    LV {partner.level} · {partner.hp}/{partner.maxHp} HP · PP {pp}/{maxPp}
                  </Text>
                </View>
              </View>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${hpRatio * 100}%` }]} />
              </View>
            </>
          ) : (
            <Text style={styles.name}>No partner yet</Text>
          )}
        </Pressable>

        <View style={styles.kit}>
          <Text style={styles.chip}>◓ {bag.pokeBall}</Text>
          <Text style={styles.chip}>✚ {bag.potion}</Text>
          {partner && onNewRun ? (
            <Pressable
              onPress={onNewRun}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Start a new run"
              style={styles.newRun}
            >
              <Text style={styles.newRunLabel}>↺ NEW RUN</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {leadHint ? (
        <View style={styles.hintRow}>
          <View style={styles.hintDot} />
          <Text style={styles.hintText}>{leadHint}</Text>
          <Text style={styles.hintMark}>{isLead ? '★' : '⌄'}</Text>
        </View>
      ) : null}

      <View style={styles.metaRow}>
        <Text style={styles.pill}>{chunkLabel}</Text>
        <Text style={styles.pill}>{steps} {steps === 1 ? 'STEP' : 'STEPS'}</Text>
        <View style={styles.meter}>
          <View style={styles.meterLabels}>
            <Text style={styles.meterLabel}>ENCOUNTER RISK</Text>
            <Text style={styles.meterValue}>{Math.round(encounterRisk * 100)}%</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.riskFill, { width: `${Math.min(100, encounterRisk * 100)}%` }]} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'stretch' },
  card: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  art: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0E1428',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  artLead: { borderColor: 'rgba(124,255,107,0.55)' },
  sign: {
    position: 'absolute',
    top: -7,
    right: -8,
    width: 17,
    height: 17,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  signLabel: { color: colors.accentOn, fontSize: 9.5, fontWeight: '800' },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(124,255,107,0.40)',
    backgroundColor: 'rgba(124,255,107,0.06)',
  },
  hintDot: { width: 6, height: 6, borderRadius: 99, backgroundColor: colors.accent },
  hintText: { flex: 1, color: '#B6FFAE', fontFamily: font.mono, fontSize: 9, letterSpacing: 1.4 },
  hintMark: { color: colors.accent, fontSize: 11 },
  who: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { color: colors.text, fontWeight: '800', fontSize: 13.5 },
  level: { color: colors.accent, fontFamily: font.mono, fontSize: 9.5, marginTop: 3 },
  levelEmpty: { color: colors.danger },
  track: { height: 6, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.10)', overflow: 'hidden', marginTop: 8 },
  fill: { height: '100%', borderRadius: 99, backgroundColor: colors.accent },
  kit: { gap: 6, justifyContent: 'center', alignItems: 'flex-end' },
  newRun: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  newRunLabel: { color: colors.danger, fontFamily: font.mono, fontSize: 8.5, letterSpacing: 0.8 },
  chip: {
    color: colors.text,
    fontFamily: font.mono,
    fontSize: 10.5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pill: {
    color: colors.textDim,
    fontFamily: font.mono,
    fontSize: 9,
    letterSpacing: 1,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
  },
  meter: { flex: 1 },
  meterLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  meterLabel: { color: colors.textDim, fontFamily: font.mono, fontSize: 8.5, letterSpacing: 1 },
  meterValue: { color: colors.warn, fontFamily: font.mono, fontSize: 8.5 },
  riskFill: { height: '100%', borderRadius: 99, backgroundColor: colors.warn },
});
