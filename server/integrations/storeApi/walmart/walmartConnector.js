/**
 * Walmart Marketplace API v3 — 独立连接器
 */

import { getWalmartApiBase } from "./oauth.js";

/** @typedef {{ accessToken?: string, refreshToken?: string }} WalmartParsedCredentials */

/**
 * @param {string} rawToken
 * @returns {WalmartParsedCredentials | null}
 */
export function parseWalmartCredentials(rawToken) {
  const raw = String(rawToken || "").trim();
  if (!raw) return null;
  if (raw.startsWith("{")) {
    try {
      const j = JSON.parse(raw);
      return {
        accessToken: j.access_token || j.accessToken,
        refreshToken: j.refresh_token || j.refreshToken,
      };
    } catch {
      return null;
    }
  }
  return { accessToken: raw };
}

function clientId() {
  return process.env.WALMART_CLIENT_ID?.trim() || "";
}

function clientSecret() {
  return process.env.WALMART_CLIENT_SECRET?.trim() || "";
}

/**
 * @param {string} accessToken
 * @param {string} path
 * @param {Record<string, string>} [query]
 */
async function walmartGet(accessToken, path, query = {}) {
  const cid = clientId();
  const secret = clientSecret();
  const basic = Buffer.from(`${cid}:${secret}`, "utf8").toString("base64");
  const qs = new URLSearchParams(query);
  const url = `${getWalmartApiBase()}${path}${qs.toString() ? `?${qs.toString()}` : ""}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Basic ${basic}`,
      "WM_SEC.ACCESS_TOKEN": accessToken,
      Accept: "application/json",
      "WM_SVC.NAME": "Walmart Marketplace",
      "WM_QOS.CORRELATION_ID": `snap-${Date.now()}`,
    },
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: "响应非 JSON", detail: text.slice(0, 500), httpStatus: res.status };
  }
  if (!res.ok) {
    return { ok: false, error: json.error?.[0]?.description || `HTTP ${res.status}`, detail: text.slice(0, 600) };
  }
  return { ok: true, data: json };
}

/**
 * @param {import("../types.js").StoreConnectionSecret} secret
 */
export async function fetchWalmartSnapshot(secret) {
  const parsed = parseWalmartCredentials(secret?.apiToken || "");

  if (!parsed?.accessToken) {
    return {
      ok: false,
      platform: "Walmart",
      connector: "marketplace-v3",
      error: "未检测到 access_token。",
      hint: "完成 Walmart Seller OAuth 后保存 access_token；或粘贴 OAuth JSON。",
      nextSteps: [
        "Walmart Developer Portal 创建应用",
        "配置 WALMART_OAUTH_REDIRECT_URI 并完成卖家授权",
      ],
    };
  }

  if (!clientId() || !clientSecret()) {
    return {
      ok: false,
      platform: "Walmart",
      connector: "marketplace-v3",
      error: "缺少 WALMART_CLIENT_ID 或 WALMART_CLIENT_SECRET。",
    };
  }

  const start = new Date(Date.now() - 90 * 86400000).toISOString();
  let orders_sample = [];
  let products_sample = [];

  try {
    const orderRes = await walmartGet(parsed.accessToken, "/v3/orders", {
      createdStartDate: start,
      limit: "5",
    });

    if (orderRes.ok) {
      const list = orderRes.data?.list?.elements?.order || orderRes.data?.order || [];
      const orders = Array.isArray(list) ? list : [];
      orders_sample = orders.slice(0, 5).map((o) => ({
        id: o.purchaseOrderId || o.customerOrderId,
        status: o.orderLines?.orderLine?.[0]?.orderLineStatuses?.orderLineStatus?.[0]?.status,
        create_time: o.orderDate,
      }));
    }

    const prodRes = await walmartGet(parsed.accessToken, "/v3/items", {
      limit: "5",
    });

    if (prodRes.ok) {
      const items = prodRes.data?.ItemResponse || prodRes.data?.items || [];
      const list = Array.isArray(items) ? items : [];
      products_sample = list.slice(0, 5).map((it) => ({
        id: it.sku || it.wpid,
        title: it.productName || it.title || it.sku,
        sku: it.sku,
        status: it.publishedStatus || it.lifecycleStatus,
      }));
    }

    if (!orderRes.ok && !prodRes.ok) {
      return {
        ok: false,
        platform: "Walmart",
        connector: "marketplace-v3",
        error: orderRes.error || prodRes.error || "拉取失败",
        detail: orderRes.detail || prodRes.detail,
      };
    }
  } catch (e) {
    return {
      ok: false,
      platform: "Walmart",
      connector: "marketplace-v3",
      error: `请求失败：${e?.message || String(e)}`,
    };
  }

  return {
    ok: true,
    platform: "Walmart",
    storeName: secret?.storeName || null,
    pulledAt: new Date().toISOString(),
    data: {
      orders_sample,
      products_sample,
      note: "Walmart：近 90 天订单与商品各取前 5 条。",
    },
  };
}
