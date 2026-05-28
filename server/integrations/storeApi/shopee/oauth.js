/**
 * Shopee Open Platform — Partner OAuth
 *
 * 环境变量：
 * - SHOPEE_PARTNER_ID / SHOPEE_PARTNER_KEY（必填）
 * - SHOPEE_OAUTH_REDIRECT_URI — 与 Partner 后台登记一致
 * - SHOPEE_API_HOST — 默认 https://partner.shopeemobile.com
 */

import { signShopeeRequest, shopeeTimestampSec } from "./sign.js";

const DEFAULT_HOST = "https://partner.shopeemobile.com";

function partnerId() {
  return process.env.SHOPEE_PARTNER_ID?.trim() || "";
}

function partnerKey() {
  return process.env.SHOPEE_PARTNER_KEY?.trim() || "";
}

export function getShopeeApiHost() {
  return (process.env.SHOPEE_API_HOST?.trim() || DEFAULT_HOST).replace(/\/+$/, "");
}

export function getShopeeOAuthRedirectUri() {
  return process.env.SHOPEE_OAUTH_REDIRECT_URI?.trim() || "";
}

/**
 * @param {string} state
 * @returns {string}
 */
export function buildShopeeAuthorizeUrl(state) {
  const pid = partnerId();
  const pkey = partnerKey();
  if (!pid || !pkey) throw new Error("未配置 SHOPEE_PARTNER_ID / SHOPEE_PARTNER_KEY。");
  const redirect = getShopeeOAuthRedirectUri();
  if (!redirect) throw new Error("未配置 SHOPEE_OAUTH_REDIRECT_URI。");

  const path = "/api/v2/shop/auth_partner";
  const timestamp = shopeeTimestampSec();
  const sign = signShopeeRequest({ partnerId: pid, partnerKey: pkey, path, timestamp });

  const qs = new URLSearchParams({
    partner_id: pid,
    timestamp: String(timestamp),
    sign,
    redirect,
  });
  return `${getShopeeApiHost()}${path}?${qs.toString()}`;
}

/**
 * @param {string} code
 * @param {string|number} shopId
 */
export async function exchangeShopeeAuthCode(code, shopId) {
  const pid = partnerId();
  const pkey = partnerKey();
  if (!pid || !pkey) {
    return { ok: false, error: "未配置 SHOPEE_PARTNER_ID / SHOPEE_PARTNER_KEY。" };
  }

  const path = "/api/v2/auth/token/get";
  const timestamp = shopeeTimestampSec();
  const sign = signShopeeRequest({ partnerId: pid, partnerKey: pkey, path, timestamp });

  const qs = new URLSearchParams({
    partner_id: pid,
    timestamp: String(timestamp),
    sign,
  });

  const url = `${getShopeeApiHost()}${path}?${qs.toString()}`;
  const body = {
    code: String(code).trim(),
    shop_id: Number(shopId),
    partner_id: Number(pid),
  };

  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
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

  if (json.error || json.message) {
    const errMsg = json.message || json.error || "Shopee 换票失败";
    if (!json.access_token && !json.response?.access_token) {
      return { ok: false, error: errMsg, detail: text.slice(0, 600) };
    }
  }

  const data = json.response || json;
  if (!data.access_token) {
    return { ok: false, error: json.message || "未返回 access_token", detail: text.slice(0, 600) };
  }

  return {
    ok: true,
    data: {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expire_in: data.expire_in,
      shop_id: data.shop_id ?? shopId,
      merchant_id: data.merchant_id,
    },
  };
}

/**
 * @param {Record<string, unknown>} tokenData
 * @param {string|number} shopId
 */
export function buildShopeeConnectionTokenJson(tokenData, shopId) {
  return JSON.stringify({
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expire_in: tokenData.expire_in,
    shop_id: String(tokenData.shop_id ?? shopId),
    merchant_id: tokenData.merchant_id != null ? String(tokenData.merchant_id) : undefined,
  });
}
