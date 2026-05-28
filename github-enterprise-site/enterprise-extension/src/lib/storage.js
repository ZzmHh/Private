/** @typedef {{ apiBase: string, token: string, shopId: string, shopName: string, autoSync: boolean }} EnterpriseSettings */

const DEFAULT_SETTINGS = {
  apiBase:
    (typeof EnterpriseExtensionConfig !== "undefined" && EnterpriseExtensionConfig.DEFAULT_API_BASE) ||
    "http://127.0.0.1:8787",
  token: "",
  shopId: "",
  shopName: "",
  autoSync: false,
  pendingFillJobId: "",
};

const EnterpriseStorage = {
  async getSettings() {
    const data = await chrome.storage.local.get(["enterprise_settings"]);
    return { ...DEFAULT_SETTINGS, ...(data.enterprise_settings || {}) };
  },
  async saveSettings(partial) {
    const cur = await this.getSettings();
    const next = { ...cur, ...partial };
    await chrome.storage.local.set({ enterprise_settings: next });
    return next;
  },
  async clearAuth() {
    const cur = await this.getSettings();
    await chrome.storage.local.set({ enterprise_settings: { ...cur, token: "" } });
  },
};

if (typeof globalThis !== "undefined") {
  globalThis.EnterpriseStorage = EnterpriseStorage;
}
