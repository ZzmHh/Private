/**
 * TikTok Shop Partner OAuth（授权码换票 + 拉取授权店铺 cipher）
 *
 * 文档参考：
 * - https://github.com/SocialiteProviders/TikTokShop/blob/master/Provider.php
 * - Partner 文档（授权/换票参数以控制台应用配置为准）
 *
 * 环境变量：
 * - TIKTOK_SHOP_APP_KEY / TIKTOK_SHOP_APP_SECRET（必填）
 * - TIKTOK_SHOP_OAUTH_REDIRECT_URI — 必须与 Partner Center 登记的回调完全一致
 * - TIKTOK_SHOP_OAUTH_FLOW — authv2 | open（默认 authv2）
 * - TIKTOK_SHOP_SERVICE_ID — open 流用的 service_id，默认等同 APP_KEY
 * - TIKTOK_SHOP_AUTH_HOST — open 流域名，默认 https://services.tiktokshop.com（美区可改为 https://services.us.tiktokshop.com）
 * - TIKTOK_OAUTH_STATE_SECRET — state HMAC 签名密钥，默认回落到 APP_SECRET
 */

import crypto from "node:crypto";
import { signTiktokShopRequest } from "./tiktokSignature.js";

const TOKEN_BASE = "https://auth.tiktok-shops.com/api/v2/token/get";
const DEFAULT_OPEN_AUTH_HOST = "https://services.tiktokshop.com";
const DEFAULT_AUTHV2_AUTHORIZE = "https://auth.tiktok-shops.com/api/v2/oauth/authorize";

function oauthStateSecret() {
  return (
    process.env.TIKTOK_OAUTH_STATE_SECRET?.trim() ||
    process.env.TIKTOK_SHOP_APP_SECRET?.trim() ||
    "fanmeng-tiktok-oauth-dev-only"
  );
}

/**
 * @param {string} userId
 * @returns {string}
 */
export function encodeTiktokOAuthState(userId) {
  const exp = Date.now() + 15 * 60 * 1000;
  const payload = JSON.stringify({ sub: userId, exp });
  const b64 = Buffer.from(payload, "utf8").toString("base64url");
  const sig = crypto.createHmac("sha256", oauthStateSecret()).update(b64).digest("base64url");
  return `${b64}.${sig}`;
}

/**
 * @param {string} state
 * @returns {string | null} userId
 */
export function decodeTiktokOAuthState(state) {
  const raw = String(state || "").trim();
  const dot = raw.indexOf(".");
  if (dot < 1) return null;
  const b64 = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  if (!b64 || !sig) return null;
  const expect = crypto.createHmac("sha256", oauthStateSecret()).update(b64).digest("base64url");
  try {
    const a = Buffer.from(sig, "utf8");
    const b = Buffer.from(expect, "utf8");
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    const data = JSON.parse(Buffer.from(b64, "base64url").toString("utf8"));
    if (!data?.sub || typeof data.sub !== "string") return null;
    if (typeof data.exp !== "number" || Date.now() > data.exp) return null;
    return data.sub;
  } catch {
    return null;
  }
}

function appKey() {
  return process.env.TIKTOK_SHOP_APP_KEY?.trim() || "";
}

function appSecret() {
  return process.env.TIKTOK_SHOP_APP_SECRET?.trim() || "";
}

export function getTiktokOAuthRedirectUri() {
  return process.env.TIKTOK_SHOP_OAUTH_REDIRECT_URI?.trim() || "";
}

/**
 * @param {string} state
 * @returns {string}
 */
export function buildTiktokAuthorizeUrl(state) {
  const key = appKey();
  if (!key) {
    throw new Error("未配置 TIKTOK_SHOP_APP_KEY。");
  }
  const redirectUri = getTiktokOAuthRedirectUri();
  if (!redirectUri) {
    throw new Error("未配置 TIKTOK_SHOP_OAUTH_REDIRECT_URI（须与 Partner Center 回调 URL 完全一致）。");
  }

  const flow = (process.env.TIKTOK_SHOP_OAUTH_FLOW || "authv2").toLowerCase();

  if (flow === "open") {
    const host = (process.env.TIKTOK_SHOP_AUTH_HOST || DEFAULT_OPEN_AUTH_HOST).replace(/\/+$/, "");
    const serviceId = (process.env.TIKTOK_SHOP_SERVICE_ID || key).trim();
    const qs = new URLSearchParams({
      service_id: serviceId,
      state,
    });
    const u = new URL(`${host}/open/authorize`);
    u.search = qs.toString();
    return u.toString();
  }

  const u = new URL(process.env.TIKTOK_SHOP_AUTHV2_AUTHORIZE?.trim() || DEFAULT_AUTHV2_AUTHORIZE);
  const qs = new URLSearchParams({
    client_id: key,
    redirect_uri: redirectUri,
    state,
    response_type: "code",
  });
  u.search = qs.toString();
  return u.toString();
}

