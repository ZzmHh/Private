/** 诊断包：四类页面凑齐后跑 growth/profit 更可靠 */

const DIAGNOSIS_PAGE_KEYS = ["analytics", "orders", "ads", "inventory"];

const FanmengDiagnosisPack = {
  keys: DIAGNOSIS_PAGE_KEYS,

  pageTypeToPackKey(pageType) {
    const t = String(pageType || "").toLowerCase();
    if (DIAGNOSIS_PAGE_KEYS.includes(t)) return t;
    if (t === "general") return "analytics";
    return null;
  },

  async getProgress(shopId) {
    if (!shopId) return { done: 0, total: 4, missing: [...DIAGNOSIS_PAGE_KEYS], pack: {} };
    const pack = await FanmengStorage.getDiagnosisPack(shopId);
    const missing = DIAGNOSIS_PAGE_KEYS.filter((k) => !pack[k]?.syncedAt);
    const done = DIAGNOSIS_PAGE_KEYS.length - missing.length;
    return { done, total: DIAGNOSIS_PAGE_KEYS.length, missing, pack };
  },

  async markFromScrape(shopId, scraped) {
    const key = this.pageTypeToPackKey(scraped.pageType);
    if (!key || !shopId) return null;
    return FanmengStorage.markDiagnosisPage(shopId, key, {
      pageUrl: scraped.pageUrl,
      title: scraped.title,
      pageType: scraped.pageType,
    });
  },

  labelForKey(key) {
    return (
      {
        analytics: "数据概览",
        orders: "订单",
        ads: "广告",
        inventory: "库存/商品",
      }[key] || key
    );
  },
};

if (typeof globalThis !== "undefined") {
  globalThis.FanmengDiagnosisPack = FanmengDiagnosisPack;
}
