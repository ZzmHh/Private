/**
 * TikTok / 通用形状：Webhook 入站 → 分层路由 → 条件自动发送
 */

import { findTikTokConnectionByShopCipher } from "./tiktokStoreLookup.js";
import { getStoreConnectionSecret } from "../db.js";
import { sendTiktokCustomerServiceText } from "../integrations/storeApi/tiktok/tiktokOutboundCs.js";
import { routeBuyerMessage, dispatchAutoSend } from "./routeBuyerMessage.js";
import { getCsSettings } from "./csStore.js";
import { recordCsRouteEvent } from "./csAnalytics.js";
import { getMergedExtensionContext } from "../extensionSync.js";

const processedMessageIds = new Map();
const DEDUPE_TTL_MS = 1000 * 60 * 30;

function pruneDedupe() {
  const now = Date.now();
  for (const [id, t] of processedMessageIds) {
    if (now - t > DEDUPE_TTL_MS) processedMessageIds.delete(id);
  }
}

function wasProcessed(messageId) {
  if (!messageId) return false;
  pruneDedupe();
  if (processedMessageIds.has(messageId)) return true;
  processedMessageIds.set(messageId, Date.now());
  return false;
}

export function extractTiktokInbound(payload) {
  const root = payload && typeof payload === "object" ? payload : {};
  const t = String(root.type || root.event_type || root.event || "").toUpperCase();
  const data = root.data ?? root.biz_data ?? root.content ?? root;

  const conversationId =
    data?.conversation_id ?? data?.conversationId ?? root.conversation_id ?? root.conversationId;
  const shopCipher = data?.shop_cipher ?? data?.shopCipher ?? root.shop_cipher;
  const messageId =
    data?.message_id ?? data?.messageId ?? data?.id ?? root.message_id ?? root.msg_id;
  let buyerText =
    data?.content ??
    data?.text ??
    data?.message?.content ??
    data?.message?.text ??
    root.content;

  if (typeof buyerText === "object" && buyerText?.text) {
    buyerText = buyerText.text;
  }

  return {
    type: t,
    conversationId: conversationId != null ? String(conversationId) : "",
    shopCipher: shopCipher != null ? String(shopCipher) : "",
    messageId: messageId != null ? String(messageId) : "",
    buyerText: buyerText != null ? String(buyerText) : "",
  };
}

export async function handleTiktokBuyerMessageWebhook(payload, options = {}) {
  const force = options.force === true;
  const inbound = extractTiktokInbound(payload);

  const typesAllow = (process.env.TIKTOK_WEBHOOK_EVENT_TYPES || "NEW_MESSAGE,MESSAGE,IM_MESSAGE,IM")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  if (inbound.type && !force && !typesAllow.some((x) => inbound.type.includes(x) || x === inbound.type)) {
    return { ok: true, skipped: `忽略事件类型：${inbound.type}` };
  }

  if (!inbound.buyerText?.trim()) {
    return { ok: true, skipped: "无买家文本，跳过。" };
  }

  if (!inbound.shopCipher) {
    return { ok: true, skipped: "payload 无 shop_cipher，无法匹配店铺。" };
  }

  const found = findTikTokConnectionByShopCipher(inbound.shopCipher);
  if (!found) {
    return { ok: true, skipped: "未找到与该 shop_cipher 绑定的凡梦店铺连接。" };
  }

  const { connection } = found;
  if (!connection.autoBuyerReply && !force) {
    return { ok: true, skipped: "卖家未开启「买家消息自动话术」。" };
  }

  if (!force && wasProcessed(inbound.messageId)) {
    return { ok: true, skipped: "重复消息，已处理过。" };
  }

  const secret = getStoreConnectionSecret(connection.userId, connection.platform);
  if (!secret) {
    return { ok: false, error: "无法解密店铺凭据。" };
  }

  const settings = getCsSettings(connection.userId);
  const shopKey = connection.storeName || "";
  const merged = getMergedExtensionContext(connection.userId, "tiktok", 12, shopKey || undefined);
  const routed = await routeBuyerMessage({
    buyerText: inbound.buyerText,
    userId: connection.userId,
    shopKey,
    shopName: connection.storeName || "",
    channel: "webhook",
    settings,
    orderContext: options.orderContext || "",
    mergedContext: merged,
  });

  recordCsRouteEvent({
    userId: connection.userId,
    shopKey: connection.storeName || "",
    channel: "webhook",
    tier: routed.tier,
    action: routed.action,
    lang: routed.lang,
    faqHit: routed.tier === "faq" && routed.faqMatch?.source === "user_template",
    buyerText: inbound.buyerText,
    replyText: routed.replyText,
    reason: routed.reason,
    faqName: routed.faqMatch?.name,
  });

  let dryRun;
  if (force) {
    dryRun = options.simulateDryRun !== false;
  } else {
    dryRun =
      process.env.TIKTOK_CS_SEND_DRY_RUN === "1" ||
      String(process.env.TIKTOK_CS_SEND_DRY_RUN).toLowerCase() === "true";
  }

  if (dryRun || routed.action !== "auto_send") {
    return {
      ok: routed.ok !== false,
      routed,
      replyText: routed.replyText,
      send: { dryRun: true, action: routed.action },
    };
  }

  if (!inbound.conversationId) {
    return {
      ok: true,
      routed,
      replyText: routed.replyText,
      send: { skipped: true, reason: "无 conversation_id，仅生成话术。" },
    };
  }

  const send = await sendTiktokCustomerServiceText({
    conversationId: inbound.conversationId,
    text: routed.replyText,
    secret,
    parsed: found.parsed,
  });

  if (!send.ok) {
    return { ok: false, routed, replyText: routed.replyText, error: send.error, detail: send.detail };
  }

  return { ok: true, routed, replyText: routed.replyText, send: { ok: true } };
}
