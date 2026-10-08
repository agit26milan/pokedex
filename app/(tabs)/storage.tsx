import * as Haptics from 'expo-haptics';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PARTY_LIMIT, type PartyMember } from '@/features/party/types';
import type { RosterRefusal } from '@/features/party/logic/partyRules';
import { PartySlotCard, type SlotState } from '@/features/party/ui/PartySlotCard';
import { RosterNotice, type NoticeTone } from '@/features/party/ui/RosterNotice';
import { StorageRow, type RowState } from '@/features/party/ui/StorageRow';
import { titleCase } from '@/shared/lib/format';
import { caughtIdsFrom, useStore } from '@/store';
import { colors, font, radius, spacing } from '@/theme/tokens';

type Selection =
  | { kind: 'none' }
  | { kind: 'party'; id: number }
  | { kind: 'storage'; id: number }
  | { kind: 'pair'; partyId: number; storageId: number };

interface Bubble {
  text: string;
  tone: NoticeTone;
}

const REFUSAL: Record<RosterRefusal, (name: string) => string> = {
  lead: (name) => `${name} adalah lead — ganti lead dulu di tab PLAY sebelum disimpan.`,
  'last-one': () => 'Minimal 1 Pokémon harus tinggal di party.',
  'party-full': () => `Party penuh ${PARTY_LIMIT}/${PARTY_LIMIT} — pilih satu slot party untuk ditukar.`,
  missing: () => 'Pokémon itu sudah tidak ada di roster.',
};

const nameOf = (list: readonly PartyMember[], id: number): string => {
  const member = list.find((current) => current.id === id);
  return member ? titleCase(member.name) : 'Pokémon';
};

