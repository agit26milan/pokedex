import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { throwBall } from '@/features/battle/logic/worldThrow';
import { PartnerPicker } from '@/features/party/ui/PartnerPicker';
import { LeadPickerSheet } from '@/features/party/ui/LeadPickerSheet';
import { createMember } from '@/features/party/store/partySlice';
import { Dpad } from '@/features/world/ui/Dpad';
import { EncounterSheet } from '@/features/world/ui/EncounterSheet';
import { WorldGrid } from '@/features/world/ui/WorldGrid';
import { WorldHud } from '@/features/world/ui/WorldHud';
import { ENCOUNTER_RATE, rollEncounter } from '@/features/world/logic/rollEncounter';
import { rollWild, type WildEncounter } from '@/features/world/logic/rollWild';
import { chunkOf, isBlocked, nextPosition, tileAt, type Direction } from '@/features/world/logic/world';
import { getEntry } from '@/shared/data/dex';
import { titleCase } from '@/shared/lib/format';
import { mulberry32 } from '@/shared/lib/rng';
import { useStore, caughtIdsOf } from '@/store';
import { colors, spacing } from '@/theme/tokens';

export default function PlayScreen() {
  const router = useRouter();

  const party = useStore((state) => state.party);
  const bag = useStore((state) => state.bag);
  const worldSeed = useStore((state) => state.worldSeed);
  const position = useStore((state) => state.position);
  const steps = useStore((state) => state.steps);
  const encounterRisk = useStore((state) => state.encounterRisk);
  const pendingEncounter = useStore((state) => state.pendingEncounter);
  const choosePartner = useStore((state) => state.choosePartner);
  const leaderId = useStore((state) => state.leaderId);
  const swapLeader = useStore((state) => state.swapLeader);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [sprint, setSprint] = useState(false);
  const [wild, setWild] = useState<WildEncounter | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [leadSheet, setLeadSheet] = useState(false);
  const [leadNotice, setLeadNotice] = useState<string | null>(null);
  const [leadTouched, setLeadTouched] = useState(false);

  useEffect(() => {
    if (!leadNotice) return;
    const timer = setTimeout(() => setLeadNotice(null), 2400);
    return () => clearTimeout(timer);
  }, [leadNotice]);

  const onOpenParty = useCallback(() => setLeadSheet(true), []);
  const onCloseParty = useCallback(() => {
    setLeadSheet(false);
    setLeadNotice(null);
  }, []);

  const onPickLead = useCallback(
    (id: number) => {
      const picked = useStore.getState().party.find((member) => member.id === id);
      swapLeader(id);
      setLeadTouched(true);
      setLeadNotice(picked ? `${picked.name.toUpperCase()} jadi lead · turun pertama saat battle` : null);
    },
    [swapLeader],
  );

  const onNewRun = useCallback(() => {
    const state = useStore.getState();
    const caught = caughtIdsOf(state).length;
    Alert.alert(
      'Start a new run?',
      `This erases ${state.party.length} Pokémon, ${state.steps} steps and ${caught} caught entries.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'New run',
          style: 'destructive',
          onPress: () => {
            state.resetRun();
            setWild(null);
            setNotice(null);
            setSelectedId(null);
            setSprint(false);
          },
        },
      ],
    );
  }, []);

  const rng = useRef(mulberry32(worldSeed)).current;
  const partner = party.find((member) => member.id === leaderId) ?? party[0];
  const onSelect = useCallback((id: number) => setSelectedId(id), []);
  const onConfirm = useCallback(() => {
    if (selectedId !== null) choosePartner(selectedId);
  }, [choosePartner, selectedId]);

  const onMove = useCallback(
    (direction: Direction) => {
      const state = useStore.getState();
      if (state.pendingEncounter) return;
      const target = nextPosition(state.position, direction);
      const tile = tileAt(state.worldSeed, target.x, target.y);

      if (isBlocked(tile)) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        return;
      }

      state.walk(direction);
      void Haptics.selectionAsync();

      if (tile !== 'tallGrass') return;

      const roll = rollEncounter({ rng, tile, firstEncounterDone: state.firstEncounterDone });
      if (roll.firstEncounterDone !== state.firstEncounterDone) state.markFirstEncounterDone();

      if (roll.encounter) {
        state.setPendingEncounter(tile);
        setWild(rollWild(rng, state.party[0]?.level ?? 5));
        setNotice(null);
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        return;
      }

      state.setEncounterRisk(state.encounterRisk + ENCOUNTER_RATE);
    },
    [rng],
  );

  const onRun = useCallback(() => {
    const state = useStore.getState();
    state.markEncounterResolved();
    setWild(null);
    setNotice(null);
  }, []);

  const onThrowBall = useCallback(() => {
    if (!wild) return;
    const state = useStore.getState();
    if (!state.spendItem('pokeBall')) return;

    const attempt = throwBall(wild.id, 'pokeBall', rng);
    if (!attempt) return;

    if (attempt.caught) {
      const caught = createMember(wild.id, wild.level);
      if (caught) state.addCaught(caught);
      state.markEncounterResolved();
      setWild(null);
      setNotice(null);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }

    const name = titleCase(getEntry(wild.id)?.name ?? 'it');
    setNotice(`${name} broke free — ${Math.round(attempt.chance * 100)}% odds. Throw again or battle it.`);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [rng, wild]);

  const onBattle = useCallback(() => {
    if (!wild) return;
    router.push({ pathname: '/battle', params: { wildId: String(wild.id), level: String(wild.level) } });
  }, [router, wild]);

  if (party.length === 0) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <PartnerPicker selectedId={selectedId} onSelect={onSelect} onConfirm={onConfirm} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <WorldHud
        partner={partner}
        bag={bag}
        onNewRun={party.length > 0 ? onNewRun : undefined}
        steps={steps}
        encounterRisk={encounterRisk}
        chunkLabel={`CHUNK ${chunkOf(position.x)},${chunkOf(position.y)}`}
        isLead={partner ? partner.id === leaderId : false}
        leadHint={
          partner
            ? leadTouched
              ? `★ LEAD AKTIF · ${partner.name.toUpperCase()}`
              : 'TAP KARTU → PARTY & LEAD'
            : undefined
        }
        onOpenParty={onOpenParty}
      />
      <View style={styles.stage}>
        <WorldGrid worldSeed={worldSeed} position={position} partnerId={partner?.id} onMove={onMove} />
      </View>
      <Dpad onStep={onMove} sprint={sprint} onToggleSprint={() => setSprint((value) => !value)} />

      {pendingEncounter && wild ? (
        <EncounterSheet
          wild={wild}
          balls={bag.pokeBall}
          notice={notice ?? undefined}
          onBattle={onBattle}
          onThrowBall={onThrowBall}
          onRun={onRun}
        />
      ) : null}

      {leadSheet ? (
        <LeadPickerSheet
          visible
          party={party}
          leaderId={leaderId}
          notice={leadNotice}
          onPick={onPickLead}
          onClose={onCloseParty}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink, gap: spacing.md },
  stage: { flex: 1, justifyContent: 'center' },
});
