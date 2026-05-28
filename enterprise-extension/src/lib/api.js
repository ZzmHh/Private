const EnterpriseApi = {
  normalizeBase(raw) {
    return EnterprisePermissions.normalizeApiBase(raw);
  },

  wrapFetchError(error, base) {
    const msg = error?.message || String(error);
    if (/failed to fetch|networkerror|network error|load failed/i.test(msg)) {
      throw new Error(`无法连接 ${base || "API"}，请检查地址与网络。`);
    }
    throw error;
  },

  async request(path, options = {}) {
    const settings = await EnterpriseStorage.getSettings();
    const base = this.normalizeBase(settings.apiBase);
    if (!base) throw new Error("请先在插件弹窗配置企业 API 地址。");
    await EnterprisePermissions.ensureHostPermission(base);
    if (!settings.token && !path.includes("/auth/login")) {
      throw new Error("请先在插件中登录企业账号。");
    }
    const skipShop =
      path.includes("/auth/") ||
      path.includes("/shops") ||
      path.includes("/extension/shops") ||
      path.includes("/collect/");
    if (!settings.shopId && !skipShop) {
      throw new Error("请先在插件中选择要同步的店铺（shopId）。");
    }

    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    if (settings.token) headers.Authorization = `Bearer ${settings.token}`;

    let res;
    try {
      res = await fetch(`${base}${path}`, { ...options, headers });
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
      throw err;
    }
    return data;
  },

  async login(loginName, password) {
    const settings = await EnterpriseStorage.getSettings();
    const base = this.normalizeBase(settings.apiBase);
    await EnterprisePermissions.ensureHostPermission(base);
    let res;
    try {
      res = await fetch(`${base}/api/enterprise/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginName, password }),
      });
    } catch (error) {
      this.wrapFetchError(error, base);
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "登录失败");
    await EnterpriseStorage.saveSettings({ token: data.token });
    return data;
  },

  async listShops() {
    return this.request("/api/enterprise/extension/shops");
  },

  async status() {
    const settings = await EnterpriseStorage.getSettings();
    const q = new URLSearchParams({ shopId: settings.shopId || "", platform: "tiktok" });
    return this.request(`/api/enterprise/extension/status?${q}`);
  },

  async pushSnapshot(payload) {
    const settings = await EnterpriseStorage.getSettings();
    return this.request("/api/enterprise/extension/snapshot", {
      method: "POST",
      body: JSON.stringify({
        platform: "tiktok",
        shopId: settings.shopId,
        shopName: settings.shopName,
        ...payload,
      }),
    });
  },

  async workspaceSummary() {
    const settings = await EnterpriseStorage.getSettings();
    const q = new URLSearchParams({ shopId: settings.shopId || "", platform: "tiktok" });
    return this.request(`/api/enterprise/extension/workspace-summary?${q}`);
  },

  async routeCsMessage({ buyerText, orderContext, faqTemplates }) {
    const settings = await EnterpriseStorage.getSettings();
    return this.request("/api/enterprise/extension/cs/route", {
      method: "POST",
      body: JSON.stringify({
        shopId: settings.shopId,
        shopName: settings.shopName || "",
        buyerText,
        orderContext,
        faqTemplates,
        syncFaq: true,
      }),
    });
  },

  async collectFromPage(payload) {
    return this.request("/api/enterprise/collect/from-extension", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async listPublishJobs(status = "") {
    const settings = await EnterpriseStorage.getSettings();
    const q = new URLSearchParams({ shopId: settings.shopId || "" });
    if (status) q.set("status", status);
    return this.request(`/api/enterprise/publish/jobs?${q}`);
  },

  async getFillPack(jobId) {
    return this.request(`/api/enterprise/publish/jobs/${encodeURIComponent(jobId)}/fill-pack`);
  },

  async markJobFilled(jobId, fillResult = {}) {
    return this.request(`/api/enterprise/publish/jobs/${encodeURIComponent(jobId)}/mark-filled`, {
      method: "POST",
      body: JSON.stringify({ fillResult }),
    });
  },

  async markJobPublished(jobId, payload = {}) {
    return this.request(`/api/enterprise/publish/jobs/${encodeURIComponent(jobId)}/mark-published`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async markJobFailed(jobId, error) {
    return this.request(`/api/enterprise/publish/jobs/${encodeURIComponent(jobId)}/mark-failed`, {
      method: "POST",
      body: JSON.stringify({ error }),
    });
  },
};

if (typeof globalThis !== "undefined") {
  globalThis.EnterpriseApi = EnterpriseApi;
}
