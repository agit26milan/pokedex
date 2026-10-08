import { Children, memo, useMemo, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Sprite } from '@/shared/components/Sprite';
import { TypeBadge } from '@/shared/components/TypeBadge';
import { moveInfo } from '@/shared/data/moves';
import { titleCase } from '@/shared/lib/format';
import type { Bag, PartyMember } from '@/features/party/types';
import { colors, font, radius, spacing } from '@/theme/tokens';
import type { BallName, BattleEvent, BattleSide } from '../logic/turnEngine';
import { HpBar } from './HpBar';
import { XpBar } from './XpBar';
import { GrassField } from './GrassField';
import { xpForLevel } from '../logic/stats';
export type BattlePanel = 'moves' | 'bag' | 'party';

interface BattleViewProps {
  player: BattleSide;
  foe: BattleSide;
  party: PartyMember[];
  bag: Bag;
  events: BattleEvent[];
  panel: BattlePanel;
  catchChance: number;
  onPanel: (panel: BattlePanel) => void;
  onMove: (move: string) => void;
  onBall: (ball: BallName) => void;
  onPotion: () => void;
  onSwitch: (member: PartyMember) => void;
  onRun: () => void;
  onHyperPotion: () => void;
}

export function BattleView({
  player,
  foe,
  party,
  bag,
  events,
  panel,
  catchChance,
  onPanel,
  onMove,
  onBall,
  onPotion,
  onHyperPotion,
  onSwitch,
  onRun,
}: BattleViewProps) {
  const log = events.slice(-2);

  const playerXp = useMemo(() => {
    return party.find((member) => member.id === player.id)?.xp ?? 0;
  }, [party, player])

  return (
    <View style={styles.screen}>
      <View style={styles.arena}>
        <GrassField />
        <View style={styles.foeRow}>
          <Plate side={foe} />
          <Sprite id={foe.id} size={104} />
        </View>
        <View style={styles.playerRow}>
          <Sprite id={player.id} size={124} back />
          <Plate level={player.level} xp={playerXp} side={player} showNumbers />
        </View>
      </View>

      <View style={styles.log}>
        {log.length === 0 ? (
          <Text style={styles.logText}>What will {titleCase(player.name)} do?</Text>
        ) : (
          log.map((event, index) => (
            <Text key={`${event.kind}-${index}`} style={[styles.logText, index === log.length - 1 && styles.logLatest]}>
              {event.text}
            </Text>
          ))
        )}
      </View>

      {panel === 'moves' ? <MoveGrid player={player} onMove={onMove} /> : null}

      {panel === 'bag' ? (
        <Grid>
          <Option label="POKé BALL" hint={`${bag.pokeBall} LEFT · ${Math.round(catchChance * 100)}%`} disabled={bag.pokeBall <= 0} onPress={() => onBall('pokeBall')} />
          <Option label="GREAT BALL" hint={`${bag.greatBall} LEFT`} disabled={bag.greatBall <= 0} onPress={() => onBall('greatBall')} />
          <Option label="POTION" hint={`${bag.potion} LEFT · +20 HP`} disabled={bag.potion <= 0} onPress={onPotion} />
          <Option label="HYPER POTION" hint={`${bag.hyperPotion} LEFT · +60 HP`} disabled={bag.hyperPotion <= 0} onPress={onHyperPotion} />
          <Option label="BACK" hint="RETURN TO MOVES" onPress={() => onPanel('moves')} />
        </Grid>
      ) : null}

      {panel === 'party' ? (
        <ScrollView style={styles.party} contentContainerStyle={styles.partyContent}>
          {party.map((member) => {
            const active = member.id === player.id;
            return (
              <Pressable
                key={member.id}
                disabled={active || member.hp <= 0}
                onPress={() => onSwitch(member)}
                style={[styles.partyRow, active && styles.partyActive, member.hp <= 0 && styles.partyFainted]}
                accessibilityRole="button"
                accessibilityState={{ disabled: active || member.hp <= 0 }}
              >
                <Sprite id={member.id} size={30} />
                <Text style={styles.partyName}>{titleCase(member.name)}</Text>
                <Text style={styles.partyHp}>
                  {member.hp}/{member.maxHp}
                </Text>
                {active ? <Text style={styles.partyTag}>ACTIVE</Text> : null}
              </Pressable>
            );
          })}
          <Option label="BACK" hint="RETURN TO MOVES" onPress={() => onPanel('moves')} />
        </ScrollView>
      ) : null}

      <View style={styles.actions}>
        <Option label="BAG" hint={`◓ ${bag.pokeBall + bag.greatBall}`} onPress={() => onPanel('bag')} />
        <Option label="POKéMON" hint={`${party.filter((m) => m.hp > 0).length} READY`} onPress={() => onPanel('party')} />
        <Option label="RUN" hint="80%" onPress={onRun} />
      </View>
    </View>
  );
}

