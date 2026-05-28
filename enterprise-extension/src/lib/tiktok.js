const EnterpriseTikTok = {
  PLATFORM: "tiktok",
  PLATFORM_LABEL: "TikTok Shop",
  SELLER_URL_PATTERNS: [
    "https://seller.tiktok.com/*",
    "https://seller-us.tiktok.com/*",
    "https://seller.tiktokglobalshop.com/*",
    "https://seller-us.tiktokglobalshop.com/*",
    "https://*.tiktokshop.com/*",
  ],
};

if (typeof globalThis !== "undefined") {
  globalThis.EnterpriseTikTok = EnterpriseTikTok;
}
