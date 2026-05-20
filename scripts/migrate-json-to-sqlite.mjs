/**
 * 将 data/app-db.json 导入 SQLite（或刷新 SQLite 数据）
 * 用法: node scripts/migrate-json-to-sqlite.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
process.chdir(root);

const jsonPath = path.join(root, "data", "app-db.json");
if (!fs.existsSync(jsonPath)) {
  console.error("未找到 data/app-db.json");
  process.exit(1);
}

process.env.DB_BACKEND = "sqlite";

const { readDb: readJson } = await import("../server/repositories/jsonRepository.js");
const { writeDb: writeSqlite, getDatabaseInfo } = await import("../server/repositories/sqliteRepository.js");

const data = readJson();
writeSqlite(data);
const info = getDatabaseInfo();

console.log("[migrate] JSON → SQLite 完成");
console.log(`  users: ${data.users.length}`);
console.log(`  tasks: ${data.tasks.length}`);
console.log(`  usageLogs: ${data.usageLogs.length}`);
console.log(`  db: ${info.path} (${info.sizeBytes} bytes)`);
console.log("");
console.log("生产环境请在 .env 设置: DB_BACKEND=sqlite");
