import seed from './pokedex.gen1.json';

type Entry = {
  id: number;
  name: string;
  captureRate: number;
  types: string[];
  baseStats: Record<string, number>;
  evolution: { id: number; name: string }[];
  moves: { name: string; level: number }[];
};
type Move = { type: string; power: number; accuracy: number; pp: number; damageClass: string };

const pokemon = seed.pokemon as Entry[];
const moves = seed.moves as Record<string, Move>;
const VALID_TYPES = new Set([
  'normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground', 'flying',
  'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
]);
const NO_DAMAGING_MOVE = ['abra', 'ditto', 'kakuna', 'metapod'];
const damaging = (entry: Entry): boolean => entry.moves.some((move) => (moves[move.name]?.power ?? 0) > 0);

describe('pokedex.gen1 seed', () => {
  it('covers all 151 Gen-1 entries exactly once, in dex order', () => {
    expect(pokemon).toHaveLength(151);
    expect(pokemon.map((entry) => entry.id)).toEqual(Array.from({ length: 151 }, (_, i) => i + 1));
  });

  it('gives every entry valid typing and positive base stats', () => {
    for (const entry of pokemon) {
      expect(entry.name).toBeTruthy();
      expect(entry.types.length).toBeGreaterThanOrEqual(1);
      expect(entry.types.length).toBeLessThanOrEqual(2);
      for (const type of entry.types) expect(VALID_TYPES).toContain(type);
      for (const value of Object.values(entry.baseStats)) expect(value).toBeGreaterThan(0);
      expect(Object.keys(entry.baseStats)).toHaveLength(6);
    }
  });

  it('only references moves that exist in the move table', () => {
    for (const entry of pokemon) {
      expect(entry.moves.length).toBeGreaterThan(0);
      for (const move of entry.moves) expect(moves[move.name]).toBeDefined();
    }
  });

  it('keeps the known move-less set from drifting', () => {
    const withoutDamaging = pokemon.filter((entry) => !damaging(entry)).map((entry) => entry.name).sort();
    expect(withoutDamaging).toEqual(NO_DAMAGING_MOVE);
  });

  it('has sane move stats', () => {
    for (const [name, move] of Object.entries(moves)) {
      expect(name).toBeTruthy();
      expect(VALID_TYPES).toContain(move.type);
      expect(move.pp).toBeGreaterThan(0);
      expect(move.accuracy).toBeGreaterThan(0);
      expect(move.accuracy).toBeLessThanOrEqual(100);
      expect(['physical', 'special', 'status']).toContain(move.damageClass);
    }
  });

  it('only links evolution stages inside Gen 1', () => {
    for (const entry of pokemon) {
      for (const stage of entry.evolution) expect(stage.id).toBeLessThanOrEqual(151);
    }
  });

  it('keeps capture rates in the game-legal band', () => {
    for (const entry of pokemon) {
      expect(entry.captureRate).toBeGreaterThanOrEqual(3);
      expect(entry.captureRate).toBeLessThanOrEqual(255);
    }
  });
});
