/**
 * 确保插件有权向配置的凡梦 API 域名发起请求（MV3 host_permissions）
 */
const FanmengPermissions = {
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
    if (!origin) {
      throw new Error("API 地址无效，请填写如 https://www.fanmengai.com.cn");
    }
    if (typeof chrome?.permissions?.request !== "function") return true;

    const pattern = `${origin}/*`;
    const ok = await this.hasHostPermission(origin);
    if (ok) return true;

    let granted = false;
    try {
      granted = await chrome.permissions.request({ origins: [pattern] });
    } catch {
      granted = false;
    }

    if (!granted) {
      throw new Error(
        `Chrome 未授权插件访问 ${origin}。请在弹出的权限框点「允许」，或在 chrome://extensions 重新加载插件后重试。`,
      );
    }
    return true;
  },
};

if (typeof globalThis !== "undefined") {
  globalThis.FanmengPermissions = FanmengPermissions;
}
