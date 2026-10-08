import * as Haptics from 'expo-haptics';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HYPER_POTION_HEAL, POTION_HEAL } from '@/features/battle/logic/turnEngine';
import { maxAffordable, priceOf, wholeCoins, type BuyRefusal } from '@/features/party/logic/shop';
import { REVIVE_HP, type BuyableItem } from '@/features/party/types';
import { BagRow } from '@/features/party/ui/BagRow';
import { RosterNotice, type NoticeTone } from '@/features/party/ui/RosterNotice';
import { ShopRow } from '@/features/party/ui/ShopRow';
import { useStore } from '@/store';
import { colors, font, radius, spacing } from '@/theme/tokens';

const NAME: Record<BuyableItem, string> = { potion: 'Potion', hyperPotion: 'Hyper Potion', pokeBall: 'Poke Ball', greatBall: 'Great Ball' };

export const BALL_EFFECT = 'LEMPAR DI BATTLE UNTUK MENANGKAP';
export const GREAT_BALL_EFFECT = 'PELUANG TANGKAP LEBIH TINGGI';

const EFFECT: Record<BuyableItem, string> = {
  potion: `+${POTION_HEAL} HP SAAT BATTLE · REVIVE ${Math.round(REVIVE_HP * 100)}% HP`,
  hyperPotion: `+${HYPER_POTION_HEAL} HP SAAT BATTLE`,
  pokeBall: BALL_EFFECT,
  greatBall: GREAT_BALL_EFFECT,
};

const REFUSAL: Record<BuyRefusal, string> = {
  money: 'Uang tidak cukup untuk jumlah itu — kurangi jumlahnya.',
  qty: 'Jumlah harus 1 atau lebih.',
  item: 'Item itu tidak dijual di toko.',
};



type Chip = { text: string; tone: 'plain' | 'ok' | 'bad' | 'gold' };

