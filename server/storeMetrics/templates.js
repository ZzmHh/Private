export const UNIVERSAL_SHOP_TEMPLATE_CSV = `report_type,platform,store_name,period_start,period_end,currency,gmv,orders,sessions,conversion_rate_pct,ad_spend,ad_gmv,roas,acos_pct,refund_rate_pct,avg_order_value,notes
shop,tiktok,示例店铺,2026-05-01,2026-05-07,USD,12500,420,8500,3.2,850,6200,7.29,13.7,2.1,29.76,本周期（从各平台后台导出后填入）
shop,tiktok,示例店铺,2026-04-24,2026-04-30,USD,14200,465,9100,3.5,780,7100,9.10,11.0,1.9,30.54,上一周期（用于环比，可选但强烈建议）
`;

export const UNIVERSAL_SKU_TEMPLATE_CSV = `report_type,platform,sku,product_name,period_start,period_end,currency,stock_available,stock_inbound,daily_avg_sales_7d,daily_avg_sales_30d,ad_spend,unit_cost,packaging_cost,shipping_per_unit,platform_fee_pct,notes
sku,tiktok,SKU-DEMO-001,示例商品A,2026-05-01,2026-05-07,USD,240,100,8.5,7.2,120,4.50,0.30,2.10,8,可售天数约28天
sku,tiktok,SKU-DEMO-002,示例商品B,2026-05-01,2026-05-07,USD,45,0,3.1,2.8,85,6.20,0.40,2.50,8,库存偏低；unit_cost填了才可算毛利
`;

export const UNIVERSAL_COMBINED_TEMPLATE_CSV = `${UNIVERSAL_SHOP_TEMPLATE_CSV.trim()}\n${UNIVERSAL_SKU_TEMPLATE_CSV.split("\n").slice(1).join("\n")}\n`;

export function getTemplateCsv(kind) {
  const k = String(kind || "combined").toLowerCase();
  if (k === "shop" || k === "overview") return UNIVERSAL_SHOP_TEMPLATE_CSV;
  if (k === "sku" || k === "inventory" || k === "cost") return UNIVERSAL_SKU_TEMPLATE_CSV;
  return UNIVERSAL_COMBINED_TEMPLATE_CSV;
}
