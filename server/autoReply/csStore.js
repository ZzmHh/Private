/**
 * 客服自动化 · FAQ / 设置 / 卖家待办 存储
 */
import crypto from "node:crypto";
import { readDb, writeDb } from "../repositories/index.js";
import { normalizeFaqLang } from "../../shared/tiktokShopLanguages.js";
import { defaultCsAutomationSettings, normalizeCsAutomationSettings } from "./csSettingsNormalize.js";

export { defaultCsAutomationSettings, normalizeCsAutomationSettings };

function ensureArrays(db) {
  if (!db.csFaqTemplates) db.csFaqTemplates = [];
  if (!db.csSellerAlerts) db.csSellerAlerts = [];
  if (!db.csAutomationSettings) db.csAutomationSettings = {};
}

export function getCsSettings(userId) {
  const db = readDb();
  ensureArrays(db);
  return normalizeCsAutomationSettings(db.csAutomationSettings[userId] || {});
}

export function saveCsSettings(userId, partial) {
  const db = readDb();
  ensureArrays(db);
  const merged = normalizeCsAutomationSettings({
    ...(db.csAutomationSettings[userId] || {}),
    ...partial,
  });
  db.csAutomationSettings[userId] = {
    ...merged,
    updatedAt: new Date().toISOString(),
  };
  writeDb(db);
  return db.csAutomationSettings[userId];
}

/** 路由匹配：含全店通用 + 指定店铺 */
export function listCsFaqTemplates(userId, shopKey = "") {
  const db = readDb();
  ensureArrays(db);
  const sk = String(shopKey || "");
  return db.csFaqTemplates.filter((t) => {
    if (t.userId !== userId) return false;
    if (!sk) return !(t.shopKey || "");
    return !t.shopKey || t.shopKey === sk;
  });
}

/** 网站编辑：仅当前店铺 scope（全店通用 shopKey="" 或指定店） */
export function listCsFaqTemplatesForEditor(userId, shopKey = "") {
  const db = readDb();
  ensureArrays(db);
  const sk = String(shopKey || "");
  return db.csFaqTemplates.filter((t) => t.userId === userId && (t.shopKey || "") === sk);
}

function normalizeFaqRow(userId, shopKey, t) {
  return {
    id: t.id || crypto.randomUUID(),
    userId,
    shopKey: String(shopKey || ""),
    name: String(t.name || "模板").slice(0, 80),
    text: String(t.text || "").slice(0, 4000),
    triggers: Array.isArray(t.triggers)
      ? t.triggers.slice(0, 20)
      : String(t.triggers || "")
          .split(/[,，|/;；]+/)
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 20),
    category: String(t.category || "").slice(0, 40),
    lang: normalizeFaqLang(t.lang),
    updatedAt: new Date().toISOString(),
  };
}

export function upsertCsFaqTemplate(userId, shopKey, template) {
  const db = readDb();
  ensureArrays(db);
  const sk = String(shopKey || "");
  const row = normalizeFaqRow(userId, sk, template);
  const idx = db.csFaqTemplates.findIndex((t) => t.id === row.id && t.userId === userId);
  if (idx >= 0) {
    db.csFaqTemplates[idx] = { ...db.csFaqTemplates[idx], ...row };
  } else {
    db.csFaqTemplates.unshift(row);
  }
  db.csFaqTemplates = db.csFaqTemplates.slice(0, 2000);
  writeDb(db);
  return row;
}

export function deleteCsFaqTemplate(userId, templateId) {
  const db = readDb();
  ensureArrays(db);
  const before = db.csFaqTemplates.length;
  db.csFaqTemplates = db.csFaqTemplates.filter((t) => !(t.id === templateId && t.userId === userId));
  if (before === db.csFaqTemplates.length) return false;
  writeDb(db);
  return true;
}

export function importCsFaqTemplates(userId, shopKey, templates, { mode = "merge" } = {}) {
  const sk = String(shopKey || "");
  const rows = (templates || []).slice(0, 500).map((t) => normalizeFaqRow(userId, sk, t));

  if (mode === "replace") {
    return syncCsFaqTemplates(userId, sk, rows);
  }

  const existing = listCsFaqTemplates(userId, sk);
  const byId = new Map(existing.map((t) => [t.id, t]));
  const byName = new Map(existing.map((t) => [t.name.toLowerCase(), t]));

  for (const row of rows) {
    const hit = (row.id && byId.get(row.id)) || byName.get(row.name.toLowerCase());
    if (hit) {
      byId.set(hit.id, { ...hit, ...row, id: hit.id });
    } else {
      byId.set(row.id, row);
    }
  }

  return syncCsFaqTemplates(userId, sk, [...byId.values()]);
}

export function syncCsFaqTemplates(userId, shopKey, templates) {
  const db = readDb();
  ensureArrays(db);
  const sk = String(shopKey || "");
  const others = db.csFaqTemplates.filter((t) => !(t.userId === userId && (t.shopKey || "") === sk));
  const rows = (templates || []).slice(0, 500).map((t) => normalizeFaqRow(userId, sk, t));
  db.csFaqTemplates = [...rows, ...others].slice(0, 2000);
  writeDb(db);
  return rows;
}

export function createCsSellerAlert({ userId, shopKey, shopName, buyerText, intent, replyPreview, channel }) {
  const db = readDb();
  ensureArrays(db);
  const alert = {
    id: crypto.randomUUID(),
    userId,
    shopKey: String(shopKey || ""),
    shopName: String(shopName || "").slice(0, 120),
    buyerText: String(buyerText || "").slice(0, 800),
    intent,
    replyPreview: String(replyPreview || "").slice(0, 400),
    channel: channel || "unknown",
    read: false,
    createdAt: new Date().toISOString(),
  };
  db.csSellerAlerts.unshift(alert);
  db.csSellerAlerts = db.csSellerAlerts.filter((a) => a.userId === userId).slice(0, 100)
    .concat(db.csSellerAlerts.filter((a) => a.userId !== userId));
  writeDb(db);
  return alert;
}

export function listCsSellerAlerts(userId, { unreadOnly = false, limit = 20 } = {}) {
  const db = readDb();
  ensureArrays(db);
  let list = db.csSellerAlerts.filter((a) => a.userId === userId);
  if (unreadOnly) list = list.filter((a) => !a.read);
  return list.slice(0, limit);
}

export function markCsAlertRead(userId, alertId) {
  const db = readDb();
  ensureArrays(db);
  const a = db.csSellerAlerts.find((x) => x.id === alertId && x.userId === userId);
  if (a) {
    a.read = true;
    a.readAt = new Date().toISOString();
    writeDb(db);
  }
  return a;
}
