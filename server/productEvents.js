/**
 * 产品转化事件（漏斗 / 运营看板）
 */
import crypto from "node:crypto";
import { readDb, writeDb } from "./repositories/index.js";

/** @typedef {{ id: string, event: string, sessionId: string, userId: string|null, path: string, properties: object, createdAt: string }} ProductEvent */

export const PRODUCT_EVENT_NAMES = [
  "page_view",
  "cta_register_click",
  "register_start",
  "register_complete",
  "login_success",
  "subscription_view",
  "order_create",
  "order_claim_paid",
  "extension_install_click",
  "first_agent_run",
  "agent_run",
  "viral_roast_complete",
  "viral_roast_start",
  "viral_report_view",
  "viral_report_publish",
  "viral_ref_register",
];

const FUNNEL_STEPS = [
  { event: "page_view", label: "页面访问" },
  { event: "register_start", label: "开始注册" },
  { event: "register_complete", label: "注册完成" },
  { event: "login_success", label: "登录成功" },
  { event: "subscription_view", label: "打开订阅页" },
  { event: "order_create", label: "创建订单" },
  { event: "order_claim_paid", label: "提交付款" },
  { event: "extension_install_click", label: "插件安装点击" },
  { event: "first_agent_run", label: "首次 Agent" },
];

/**
 * @param {{ event: string, sessionId?: string, userId?: string|null, path?: string, properties?: object }} input
 */
export function recordProductEvent(input) {
  const event = String(input.event || "").trim();
  if (!event) return null;

  const db = readDb();
  db.productEvents ||= [];

  /** @type {ProductEvent} */
  const row = {
    id: crypto.randomUUID(),
    event,
    sessionId: String(input.sessionId || "anonymous").slice(0, 64),
    userId: input.userId ? String(input.userId) : null,
    path: String(input.path || "").slice(0, 500),
    properties: input.properties && typeof input.properties === "object" ? input.properties : {},
    createdAt: new Date().toISOString(),
  };

  db.productEvents.unshift(row);
  if (db.productEvents.length > 50000) {
    db.productEvents = db.productEvents.slice(0, 50000);
  }
  writeDb(db);
  return row;
}

function countUniqueSessions(events, eventName) {
  const set = new Set();
  for (const e of events) {
    if (e.event === eventName && e.sessionId) set.add(e.sessionId);
  }
  return set.size;
}

function eventsInRange(events, days = 7) {
  const since = Date.now() - days * 24 * 60 * 60 * 1000;
  return events.filter((e) => new Date(e.createdAt).getTime() >= since);
}

export function getProductAnalytics({ days = 7 } = {}) {
  const db = readDb();
  const all = Array.isArray(db.productEvents) ? db.productEvents : [];
  const recent = eventsInRange(all, days);
  const today = new Date().toISOString().slice(0, 10);
  const todayEvents = all.filter((e) => e.createdAt?.startsWith(today));

  const baseCount = countUniqueSessions(recent, "page_view") || recent.length || 1;

  const funnel = FUNNEL_STEPS.map((step) => {
    const count = countUniqueSessions(recent, step.event);
    return {
      ...step,
      count,
      rate: Math.round((count / baseCount) * 1000) / 10,
    };
  });

  /** @type {Record<string, number>} */
  const dailyMap = {};
  for (const e of recent) {
    const d = e.createdAt?.slice(0, 10);
    if (!d) continue;
    dailyMap[d] = (dailyMap[d] || 0) + 1;
  }
  const daily = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, total]) => ({ date, total }));

  /** @type {Record<string, number>} */
  const pageMap = {};
  for (const e of recent.filter((x) => x.event === "page_view")) {
    const p = e.path || "/";
    pageMap[p] = (pageMap[p] || 0) + 1;
  }
  const topPages = Object.entries(pageMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([path, views]) => ({ path, views }));

  const registrationsToday = todayEvents.filter((e) => e.event === "register_complete").length;
  const ordersToday = todayEvents.filter((e) => e.event === "order_create").length;
  const extensionClicksToday = todayEvents.filter((e) => e.event === "extension_install_click").length;

  return {
    days,
    funnel,
    daily,
    topPages,
    highlights: {
      eventsToday: todayEvents.length,
      registrationsToday,
      ordersToday,
      extensionClicksToday,
      uniqueSessions7d: countUniqueSessions(recent, "page_view"),
    },
    recentEvents: recent.slice(0, 40),
  };
}

/**
 * 用户首次 Agent 调用时记 first_agent_run
 * @param {string} userId
 */
export function maybeRecordFirstAgentRun(userId) {
  const db = readDb();
  const exists = (db.productEvents || []).some((e) => e.userId === userId && e.event === "first_agent_run");
  if (exists) return;
  recordProductEvent({ event: "first_agent_run", userId, sessionId: `user:${userId}`, path: "/workspace" });
}
