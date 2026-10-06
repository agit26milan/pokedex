export type TypeName = string;

interface Matchups {
  x2?: TypeName[];
  x05?: TypeName[];
  x0?: TypeName[];
}

/** Modern 18-type chart: Gen-1 species already carry fairy/steel typing, so it must be complete. */
const CHART: Record<TypeName, Matchups> = {
  normal: { x05: ['rock', 'steel'], x0: ['ghost'] },
  fire: { x2: ['grass', 'ice', 'bug', 'steel'], x05: ['fire', 'water', 'rock', 'dragon'] },
  water: { x2: ['fire', 'ground', 'rock'], x05: ['water', 'grass', 'dragon'] },
  electric: { x2: ['water', 'flying'], x05: ['electric', 'grass', 'dragon'], x0: ['ground'] },
  grass: { x2: ['water', 'ground', 'rock'], x05: ['fire', 'grass', 'poison', 'flying', 'bug', 'dragon', 'steel'] },
  ice: { x2: ['grass', 'ground', 'flying', 'dragon'], x05: ['fire', 'water', 'ice', 'steel'] },
  fighting: { x2: ['normal', 'ice', 'rock', 'dark', 'steel'], x05: ['poison', 'flying', 'psychic', 'bug', 'fairy'], x0: ['ghost'] },
  poison: { x2: ['grass', 'fairy'], x05: ['poison', 'ground', 'rock', 'ghost'], x0: ['steel'] },
  ground: { x2: ['fire', 'electric', 'poison', 'rock', 'steel'], x05: ['grass', 'bug'], x0: ['flying'] },
  flying: { x2: ['grass', 'fighting', 'bug'], x05: ['electric', 'rock', 'steel'] },
  psychic: { x2: ['fighting', 'poison'], x05: ['psychic', 'steel'], x0: ['dark'] },
  bug: { x2: ['grass', 'psychic', 'dark'], x05: ['fire', 'fighting', 'poison', 'flying', 'ghost', 'steel', 'fairy'] },
  rock: { x2: ['fire', 'ice', 'flying', 'bug'], x05: ['fighting', 'ground', 'steel'] },
  ghost: { x2: ['psychic', 'ghost'], x05: ['dark'], x0: ['normal'] },
  dragon: { x2: ['dragon'], x05: ['steel'], x0: ['fairy'] },
  dark: { x2: ['psychic', 'ghost'], x05: ['fighting', 'dark', 'fairy'] },
  steel: { x2: ['ice', 'rock', 'fairy'], x05: ['fire', 'water', 'electric', 'steel'] },
  fairy: { x2: ['fighting', 'dragon', 'dark'], x05: ['fire', 'poison', 'steel'] },
};

export const multiplierAgainst = (attackType: TypeName, defenderType: TypeName): number => {
  const matchups = CHART[attackType];
  if (!matchups) return 1;
  if (matchups.x0?.includes(defenderType)) return 0;
  if (matchups.x2?.includes(defenderType)) return 2;
  if (matchups.x05?.includes(defenderType)) return 0.5;
  return 1;
};

/** Dual types multiply: a Grass/Ice target takes 4x from Fire. */
export const effectiveness = (attackType: TypeName, defenderTypes: readonly TypeName[]): number =>
  defenderTypes.reduce((total, type) => total * multiplierAgainst(attackType, type), 1);

export const hasStab = (attackType: TypeName, attackerTypes: readonly TypeName[]): boolean =>
  attackerTypes.includes(attackType);
