import fs from "node:fs";
import path from "node:path";

const dataDir = path.join(process.cwd(), "data");
export const dbPath = path.join(dataDir, "app-db.json");
export const sqlitePath = path.join(dataDir, "app.db");
export const backupDir = path.join(dataDir, "backups");

let lastBackupAt = null;

export function getDbPaths() {
  return { dataDir, dbPath, backupDir };
}

export function getLastBackupAt() {
  return lastBackupAt;
}

function ensureBackupDir() {
  fs.mkdirSync(backupDir, { recursive: true });
}

function pruneBackups() {
  ensureBackupDir();
  const files = fs
    .readdirSync(backupDir)
    .filter((f) => f.startsWith("app-db-") && (f.endsWith(".json") || f.endsWith(".sqlite")))
    .map((f) => ({ name: f, mtime: fs.statSync(path.join(backupDir, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);

  const keep = new Set();
  const now = Date.now();
  const hourlyCutoff = now - 48 * 3600 * 1000;
  const dailySeen = new Set();

  for (const file of files) {
    const age = now - file.mtime;
    if (age <= hourlyCutoff) {
      keep.add(file.name);
      continue;
    }
    const day = new Date(file.mtime).toISOString().slice(0, 10);
    if (!dailySeen.has(day) && dailySeen.size < 7) {
      dailySeen.add(day);
      keep.add(file.name);
    }
  }

  for (const file of files) {
    if (!keep.has(file.name)) {
      try {
        fs.unlinkSync(path.join(backupDir, file.name));
      } catch {
        /* ignore */
      }
    }
  }
}

/**
 * @param {string} [reason]
 * @returns {string|null}
 */
export function backupDbNow(reason = "scheduled") {
  ensureBackupDir();
  const backend = String(process.env.DB_BACKEND || "json").toLowerCase();
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

  if (backend === "sqlite") {
    if (!fs.existsSync(sqlitePath)) return null;
    const dest = path.join(backupDir, `app-db-${stamp}.sqlite`);
    fs.copyFileSync(sqlitePath, dest);
    lastBackupAt = new Date().toISOString();
    pruneBackups();
    if (reason === "startup") console.log(`[db-backup] 启动备份: ${path.basename(dest)}`);
    return dest;
  }

  if (!fs.existsSync(dbPath)) return null;
  const dest = path.join(backupDir, `app-db-${stamp}.json`);
  fs.copyFileSync(dbPath, dest);
  lastBackupAt = new Date().toISOString();
  pruneBackups();
  if (reason === "startup") {
    console.log(`[db-backup] 启动备份: ${path.basename(dest)}`);
  }
  return dest;
}

/**
 * @returns {boolean}
 */
export function restoreLatestBackup() {
  ensureBackupDir();
  const files = fs
    .readdirSync(backupDir)
    .filter((f) => f.startsWith("app-db-") && (f.endsWith(".json") || f.endsWith(".sqlite")))
    .map((f) => ({ name: f, mtime: fs.statSync(path.join(backupDir, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);

  if (!files.length) return false;

  fs.copyFileSync(path.join(backupDir, files[0].name), dbPath);
  console.warn(`[db-backup] 已从备份恢复: ${files[0].name}`);
  return true;
}

let backupTimer = null;

export function startDbBackupScheduler() {
  if (backupTimer) return;
  const intervalMs = Number(process.env.DB_BACKUP_INTERVAL_MS || 3600000);
  backupDbNow("startup");
  backupTimer = setInterval(() => backupDbNow("scheduled"), intervalMs);
  if (typeof backupTimer.unref === "function") backupTimer.unref();
}

export function stopDbBackupScheduler() {
  if (backupTimer) {
    clearInterval(backupTimer);
    backupTimer = null;
  }
}
