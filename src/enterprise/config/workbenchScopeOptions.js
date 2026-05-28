import { PLATFORM_CATALOG, MARKET_LABELS } from "./platformCatalog.js";

/** 工作台 · 电商平台（与 org_shops / 顶栏一致） */
export const WORKBENCH_PLATFORM_OPTIONS = Object.entries(PLATFORM_CATALOG).map(([value, meta]) => ({
  value,
  label: meta.label,
}));

/** 工作台 · 东南亚市场（类目后续接第三方选品 API 再开放） */
export const SEA_MARKET_OPTIONS = ["SG", "MY", "TH", "ID", "VN", "PH"].map((value) => ({
  value,
  label: MARKET_LABELS[value] || value,
}));

export const DEFAULT_WORKBENCH_PLATFORM = "tiktok";
export const DEFAULT_SEA_MARKET = "TH";

export function findPlatformLabel(value) {
  return PLATFORM_CATALOG[value]?.label || value;
}

export function findMarketLabel(value) {
  return MARKET_LABELS[value] || value;
}
