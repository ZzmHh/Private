import {
  chineseHeaderLine,
  SHOP_TEMPLATE_COLUMNS,
  SKU_TEMPLATE_COLUMNS,
} from "./columnAliases.js";

/** 中文表头 + 示例行；# 开头说明行导入时自动跳过 */

const SHOP_HEADER = chineseHeaderLine(SHOP_TEMPLATE_COLUMNS);
const SKU_HEADER = chineseHeaderLine(SKU_TEMPLATE_COLUMNS);

export const UNIVERSAL_SHOP_TEMPLATE_CSV = `# 凡梦AI · TikTok Shop 店铺汇总模板（业绩诊断用）
# 填写说明：①保留下面中文表头行 ②「报表类型」填：店铺  ③建议填两个统计周期（本周期+上周期）可自动算环比
# 成交额/订单数/会话数/转化率/广告花费等可从卖家后台「数据概览」导出后对照填入
${SHOP_HEADER}
店铺,tiktok,我的TikTok店,2026-05-01,2026-05-07,USD,12500,420,8500,3.2%,850,6200,7.29,13.7%,2.1%,29.76,本周期（示例行，可删改）
店铺,tiktok,我的TikTok店,2026-04-24,2026-04-30,USD,14200,465,9100,3.5%,780,7100,9.10,11.0%,1.9%,30.54,上一周期（用于环比，强烈建议填写）
`;

export const UNIVERSAL_SKU_TEMPLATE_CSV = `# 凡梦AI · TikTok Shop SKU 库存/成本模板（广告库存利润用）
# 填写说明：①「报表类型」填：SKU  ②「单位采购成本」「单件头程」填了才能算毛利  ③库存/广告花费可与插件同步页面对照
# 商品SKU 填卖家后台的 SKU 编码；7日/30日日均销量可从订单或库存报表估算
${SKU_HEADER}
SKU,tiktok,SKU-示例-001,便携榨汁杯,2026-05-01,2026-05-07,USD,240,100,8.5,7.2,120,4.50,0.30,2.10,8%,可售约28天（示例行）
SKU,tiktok,SKU-示例-002,宠物饮水机,2026-05-01,2026-05-07,USD,45,0,3.1,2.8,85,6.20,0.40,2.50,8%,库存偏低，需补货（示例行）
`;

export const UNIVERSAL_COMBINED_TEMPLATE_CSV = `${UNIVERSAL_SHOP_TEMPLATE_CSV.trim()}\n${UNIVERSAL_SKU_TEMPLATE_CSV.trim().split("\n").slice(4).join("\n")}\n`;

export function getTemplateCsv(kind) {
  const k = String(kind || "combined").toLowerCase();
  if (k === "shop" || k === "overview") return UNIVERSAL_SHOP_TEMPLATE_CSV;
  if (k === "sku" || k === "inventory" || k === "cost") return UNIVERSAL_SKU_TEMPLATE_CSV;
  return UNIVERSAL_COMBINED_TEMPLATE_CSV;
}

export function getTemplateDownloadName(kind) {
  const k = String(kind || "combined").toLowerCase();
  if (k === "shop" || k === "overview") return "凡梦AI-店铺经营汇总模板.csv";
  if (k === "sku" || k === "inventory" || k === "cost") return "凡梦AI-SKU库存与成本模板.csv";
  return "凡梦AI-经营数据通用模板.csv";
}
