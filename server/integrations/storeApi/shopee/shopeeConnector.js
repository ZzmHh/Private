/**
 * Shopee Open Platform v2 — 独立连接器
 *
 * 凭据 apiToken JSON：access_token、shop_id、refresh_token（可选）
 * partner_id / partner_key 读环境变量 SHOPEE_PARTNER_ID / SHOPEE_PARTNER_KEY
 */

import { getShopeeApiHost } from "./oauth.js";
import { signShopeeRequest, shopeeTimestampSec } from "./sign.js";

/** @typedef {{ accessToken?: string, shopId?: string, refreshToken?: string }} ShopeeParsedCredentials */

/**
 * @param {string} rawToken
 * @returns {ShopeeParsedCredentials | null}
 */
export function parseShopeeCredentials(rawToken) {
  const raw = String(rawToken || "").trim();
  if (!raw) return null;
  if (raw.startsWith("{")) {
    try {
      const j = JSON.parse(raw);
      return {
        accessToken: j.access_token || j.accessToken,
        shopId: j.shop_id != null ? String(j.shop_id) : j.shopId != null ? String(j.shopId) : undefined,
        refreshToken: j.refresh_token || j.refreshToken,
      };
    } catch {
      return null;
    }
  }
  return null;
}

function partnerId() {
  return process.env.SHOPEE_PARTNER_ID?.trim() || "";
}

function partnerKey() {
  return process.env.SHOPEE_PARTNER_KEY?.trim() || "";
}

/**
 * @param {object} opts
 * @param {string} path
 * @param {ShopeeParsedCredentials} creds
 * @param {Record<string, string>} [extraQuery]
 */
async function shopeeGet(opts) {
  const { path, creds, extraQuery = {} } = opts;
  const pid = partnerId();
  const pkey = partnerKey();
  const timestamp = shopeeTimestampSec();
  const sign = signShopeeRequest({
    partnerId: pid,
    partnerKey: pkey,
    path,
    timestamp,
    accessToken: creds.accessToken || "",
    shopId: creds.shopId || "",
  });

  const qs = new URLSearchParams({
    partner_id: pid,
    timestamp: String(timestamp),
    access_token: creds.accessToken || "",
    shop_id: creds.shopId || "",
    sign,
    ...extraQuery,
  });

  const url = `${getShopeeApiHost()}${path}?${qs.toString()}`;
  const res = await fetch(url, { method: "GET" });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, httpStatus: res.status, error: "响应非 JSON", detail: text.slice(0, 500) };
  }

  const inner = json.response ?? json;
  if (json.error && !inner.order_list && !inner.item) {
    return {
      ok: false,
      httpStatus: res.status,
      error: json.message || json.error || "Shopee API 错误",
      detail: text.slice(0, 600),
    };
  }
  if (!res.ok) {
    return { ok: false, httpStatus: res.status, error: `HTTP ${res.status}`, detail: text.slice(0, 600) };
  }
  return { ok: true, data: inner, raw: json };
}

/**
 * @param {import("../types.js").StoreConnectionSecret} secret
 */
export async function fetchShopeeSnapshot(secret) {
  const parsed = parseShopeeCredentials(secret?.apiToken || "");
  const pid = partnerId();
  const pkey = partnerKey();

  if (!parsed?.accessToken) {
    return {
      ok: false,
      platform: "Shopee",
      connector: "open-platform-v2",
      error: "未检测到 access_token。",
      hint: "完成 Shopee Partner OAuth 后，将 access_token 与 shop_id 写入 apiToken JSON。",
      nextSteps: [
        "Partner Center 创建应用并配置回调 URL",
        "卖家授权后用 code + shop_id 换 access_token",
      ],
    };
  }

  if (!parsed.shopId) {
    return {
      ok: false,
      platform: "Shopee",
      connector: "open-platform-v2",
      error: "未检测到 shop_id。",
      hint: "OAuth 回调会带上 shop_id，需与 access_token 一并保存。",
    };
  }

  if (!pid || !pkey) {
    return {
      ok: false,
      platform: "Shopee",
      connector: "open-platform-v2",
      error: "缺少 SHOPEE_PARTNER_ID 或 SHOPEE_PARTNER_KEY 环境变量。",
    };
  }

  const now = shopeeTimestampSec();
  const timeFrom = now - 90 * 24 * 3600;

  let orders_sample = [];
  let products_sample = [];

  try {
    const orderRes = await shopeeGet({
      path: "/api/v2/order/get_order_list",
      creds: parsed,
      extraQuery: {
        time_range_field: "create_time",
        time_from: String(timeFrom),
        time_to: String(now),
        page_size: "5",
        cursor: "",
        order_status: "READY_TO_SHIP",
      },
    });

    if (orderRes.ok) {
      const list = orderRes.data?.order_list || [];
      orders_sample = list.slice(0, 5).map((o) => ({
        id: o.order_sn,
        status: o.order_status,
        create_time: o.create_time,
      }));
    }

    const prodRes = await shopeeGet({
      path: "/api/v2/product/get_item_list",
      creds: parsed,
      extraQuery: {
        offset: "0",
        page_size: "5",
        item_status: "NORMAL",
      },
    });

    if (prodRes.ok) {
      const items = prodRes.data?.item || [];
      products_sample = items.slice(0, 5).map((it) => ({
        id: it.item_id,
        title: it.item_name || `Item ${it.item_id}`,
        status: it.item_status,
      }));
    }

    if (!orderRes.ok && !prodRes.ok) {
      return {
        ok: false,
        platform: "Shopee",
        connector: "open-platform-v2",
        error: orderRes.error || prodRes.error || "拉取失败",
        detail: orderRes.detail || prodRes.detail,
      };
    }
  } catch (e) {
    return {
      ok: false,
      platform: "Shopee",
      connector: "open-platform-v2",
      error: `请求失败：${e?.message || String(e)}`,
    };
  }

  return {
    ok: true,
    platform: "Shopee",
    storeName: secret?.storeName || null,
    pulledAt: new Date().toISOString(),
    data: {
      orders_sample,
      products_sample,
      note: "Shopee：近 90 天订单样本 + 在售商品前 5 条。",
    },
  };
}
