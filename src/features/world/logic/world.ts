import { hashSeed } from '@/shared/lib/rng';

export type TileType = 'path' | 'grass' | 'tallGrass' | 'water' | 'rock';
export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Position {
  x: number;
  y: number;
}

export interface Tile extends Position {
  type: TileType;
}

export interface Chunk {
  chunkX: number;
  chunkY: number;
  tiles: Tile[];
}

export const CHUNK_SIZE = 20;
export const ENCOUNTER_TILE: TileType = 'tallGrass';
export const SPAWN: Position = { x: 10, y: 10 };

const BLOCKED: readonly TileType[] = ['water', 'rock'];

export function isBlocked(type: TileType): boolean {
  return BLOCKED.includes(type);
}

export const chunkOf = (value: number): number => Math.floor(value / CHUNK_SIZE);

/** Local tile within its chunk, always 0..CHUNK_SIZE-1 — works for negative coordinates too. */
export const localOf = (value: number): number => ((value % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;

const STEP: Record<Direction, Position> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

/**
 * Tile type at a global coordinate. Derived only from the world seed and the
 * coordinate, so the map is unbounded and identical on every run — nothing about
 * the world is ever stored.
 */
export function tileAt(worldSeed: number, x: number, y: number): TileType {
  const local = hashSeed(worldSeed, chunkOf(x), chunkOf(y), localOf(x), localOf(y));
  const noise = local / 0xffffffff;

  // Guarantee the spawn tile is walkable so a fresh run can never start boxed in.
  if (x === SPAWN.x && y === SPAWN.y) return 'path';

  if (noise < 0.20) return 'path';
  if (noise < 0.60) return 'grass';
  if (noise < 0.82) return ENCOUNTER_TILE;
  if (noise < 0.92) return 'rock';
  return 'water';
}

export function generateChunk(worldSeed: number, chunkX: number, chunkY: number): Chunk {
  const tiles: Tile[] = [];
  for (let y = 0; y < CHUNK_SIZE; y += 1) {
    for (let x = 0; x < CHUNK_SIZE; x += 1) {
      const worldX = chunkX * CHUNK_SIZE + x;
      const worldY = chunkY * CHUNK_SIZE + y;
      tiles.push({ x: worldX, y: worldY, type: tileAt(worldSeed, worldX, worldY) });
    }
  }
  return { chunkX, chunkY, tiles };
}

export const nextPosition = (from: Position, direction: Direction): Position => ({
  x: from.x + STEP[direction].x,
  y: from.y + STEP[direction].y,
});

export interface MoveResult {
  position: Position;
  moved: boolean;
  blockedBy?: TileType;
}

export function movePlayer(worldSeed: number, from: Position, direction: Direction): MoveResult {
  const target = nextPosition(from, direction);
  const type = tileAt(worldSeed, target.x, target.y);
  if (isBlocked(type)) return { position: from, moved: false, blockedBy: type };
  return { position: target, moved: true };
}

export function reachableTiles(worldSeed: number, from: Position): Tile[] {
  return (Object.keys(STEP) as Direction[])
    .map((direction) => nextPosition(from, direction))
    .filter((position) => !isBlocked(tileAt(worldSeed, position.x, position.y)))
    .map((position) => ({ ...position, type: tileAt(worldSeed, position.x, position.y) }));
}
