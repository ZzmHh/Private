/**
 * 插件 · 订阅与付费墙（与网站账号/套餐共用）
 */
const FanmengBilling = {
  STORAGE_KEY: "fanmeng_entitlements",

  defaultEntitlements() {
    return {
      accessActive: false,
      extensionAllowed: false,
      extensionBlockReason: "请先登录凡梦账号。",
      plan: "trial",
      planName: "—",
      trialActive: false,
      subscriptionActive: false,
      storeApiAgents: false,
      billingUrl: "",
      trialQuota: null,
    };
  },

  billingUrlFromApiBase(apiBase) {
    const raw = String(apiBase || "").trim().replace(/\/+$/, "");
    if (!raw) return "";
    try {
      const u = new URL(raw.includes("://") ? raw : `https://${raw}`);
      if (u.hostname === "127.0.0.1" || u.hostname === "localhost") {
        const port = u.port === "8787" ? "5173" : u.port;
        return `${u.protocol}//${u.hostname}${port ? `:${port}` : ""}/#subscription`;
      }
      return `${u.origin}/#subscription`;
    } catch {
      return "";
    }
  },

  async saveEntitlements(ent) {
    await chrome.storage.local.set({ [this.STORAGE_KEY]: ent });
  },

  async getEntitlements() {
    const data = await chrome.storage.local.get([this.STORAGE_KEY]);
    return data[this.STORAGE_KEY] || this.defaultEntitlements();
  },

  normalizeEntitlements(statusPayload, apiBase) {
    const ent = statusPayload?.entitlements || {};
    const billingUrl =
      String(ent.billingUrl || statusPayload?.billingUrl || "").trim() ||
      this.billingUrlFromApiBase(apiBase);
    return {
      accessActive: Boolean(ent.accessActive),
      extensionAllowed: Boolean(ent.extensionAllowed),
      extensionBlockReason: String(ent.extensionBlockReason || ""),
      plan: ent.plan || "trial",
      planName: ent.planName || "—",
      trialActive: Boolean(ent.trialActive),
      subscriptionActive: Boolean(ent.subscriptionActive),
      storeApiAgents: Boolean(ent.storeApiAgents),
      billingUrl,
      trialQuota: ent.trialQuota || null,
    };
  },

  planStatusLine(ent) {
    if (!ent) return "";
    if (ent.extensionAllowed) {
      if (ent.trialActive) return `试用中 · ${ent.planName}`;
      if (ent.subscriptionActive) return `已订阅 · ${ent.planName}`;
      return ent.planName;
    }
    return ent.extensionBlockReason || "需要订阅后使用插件";
  },

  assertExtensionAllowed(ent) {
    if (ent?.extensionAllowed) return;
    const reason = ent?.extensionBlockReason || "当前账号无法使用 TikTok 插件，请登录后重试。";
    const err = new Error(reason);
    err.code = "EXTENSION_PAYWALL";
    err.billingUrl = ent?.billingUrl || "";
    throw err;
  },

  openBillingPage(ent) {
    const url = ent?.billingUrl || "";
    if (!url) {
      window.alert("请在插件弹窗配置凡梦 API 地址，并在网站完成订阅。");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  },
};

if (typeof globalThis !== "undefined") {
  globalThis.FanmengBilling = FanmengBilling;
}
