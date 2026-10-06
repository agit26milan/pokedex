import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useCallback, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PartnerPicker } from '@/features/party/ui/PartnerPicker';
import { Dpad } from '@/features/world/ui/Dpad';
import { EncounterSheet } from '@/features/world/ui/EncounterSheet';
import { WorldGrid } from '@/features/world/ui/WorldGrid';
import { WorldHud } from '@/features/world/ui/WorldHud';
import { ENCOUNTER_RATE, rollEncounter } from '@/features/world/logic/rollEncounter';
import { rollWild, type WildEncounter } from '@/features/world/logic/rollWild';
import { chunkOf, isBlocked, nextPosition, tileAt, type Direction } from '@/features/world/logic/world';
import { mulberry32 } from '@/shared/lib/rng';
import { useStore } from '@/store';
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

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [sprint, setSprint] = useState(false);
  const [wild, setWild] = useState<WildEncounter | null>(null);

  // One seeded stream per run keeps encounters reproducible for tests and debugging.
  const rng = useRef(mulberry32(worldSeed)).current;
  const partner = party[0];

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
  }, []);

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
        steps={steps}
        encounterRisk={encounterRisk}
        chunkLabel={`CHUNK ${chunkOf(position.x)},${chunkOf(position.y)}`}
      />
      <View style={styles.stage}>
        <WorldGrid worldSeed={worldSeed} position={position} partnerId={partner?.id} onMove={onMove} />
      </View>
      <Dpad onStep={onMove} sprint={sprint} onToggleSprint={() => setSprint((value) => !value)} />

      {pendingEncounter && wild ? (
        <EncounterSheet wild={wild} balls={bag.pokeBall} onBattle={onBattle} onRun={onRun} />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink, gap: spacing.md },
  stage: { flex: 1, justifyContent: 'center' },
});
