export const colors = {
  ink: '#0A0E1A',
  inkDeep: '#05070F',
  surface: '#111827',
  surfaceRaised: '#161B2E',
  panel: 'rgba(255,255,255,0.05)',
  stroke: 'rgba(255,255,255,0.10)',
  strokeStrong: '#2A3357',
  text: '#EAF0FF',
  textDim: '#8A96B8',
  textFaint: '#5A6689',
  accent: '#7CFF6B',
  accentDeep: '#43D14F',
  accentOn: '#06240B',
  info: '#4FD1FF',
  warn: '#FFB020',
  danger: '#FF5C7A',
} as const;

export const tileColors = {
  path: '#151C31',
  grass: '#17331F',
  tallGrass: '#2E7D46',
  tallGrassDeep: '#1B5029',
  water: '#123059',
  rock: '#252B42',
} as const;

export const typeColors: Record<string, string> = {
  normal: '#9199A1',
  fire: '#FF9D55',
  water: '#5090D6',
  electric: '#F4D23C',
  grass: '#63BC5A',
  ice: '#73CEC0',
  fighting: '#CE416B',
  poison: '#AB6AC8',
  ground: '#D97845',
  flying: '#8FA9DE',
  psychic: '#F97176',
  bug: '#91C12F',
  rock: '#C5B78C',
  ghost: '#5269AD',
  dragon: '#0B6DC3',
  dark: '#5A5465',
  steel: '#5A8EA2',
  fairy: '#EC8FE6',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 10, md: 16, lg: 22, xl: 30, pill: 999 } as const;

export const font = {
  mono: 'ui-monospace',
} as const;
