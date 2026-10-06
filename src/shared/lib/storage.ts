import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';


export const zustandStorage = createJSONStorage(() => AsyncStorage);

// v2: party moves became { name, pp } slots instead of bare names, so persisted runs need the upgrade in
// src/store/index.ts. Bumped rather than reset so a save from v1 keeps its party, bag and position.
export const STORE_VERSION = 2;

export const CACHE_PREFIX = 'pokedex-quest/cache/';
export const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

interface CacheEnvelope<T> {
  savedAt: number;
  value: T;
}

export async function readCache<T>(key: string, now = Date.now()): Promise<T | undefined> {
  const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as CacheEnvelope<T>;
    if (now - parsed.savedAt > CACHE_TTL_MS) {
      await AsyncStorage.removeItem(CACHE_PREFIX + key);
      return undefined;
    }
    return parsed.value;
  } catch {
    await AsyncStorage.removeItem(CACHE_PREFIX + key);
    return undefined;
  }
}

export async function writeCache<T>(key: string, value: T, now = Date.now()): Promise<void> {
  const envelope: CacheEnvelope<T> = { savedAt: now, value };
  await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(envelope));
}
