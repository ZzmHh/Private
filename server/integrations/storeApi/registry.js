/**
 * 店铺平台连接器注册表 — 一平台一 connector
 *
 * authMode:
 * - oauth_sign: OAuth 授权 + 请求签名（Shopee / TikTok / Lazada）
 * - oauth: OAuth 2.0（Walmart）
 * - api_key: Client-Id + Api-Key（Ozon）
 */

import { fetchTikTokShopSnapshot } from "./tiktok/tiktokShopConnector.js";
import { fetchShopeeSnapshot } from "./shopee/shopeeConnector.js";
import { fetchLazadaSnapshot } from "./lazada/lazadaConnector.js";
import { fetchOzonSnapshot } from "./ozon/ozonConnector.js";
import { fetchWalmartSnapshot } from "./walmart/walmartConnector.js";
import { fetchAmazonSpApiSnapshot } from "./amazon/amazonSpApiConnector.js";
import { fetchShopifySnapshot, fetchWooCommerceSnapshot } from "./legacy/shopifyWooConnectors.js";

/** @typedef {'oauth_sign'|'oauth'|'api_key'|'legacy_url_token'} PlatformAuthMode */

/**
 * @typedef {Object} PlatformConnectorMeta
 * @property {string} label
 * @property {PlatformAuthMode} authMode
 * @property {boolean} [enterprise]
 * @property {(secret: import("./types.js").StoreConnectionSecret) => Promise<import("./types.js").StoreSnapshotResult>} fetchSnapshot
 */

/** @type {Record<string, PlatformConnectorMeta>} */
export const PLATFORM_REGISTRY = {
  shopee: {
    label: "Shopee",
    authMode: "oauth_sign",
    enterprise: true,
    fetchSnapshot: fetchShopeeSnapshot,
  },
  tiktok: {
    label: "TikTok Shop",
    authMode: "oauth_sign",
    enterprise: true,
    fetchSnapshot: fetchTikTokShopSnapshot,
  },
  lazada: {
    label: "Lazada",
    authMode: "oauth_sign",
    enterprise: true,
    fetchSnapshot: fetchLazadaSnapshot,
  },
  ozon: {
    label: "Ozon",
    authMode: "api_key",
    enterprise: true,
    fetchSnapshot: fetchOzonSnapshot,
  },
  walmart: {
    label: "Walmart",
    authMode: "oauth",
    enterprise: true,
    fetchSnapshot: fetchWalmartSnapshot,
  },
  amazon: {
    label: "Amazon",
    authMode: "oauth_sign",
    enterprise: false,
    fetchSnapshot: fetchAmazonSpApiSnapshot,
  },
  shopify: {
    label: "Shopify",
    authMode: "legacy_url_token",
    enterprise: false,
    fetchSnapshot: fetchShopifySnapshot,
  },
  woocommerce: {
    label: "WooCommerce",
    authMode: "legacy_url_token",
    enterprise: false,
    fetchSnapshot: fetchWooCommerceSnapshot,
  },
};

/** @param {string} platform */
export function normalizePlatformId(platform) {
  return String(platform || "").trim().toLowerCase();
}

/** @param {string} platform */
export function getPlatformConnector(platform) {
  return PLATFORM_REGISTRY[normalizePlatformId(platform)] || null;
}

/** @returns {string[]} */
export function listEnterprisePlatformIds() {
  return Object.entries(PLATFORM_REGISTRY)
    .filter(([, meta]) => meta.enterprise)
    .map(([id]) => id);
}

/** @param {string} platform */
export function platformAuthMode(platform) {
  return getPlatformConnector(platform)?.authMode || null;
}

/** @param {string} platform */
export function platformUsesOAuth(platform) {
  const mode = platformAuthMode(platform);
  return mode === "oauth" || mode === "oauth_sign";
}
