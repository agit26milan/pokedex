import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
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
import { Tile } from './Tile';

/**
 * Camera size in tiles. The tile size itself is measured from the screen, so the
 * framing stays the same on every device instead of showing more of the chunk.
 */
const VIEW_COLS = 9;
const VIEW_ROWS = 9;
const MOVE_MS = 170;

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

  const chunk = useMemo(() => generateChunk(worldSeed, chunkX, chunkY), [worldSeed, chunkX, chunkY]);
  const reachable = useMemo(() => reachableTiles(worldSeed, position), [worldSeed, position]);

  const [tileSize, setTileSize] = useState(0);
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    const next = Math.max(0, Math.min(width / VIEW_COLS, height / VIEW_ROWS));
    setTileSize((current) => (next === current ? current : next));
  }, []);

  const viewW = tileSize * VIEW_COLS;
  const viewH = tileSize * VIEW_ROWS;

  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);

  useEffect(() => {
    if (tileSize === 0) return;
    const target = (axis: number, origin: number, view: number) =>
      -(axis - origin) * tileSize + (view - tileSize) / 2;
    offsetX.value = withTiming(target(position.x, chunkX * CHUNK_SIZE, viewW), { duration: MOVE_MS });
    offsetY.value = withTiming(target(position.y, chunkY * CHUNK_SIZE, viewH), { duration: MOVE_MS });
  }, [position.x, position.y, chunkX, chunkY, tileSize, viewW, viewH, offsetX, offsetY]);

  const stageStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offsetX.value }, { translateY: offsetY.value }],
  }));

  const playerLeft = localOf(position.x) * tileSize;
  const playerTop = localOf(position.y) * tileSize;

  return (
    <View style={styles.host} onLayout={onLayout}>
      <View style={[styles.viewport, { width: viewW, height: viewH }]}>
        <Animated.View
          style={[styles.stage, { width: CHUNK_SIZE * tileSize, height: CHUNK_SIZE * tileSize }, stageStyle]}
        >
          {chunk.tiles.map((tile) => (
            <View
              key={`${tile.x}:${tile.y}`}
              style={[
                styles.slot,
                { left: localOf(tile.x) * tileSize, top: localOf(tile.y) * tileSize, width: tileSize, height: tileSize },
              ]}
            >
              <Tile type={tile.type} reachable={false} size={tileSize} />
            </View>
          ))}

          {reachable.map((tile) => (
            <Pressable
              key={`tap-${tile.x}:${tile.y}`}
              onPress={() => onMove(directionTo(position, tile))}
              style={[
                styles.tap,
                { left: localOf(tile.x) * tileSize, top: localOf(tile.y) * tileSize, width: tileSize, height: tileSize },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Walk ${directionTo(position, tile)}`}
            >
              <View style={styles.ring} />
            </Pressable>
          ))}

          <View style={[styles.player, { left: playerLeft, top: playerTop, width: tileSize, height: tileSize }]}>
            {partnerId ? <Sprite id={partnerId} size={tileSize - 4} /> : null}
          </View>
        </Animated.View>
        <View pointerEvents="none" style={styles.vignette} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  viewport: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: colors.inkDeep,
  },
  stage: { position: 'absolute', left: 0, top: 0 },
  slot: { position: 'absolute' },
  tap: { position: 'absolute' },
  ring: {
    flex: 1,
    margin: 3,
    borderRadius: 4,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: `${colors.accent}aa`,
    backgroundColor: `${colors.accent}18`,
  },
  player: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
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
