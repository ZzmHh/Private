/**
 * Lazada Open Platform — OAuth
 *
 * 环境变量：
 * - LAZADA_APP_KEY / LAZADA_APP_SECRET
 * - LAZADA_OAUTH_REDIRECT_URI
 */

import { lazadaGatewayForMarket, signLazadaParams } from "./sign.js";

const AUTH_BASE = "https://auth.lazada.com/oauth/authorize";

function appKey() {
  return process.env.LAZADA_APP_KEY?.trim() || "";
}

function appSecret() {
  return process.env.LAZADA_APP_SECRET?.trim() || "";
}

export function getLazadaOAuthRedirectUri() {
  return process.env.LAZADA_OAUTH_REDIRECT_URI?.trim() || "";
}

/**
 * @param {string} state
 * @returns {string}
 */
export function buildLazadaAuthorizeUrl(state) {
  const key = appKey();
  if (!key) throw new Error("未配置 LAZADA_APP_KEY。");
  const redirect = getLazadaOAuthRedirectUri();
  if (!redirect) throw new Error("未配置 LAZADA_OAUTH_REDIRECT_URI。");

  const qs = new URLSearchParams({
    response_type: "code",
    force_auth: "true",
    redirect_uri: redirect,
    client_id: key,
    state,
  });
  return `${AUTH_BASE}?${qs.toString()}`;
}

/**
 * @param {string} code
 * @param {string} [market] — 换票网关站点，默认 SG
 */
export async function exchangeLazadaAuthCode(code, market = "SG") {
  const key = appKey();
  const secret = appSecret();
  if (!key || !secret) {
    return { ok: false, error: "未配置 LAZADA_APP_KEY / LAZADA_APP_SECRET。" };
  }

  const gateway = lazadaGatewayForMarket(market);
  const timestamp = String(Date.now());
  const params = {
    app_key: key,
    code: String(code).trim(),
    sign_method: "sha256",
    timestamp,
  };
  params.sign = signLazadaParams(params, secret);

  const qs = new URLSearchParams({ ...params });
  const url = `${gateway}/auth/token/create?${qs.toString()}`;

  let res;
  try {
    res = await fetch(url, { method: "GET" });
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

  const body = json.body || json;
  if (json.code && json.code !== "0" && !body.access_token) {
    return { ok: false, error: json.message || body.message || "Lazada 换票失败", detail: text.slice(0, 600) };
  }

  const accessToken = body.access_token;
  if (!accessToken) {
    return { ok: false, error: "未返回 access_token", detail: text.slice(0, 600) };
  }

  return {
    ok: true,
    data: {
      access_token: accessToken,
      refresh_token: body.refresh_token,
      expires_in: body.expires_in,
      country: body.country || market,
      account: body.account,
      account_platform: body.account_platform,
    },
  };
}

/**
 * @param {Record<string, unknown>} tokenData
 * @param {string} market
 */
export function buildLazadaConnectionTokenJson(tokenData, market) {
  return JSON.stringify({
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expires_in: tokenData.expires_in,
    country: tokenData.country || market,
    account: tokenData.account,
    account_platform: tokenData.account_platform,
  });
}
