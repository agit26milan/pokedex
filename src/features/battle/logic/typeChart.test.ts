import { effectiveness, hasStab, multiplierAgainst } from './typeChart';

describe('type chart', () => {
  it('resolves the classic matchups', () => {
    expect(multiplierAgainst('fire', 'grass')).toBe(2);
    expect(multiplierAgainst('water', 'fire')).toBe(2);
    expect(multiplierAgainst('fire', 'water')).toBe(0.5);
    expect(multiplierAgainst('electric', 'ground')).toBe(0);
    expect(multiplierAgainst('normal', 'ghost')).toBe(0);
    expect(multiplierAgainst('ghost', 'normal')).toBe(0);
    expect(multiplierAgainst('fighting', 'ghost')).toBe(0);
    expect(multiplierAgainst('dragon', 'fairy')).toBe(0);
    expect(multiplierAgainst('fairy', 'dragon')).toBe(2);
  });

  it('treats unlisted pairs as neutral', () => {
    expect(multiplierAgainst('normal', 'normal')).toBe(1);
    expect(multiplierAgainst('grass', 'electric')).toBe(1);
  });

  it('multiplies across dual types', () => {
    expect(effectiveness('fire', ['grass', 'ice'])).toBe(4);
    expect(effectiveness('electric', ['water', 'flying'])).toBe(4);
    expect(effectiveness('fire', ['water', 'dragon'])).toBe(0.25);
    expect(effectiveness('electric', ['water', 'ground'])).toBe(0);
  });

  it('covers every modern type and only references real types', () => {
    const known = new Set(['normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy']);
    const attacker = (type: string) => known.has(type);

    for (const attackType of known) {
      expect(attacker(attackType)).toBe(true);
      for (const defenderType of known) {
        expect([0, 0.5, 1, 2]).toContain(multiplierAgainst(attackType, defenderType));
      }
    }
  });

  it('flags same-type attack bonus from either type', () => {
    expect(hasStab('grass', ['grass', 'poison'])).toBe(true);
    expect(hasStab('poison', ['grass', 'poison'])).toBe(true);
    expect(hasStab('fire', ['grass', 'poison'])).toBe(false);
  });
});
