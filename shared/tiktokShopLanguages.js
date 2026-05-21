/**
 * TikTok Shop 站点语言（FAQ / 客服模板）
 * 覆盖商家指定的 15 国站点；code 为 ISO 639-1 语言码。
 */

/** 15 个目标站点（国家/地区） */
export const TIKTOK_SHOP_MARKETS = [
  { code: "US", nameZh: "美国", flag: "🇺🇸", languages: ["en"] },
  { code: "MX", nameZh: "墨西哥", flag: "🇲🇽", languages: ["es"] },
  { code: "BR", nameZh: "巴西", flag: "🇧🇷", languages: ["pt"] },
  { code: "VN", nameZh: "越南", flag: "🇻🇳", languages: ["vi"] },
  { code: "TH", nameZh: "泰国", flag: "🇹🇭", languages: ["th"] },
  { code: "PH", nameZh: "菲律宾", flag: "🇵🇭", languages: ["en", "fil"] },
  { code: "MY", nameZh: "马来西亚", flag: "🇲🇾", languages: ["ms", "en", "zh"] },
  { code: "ID", nameZh: "印尼", flag: "🇮🇩", languages: ["id"] },
  { code: "SG", nameZh: "新加坡", flag: "🇸🇬", languages: ["en", "zh"] },
  { code: "JP", nameZh: "日本", flag: "🇯🇵", languages: ["ja"] },
  { code: "UK", nameZh: "英国", flag: "🇬🇧", languages: ["en"] },
  { code: "ES", nameZh: "西班牙", flag: "🇪🇸", languages: ["es"] },
  { code: "DE", nameZh: "德国", flag: "🇩🇪", languages: ["de"] },
  { code: "IT", nameZh: "意大利", flag: "🇮🇹", languages: ["it"] },
  { code: "FR", nameZh: "法国", flag: "🇫🇷", languages: ["fr"] },
];

export const TIKTOK_SHOP_LANGUAGES = [
  { code: "en", label: "English", labelZh: "英语", markets: ["US", "UK", "PH", "MY", "SG"] },
  { code: "es", label: "Español", labelZh: "西班牙语", markets: ["MX", "ES"] },
  { code: "pt", label: "Português", labelZh: "葡萄牙语", markets: ["BR"] },
  { code: "vi", label: "Tiếng Việt", labelZh: "越南语", markets: ["VN"] },
  { code: "th", label: "ภาษาไทย", labelZh: "泰语", markets: ["TH"] },
  { code: "fil", label: "Filipino / Tagalog", labelZh: "菲律宾语", markets: ["PH"] },
  { code: "ms", label: "Bahasa Melayu", labelZh: "马来语", markets: ["MY"] },
  { code: "zh", label: "中文", labelZh: "中文", markets: ["MY", "SG"] },
  { code: "id", label: "Bahasa Indonesia", labelZh: "印尼语", markets: ["ID"] },
  { code: "ja", label: "日本語", labelZh: "日语", markets: ["JP"] },
  { code: "de", label: "Deutsch", labelZh: "德语", markets: ["DE"] },
  { code: "it", label: "Italiano", labelZh: "意大利语", markets: ["IT"] },
  { code: "fr", label: "Français", labelZh: "法语", markets: ["FR"] },
];

/** 下拉分组：按区域展示上述 15 国 */
export const TIKTOK_SHOP_LANGUAGE_GROUPS = [
  {
    id: "americas",
    label: "美洲（美国 · 墨西哥 · 巴西）",
    marketCodes: ["US", "MX", "BR"],
    codes: ["en", "es", "pt"],
  },
  {
    id: "sea",
    label: "东南亚（越 · 泰 · 菲 · 马 · 印尼 · 新加坡）",
    marketCodes: ["VN", "TH", "PH", "MY", "ID", "SG"],
    codes: ["vi", "th", "en", "fil", "ms", "zh", "id"],
  },
  {
    id: "japan",
    label: "日本",
    marketCodes: ["JP"],
    codes: ["ja"],
  },
  {
    id: "europe",
    label: "欧洲（英 · 西 · 德 · 意 · 法）",
    marketCodes: ["UK", "ES", "DE", "IT", "FR"],
    codes: ["en", "es", "de", "it", "fr"],
  },
];

const CODE_SET = new Set(TIKTOK_SHOP_LANGUAGES.map((l) => l.code));
const MARKET_SET = new Set(TIKTOK_SHOP_MARKETS.map((m) => m.code));

const LANG_ALIASES = {
  en: ["en", "en-us", "en-gb", "english", "eng", "英语", "英文", "美国", "英国", "菲律宾", "新加坡", "马来西亚"],
  es: ["es", "spanish", "español", "西班牙语", "墨西哥", "西班牙"],
  pt: ["pt", "pt-br", "portuguese", "português", "葡萄牙语", "巴西"],
  vi: ["vi", "vietnamese", "viet", "越南语", "越南", "tiếng việt"],
  th: ["th", "thai", "ภาษาไทย", "泰语", "泰国"],
  fil: ["fil", "tl", "tagalog", "filipino", "菲律宾语", "他加禄"],
  ms: ["ms", "malay", "melayu", "马来语", "马来西亚", "bahasa melayu"],
  zh: ["zh", "zh-cn", "zh-tw", "cn", "chinese", "中文", "汉语", "华语", "新加坡"],
  id: ["id", "indonesian", "bahasa indonesia", "印尼语", "印度尼西亚", "indonesia"],
  ja: ["ja", "japanese", "日本語", "日语", "日本"],
  de: ["de", "german", "deutsch", "德语", "德国"],
  it: ["it", "italian", "italiano", "意大利语", "意大利"],
  fr: ["fr", "french", "français", "法语", "法国"],
};

