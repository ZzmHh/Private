import { fetchJson } from "../../lib/fetchJson.js";
import { enterpriseAuthHeaders } from "../auth/enterpriseAuth.js";

function authFetch(path, options = {}) {
  return fetchJson(path, {
    ...options,
    headers: {
      ...enterpriseAuthHeaders(),
      ...(options.headers || {}),
    },
  });
}

function queryString(params = {}) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== "") qs.set(key, String(value));
  }
  const text = qs.toString();
  return text ? `?${text}` : "";
}

export async function listProductOpportunities(params = {}) {
  const { response, data } = await authFetch(`/api/enterprise/product-opportunities${queryString(params)}`);
  if (!response.ok) throw new Error(data.error || "加载选品机会失败");
  return data.opportunities || [];
}

export async function refreshProductOpportunities(params = {}) {
  const { response, data } = await authFetch("/api/enterprise/product-opportunities/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!response.ok) throw new Error(data.error || "刷新选品机会失败");
  return data;
}

export async function createProductOpportunity(body) {
  const { response, data } = await authFetch("/api/enterprise/product-opportunities", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(data.error || "导入选品机会失败");
  return data.opportunity;
}

export async function rescoreProductOpportunity(id, body = {}) {
  const { response, data } = await authFetch(`/api/enterprise/product-opportunities/${id}/rescore`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(data.error || "重新评分失败");
  return data.opportunity;
}
