import type { ImageSourcePropType } from 'react-native';

import type { BuyableItem } from '../types';

export type BagTone = 'ball' | 'great' | 'potion' | 'hyper';

export const ITEM_TONE: Record<BuyableItem, BagTone> = {
  pokeBall: 'ball',
  greatBall: 'great',
  potion: 'potion',
  hyperPotion: 'hyper',
};

export const ITEM_IMAGE: Partial<Record<BuyableItem, ImageSourcePropType>> = {
  pokeBall: require('@/assets/items/poke-ball.webp'),
  greatBall: require('@/assets/items/great-ball.webp'),
};

export const ITEM_GLYPH: Record<BuyableItem, string> = {
  pokeBall: '◓',
  greatBall: '◓',
  potion: '✚',
  hyperPotion: '✚',
};

export const TONE_BOX: Record<BagTone, { borderColor: string }> = {
  ball: { borderColor: 'rgba(255,92,122,0.35)' },
  great: { borderColor: 'rgba(79,209,255,0.35)' },
  potion: { borderColor: 'rgba(124,255,107,0.35)' },
  hyper: { borderColor: 'rgba(255,215,94,0.35)' },
};

export const TONE_GLYPH: Record<BagTone, { color: string }> = {
  ball: { color: '#FF9DAF' },
  great: { color: '#8FE8FF' },
  potion: { color: '#B6FFAE' },
  hyper: { color: '#FFE9A8' },
};
