/** "mr-mime" -> "Mr Mime", "bulbasaur" -> "Bulbasaur". */
export const titleCase = (value: string): string =>
  value
    .split('-')
    .map((part) => (part.length === 0 ? part : part[0]!.toUpperCase() + part.slice(1)))
    .join(' ');

export const dexNumber = (id: number): string => `#${String(id).padStart(3, '0')}`;

export const percent = (value: number): string => `${Math.round(value)}%`;
