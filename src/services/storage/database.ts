import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'receipt-scanner.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS receipts (
  id TEXT PRIMARY KEY NOT NULL,
  merchant TEXT,
  address TEXT,
  date TEXT,
  time TEXT,
  receipt_number TEXT,
  currency TEXT NOT NULL,
  subtotal REAL,
  tax REAL,
  discount REAL,
  total REAL,
  raw_text TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS receipt_items (
  id TEXT PRIMARY KEY NOT NULL,
  receipt_id TEXT NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity REAL,
  unit_price REAL,
  total_price REAL,
  position INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_receipts_date ON receipts(date);
CREATE INDEX IF NOT EXISTS idx_receipt_items_receipt_id ON receipt_items(receipt_id);
`;

/** Opens (and lazily migrates) the app's single on-device database. Safe to
 * call repeatedly — the connection and migration only happen once. */
export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DATABASE_NAME).then(async (db) => {
      await db.execAsync(SCHEMA);
      return db;
    });
  }
  return dbPromise;
}

/** Test/debug only: drops every table and re-creates them empty. */
export async function resetDatabase(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync(`
    DROP TABLE IF EXISTS receipt_items;
    DROP TABLE IF EXISTS receipts;
    DROP TABLE IF EXISTS settings;
  `);
  await db.execAsync(SCHEMA);
}
