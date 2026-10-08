import type { Bag } from '../types';
import { HYPER_POTION_PRICE, POTION_PRICE, buyItem, maxAffordable, priceOf } from './shop';

const bag = (overrides: Partial<Bag> = {}): Bag => ({
  pokeBall: 10,
  greatBall: 10,
  potion: 3,
  money: 132,
  hyperPotion: 1,
  ...overrides,
});

describe('shop prices', () => {
  it('charges 10 for a potion and 20 for a hyper potion', () => {
    expect(POTION_PRICE).toBe(10);
    expect(HYPER_POTION_PRICE).toBe(20);
    expect(priceOf('potion')).toBe(10);
    expect(priceOf('hyperPotion')).toBe(20);
  });
});

describe('maxAffordable', () => {
  it('divides the whole coins by the price', () => {
    expect(maxAffordable(bag({ money: 132 }), 'potion')).toBe(13);
    expect(maxAffordable(bag({ money: 132 }), 'hyperPotion')).toBe(6);
  });

  it('counts only the whole part of the money', () => {
    expect(maxAffordable(bag({ money: 12.5 }), 'potion')).toBe(1);
    expect(maxAffordable(bag({ money: 19.99 }), 'hyperPotion')).toBe(0);
  });

  it('never goes below zero', () => {
    expect(maxAffordable(bag({ money: 0 }), 'potion')).toBe(0);
    expect(maxAffordable(bag({ money: -50 }), 'potion')).toBe(0);
  });
});

describe('buyItem', () => {
  it('moves the money into the item, one at a time', () => {
    const result = buyItem(bag(), 'potion', 1);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.spent).toBe(10);
    expect(result.bag.money).toBe(122);
    expect(result.bag.potion).toBe(4);
  });

  it('charges quantity times price in one go', () => {
    const result = buyItem(bag(), 'potion', 2);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.spent).toBe(20);
    expect(result.bag.money).toBe(112);
    expect(result.bag.potion).toBe(5);
  });

  it('buys hyper potions without touching the potions', () => {
    const result = buyItem(bag(), 'hyperPotion', 2);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.spent).toBe(40);
    expect(result.bag.money).toBe(92);
    expect(result.bag.hyperPotion).toBe(3);
    expect(result.bag.potion).toBe(3);
  });

  it('refuses a selection the money cannot cover, and leaves the bag alone', () => {
    const original = bag({ money: 15 });

    const result = buyItem(original, 'potion', 2);

    expect(result).toEqual({ ok: false, reason: 'money' });
    expect(original.money).toBe(15);
    expect(original.potion).toBe(3);
  });

  it('refuses a purchase that would leave the money negative', () => {
    expect(buyItem(bag({ money: 39 }), 'hyperPotion', 2)).toEqual({ ok: false, reason: 'money' });
  });

  it('allows a purchase that spends the money exactly', () => {
    const result = buyItem(bag({ money: 20 }), 'hyperPotion', 1);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.bag.money).toBe(0);
    expect(result.bag.hyperPotion).toBe(2);
  });

  it('spends only the whole coins and keeps the fraction', () => {
    const result = buyItem(bag({ money: 12.5 }), 'potion', 1);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.bag.money).toBe(2.5);
  });

  it('refuses a quantity that is not a positive whole number', () => {
    for (const qty of [0, -1, 1.5, Number.NaN]) {
      expect(buyItem(bag(), 'potion', qty)).toEqual({ ok: false, reason: 'qty' });
    }
  });

  it('returns a new bag and never mutates the one it is given', () => {
    const original = bag();

    const result = buyItem(original, 'potion', 1);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.bag).not.toBe(original);
    expect(original.money).toBe(132);
    expect(original.potion).toBe(3);
  });

  it('does not sell the balls the battles drop', () => {
    expect(buyItem(bag(), 'pokeDex' as never, 1)).toEqual({ ok: false, reason: 'item' });
  });
});
