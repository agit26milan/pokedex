import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Sprite } from '@/shared/components/Sprite';
import { TypeBadge } from '@/shared/components/TypeBadge';
import { getEnrichedDetail, type EnrichedDetail } from '@/shared/api/pokemon';
import { MOVES, getEntry } from '@/shared/data/dex';
import { dexNumber, titleCase } from '@/shared/lib/format';
import { useStore } from '@/store';
import { colors, font, radius, spacing } from '@/theme/tokens';

const MAX_BASE_STAT = 200;

export default function PokemonDetail() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Number(params.id);
  const entry = getEntry(id);

  const [enriched, setEnriched] = useState<EnrichedDetail | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const caught = useStore((state) => state.party.some((m) => m.id === id) || state.storage.some((m) => m.id === id));

  useEffect(() => {
    if (!Number.isFinite(id)) return;
    let active = true;
    getEnrichedDetail(id).then((result) => {
      if (!active) return;
      if (result.ok) setEnriched(result.data);
      else setNotice(result.error);
    });
    return () => {
      active = false;
    };
  }, [id]);

  if (!entry) {
    return (
      <SafeAreaView style={styles.screen}>
        <Text style={styles.missing}>Unknown Pokémon #{params.id}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Sprite id={entry.id} size={132} />
          <Text style={styles.number}>{dexNumber(entry.id)}</Text>
          <Text style={styles.name}>{titleCase(entry.name)}</Text>
          <View style={styles.types}>
            {entry.types.map((type) => (
              <TypeBadge key={type} type={type} />
            ))}
          </View>
          {caught ? <Text style={styles.caught}>CAUGHT</Text> : null}
          {enriched?.genus ? <Text style={styles.genus}>{enriched.genus}</Text> : null}
        </View>

        {enriched?.flavorText ? <Text style={styles.flavor}>{enriched.flavorText}</Text> : null}

        <Section title="BASE STATS">
          {Object.entries(entry.baseStats).map(([key, value]) => (
            <StatRow key={key} label={key} value={value} />
          ))}
        </Section>

        <Section title="LEARNSET (RED / BLUE)">
          {entry.moves.slice(0, 10).map((move) => (
            <View key={move.name} style={styles.moveRow}>
              <Text style={styles.moveLevel}>Lv {String(move.level).padStart(2, '0')}</Text>
              <Text style={styles.moveName}>{titleCase(move.name)}</Text>
              <TypeBadge type={MOVES[move.name]?.type ?? 'normal'} compact />
              <Text style={styles.movePower}>{MOVES[move.name]?.power ? `PWR ${MOVES[move.name]!.power}` : '—'}</Text>
            </View>
          ))}
        </Section>

        <Section title="EVOLUTION">
          {entry.evolution.map((stage) => (
            <View key={stage.id} style={styles.moveRow}>
              <Text style={styles.moveLevel}>{dexNumber(stage.id)}</Text>
              <Text style={styles.moveName}>{titleCase(stage.name)}</Text>
            </View>
          ))}
        </Section>

        <Text style={styles.source}>
          {notice
            ? `Seed data shown. PokéAPI enrichment unavailable: ${notice}`
            : enriched
              ? 'Seed data + PokéAPI enrichment (cached 30 days)'
              : 'Seed data shown. Loading extra details…'}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  const width = Math.min(100, Math.round((value / MAX_BASE_STAT) * 100));
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label.replace(/([A-Z])/g, ' $1').toUpperCase()}</Text>
      <View style={styles.statTrack}>
        <View style={[styles.statFill, { width: `${width}%` }]} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  missing: { color: colors.textDim, padding: spacing.lg },
  hero: { alignItems: 'center', gap: spacing.xs },
  number: { color: colors.textDim, fontFamily: font.mono, fontSize: 11, letterSpacing: 2 },
  name: { color: colors.text, fontSize: 28, fontWeight: '800' },
  types: { flexDirection: 'row', gap: 6, marginTop: 4 },
  caught: { color: colors.accent, fontFamily: font.mono, fontSize: 10, letterSpacing: 2, marginTop: 6 },
  genus: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  flavor: {
    color: colors.textDim,
    fontSize: 12.5,
    lineHeight: 19,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  section: { gap: spacing.sm },
  sectionTitle: { color: colors.accent, fontFamily: font.mono, fontSize: 10, letterSpacing: 2.2 },
  sectionBody: { gap: 8 },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  statLabel: { color: colors.textDim, fontFamily: font.mono, fontSize: 9, width: 104, letterSpacing: 1 },
  statTrack: { flex: 1, height: 6, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  statFill: { height: '100%', borderRadius: 99, backgroundColor: colors.accent },
  statValue: { color: colors.text, fontFamily: font.mono, fontSize: 10, width: 28, textAlign: 'right' },
  moveRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  moveLevel: { color: colors.textDim, fontFamily: font.mono, fontSize: 10, width: 46 },
  moveName: { color: colors.text, fontSize: 12.5, flex: 1 },
  movePower: { color: colors.textFaint, fontFamily: font.mono, fontSize: 9, width: 52, textAlign: 'right' },
  source: { color: colors.textFaint, fontSize: 11, lineHeight: 16 },
});
