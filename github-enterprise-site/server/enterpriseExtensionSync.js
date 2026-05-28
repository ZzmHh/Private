/**
 * 企业站浏览器插件快照 — 按 orgId + shopId 隔离（与凡梦 C 端 extensionSnapshots 分离）
 */
import crypto from "node:crypto";
import { readDb, writeDb } from "./repositories/index.js";

const MAX_SNAPSHOTS_PER_SHOP = 30;

/**
 * @param {{ orgId: string, shopId: string, platform?: string, pageType?: string, pageUrl?: string, title?: string, data: object, shopName?: string, syncedByUserId?: string }} param0
 */
export function saveEnterpriseExtensionSnapshot({
  orgId,
  shopId,
  platform = "tiktok",
  pageType = "unknown",
  pageUrl = "",
  title = "",
  data,
  shopName = "",
  syncedByUserId = "",
}) {
  const db = readDb();
  db.enterpriseExtensionSnapshots ||= [];

  const snapshot = {
    id: crypto.randomUUID(),
    orgId,
    shopId,
    platform: String(platform || "tiktok").toLowerCase(),
    pageType: String(pageType || "unknown"),
    pageUrl: String(pageUrl || "").slice(0, 2000),
    title: String(title || "").slice(0, 500),
    shopName: String(shopName || "").slice(0, 200),
    data: data && typeof data === "object" ? data : { raw: data },
    syncedByUserId: syncedByUserId || null,
    pulledAt: new Date().toISOString(),
  };

  db.enterpriseExtensionSnapshots.unshift(snapshot);
  const others = db.enterpriseExtensionSnapshots.filter((s) => !(s.orgId === orgId && s.shopId === shopId));
  const mine = db.enterpriseExtensionSnapshots
    .filter((s) => s.orgId === orgId && s.shopId === shopId)
    .slice(0, MAX_SNAPSHOTS_PER_SHOP);
  db.enterpriseExtensionSnapshots = [...mine, ...others].slice(0, 8000);
  writeDb(db);
  return snapshot;
}

/**
 * @param {string} orgId
 * @param {string} shopId
 * @param {string} [platform]
 * @param {number} [limit]
 */
export function listEnterpriseExtensionSnapshots(orgId, shopId, platform = "tiktok", limit = 40) {
  const db = readDb();
  const p = String(platform || "tiktok").toLowerCase();
  return (db.enterpriseExtensionSnapshots || [])
    .filter((s) => s.orgId === orgId && s.shopId === shopId && String(s.platform || "tiktok").toLowerCase() === p)
    .slice(0, limit);
}

/**
 * @param {string} orgId
 * @param {string} shopId
 * @param {string} [platform]
 * @param {number} [limit]
 */
export function getMergedEnterpriseExtensionContext(orgId, shopId, platform = "tiktok", limit = 5) {
  const list = listEnterpriseExtensionSnapshots(orgId, shopId, platform, limit);
  if (!list.length) return null;

  return {
    orgId,
    shopId,
    platform: String(platform || "tiktok").toLowerCase(),
    source: "enterprise-browser-extension",
    snapshotCount: list.length,
    latestAt: list[0].pulledAt,
    pages: list.map((s) => ({
      shopId: s.shopId,
      shopName: s.shopName,
      pageType: s.pageType,
      pageUrl: s.pageUrl,
      title: s.title,
      pulledAt: s.pulledAt,
      data: s.data,
    })),
  };
}
