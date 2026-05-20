import crypto from "node:crypto";
import { readDb, writeDb } from "../repositories/jsonRepository.js";

const MAX_IMPORTS_PER_USER = 30;

/**
 * @param {{ userId: string, label?: string, parsed: object, analysis: object, warnings?: string[] }} param0
 */
export function saveStoreMetricsImport({ userId, label, parsed, analysis, warnings = [] }) {
  const db = readDb();
  if (!Array.isArray(db.storeMetricsImports)) db.storeMetricsImports = [];

  const record = {
    id: crypto.randomUUID(),
    userId,
    label: String(label || "经营数据导入").slice(0, 200),
    platform: parsed.shopRows?.[0]?.platform || parsed.skuRows?.[0]?.platform || "multi",
    shopRows: parsed.shopRows || [],
    skuRows: parsed.skuRows || [],
    analysis,
    warnings,
    importedAt: new Date().toISOString(),
  };

  db.storeMetricsImports.unshift(record);
  const others = db.storeMetricsImports.filter((x) => x.userId !== userId);
  const mine = db.storeMetricsImports.filter((x) => x.userId === userId).slice(0, MAX_IMPORTS_PER_USER);
  db.storeMetricsImports = [...mine, ...others].slice(0, 5000);
  writeDb(db);
  return record;
}

export function getLatestStoreMetricsImport(userId) {
  const db = readDb();
  return (db.storeMetricsImports || []).find((x) => x.userId === userId) || null;
}

/**
 * @param {string} userId
 * @param {string} [platform]
 */
export function getStoreMetricsAgentContext(userId, platform) {
  const latest = getLatestStoreMetricsImport(userId);
  if (!latest) return null;

  const p = platform ? String(platform).toLowerCase() : null;
  if (p && p !== "auto" && p !== "multi") {
    const rowPlat = String(latest.platform || "").toLowerCase();
    if (rowPlat && rowPlat !== "multi" && rowPlat !== p) {
      return null;
    }
  }

  return {
    source: "universal-csv-import",
    importedAt: latest.importedAt,
    label: latest.label,
    platform: latest.platform,
    analysis: latest.analysis,
    shopRows: latest.shopRows,
    skuRows: latest.skuRows.slice(0, 30),
    warnings: latest.warnings,
  };
}

export function listStoreMetricsImports(userId, limit = 5) {
  const db = readDb();
  return (db.storeMetricsImports || []).filter((x) => x.userId === userId).slice(0, limit);
}
