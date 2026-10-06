import type { DexEntry } from '@/shared/data/dex';

export interface Stats {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

const contribution = (base: number, level: number): number => Math.floor(((base * 2) * level) / 100);

export function statsAt(entry: DexEntry, level: number): Stats {
  const { hp, attack, defense, specialAttack, specialDefense, speed } = entry.baseStats;
  return {
    hp: contribution(hp, level) + level + 10,
    attack: contribution(attack, level) + 5,
    defense: contribution(defense, level) + 5,
    specialAttack: contribution(specialAttack, level) + 5,
    specialDefense: contribution(specialDefense, level) + 5,
    speed: contribution(speed, level) + 5,
  };
}

export const maxHpFor = (entry: DexEntry, level: number): number => statsAt(entry, level).hp;

export const xpForLevel = (level: number): number => level ** 3;

export function levelFromXp(xp: number): number {
  if (xp <= 0) return 1;
  return Math.max(1, Math.min(100, Math.floor(Math.cbrt(xp))));
}
