import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Sprite } from '@/shared/components/Sprite';
import { titleCase } from '@/shared/lib/format';
import { colors, font, radius, spacing } from '@/theme/tokens';
import { rankInParty } from '../logic/strength';
import type { PartyMember } from '../types';
import { LeadRow } from './LeadRow';
import { StrengthPanel } from './StrengthPanel';
import { useStore } from '@/store';

interface LeadPickerSheetProps {
  visible: boolean;
  party: PartyMember[];
  leaderId: number | null;
  notice?: string | null;
  onPick: (id: number) => void;
  onClose: () => void;
}

export function LeadPickerSheet({ visible, party, leaderId, notice, onPick, onClose }: LeadPickerSheetProps) {
  const [openId, setOpenId] = useState<number | null>(null);
  const [blocked, setBlocked] = useState<string | null>(null);
  const bag = useStore((state) => state.bag);
  if (!visible) return null;

  const revive = (member: PartyMember) => {
    if(!member.id) return
    if(member.hp <= 0) {
      useStore.getState().reviveMember(member.id)
    } else {
      useStore.getState().healMember(member.id)
    }
  };

  const pick = (member: PartyMember, isLead: boolean) => {
    if (isLead) return;
    if (member.hp <= 0) {
      setBlocked(`${titleCase(member.name)} pingsan — tidak ada potion untuk membangunkannya.`);
      return;
    }
    setBlocked(null);
    setOpenId(null);
    onPick(member.id);
  };

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Ketuk latar untuk tutup" />
      <View style={styles.sheet}>
        <View style={styles.handle} />

        {notice ? (
          <View style={styles.toast}>
            <Sprite id={party.find((member) => member.id === leaderId)?.id ?? party[0]?.id ?? 1} size={22} />
            <Text style={styles.toastText}>{notice}</Text>
          </View>
        ) : null}

        <View style={styles.head}>
          <View style={styles.headText}>
            <Text style={styles.eyebrow}>PARTY · PICK LEAD</Text>
            <Text style={styles.title}>Pilih Pokémon lead</Text>
            <Text style={styles.sub}>Lead = yang turun pertama saat battle.</Text>
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            style={styles.close}
            accessibilityRole="button"
            accessibilityLabel="Tutup panel party"
          >
            <Text style={styles.closeLabel}>✕</Text>
          </Pressable>
        </View>

        {blocked ? <Text style={styles.blocked}>{blocked}</Text> : null}

        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {party.map((member) => {
            const isLead = member.id === leaderId;
            const open = openId === member.id;

            return (
              <View key={member.id} style={[styles.card, isLead && styles.cardLead, open && styles.cardOpen]}>
                <LeadRow
                  member={member}
                  isLead={isLead}
                  selected={open}
                  onPress={() => {
                    setBlocked(null);
                    setOpenId(open ? null : member.id);
                  }}
                />

                {open ? (
                  <>
                    <StrengthPanel member={member} rank={rankInParty(party, member.id)} />
                    <View style={styles.actions}>
                      <Pressable
                        onPress={() => setOpenId(null)}
                        style={[styles.button, styles.ghost]}
                        accessibilityRole="button"
                        accessibilityLabel="Batalkan pilihan"
                      >
                        <Text style={styles.ghostLabel}>BATAL</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => pick(member, isLead)}
                        style={[styles.button, isLead ? styles.held : member.hp <= 0 ? styles.held : styles.primary]}
                        accessibilityRole="button"
                        accessibilityState={{ disabled: isLead }}
                        accessibilityLabel={
                          isLead
                            ? `${titleCase(member.name)} sudah menjadi lead`
                              : `Jadikan ${titleCase(member.name)} lead`
                        }
                      >
                        <Text style={[styles.buttonLabel, isLead || member.hp <= 0 ? styles.heldLabel : styles.primaryLabel]}>
                          {isLead ? 'SUDAH JADI LEAD' : '★ JADIKAN LEAD'}
                        </Text>
                      </Pressable>
                 
                      {(bag.potion > 0 || bag.hyperPotion > 0) && (
                          <Pressable
                          onPress={() => revive(member)}
                          style={[styles.button, styles.ghost]}
                          accessibilityRole="button"
                          accessibilityLabel="Revive member"
                        >
                          <Text style={styles.ghostLabel}>{member.hp <= 0 ? 'REVIVE' : 'HEAL'} </Text>
                        </Pressable>
                      )}
                    
                    </View>
                  </>
                ) : null}
              </View>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, justifyContent: 'flex-end' },
  scrim: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(4,6,13,0.72)' },
  sheet: {
    maxHeight: '88%',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: '#0B101F',
  },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.18)' },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: 'rgba(124,255,107,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(124,255,107,0.40)',
  },
  toastText: { flex: 1, color: '#CFFFC6', fontFamily: font.mono, fontSize: 10.5, letterSpacing: 0.6 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  headText: { flex: 1 },
  eyebrow: { color: colors.accent, fontFamily: font.mono, fontSize: 9, letterSpacing: 2 },
  title: { color: colors.text, fontSize: 19, fontWeight: '800', marginTop: 6 },
  sub: { color: colors.textDim, fontSize: 11, marginTop: 4 },
  close: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  closeLabel: { color: colors.textDim, fontSize: 12 },
  blocked: { color: colors.warn, fontFamily: font.mono, fontSize: 9.5, letterSpacing: 0.5 },
  list: { flexGrow: 0 },
  listContent: { gap: spacing.sm, paddingBottom: spacing.sm },
  card: {
    padding: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cardLead: { borderColor: 'rgba(124,255,107,0.30)' },
  cardOpen: { borderColor: 'rgba(79,209,255,0.45)' },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  button: { flex: 1, paddingVertical: 12, borderRadius: radius.md, alignItems: 'center' },
  primary: { backgroundColor: colors.accent },
  held: { backgroundColor: 'rgba(255,255,255,0.10)' },
  ghost: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', backgroundColor: 'rgba(255,255,255,0.05)' },
  buttonLabel: { fontFamily: font.mono, fontSize: 9.5, fontWeight: '800', letterSpacing: 1 },
  primaryLabel: { color: colors.accentOn },
  heldLabel: { color: colors.textDim },
  ghostLabel: { color: colors.textDim, fontFamily: font.mono, fontSize: 9.5, fontWeight: '800', letterSpacing: 1 },
});
