import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';

/**
 * AsyncStorage rather than MMKV on purpose: MMKV needs a dev build, and the app
 * has to stay runnable from a plain Expo Go QR scan.
 */
export const zustandStorage = createJSONStorage(() => AsyncStorage);

export const STORE_VERSION = 1;

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
