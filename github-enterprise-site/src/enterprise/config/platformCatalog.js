/** 企业站平台目录（与 server/enterpriseOrgShops PLATFORM_CATALOG 对齐） */
export const PLATFORM_CATALOG = {
  shopee: { label: "Shopee", regionGroup: "sea", color: "#EE4D2D", authMode: "oauth_sign" },
  tiktok: { label: "TikTok Shop", regionGroup: "sea", color: "#18181B", authMode: "oauth_sign" },
  lazada: { label: "Lazada", regionGroup: "sea", color: "#0F146D", authMode: "oauth_sign" },
  ozon: { label: "Ozon", regionGroup: "other", color: "#005BFF", authMode: "api_key" },
  walmart: { label: "Walmart", regionGroup: "other", color: "#0071CE", authMode: "oauth" },
};

export const MARKET_LABELS = {
  SG: "新加坡",
  MY: "马来西亚",
  TH: "泰国",
  ID: "印尼",
  VN: "越南",
  PH: "菲律宾",
  RU: "俄罗斯",
  US: "美国",
};

/** @param {string} platform */
export function platformUsesOAuth(platform) {
  const mode = PLATFORM_CATALOG[platform]?.authMode;
  return mode === "oauth" || mode === "oauth_sign";
}

/** @param {string} platform */
export function platformUsesApiKeyForm(platform) {
  return PLATFORM_CATALOG[platform]?.authMode === "api_key";
}

/** OAuth 路由 slug（与 /api/enterprise/admin/shops/:id/oauth/:slug 一致） */
export const PLATFORM_OAUTH_SLUG = {
  shopee: "shopee",
  tiktok: "tiktok",
  lazada: "lazada",
  walmart: "walmart",
};

/** 各平台可用站点（添加店铺时按平台过滤，避免 Ozon 选泰国这类无效组合） */
export const PLATFORM_MARKETS = {
  shopee: ["SG", "MY", "TH", "ID", "VN", "PH"],
  tiktok: ["SG", "MY", "TH", "ID", "VN", "PH"],
  lazada: ["SG", "MY", "TH", "ID", "VN", "PH"],
  ozon: ["RU"],
  walmart: ["US"],
};

/** @param {string} platform */
export function marketsForPlatform(platform) {
  return (PLATFORM_MARKETS[platform] || ["SG", "MY", "TH", "ID", "VN", "PH"]).map((value) => ({
    value,
    label: MARKET_LABELS[value] || value,
  }));
}

/** @param {string} platform */
export function defaultMarketForPlatform(platform) {
  const list = PLATFORM_MARKETS[platform];
  return list?.[0] || "TH";
}
