/**
 * Walmart Marketplace API — OAuth 2.0 + REST
 *
 * 环境变量：
 * - WALMART_CLIENT_ID / WALMART_CLIENT_SECRET
 * - WALMART_OAUTH_REDIRECT_URI
 * - WALMART_API_BASE — 默认 https://marketplace.walmartapis.com
 */

const DEFAULT_API_BASE = "https://marketplace.walmartapis.com";
const TOKEN_PATH = "/v3/token";
const AUTH_PATH = "https://login.account.wal-mart.com/authorize";

function clientId() {
  return process.env.WALMART_CLIENT_ID?.trim() || "";
}

function clientSecret() {
  return process.env.WALMART_CLIENT_SECRET?.trim() || "";
}

export function getWalmartApiBase() {
  return (process.env.WALMART_API_BASE?.trim() || DEFAULT_API_BASE).replace(/\/+$/, "");
}

export function getWalmartOAuthRedirectUri() {
  return process.env.WALMART_OAUTH_REDIRECT_URI?.trim() || "";
}

/**
 * @param {string} state
 * @returns {string}
 */
export function buildWalmartAuthorizeUrl(state) {
  const cid = clientId();
  if (!cid) throw new Error("未配置 WALMART_CLIENT_ID。");
  const redirect = getWalmartOAuthRedirectUri();
  if (!redirect) throw new Error("未配置 WALMART_OAUTH_REDIRECT_URI。");

  const qs = new URLSearchParams({
    responseType: "code",
    clientId: cid,
    redirectUri: redirect,
    state,
    nonce: state.slice(0, 32),
  });
  return `${AUTH_PATH}?${qs.toString()}`;
}

/**
 * 用 authorization code 换 access_token（Seller OAuth）
 * @param {string} code
 */
export async function exchangeWalmartAuthCode(code) {
  const cid = clientId();
  const secret = clientSecret();
  if (!cid || !secret) {
    return { ok: false, error: "未配置 WALMART_CLIENT_ID / WALMART_CLIENT_SECRET。" };
  }

  const redirect = getWalmartOAuthRedirectUri();
  const basic = Buffer.from(`${cid}:${secret}`, "utf8").toString("base64");
  const correlationId = `ent-${Date.now()}`;

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: String(code).trim(),
    redirect_uri: redirect,
  });

  let res;
  try {
    res = await fetch(`${getWalmartApiBase()}${TOKEN_PATH}`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        "WM_SVC.NAME": "Walmart Marketplace",
        "WM_QOS.CORRELATION_ID": correlationId,
      },
      body: body.toString(),
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

  const accessToken = json.access_token;
  if (!accessToken) {
    return { ok: false, error: json.error_description || json.error || "未返回 access_token", detail: text.slice(0, 600) };
  }

  return {
    ok: true,
    data: {
      access_token: accessToken,
      refresh_token: json.refresh_token,
      expires_in: json.expires_in,
      token_type: json.token_type,
    },
  };
}

/**
 * Client credentials 换票（部分集成场景）
 */
export async function fetchWalmartClientCredentialsToken() {
  const cid = clientId();
  const secret = clientSecret();
  if (!cid || !secret) {
    return { ok: false, error: "未配置 WALMART_CLIENT_ID / WALMART_CLIENT_SECRET。" };
  }

  const basic = Buffer.from(`${cid}:${secret}`, "utf8").toString("base64");
  const body = new URLSearchParams({ grant_type: "client_credentials" });

  const res = await fetch(`${getWalmartApiBase()}${TOKEN_PATH}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      "WM_SVC.NAME": "Walmart Marketplace",
      "WM_QOS.CORRELATION_ID": `ent-cc-${Date.now()}`,
    },
    body: body.toString(),
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: "换票响应非 JSON", detail: text.slice(0, 400) };
  }
  if (!json.access_token) {
    return { ok: false, error: json.error_description || "未返回 access_token", detail: text.slice(0, 600) };
  }
  return { ok: true, data: json };
}

/**
 * @param {Record<string, unknown>} tokenData
 */
export function buildWalmartConnectionTokenJson(tokenData) {
  return JSON.stringify({
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expires_in: tokenData.expires_in,
    token_type: tokenData.token_type,
  });
}
