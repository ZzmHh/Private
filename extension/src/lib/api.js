const FanmengApi = {
  platform: () => FanmengTikTok.PLATFORM,
  platformLabel: () => FanmengTikTok.PLATFORM_LABEL,

  normalizeBase(raw) {
    return FanmengPermissions.normalizeApiBase(raw);
  },

  wrapFetchError(error, base) {
    const msg = error?.message || String(error);
    if (/failed to fetch|networkerror|network error|load failed/i.test(msg)) {
      throw new Error(
        `无法连接 ${base || "API"}（Failed to fetch）。请检查：① API 地址是否正确（勿多余路径）；② 网络/VPN；③ chrome://extensions 重新加载插件并允许访问该域名。`,
      );
    }
    throw error;
  },

  async request(path, options = {}) {
    const settings = await FanmengStorage.getSettings();
    const base = this.normalizeBase(settings.apiBase);
    if (!base) throw new Error("请先在插件弹窗配置凡梦 API 地址。");
    await FanmengPermissions.ensureHostPermission(base);
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

    let res;
    try {
      res = await fetch(`${base}${path}`, {
        ...options,
        headers,
      });
    } catch (error) {
      this.wrapFetchError(error, base);
    }

    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }

    if (!res.ok) {
      const err = new Error(data.error || data.message || `HTTP ${res.status}`);
      err.status = res.status;
      err.code = data.code || "";
      err.billingUrl = data.billingUrl || FanmengBilling.billingUrlFromApiBase(base);
      throw err;
    }
    return data;
  },

  async login(email, password) {
    const settings = await FanmengStorage.getSettings();
    const base = this.normalizeBase(settings.apiBase);
    if (!base) throw new Error("请填写凡梦 API 地址。");
    await FanmengPermissions.ensureHostPermission(base);

    let res;
    try {
      res = await fetch(`${base}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
    } catch (error) {
      this.wrapFetchError(error, base);
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "登录失败");
    await FanmengStorage.saveSettings({ token: data.token });
    return data;
  },

  async refreshEntitlements(shopKey) {
    const settings = await FanmengStorage.getSettings();
    const st = await this.status(shopKey);
    const ent = FanmengBilling.normalizeEntitlements(st, settings.apiBase);
    await FanmengBilling.saveEntitlements(ent);
    return ent;
  },

  async status(shopKey) {
    const q = new URLSearchParams({ platform: FanmengTikTok.PLATFORM });
    if (shopKey) q.set("shopKey", shopKey);
    return this.request(`/api/extension/status?${q.toString()}`);
  },

  async pushSnapshot(payload) {
    return this.request("/api/extension/snapshot", {
      method: "POST",
      body: JSON.stringify({ platform: FanmengTikTok.PLATFORM, ...payload }),
    });
  },

  async suggestReply({ buyerText, orderContext, shopName, shopKey, faqTemplates }) {
    return this.request("/api/extension/cs/suggest", {
      method: "POST",
      body: JSON.stringify({
        buyerText,
        orderContext,
        shopName: shopName || "",
        shopKey: shopKey || "",
        faqTemplates,
      }),
    });
  },

  async routeCsMessage({ buyerText, orderContext, shopName, shopKey, faqTemplates, syncFaq = true }) {
    return this.request("/api/extension/cs/route", {
      method: "POST",
      body: JSON.stringify({
        buyerText,
        orderContext,
        shopName: shopName || "",
        shopKey: shopKey || "",
        faqTemplates,
        syncFaq,
      }),
    });
  },

  async getFaqTemplates(shopKey = "") {
    const q = new URLSearchParams();
    if (shopKey) q.set("shopKey", shopKey);
    const suffix = q.toString() ? `?${q.toString()}` : "";
    return this.request(`/api/extension/cs/faq${suffix}`);
  },

  async syncFaqTemplates(shopKey, templates) {
    return this.request("/api/extension/cs/faq/sync", {
      method: "POST",
      body: JSON.stringify({ shopKey, templates }),
    });
  },

  async getFaqGenerateContext(shopKey = "") {
    const q = new URLSearchParams();
    if (shopKey) q.set("shopKey", shopKey);
    const suffix = q.toString() ? `?${q.toString()}` : "";
    return this.request(`/api/extension/cs/faq/context${suffix}`);
  },

  async generateFaqDrafts({ shopKey, shopName, primaryLang, pages } = {}) {
    return this.request("/api/extension/cs/faq/generate", {
      method: "POST",
      body: JSON.stringify({
        shopKey: shopKey || "",
        shopName: shopName || "",
        primaryLang: primaryLang || "",
        pages: pages || [],
        useSnapshots: true,
      }),
    });
  },

  async getCsAlerts() {
    return this.request("/api/extension/cs/alerts?unread=1");
  },

  async getCsSettings() {
    return this.request("/api/extension/cs/settings");
  },

  async getWorkspaceSummary(shopKey) {
    const q = new URLSearchParams({ platform: FanmengTikTok.PLATFORM });
    if (shopKey) q.set("shopKey", shopKey);
    return this.request(`/api/extension/workspace-summary?${q.toString()}`);
  },

  async analyze(agentId, input, shopKey) {
    return this.request("/api/extension/analyze", {
      method: "POST",
      body: JSON.stringify({
        agentId,
        input,
        platform: FanmengTikTok.PLATFORM,
        shopKey: shopKey || "",
        includeSnapshots: true,
      }),
    });
  },
};

if (typeof globalThis !== "undefined") {
  globalThis.FanmengApi = FanmengApi;
}
