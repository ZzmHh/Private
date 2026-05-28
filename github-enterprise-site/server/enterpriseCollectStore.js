/**
 * 企业采集箱 + 发布任务（org 级采集箱，发布任务带 shopId）
 */
import crypto from "node:crypto";
import { readDb, writeDb } from "./repositories/index.js";

const MAX_COLLECT_PER_ORG = 500;
const MAX_JOBS_PER_ORG = 1000;

/** @param {import("./enterpriseAuth.js").EnterpriseUser} user */
export function orgIdFromUser(user) {
  return user.orgId || process.env.ENTERPRISE_ORG_ID || "org_default";
}

/**
 * @param {string} orgId
 * @param {{ status?: string, sourcePlatform?: string, limit?: number }} [opts]
 */
export function listCollectItems(orgId, opts = {}) {
  const db = readDb();
  const limit = Math.min(Number(opts.limit) || 100, 200);
  let items = (db.enterpriseCollectItems || []).filter((i) => i.orgId === orgId);
  if (opts.status) items = items.filter((i) => i.status === opts.status);
  if (opts.sourcePlatform) items = items.filter((i) => i.sourcePlatform === opts.sourcePlatform);
  return items.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))).slice(0, limit);
}

/**
 * @param {string} orgId
 * @param {string} id
 */
export function getCollectItem(orgId, id) {
  return (readDb().enterpriseCollectItems || []).find((i) => i.orgId === orgId && i.id === id) || null;
}

/**
 * @param {string} orgId
 * @param {object} payload
 * @param {string} [userId]
 */
export function createCollectItem(orgId, payload, userId = "") {
  const db = readDb();
  db.enterpriseCollectItems ||= [];
  const now = new Date().toISOString();
  const item = {
    id: crypto.randomUUID(),
    orgId,
    sourcePlatform: String(payload.sourcePlatform || "1688").toLowerCase(),
    sourceUrl: String(payload.sourceUrl || "").slice(0, 2000),
    title: String(payload.title || "未命名商品").slice(0, 500),
    priceCny: payload.priceCny != null ? Number(payload.priceCny) : null,
    moq: payload.moq != null ? Number(payload.moq) : null,
    shipFrom: String(payload.shipFrom || "").slice(0, 200),
    images: Array.isArray(payload.images) ? payload.images.map(String).slice(0, 20) : [],
    raw: payload.raw && typeof payload.raw === "object" ? payload.raw : {},
    status: "collected",
    listing: null,
    opportunityNotes: String(payload.opportunityNotes || payload.notes || "").slice(0, 4000),
    market: String(payload.market || "").slice(0, 16),
    targetPlatform: String(payload.targetPlatform || "tiktok").slice(0, 32),
    createdByUserId: userId || null,
    createdAt: now,
    updatedAt: now,
  };
  db.enterpriseCollectItems.unshift(item);
  const mine = db.enterpriseCollectItems.filter((i) => i.orgId === orgId).slice(0, MAX_COLLECT_PER_ORG);
  const others = db.enterpriseCollectItems.filter((i) => i.orgId !== orgId);
  db.enterpriseCollectItems = [...mine, ...others];
  writeDb(db);
  return item;
}

/**
 * @param {string} orgId
 * @param {string} id
 * @param {object} patch
 */
export function updateCollectItem(orgId, id, patch) {
  const db = readDb();
  db.enterpriseCollectItems ||= [];
  const idx = db.enterpriseCollectItems.findIndex((i) => i.orgId === orgId && i.id === id);
  if (idx < 0) return null;
  const prev = db.enterpriseCollectItems[idx];
  const next = {
    ...prev,
    ...patch,
    id: prev.id,
    orgId: prev.orgId,
    updatedAt: new Date().toISOString(),
  };
  if (patch.listing !== undefined) {
    next.listing = patch.listing && typeof patch.listing === "object" ? patch.listing : prev.listing;
  }
  db.enterpriseCollectItems[idx] = next;
  writeDb(db);
  return next;
}

/**
 * @param {string} orgId
 * @param {string} id
 */
