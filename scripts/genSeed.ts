
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const API = 'https://pokeapi.co/api/v2';
const VERSION_GROUP = 'red-blue';
const LAST_DEX_ID = 151;
const CONCURRENCY = 6;
const OUT = path.resolve(__dirname, '../src/shared/data/pokedex.gen1.json');

type Json = Record<string, any>;

async function get<T = Json>(url: string, attempt = 1): Promise<T> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return (await res.json()) as T;
  } catch (error) {
    if (attempt >= 4) throw error;
    await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
    return get<T>(url, attempt + 1);
  }
}

async function pool<T, R>(items: readonly T[], limit: number, work: (item: T, index: number) => Promise<R>) {
  const results = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await work(items[index] as T, index);
    }
  });
  await Promise.all(workers);
  return results;
}

const idFromUrl = (url: string): number => Number(url.split('/').filter(Boolean).pop());

type EvolutionMethod = 'level' | 'stone' | 'trade';

type RawStep =
  | { id: number; name: string; method: EvolutionMethod; level?: number; item?: string }
  | { id: number; name: string; method: 'other'; level?: number; item?: string };

type EvolutionStep = Omit<RawStep, 'method'> & { method: EvolutionMethod };

type EvolutionInfo = { from: EvolutionStep | null; to: EvolutionStep[] };

type RawInfo = { from: RawStep | null; to: RawStep[] };

const stepFrom = (child: Json): RawStep => {
  const details = (child.evolution_details ?? []) as Json[];
  const detail =
    details.find((d) => d.trigger?.name === 'level-up' && d.min_level != null) ??
    details.find((d) => d.trigger?.name === 'use-item') ??
    details.find((d) => d.trigger?.name === 'trade') ??
    details[0] ??
    {};
  const trigger = detail.trigger?.name as string | undefined;
  const id = idFromUrl(child.species.url);
  const name = child.species.name as string;
  if (trigger === 'use-item') return { id, name, method: 'stone', item: detail.item?.name as string };
  if (trigger === 'trade') return { id, name, method: 'trade' };
  if (trigger === 'level-up' && detail.min_level != null) {
    return { id, name, method: 'level', level: detail.min_level as number };
  }
  return { id, name, method: 'other' };
};

function evolutionMap(chain: Json): Map<number, RawInfo> {
  const map = new Map<number, RawInfo>();
  const walk = (node: Json, from: RawStep | null): void => {
    map.set(idFromUrl(node.species.url), { from, to: (node.evolves_to ?? []).map(stepFrom) });
    for (const child of node.evolves_to ?? []) {
      const details = stepFrom(child);
      walk(child, { ...details, id: idFromUrl(node.species.url), name: node.species.name as string });
    }
  };
  walk(chain.chain, null);
  return map;
}

const keep = (step: RawStep): EvolutionStep => {
  if (step.method === 'other') {
    throw new Error(`Gen 1 evolution without a level, stone or trade: ${step.name}`);
  }
  return step;
};

const gen1Evolution = (info: RawInfo | undefined): EvolutionInfo => {
  const from = info?.from ?? null;
  return {
    from: from && from.id <= LAST_DEX_ID ? keep(from) : null,
    to: (info?.to ?? []).filter((step) => step.id <= LAST_DEX_ID).map(keep),
  };
};

function levelUpMoves(detail: Json): { name: string; level: number }[] {
  const moves: { name: string; level: number }[] = [];
  for (const entry of detail.moves ?? []) {
    const gen1 = (entry.version_group_details ?? []).find(
      (detail_: Json) =>
        detail_.version_group?.name === VERSION_GROUP && detail_.move_learn_method?.name === 'level-up',
    );
    if (gen1) moves.push({ name: entry.move.name, level: gen1.level_learned_at });
  }
  return moves.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
}

async function main() {
  const ids = Array.from({ length: LAST_DEX_ID }, (_, i) => i + 1);
  console.log(`fetching ${ids.length} Pokémon from PokéAPI…`);

  const details = await pool(ids, CONCURRENCY, async (id) => {
    const detail = await get(`${API}/pokemon/${id}`);
    const species = await get(detail.species.url);
    const chain = await get(species.evolution_chain.url);
    return { id, detail, species, chain };
  });

  const pokemon = details.map(({ id, detail, species, chain }) => ({
    id,
    name: detail.name as string,
    captureRate: species.capture_rate as number,
    types: (detail.types as Json[]).map((t) => t.type.name as string),
    baseStats: {
      hp: detail.stats[0].base_stat as number,
      attack: detail.stats[1].base_stat as number,
      defense: detail.stats[2].base_stat as number,
      specialAttack: detail.stats[3].base_stat as number,
      specialDefense: detail.stats[4].base_stat as number,
      speed: detail.stats[5].base_stat as number,
    },
    evolution: gen1Evolution(evolutionMap(chain).get(id)),
    moves: levelUpMoves(detail),
  }));

  const moveNames = Array.from(new Set(pokemon.flatMap((p) => p.moves.map((m) => m.name)))).sort();
  console.log(`fetching ${moveNames.length} move details…`);

  const moveResults = await pool(moveNames, CONCURRENCY, async (name) => {
    const move = await get(`${API}/move/${name}`);
    return [
      name,
      {
        type: move.type.name as string,
        power: (move.power ?? 0) as number,
        accuracy: (move.accuracy ?? 100) as number,
        pp: (move.pp ?? 5) as number,
        damageClass: move.damage_class.name as string,
      },
    ] as const;
  });
  const moves = Object.fromEntries(moveResults);

  await mkdir(path.dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify({ pokemon, moves }), 'utf8');

  const expected = pokemon.filter((p) => p.moves.some((m) => (moves[m.name]?.power ?? 0) > 0)).length;
  console.log(`pokemon: ${pokemon.length}`);
  console.log(`moves:   ${moveNames.length}`);
  console.log(`with at least one damaging move: ${expected}`);
  console.log(`types covered: ${new Set(pokemon.flatMap((p) => p.types)).size}`);
  console.log(`written: ${OUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
