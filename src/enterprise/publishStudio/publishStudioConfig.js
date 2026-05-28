import {
  DEFAULT_SEA_MARKET,
  SEA_MARKET_OPTIONS,
  WORKBENCH_PLATFORM_OPTIONS,
} from "../config/workbenchScopeOptions.js";

export const publishStudio = {
  id: "publish",
  agentId: "publish",
  brandTitle: "智能上架",
  brandSubtitle: "Publish Pipeline",
  brandMark: "PB",
  intro: "从选品机会 → 1688/国内货源 → Listing 生成 → 人工审核 → 发布到当前店铺。绑定一次 API，全员复用。",
};

export const PIPELINE_STEPS = [
  {
    id: "opportunity",
    order: 1,
    name: "选品机会",
    desc: "确认要上什么、卖给谁",
    icon: "search",
  },
  {
    id: "source",
    order: 2,
    name: "货源匹配",
    desc: "1688 主链 · 淘宝/拼多多补充",
    icon: "package",
  },
  {
    id: "listing",
    order: 3,
    name: "Listing 生成",
    desc: "标题、属性、主图方案",
    icon: "list",
  },
  {
    id: "review",
    order: 4,
    name: "审核定价",
    desc: "价格、库存、合规确认",
    icon: "shield",
  },
  {
    id: "publish",
    order: 5,
    name: "发布跟踪",
    desc: "提交平台 · 状态回写",
    icon: "upload",
  },
];

export const SOURCE_TABS = [
  { id: "1688", label: "1688（推荐）" },
  { id: "taobao", label: "淘宝链接" },
  { id: "pdd", label: "拼多多链接" },
];

export const FULFILLMENT_OPTIONS = [
  { value: "1688_dropship", label: "1688 代发 · 国内直发" },
  { value: "domestic_warehouse", label: "国内仓集货" },
  { value: "overseas_warehouse", label: "海外仓现货" },
];

export function defaultPublishDraft() {
  return {
    opportunityTitle: "",
    market: "TH",
    platform: "tiktok",
    category: "家居收纳",
    targetPriceMin: 15,
    targetPriceMax: 35,
    notes: "",
    selectedSourceId: null,
    manualSourceUrl: "",
    listingTitle: "",
    listingBullets: [],
    salePrice: "",
    stock: "99",
    fulfillment: "1688_dropship",
    compliance: {
      noBrand: false,
      categoryOk: false,
      imagesOk: false,
      priceOk: false,
    },
  };
}
