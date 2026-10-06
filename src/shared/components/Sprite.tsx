import { Image } from 'expo-image';
import { memo } from 'react';

const SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

export const spriteUrl = (id: number): string => `${SPRITE_BASE}/${id}.png`;
export const backSpriteUrl = (id: number): string => `${SPRITE_BASE}/back/${id}.png`;

interface SpriteProps {
  id: number;
  size: number;
  back?: boolean;
}

export const Sprite = memo(function Sprite({ id, size, back = false }: SpriteProps) {
  return (
    <Image
      source={{ uri: back ? backSpriteUrl(id) : spriteUrl(id) }}
      style={{ width: size, height: size }}
      contentFit="contain"
      cachePolicy="memory-disk"
      transition={120}
      accessibilityIgnoresInvertColors
    />
  );
});
