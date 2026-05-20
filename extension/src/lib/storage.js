/** @typedef {{ apiBase: string, token: string, autoSync: boolean, autoSyncMinutes: number, shopName: string }} FanmengSettings */

const DEFAULT_SETTINGS = {
  apiBase: "http://127.0.0.1:8787",
  token: "",
  autoSync: false,
  autoSyncMinutes: 15,
  shopName: "",
};

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
};

if (typeof globalThis !== "undefined") {
  globalThis.FanmengStorage = FanmengStorage;
}
