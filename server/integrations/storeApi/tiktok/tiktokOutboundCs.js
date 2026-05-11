/**
 * TikTok Shop — 客服会话「出站」发消息（ Partner 文档路径随版本/区域可能不同，用环境变量配置）
 *
 * 需在 Partner Center 开通客服消息相关权限，并将 Partner 文档中的 path 配置到：
 *   TIKTOK_SHOP_CS_SEND_PATH_TEMPLATE
 * 默认占位：/customer_service/{version}/conversations/{conversation_id}/messages
 *
 * 请求体默认为 { "content": "<纯文本>" }，若与文档不符可扩展为 TIKTOK_SHOP_CS_BODY_IS_RAW=1 并改用 JSON 模板（后续迭代）。
 */

import { signTiktokShopRequest } from "./tiktokSignature.js";

const DEFAULT_VERSION = process.env.TIKTOK_SHOP_API_VERSION?.trim() || "202309";
const DEFAULT_BASE = process.env.TIKTOK_SHOP_BASE_URL?.trim() || "https://open-api.tiktokglobalshop.com";

function resolveBase(secret) {
  const raw = String(secret?.apiEndpoint || "").trim();
  if (raw.startsWith("http")) return raw.replace(/\/+$/, "");
  return DEFAULT_BASE;
}

/**
 * @param {object} opts
 * @param {string} opts.conversationId
 * @param {string} opts.text
 * @param {object} opts.secret
 * @param {object} [opts.parsed] parseTikTokShopCredentials 结果
 */
export async function sendTiktokCustomerServiceText(opts) {
  const { conversationId, text, secret, parsed: parsedIn } = opts;
  const cid = String(conversationId || "").trim();
  if (!cid) {
    return { ok: false, error: "缺少 conversation_id。" };
  }

  const pathTemplate =
    process.env.TIKTOK_SHOP_CS_SEND_PATH_TEMPLATE?.trim() ||
    "/customer_service/{version}/conversations/{conversation_id}/messages";

  const version = DEFAULT_VERSION;
  const path = pathTemplate
    .replace(/\{version\}/g, version)
    .replace(/\{conversation_id\}/g, cid);

  const parsed = parsedIn || null;
  const accessToken = parsed?.accessToken || "";
  const shopCipher = parsed?.shopCipher || "";
  const shopId = parsed?.shopId ?? "";
  const appKey = parsed?.appKey || process.env.TIKTOK_SHOP_APP_KEY?.trim() || "";
  const appSecret = parsed?.appSecret || process.env.TIKTOK_SHOP_APP_SECRET?.trim() || "";

  if (!accessToken || !shopCipher || !appKey || !appSecret) {
    return { ok: false, error: "出站缺少 access_token / shop_cipher / app_key / app_secret。" };
  }

  const body = { content: String(text || "").slice(0, 2000) };

  const signParams = {
    access_token: accessToken,
    app_key: appKey,
    shop_cipher: shopCipher,
    shop_id: shopId === undefined || shopId === null ? "" : String(shopId),
    version,
  };

  const { sign, timestamp } = signTiktokShopRequest(signParams, path, appSecret, body);

  const qs = new URLSearchParams({
    access_token: accessToken,
    app_key: appKey,
    shop_cipher: shopCipher,
    shop_id: signParams.shop_id,
    version,
    timestamp,
    sign,
  });

  const base = resolveBase(secret);
  const url = `${base}${path}?${qs.toString()}`;

  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tts-access-token": accessToken,
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    return { ok: false, error: `请求失败：${e?.message || String(e)}` };
  }

  const rawText = await res.text();
  let json;
  try {
    json = rawText ? JSON.parse(rawText) : {};
  } catch {
    return { ok: false, error: `HTTP ${res.status} 非 JSON`, detail: rawText.slice(0, 400) };
  }

  const code = json?.code;
  if (code !== undefined && code !== 0 && code !== "0") {
    return {
      ok: false,
      error: json?.message || `TikTok 错误码 ${code}`,
      detail: JSON.stringify(json).slice(0, 600),
    };
  }

  if (!res.ok) {
    return { ok: false, error: `HTTP ${res.status}`, detail: JSON.stringify(json).slice(0, 600) };
  }

  return { ok: true, data: json };
}
