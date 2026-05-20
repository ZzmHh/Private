/**
 * 浏览器插件同步的店铺页面快照（不依赖 TikTok Open API）
 */
import crypto from "node:crypto";
import { readDb, writeDb } from "./repositories/jsonRepository.js";

const MAX_SNAPSHOTS_PER_USER = 20;

/**
 * @param {{ userId: string, platform?: string, pageType?: string, pageUrl?: string, title?: string, data: object }} param0
 */
export function saveExtensionSnapshot({ userId, platform = "tiktok", pageType = "unknown", pageUrl = "", title = "", data }) {
  const db = readDb();
  if (!Array.isArray(db.extensionSnapshots)) {
    db.extensionSnapshots = [];
  }

  const snapshot = {
    id: crypto.randomUUID(),
    userId,
    platform: String(platform || "tiktok").toLowerCase(),
    pageType: String(pageType || "unknown"),
    pageUrl: String(pageUrl || "").slice(0, 2000),
    title: String(title || "").slice(0, 500),
    data: data && typeof data === "object" ? data : { raw: data },
    pulledAt: new Date().toISOString(),
  };

  db.extensionSnapshots.unshift(snapshot);
  const others = db.extensionSnapshots.filter((s) => s.userId !== userId);
  const mine = db.extensionSnapshots.filter((s) => s.userId === userId).slice(0, MAX_SNAPSHOTS_PER_USER);
  db.extensionSnapshots = [...mine, ...others].slice(0, 5000);

  writeDb(db);
  return snapshot;
}

/**
 * @param {string} userId
 * @param {string} [platform]
 */
export function getLatestExtensionSnapshot(userId, platform = "tiktok") {
  const db = readDb();
  const p = String(platform || "tiktok").toLowerCase();
  const list = (db.extensionSnapshots || []).filter(
    (s) => s.userId === userId && String(s.platform || "tiktok").toLowerCase() === p,
  );
  return list[0] || null;
}

/**
 * 合并多条页面快照供 Agent 使用
 * @param {string} userId
 * @param {string} [platform]
 * @param {number} [limit]
 */
export function getMergedExtensionContext(userId, platform = "tiktok", limit = 5) {
  const db = readDb();
  const p = String(platform || "tiktok").toLowerCase();
  const list = (db.extensionSnapshots || [])
    .filter((s) => s.userId === userId && String(s.platform || "tiktok").toLowerCase() === p)
    .slice(0, limit);

  if (!list.length) return null;

  return {
    platform: p,
    source: "browser-extension",
    snapshotCount: list.length,
    latestAt: list[0].pulledAt,
    pages: list.map((s) => ({
      pageType: s.pageType,
      pageUrl: s.pageUrl,
      title: s.title,
      pulledAt: s.pulledAt,
      data: s.data,
    })),
  };
}

export function listExtensionSnapshots(userId, platform = "tiktok", limit = 10) {
  const db = readDb();
  const p = String(platform || "tiktok").toLowerCase();
  return (db.extensionSnapshots || [])
    .filter((s) => s.userId === userId && String(s.platform || "tiktok").toLowerCase() === p)
    .slice(0, limit);
}
