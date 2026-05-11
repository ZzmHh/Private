/**
 * TikTok / 通用形状：Webhook 入站 → 生成买家话术 → 尝试出站（可 dry-run）
 */

import { generateBuyerReplyText } from "./generateBuyerReply.js";
import { findTikTokConnectionByShopCipher } from "./tiktokStoreLookup.js";
import { getStoreConnectionSecret } from "../db.js";
import { sendTiktokCustomerServiceText } from "../integrations/storeApi/tiktok/tiktokOutboundCs.js";

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

/**
 * 从 Partner / 邮件转发等渠道尝试解析字段（官方 payload 以控制台为准，可在此扩展分支）
 */
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

/**
 * @returns {Promise<{ ok: boolean, skipped?: string, replyText?: string, send?: object, error?: string, detail?: string }>}
 */
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

  const secret = getStoreConnectionSecret(connection.userId);
  if (!secret) {
    return { ok: false, error: "无法解密店铺凭据。" };
  }

  const gen = await generateBuyerReplyText({
    buyerText: inbound.buyerText,
    shopName: connection.storeName || "",
    platform: "TikTok Shop",
  });

  if (!gen.ok) {
    return { ok: false, error: gen.error };
  }

  let dryRun;
  if (force) {
    dryRun = options.simulateDryRun !== false;
  } else {
    dryRun =
      process.env.TIKTOK_CS_SEND_DRY_RUN === "1" ||
      String(process.env.TIKTOK_CS_SEND_DRY_RUN).toLowerCase() === "true";
  }
  if (dryRun) {
    return { ok: true, replyText: gen.text, send: { dryRun: true } };
  }

  if (!inbound.conversationId) {
    return { ok: true, replyText: gen.text, send: { skipped: true, reason: "无 conversation_id，仅生成话术。" } };
  }

  const send = await sendTiktokCustomerServiceText({
    conversationId: inbound.conversationId,
    text: gen.text,
    secret,
    parsed: found.parsed,
  });

  if (!send.ok) {
    return { ok: false, replyText: gen.text, error: send.error, detail: send.detail };
  }

  return { ok: true, replyText: gen.text, send: { ok: true } };
}
