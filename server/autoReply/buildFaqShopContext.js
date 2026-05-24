/**
 * 从插件页面快照合并 FAQ 生成所需的店铺上下文
 */

const PAGE_TYPE_LABELS = {
  inventory: "商品/库存",
  product: "商品详情",
  orders: "订单/发货",
  shipping: "物流",
  analytics: "店铺概览",
  chat: "客服聊天",
  ads: "广告",
  general: "其他页面",
};

function pickTextSample(data, max = 2500) {
  if (!data || typeof data !== "object") return "";
  const parts = [];
  if (data.textSample) parts.push(String(data.textSample));
  if (Array.isArray(data.statCards)) {
    for (const c of data.statCards.slice(0, 12)) {
      if (c?.label || c?.value) parts.push(`${c.label || ""}: ${c.value || ""}`.trim());
    }
  }
  if (Array.isArray(data.metrics)) {
    for (const m of data.metrics.slice(0, 16)) {
      if (m?.label || m?.value) parts.push(`${m.label || ""} ${m.value || ""}`.trim());
    }
  }
  if (Array.isArray(data.tables)) {
    for (const t of data.tables.slice(0, 3)) {
      for (const row of (t.rows || []).slice(0, 6)) {
        parts.push(row.join(" | "));
      }
    }
  }
  return parts.join("\n").replace(/\s+/g, " ").trim().slice(0, max);
}

function formatPageBlock(page) {
  const type = page.pageType || "general";
  const label = PAGE_TYPE_LABELS[type] || type;
  const lines = [
    `=== ${label} (${page.title || "无标题"}) ===`,
    page.pageUrl ? `URL: ${page.pageUrl}` : "",
    page.pulledAt ? `抓取时间: ${page.pulledAt}` : "",
  ].filter(Boolean);

  const sample = pickTextSample(page.data);
  if (sample) lines.push("页面摘录:", sample);

  if (page.data?.shopHint?.name) {
    lines.push(`店铺名线索: ${page.data.shopHint.name}`);
  }
  if (page.data?.latestBuyerMessage) {
    lines.push(`最近买家消息样例: ${String(page.data.latestBuyerMessage).slice(0, 200)}`);
  }

  return lines.join("\n");
}

function dedupePages(pages) {
  const byKey = new Map();
  for (const p of pages) {
    const key = `${p.pageType || "general"}::${(p.pageUrl || "").split("?")[0]}`;
    const prev = byKey.get(key);
    const ts = p.pulledAt || "";
    if (!prev || ts > (prev.pulledAt || "")) byKey.set(key, p);
  }
  return [...byKey.values()];
}

function inferPrimaryLang(region, shopName = "") {
  const r = String(region || "").toLowerCase();
  const map = {
    us: "en",
    us_global: "en",
    global_cb: "en",
    sea: "en",
    mock: "en",
  };
  if (map[r]) return map[r];
  if (/[\u4e00-\u9fff]/.test(shopName)) return "zh";
  return "en";
}

function buildHints(pageTypes) {
  const hints = [];
  const has = (t) => pageTypes.includes(t);
  if (!pageTypes.length) {
    hints.push("请先在 TikTok 卖家中心用插件点「同步本页」，至少同步 1 个页面（建议：商品页 + 订单/发货页）。");
    return hints;
  }
  if (!has("inventory") && !has("product")) {
    hints.push("建议再打开「商品/库存」页并点插件「同步本页」，FAQ 可包含尺码、规格类回复。");
  }
  if (!has("orders") && !has("shipping") && !has("analytics")) {
    hints.push("建议同步「订单/发货」或店铺概览页，便于生成物流时效类 FAQ。");
  }
  if (pageTypes.length === 1 && has("chat")) {
    hints.push("当前仅有聊天页数据，生成的 FAQ 会较通用，建议补充商品与物流页面。");
  }
  return hints;
}

/**
 * @param {{ mergedContext?: object|null, inlinePages?: object[], shopName?: string, primaryLang?: string }} input
 */
export function buildFaqShopContext(input = {}) {
  const mergedPages = (input.mergedContext?.pages || []).map((p) => ({
    pageType: p.pageType,
    pageUrl: p.pageUrl,
    title: p.title,
    pulledAt: p.pulledAt,
    shopName: p.shopName,
    data: p.data,
  }));

  const inlinePages = (input.inlinePages || []).map((p) => ({
    pageType: p.pageType || "general",
    pageUrl: p.pageUrl || "",
    title: p.title || "",
    pulledAt: new Date().toISOString(),
    shopName: p.shopName || input.shopName || "",
    data: p.data || {},
  }));

  const pages = dedupePages([...mergedPages, ...inlinePages]);
  const pageTypes = [...new Set(pages.map((p) => p.pageType || "general"))];

  let shopName = String(input.shopName || "").trim();
  if (!shopName) {
    shopName =
      pages.find((p) => p.shopName)?.shopName ||
      pages.find((p) => p.data?.shopHint?.name)?.data?.shopHint?.name ||
      "";
  }

  const region =
    pages.find((p) => p.data?.shopHint?.region)?.data?.shopHint?.region ||
    input.mergedContext?.pages?.[0]?.data?.shopHint?.region ||
    "";

  const primaryLang = input.primaryLang || inferPrimaryLang(region, shopName);
  const textBlock = pages.map(formatPageBlock).join("\n\n").slice(0, 14000);
  const hints = buildHints(pageTypes);

  return {
    shopName: shopName.slice(0, 200),
    region,
    primaryLang,
    pageTypes,
    snapshotCount: pages.length,
    textBlock,
    hints,
    ready: pages.length >= 1 && textBlock.length >= 40,
    latestAt: pages[0]?.pulledAt || input.mergedContext?.latestAt || null,
  };
}

export function extractKnownPrices(textBlock) {
  const prices = new Set();
  const re = /(?:\$|USD|US\$|€|£|¥|RM|Rp|₱|₫|฿)\s*[\d,.]+|[\d,.]+\s*(?:USD|usd|美元|元)/g;
  let m;
  while ((m = re.exec(textBlock)) && prices.size < 30) {
    prices.add(m[0].trim());
  }
  return [...prices];
}
