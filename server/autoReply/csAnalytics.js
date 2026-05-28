import crypto from "node:crypto";
import { readDb, writeDb } from "../repositories/index.js";

const MAX_EVENTS_PER_USER = 2000;
const MAX_EVENTS_TOTAL = 15000;

function ensureEvents(db) {
  if (!Array.isArray(db.csRouteEvents)) db.csRouteEvents = [];
}

/**
 * @param {{
 *   userId: string,
 *   shopKey?: string,
 *   channel?: string,
 *   tier: string,
 *   action: string,
 *   lang?: string,
 *   faqHit?: boolean,
 *   autoSend?: boolean,
 *   dryRun?: boolean,
 *   logSession?: boolean,
 *   buyerText?: string,
 *   replyText?: string,
 *   reason?: string,
 *   faqName?: string,
 * }} row
 */
export function recordCsRouteEvent(row) {
  if (!row?.userId) return null;
  if (row.dryRun && !row.logSession) return null;
  const db = readDb();
  ensureEvents(db);
  const event = {
    id: crypto.randomUUID(),
    userId: row.userId,
    shopKey: String(row.shopKey || "").slice(0, 200),
    channel: row.channel || "extension",
    tier: String(row.tier || "unknown"),
    action: String(row.action || "draft"),
    lang: String(row.lang || "").slice(0, 12),
    faqHit: Boolean(row.faqHit),
    autoSend: row.action === "auto_send",
    dryRun: Boolean(row.dryRun),
    buyerText: row.buyerText ? String(row.buyerText).slice(0, 800) : "",
    replyText: row.replyText ? String(row.replyText).slice(0, 1200) : "",
    reason: row.reason ? String(row.reason).slice(0, 400) : "",
    faqName: row.faqName ? String(row.faqName).slice(0, 120) : "",
    createdAt: new Date().toISOString(),
  };
  db.csRouteEvents.unshift(event);
  const byUser = db.csRouteEvents.filter((e) => e.userId === row.userId).slice(0, MAX_EVENTS_PER_USER);
  const others = db.csRouteEvents.filter((e) => e.userId !== row.userId);
  db.csRouteEvents = [...byUser, ...others].slice(0, MAX_EVENTS_TOTAL);
  writeDb(db);
  return event;
}

function inWindow(iso, days) {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return t >= Date.now() - days * 86_400_000;
}

function avgMs(values) {
  if (!values.length) return null;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

function pct(num, den) {
  if (!den) return 0;
  return Math.round((num / den) * 1000) / 10;
}

/**
 * @param {string} userId
 * @param {{ days?: number }} [opts]
 */
export function getCsAnalyticsSummary(userId, { days = 30 } = {}) {
  const db = readDb();
  ensureEvents(db);
  const events = db.csRouteEvents.filter((e) => e.userId === userId && inWindow(e.createdAt, days));
  const alerts = (db.csSellerAlerts || []).filter((a) => a.userId === userId);

  const total = events.length;
  const faqHits = events.filter((e) => e.tier === "faq" && e.faqHit).length;
  const faqTier = events.filter((e) => e.tier === "faq").length;
  const autoSend = events.filter((e) => e.autoSend).length;
  const aftersales = events.filter((e) => e.tier === "aftersales").length;
  const nightAi = events.filter((e) => e.tier === "night_ai").length;

  const readAlerts = alerts.filter((a) => a.read && a.readAt && a.createdAt);
  const handleMs = readAlerts
    .map((a) => new Date(a.readAt).getTime() - new Date(a.createdAt).getTime())
    .filter((ms) => ms >= 0 && ms < 30 * 86_400_000);

  const unreadAlerts = alerts.filter((a) => !a.read).length;

  const byDayMap = new Map();
  for (const e of events) {
    const day = e.createdAt.slice(0, 10);
    const cur = byDayMap.get(day) || { date: day, total: 0, faq: 0, autoSend: 0 };
    cur.total += 1;
    if (e.tier === "faq") cur.faq += 1;
    if (e.autoSend) cur.autoSend += 1;
    byDayMap.set(day, cur);
  }
  const byDay = [...byDayMap.values()].sort((a, b) => a.date.localeCompare(b.date)).slice(-14);

  const byLangMap = new Map();
  for (const e of events) {
    const lang = e.lang || "unknown";
    byLangMap.set(lang, (byLangMap.get(lang) || 0) + 1);
  }
  const byLang = [...byLangMap.entries()]
    .map(([lang, count]) => ({ lang, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return {
    windowDays: days,
    totalRoutes: total,
    faqHitRate: pct(faqHits, total),
    faqTierRate: pct(faqTier, total),
    autoSendRate: pct(autoSend, total),
    aftersalesRate: pct(aftersales, total),
    nightAiRate: pct(nightAi, total),
    alertTotal: alerts.length,
    alertUnread: unreadAlerts,
    alertAvgHandleMinutes: handleMs.length ? Math.round(avgMs(handleMs) / 60_000) : null,
    alertMedianHandleMinutes: handleMs.length
      ? Math.round(
          [...handleMs].sort((a, b) => a - b)[Math.floor(handleMs.length / 2)] / 60_000,
        )
      : null,
    byDay,
    byLang,
  };
}

/**
 * 会话流水：买家消息 + AI 路由与回复（供企业站可视化）
 * @param {string} userId
 * @param {{ limit?: number, shopKey?: string, includeDrill?: boolean }} [opts]
 */
export function listCsSessionEvents(userId, { limit = 50, shopKey, includeDrill = true } = {}) {
  const db = readDb();
  ensureEvents(db);
  let events = db.csRouteEvents.filter((e) => e.userId === userId);
  if (!includeDrill) {
    events = events.filter((e) => !e.dryRun);
  }
  if (shopKey) {
    events = events.filter((e) => (e.shopKey || "") === shopKey);
  }
  return events.slice(0, Math.min(limit, 100));
}
