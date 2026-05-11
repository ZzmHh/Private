/**
 * Shopify Admin API、WooCommerce REST — 与 Amazon/TikTok 无关的「经典 Endpoint + Token」形态。
 * 后续若弃用可整目录移除，不影响 sp-api / tiktok 连接器。
 */

function trimSlash(u) {
  return String(u || "").replace(/\/+$/, "");
}

export async function fetchShopifySnapshot({ apiEndpoint, apiToken, storeName }) {
  const token = String(apiToken || "").trim();
  if (!token) {
    return { ok: false, error: "请填写 Shopify Admin API access token（自定义应用）。", platform: "Shopify" };
  }

  let base = trimSlash(apiEndpoint);
  if (!base) {
    return { ok: false, error: "请填写店铺地址，例如 https://你的店.myshopify.com", platform: "Shopify" };
  }

  if (!base.toLowerCase().includes("myshopify.com")) {
    return {
      ok: false,
      error: "Shopify 请使用 *.myshopify.com，例如 https://example.myshopify.com",
      platform: "Shopify",
    };
  }

  const apiBaseMatch = base.match(/^(https:\/\/[^/]+\.myshopify\.com)(\/admin\/api\/[^/]+)?/i);
  const host = apiBaseMatch?.[1] || base;
  const versionPath = apiBaseMatch?.[2] || "/admin/api/2024-07";
  const ordersUrl = `${host}${versionPath}/orders.json?limit=5&status=any`;
  const productsUrl = `${host}${versionPath}/products.json?limit=5`;

  const headers = {
    "Content-Type": "application/json",
    "X-Shopify-Access-Token": token,
  };

  const [orderRes, productRes] = await Promise.all([fetch(ordersUrl, { headers }), fetch(productsUrl, { headers })]);

  const orderText = await orderRes.text();
  const productText = await productRes.text();

  if (!orderRes.ok) {
    return {
      ok: false,
      platform: "Shopify",
      error: `订单接口失败 HTTP ${orderRes.status}。请检查 Admin API 权限（read_orders）与 Token。`,
      detail: orderText.slice(0, 500),
    };
  }

  let orders;
  let products;
  try {
    orders = JSON.parse(orderText);
  } catch {
    return { ok: false, platform: "Shopify", error: "订单响应非 JSON。", detail: orderText.slice(0, 300) };
  }
  try {
    products = productRes.ok ? JSON.parse(productText) : { products: [] };
  } catch {
    products = { products: [] };
  }

  const slimOrders = (orders.orders || []).map((o) => ({
    id: o.id,
    name: o.name,
    created_at: o.created_at,
    financial_status: o.financial_status,
    fulfillment_status: o.fulfillment_status,
    total_price: o.total_price,
    currency: o.currency,
    line_items_count: o.line_items?.length,
  }));

  const slimProducts = (products.products || []).map((pr) => ({
    id: pr.id,
    title: pr.title,
    status: pr.status,
    variants_count: pr.variants?.length,
  }));

  return {
    ok: true,
    platform: "Shopify",
    storeName: storeName || null,
    pulledAt: new Date().toISOString(),
    data: {
      orders_sample: slimOrders,
      products_sample: slimProducts,
      note: "只读样本，每类最多 5 条；非全量后台数据。",
    },
  };
}

export async function fetchWooCommerceSnapshot({ apiEndpoint, apiToken, storeName }) {
  const base = trimSlash(apiEndpoint);
  const raw = String(apiToken || "").trim();
  if (!base) {
    return { ok: false, error: "请填写 WordPress 站点根地址，例如 https://shop.com", platform: "WooCommerce" };
  }
  if (!raw) {
    return { ok: false, error: "请填写 Key，格式：ck_xxx:cs_xxx", platform: "WooCommerce" };
  }

  const colon = raw.indexOf(":");
  if (colon < 0) {
    return {
      ok: false,
      error: "WooCommerce 请将 Consumer Key 与 Secret 用英文冒号连接：ck_xxx:cs_xxx",
      platform: "WooCommerce",
    };
  }
  const ck = raw.slice(0, colon).trim();
  const cs = raw.slice(colon + 1).trim();
  const auth = Buffer.from(`${ck}:${cs}`).toString("base64");

  const ordersUrl = `${base}/wp-json/wc/v3/orders?per_page=5&status=any`;
  const productsUrl = `${base}/wp-json/wc/v3/products?per_page=5`;

  const headers = {
    Authorization: `Basic ${auth}`,
    "Content-Type": "application/json",
  };

  const [orderRes, productRes] = await Promise.all([fetch(ordersUrl, { headers }), fetch(productsUrl, { headers })]);

  const orderText = await orderRes.text();
  const productText = await productRes.text();

  if (!orderRes.ok) {
    return {
      ok: false,
      platform: "WooCommerce",
      error: `订单接口失败 HTTP ${orderRes.status}。请检查 REST Key 权限、Permalink 与站点地址。`,
      detail: orderText.slice(0, 500),
    };
  }

  let orderJson;
  let productJson;
  try {
    orderJson = JSON.parse(orderText);
  } catch {
    return { ok: false, platform: "WooCommerce", error: "订单响应非 JSON。", detail: orderText.slice(0, 300) };
  }
  try {
    productJson = productRes.ok ? JSON.parse(productText) : [];
  } catch {
    productJson = [];
  }

  const list = Array.isArray(orderJson) ? orderJson : [];
  const plist = Array.isArray(productJson) ? productJson : [];

  return {
    ok: true,
    platform: "WooCommerce",
    storeName: storeName || null,
    pulledAt: new Date().toISOString(),
    data: {
      orders_sample: list.map((o) => ({
        id: o.id,
        number: o.number,
        status: o.status,
        date_created: o.date_created,
        total: o.total,
        currency: o.currency,
      })),
      products_sample: plist.map((p) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        stock_status: p.stock_status,
      })),
      note: "只读样本，每类最多 5 条；需在 Woo 后台生成 REST API Key。",
    },
  };
}
