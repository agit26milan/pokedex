import { createMember } from '@/features/party/store/partySlice';
import { getEntry, movesetFor, type EvolutionStep } from '@/shared/data/dex';
import { maxPpOf } from '@/shared/data/moves';
import { evolveMember, evolutionFor } from './evolve';
import { maxHpFor } from './stats';

const IVYSAUR: EvolutionStep = { id: 2, name: 'ivysaur', method: 'level', level: 16 };

describe('evolutionFor', () => {
  it('offers the next form only once the new level reaches the threshold', () => {
    expect(evolutionFor(1, 15)).toBeNull();
    expect(evolutionFor(1, 16)).toEqual(IVYSAUR);
    expect(evolutionFor(2, 32)).toEqual({ id: 3, name: 'venusaur', method: 'level', level: 32 });
  });

  it('ignores triggers this game cannot perform', () => {
    expect(evolutionFor(25, 80)).toBeNull();
    expect(evolutionFor(133, 80)).toBeNull();
    expect(evolutionFor(64, 80)).toBeNull();
  });

  it('stops at a final form and at an id outside the dex', () => {
    expect(evolutionFor(3, 90)).toBeNull();
    expect(evolutionFor(999, 50)).toBeNull();
  });
});

describe('evolveMember', () => {
  it('keeps level and XP, and takes the evolved max HP at the same ratio', () => {
    const bulbasaur = createMember(1, 16)!;
    const hurt = { ...bulbasaur, hp: Math.round(maxHpFor(getEntry(1)!, 16) / 2) };

    const ivysaur = evolveMember(hurt, IVYSAUR)!;

    expect(ivysaur.id).toBe(2);
    expect(ivysaur.name).toBe('ivysaur');
    expect(ivysaur.level).toBe(16);
    expect(ivysaur.xp).toBe(bulbasaur.xp);
    expect(ivysaur.maxHp).toBe(maxHpFor(getEntry(2)!, 16));
    expect(ivysaur.maxHp).toBeGreaterThan(bulbasaur.maxHp);
    expect(ivysaur.hp).toBe(Math.round(ivysaur.maxHp / 2));
  });

  it('never rounds a nearly fainted member down to zero', () => {
    const hurt = { ...createMember(1, 16)!, hp: 1 };
    const evolved = evolveMember(hurt, IVYSAUR)!;
    expect(evolved.hp).toBeGreaterThanOrEqual(1);
    expect(evolved.hp).toBeLessThanOrEqual(evolved.maxHp);
  });

  it('takes the evolved learnset and refills PP', () => {
    const drained = { ...createMember(1, 16)!, moves: [{ name: 'tackle', pp: 1 }] };
    const evolved = evolveMember(drained, IVYSAUR)!;
    const expected = movesetFor(getEntry(2)!, 16, 4);

    expect(expected).not.toEqual(['tackle']);
    expect(evolved.moves.map((slot) => slot.name)).toEqual(expected);
    for (const slot of evolved.moves) expect(slot.pp).toBe(maxPpOf(slot.name));
  });

  it('gives back null when the target is not in the dex', () => {
    const missing: EvolutionStep = { id: 999, name: 'missingno', method: 'level', level: 16 };
    expect(evolveMember(createMember(1, 16)!, missing)).toBeNull();
  });
});
