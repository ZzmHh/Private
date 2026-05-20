/**
 * 多平台通用经营 CSV — 列名别名（英/中/常见导出表头）
 * 归一化后写入 canonical key
 */

/** @type {Record<string, string[]>} */
export const COLUMN_ALIASES = {
  report_type: ["report_type", "type", "报表类型", "数据类型", "report"],
  platform: ["platform", "平台", "channel", "marketplace"],
  store_name: ["store_name", "store", "shop", "shop_name", "店铺", "店铺名称"],
  period_start: ["period_start", "start_date", "date_from", "开始日期", "起始日期", "统计开始"],
  period_end: ["period_end", "end_date", "date_to", "结束日期", "截止日期", "统计结束"],
  currency: ["currency", "币种", "curr"],

  gmv: ["gmv", "sales", "revenue", "total_sales", "成交额", "销售额", "GMV"],
  orders: ["orders", "order_count", "units_ordered", "订单数", "订单量", "order_qty"],
  visitors: ["visitors", "uv", "unique_visitors", "访客数", "独立访客"],
  sessions: ["sessions", "visits", "traffic", "会话数", "浏览量", "访问量", "page_views"],
  conversion_rate_pct: [
    "conversion_rate_pct",
    "conversion_rate",
    "cvr",
    "conversion",
    "转化率",
    "conversion_pct",
  ],

  ad_spend: ["ad_spend", "ad_cost", "spend", "advertising_spend", "广告花费", "广告支出", "推广花费"],
  ad_orders: ["ad_orders", "ad_order_count", "广告订单数"],
  ad_gmv: ["ad_gmv", "ad_sales", "ad_revenue", "广告成交额", "广告销售额"],
  roas: ["roas", "return_on_ad_spend", "广告回报率"],
  acos_pct: ["acos_pct", "acos", "ACOS", "广告占比"],

  refund_orders: ["refund_orders", "returns", "退款订单数"],
  refund_rate_pct: ["refund_rate_pct", "refund_rate", "return_rate", "退款率"],

  avg_order_value: ["avg_order_value", "aov", "客单价", "平均订单金额"],

  sku: ["sku", "seller_sku", "msku", "SKU", "商品sku"],
  product_name: ["product_name", "title", "product", "商品名称", "品名"],
  stock_available: ["stock_available", "available_stock", "inventory", "stock", "可售库存", "库存"],
  stock_inbound: ["stock_inbound", "inbound", "在途库存"],
  daily_avg_sales_7d: ["daily_avg_sales_7d", "avg_daily_sales_7d", "日均销量7天", "7日日均"],
  daily_avg_sales_30d: ["daily_avg_sales_30d", "avg_daily_sales_30d", "日均销量30天", "30日日均"],

  unit_cost: ["unit_cost", "cogs", "cost", "供货价", "单位成本", "采购成本"],
  packaging_cost: ["packaging_cost", "pack_cost", "包材"],
  shipping_per_unit: ["shipping_per_unit", "shipping_cost", "尾程", "单件物流"],
  platform_fee_pct: ["platform_fee_pct", "platform_fee", "commission_pct", "平台费率", "佣金比例"],

  notes: ["notes", "note", "remark", "备注"],
};

export const SHOP_CANONICAL_KEYS = [
  "platform",
  "store_name",
  "period_start",
  "period_end",
  "currency",
  "gmv",
  "orders",
  "visitors",
  "sessions",
  "conversion_rate_pct",
  "ad_spend",
  "ad_orders",
  "ad_gmv",
  "roas",
  "acos_pct",
  "refund_orders",
  "refund_rate_pct",
  "avg_order_value",
  "notes",
];

export const SKU_CANONICAL_KEYS = [
  "platform",
  "sku",
  "product_name",
  "period_start",
  "period_end",
  "currency",
  "stock_available",
  "stock_inbound",
  "daily_avg_sales_7d",
  "daily_avg_sales_30d",
  "ad_spend",
  "unit_cost",
  "packaging_cost",
  "shipping_per_unit",
  "platform_fee_pct",
  "notes",
];

export function normalizeHeader(raw) {
  return String(raw || "")
    .trim()
    .replace(/^\uFEFF/, "")
    .replace(/\s+/g, "_")
    .toLowerCase();
}

/**
 * @param {string} header
 * @returns {string | null}
 */
export function resolveCanonicalKey(header) {
  const h = normalizeHeader(header);
  if (!h) return null;
  for (const [canonical, aliases] of Object.entries(COLUMN_ALIASES)) {
    if (aliases.some((a) => normalizeHeader(a) === h)) return canonical;
  }
  return h;
}

export function parseNumber(val) {
  if (val === undefined || val === null || val === "") return null;
  const s = String(val).trim().replace(/,/g, "").replace(/%/g, "");
  if (!s || s === "-") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
