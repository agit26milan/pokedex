import { GREAT_BALL_PRICE, POKE_BALL_PRICE, type Bag, type BuyableItem } from '../types';

export const POTION_PRICE = 10;
export const HYPER_POTION_PRICE = 20;

export const SHOP_ITEMS: readonly BuyableItem[] = ['potion', 'hyperPotion', 'pokeBall', 'greatBall'];

export type BuyRefusal = 'item' | 'qty' | 'money';

export type BuyOutcome =
  | { ok: true; item: BuyableItem; qty: number; spent: number; bag: Bag }
  | { ok: false; reason: BuyRefusal };

export const isBuyable = (item: string): item is BuyableItem => SHOP_ITEMS.includes(item as BuyableItem);

export function priceOf(item: BuyableItem): number {
  if(item === 'pokeBall') return POKE_BALL_PRICE;
  if(item === 'greatBall') return GREAT_BALL_PRICE;
  return item === 'potion' ? POTION_PRICE : HYPER_POTION_PRICE;
}

export const wholeCoins = (money: number): number =>
  Number.isFinite(money) ? Math.max(0, Math.floor(money)) : 0;

export function maxAffordable(bag: Bag, item: BuyableItem): number {
  return Math.floor(wholeCoins(bag.money) / priceOf(item));
}

export function buyItem(bag: Bag, item: BuyableItem, qty: number): BuyOutcome {
  if (!isBuyable(item)) return { ok: false, reason: 'item' };
  if (!Number.isInteger(qty) || qty <= 0) return { ok: false, reason: 'qty' };

  const spent = priceOf(item) * qty;
  if (spent > wholeCoins(bag.money)) return { ok: false, reason: 'money' };

  const paid: Bag = { ...bag, money: bag.money - spent };
  return {
    ok: true,
    item,
    qty,
    spent,
    bag: { ...paid, [item]: paid[item as keyof Bag] + qty },
  };
}
