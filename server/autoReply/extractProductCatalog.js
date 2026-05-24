/**
 * 从插件快照提取可匹配的商品线索（标题 + 页面摘录）
 */

function tokenizeName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 2);
}

function extractFromTables(data, pageType, pageUrl, title) {
  const items = [];
  if (!data?.tables?.length) return items;
  for (const table of data.tables.slice(0, 5)) {
    const rows = table.rows || [];
    for (const row of rows.slice(0, 40)) {
      if (!Array.isArray(row) || !row.length) continue;
      const name = String(row[0] || row.find((c) => String(c).length > 3) || "").trim();
      if (name.length < 3 || name.length > 200) continue;
      const snippet = row.slice(0, 4).join(" | ").slice(0, 400);
      items.push({
        id: `${pageType}::${name.slice(0, 60)}`,
        name,
        snippet,
        pageType,
        pageUrl,
        title,
        tokens: tokenizeName(name),
      });
    }
  }
  return items;
}

function extractFromTextSample(data, pageType, pageUrl, title) {
  const sample = String(data?.textSample || "").trim();
  if (sample.length < 20) return [];
  const pageTitle = String(title || data?.shopHint?.name || "").trim();
  const name =
    pageTitle.length >= 3 && pageTitle.length <= 160
      ? pageTitle
      : sample.slice(0, 80).replace(/\s+/g, " ").trim();
  if (name.length < 3) return [];
  return [
    {
      id: `${pageType}::page`,
      name,
      snippet: sample.slice(0, 600),
      pageType,
      pageUrl,
      title,
      tokens: tokenizeName(name),
    },
  ];
}

/**
 * @param {{ pages?: object[] } | null} mergedContext
 */
export function extractProductCatalog(mergedContext) {
  const pages = mergedContext?.pages || [];
  const byId = new Map();

  for (const page of pages) {
    const pageType = page.pageType || "general";
    if (!["inventory", "product", "orders", "general"].includes(pageType)) continue;

    const fromTables = extractFromTables(page.data, pageType, page.pageUrl, page.title);
    const fromText =
      pageType === "product" || pageType === "inventory"
        ? extractFromTextSample(page.data, pageType, page.pageUrl, page.title)
        : [];

    for (const item of [...fromTables, ...fromText]) {
      const key = item.name.toLowerCase().slice(0, 80);
      if (!byId.has(key) || item.snippet.length > (byId.get(key).snippet?.length || 0)) {
        byId.set(key, item);
      }
    }
  }

  return [...byId.values()].slice(0, 80);
}

/**
 * @param {string} buyerText
 * @param {ReturnType<typeof extractProductCatalog>} catalog
 */
export function matchProductInquiry(buyerText, catalog = []) {
  const text = String(buyerText || "").toLowerCase();
  if (!text.trim() || !catalog.length) return null;

  let best = null;
  let bestScore = 0;

  for (const item of catalog) {
    let score = 0;
    for (const token of item.tokens || []) {
      if (token.length >= 3 && text.includes(token)) score += token.length >= 5 ? 4 : 2;
    }
    const nameLower = item.name.toLowerCase();
    if (nameLower.length >= 4 && text.includes(nameLower.slice(0, Math.min(nameLower.length, 24)))) score += 5;
    if (score > bestScore) {
      bestScore = score;
      best = { ...item, score };
    }
  }

  if (!best || bestScore < 3) return null;
  return {
    id: best.id,
    name: best.name,
    snippet: best.snippet,
    pageType: best.pageType,
    score: best.score,
  };
}
