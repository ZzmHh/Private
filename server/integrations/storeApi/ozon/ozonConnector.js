/**
 * Ozon Seller API — 独立连接器（Client-Id + Api-Key）
 *
 * apiToken JSON：{ "client_id": "...", "api_key": "..." }
 * 或 apiEndpoint 存 Client-Id、apiToken 存 Api-Key（纯 Key 模式）
 */

const DEFAULT_BASE = "https://api-seller.ozon.ru";

/** @typedef {{ clientId?: string, apiKey?: string }} OzonParsedCredentials */

/**
 * @param {import("../types.js").StoreConnectionSecret} secret
 * @returns {OzonParsedCredentials | null}
 */
export function parseOzonCredentials(secret) {
  const raw = String(secret?.apiToken || "").trim();
  if (raw.startsWith("{")) {
    try {
      const j = JSON.parse(raw);
      return {
        clientId: j.client_id || j.clientId,
        apiKey: j.api_key || j.apiKey,
      };
    } catch {
      return null;
    }
  }
  const clientId = String(secret?.apiEndpoint || "").trim();
  if (clientId && raw) {
    return { clientId, apiKey: raw };
  }
  return null;
}

function resolveBaseUrl(secret) {
  const raw = String(secret?.apiEndpoint || "").trim();
  if (raw.startsWith("http")) return raw.replace(/\/+$/, "");
  return process.env.OZON_API_BASE_URL?.trim() || DEFAULT_BASE;
}

/**
 * @param {string} base
 * @param {string} path
 * @param {OzonParsedCredentials} creds
 * @param {object} body
 */
async function ozonPost(base, path, creds, body) {
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Client-Id": creds.clientId || "",
      "Api-Key": creds.apiKey || "",
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: "响应非 JSON", detail: text.slice(0, 500), httpStatus: res.status };
  }
  if (!res.ok || json.error) {
    return {
      ok: false,
      error: json.message || json.error?.message || `HTTP ${res.status}`,
      detail: text.slice(0, 600),
      httpStatus: res.status,
    };
  }
  return { ok: true, data: json.result ?? json };
}

/**
 * @param {import("../types.js").StoreConnectionSecret} secret
 */
export async function fetchOzonSnapshot(secret) {
  const parsed = parseOzonCredentials(secret);

  if (!parsed?.clientId || !parsed?.apiKey) {
    return {
      ok: false,
      platform: "Ozon",
      connector: "seller-api",
      error: "未检测到 Client-Id 与 Api-Key。",
      hint: 'apiToken 设为 JSON：{"client_id":"...","api_key":"..."}；或 apiEndpoint=Client-Id、apiToken=Api-Key。',
      nextSteps: [
        "Ozon Seller 后台 → API 密钥：创建 Client-Id 与 Api-Key",
        "粘贴到企业控制台「绑定 API」",
      ],
    };
  }

  const base = resolveBaseUrl(secret);
  let orders_sample = [];
  let products_sample = [];

  try {
    const prodRes = await ozonPost(base, "/v3/product/list", parsed, {
      filter: { visibility: "ALL" },
      limit: 5,
      last_id: "",
    });

    if (prodRes.ok) {
      const items = prodRes.data?.items || [];
      products_sample = items.slice(0, 5).map((it) => ({
        id: it.product_id,
        title: it.name || `Product ${it.product_id}`,
        sku: it.offer_id,
        status: it.visible ? "visible" : "hidden",
      }));
    }

    const orderRes = await ozonPost(base, "/v3/posting/fbs/list", parsed, {
      dir: "ASC",
      filter: { since: new Date(Date.now() - 90 * 86400000).toISOString(), to: new Date().toISOString() },
      limit: 5,
      offset: 0,
    });

    if (orderRes.ok) {
      const postings = orderRes.data?.postings || [];
      orders_sample = postings.slice(0, 5).map((p) => ({
        id: p.posting_number,
        status: p.status,
        create_time: p.in_process_at || p.created_at,
      }));
    }

    if (!prodRes.ok && !orderRes.ok) {
      return {
        ok: false,
        platform: "Ozon",
        connector: "seller-api",
        error: prodRes.error || orderRes.error || "拉取失败",
        detail: prodRes.detail || orderRes.detail,
      };
    }
  } catch (e) {
    return {
      ok: false,
      platform: "Ozon",
      connector: "seller-api",
      error: `请求失败：${e?.message || String(e)}`,
    };
  }

  return {
    ok: true,
    platform: "Ozon",
    storeName: secret?.storeName || null,
    pulledAt: new Date().toISOString(),
    data: {
      orders_sample,
      products_sample,
      note: "Ozon：FBS 订单与商品列表各取前 5 条。",
    },
  };
}

/**
 * @param {string} clientId
 * @param {string} apiKey
 */
export function buildOzonConnectionTokenJson(clientId, apiKey) {
  return JSON.stringify({
    client_id: String(clientId).trim(),
    api_key: String(apiKey).trim(),
  });
}
