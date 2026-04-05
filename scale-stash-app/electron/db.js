const Database = require("better-sqlite3");
const path = require("path");
const { app } = require("electron");

let _db = null;

function getDb() {
  if (_db) return _db;
  const dbPath = path.join(app.getPath("userData"), "stash.db");
  _db = new Database(dbPath);
  _db.pragma("journal_mode = WAL");
  _db.exec(`
    CREATE TABLE IF NOT EXISTS kits (
      id    TEXT PRIMARY KEY,
      data  TEXT NOT NULL,
      added_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000)
    );
  `);
  return _db;
}

function getAllKits() {
  return getDb()
    .prepare("SELECT data FROM kits ORDER BY added_at DESC")
    .all()
    .map((r) => JSON.parse(r.data));
}

function saveKit(kit) {
  const db = getDb();
  const exists = db.prepare("SELECT id FROM kits WHERE id = ?").get(kit.id);
  if (exists) {
    db.prepare("UPDATE kits SET data = ? WHERE id = ?").run(
      JSON.stringify(kit),
      kit.id
    );
  } else {
    db.prepare(
      "INSERT INTO kits (id, data, added_at) VALUES (?, ?, ?)"
    ).run(kit.id, JSON.stringify(kit), kit.addedAt || Date.now());
  }
  return kit;
}

function deleteKit(id) {
  getDb().prepare("DELETE FROM kits WHERE id = ?").run(id);
}

function bulkImport(kits) {
  const db = getDb();
  const stmt = db.prepare(
    "INSERT OR REPLACE INTO kits (id, data, added_at) VALUES (?, ?, ?)"
  );
  const tx = db.transaction((rows) => {
    for (const kit of rows) {
      stmt.run(kit.id, JSON.stringify(kit), kit.addedAt || Date.now());
    }
  });
  tx(kits);
}

module.exports = { getAllKits, saveKit, deleteKit, bulkImport };
