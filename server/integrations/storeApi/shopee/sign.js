import crypto from "node:crypto";

/**
 * Shopee Open Platform v2 HMAC-SHA256 签名
 * @see https://open.shopee.com/documents/v2/v2.0.0
 */

/**
 * @param {string} partnerKey
 * @param {string} baseString
 */
export function shopeeHmacSign(partnerKey, baseString) {
  return crypto.createHmac("sha256", partnerKey).update(baseString).digest("hex");
}

/**
 * @param {object} opts
 * @param {string|number} opts.partnerId
 * @param {string} opts.path — 含 /api/v2/... 前缀
 * @param {number} opts.timestamp — 秒
 * @param {string} [opts.accessToken]
 * @param {string|number} [opts.shopId]
 */
export function buildShopeeSignBaseString({ partnerId, path, timestamp, accessToken = "", shopId = "" }) {
  return `${partnerId}${path}${timestamp}${accessToken}${shopId}`;
}

/**
 * @param {object} opts
 * @param {string|number} opts.partnerId
 * @param {string} opts.partnerKey
 * @param {string} opts.path
 * @param {number} opts.timestamp
 * @param {string} [opts.accessToken]
 * @param {string|number} [opts.shopId]
 */
export function signShopeeRequest(opts) {
  const base = buildShopeeSignBaseString(opts);
  return shopeeHmacSign(opts.partnerKey, base);
}

export function shopeeTimestampSec() {
  return Math.floor(Date.now() / 1000);
}
