/**
 * 企业工作台 · 插件数据就绪度（诊断包 / 利润分析）
 */
import { listEnterpriseExtensionSnapshots } from "./enterpriseExtensionSync.js";
import { getLatestEnterpriseStoreMetricsImport } from "./enterpriseStoreMetrics.js";

const DIAGNOSIS_PAGES = [
  { key: "analytics", label: "数据概览", pageTypes: ["analytics", "general"] },
  { key: "orders", label: "订单", pageTypes: ["orders"] },
  { key: "ads", label: "广告", pageTypes: ["ads"] },
  { key: "inventory", label: "库存/商品", pageTypes: ["inventory"] },
];

function mapPageTypeToPackKey(pageType) {
  const pt = String(pageType || "").toLowerCase();
  for (const page of DIAGNOSIS_PAGES) {
    if (page.pageTypes.includes(pt)) return page.key;
  }
  return null;
}

function buildProfitReadiness(packPages, metricsImport) {
  const hasAds = Boolean(packPages.ads?.synced);
  const hasInventory = Boolean(packPages.inventory?.synced);
  const hasOrders = Boolean(packPages.orders?.synced);
  const hasAnalytics = Boolean(packPages.analytics?.synced);
  const skuCount = metricsImport?.skuRows?.length || 0;
  const hasSkuCost = skuCount > 0;
  const hasShopOverview = (metricsImport?.shopRows?.length || 0) > 0;

  let mode = "framework";
  let modeLabel = "框架模式";
  let hint = "浏览器助手可从卖家中心读取广告/库存样本；精确毛利请导入 SKU 成本 CSV。";

  if (hasSkuCost && (hasAds || hasInventory)) {
    mode = "precise";
    modeLabel = "精算模式";
    hint = "已有页面快照 + SKU 成本表，可输出 SKU 级利润倾向（仍须人工复核）。";
  } else if (hasAds || hasInventory || hasOrders) {
    mode = "trend";
    modeLabel = "趋势模式";
    hint = "已有广告/库存/订单页样本，可分析花费效率与补货方向；精确毛利需 CSV。";
  } else if (hasSkuCost) {
    mode = "cost_only";
    modeLabel = "成本表模式";
    hint = "已有 SKU 成本但缺少页面快照，请在卖家中心用浏览器助手「同步本页」。";
  }

  const recommendedActions = [];
  if (!hasAds) recommendedActions.push({ id: "sync_ads", label: "打开广告/推广页 → 助手「同步本页」" });
  if (!hasInventory) recommendedActions.push({ id: "sync_inventory", label: "打开商品/库存页 → 助手「同步本页」" });
  if (!hasSkuCost) {
    recommendedActions.push({ id: "import_sku_csv", label: "导入 SKU 成本 CSV（采购价/头程）" });
  }

  return {
    mode,
    modeLabel,
    hint,
    hasAds,
    hasInventory,
    hasOrders,
    hasAnalytics,
    hasSkuCost,
    hasShopOverview,
    skuCount,
    canRunTrend: hasAds || hasInventory || hasOrders || hasAnalytics || hasShopOverview,
    canRunPrecise: hasSkuCost && (hasAds || hasInventory),
    canRunFramework: true,
    recommendedActions,
  };
}

/**
 * @param {string} orgId
 * @param {string} shopId
 * @param {string} scopeKey
 * @param {string} [platform]
 */
export function buildEnterpriseExtensionWorkspaceSummary(orgId, shopId, scopeKey, platform = "tiktok") {
  const snaps = listEnterpriseExtensionSnapshots(orgId, shopId, platform, 40);
  const latestImport = getLatestEnterpriseStoreMetricsImport(scopeKey);

  /** @type {Record<string, { label: string, synced: boolean, syncedAt: string|null, pageType: string|null }>} */
  const packPages = {};
  for (const page of DIAGNOSIS_PAGES) {
    const match = snaps.find((s) => mapPageTypeToPackKey(s.pageType) === page.key);
    packPages[page.key] = {
      label: page.label,
      synced: Boolean(match),
      syncedAt: match?.pulledAt || null,
      pageType: match?.pageType || null,
    };
  }

  const packDone = Object.values(packPages).filter((p) => p.synced).length;
  const profit = buildProfitReadiness(packPages, latestImport);
  const growthReady = packDone >= 2 || Boolean(latestImport?.shopRows?.length);

  return {
    orgId,
    shopId,
    platform,
    extensionConnected: snaps.length > 0,
    latestSnapshotAt: snaps[0]?.pulledAt || null,
    shopName: snaps[0]?.shopName || null,
    snapshotCount: snaps.length,
    diagnosisPack: { done: packDone, total: DIAGNOSIS_PAGES.length, pages: packPages },
    metricsImport: latestImport
      ? {
          importedAt: latestImport.importedAt,
          label: latestImport.label,
          skuCount: latestImport.skuRows?.length || 0,
          shopPeriods: latestImport.shopRows?.length || 0,
          hasAnalysis: Boolean(latestImport.analysis),
        }
      : null,
    growthReady,
    profit,
  };
}