/**
 * @param {string} authCode
 * @returns {Promise<{ ok: boolean, data?: object, error?: string, detail?: string }>}
 */
export async function exchangeTiktokAuthCodeForToken(authCode) {
  const key = appKey();
  const secret = appSecret();
  if (!key || !secret) {
    return { ok: false, error: "缺少 TIKTOK_SHOP_APP_KEY 或 TIKTOK_SHOP_APP_SECRET。" };
  }
  const code = String(authCode || "").trim();
  if (!code) {
    return { ok: false, error: "未收到授权码。" };
  }

  const qs = new URLSearchParams({
    app_key: key,
    app_secret: secret,
    auth_code: code,
    grant_type: "authorized_code",
  });

  let res;
  try {
    res = await fetch(`${TOKEN_BASE}?${qs.toString()}`, { method: "GET" });
  } catch (e) {
    return { ok: false, error: `换票请求失败：${e?.message || String(e)}` };
  }

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: `换票响应非 JSON，HTTP ${res.status}`, detail: text.slice(0, 400) };
  }

  const codeNum = json?.code;
  if (codeNum !== undefined && codeNum !== 0 && codeNum !== "0") {
    return {
      ok: false,
      error: json?.message || `TikTok 换票错误码 ${codeNum}`,
      detail: JSON.stringify(json).slice(0, 800),
    };
  }

  const data = json?.data ?? json;
  if (!data?.access_token) {
    return { ok: false, error: "换票成功但缺少 access_token。", detail: JSON.stringify(json).slice(0, 600) };
  }

  return { ok: true, data };
}

function apiVersion() {
  return process.env.TIKTOK_SHOP_API_VERSION?.trim() || "202309";
}

function openApiBase() {
  return (process.env.TIKTOK_SHOP_BASE_URL || "https://open-api.tiktokglobalshop.com").replace(/\/+$/, "");
}

/**
 * 取授权店铺列表（用于 shop_cipher）
 *
 * @param {string} accessToken
 * @returns {Promise<{ ok: boolean, shops?: Array<{ cipher: string, id?: string, name?: string }>, error?: string }>}
 */
export async function fetchTiktokAuthorizedShops(accessToken) {
  const key = appKey();
  const secret = appSecret();
  const token = String(accessToken || "").trim();
  if (!key || !secret || !token) {
    return { ok: false, error: "缺少 app 凭证或 access_token。" };
  }

  const version = apiVersion();
  const path = `/authorization/${version}/shops`;
  const signParams = {
    app_key: key,
    access_token: token,
    version,
  };

  const { sign, timestamp } = signTiktokShopRequest(signParams, path, secret, undefined);
  const qs = new URLSearchParams({
    app_key: key,
    access_token: token,
    version,
    timestamp,
    sign,
  });

  const url = `${openApiBase()}${path}?${qs.toString()}`;
  let res;
  try {
    res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-tts-access-token": token,
      },
    });
  } catch (e) {
    return { ok: false, error: `拉取店铺失败：${e?.message || String(e)}` };
  }

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: `店铺接口非 JSON，HTTP ${res.status}`, detail: text.slice(0, 400) };
  }

  const codeNum = json?.code;
  if (codeNum !== undefined && codeNum !== 0 && codeNum !== "0") {
    return {
      ok: false,
      error: json?.message || `店铺列表错误码 ${codeNum}`,
      detail: JSON.stringify(json).slice(0, 600),
    };
  }

  const shops = json?.data?.shops ?? json?.data?.shop_list ?? [];
  const list = Array.isArray(shops) ? shops : [];
  const normalized = list.map((s) => ({
    cipher: s.cipher || s.shop_cipher,
    id: s.id != null ? String(s.id) : undefined,
    name: s.name || s.shop_name,
  }));

  return { ok: true, shops: normalized.filter((s) => s.cipher) };
}

/**
 * @param {object} tokenData — exchange 返回的 data
 * @param {string} shopCipher
 * @param {{ id?: string, name?: string }} [shopMeta]
 * @returns {string} JSON 字符串，供 saveStoreConnection.apiToken
 */
export function buildTiktokConnectionTokenJson(tokenData, shopCipher, shopMeta = {}) {
  const cipher = String(shopCipher || "").trim();
  if (!cipher) throw new Error("缺少 shop_cipher。");

  const payload = {
    access_token: tokenData.access_token,
    accessToken: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    refreshToken: tokenData.refresh_token,
    access_token_expire_in: tokenData.access_token_expire_in,
    refresh_token_expire_in: tokenData.refresh_token_expire_in,
    open_id: tokenData.open_id,
    seller_name: tokenData.seller_name,
    shop_cipher: cipher,
    shopCipher: cipher,
    shop_id: shopMeta.id != null ? shopMeta.id : tokenData.shop_id,
    shopId: shopMeta.id != null ? shopMeta.id : tokenData.shop_id,
    app_key: appKey() || undefined,
    appKey: appKey() || undefined,
  };

  return JSON.stringify(payload);
}
