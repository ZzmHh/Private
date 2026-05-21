/**
 * 工作台 · TikTok 插件数据就绪度（诊断包 / 利润分析模式）
 */
import { listExtensionSnapshots } from "./extensionSync.js";
import { getLatestStoreMetricsImport } from "./storeMetrics/store.js";

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
  let hint =
    "插件只能从 TikTok 后台页面读取广告花费、库存数量等样本，无法读取 SKU 采购成本。精确毛利请导入 SKU 成本 CSV 或在下方粘贴成本表。";

  if (hasSkuCost && (hasAds || hasInventory)) {
    mode = "precise";
    modeLabel = "精算模式";
    hint = "已有广告/库存页面快照 + SKU 成本表，可输出 SKU 级利润倾向与停投/补货建议（仍须人工复核）。";
  } else if (hasAds || hasInventory || hasOrders) {
    mode = "trend";
    modeLabel = "趋势模式";
    hint =
      "插件已抓到广告/库存/订单页样本，可分析花费效率、库存风险与补货方向；精确单 SKU 毛利仍需导入成本 CSV。";
  } else if (hasSkuCost) {
    mode = "cost_only";
    modeLabel = "成本表模式";
    hint = "已有 SKU 成本但缺少广告/库存页快照。请在卖家中心打开对应页面，用插件点「同步本页」。";
  } else if (hasShopOverview) {
    mode = "overview";
    modeLabel = "店铺概览模式";
    hint = "仅有店铺周期 CSV，可做宏观建议；SKU 级分析请下载 sku 模板并导入采购价/头程。";
  }

  const recommendedActions = [];
  if (!hasAds) recommendedActions.push({ id: "sync_ads", label: "在卖家中心打开广告/推广页 → 插件「同步本页」" });
  if (!hasInventory) recommendedActions.push({ id: "sync_inventory", label: "打开商品/库存页 → 插件「同步本页」" });
  if (!hasSkuCost) {
    recommendedActions.push({
      id: "import_sku_csv",
      label: "下载中文 SKU 成本模板（fanmeng-sku-inventory-cost.csv），填入采购价/头程后导入",
    });
  }
  if (!hasAnalytics && !hasOrders) {
    recommendedActions.push({ id: "sync_analytics", label: "打开数据概览或订单页，凑齐诊断包（业绩诊断建议 ≥2/4）" });
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
 * @param {string} userId
 * @param {string} [platform]
 */
export function buildExtensionWorkspaceSummary(userId, platform = "tiktok") {
  const snaps = listExtensionSnapshots(userId, platform, 40);
  const latestImport = getLatestStoreMetricsImport(userId);

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
    platform,
    extensionConnected: snaps.length > 0,
    latestSnapshotAt: snaps[0]?.pulledAt || null,
    shopName: snaps[0]?.shopName || null,
    shopKey: snaps[0]?.shopKey || null,
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
