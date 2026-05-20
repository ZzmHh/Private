import fs from "node:fs";
import path from "node:path";

const dbPath = path.join(process.cwd(), "data", "app-db.json");

const defaultDb = {
  users: [],
  tasks: [],
  orders: [],
  usageLogs: [],
  feedback: [],
  storeConnections: [],
  extensionSnapshots: [],
  storeMetricsImports: [],
};

function normalizeDb(db) {
  return {
    ...defaultDb,
    ...db,
    users: Array.isArray(db.users) ? db.users : [],
    tasks: Array.isArray(db.tasks) ? db.tasks : [],
    orders: Array.isArray(db.orders) ? db.orders : [],
    usageLogs: Array.isArray(db.usageLogs) ? db.usageLogs : [],
    feedback: Array.isArray(db.feedback) ? db.feedback : [],
    storeConnections: Array.isArray(db.storeConnections) ? db.storeConnections : [],
    extensionSnapshots: Array.isArray(db.extensionSnapshots) ? db.extensionSnapshots : [],
    storeMetricsImports: Array.isArray(db.storeMetricsImports) ? db.storeMetricsImports : [],
  };
}

export function ensureDb() {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(defaultDb, null, 2), "utf8");
  }
}

export function readDb() {
  ensureDb();
  return normalizeDb(JSON.parse(fs.readFileSync(dbPath, "utf8")));
}

export function writeDb(db) {
  ensureDb();
  fs.writeFileSync(dbPath, JSON.stringify(normalizeDb(db), null, 2), "utf8");
}
