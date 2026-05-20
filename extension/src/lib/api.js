const FanmengApi = {
  async request(path, options = {}) {
    const settings = await FanmengStorage.getSettings();
    const base = String(settings.apiBase || "").replace(/\/+$/, "");
    if (!base) throw new Error("请先在插件弹窗配置凡梦 API 地址。");
    if (!settings.token && !path.includes("/auth/login")) {
      throw new Error("请先在插件中登录凡梦账号。");
    }

    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };
    if (settings.token) {
      headers.Authorization = `Bearer ${settings.token}`;
    }

    const res = await fetch(`${base}${path}`, {
      ...options,
      headers,
    });

    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }

    if (!res.ok) {
      throw new Error(data.error || data.message || `HTTP ${res.status}`);
    }
    return data;
  },

  async login(email, password) {
    const settings = await FanmengStorage.getSettings();
    const base = String(settings.apiBase || "").replace(/\/+$/, "");
    const res = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "登录失败");
    await FanmengStorage.saveSettings({ token: data.token });
    return data;
  },

  async status() {
    return this.request("/api/extension/status?platform=tiktok");
  },

  async pushSnapshot(payload) {
    return this.request("/api/extension/snapshot", {
      method: "POST",
      body: JSON.stringify({ platform: "tiktok", ...payload }),
    });
  },

  async suggestReply({ buyerText, orderContext }) {
    const settings = await FanmengStorage.getSettings();
    return this.request("/api/extension/cs/suggest", {
      method: "POST",
      body: JSON.stringify({
        buyerText,
        orderContext,
        shopName: settings.shopName || "",
        platform: "TikTok Shop",
      }),
    });
  },

  async analyze(agentId, input) {
    return this.request("/api/extension/analyze", {
      method: "POST",
      body: JSON.stringify({ agentId, input, platform: "tiktok", includeSnapshots: true }),
    });
  },
};

if (typeof globalThis !== "undefined") {
  globalThis.FanmengApi = FanmengApi;
}
