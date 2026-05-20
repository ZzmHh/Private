import fs from "node:fs";
import path from "node:path";
import { defaultDb, normalizeDb } from "./dbSchema.js";
import { backupDbNow, dbPath, restoreLatestBackup } from "../jobs/dbBackup.js";

export { dbPath };

export function ensureDb() {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(defaultDb, null, 2), "utf8");
  }
}

function readJsonFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

export function readDb() {
  ensureDb();
  try {
    return normalizeDb(readJsonFile(dbPath));
  } catch (error) {
    console.error("[jsonRepository] 主库损坏，尝试从备份恢复:", error.message);
    if (restoreLatestBackup()) {
      return normalizeDb(readJsonFile(dbPath));
    }
    throw error;
  }
}

export function writeDb(db) {
  ensureDb();
  const normalized = normalizeDb(db);
  const tmpPath = `${dbPath}.tmp`;
  const payload = JSON.stringify(normalized, null, 2);
  fs.writeFileSync(tmpPath, payload, "utf8");
  fs.renameSync(tmpPath, dbPath);
}

export function getDatabaseInfo() {
  ensureDb();
  let stat = null;
  try {
    stat = fs.statSync(dbPath);
  } catch {
    /* ignore */
  }
  return {
    backend: "json",
    path: dbPath,
    ok: Boolean(stat?.isFile()),
    sizeBytes: stat?.size ?? 0,
    mtime: stat?.mtime?.toISOString() ?? null,
  };
}

/** 写入后可选触发备份（大批量迁移时用） */
export function writeDbWithBackup(db) {
  writeDb(db);
  backupDbNow("after-write");
}
