import { ECHOTIK_MARKETS, ECHOTIK_MARKET_ORDER } from "./markets.js";

function normalizeText(input = "") {
  return String(input || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function detectMarketFromText(input = "") {
  const text = normalizeText(input);
  if (!text) return null;

  let best = null;
  for (const code of ECHOTIK_MARKET_ORDER) {
    const market = ECHOTIK_MARKETS[code];
    for (const alias of market.aliases) {
      const needle = alias.toLowerCase();
      if (text.includes(needle)) {
        if (!best || needle.length > best.aliasLength) {
          best = { code, market, aliasLength: needle.length };
        }
      }
    }
  }

  return best?.code || null;
}

export function extractCategoryKeywords(input = "", marketCode = null) {
  let text = String(input || "");
  if (marketCode) {
    const market = ECHOTIK_MARKETS[marketCode];
    if (market) {
      for (const alias of market.aliases) {
        text = text.replace(new RegExp(alias, "gi"), " ");
      }
    }
  }

  return text
    .replace(/[，。！？、,.!?;；:/\\|()[\]{}「」"'`~]/g, " ")
    .split(/\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 2);
}