export default function BagsScreen() {
  const bag = useStore((state) => state.bag);
  const buyItem = useStore((state) => state.buyItem);

  const [qty, setQty] = useState<Record<BuyableItem, number>>({ potion: 1, hyperPotion: 1, pokeBall: 1, greatBall: 1 });
  const [bubble, setBubble] = useState<{ text: string; tone: NoticeTone } | null>(null);
  const [lastBought, setLastBought] = useState<{ item: BuyableItem; qty: number } | null>(null);
  console.log(bag, 'bag')
  const coins = wholeCoins(bag.money);
  const ceiling = useCallback(
    (item: BuyableItem) => Math.max(1, maxAffordable(bag, item)),
    [bag],
  );
  const qtyOf = useCallback((item: BuyableItem) => Math.min(qty[item], ceiling(item)), [ceiling, qty]);

  const step = useCallback((item: BuyableItem, delta: number) => {
    setLastBought(null);
    setBubble(null);
    setQty((current) => ({ ...current, [item]: Math.max(1, current[item] + delta) }));
  }, []);

  const buy = useCallback(
    (item: BuyableItem) => {
      const wanted = qtyOf(item);
      const outcome = buyItem(item, wanted);
      
      if (!outcome.ok) {
        setBubble({ text: REFUSAL[outcome.reason], tone: 'warn' });
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return;
      }

      setQty((current) => ({ ...current, [item]: 1 }));
      setLastBought({ item, qty: outcome.qty });
      setBubble({
        text: `${outcome.qty} ${NAME[item].toUpperCase()} MASUK TAS · SISA $${wholeCoins(outcome.bag.money)}`,
        tone: 'good',
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    [buyItem, qtyOf],
  );

  const broke = maxAffordable(bag, 'potion') === 0 && maxAffordable(bag, 'hyperPotion') === 0;

  const rules = useMemo(() => {
    const chips: Chip[] = [
      { text: 'UANG DARI MENANG BATTLE', tone: 'gold' },
      { text: `POTION $${priceOf('potion')} · HYPER $${priceOf('hyperPotion')}`, tone: 'ok' },
      { text: 'POKE BALL DARI DROP', tone: 'plain' },
    ];
    if (broke) chips.push({ text: 'UANG KURANG → TOMBOL SEBUT NOMINALNYA', tone: 'bad' });
    return chips;
  }, [broke]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>BAGS</Text>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Tas &amp; Toko</Text>
          <View style={[styles.money, broke && styles.moneyLow]} accessibilityLabel={`Uang ${coins}`}>
            <Text style={[styles.moneySym, broke && styles.moneyLowLabel]}>$</Text>
            <Text style={[styles.moneyValue, broke && styles.moneyLowLabel]}>{coins}</Text>
          </View>
        </View>
        <Text style={styles.hint}>UANG DARI MENANG BATTLE · BELI POTION &amp; HYPER POTION DI BAWAH</Text>
      </View>

      {bubble ? (
        <View style={styles.noticeWrap}>
          <RosterNotice text={bubble.text} tone={bubble.tone} />
        </View>
      ) : null}

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ISI TAS</Text>
          <View style={styles.rule} />
          <Text style={styles.sectionNote}>4 JENIS ITEM</Text>
        </View>

        <View style={styles.rows}>
          <BagRow item="pokeBall" name="Poke Ball" effect={BALL_EFFECT} count={bag.pokeBall} />
          <BagRow item="greatBall" name="Great Ball" effect={GREAT_BALL_EFFECT} count={bag.greatBall} />
          <BagRow
            item="potion"
            name="Potion"
            effect={EFFECT.potion}
            count={bag.potion}
            delta={lastBought?.item === 'potion' ? lastBought.qty : undefined}
          />
          <BagRow
            item="hyperPotion"
            name="Hyper Potion"
            effect={EFFECT.hyperPotion}
            count={bag.hyperPotion}
            delta={lastBought?.item === 'hyperPotion' ? lastBought.qty : undefined}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>TOKO</Text>
          <View style={styles.rule} />
          <Text style={styles.sectionNote}>SISA ${coins}</Text>
        </View>

        <View style={styles.rows}>
          {(['potion', 'hyperPotion', 'pokeBall', 'greatBall'] as const).map((item) => (
            <ShopRow
              key={item}
              item={item}
              name={NAME[item]}
              effect={EFFECT[item]}
              price={priceOf(item)}
              qty={qtyOf(item)}
              maxQty={ceiling(item)}
              coins={coins}
              onDecrease={() => step(item, -1)}
              onIncrease={() => step(item, 1)}
              onBuy={() => buy(item)}
            />
          ))}
        </View>

        <View style={styles.legend}>
          <Text style={styles.legendTitle}>ATURAN</Text>
          {rules.map((chip) => (
            <View
              key={chip.text}
              style={[
                styles.legendChip,
                chip.tone === 'ok' && styles.legendOk,
                chip.tone === 'bad' && styles.legendBad,
                chip.tone === 'gold' && styles.legendGold,
              ]}
            >
              <Text
                style={[
                  styles.legendLabel,
                  chip.tone === 'ok' && styles.legendOkLabel,
                  chip.tone === 'bad' && styles.legendBadLabel,
                  chip.tone === 'gold' && styles.legendGoldLabel,
                ]}
              >
                {chip.text}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.sm, gap: 4 },
  eyebrow: { color: '#FFD75E', fontFamily: font.mono, fontSize: 9.5, letterSpacing: 2.4, fontWeight: '700' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4 },
  title: { color: colors.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
  money: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,215,94,0.35)',
    backgroundColor: 'rgba(255,215,94,0.10)',
  },
  moneyLow: { borderColor: 'rgba(255,92,122,0.35)', backgroundColor: 'rgba(255,92,122,0.08)' },
  moneySym: { color: '#FFD75E', fontFamily: font.mono, fontSize: 11, fontWeight: '800' },
  moneyValue: { color: '#FFF3C4', fontFamily: font.mono, fontSize: 15, fontWeight: '800' },
  moneyLowLabel: { color: '#FFC0CD' },
  hint: { color: colors.textFaint, fontFamily: font.mono, fontSize: 8.5, letterSpacing: 1.4, marginTop: 8 },
  noticeWrap: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  body: { flex: 1 },
  bodyContent: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.sm },
  section: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingTop: 2 },
  sectionLabel: { color: colors.textDim, fontFamily: font.mono, fontSize: 9.5, letterSpacing: 2, fontWeight: '700' },
  rule: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.10)' },
  sectionNote: { color: colors.textFaint, fontFamily: font.mono, fontSize: 9, fontWeight: '700' },
  rows: { gap: 6 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 'auto', paddingTop: spacing.sm },
  legendTitle: { color: colors.textFaint, fontFamily: font.mono, fontSize: 8, letterSpacing: 1.8, fontWeight: '700', marginRight: 2 },
  legendChip: {
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  legendOk: { borderColor: 'rgba(124,255,107,0.30)' },
  legendBad: { borderColor: 'rgba(255,92,122,0.30)' },
  legendGold: { borderColor: 'rgba(255,215,94,0.35)' },
  legendLabel: { color: colors.textFaint, fontFamily: font.mono, fontSize: 8, fontWeight: '700', letterSpacing: 1 },
  legendOkLabel: { color: '#B6FFAE' },
  legendBadLabel: { color: '#FFC0CD' },
  legendGoldLabel: { color: '#FFE9A8' },
});
