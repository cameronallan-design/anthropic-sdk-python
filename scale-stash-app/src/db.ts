/**
 * IndexedDB persistence layer using the idb library.
 * All data is stored in the browser — no native dependencies required.
 */
import { openDB, type IDBPDatabase } from 'idb';
import type { Kit } from './types';

const DB_NAME = 'scale-stash';
const DB_VERSION = 1;
const STORE = 'kits';

interface StashDB {
  kits: {
    key: string;
    value: Kit;
    indexes: { addedAt: number };
  };
}

let _db: IDBPDatabase<StashDB> | null = null;

async function getDb(): Promise<IDBPDatabase<StashDB>> {
  if (_db) return _db;
  _db = await openDB<StashDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('addedAt', 'addedAt');
      }
    },
  });
  return _db;
}

export async function getAllKits(): Promise<Kit[]> {
  const db = await getDb();
  const all = await db.getAllFromIndex(STORE, 'addedAt');
  return all.reverse(); // newest first
}

export async function saveKit(kit: Kit): Promise<Kit> {
  const db = await getDb();
  await db.put(STORE, kit);
  return kit;
}

export async function deleteKit(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE, id);
}

export async function bulkImport(kits: Kit[]): Promise<Kit[]> {
  const db = await getDb();
  const tx = db.transaction(STORE, 'readwrite');
  await Promise.all([...kits.map((k) => tx.store.put(k)), tx.done]);
  return getAllKits();
}
