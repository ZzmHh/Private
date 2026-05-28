import { ENT_EXTENSION, entAuthHeaders, entFetch, entShopQuery } from "../lib/enterpriseHttp.js";

export function authHeaders() {
  return entAuthHeaders();
}

export function formatRelativeTime(iso) {
  if (!iso) return "—";
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "刚刚";
    if (mins < 60) return `${mins} 分钟前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} 小时前`;
    return new Date(iso).toLocaleDateString("zh-CN");
  } catch {
    return iso;
  }
}

export function formatError(error) {
  return error?.message || String(error || "操作失败");
}

/** @param {string} path @param {RequestInit} [init] @param {string} [scopeShopId] @param {Record<string,string>} [query] */
export async function csFetch(path, init = {}, scopeShopId = "", query = {}) {
  const method = (init.method || "GET").toUpperCase();
  let url = `${ENT_EXTENSION}/cs${path}`;
  if (scopeShopId && (method === "GET" || method === "DELETE")) {
    url += entShopQuery(scopeShopId, query);
  } else if (Object.keys(query).length) {
    const qs = new URLSearchParams(query).toString();
    url += qs ? `?${qs}` : "";
  }
  return entFetch(url, init, scopeShopId);
}

/** @param {string} scopeShopId @param {string} [faqScope] @param {Record<string,string>} [extra] */
export function csFaqQuery(scopeShopId, faqScope = "", extra = {}) {
  const q = { ...extra, shopId: scopeShopId };
  if (faqScope) q.shopKey = faqScope;
  return new URLSearchParams(q).toString();
}
