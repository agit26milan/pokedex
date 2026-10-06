import { ALL_TYPES, DEX_SIZE, getEntry, isDamaging, movesetFor, POKEDEX } from './dex';

describe('dex access', () => {
  it('exposes all 151 entries by id', () => {
    expect(DEX_SIZE).toBe(151);
    expect(getEntry(25)?.name).toBe('pikachu');
    expect(getEntry(999)).toBeUndefined();
  });

  it('lists every type used by Gen-1 species, including the modern additions', () => {
    expect(ALL_TYPES).toContain('fairy');
    expect(ALL_TYPES).toContain('steel');
    expect(ALL_TYPES).toHaveLength(17);
  });

  it('marks damaging moves from the move table', () => {
    expect(isDamaging('tackle')).toBe(true);
    expect(isDamaging('growl')).toBe(false);
    expect(isDamaging('not-a-move')).toBe(false);
  });
});

describe('movesetFor', () => {
  const bulbasaur = getEntry(1);
  const abra = getEntry(63);

  it('never returns more than four moves', () => {
    const moves = movesetFor(bulbasaur!, 48);
    expect(moves.length).toBeLessThanOrEqual(4);
    expect(moves.length).toBeGreaterThan(0);
  });

  it('only returns moves the Pokémon has learned by that level', () => {
    const known = new Set(bulbasaur!.moves.filter((move) => move.level <= 5).map((move) => move.name));
    for (const move of movesetFor(bulbasaur!, 5)) expect(known).toContain(move);
  });

  it('prefers damaging moves so an attacker is never left toothless', () => {
    const moves = movesetFor(bulbasaur!, 13);
    expect(moves).toContain('vine-whip');
    expect(moves).toContain('tackle');
    expect(moves).not.toContain('growl');
  });

  it('falls back to status moves when the species has none that damage', () => {
    const moves = movesetFor(abra!, 30);
    expect(moves.length).toBeGreaterThan(0);
    for (const move of moves) expect(isDamaging(move)).toBe(false);
  });

  it('is deterministic for every species and level', () => {
    for (const entry of POKEDEX) {
      expect(movesetFor(entry, 20)).toEqual(movesetFor(entry, 20));
    }
  });
});
