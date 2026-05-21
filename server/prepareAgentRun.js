import { buildEchoTikContext } from "./integrations/echotik/index.js";
import { getMergedExtensionContext } from "./extensionSync.js";
import { getStoreMetricsAgentContext } from "./storeMetrics/store.js";
import {
  fetchStoreSnapshot,
  snapshotRequiresSavedSecret,
} from "./integrations/storeApi/dispatcher.js";
import { ensureFeatureAccess, incrementUsage } from "./db.js";

/**
 * @param {object} user
 * @param {object} body
 * @param {{ runPythonScraper: Function, pickStoreSnapshotSecret: Function }} deps
 */
export async function prepareAgentRunInput(user, body, { runPythonScraper, pickStoreSnapshotSecret }) {
  const { agentId, input, scrape, useStoreSnapshot, storeSnapshotPlatform, useExtensionSnapshot, useStoreMetrics } =
    body || {};

  if (!agentId || typeof input !== "string" || !input.trim()) {
    const err = new Error("请提供 agentId 和要执行的业务问题。");
    err.status = 400;
    throw err;
  }

  ensureFeatureAccess(user, "agent", agentId);
  if (["growth", "service", "profit"].includes(agentId)) {
    ensureFeatureAccess(user, "storeApiAgents");
  }

  const usage = incrementUsage(user.id, agentId);
  let scrapeResult = null;
  let echotikContext = null;
  let enrichedInput = input.trim();

  if (agentId === "trend") {
    echotikContext = buildEchoTikContext(enrichedInput);
    if (echotikContext?.detected || echotikContext?.catalog) {
      enrichedInput = [
        enrichedInput,
        "",
        "## EchoTik 选品榜单样本（自动识别市场/类目关键词；第三方时点数据，非官方实时）",
        JSON.stringify(echotikContext, null, 2),
      ].join("\n");
    }
  }

  if (agentId === "trend" && scrape?.enabled) {
    ensureFeatureAccess(user, "scraper");
    incrementUsage(user.id, "scrape");
    scrapeResult = await runPythonScraper({
      platform: scrape.platform,
      market: scrape.market,
      category: scrape.category,
      url: scrape.url,
    });
    enrichedInput = [
      enrichedInput,
      "",
      "Python/Playwright 公开页面参考数据（非官方实时、仅供交叉验证）：",
      JSON.stringify(scrapeResult, null, 2),
    ].join("\n");
  }

  if (useStoreMetrics && ["growth", "service", "profit"].includes(agentId)) {
    const plat = String(storeSnapshotPlatform || "auto").toLowerCase();
    const ctx = getStoreMetricsAgentContext(user.id, plat === "auto" ? undefined : plat);
    if (ctx) {
      enrichedInput = [
        enrichedInput,
        "",
        "## 多平台通用 CSV 经营数据（已解析 + 规则预计算；非官方 API 实时）",
        JSON.stringify(ctx, null, 2),
      ].join("\n");
    }
  }

  if (useExtensionSnapshot && ["growth", "service", "profit"].includes(agentId)) {
    const plat = String(storeSnapshotPlatform || "tiktok").toLowerCase();
    const ctx = getMergedExtensionContext(user.id, plat, 5);
    if (ctx) {
      enrichedInput = [
        enrichedInput,
        "",
        "## 浏览器插件同步的店铺页面快照（卖家已登录后台；非官方 API，可能不完整）",
        JSON.stringify(ctx, null, 2),
      ].join("\n");
    }
  }

  if (useStoreSnapshot && ["growth", "service", "profit"].includes(agentId)) {
    const secret = pickStoreSnapshotSecret(user.id, storeSnapshotPlatform);
    const plat = String(secret?.platform || "").toLowerCase();
    if (
      secret?.apiToken &&
      snapshotRequiresSavedSecret(secret) &&
      ["shopify", "woocommerce", "amazon", "tiktok"].includes(plat)
    ) {
      const snap = await fetchStoreSnapshot(secret);
      if (snap.ok) {
        enrichedInput = [
          enrichedInput,
          "",
          "## 店铺 API 只读快照（服务端经官方/计划中的平台接口拉取，样本非全量）",
          JSON.stringify(snap.data, null, 2),
        ].join("\n");
      } else {
        enrichedInput = [
          enrichedInput,
          "",
          "## 店铺 API 快照不可用或尚未实现",
          [snap.error, snap.hint, snap.nextSteps ? snap.nextSteps.join("；") : ""].filter(Boolean).join("\n"),
        ].join("\n");
      }
    }
  }

  return { agentId, enrichedInput, usage, scrapeResult, echotikContext };
}
