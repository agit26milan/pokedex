import { readCache, writeCache } from '@/shared/lib/storage';
import { api, describeApiError } from './client';

export interface EnrichedDetail {
  id: number;
  name: string;
  height: number;
  weight: number;
  abilities: { name: string; hidden: boolean }[];
  flavorText: string | null;
  genus: string | null;
}

export type FetchResult<T> = { ok: true; data: T } | { ok: false; error: string };

interface RawPokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  abilities: { is_hidden: boolean; ability: { name: string } }[];
}

interface RawSpecies {
  genera: { genus: string; language: { name: string } }[];
  flavor_text_entries: { flavor_text: string; language: { name: string }; version: { name: string } }[];
}

const cacheKey = (id: number): string => `detail/${id}`;

/**
 * Second source for the detail screen only. The screen renders from the bundled seed
 * first, so a failure here degrades to "fewer facts", never to an empty screen.
 * Cached for CACHE_TTL_MS so reopening a Pokémon does not hit the network again.
 */
export async function getEnrichedDetail(id: number): Promise<FetchResult<EnrichedDetail>> {
  const cached = await readCache<EnrichedDetail>(cacheKey(id));
  if (cached) return { ok: true, data: cached };

  try {
    const [pokemon, species] = await Promise.all([
      api.get<RawPokemon>(`/pokemon/${id}`),
      api.get<RawSpecies>(`/pokemon-species/${id}`),
    ]);

    const detail: EnrichedDetail = {
      id: pokemon.data.id,
      name: pokemon.data.name,
      height: pokemon.data.height,
      weight: pokemon.data.weight,
      abilities: pokemon.data.abilities.map((item) => ({ name: item.ability.name, hidden: item.is_hidden })),
      flavorText: pickEnglishFlavor(species.data),
      genus: species.data.genera.find((item) => item.language.name === 'en')?.genus ?? null,
    };

    await writeCache(cacheKey(id), detail);
    return { ok: true, data: detail };
  } catch (error) {
    return { ok: false, error: describeApiError(error) };
  }
}

function pickEnglishFlavor(species: RawSpecies): string | null {
  const english = species.flavor_text_entries.filter((entry) => entry.language.name === 'en');
  const red = english.find((entry) => entry.version.name === 'red');
  const chosen = red ?? english[0];
  if (!chosen) return null;
  return chosen.flavor_text.replace(/[\n\f\r]/g, ' ').replace(/\s+/g, ' ').trim();
}
