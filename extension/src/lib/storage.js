/** @typedef {{ apiBase: string, token: string, autoSync: boolean, autoSyncMinutes: number, autoCsListen: boolean, autoDiagnosisSync: boolean, shopName: string, activeShopId: string }} FanmengSettings */

/** @typedef {{ id: string, name: string, platform: 'tiktok', region?: string, updatedAt: string }} FanmengShop */

/** @typedef {{ id: string, name: string, text: string, shopId?: string, updatedAt: string }} ReplyTemplate */

const DEFAULT_SETTINGS = {
  apiBase: (typeof FanmengExtensionConfig !== "undefined" && FanmengExtensionConfig.DEFAULT_API_BASE) || "http://127.0.0.1:8787",
  token: "",
  autoSync: false,
  autoSyncMinutes: 15,
  autoCsListen: true,
  autoDiagnosisSync: true,
  shopName: "",
  activeShopId: "",
};

function uid() {
  return `fm_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

const FanmengStorage = {
  async getSettings() {
    const data = await chrome.storage.local.get(["fanmeng_settings"]);
    return { ...DEFAULT_SETTINGS, ...(data.fanmeng_settings || {}) };
  },
  async saveSettings(partial) {
    const cur = await this.getSettings();
    const next = { ...cur, ...partial };
    await chrome.storage.local.set({ fanmeng_settings: next });
    return next;
  },
  async clearAuth() {
    const cur = await this.getSettings();
    await chrome.storage.local.set({ fanmeng_settings: { ...cur, token: "" } });
  },

  async getShops() {
    const data = await chrome.storage.local.get(["fanmeng_shops"]);
    return Array.isArray(data.fanmeng_shops) ? data.fanmeng_shops : [];
  },
  async saveShops(shops) {
    await chrome.storage.local.set({ fanmeng_shops: shops });
  },
  async upsertShop(shop) {
    const shops = await this.getShops();
    const idx = shops.findIndex((s) => s.id === shop.id);
    const row = FanmengTikTok.normalizeShop({ ...shop, updatedAt: new Date().toISOString() });
    if (idx >= 0) shops[idx] = { ...shops[idx], ...row };
    else shops.unshift(row);
    await this.saveShops(shops.slice(0, 20));
    return row;
  },
  async getActiveShop() {
    const settings = await this.getSettings();
    const shops = await this.getShops();
    if (!settings.activeShopId) return shops[0] || null;
    return shops.find((s) => s.id === settings.activeShopId) || shops[0] || null;
  },
  async setActiveShopId(id) {
    await this.saveSettings({ activeShopId: id });
  },

  async getTemplates(shopId) {
    const data = await chrome.storage.local.get(["fanmeng_reply_templates"]);
    const all = Array.isArray(data.fanmeng_reply_templates) ? data.fanmeng_reply_templates : [];
    if (!shopId) return all;
    return all.filter((t) => !t.shopId || t.shopId === shopId);
  },
  async saveTemplate({ name, text, shopId }) {
    const all = await this.getTemplates();
    const row = {
      id: uid(),
      name: String(name || "未命名模板").slice(0, 80),
      text: String(text || "").slice(0, 4000),
      shopId: shopId || "",
      updatedAt: new Date().toISOString(),
    };
    all.unshift(row);
    await chrome.storage.local.set({ fanmeng_reply_templates: all.slice(0, 50) });
    return row;
  },
  async deleteTemplate(id) {
    const all = await this.getTemplates();
    await chrome.storage.local.set({
      fanmeng_reply_templates: all.filter((t) => t.id !== id),
    });
  },

  async getDiagnosisPack(shopId) {
    const data = await chrome.storage.local.get(["fanmeng_diagnosis_packs"]);
    const packs = data.fanmeng_diagnosis_packs || {};
    return packs[shopId] || { analytics: null, orders: null, ads: null, inventory: null };
  },
  async markDiagnosisPage(shopId, pageKey, meta) {
    const data = await chrome.storage.local.get(["fanmeng_diagnosis_packs"]);
    const packs = data.fanmeng_diagnosis_packs || {};
    const cur = packs[shopId] || {};
    cur[pageKey] = { ...meta, syncedAt: new Date().toISOString() };
    packs[shopId] = cur;
    await chrome.storage.local.set({ fanmeng_diagnosis_packs: packs });
    return cur;
  },
};

if (typeof globalThis !== "undefined") {
  globalThis.FanmengStorage = FanmengStorage;
  globalThis.fanmengUid = uid;
}
