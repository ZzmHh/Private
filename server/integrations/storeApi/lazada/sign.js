import crypto from "node:crypto";

/**
 * Lazada Open Platform IOP 签名
 * @see https://open.lazada.com/doc/doc.htm
 */

/**
 * @param {Record<string, string>} params — 不含 sign
 * @param {string} appSecret
 */
export function signLazadaParams(params, appSecret) {
  const keys = Object.keys(params).sort();
  let concat = "";
  for (const k of keys) {
    concat += `${k}${params[k]}`;
  }
  const base = `${appSecret}${concat}${appSecret}`;
  return crypto.createHash("md5").update(base, "utf8").digest("hex").toUpperCase();
}

/** Lazada 各站点 REST 网关 */
export const LAZADA_GATEWAY_BY_MARKET = {
  SG: "https://api.lazada.sg/rest",
  MY: "https://api.lazada.com.my/rest",
  TH: "https://api.lazada.co.th/rest",
  ID: "https://api.lazada.co.id/rest",
  VN: "https://api.lazada.vn/rest",
  PH: "https://api.lazada.com.ph/rest",
};

/**
 * @param {string} market — SG/MY/TH/ID/VN/PH
 */
export function lazadaGatewayForMarket(market) {
  const m = String(market || "").trim().toUpperCase();
  return LAZADA_GATEWAY_BY_MARKET[m] || LAZADA_GATEWAY_BY_MARKET.SG;
}
