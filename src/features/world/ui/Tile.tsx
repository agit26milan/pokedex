import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, tileColors } from '@/theme/tokens';
import type { TileType } from '../logic/world';

const FILL: Record<TileType, string> = {
  path: tileColors.path,
  grass: tileColors.grass,
  tallGrass: tileColors.tallGrass,
  water: tileColors.water,
  rock: tileColors.rock,
};

interface TileProps {
  type: TileType;
  reachable: boolean;
  /** Filled by the parent so the grid can scale to the screen. */
  size: number;
}

export const Tile = memo(function Tile({ type, reachable, size }: TileProps) {
  return (
    <View style={[{ width: size, height: size, backgroundColor: FILL[type] }, reachable && styles.reachable]}>
      {type === 'tallGrass' ? <View style={styles.blades} /> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  reachable: { borderWidth: 2, borderStyle: 'dashed', borderColor: `${colors.accent}99` },
  blades: {
    position: 'absolute',
    left: '18%',
    right: '18%',
    top: '40%',
    bottom: '12%',
    backgroundColor: `${colors.accent}44`,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
});