export function deleteCollectItem(orgId, id) {
  const db = readDb();
  const before = (db.enterpriseCollectItems || []).length;
  db.enterpriseCollectItems = (db.enterpriseCollectItems || []).filter(
    (i) => !(i.orgId === orgId && i.id === id),
  );
  if (db.enterpriseCollectItems.length === before) return false;
  writeDb(db);
  return true;
}

/**
 * @param {string} orgId
 * @param {string} [shopId]
 * @param {{ status?: string, limit?: number }} [opts]
 */
export function listPublishJobs(orgId, shopId = "", opts = {}) {
  const limit = Math.min(Number(opts.limit) || 50, 100);
  let jobs = (readDb().enterprisePublishJobs || []).filter((j) => j.orgId === orgId);
  if (shopId) jobs = jobs.filter((j) => j.shopId === shopId);
  if (opts.status) jobs = jobs.filter((j) => j.status === opts.status);
  return jobs.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))).slice(0, limit);
}

/**
 * @param {string} orgId
 * @param {string} id
 */
export function getPublishJob(orgId, id) {
  return (readDb().enterprisePublishJobs || []).find((j) => j.orgId === orgId && j.id === id) || null;
}

/**
 * @param {string} orgId
 * @param {string} shopId
 * @param {object} payload
 * @param {string} [userId]
 */
export function createPublishJob(orgId, shopId, payload, userId = "") {
  const db = readDb();
  db.enterprisePublishJobs ||= [];
  const now = new Date().toISOString();
  const listing = payload.listing && typeof payload.listing === "object" ? payload.listing : {};
  const job = {
    id: crypto.randomUUID(),
    orgId,
    shopId,
    collectItemId: payload.collectItemId || null,
    title: String(payload.title || listing.title || "未命名").slice(0, 500),
    salePrice: payload.salePrice != null ? String(payload.salePrice) : "",
    stock: payload.stock != null ? String(payload.stock) : "99",
    fulfillment: String(payload.fulfillment || "1688_dropship"),
    currency: String(payload.currency || "THB").slice(0, 8),
    listing,
    sourceUrl: String(payload.sourceUrl || "").slice(0, 2000),
    sourcePriceCny: payload.sourcePriceCny != null ? Number(payload.sourcePriceCny) : null,
    status: "ready",
    platformProductId: null,
    fillPack: buildFillPack(payload),
    error: null,
    createdByUserId: userId || null,
    createdAt: now,
    updatedAt: now,
  };
  db.enterprisePublishJobs.unshift(job);
  const mine = db.enterprisePublishJobs.filter((j) => j.orgId === orgId).slice(0, MAX_JOBS_PER_ORG);
  const others = db.enterprisePublishJobs.filter((j) => j.orgId !== orgId);
  db.enterprisePublishJobs = [...mine, ...others];
  writeDb(db);
  return job;
}

/** @param {object} payload */
function buildFillPack(payload) {
  const listing = payload.listing && typeof payload.listing === "object" ? payload.listing : {};
  const bullets = Array.isArray(listing.bullets) ? listing.bullets : [];
  return {
    title: String(listing.title || payload.title || ""),
    description: String(listing.description || bullets.join("\n") || ""),
    bullets,
    salePrice: payload.salePrice != null ? String(payload.salePrice) : "",
    stock: payload.stock != null ? String(payload.stock) : "99",
    keywords: String(listing.keywords || ""),
    sourceUrl: String(payload.sourceUrl || ""),
  };
}

/**
 * @param {string} orgId
 * @param {string} id
 * @param {object} patch
 */
export function updatePublishJob(orgId, id, patch) {
  const db = readDb();
  db.enterprisePublishJobs ||= [];
  const idx = db.enterprisePublishJobs.findIndex((j) => j.orgId === orgId && j.id === id);
  if (idx < 0) return null;
  const prev = db.enterprisePublishJobs[idx];
  const next = {
    ...prev,
    ...patch,
    id: prev.id,
    orgId: prev.orgId,
    updatedAt: new Date().toISOString(),
  };
  if (patch.listing !== undefined) {
    next.listing = patch.listing && typeof patch.listing === "object" ? patch.listing : prev.listing;
    next.fillPack = buildFillPack({ ...next, listing: next.listing });
  }
  db.enterprisePublishJobs[idx] = next;
  writeDb(db);
  return next;
}
