import AsyncStorage from '@react-native-async-storage/async-storage';

// Every persisted key lives here, so it's clear what the app keeps in the browser.
export const storageKeys = {
  token: 'cashmine.token',
  claims: 'cashmine.claims.v1',
} as const;

type StorageKey = (typeof storageKeys)[keyof typeof storageKeys];

// Writes throw so callers can tell the user; reads return null when there's nothing usable.
export const storage = {
  getString(key: StorageKey): Promise<string | null> {
    return AsyncStorage.getItem(key);
  },

  setString(key: StorageKey, value: string): Promise<void> {
    return AsyncStorage.setItem(key, value);
  },

  async getJson<T>(key: StorageKey): Promise<T | null> {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null; // corrupt entry: start fresh rather than crash
    }
  },

  setJson(key: StorageKey, value: unknown): Promise<void> {
    return AsyncStorage.setItem(key, JSON.stringify(value));
  },

  remove(key: StorageKey): Promise<void> {
    return AsyncStorage.removeItem(key);
  },
};
