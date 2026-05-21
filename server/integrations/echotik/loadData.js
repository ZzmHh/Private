import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ECHOTIK_MARKETS, ECHOTIK_MARKET_ORDER } from "./markets.js";
import { detectMarketFromText, extractCategoryKeywords } from "./detectMarket.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "../../../data/echotik");

function readJsonSafe(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function scoreItem(item, keywords) {
  if (!keywords.length) return item.rank ? 1000 - Number(item.rank) : 0;
  const haystack = [
    item.title,
    item.titleZh,
    item.category,
    ...(item.keywordTags || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  let score = 0;
  for (const kw of keywords) {
    if (haystack.includes(kw.toLowerCase())) score += 10;
  }
  if (item.rank) score += Math.max(0, 40 - Number(item.rank));
  return score;
}

export function loadMarketCatalogMeta() {
  const manifest = readJsonSafe(path.join(DATA_DIR, "manifest.json")) || {};
  const markets = {};

  for (const code of ECHOTIK_MARKET_ORDER) {
    const market = ECHOTIK_MARKETS[code];
    const fileData = readJsonSafe(path.join(DATA_DIR, `${code}.json`));
    const manifestEntry = manifest.markets?.[code] || {};
    const items = Array.isArray(fileData?.items) ? fileData.items : [];
    markets[code] = {
      code,
      name: market.name,
      flag: market.flag,
      source: manifest.source || fileData?.source || "EchoTik",
      count: items.length || manifestEntry.count || 0,
      manifestCount: manifestEntry.count || items.length || 0,
      updatedAt: fileData?.updatedAt || manifestEntry.updatedAt || manifest.updatedAt || null,
      loaded: items.length > 0,
    };
  }

  return {
    source: manifest.source || "EchoTik",
    updatedAt: manifest.updatedAt || null,
    markets,
  };
}

export function loadMarketTopItems(marketCode, { keywords = [], limit = 30 } = {}) {
  const market = ECHOTIK_MARKETS[marketCode];
  if (!market) return { market: null, items: [], keywords, limit };

  const fileData = readJsonSafe(path.join(DATA_DIR, `${marketCode}.json`));
  const items = Array.isArray(fileData?.items) ? fileData.items : [];
  const ranked = [...items]
    .map((item) => ({ item, score: scoreItem(item, keywords) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.item);

  return {
    market: {
      code: marketCode,
      name: market.name,
      flag: market.flag,
      source: fileData?.source || "EchoTik",
      totalLoaded: items.length,
    },
    keywords,
    limit,
    items: ranked,
  };
}

export function buildEchoTikContext(input = "") {
  const marketCode = detectMarketFromText(input);
  const keywords = extractCategoryKeywords(input, marketCode);
  const catalog = loadMarketCatalogMeta();

  if (!marketCode) {
    return {
      detected: false,
      catalog,
      hint: "未识别市场关键词。可输入如「菲律宾宠物用品」「马来西亚美妆」以自动加载 EchoTik 样本。",
    };
  }

  const top = loadMarketTopItems(marketCode, { keywords, limit: 30 });
  const marketMeta = catalog.markets[marketCode];

  return {
    detected: true,
    marketCode,
    marketName: top.market?.name,
    marketFlag: top.market?.flag,
    keywords,
    catalogStats: marketMeta,
    sampleCount: top.items.length,
    totalLoaded: top.market?.totalLoaded || 0,
    source: top.market?.source || "EchoTik",
    topItems: top.items,
    disclaimer:
      "EchoTik 榜单为第三方时点样本，非 TikTok 官方实时数据；结论需与后台/多源交叉验证。",
  };
}
