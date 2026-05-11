/**
 * TikTok Shop Open API — 独立连接器（优先实现阶段）
 *
 * 凭据：
 * - app_key / app_secret：优先读环境变量 TIKTOK_SHOP_APP_KEY、TIKTOK_SHOP_APP_SECRET（勿下发给浏览器）
 * - access_token、shop_cipher：（及可选 shop_id）放在 saveStoreConnection 的 apiToken JSON 里，OAuth 换票后写入
 * - apiEndpoint：可选，覆盖网关根地址（默认 https://open-api.tiktokglobalshop.com）
 */

/** @typedef {{ accessToken?: string, shopCipher?: string, shopId?: string, appKey?: string, appSecret?: string }} TikTokShopParsedCredentials */

import { signTiktokShopRequest, tiktokTimestampSec } from "./tiktokSignature.js";

const DEFAULT_BASE = "https://open-api.tiktokglobalshop.com";
const DEFAULT_VERSION = "202309";

function extractTiktokOrderArray(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  const direct = data.order_list ?? data.orderList ?? data.orders;
  if (Array.isArray(direct)) return direct;
  if (direct && Array.isArray(direct.orders)) return direct.orders;
  if (data.data && Array.isArray(data.data)) return data.data;
  return [];
}

/**
 * @param {string} rawToken
 * @returns {TikTokShopParsedCredentials | null}
 */
export function parseTikTokShopCredentials(rawToken) {
  const raw = String(rawToken || "").trim();
  if (!raw) return null;
  if (raw.startsWith("{")) {
    try {
      const j = JSON.parse(raw);
      return {
        accessToken: j.accessToken || j.access_token,
        shopCipher: j.shopCipher || j.shop_cipher,
        shopId: j.shopId != null ? String(j.shopId) : j.shop_id != null ? String(j.shop_id) : undefined,
        appKey: j.appKey || j.app_key,
        appSecret: j.appSecret || j.app_secret,
      };
    } catch {
      return null;
    }
  }
  return null;
}

function resolveBaseUrl(secret) {
  const raw = String(secret?.apiEndpoint || "").trim();
  if (raw.startsWith("http")) return raw.replace(/\/+$/, "");
  return process.env.TIKTOK_SHOP_BASE_URL?.trim() || DEFAULT_BASE;
}

function apiVersion() {
  return process.env.TIKTOK_SHOP_API_VERSION?.trim() || DEFAULT_VERSION;
}

/**
 * @param {import("../types.js").StoreConnectionSecret} secret
 */
export async function fetchTikTokShopSnapshot(secret) {
  const parsed = parseTikTokShopCredentials(secret?.apiToken || "");
  const appKey = parsed?.appKey || process.env.TIKTOK_SHOP_APP_KEY?.trim();
  const appSecret = parsed?.appSecret || process.env.TIKTOK_SHOP_APP_SECRET?.trim();

  if (!parsed?.accessToken) {
    return {
      ok: false,
      platform: "TikTok Shop",
      connector: "open-platform",
      error: "未检测到 access_token。",
      hint: "OAuth 完成后将 access_token、shop_cipher 等写入 apiToken JSON；app_key/app_secret 请配置在服务端环境变量 TIKTOK_SHOP_APP_KEY / TIKTOK_SHOP_APP_SECRET（或仅在自托管时在 JSON 内提供 app_secret，勿用于公共 SaaS 前端）。",
      nextSteps: [
	"Partner Center 创建应用，配置回调 URL，卖家授权后用 auth_code 换 access_token",
	"将 refresh_token 一并入库以便定时刷新",
      ],
    };
  }

  if (!parsed?.shopCipher) {
    return {
      ok: false,
      platform: "TikTok Shop",
      connector: "open-platform",
      error: "未检测到 shop_cipher。",
      hint: "授权接口返回的 shop_cipher 需与 access_token 一并保存。",
    };
  }

  if (!appKey || !appSecret) {
    return {
      ok: false,
      platform: "TikTok Shop",
      connector: "open-platform",
      error: "缺少 app_key 或 app_secret。",
      hint: "在运行环境中设置 TIKTOK_SHOP_APP_KEY、TIKTOK_SHOP_APP_SECRET（Partner 应用凭证）。",
    };
  }

  const base = resolveBaseUrl(secret);
  const version = apiVersion();
  const path = `/order/${version}/orders/search`;

  const now = tiktokTimestampSec();
  const searchBody = {
    create_time_from: now - 90 * 24 * 3600,
    create_time_to: now,
  };

  const signParams = {
    access_token: parsed.accessToken,
    app_key: appKey,
    shop_cipher: parsed.shopCipher,
    shop_id: parsed.shopId ?? "",
    version,
    page_size: "5",
  };

  const { sign, timestamp } = signTiktokShopRequest(signParams, path, appSecret, searchBody);

  const qs = new URLSearchParams({
    access_token: parsed.accessToken,
    app_key: appKey,
    shop_cipher: parsed.shopCipher,
    shop_id: parsed.shopId ?? "",
    version,
    page_size: "5",
    timestamp,
    sign,
  });

  const url = `${base}${path}?${qs.toString()}`;

  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tts-access-token": parsed.accessToken,
      },
      body: JSON.stringify(searchBody),
    });
  } catch (e) {
    return {
      ok: false,
      platform: "TikTok Shop",
      connector: "open-platform",
      error: `请求失败：${e?.message || String(e)}`,
    };
  }

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    return {
      ok: false,
      platform: "TikTok Shop",
      connector: "open-platform",
      error: `响应非 JSON，HTTP ${res.status}`,
      detail: text.slice(0, 500),
    };
  }

  const code = json?.code;
  if (code !== undefined && code !== 0 && code !== "0") {
    return {
      ok: false,
      platform: "TikTok Shop",
      connector: "open-platform",
      error: json?.message || `TikTok API 错误码 ${code}`,
      detail: JSON.stringify(json).slice(0, 800),
    };
  }

  if (!res.ok) {
    return {
      ok: false,
      platform: "TikTok Shop",
      connector: "open-platform",
      error: `HTTP ${res.status}`,
      detail: JSON.stringify(json).slice(0, 800),
    };
  }

  const data = json?.data ?? json;
  const rawList = extractTiktokOrderArray(data);

  const orders_sample = rawList.slice(0, 5).map((o) => ({
    id: o.id ?? o.order_id,
    status: o.order_status ?? o.status,
    create_time: o.create_time ?? o.createTime,
    payment_total: o.payment?.total_amount ?? o.payment_total ?? o.total_amount,
    currency: o.payment?.currency ?? o.currency,
  }));

  return {
    ok: true,
    platform: "TikTok Shop",
    storeName: secret?.storeName || null,
    pulledAt: new Date().toISOString(),
    data: {
      orders_sample,
      products_sample: [],
      note:
        "TikTok：订单 search 样本（query page_size=5，body 为近 90 天时间窗）；商品列表可后续在此连接器扩展。",
      apiVersion: version,
    },
  };
}
