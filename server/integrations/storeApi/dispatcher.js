/**
 * 店铺真实 API — 调度入口（经 registry 一平台一 connector）
 */

import {
  getPlatformConnector,
  normalizePlatformId,
  PLATFORM_REGISTRY,
} from "./registry.js";
import { fetchAmazonSpApiSnapshot } from "./amazon/amazonSpApiConnector.js";
import { fetchTikTokShopSnapshot } from "./tiktok/tiktokShopConnector.js";

/** @param {import("./types.js").StoreConnectionSecret} secret */
export async function fetchStoreSnapshot(secret) {
  const platform = normalizePlatformId(secret?.platform);
  const connector = getPlatformConnector(platform);

  if (connector?.fetchSnapshot) {
    return connector.fetchSnapshot(secret);
  }

  const supported = Object.keys(PLATFORM_REGISTRY).join("、");
  return {
    ok: false,
    error: `未知或未接入的平台「${secret?.platform}」。当前支持：${supported}。`,
  };
}

/** 显式走 Amazon SP-API 连接器 */
export async function fetchAmazonStoreSnapshot(secret) {
  return fetchAmazonSpApiSnapshot(secret);
}

/** 显式走 TikTok Shop 连接器 */
export async function fetchTikTokStoreSnapshot(secret) {
  return fetchTikTokShopSnapshot(secret);
}

/**
 * @param {string} expected
 * @param {import("./types.js").StoreConnectionSecret|null} secret
 */
export function assertPlatformSecret(expected, secret) {
  const got = normalizePlatformId(secret?.platform);
  if (!secret) {
    return { ok: false, error: "未找到已保存的店铺连接，请先配置或传入 testConfig。" };
  }
  if (got !== normalizePlatformId(expected)) {
    return {
      ok: false,
      error: `该接口仅支持平台「${expected}」，当前连接为「${got || "未设置"}」。请使用对应平台的连接配置。`,
    };
  }
  return { ok: true };
}

/** 是否具备调用快照的最低字段 */
export function snapshotRequiresSavedSecret(secret) {
  const p = normalizePlatformId(secret?.platform);
  const tok = String(secret?.apiToken || "").trim();
  const ep = String(secret?.apiEndpoint || "").trim();
  const meta = getPlatformConnector(p);

  if (meta?.authMode === "legacy_url_token") {
    return Boolean(ep && tok);
  }
  if (meta?.authMode === "api_key") {
    if (tok.startsWith("{")) return Boolean(tok);
    return Boolean(ep && tok);
  }
  if (meta?.authMode === "oauth" || meta?.authMode === "oauth_sign") {
    return Boolean(tok);
  }
  if (p === "amazon" || p === "tiktok") {
    return Boolean(tok);
  }
  return Boolean(ep && tok);
}

export { PLATFORM_REGISTRY, getPlatformConnector, platformAuthMode, platformUsesOAuth } from "./registry.js";
