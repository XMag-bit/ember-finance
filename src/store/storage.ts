import AsyncStorage from "@react-native-async-storage/async-storage";

export const KEYS = {
  profile: "ember:profile",
  txs: "ember:txs",
  goals: "ember:goals",
  budgets: "ember:budgets",
  subs: "ember:subs",
} as const;

/** Reads and parses a key. Returns the fallback on a missing key or parse error. */
export async function loadJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Stringifies and saves. Catches errors so the app never crashes. */
export async function saveJSON(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable - app keeps working in memory.
  }
}

/** Removes every ember: key. */
export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove(Object.values(KEYS));
  } catch {
    // Ignore - nothing to clear.
  }
}
