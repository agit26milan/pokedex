import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createSide, memberFromSide, sideFromMember } from '@/features/battle/logic/createSide';
import { applyXp, xpReward } from '@/features/battle/logic/levelUp';
import { evolveMember, evolutionFor } from '@/features/battle/logic/evolve';
import { EvolutionMoment } from '@/features/battle/ui/EvolutionMoment';
import {
  consumedFrom,
  foeCaptureChance,
  resolveTurn,
  type BallName,
  type BattleAction,
  type BattleEvent,
  type BattleState,
} from '@/features/battle/logic/turnEngine';
import { sideSync } from '@/features/battle/logic/syncParty';
import { BattleView, type BattlePanel } from '@/features/battle/ui/BattleView';
import { createMember } from '@/features/party/store/partySlice';
import { leadOf } from '@/features/party/logic/activeMember';
import type { PartyMember } from '@/features/party/types';
import { titleCase } from '@/shared/lib/format';
import { mulberry32 } from '@/shared/lib/rng';
import { useStore } from '@/store';
import { colors, font, radius, spacing } from '@/theme/tokens';

const DEFAULT_WILD_ID = 16;
const DEFAULT_WILD_LEVEL = 5;
const DROP_CHANCE = 0.2;
const OUTCOME_TITLE = { won: 'VICTORY', lost: 'DEFEATED', caught: 'CAUGHT', fled: 'ESCAPED' } as const;

type Outcome = keyof typeof OUTCOME_TITLE;

interface Settlement {
  outcome: Outcome;
  text: string;
}

function buildInitialBattle(wildId: number, level: number): BattleState | null {
  const foe = createSide(wildId, level);
  const { party, leaderId } = useStore.getState();
  const lead = leadOf(party, leaderId);
  const player = lead ? sideFromMember(lead) : undefined;
  return foe && player ? { player, foe, turn: 0, outcome: 'ongoing' } : null;
}

