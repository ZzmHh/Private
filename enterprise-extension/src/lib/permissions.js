const EnterprisePermissions = {
  normalizeApiBase(raw) {
    const s = String(raw || "").trim().replace(/\/+$/, "");
    if (!s) return "";
    try {
      return new URL(s.includes("://") ? s : `https://${s}`).origin;
    } catch {
      return "";
    }
  },

  originPattern(origin) {
    const o = this.normalizeApiBase(origin);
    return o ? `${o}/*` : "";
  },

  async hasHostPermission(apiBase) {
    const pattern = this.originPattern(apiBase);
    if (!pattern || typeof chrome?.permissions?.contains !== "function") return true;
    try {
      return await chrome.permissions.contains({ origins: [pattern] });
    } catch {
      return false;
    }
  },

  async ensureHostPermission(apiBase) {
    const origin = this.normalizeApiBase(apiBase);
    if (!origin) throw new Error("API 地址无效");
    if (typeof chrome?.permissions?.request !== "function") return true;
    const pattern = `${origin}/*`;
    const ok = await this.hasHostPermission(origin);
    if (ok) return true;
    const granted = await chrome.permissions.request({ origins: [pattern] }).catch(() => false);
    if (!granted) {
      throw new Error(`Chrome 未授权访问 ${origin}，请在扩展管理页重新加载并允许。`);
    }
    return true;
  },

  resolveWorkspaceUrl(apiBase) {
    const cfg = typeof EnterpriseExtensionConfig !== "undefined" ? EnterpriseExtensionConfig : {};
    const configured = String(cfg.WEBSITE_URL || "").trim();
    if (configured) return this.normalizeApiBase(configured) || configured.replace(/\/+$/, "");
    const origin = this.normalizeApiBase(apiBase);
    if (!origin) return "";
    try {
      const u = new URL(origin);
      if ((u.hostname === "127.0.0.1" || u.hostname === "localhost") && u.port === "8787") {
        return `${u.protocol}//${u.hostname}:5173/enterprise.html`;
      }
    } catch {
      /* ignore */
    }
    return origin;
  },
};

if (typeof globalThis !== "undefined") {
  globalThis.EnterprisePermissions = EnterprisePermissions;
}
