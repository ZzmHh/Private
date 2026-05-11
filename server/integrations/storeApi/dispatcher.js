/**
 * 店铺真实 API — 调度入口
 *
 * - Amazon → ./amazon/amazonSpApiConnector.js（SP-API 专用）
 * - TikTok → ./tiktok/tiktokShopConnector.js（Open Platform 专用）
 * - Shopify / WooCommerce → ./legacy/shopifyWooConnectors.js（与上述形态不同，保留兼容）
 */

import { fetchAmazonSpApiSnapshot } from "./amazon/amazonSpApiConnector.js";
import { fetchTikTokShopSnapshot } from "./tiktok/tiktokShopConnector.js";
import { fetchShopifySnapshot, fetchWooCommerceSnapshot } from "./legacy/shopifyWooConnectors.js";

/** @param {import("./types.js").StoreConnectionSecret} secret */
export async function fetchStoreSnapshot(secret) {
  const p = String(secret?.platform || "").toLowerCase();

  if (p === "amazon") {
    return fetchAmazonSpApiSnapshot(secret);
  }
  if (p === "tiktok") {
    return fetchTikTokShopSnapshot(secret);
  }
  if (p === "shopify") {
    return fetchShopifySnapshot(secret);
  }
  if (p === "woocommerce") {
    return fetchWooCommerceSnapshot(secret);
  }

  return {
    ok: false,
    error: `未知或未接入的平台「${secret?.platform}」。当前聚合入口支持：amazon、tiktok、shopify、woocommerce。`,
  };
}

/** 显式走 Amazon SP-API 连接器（路由层可强制校验 platform） */
export async function fetchAmazonStoreSnapshot(secret) {
  return fetchAmazonSpApiSnapshot(secret);
}

/** 显式走 TikTok Shop 连接器 */
export async function fetchTikTokStoreSnapshot(secret) {
  return fetchTikTokShopSnapshot(secret);
}

/**
 * 校验「平台专属路由」与凭据外壳是否一致
 * @param {string} expected — 'amazon' | 'tiktok'
 * @param {import("./types.js").StoreConnectionSecret|null} secret
 */
export function assertPlatformSecret(expected, secret) {
  const got = String(secret?.platform || "").toLowerCase();
  if (!secret) {
    return { ok: false, error: "未找到已保存的店铺连接，请先配置或传入 testConfig。" };
  }
  if (got !== expected) {
    return {
      ok: false,
      error: `该接口仅支持平台「${expected}」，当前连接为「${got || "未设置"}」。请使用对应平台的连接配置。`,
    };
  }
  return { ok: true };
}

/**
 * 是否具备调用聚合快照的最低字段（各平台语义不同，Amazon/TikTok 仅要求有非空 apiToken 用于 JSON 解析尝试）
 */
export function snapshotRequiresSavedSecret(secret) {
  const p = String(secret?.platform || "").toLowerCase();
  const tok = String(secret?.apiToken || "").trim();
  const ep = String(secret?.apiEndpoint || "").trim();

  if (p === "shopify" || p === "woocommerce") {
    return Boolean(ep && tok);
  }
  if (p === "amazon" || p === "tiktok") {
    return Boolean(tok);
  }
  return Boolean(ep && tok);
}
