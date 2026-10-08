import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, font, radius, spacing } from '@/theme/tokens';
import type { BuyableItem } from '../types';
import { ItemGlyph } from './ItemGlyph';

interface ShopRowProps {
  item: BuyableItem;
  name: string;
  effect: string;
  price: number;
  qty: number;
  maxQty: number;
  coins: number;
  onDecrease: () => void;
  onIncrease: () => void;
  onBuy: () => void;
}

export const ShopRow = memo(function ShopRow({
  item,
  name,
  effect,
  price,
  qty,
  maxQty,
  coins,
  onDecrease,
  onIncrease,
  onBuy,
}: ShopRowProps) {
  const total = price * qty;
  const shortfall = total - coins;
  const affordable = shortfall <= 0;
  const atCeiling = qty >= maxQty;

  return (
    <View style={[styles.row, affordable && !atCeiling && styles.rowReady, !affordable && styles.rowShort]}>
      <View style={styles.top}>
        <ItemGlyph item={item} />

        <View style={styles.body}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.effect}>{effect}</Text>
        </View>

        <View style={styles.priceWrap}>
          <Text style={[styles.price, !affordable && styles.priceShort]}>${price}</Text>
          <Text style={styles.per}>PER ITEM</Text>
        </View>
      </View>

      <View style={styles.controls}>
        <View style={styles.stepper}>
          <Pressable
            onPress={onDecrease}
            disabled={qty <= 1}
            style={styles.key}
            accessibilityRole="button"
            accessibilityState={{ disabled: qty <= 1 }}
            accessibilityLabel={`Kurangi jumlah ${name}`}
          >
            <Text style={[styles.keyLabel, qty <= 1 && styles.keyOff]}>−</Text>
          </Pressable>

          <Text style={styles.qty}>{qty}</Text>

          <Pressable
            onPress={onIncrease}
            disabled={atCeiling}
            style={styles.key}
            accessibilityRole="button"
            accessibilityState={{ disabled: atCeiling }}
            accessibilityLabel={`Tambah jumlah ${name}`}
          >
            <Text style={[styles.keyLabel, atCeiling && styles.keyOff]}>+</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={onBuy}
          style={[styles.buy, affordable ? styles.buyReady : styles.buyShort]}
          accessibilityRole="button"
          accessibilityState={{ disabled: !affordable }}
          accessibilityLabel={affordable ? `Beli ${qty} ${name} seharga $${total}` : `Uang kurang $${shortfall} untuk ${name}`}
        >
          <Text style={[styles.buyLabel, affordable ? styles.buyLabelReady : styles.buyLabelShort]}>
            {affordable ? `BELI ${qty} · $${total}` : `UANG KURANG $${shortfall}`}
          </Text>
        </Pressable>
      </View>

      {atCeiling || !affordable ? (
        <Text style={styles.maxNote}>
          MAKS {maxQty} DENGAN ${coins} · 1 {name.toUpperCase()} ${price}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    padding: 10,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    gap: 8,
  },
  rowReady: { borderColor: 'rgba(124,255,107,0.35)', backgroundColor: 'rgba(124,255,107,0.05)' },
  rowShort: { borderColor: 'rgba(255,92,122,0.30)', backgroundColor: 'rgba(255,92,122,0.05)' },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  body: { flex: 1, minWidth: 0 },
  name: { color: colors.text, fontSize: 11.5, fontWeight: '800' },
  effect: { color: colors.textFaint, fontFamily: font.mono, fontSize: 8, letterSpacing: 0.5, marginTop: 3 },
  priceWrap: { alignItems: 'flex-end' },
  price: { color: '#FFD75E', fontFamily: font.mono, fontSize: 13, fontWeight: '800' },
  priceShort: { color: '#FFC0CD' },
  per: { color: colors.textFaint, fontFamily: font.mono, fontSize: 7.5, letterSpacing: 0.8, marginTop: 4 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  key: { width: 30, height: 28, alignItems: 'center', justifyContent: 'center' },
  keyLabel: { color: colors.text, fontFamily: font.mono, fontSize: 13, fontWeight: '800' },
  keyOff: { color: colors.textFaint },
  qty: {
    minWidth: 34,
    textAlign: 'center',
    paddingVertical: 7,
    color: colors.text,
    fontFamily: font.mono,
    fontSize: 13,
    fontWeight: '800',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  buy: { flex: 1, paddingVertical: 9, borderRadius: 11, alignItems: 'center' },
  buyReady: { backgroundColor: colors.accent },
  buyShort: { backgroundColor: 'rgba(255,92,122,0.12)', borderWidth: 1, borderColor: 'rgba(255,92,122,0.35)' },
  buyLabel: { fontFamily: font.mono, fontSize: 9.5, fontWeight: '800', letterSpacing: 0.8 },
  buyLabelReady: { color: colors.accentOn },
  buyLabelShort: { color: '#FFC0CD' },
  maxNote: { color: colors.warn, fontFamily: font.mono, fontSize: 8, letterSpacing: 0.6 },
});
