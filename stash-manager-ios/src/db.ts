/**
 * expo-sqlite persistence layer.
 * Kits are stored as a single JSON blob per row for simplicity.
 * Shop links are encoded in the same JSON.
 */
import * as SQLite from 'expo-sqlite';
import { Kit } from './types';

let _db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync('stash.db');
  await _db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS kits (
      id TEXT PRIMARY KEY NOT NULL,
      data TEXT NOT NULL,
      added_at INTEGER NOT NULL DEFAULT 0
    );
  `);
  return _db;
}

export async function getAllKits(): Promise<Kit[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ data: string }>(
    'SELECT data FROM kits ORDER BY added_at DESC'
  );
  return rows.map((r) => JSON.parse(r.data) as Kit);
}

export async function saveKit(kit: Kit): Promise<Kit> {
  const db = await getDb();
  const data = JSON.stringify(kit);
  await db.runAsync(
    `INSERT INTO kits (id, data, added_at) VALUES (?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET data = excluded.data, added_at = excluded.added_at`,
    kit.id,
    data,
    kit.addedAt
  );
  return kit;
}

export async function deleteKit(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM kits WHERE id = ?', id);
}

export async function bulkImport(kits: Kit[]): Promise<Kit[]> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    for (const kit of kits) {
      const data = JSON.stringify(kit);
      await db.runAsync(
        `INSERT INTO kits (id, data, added_at) VALUES (?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET data = excluded.data, added_at = excluded.added_at`,
        kit.id,
        data,
        kit.addedAt
      );
    }
  });
  return getAllKits();
}
