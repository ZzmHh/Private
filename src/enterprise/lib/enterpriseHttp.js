import { enterpriseAuthHeaders } from "../auth/enterpriseAuth.js";

/** 企业站 API 路径前缀（与凡梦 C 端 /api/extension 隔离） */
export const ENT_EXTENSION = "/api/enterprise/extension";
export const ENT_METRICS = "/api/enterprise/metrics";
export const ENT_AGENTS = "/api/enterprise/agents";

export function entAuthHeaders(extra = {}) {
  return {
    "Content-Type": "application/json",
    ...enterpriseAuthHeaders(),
    ...extra,
  };
}

/** @param {string} [shopId] */
export function entShopQuery(shopId, extra = {}) {
  const qs = new URLSearchParams(extra);
  if (shopId) qs.set("shopId", shopId);
  const s = qs.toString();
  return s ? `?${s}` : "";
}

/** @param {string} path @param {RequestInit} [options] @param {string} [shopId] */
export async function entFetch(path, options = {}, shopId = "") {
  const method = (options.method || "GET").toUpperCase();
  let url = path;
  if (shopId) {
    if (method === "GET" || method === "DELETE") {
      url += entShopQuery(shopId);
    } else {
      let body = options.body;
      if (body && typeof body === "string") {
        try {
          const j = JSON.parse(body);
          j.shopId = j.shopId || shopId;
          body = JSON.stringify(j);
        } catch {
          /* keep raw body */
        }
      }
      options = { ...options, body };
    }
  }
  const response = await fetch(url, {
    ...options,
    headers: { ...entAuthHeaders(), ...(options.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `请求失败 (${response.status})`);
  return data;
}
