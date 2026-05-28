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

export async function fetchAdminShops() {
  const { response, data } = await authFetch("/api/enterprise/admin/shops");
  if (!response.ok) throw new Error(data.error || "加载店铺失败");
  return data;
}

export async function createAdminShop(body) {
  const { response, data } = await authFetch("/api/enterprise/admin/shops", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(data.error || "创建店铺失败");
  return data.shop;
}

export async function connectShopApi(shopId, body) {
  const { response, data } = await authFetch(`/api/enterprise/admin/shops/${shopId}/connect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(data.error || "绑定失败");
  return data.connection;
}

export async function disconnectShopApi(shopId) {
  const { response, data } = await authFetch(`/api/enterprise/admin/shops/${shopId}/connect`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error(data.error || "解除绑定失败");
  return data;
}

export async function startTiktokOAuth(shopId) {
  return startShopOAuth(shopId, "tiktok");
}

export async function startShopOAuth(shopId, platform) {
  const slug = String(platform || "").toLowerCase();
  const { response, data } = await authFetch(`/api/enterprise/admin/shops/${shopId}/oauth/${slug}`);
  if (!response.ok) throw new Error(data.error || `无法发起 ${slug} 授权`);
  return data.authorizeUrl;
}

export async function syncAdminShop(shopId) {
  const { response, data } = await authFetch(`/api/enterprise/admin/shops/${shopId}/sync`, {
    method: "POST",
  });
  if (!response.ok) throw new Error(data.error || "同步失败");
  return data;
}

export async function updateShopGrants(shopId, memberUserIds) {
  const { response, data } = await authFetch(`/api/enterprise/admin/shops/${shopId}/grants`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ memberUserIds }),
  });
  if (!response.ok) throw new Error(data.error || "更新授权失败");
  return data.grants;
}

export async function fetchShopProducts(shopId) {
  const { response, data } = await authFetch(`/api/enterprise/shops/${shopId}/products`);
  if (!response.ok) throw new Error(data.error || "加载商品失败");
  return data.products;
}
