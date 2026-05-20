# 多平台通用经营数据 CSV

适用于 **店铺业绩诊断（growth）** 与 **广告·库存·利润（profit）**，不依赖 TikTok Partner / Open API。  
TikTok、Amazon、Shopify、WooCommerce 等均可使用 **同一套列名**（支持常见中英文导出表头别名）。

## 在哪里用

1. 登录凡梦 → **店铺 API 配置** → 区块 **「多平台经营数据 CSV」**  
2. **下载通用模板** → 填入或粘贴后台数据 → **上传 CSV**  
3. 运行 **店铺业绩诊断 / 广告库存利润** Agent 时勾选 **「附带已导入的多平台 CSV 经营数据」**（默认开启）

## 模板类型

| 下载按钮 | 内容 |
|----------|------|
| **通用模板** | 店铺 2 行（本周期 + 上周期）+ SKU 示例 |
| **店铺汇总** | 仅 `report_type=shop` 行 |
| **SKU 库存/成本** | 仅 `report_type=sku` 行 |

API（需登录）：

- `GET /api/store-metrics/template/combined`
- `POST /api/store-metrics/import` — body: `{ "csvText": "..." }`
- `GET /api/store-metrics/latest`

## 店铺汇总行（shop）主要字段

| 列 | 说明 |
|----|------|
| `platform` | tiktok / amazon / shopify / woocommerce / other |
| `period_start` / `period_end` | 统计周期 |
| `gmv` / `orders` | 结果指标 |
| `sessions` / `conversion_rate_pct` | 流量与转化 |
| `ad_spend` / `ad_gmv` / `roas` / `acos_pct` | 广告 |
| `refund_rate_pct` | 体验 |

**强烈建议填两行 shop 数据**（本周期 + 上一周期），系统会自动计算环比并生成规则标记（P0/P1）。

## SKU 行（sku）主要字段

| 列 | 说明 |
|----|------|
| `sku` / `product_name` | 商品 |
| `stock_available` / `daily_avg_sales_7d` | 库存与动销 → 可售天数 |
| `ad_spend` | SKU 级广告花费（可选） |
| `unit_cost` + `packaging_cost` + `shipping_per_unit` + `platform_fee_pct` | 贡献毛利（缺则只做广告/库存方向） |

## 列名别名

解析器会自动识别例如：`销售额`→`gmv`、`广告花费`→`ad_spend`、`CVR`→`conversion_rate_pct` 等。  
完整别名见 `server/storeMetrics/columnAliases.js`。

## 与插件的关系

- **CSV**：主数据源，数字可复算、可环比（推荐）  
- **Chrome 插件**：补充页面样本；插件内「业绩/利润」分析也会自动合并已导入 CSV  

## 数据边界

- 导入数据 **不等于** 平台官方实时 API  
- Agent 输出中会标注来源为「通用 CSV + 规则预计算」  
- 无 `unit_cost` 时不应输出精确净利润，仅广告/库存策略
