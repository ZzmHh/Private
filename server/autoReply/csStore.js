/**
 * 客服自动化 · FAQ / 设置 / 卖家待办 存储
 */
import crypto from "node:crypto";
import { readDb, writeDb } from "../repositories/jsonRepository.js";

export function defaultCsAutomationSettings() {
  return {
    restStartHour: 23,
    restEndHour: 9,
    nightAiEnabled: true,
    extensionAutoSendFaq: true,
    extensionAutoSendAfterSales: true,
    extensionAutoClickSend: true,
    afterSalesTemplateZh:
      "您好，已收到您关于订单/售后的问题，我们非常重视。人工同事将在 {sla} 为您处理，请保留订单号与问题描述，感谢耐心等候。",
    afterSalesTemplateEn:
      "Thank you for your message regarding your order. Our team has received your request and will follow up {sla}. Please keep your order details handy. We appreciate your patience.",
    greetingTemplateZh: "您好！感谢联系本店，请问有什么可以帮您？",
    greetingTemplateEn: "Hello! Thanks for reaching out. How can we help you today?",
    nightSlaZh: "9 小时内（北京时间下一工作时段）",
    nightSlaEn: "within 9 hours (next business window, Beijing time)",
    daySlaZh: "2 小时内",
    daySlaEn: "within 2 hours",
  };
}

function ensureArrays(db) {
  if (!db.csFaqTemplates) db.csFaqTemplates = [];
  if (!db.csSellerAlerts) db.csSellerAlerts = [];
  if (!db.csAutomationSettings) db.csAutomationSettings = {};
}

export function getCsSettings(userId) {
  const db = readDb();
  ensureArrays(db);
  return { ...defaultCsAutomationSettings(), ...(db.csAutomationSettings[userId] || {}) };
}

export function saveCsSettings(userId, partial) {
  const db = readDb();
  ensureArrays(db);
  db.csAutomationSettings[userId] = {
    ...getCsSettings(userId),
    ...partial,
    updatedAt: new Date().toISOString(),
  };
  writeDb(db);
  return db.csAutomationSettings[userId];
}

export function listCsFaqTemplates(userId, shopKey = "") {
  const db = readDb();
  ensureArrays(db);
  const sk = String(shopKey || "");
  return db.csFaqTemplates.filter((t) => {
    if (t.userId !== userId) return false;
    if (!sk) return true;
    return !t.shopKey || t.shopKey === sk;
  });
}

export function syncCsFaqTemplates(userId, shopKey, templates) {
  const db = readDb();
  ensureArrays(db);
  const sk = String(shopKey || "");
  const others = db.csFaqTemplates.filter((t) => !(t.userId === userId && (t.shopKey || "") === sk));
  const rows = (templates || []).slice(0, 50).map((t) => ({
    id: t.id || crypto.randomUUID(),
    userId,
    shopKey: sk,
    name: String(t.name || "模板").slice(0, 80),
    text: String(t.text || "").slice(0, 4000),
    triggers: Array.isArray(t.triggers) ? t.triggers.slice(0, 20) : [],
    category: String(t.category || "").slice(0, 40),
    lang: t.lang === "zh" ? "zh" : "en",
    updatedAt: new Date().toISOString(),
  }));
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
    writeDb(db);
  }
  return a;
}
