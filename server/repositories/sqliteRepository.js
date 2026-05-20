import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { defaultDb, normalizeDb } from "./dbSchema.js";
import { dbPath as jsonDbPath, readDb as readJsonDb } from "./jsonRepository.js";

const sqlitePath = path.join(process.cwd(), "data", "app.db");

/** @type {import("better-sqlite3").Database | null} */
let conn = null;

function getConn() {
  if (conn) return conn;
  fs.mkdirSync(path.dirname(sqlitePath), { recursive: true });
  conn = new Database(sqlitePath);
  conn.pragma("journal_mode = WAL");
  conn.pragma("synchronous = NORMAL");
  initSchema(conn);
  maybeImportFromJson(conn);
  return conn;
}

/** @param {import("better-sqlite3").Database} database */
function initSchema(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      created_at TEXT,
      data TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      status TEXT,
      data TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS usage_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      type TEXT,
      data TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS feedback (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS store_connections (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      platform TEXT,
      data TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS extension_snapshots (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      shop_key TEXT,
      pulled_at TEXT,
      data TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS store_metrics_imports (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      data TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS cs_faq_templates (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      shop_key TEXT,
      data TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS cs_seller_alerts (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      data TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS cs_automation_settings (
      user_id TEXT PRIMARY KEY,
      data TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_usage_logs_user_created ON usage_logs(user_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
  `);
}

/** @param {import("better-sqlite3").Database} database */
function maybeImportFromJson(database) {
  const imported = database.prepare("SELECT value FROM meta WHERE key = 'imported_from_json'").get();
  if (imported?.value === "1") return;

  if (!fs.existsSync(jsonDbPath)) {
    database.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES ('imported_from_json', '1')").run();
    return;
  }

  console.log("[sqliteRepository] 首次启动，从 app-db.json 导入…");
  const jsonDb = readJsonDb();
  writeDb(jsonDb);
  database.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES ('imported_from_json', '1')").run();
  console.log("[sqliteRepository] JSON 导入完成。");
}

/** @param {import("better-sqlite3").Database} database @param {string} table @param {object[]} items @param {(item: object) => unknown[]} rowMapper */
function replaceTable(database, table, items, rowMapper) {
  database.prepare(`DELETE FROM ${table}`).run();
  if (!items.length) return;
  const columns = rowMapper(items[0]).length;
  const placeholders = Array(columns).fill("?").join(", ");
  const insert = database.prepare(`INSERT INTO ${table} VALUES (${placeholders})`);
  for (const item of items) {
    insert.run(...rowMapper(item));
  }
}

export function readDb() {
  const database = getConn();
  /** @type {ReturnType<typeof normalizeDb>} */
  const db = { ...defaultDb };

  db.users = database
    .prepare("SELECT data FROM users")
    .all()
    .map((r) => JSON.parse(r.data));
  db.tasks = database
    .prepare("SELECT data FROM tasks")
    .all()
    .map((r) => JSON.parse(r.data));
  db.orders = database
    .prepare("SELECT data FROM orders")
    .all()
    .map((r) => JSON.parse(r.data));
  db.usageLogs = database
    .prepare("SELECT data FROM usage_logs ORDER BY created_at ASC")
    .all()
    .map((r) => JSON.parse(r.data));
  db.feedback = database
    .prepare("SELECT data FROM feedback")
    .all()
    .map((r) => JSON.parse(r.data));
  db.storeConnections = database
    .prepare("SELECT data FROM store_connections")
    .all()
    .map((r) => JSON.parse(r.data));
  db.extensionSnapshots = database
    .prepare("SELECT data FROM extension_snapshots")
    .all()
    .map((r) => JSON.parse(r.data));
  db.storeMetricsImports = database
    .prepare("SELECT data FROM store_metrics_imports")
    .all()
    .map((r) => JSON.parse(r.data));
  db.csFaqTemplates = database
    .prepare("SELECT data FROM cs_faq_templates")
    .all()
    .map((r) => JSON.parse(r.data));
  db.csSellerAlerts = database
    .prepare("SELECT data FROM cs_seller_alerts")
    .all()
    .map((r) => JSON.parse(r.data));

  db.csAutomationSettings = {};
  for (const row of database.prepare("SELECT user_id, data FROM cs_automation_settings").all()) {
    db.csAutomationSettings[row.user_id] = JSON.parse(row.data);
  }

  return normalizeDb(db);
}

export function writeDb(data) {
  const normalized = normalizeDb(data);
  const database = getConn();

  const tx = database.transaction(() => {
    replaceTable(database, "users", normalized.users, (u) => [u.id, JSON.stringify(u)]);
    replaceTable(database, "tasks", normalized.tasks, (t) => [
      t.id,
      t.userId || null,
      t.createdAt || null,
      JSON.stringify(t),
    ]);
    replaceTable(database, "orders", normalized.orders, (o) => [
      o.id,
      o.userId || null,
      o.status || null,
      JSON.stringify(o),
    ]);
    replaceTable(database, "usage_logs", normalized.usageLogs, (l) => [
      l.id,
      l.userId,
      l.createdAt,
      l.type || null,
      JSON.stringify(l),
    ]);
    replaceTable(database, "feedback", normalized.feedback, (f) => [f.id, JSON.stringify(f)]);
    replaceTable(database, "store_connections", normalized.storeConnections, (s) => [
      s.id,
      s.userId || null,
      s.platform || null,
      JSON.stringify(s),
    ]);
    replaceTable(database, "extension_snapshots", normalized.extensionSnapshots, (s) => [
      s.id,
      s.userId || null,
      s.shopKey || null,
      s.pulledAt || null,
      JSON.stringify(s),
    ]);
    replaceTable(database, "store_metrics_imports", normalized.storeMetricsImports, (r) => [
      r.id,
      r.userId || null,
      JSON.stringify(r),
    ]);
    replaceTable(database, "cs_faq_templates", normalized.csFaqTemplates, (t) => [
      t.id,
      t.userId || null,
      t.shopKey || null,
      JSON.stringify(t),
    ]);
    replaceTable(database, "cs_seller_alerts", normalized.csSellerAlerts, (a) => [
      a.id,
      a.userId || null,
      JSON.stringify(a),
    ]);

    database.prepare("DELETE FROM cs_automation_settings").run();
    const upsertSettings = database.prepare(
      "INSERT INTO cs_automation_settings (user_id, data) VALUES (?, ?)",
    );
    for (const [userId, settings] of Object.entries(normalized.csAutomationSettings)) {
      upsertSettings.run(userId, JSON.stringify(settings));
    }
  });

  tx();
}

export function getDatabaseInfo() {
  let ok = false;
  let sizeBytes = 0;
  let mtime = null;
  try {
    const stat = fs.statSync(sqlitePath);
    ok = stat.isFile();
    sizeBytes = stat.size;
    mtime = stat.mtime.toISOString();
    getConn().prepare("SELECT 1 AS n").get();
  } catch {
    ok = false;
  }
  return {
    backend: "sqlite",
    path: sqlitePath,
    ok,
    sizeBytes,
    mtime,
  };
}

export function closeDatabase() {
  if (conn) {
    conn.close();
    conn = null;
  }
}