const LATIN_FALLBACK = new Set(["en", "es", "pt", "fr", "de", "it", "fil", "id", "ms"]);

export function normalizeFaqLang(raw) {
  const s = String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-");
  if (!s || s === "any" || s === "auto" || s === "通用") return "";

  for (const [code, aliases] of Object.entries(LANG_ALIASES)) {
    if (s === code || aliases.some((a) => s === a || s.includes(a))) return code;
  }

  const base = s.split("-")[0];
  if (CODE_SET.has(base)) return base;
  return CODE_SET.has(s) ? s : "en";
}

export function normalizeMarketCode(raw) {
  const s = String(raw || "")
    .trim()
    .toUpperCase();
  if (!s) return "";
  const map = {
    美国: "US",
    墨西哥: "MX",
    巴西: "BR",
    越南: "VN",
    泰国: "TH",
    菲律宾: "PH",
    马来西亚: "MY",
    印尼: "ID",
    印度尼西亚: "ID",
    新加坡: "SG",
    日本: "JP",
    英国: "UK",
    西班牙: "ES",
    德国: "DE",
    意大利: "IT",
    法国: "FR",
  };
  if (map[s]) return map[s];
  return MARKET_SET.has(s) ? s : "";
}

export function getLanguageMeta(code) {
  return TIKTOK_SHOP_LANGUAGES.find((l) => l.code === code) || null;
}

export function getMarketMeta(code) {
  return TIKTOK_SHOP_MARKETS.find((m) => m.code === code) || null;
}

export function getLanguageLabel(code, { zh = true } = {}) {
  const meta = getLanguageMeta(code);
  if (!meta) return code || "通用";
  return zh ? `${meta.labelZh} · ${meta.label}` : meta.label;
}

export function langCompatible(templateLang, buyerLang) {
  const tpl = normalizeFaqLang(templateLang);
  const buyer = normalizeFaqLang(buyerLang);
  if (!tpl) return true;
  if (!buyer) return true;
  if (tpl === buyer) return true;
  if (LATIN_FALLBACK.has(tpl) && LATIN_FALLBACK.has(buyer) && tpl === "en") return true;
  return false;
}

export function detectBuyerLanguage(buyerText) {
  const text = String(buyerText || "");
  if (!text.trim()) return "en";

  const scriptCounts = {
    zh: (text.match(/[\u4e00-\u9fff]/g) || []).length,
    ja: (text.match(/[\u3040-\u30ff\u31f0-\u31ff]/g) || []).length,
    th: (text.match(/[\u0e00-\u0e7f]/g) || []).length,
  };

  if (scriptCounts.th >= 2) return "th";
  if (scriptCounts.ja >= 2) return "ja";
  if (scriptCounts.zh >= 2) return "zh";

  const lower = text.toLowerCase();

  if (/[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(text)) return "vi";

  if (/\b(magkano|paano|salamat|po\b|opo|kailan|ilan|presyo|padala)\b/i.test(lower)) return "fil";
  if (/\b(berapa|harga|pengiriman|stok|terima kasih|apakah|kapan|ongkir)\b/i.test(lower)) return "id";
  if (/\b(berapa|harga|penghantaran|stok|terima kasih)\b/i.test(lower) && /\b(boleh|tak)\b/i.test(lower)) return "ms";

  if (/\b(cuánto|cuanto|precio|envío|envio|hola|gracias|cuando|dónde|donde)\b/i.test(lower) || /¿/.test(text)) {
    return "es";
  }
  if (/\b(preço|preco|envio|obrigado|obrigada|quantos|você|voce|não|nao)\b/i.test(lower)) return "pt";
  if (/\b(bonjour|merci|prix|livraison|combien|expédition)\b/i.test(lower)) return "fr";
  if (/\b(hallo|danke|preis|versand|wie viel|lieferung)\b/i.test(lower)) return "de";
  if (/\b(ciao|grazie|prezzo|spedizione|quanto|costo)\b/i.test(lower)) return "it";

  const latin = (text.match(/[a-zA-Z]/g) || []).length;
  if (latin >= 4) return "en";
  if (scriptCounts.zh >= 1) return "zh";
  return "en";
}

export function buildLanguageSelectOptions() {
  return TIKTOK_SHOP_MARKETS.map((market) => ({
    id: market.code,
    label: `${market.flag} ${market.nameZh}`,
    options: market.languages.map((code) => {
      const lang = getLanguageMeta(code);
      return {
        value: code,
        label: lang ? `${lang.labelZh} · ${lang.label}` : code,
        market: market.code,
      };
    }),
  }));
}

export function listLanguagesForApi() {
  return {
    markets: TIKTOK_SHOP_MARKETS,
    languages: TIKTOK_SHOP_LANGUAGES,
    groups: TIKTOK_SHOP_LANGUAGE_GROUPS.map((g) => ({
      ...g,
      items: g.codes
        .map((code) => TIKTOK_SHOP_LANGUAGES.find((l) => l.code === code))
        .filter(Boolean),
    })),
    countrySelect: buildLanguageSelectOptions(),
  };
}
