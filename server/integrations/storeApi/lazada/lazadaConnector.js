/**
 * Lazada Open Platform — 独立连接器
 *
 * apiToken JSON：access_token、country（站点）
 * app_key / app_secret 读环境变量
 */

import { lazadaGatewayForMarket, signLazadaParams } from "./sign.js";

/** @typedef {{ accessToken?: string, country?: string, refreshToken?: string }} LazadaParsedCredentials */

/**
 * @param {string} rawToken
 * @returns {LazadaParsedCredentials | null}
 */
export function parseLazadaCredentials(rawToken) {
  const raw = String(rawToken || "").trim();
  if (!raw) return null;
  if (raw.startsWith("{")) {
    try {
      const j = JSON.parse(raw);
      return {
        accessToken: j.access_token || j.accessToken,
        country: j.country || j.market,
        refreshToken: j.refresh_token || j.refreshToken,
      };
    } catch {
      return null;
    }
  }
  return null;
}

function appKey() {
  return process.env.LAZADA_APP_KEY?.trim() || "";
}

function appSecret() {
  return process.env.LAZADA_APP_SECRET?.trim() || "";
}

/**
 * @param {object} opts
 * @param {string} apiPath — 如 /orders/get
 * @param {LazadaParsedCredentials} creds
 * @param {Record<string, string>} [bizParams]
 */
async function lazadaCall(opts) {
  const { apiPath, creds, bizParams = {} } = opts;
  const key = appKey();
  const secret = appSecret();
  const gateway = lazadaGatewayForMarket(creds.country || "SG");
  const timestamp = String(Date.now());

  const params = {
    app_key: key,
    access_token: creds.accessToken || "",
    sign_method: "sha256",
    timestamp,
    ...bizParams,
  };
  params.sign = signLazadaParams(params, secret);

  const qs = new URLSearchParams(params);
  const url = `${gateway}${apiPath}?${qs.toString()}`;

  const res = await fetch(url, { method: "GET" });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: "响应非 JSON", detail: text.slice(0, 500) };
  }

  if (json.code && json.code !== "0") {
    return { ok: false, error: json.message || `Lazada API 错误 ${json.code}`, detail: text.slice(0, 600) };
  }
  return { ok: true, data: json.data ?? json.body ?? json };
}

/**
 * @param {import("../types.js").StoreConnectionSecret} secret
 */
export async function fetchLazadaSnapshot(secret) {
  const parsed = parseLazadaCredentials(secret?.apiToken || "");
  const marketHint = parsed?.country || String(secret?.apiEndpoint || "").trim() || "SG";

  if (!parsed?.accessToken) {
    return {
      ok: false,
      platform: "Lazada",
      connector: "open-platform",
      error: "未检测到 access_token。",
      hint: "完成 Lazada OAuth 后保存 access_token 与 country（站点代码如 MY、TH）。",
      nextSteps: ["Lazada Open Platform 创建应用", "卖家授权后用 code 换 access_token"],
    };
  }

  if (!appKey() || !appSecret()) {
    return {
      ok: false,
      platform: "Lazada",
      connector: "open-platform",
      error: "缺少 LAZADA_APP_KEY 或 LAZADA_APP_SECRET。",
    };
  }

  const creds = { ...parsed, country: parsed.country || marketHint };

  let orders_sample = [];
  let products_sample = [];

  try {
    const orderRes = await lazadaCall({
      apiPath: "/orders/get",
      creds,
      bizParams: {
        sort_by: "created_at",
        sort_direction: "DESC",
        offset: "0",
        limit: "5",
        status: "pending",
      },
    });

    if (orderRes.ok) {
      const orders = orderRes.data?.orders || orderRes.data?.order_list || [];
      const list = Array.isArray(orders) ? orders : [];
      orders_sample = list.slice(0, 5).map((o) => ({
        id: o.order_id || o.order_number,
        status: o.statuses?.[0] || o.status,
        create_time: o.created_at,
      }));
    }

    const prodRes = await lazadaCall({
      apiPath: "/products/get",
      creds,
      bizParams: {
        filter: "all",
        offset: "0",
        limit: "5",
      },
    });

    if (prodRes.ok) {
      const products = prodRes.data?.products || prodRes.data?.product || [];
      const list = Array.isArray(products) ? products : [];
      products_sample = list.slice(0, 5).map((p) => ({
        id: p.item_id || p.product_id,
        title: p.attributes?.name || p.name || `Product ${p.item_id}`,
        sku: p.skus?.[0]?.SellerSku || p.seller_sku,
        status: p.status,
      }));
    }

    if (!orderRes.ok && !prodRes.ok) {
      return {
        ok: false,
        platform: "Lazada",
        connector: "open-platform",
        error: orderRes.error || prodRes.error || "拉取失败",
        detail: orderRes.detail || prodRes.detail,
      };
    }
  } catch (e) {
    return {
      ok: false,
      platform: "Lazada",
      connector: "open-platform",
      error: `请求失败：${e?.message || String(e)}`,
    };
  }

  return {
    ok: true,
    platform: "Lazada",
    storeName: secret?.storeName || null,
    pulledAt: new Date().toISOString(),
    data: {
      orders_sample,
      products_sample,
      market: creds.country,
      note: "Lazada：订单与商品各取前 5 条样本。",
    },
  };
}
