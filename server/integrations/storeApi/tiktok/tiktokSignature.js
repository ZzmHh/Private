/**
 * TikTok Shop Open API 请求签名（与 Partner 文档及常见 SDK 一致）：
 * plainText = app_secret + path + sorted(key+value 拼串，排除 access_token/sign 等) + bodyJson + app_secret
 * sign = HmacSHA256(key=app_secret, message=plainText) → hex
 *
 * 参考实现思路：carlitose/tiktok-shop Common.signatureByAppSecret / signByUrl（MIT）
 */
import crypto from "node:crypto";

const EXCLUDE_FROM_SIGN = new Set(["app_secret", "token", "access_token", "sign"]);

export function tiktokTimestampSec() {
  return Math.floor(Date.now() / 1000);
}

function sortedSignKeys(params) {
  return Object.keys(params)
    .filter((k) => !EXCLUDE_FROM_SIGN.has(k))
    .sort((a, b) => a.localeCompare(b));
}

/**
 * @param {Record<string, string>} params 查询参数（字符串值），勿含 timestamp
 * @param {string} apiPath 须与请求 path 一致，如 /order/202309/orders/search
 * @param {string} appSecret
 * @param {Record<string, unknown>} [body] POST body；无则 undefined
 * @param {number} [forcedTs]
 */
export function signTiktokShopRequest(params, apiPath, appSecret, body, forcedTs) {
  const timestamp = String(forcedTs ?? tiktokTimestampSec());
  const modParams = { ...params, timestamp };
  const keys = sortedSignKeys(modParams);
  let input = "";
  for (const k of keys) {
    const v = modParams[k];
    input += k + (v === undefined || v === null ? "" : String(v));
  }
  const bodyText =
    body !== undefined && body !== null && typeof body === "object" && Object.keys(body).length > 0
      ? JSON.stringify(body)
      : "";
  const plainText = `${appSecret}${apiPath}${input}${bodyText}${appSecret}`;
  const sign = crypto.createHmac("sha256", appSecret).update(plainText).digest("hex");
  return { sign, timestamp };
}
