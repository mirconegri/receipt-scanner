import { getDatabase } from '../storage/database';

export interface AppSettings {
  currency: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  currency: 'EUR',
};

const KNOWN_KEYS: (keyof AppSettings)[] = ['currency'];

export async function getSettings(): Promise<AppSettings> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM settings');
  const stored = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  return { ...DEFAULT_SETTINGS, ...stored } as AppSettings;
}

export async function setSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    key,
    String(value),
  );
}

export function isKnownSettingsKey(key: string): key is keyof AppSettings {
  return (KNOWN_KEYS as string[]).includes(key);
}
