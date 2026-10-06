import {
  CHUNK_SIZE,
  chunkOf,
  generateChunk,
  isBlocked,
  localOf,
  movePlayer,
  nextPosition,
  reachableTiles,
  SPAWN,
  tileAt,
  type Direction,
  type Position,
} from './world';

const SEED = 20261006;

const directionWhere = (predicate: (target: Position) => boolean): Direction | undefined =>
  (['up', 'down', 'left', 'right'] as Direction[]).find((direction) => predicate(nextPosition(SPAWN, direction)));

const isOpen = (target: Position): boolean => !isBlocked(tileAt(SEED, target.x, target.y));

describe('tileAt', () => {
  it('is deterministic for the same seed and coordinate', () => {
    expect(tileAt(SEED, 3, -7)).toBe(tileAt(SEED, 3, -7));
  });

  it('changes when the seed changes', () => {
    const a = Array.from({ length: 50 }, (_, i) => tileAt(1, i, 0));
    const b = Array.from({ length: 50 }, (_, i) => tileAt(2, i, 0));
    expect(a).not.toEqual(b);
  });

  it('keeps the spawn tile walkable', () => {
    expect(isBlocked(tileAt(SEED, SPAWN.x, SPAWN.y))).toBe(false);
  });
});

describe('chunk coordinates', () => {
  it('handles negative coordinates', () => {
    expect(chunkOf(-1)).toBe(-1);
    expect(localOf(-1)).toBe(CHUNK_SIZE - 1);
    expect(chunkOf(20)).toBe(1);
    expect(localOf(20)).toBe(0);
  });
});

describe('generateChunk', () => {
  it('returns a full chunk with absolute world coordinates', () => {
    const chunk = generateChunk(SEED, 0, 0);
    expect(chunk.tiles).toHaveLength(CHUNK_SIZE * CHUNK_SIZE);
    expect(chunk.tiles[0]).toEqual({ x: 0, y: 0, type: expect.any(String) });
  });

  it('offsets tiles by the chunk origin', () => {
    const chunk = generateChunk(SEED, 2, -1);
    expect(chunk.tiles[0]).toEqual({ x: 40, y: -20, type: expect.any(String) });
  });

  it('is reproducible and differs between chunks', () => {
    expect(generateChunk(SEED, 1, 1).tiles).toEqual(generateChunk(SEED, 1, 1).tiles);
    expect(generateChunk(SEED, 1, 1).tiles).not.toEqual(generateChunk(SEED, 1, 2).tiles);
  });
});

describe('movePlayer', () => {
  it('moves onto a walkable neighbour', () => {
    const open = directionWhere(isOpen);
    expect(open).toBeDefined();

    const result = movePlayer(SEED, SPAWN, open as Direction);
    expect(result.moved).toBe(true);
    expect(result.position).toEqual(nextPosition(SPAWN, open as Direction));
  });

  it('refuses to walk into water or rock', () => {
    const blocked = directionWhere((target) => !isOpen(target));
    expect(blocked).toBeDefined();

    const result = movePlayer(SEED, SPAWN, blocked as Direction);
    expect(result.moved).toBe(false);
    expect(result.position).toEqual(SPAWN);
    expect(['water', 'rock']).toContain(result.blockedBy);
  });

  it('crosses a chunk boundary without special handling', () => {
    const edge = { x: CHUNK_SIZE - 1, y: 0 };
    const result = movePlayer(SEED, edge, 'right');
    if (result.moved) expect(result.position.x).toBe(CHUNK_SIZE);
    else expect(result.blockedBy).toBeDefined();
  });
});

describe('reachableTiles', () => {
  it('only ever returns walkable tiles, at most four', () => {
    const tiles = reachableTiles(SEED, SPAWN);
    expect(tiles.length).toBeLessThanOrEqual(4);
    for (const tile of tiles) expect(isBlocked(tile.type)).toBe(false);
  });

  it('matches the directions movePlayer accepts', () => {
    const viaMove = (['up', 'down', 'left', 'right'] as Direction[])
      .map((direction) => movePlayer(SEED, SPAWN, direction))
      .filter((result) => result.moved).length;
    expect(reachableTiles(SEED, SPAWN)).toHaveLength(viaMove);
  });
});