export default function BattleScreen() {
  const params = useLocalSearchParams<{ wildId?: string; level?: string }>();
  const router = useRouter();

  const party = useStore((state) => state.party);
  const bag = useStore((state) => state.bag);
  const leaderId = useStore((state) => state.leaderId);

  const wildId = Number(params.wildId ?? DEFAULT_WILD_ID);
  const wildLevel = Number(params.level ?? DEFAULT_WILD_LEVEL);

  const [battle, setBattle] = useState<BattleState | null>(() => buildInitialBattle(wildId, wildLevel));
  const [events, setEvents] = useState<BattleEvent[]>([]);
  const [panel, setPanel] = useState<BattlePanel>('moves');
  const [activeMemberId, setActiveMemberId] = useState<number | null>(leaderId ?? party[0]?.id ?? null);
  const [settlement, setSettlement] = useState<Settlement | null>(null);
  const [evolution, setEvolution] = useState<{ from: PartyMember; to: PartyMember; done: boolean } | null>(null);

  const rng = useRef(mulberry32(wildId * 7919 + wildLevel)).current;
  const settled = useRef(false);

  const mustSwitch = battle?.outcome === 'lost' && party.some((m) => m.hp > 0 && m.id !== activeMemberId);

  const settle = useCallback(
    (finished: BattleState, index: number, wasFaintWithReserve: boolean) => {
      const store = useStore.getState();
      if (index >= 0) store.updateMember(index, memberFromSide(store.party[index]!, finished.player));
      if (wasFaintWithReserve) return;

      void Haptics.notificationAsync(
        finished.outcome === 'lost' ? Haptics.NotificationFeedbackType.Error : Haptics.NotificationFeedbackType.Success,
      );

      if (finished.outcome === 'won') {
        const member = useStore.getState().party[index];
        const reward = member ? xpReward(finished.foe.level, member.level) : 0;
        const grown = member ? applyXp(member, reward) : null;
        if (grown) useStore.getState().updateMember(index, grown.member);
        const step = grown ? evolutionFor(grown.member.id, grown.member.level) : null;
        const next = grown && step ? evolveMember(grown.member, step) : null;
        if (grown && next) {
          useStore.getState().updateMember(index, next);
          setEvolution({ from: grown.member, to: next, done: false });
        }
        if (rng() < DROP_CHANCE) useStore.getState().grantItem(rng() < 0.5 ? 'potion' : 'pokeBall', 1);

        const levels = grown?.levelsGained ? ` · now Lv ${grown.member.level}` : '';
        const learned = grown?.learned.length ? ` · learned ${grown.learned.map(titleCase).join(', ')}` : '';
        setSettlement({ outcome: 'won', text: `${reward} XP earned${levels}${learned}` });
        return;
      }

      if (finished.outcome === 'caught') {
        const caught = createMember(finished.foe.id, finished.foe.level);
        if (caught) {
          useStore.getState().addCaught({ ...caught, hp: Math.max(1, finished.foe.hp) });
          setSettlement({ outcome: 'caught', text: `${titleCase(finished.foe.name)} joined your run (party or storage).` });
        }
        return;
      }

      if (finished.outcome === 'fled') {
        setSettlement({ outcome: 'fled', text: 'You got away safely.' });
        return;
      }

      useStore.getState().healParty(0.5);
      setSettlement({ outcome: 'lost', text: 'Your Pokémon fainted. Back to the grass — they recovered a little.' });
    },
    [rng],
  );

  const act = useCallback(
    (action: BattleAction) => {
      if (!battle || battle.outcome !== 'ongoing') return;

      const store = useStore.getState();
      const affordable =
        action.kind === 'ball' ? store.bag[action.ball] > 0 : action.kind === 'item' ? store.bag.potion > 0 : true;
      if (!affordable) {
        setEvents([{ kind: 'ball', text: 'Nothing left in the bag for that.' }]);
        return;
      }

      const resolved = resolveTurn(battle, action, rng);

      if (consumedFrom(resolved.events)) {
        const spent = action.kind === 'ball' ? store.spendItem(action.ball) : action.kind === 'item' ? store.spendItem('potion') : true;
        if (!spent) return;
      }

      const sync = sideSync(action, activeMemberId, battle.player, resolved.state.player);
      if (sync) {
        const index = useStore.getState().party.findIndex((member) => member.id === sync.memberId);
        if (index >= 0) {
          useStore.getState().updateMember(index, memberFromSide(useStore.getState().party[index]!, sync.side));
        }
      }

      const index = useStore.getState().party.findIndex((member) => member.id === activeMemberId);
      const reserve = useStore
        .getState()
        .party.some((member) => member.hp > 0 && member.id !== activeMemberId && member.id !== resolved.state.player.id);

      if (resolved.state.outcome !== 'ongoing') settle(resolved.state, index, resolved.state.outcome === 'lost' && reserve);

      setBattle(resolved.state);
      setEvents(resolved.events);
      if (action.kind === 'move') setPanel('moves');
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [activeMemberId, battle, rng, settle],
  );

  const switchTo = useCallback(
    (member: PartyMember) => {
      const side = sideFromMember(member);
      if (!side) return;

      if (battle && activeMemberId !== null) {
        const leavingIndex = party.findIndex((current) => current.id === activeMemberId);
        if (leavingIndex >= 0) {
          useStore.getState().updateMember(leavingIndex, memberFromSide(party[leavingIndex]!, battle.player));
        }
      }

      settled.current = false;
      setActiveMemberId(member.id);
      setPanel('moves');
      setEvents([{ kind: 'switch', text: `Go, ${titleCase(member.name)}!` }]);
      setBattle((current) => (current ? { ...current, player: side, outcome: 'ongoing' } : current));
    },
    [activeMemberId, battle, party],
  );

  const leave = useCallback(() => {
    useStore.getState().markEncounterResolved();
    router.back();
  }, [router]);

  if (!battle) {
    return (
      <SafeAreaView style={styles.screen}>
        <Text style={styles.loading}>No battle to fight. Head back to the grass.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <BattleView
        player={battle.player}
        foe={battle.foe}
        party={party}
        bag={bag}
        events={events}
        panel={mustSwitch ? 'party' : panel}
        catchChance={foeCaptureChance(battle.foe, 'pokeBall')}
        onPanel={setPanel}
        onMove={(move) => act({ kind: 'move', move })}
        onBall={(ball: BallName) => act({ kind: 'ball', ball })}
        onPotion={() => act({ kind: 'item', item: 'potion' })}
        onSwitch={switchTo}
        onRun={() => act({ kind: 'run' })}
      />

      {mustSwitch ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>CHOOSE YOUR NEXT POKéMON</Text>
        </View>
      ) : null}

      {settlement ? (
        <View style={styles.overlay}>
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>{OUTCOME_TITLE[settlement.outcome]}</Text>
            <Text style={styles.resultText}>{settlement.text}</Text>
            {evolution && !evolution.done ? (
              <EvolutionMoment
                fromId={evolution.from.id}
                fromName={evolution.from.name}
                toId={evolution.to.id}
                toName={evolution.to.name}
                onDone={() => setEvolution((current) => (current ? { ...current, done: true } : current))}
              />
            ) : null}
            {evolution && evolution.done ? (
              <Text style={styles.resultText}>
                {`${titleCase(evolution.to.name)} · Lv ${evolution.to.level} · ${evolution.to.hp}/${evolution.to.maxHp} HP`}
              </Text>
            ) : null}
            <Pressable
              style={[styles.continue, evolution && !evolution.done ? styles.continueHeld : null]}
              onPress={leave}
              disabled={Boolean(evolution && !evolution.done)}
              accessibilityRole="button"
              accessibilityState={{ disabled: Boolean(evolution && !evolution.done) }}
            >
              <Text style={styles.continueLabel}>
                {settlement.outcome === 'lost' ? 'BACK TO THE GRASS' : 'CONTINUE'}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#05070F' },
  loading: { color: colors.textDim, padding: spacing.lg, fontFamily: font.mono, fontSize: 12 },
  banner: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    top: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: `${colors.warn}22`,
    borderWidth: 1,
    borderColor: `${colors.warn}66`,
  },
  bannerText: { color: colors.warn, fontFamily: font.mono, fontSize: 11, textAlign: 'center', letterSpacing: 1 },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(4,6,13,0.85)',
    padding: spacing.xl,
  },
  resultCard: {
    width: '100%',
    gap: spacing.md,
    padding: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: '#0B101F',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  resultTitle: { color: colors.accent, fontFamily: font.mono, fontSize: 12, letterSpacing: 3, textAlign: 'center' },
  resultText: { color: colors.text, fontSize: 13.5, lineHeight: 20, textAlign: 'center' },
  continue: { paddingVertical: 15, borderRadius: radius.lg, alignItems: 'center', backgroundColor: colors.accent },
  continueHeld: { opacity: 0.35 },
  continueLabel: { color: colors.accentOn, fontWeight: '800', fontSize: 13, letterSpacing: 1 },
});
