const backend = String(
  process.env.DB_BACKEND || (process.env.NODE_ENV === "production" ? "sqlite" : "json"),
).toLowerCase();

/** @type {{ readDb: Function, writeDb: Function, getDatabaseInfo: Function, closeDatabase?: Function }} */
let impl;

if (backend === "sqlite") {
  impl = await import("./sqliteRepository.js");
  console.log("[db] 使用 SQLite 后端 (data/app.db)");
} else {
  impl = await import("./jsonRepository.js");
  console.log("[db] 使用 JSON 文件后端 (data/app-db.json)");
}

export const readDb = impl.readDb;
export const writeDb = impl.writeDb;
export const getDatabaseInfo = impl.getDatabaseInfo;
export const closeDatabase = impl.closeDatabase || (() => {});
export const dbBackend = backend;
export { withDbLock } from "./dbSerialize.js";
