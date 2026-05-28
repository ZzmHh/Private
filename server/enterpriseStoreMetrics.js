/**
 * 企业站 · 经营 CSV 导入（按 org+shop scopeKey 隔离，与凡梦 storeMetricsImports 分离）
 */
import crypto from "node:crypto";
import { readDb, writeDb } from "./repositories/index.js";

const MAX_IMPORTS_PER_SCOPE = 20;

export function saveEnterpriseStoreMetricsImport({ scopeKey, orgId, shopId, label, parsed, analysis, warnings = [] }) {
  const db = readDb();
  db.enterpriseStoreMetricsImports ||= [];

  const record = {
    id: crypto.randomUUID(),
    scopeKey,
    orgId,
    shopId,
    label: String(label || "经营数据导入").slice(0, 200),
    platform: parsed.shopRows?.[0]?.platform || parsed.skuRows?.[0]?.platform || "multi",
    shopRows: parsed.shopRows || [],
    skuRows: parsed.skuRows || [],
    analysis,
    warnings,
    importedAt: new Date().toISOString(),
  };

  db.enterpriseStoreMetricsImports.unshift(record);
  const others = db.enterpriseStoreMetricsImports.filter((x) => x.scopeKey !== scopeKey);
  const mine = db.enterpriseStoreMetricsImports.filter((x) => x.scopeKey === scopeKey).slice(0, MAX_IMPORTS_PER_SCOPE);
  db.enterpriseStoreMetricsImports = [...mine, ...others].slice(0, 5000);
  writeDb(db);
  return record;
}

export function getLatestEnterpriseStoreMetricsImport(scopeKey) {
  const db = readDb();
  return (db.enterpriseStoreMetricsImports || []).find((x) => x.scopeKey === scopeKey) || null;
}

export function getEnterpriseStoreMetricsAgentContext(scopeKey, platform) {
  const latest = getLatestEnterpriseStoreMetricsImport(scopeKey);
  if (!latest) return null;

  const p = platform ? String(platform).toLowerCase() : null;
  if (p && p !== "auto" && p !== "multi") {
    const rowPlat = String(latest.platform || "").toLowerCase();
    if (rowPlat && rowPlat !== "multi" && rowPlat !== p) return null;
  }

  return {
    source: "enterprise-csv-import",
    importedAt: latest.importedAt,
    label: latest.label,
    platform: latest.platform,
    analysis: latest.analysis,
    shopRows: latest.shopRows,
    skuRows: latest.skuRows.slice(0, 30),
    warnings: latest.warnings,
  };
}
