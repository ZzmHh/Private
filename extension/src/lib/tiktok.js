/**
 * 凡梦 TikTok Shop 专用常量（扩展仅服务 TikTok，不做多平台）
 */
const FanmengTikTok = {
  PLATFORM: "tiktok",
  PLATFORM_LABEL: "TikTok Shop",

  DEFAULT_SELLER_URL: "https://seller.tiktok.com/",

  /** 与 manifest.json host_permissions / content_scripts.matches 保持一致 */
  SELLER_URL_PATTERNS: [
    "https://seller.tiktok.com/*",
    "https://seller-us.tiktok.com/*",
    "https://seller.tiktokglobalshop.com/*",
    "https://seller-us.tiktokglobalshop.com/*",
    "https://*.tiktokshop.com/*",
  ],

  /** @returns {boolean} */
  isSellerUrl(url = location.href) {
    try {
      const host = new URL(String(url)).hostname.toLowerCase();
      return (
        host === "seller.tiktok.com" ||
        host === "seller-us.tiktok.com" ||
        host === "seller.tiktokglobalshop.com" ||
        host === "seller-us.tiktokglobalshop.com" ||
        host.endsWith(".tiktokshop.com")
      );
    } catch {
      return false;
    }
  },

  /** 卖家中心区域（用于店铺 metadata / 消息 layout profile 顺序） */
  detectRegion(hostname = location.hostname) {
    const h = String(hostname).toLowerCase();
    if (/seller-us\.tiktokglobalshop/.test(h)) return "us_global";
    if (/seller-us\.tiktok/.test(h)) return "us";
    if (/tiktokglobalshop/.test(h)) return "global_cb";
    if (/seller\.tiktok\.com/.test(h)) return "sea";
    if (/tiktokshop\.com/.test(h)) return "tiktokshop";
    return "unknown";
  },

  /** 聊天 DOM profile 尝试顺序（见 chatSelectors.js） */
  chatProfileOrder(hostname = location.hostname) {
    const h = String(hostname).toLowerCase();
    if (/seller-us\.tiktokglobalshop/.test(h)) return ["us_global", "global_cb", "us", "generic"];
    if (/seller-us\.tiktok/.test(h)) return ["us", "us_global", "generic"];
    if (/tiktokglobalshop/.test(h)) return ["global_cb", "sea", "generic"];
    if (/seller\.tiktok\.com/.test(h)) return ["sea", "global_cb", "generic"];
    if (/tiktokshop\.com/.test(h)) return ["sea", "generic"];
    return ["generic", "sea", "us", "global_cb"];
  },

  regionLabel(region) {
    const map = {
      us: "美国",
      us_global: "美国跨境",
      global_cb: "跨境 Global",
      sea: "东南亚",
      tiktokshop: "TikTok Shop",
      unknown: "未知区域",
    };
    return map[region] || region;
  },

  buildShopId(shopName, hostname = location.hostname) {
    const name = String(shopName || "TikTok Shop")
      .replace(/\s+/g, "_")
      .slice(0, 40)
      .toLowerCase();
    const host = String(hostname).replace(/\./g, "_");
    return `tiktok_${name}_${host}`;
  },

  /** 统一店铺对象：platform 恒为 tiktok */
  normalizeShop(shop = {}) {
    return {
      ...shop,
      platform: FanmengTikTok.PLATFORM,
      region: shop.region || FanmengTikTok.detectRegion(),
      updatedAt: shop.updatedAt || new Date().toISOString(),
    };
  },
};

if (typeof globalThis !== "undefined") {
  globalThis.FanmengTikTok = FanmengTikTok;
}
