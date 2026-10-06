import seed from './pokedex.gen1.json';

type Step = { id: number; name: string; method: 'level' | 'stone' | 'trade'; level?: number; item?: string };
type Entry = {
  id: number;
  name: string;
  captureRate: number;
  types: string[];
  baseStats: Record<string, number>;
  evolution: { from: Step | null; to: Step[] };
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

  it('gives every Gen 1 evolution a real trigger and an existing partner', () => {
    const byId = new Map(pokemon.map((entry) => [entry.id, entry]));
    const steps = pokemon.flatMap((entry) => [...entry.evolution.to, ...(entry.evolution.from ? [entry.evolution.from] : [])]);

    expect(steps.length).toBeGreaterThan(40);
    for (const step of steps) {
      expect(step.id).toBeLessThanOrEqual(151);
      expect(byId.has(step.id)).toBe(true);
      if (step.method === 'level') expect(step.level).toBeGreaterThan(0);
      if (step.method === 'stone') expect(step.item).toBeTruthy();
      if (step.method === 'trade') expect(step.level).toBeUndefined();
    }
  });

  it('agrees in both directions about every link', () => {
    const byId = new Map(pokemon.map((entry) => [entry.id, entry]));
    let links = 0;
    for (const entry of pokemon) {
      for (const step of entry.evolution.to) {
        const target = byId.get(step.id)!;
        expect(target.evolution.from).toMatchObject({ id: entry.id, name: entry.name, method: step.method });
        links += 1;
      }
      if (entry.evolution.from) {
        const source = byId.get(entry.evolution.from.id)!;
        expect(source.evolution.to.some((next) => next.id === entry.id)).toBe(true);
      }
    }
    expect(links).toBeGreaterThan(40);
  });

  it('records the level, stone and trade cases the games actually have', () => {
    const byId = new Map(pokemon.map((entry) => [entry.id, entry]));
    expect(byId.get(2)!.evolution.from).toEqual({ id: 1, name: 'bulbasaur', method: 'level', level: 16 });
    expect(byId.get(2)!.evolution.to).toEqual([{ id: 3, name: 'venusaur', method: 'level', level: 32 }]);
    expect(byId.get(25)!.evolution.to).toEqual([{ id: 26, name: 'raichu', method: 'stone', item: 'thunder-stone' }]);
    expect(byId.get(64)!.evolution.to).toEqual([{ id: 65, name: 'alakazam', method: 'trade' }]);
    expect(byId.get(3)!.evolution.to).toEqual([]);
  });

  it('drops a predecessor that only exists after Gen 1', () => {
    const byId = new Map(pokemon.map((entry) => [entry.id, entry]));
    expect(byId.get(25)!.evolution.from).toBeNull();
    expect(byId.get(35)!.evolution.from).toBeNull();
    expect(byId.get(124)!.evolution.from).toBeNull();
  });

  it('keeps Eevee branching in parallel instead of chaining its evolutions', () => {
    const eevee = pokemon.find((entry) => entry.id === 133)!;
    expect(eevee.evolution.to.map((step) => step.name).sort()).toEqual(['flareon', 'jolteon', 'vaporeon']);
    expect(eevee.evolution.to.every((step) => step.method === 'stone')).toBe(true);
    expect(eevee.evolution.from).toBeNull();
  });

  it('never links a Pokemon to itself', () => {
    for (const entry of pokemon) {
      expect(entry.evolution.to.some((step) => step.id === entry.id)).toBe(false);
      expect(entry.evolution.from?.id).not.toBe(entry.id);
    }
  });

  it('keeps capture rates in the game-legal band', () => {
    for (const entry of pokemon) {
      expect(entry.captureRate).toBeGreaterThanOrEqual(3);
      expect(entry.captureRate).toBeLessThanOrEqual(255);
    }
  });
});
