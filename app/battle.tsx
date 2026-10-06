import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createSide, memberFromSide, sideFromMember } from '@/features/battle/logic/createSide';
import { applyXp, xpReward } from '@/features/battle/logic/levelUp';
import {
  foeCaptureChance,
  resolveTurn,
  type BallName,
  type BattleAction,
  type BattleEvent,
  type BattleState,
} from '@/features/battle/logic/turnEngine';
import { BattleView, type BattlePanel } from '@/features/battle/ui/BattleView';
import { createMember } from '@/features/party/store/partySlice';
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
  const lead = party.find((member) => member.id === leaderId) ?? party[0];
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

  const rng = useRef(mulberry32(wildId * 7919 + wildLevel)).current;
  const settled = useRef(false);

  // A faint with a healthy replacement left is not a loss: the player must switch.
  const mustSwitch = battle?.outcome === 'lost' && party.some((m) => m.hp > 0 && m.id !== activeMemberId);

  /** Rewards and write-backs run exactly once per finished battle, from the action handler. */
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
      const paid = action.kind === 'ball' ? store.spendItem(action.ball) : action.kind === 'item' ? store.spendItem('potion') : true;
      if (!paid) {
        setEvents([{ kind: 'ball', text: 'Nothing left in the bag for that.' }]);
        return;
      }

      const resolved = resolveTurn(battle, action, rng);
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
      settled.current = false;
      setActiveMemberId(member.id);
      setPanel('moves');
      setEvents([{ kind: 'switch', text: `Go, ${titleCase(member.name)}!` }]);
      setBattle((current) => (current ? { ...current, player: side, outcome: 'ongoing' } : current));
    },
    [],
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
            <Pressable style={styles.continue} onPress={leave} accessibilityRole="button">
              <Text style={styles.continueLabel}>{settlement.outcome === 'lost' ? 'BACK TO THE GRASS' : 'CONTINUE'}</Text>
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
  continueLabel: { color: colors.accentOn, fontWeight: '800', fontSize: 13, letterSpacing: 1 },
});