function Plate({ side, showNumbers = false, xp = 0, level = 0 }: { side: BattleSide; showNumbers?: boolean, xp?: number, level?: number }) {
  return (
    <View style={styles.plate}>
      <View style={styles.plateRow}>
        <Text style={styles.plateName}>{titleCase(side.name)}</Text>
        <Text style={styles.plateLevel}>LV {side.level}</Text>
      </View>
      <HpBar hp={side.hp} maxHp={side.maxHp} showNumbers={showNumbers} />
      <XpBar xp={ xp - xpForLevel(level)} maxXp={xpForLevel(level + 1) - xpForLevel(level)} showNumbers={showNumbers} />
      <View style={styles.plateTypes}>
        {side.types.map((type) => (
          <TypeBadge key={type} type={type} compact />
        ))}
      </View>
    </View>
  );
}

const MoveButton = memo(function MoveButton({ name, pp, onMove }: { name: string; pp: number; onMove: (move: string) => void }) {
  const info = moveInfo(name);
  return (
    <Pressable
      disabled={pp <= 0}
      onPress={() => onMove(name)}
      style={[styles.move, pp <= 0 && styles.disabled]}
      accessibilityRole="button"
      accessibilityLabel={`Use ${titleCase(name)}, ${pp} PP left`}
    >
      <Text style={styles.moveName}>{titleCase(name)}</Text>
      <View style={styles.moveMeta}>
        <TypeBadge type={info?.type ?? 'normal'} compact />
        <Text style={styles.moveStat}>PWR {info?.power ? info.power : '—'}</Text>
        <Text style={styles.movePp}>
          PP {pp}/{info?.pp ?? pp}
        </Text>
      </View>
    </Pressable>
  );
});

const GRID_COLUMNS = 3;

const chunk = <T,>(items: readonly T[], size: number): T[][] => {
  const rows: T[][] = [];
  for (let index = 0; index < items.length; index += size) rows.push(items.slice(index, index + size));
  return rows;
};

function Grid({ children }: { children: ReactNode }) {
  const rows = chunk(Children.toArray(children), GRID_COLUMNS);

  return (
    <View style={styles.grid} testID="grid">
      {rows.map((row, index) => (
        <View key={index} style={styles.gridRow} testID="grid-row">
          {row}
          {Array.from({ length: GRID_COLUMNS - row.length }, (_, slot) => (
            <View key={`slot-${slot}`} style={styles.gridSlot} testID="grid-spacer" />
          ))}
        </View>
      ))}
    </View>
  );
}

function MoveGrid({ player, onMove }: { player: BattleSide; onMove: (move: string) => void }) {
  return (
    <Grid>
      {player.moves.map((move) => (
        <MoveButton key={move.name} name={move.name} pp={move.pp} onMove={onMove} />
      ))}
    </Grid>
  );
}

function Option({ label, hint, disabled = false, onPress }: { label: string; hint: string; disabled?: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.option, disabled && styles.disabled]}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      <Text style={styles.optionLabel}>{label}</Text>
      <Text style={styles.optionHint}>{hint}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#05070F' },
  arena: {
    flex: 1,
    overflow: 'hidden',
    padding: spacing.lg,
    justifyContent: 'space-between',
    backgroundColor: '#070B16',
  },
  foeRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  playerRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  plate: {
    minWidth: 168,
    gap: 7,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(12,18,36,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  plateRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing.sm },
  plateName: { color: colors.text, fontWeight: '800', fontSize: 14 },
  plateLevel: { color: colors.accent, fontFamily: font.mono, fontSize: 9.5 },
  plateTypes: { flexDirection: 'row', gap: 5, marginTop: 4 },
  log: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: 3 },
  logText: { color: colors.textDim, fontSize: 12, lineHeight: 17 },
  logLatest: { color: colors.text },
  grid: { gap: spacing.sm, paddingHorizontal: spacing.lg },
  gridRow: { flexDirection: 'row', gap: spacing.sm },
  gridSlot: { flex: 1 },
  move: {
    flex: 1,
    gap: 7,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  moveName: { color: colors.text, fontWeight: '700', fontSize: 12.5 },
  moveMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  moveStat: { color: colors.textDim, fontFamily: font.mono, fontSize: 9 },
  movePp: { color: colors.accent, fontFamily: font.mono, fontSize: 9 },
  disabled: { opacity: 0.45 },
  actions: { flexDirection: 'row', gap: spacing.sm, padding: spacing.lg },
  option: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 13,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  optionLabel: { color: colors.text, fontFamily: font.mono, fontSize: 10, letterSpacing: 1.2 },
  optionHint: { color: colors.textFaint, fontFamily: font.mono, fontSize: 8, letterSpacing: 0.8 },
  party: { maxHeight: 190 },
  partyContent: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  partyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  partyActive: { borderColor: `${colors.accent}66` },
  partyFainted: { opacity: 0.4 },
  partyName: { color: colors.text, fontSize: 12.5, flex: 1, fontWeight: '700' },
  partyHp: { color: colors.textDim, fontFamily: font.mono, fontSize: 9.5 },
  partyTag: { color: colors.accent, fontFamily: font.mono, fontSize: 8, letterSpacing: 1 },
});
