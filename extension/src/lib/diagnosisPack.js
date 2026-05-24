/** 诊断包进度以服务端快照为准（与网站工作台一致） */

const DIAGNOSIS_PAGE_KEYS = ["analytics", "orders", "ads", "inventory"];

const FanmengDiagnosisPack = {
  keys: DIAGNOSIS_PAGE_KEYS,
  _cache: null,
  _cacheAt: 0,
  _cacheTtlMs: 20000,

  pageTypeToPackKey(pageType) {
    const t = String(pageType || "").toLowerCase();
    if (DIAGNOSIS_PAGE_KEYS.includes(t)) return t;
    if (t === "general") return "analytics";
    return null;
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

  _progressFromServerSummary(summary) {
    const pages = summary?.diagnosisPack?.pages || {};
    const missing = DIAGNOSIS_PAGE_KEYS.filter((k) => !pages[k]?.synced);
    const done =
      typeof summary?.diagnosisPack?.done === "number"
        ? summary.diagnosisPack.done
        : DIAGNOSIS_PAGE_KEYS.length - missing.length;
    return {
      done,
      total: summary?.diagnosisPack?.total || DIAGNOSIS_PAGE_KEYS.length,
      missing,
      pack: pages,
      source: "server",
    };
  },

  async fetchProgress(shopId, { force = false } = {}) {
    const now = Date.now();
    if (!force && this._cache && now - this._cacheAt < this._cacheTtlMs) {
      return this._cache;
    }
    try {
      const summary = await FanmengApi.getWorkspaceSummary(shopId);
      const progress = this._progressFromServerSummary(summary);
      this._cache = progress;
      this._cacheAt = now;
      return progress;
    } catch {
      return this.getLocalFallbackProgress(shopId);
    }
  },

  async getProgress(shopId) {
    return this.fetchProgress(shopId);
  },

  async getLocalFallbackProgress(shopId) {
    if (!shopId) {
      return { done: 0, total: 4, missing: [...DIAGNOSIS_PAGE_KEYS], pack: {}, source: "offline" };
    }
    const pack = await FanmengStorage.getDiagnosisPack(shopId);
    const missing = DIAGNOSIS_PAGE_KEYS.filter((k) => !pack[k]?.syncedAt);
    return {
      done: DIAGNOSIS_PAGE_KEYS.length - missing.length,
      total: DIAGNOSIS_PAGE_KEYS.length,
      missing,
      pack,
      source: "local",
    };
  },

  /** 同步成功后刷新服务端进度（不再单独写本地 pack） */
  async markFromScrape(_shopId, _scraped) {
    this._cache = null;
    return null;
  },

  invalidateCache() {
    this._cache = null;
    this._cacheAt = 0;
  },
};

if (typeof globalThis !== "undefined") {
  globalThis.FanmengDiagnosisPack = FanmengDiagnosisPack;
}