export default function StorageScreen() {
  const party = useStore((state) => state.party);
  const storage = useStore((state) => state.storage);
  const leaderId = useStore((state) => state.leaderId);
  const moveToStorage = useStore((state) => state.moveToStorage);
  const moveToParty = useStore((state) => state.moveToParty);
  const swapWithStorage = useStore((state) => state.swapWithStorage);
  const releasePokemon = useStore((state) => state.releasePokemon);
  const [selection, setSelection] = useState<Selection>({ kind: 'none' });
  const [bubble, setBubble] = useState<Bubble | null>(null);

  const caught = useMemo(() => caughtIdsFrom(party, storage).length, [party, storage]);
  const room = Math.max(0, PARTY_LIMIT - party.length);
  const full = room === 0;

  const clear = useCallback(() => {
    setSelection({ kind: 'none' });
    setBubble(null);
  }, []);

  const cheer = useCallback((text: string, tone: NoticeTone = 'good', haptic = true) => {
    setBubble({ text, tone });
    if (haptic) {
      void Haptics.notificationAsync(
        tone === 'warn' ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success,
      );
    }
  }, []);

  const tapParty = useCallback(
    (id: number) => {
      setBubble(null);
      setSelection((current) => {
        if (current.kind === 'storage') return { kind: 'pair', partyId: id, storageId: current.id };
        if (current.kind === 'pair') {
          if (current.partyId === id) return { kind: 'storage', id: current.storageId };
          return { kind: 'pair', partyId: id, storageId: current.storageId };
        }
        if (current.kind === 'party' && current.id === id) return { kind: 'none' };
        return { kind: 'party', id };
      });
    },
    [],
  );

  const tapStorage = useCallback((id: number) => {
    setBubble(null);
    setSelection((current) => {
      if (current.kind === 'party') return { kind: 'pair', partyId: current.id, storageId: id };
      if (current.kind === 'pair') {
        if (current.storageId === id) return { kind: 'party', id: current.partyId };
        return { kind: 'pair', partyId: current.partyId, storageId: id };
      }
      if (current.kind === 'storage' && current.id === id) return { kind: 'none' };
      return { kind: 'storage', id };
    });
  }, []);

  const send = useCallback(() => {
    const id = selection.kind === 'party' ? selection.id : null;
    if (id === null) return;
    const label = nameOf(party, id);
    const outcome = moveToStorage(id);
    if (!outcome.ok) {
      cheer(REFUSAL[outcome.reason](label), 'warn');
      return;
    }
    setSelection({ kind: 'none' });
    cheer(`${label} masuk storage · party tinggal ${outcome.party.length}/${PARTY_LIMIT}.`);
  }, [cheer, moveToStorage, party, selection]);

  const pull = useCallback(() => {
    const id = selection.kind === 'storage' ? selection.id : null;
    if (id === null) return;
    const label = nameOf(storage, id);
    const outcome = moveToParty(id);
    if (!outcome.ok) {
      cheer(REFUSAL[outcome.reason](label), 'warn');
      return;
    }
    setSelection({ kind: 'none' });
    cheer(`${label} masuk party · party ${outcome.party.length}/${PARTY_LIMIT}.`, 'info');
  }, [cheer, moveToParty, selection, storage]);

  const swap = useCallback(() => {
    if (selection.kind !== 'pair') return;
    const incoming = nameOf(storage, selection.storageId);
    const outgoing = nameOf(party, selection.partyId);
    const outcome = swapWithStorage(selection.partyId, selection.storageId);
    if (!outcome.ok) {
      cheer(REFUSAL[outcome.reason](outgoing), 'warn');
      return;
    }
    setSelection({ kind: 'none' });
    cheer(`${incoming} masuk party · ${outgoing} ke storage. Lead tetap ${nameOf(party, leaderId ?? -1)}.`, 'warn');
  }, [cheer, leaderId, party, selection, storage, swapWithStorage]);

  const action = useMemo(() => {
    const base = { label: 'PILIH POKÉMON LAIN', tone: 'held' as const, disabled: true, run: clear };
    if (selection.kind === 'party') {
      const member = party.find((current) => current.id === selection.id);
      if (!member) return base;
      const label = titleCase(member.name);
      if (member.id === leaderId) return { label: 'LEAD TIDAK BISA DISIMPAN', tone: 'held' as const, disabled: true, run: clear };
      if (party.length <= 1) return { label: 'MINIMAL 1 TINGGAL DI PARTY', tone: 'held' as const, disabled: true, run: clear };
      return { label: `KIRIM ${label.toUpperCase()} KE STORAGE`, tone: 'primary' as const, disabled: false, run: send };
    }
    if (selection.kind === 'storage') {
      const label = nameOf(storage, selection.id).toUpperCase();
      if (full) return { label: 'PARTY PENUH · PILIH SLOT PARTY', tone: 'held' as const, disabled: true, run: clear };
      return { label: `TARIK ${label} KE PARTY →`, tone: 'info' as const, disabled: false, run: pull };
    }
    if (selection.kind === 'pair') return { label: 'TUKAR 2 POKÉMON', tone: 'warn' as const, disabled: false, run: swap };
    if (party.length === 0) return { label: 'PARTY MASIH KOSONG', tone: 'held' as const, disabled: true, run: clear };
    if (storage.length === 0) return { label: 'STORAGE MASIH KOSONG', tone: 'held' as const, disabled: true, run: clear };
    return { label: 'PILIH POKÉMON DULU', tone: 'held' as const, disabled: true, run: clear };
  }, [clear, full, leaderId, party, pull, selection, send, storage, swap]);

  const rules = useMemo(() => {
    if (selection.kind === 'pair') {
      return [
        { text: `${nameOf(storage, selection.storageId).toUpperCase()} MASUK`, tone: 'good' as const },
        { text: `${nameOf(party, selection.partyId).toUpperCase()} KELUAR`, tone: 'bad' as const },
        { text: 'LEAD TIDAK IKUT', tone: 'plain' as const },
      ];
    }
    if (selection.kind === 'storage') {
      return full
        ? [
            { text: 'PARTY PENUH → TUKAR', tone: 'bad' as const },
            { text: 'TAP SLOT PARTY', tone: 'plain' as const },
          ]
        : [
            { text: 'PARTY ADA RUANG → TARIK LANGSUNG', tone: 'good' as const },
            { text: `SLOT KOSONG ${room}`, tone: 'plain' as const },
          ];
    }
    if (selection.kind === 'party') {
      return [
        { text: '1 · PILIH POKÉMON', tone: 'good' as const },
        { text: '2 · KONFIRMASI DI BAWAH', tone: 'plain' as const },
        { text: 'LEAD TIDAK BISA DISIMPAN', tone: 'bad' as const },
      ];
    }
    return [
      { text: '1 · PILIH POKÉMON', tone: 'good' as const },
      { text: '2 · TAP SLOT TUJUAN', tone: 'plain' as const },
      { text: '3 · TUKAR / PINDAH', tone: 'plain' as const },
      { text: 'LEAD SELALU DI PARTY', tone: 'bad' as const },
    ];
  }, [full, party, room, selection, storage]);

  const removePokemon = useCallback(() => {
    const ids = selection.kind === 'party' ? [selection.id] : selection.kind === 'storage' ? [selection.id] : [];
    releasePokemon(ids);
  }, [releasePokemon, selection]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>STORAGE</Text>
        <Text style={styles.title}>Party &amp; Storage</Text>
        <View style={styles.counts}>
          <View style={[styles.chip, full && styles.chipFull]}>
            <Text style={[styles.chipLabel, full && styles.chipFullLabel]}>
              PARTY {party.length}/{PARTY_LIMIT}
            </Text>
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipLabel}>STORAGE {storage.length}</Text>
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipLabel}>CAUGHT {caught}</Text>
          </View>
        </View>
        <Text style={styles.hint}>TAP 1 POKÉMON → LALU TAP SLOT TUJUAN</Text>
      </View>

      {bubble ? <View style={styles.noticeWrap}><RosterNotice text={bubble.text} tone={bubble.tone} /></View> : null}

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PARTY</Text>
          <View style={styles.rule} />
          <Text style={[styles.sectionNote, full && styles.sectionNoteFull]}>
            {full ? `PENUH ${party.length}/${PARTY_LIMIT}` : `${party.length}/${PARTY_LIMIT} · ${room} KOSONG`}
          </Text>
        </View>

        <View style={styles.grid}>
          {Array.from({ length: PARTY_LIMIT }, (_, index) => {
            const member = party[index];
            let state: SlotState = 'idle';
            if (selection.kind === 'pair' && member && member.id === selection.partyId) state = 'victim';
            else if (selection.kind === 'party' && member && member.id === selection.id) state = 'selected';
            else if (selection.kind === 'storage' || selection.kind === 'pair') state = 'tappable';

            return (
              <View key={member ? member.id : `empty-${index}`} style={styles.gridCell}>
                <PartySlotCard
                  member={member}
                  index={index}
                  isLead={Boolean(member) && member!.id === leaderId}
                  state={state}
                  onPress={() => member && tapParty(member.id)}
                />
              </View>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>STORAGE</Text>
          <View style={styles.rule} />
          <Text style={styles.sectionNote}>{storage.length} POKÉMON · TANPA BATAS</Text>
        </View>

        {storage.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyBig}>▦</Text>
            <Text style={styles.emptyTitle}>BELUM ADA YANG DITITIPKAN</Text>
            <Text style={styles.emptyText}>
              Catch baru masuk ke party selama party belum {PARTY_LIMIT}/{PARTY_LIMIT}. Selebihnya otomatis
              dititipkan di sini — tetap terhitung sebagai CAUGHT di Glossary.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {storage.map((member, index) => {
              let state: RowState = 'idle';
              if (selection.kind === 'storage' && member.id === selection.id) state = 'selected';
              else if (selection.kind === 'pair' && member.id === selection.storageId) state = 'selected';
              else if (selection.kind === 'party') state = 'tappable';

              return <StorageRow key={member.id} member={member} index={index} state={state} onPress={() => tapStorage(member.id)} />;
            })}
          </View>
        )}

        <View style={styles.legend}>
          <Text style={styles.legendTitle}>ATURAN</Text>
          {rules.map((rule) => (
            <View
              key={rule.text}
              style={[
                styles.legendChip,
                rule.tone === 'good' && styles.legendGood,
                rule.tone === 'bad' && styles.legendBad,
              ]}
            >
              <Text
                style={[
                  styles.legendLabel,
                  rule.tone === 'good' && styles.legendGoodLabel,
                  rule.tone === 'bad' && styles.legendBadLabel,
                ]}
              >
                {rule.text}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <>
      <View style={styles.actionBar}>
        {selection.kind !== 'none' ? (
          <Pressable
            onPress={clear}
            style={[styles.button, styles.ghost]}
            accessibilityRole="button"
            accessibilityLabel="Batalkan pilihan"
          >
            <Text style={styles.ghostLabel}>BATAL</Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={action.run}
          disabled={action.disabled}
          style={[
            styles.button,
            action.disabled && styles.held,
            action.tone === 'primary' && styles.primary,
            action.tone === 'info' && styles.info,
            action.tone === 'warn' && styles.warn,
          ]}
          accessibilityRole="button"
          accessibilityState={{ disabled: action.disabled }}
          accessibilityLabel={action.label}
        >
          <Text
            style={[
              styles.buttonLabel,
              action.disabled && styles.heldLabel,
              action.tone === 'primary' && styles.primaryLabel,
              action.tone === 'info' && styles.infoLabel,
              action.tone === 'warn' && styles.warnLabel,
            ]}
          >
            {action.label}
          </Text>
        </Pressable>
      </View>
     {selection.kind === 'storage' && selection.id && (
      <View style={[styles.containerRemove]}>
      <Pressable onPress={removePokemon} style={[styles.buttonRemove]} >
         <Text style={[styles.buttonLabel, styles.releaseLabel]} >Release Pokemon</Text>
       </Pressable>
      </View>
     )}
      </>
     
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.sm, gap: 4 },
  eyebrow: { color: colors.accent, fontFamily: font.mono, fontSize: 9.5, letterSpacing: 2.4, fontWeight: '700' },
  title: { color: colors.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.4, marginTop: 4 },
  counts: { flexDirection: 'row', gap: 6, marginTop: 8 },
  chip: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  chipFull: { borderColor: 'rgba(255,176,32,0.35)', backgroundColor: 'rgba(255,176,32,0.08)' },
  chipLabel: { color: colors.textDim, fontFamily: font.mono, fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  chipFullLabel: { color: '#FFD79A' },
  hint: { color: colors.textFaint, fontFamily: font.mono, fontSize: 8.5, letterSpacing: 1.4, marginTop: 8 },
  noticeWrap: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  body: { flex: 1 },
  bodyContent: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.sm },
  section: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingTop: 2 },
  sectionLabel: { color: colors.textDim, fontFamily: font.mono, fontSize: 9.5, letterSpacing: 2, fontWeight: '700' },
  rule: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.10)' },
  sectionNote: { color: colors.textFaint, fontFamily: font.mono, fontSize: 9, fontWeight: '700' },
  sectionNoteFull: { color: colors.warn },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  gridCell: { width: '48%', flexGrow: 1 },
  list: { gap: 6 },
  empty: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.14)',
  },
  emptyBig: { color: colors.textFaint, fontSize: 26, opacity: 0.6 },
  emptyTitle: { color: colors.textDim, fontFamily: font.mono, fontSize: 10, letterSpacing: 1.8, fontWeight: '700' },
  emptyText: { color: colors.textFaint, fontSize: 11, textAlign: 'center', lineHeight: 17 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 'auto', paddingTop: spacing.sm },
  legendTitle: { color: colors.textFaint, fontFamily: font.mono, fontSize: 8, letterSpacing: 1.8, fontWeight: '700', marginRight: 2 },
  legendChip: {
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  legendGood: { borderColor: 'rgba(124,255,107,0.30)' },
  legendBad: { borderColor: 'rgba(255,92,122,0.30)' },
  legendLabel: { color: colors.textFaint, fontFamily: font.mono, fontSize: 8, fontWeight: '700', letterSpacing: 1 },
  legendGoodLabel: { color: '#B6FFAE' },
  legendBadLabel: { color: '#FFC0CD' },
  actionBar: {
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.10)',
    backgroundColor: colors.inkDeep,
  },
  button: { flex: 1, paddingVertical: 13, paddingHorizontal: 8, borderRadius: radius.md, alignItems: 'center' },
  primary: { backgroundColor: colors.accent },
  info: { backgroundColor: colors.info },
  warn: { backgroundColor: colors.warn },
  held: { backgroundColor: 'rgba(255,255,255,0.06)' },
  ghost: { flex: 0, paddingHorizontal: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', backgroundColor: 'rgba(255,255,255,0.05)' },
  buttonLabel: { fontFamily: font.mono, fontSize: 9.5, fontWeight: '800', letterSpacing: 1, textAlign: 'center' },
  primaryLabel: { color: colors.accentOn },
  infoLabel: { color: '#04222E' },
  warnLabel: { color: '#2A1B00' },
  heldLabel: { color: colors.textFaint },
  ghostLabel: { color: colors.textDim, fontFamily: font.mono, fontSize: 9.5, fontWeight: '800', letterSpacing: 1 },
  containerRemove: {backgroundColor: colors.inkDeep, paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md},
  buttonRemove: {backgroundColor: colors.danger, paddingVertical: 13, paddingHorizontal: 8, borderRadius: radius.md, alignItems: 'center', fontSize: 12},
  releaseLabel: {color: 'white'}
});
