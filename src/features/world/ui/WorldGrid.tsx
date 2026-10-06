import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Sprite } from '@/shared/components/Sprite';
import { colors, radius } from '@/theme/tokens';
import {
  CHUNK_SIZE,
  chunkOf,
  generateChunk,
  localOf,
  reachableTiles,
  type Direction,
  type Position,
} from '../logic/world';
import { Tile, TILE_SIZE } from './Tile';

const VIEW_X = 9;
const VIEW_Y = 9;
const VIEW_W = VIEW_X * TILE_SIZE;
const VIEW_H = VIEW_Y * TILE_SIZE;

interface WorldGridProps {
  worldSeed: number;
  position: Position;
  partnerId: number | undefined;
  onMove: (direction: Direction) => void;
}

const directionTo = (from: Position, to: Position): Direction => {
  if (to.x > from.x) return 'right';
  if (to.x < from.x) return 'left';
  if (to.y > from.y) return 'down';
  return 'up';
};

export function WorldGrid({ worldSeed, position, partnerId, onMove }: WorldGridProps) {
  const chunkX = chunkOf(position.x);
  const chunkY = chunkOf(position.y);

  // Regenerating only at a chunk boundary means one cheap re-render per 20 tiles walked.
  const chunk = useMemo(() => generateChunk(worldSeed, chunkX, chunkY), [worldSeed, chunkX, chunkY]);
  const reachable = useMemo(() => reachableTiles(worldSeed, position), [worldSeed, position]);

  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);

  // The camera follows the player on the UI thread, so walking never re-renders a tile.
  useEffect(() => {
    const target = (axis: number, origin: number, view: number) => -(axis - origin) * TILE_SIZE + (view - TILE_SIZE) / 2;
    offsetX.value = withTiming(target(position.x, chunkX * CHUNK_SIZE, VIEW_W), { duration: 170 });
    offsetY.value = withTiming(target(position.y, chunkY * CHUNK_SIZE, VIEW_H), { duration: 170 });
  }, [position.x, position.y, chunkX, chunkY, offsetX, offsetY]);

  const stageStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offsetX.value }, { translateY: offsetY.value }],
  }));

  const playerLeft = localOf(position.x) * TILE_SIZE;
  const playerTop = localOf(position.y) * TILE_SIZE;

  return (
    <View style={styles.viewport}>
      <Animated.View
        style={[styles.stage, { width: CHUNK_SIZE * TILE_SIZE, height: CHUNK_SIZE * TILE_SIZE }, stageStyle]}
      >
        {chunk.tiles.map((tile) => (
          <View key={`${tile.x}:${tile.y}`} style={[styles.slot, { left: localOf(tile.x) * TILE_SIZE, top: localOf(tile.y) * TILE_SIZE }]}>
            <Tile type={tile.type} reachable={false} />
          </View>
        ))}

        {reachable.map((tile) => (
          <Pressable
            key={`tap-${tile.x}:${tile.y}`}
            onPress={() => onMove(directionTo(position, tile))}
            style={[styles.tap, { left: localOf(tile.x) * TILE_SIZE, top: localOf(tile.y) * TILE_SIZE }]}
            accessibilityRole="button"
            accessibilityLabel={`Walk ${directionTo(position, tile)}`}
          >
            <View style={styles.ring} />
          </Pressable>
        ))}

        <View style={[styles.player, { left: playerLeft, top: playerTop }]}>
          {partnerId ? <Sprite id={partnerId} size={TILE_SIZE - 4} /> : null}
        </View>
      </Animated.View>
      <View pointerEvents="none" style={styles.vignette} />
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: {
    width: VIEW_W,
    height: VIEW_H,
    alignSelf: 'center',
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: colors.inkDeep,
  },
  stage: { position: 'absolute', left: 0, top: 0 },
  slot: { position: 'absolute', width: TILE_SIZE, height: TILE_SIZE },
  tap: { position: 'absolute', width: TILE_SIZE, height: TILE_SIZE },
  ring: {
    flex: 1,
    margin: 3,
    borderRadius: 4,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: `${colors.accent}aa`,
    backgroundColor: `${colors.accent}18`,
  },
  player: { position: 'absolute', width: TILE_SIZE, height: TILE_SIZE, alignItems: 'center', justifyContent: 'center' },
  vignette: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(5,7,15,0.55)',
  },
});
