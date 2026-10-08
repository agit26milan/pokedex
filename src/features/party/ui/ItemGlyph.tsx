import { Image } from 'expo-image';
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { radius } from '@/theme/tokens';
import type { BuyableItem } from '../types';
import { ITEM_GLYPH, ITEM_IMAGE, ITEM_TONE, TONE_BOX, TONE_GLYPH } from './itemMeta';

interface ItemGlyphProps {
  item: BuyableItem;
}

/**
 * Square icon frame shared by the bag and shop rows. Items with a sprite render the
 * image, the rest fall back to their glyph — so adding a new item only means editing
 * `itemMeta`, never these rows.
 */
export const ItemGlyph = memo(function ItemGlyph({ item }: ItemGlyphProps) {
  const tone = ITEM_TONE[item];
  const image = ITEM_IMAGE[item];

  return (
    <View style={[styles.frame, TONE_BOX[tone]]}>
      {image ? (
        <Image
          source={image}
          style={styles.image}
          contentFit="contain"
          cachePolicy="memory-disk"
          accessibilityIgnoresInvertColors
        />
      ) : (
        <Text style={[styles.glyph, TONE_GLYPH[tone]]} allowFontScaling={false}>
          {ITEM_GLYPH[item]}
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  frame: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0E1428',
    borderWidth: 1,
  },
  image: { width: 26, height: 26 },
  glyph: { fontSize: 16, lineHeight: 19 },
});
