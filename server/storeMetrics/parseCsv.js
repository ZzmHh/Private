import {
  resolveCanonicalKey,
  parseNumber,
  SHOP_CANONICAL_KEYS,
  SKU_CANONICAL_KEYS,
} from "./columnAliases.js";

/**
 * 简易 CSV 解析（支持引号字段）
 * @param {string} text
 */
export function parseCsvText(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      row.push(cell);
      cell = "";
      continue;
    }
    if (ch === "\n" || (ch === "\r" && next === "\n")) {
      row.push(cell);
      cell = "";
      if (row.some((c) => String(c).trim())) rows.push(row);
      row = [];
      if (ch === "\r") i++;
      continue;
    }
    if (ch === "\r") {
      row.push(cell);
      cell = "";
      if (row.some((c) => String(c).trim())) rows.push(row);
      row = [];
      continue;
    }
    cell += ch;
  }
  row.push(cell);
  if (row.some((c) => String(c).trim())) rows.push(row);
  return rows;
}

const NUMERIC_KEYS = new Set([
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
  "stock_available",
  "stock_inbound",
  "daily_avg_sales_7d",
  "daily_avg_sales_30d",
  "unit_cost",
  "packaging_cost",
  "shipping_per_unit",
  "platform_fee_pct",
]);

function normalizeReportType(raw) {
  const t = String(raw || "shop").trim().toLowerCase();
  if (["shop", "store", "overview", "店铺", "店铺汇总", "summary"].includes(t)) return "shop";
  if (["sku", "product", "inventory", "商品", "sku库存", "库存"].includes(t)) return "sku";
  return t === "sku" ? "sku" : "shop";
}

/**
 * @param {string} csvText
 * @returns {{ ok: boolean, shopRows?: object[], skuRows?: object[], errors?: string[], warnings?: string[] }}
 */
export function parseUniversalStoreMetricsCsv(csvText) {
  const errors = [];
  const warnings = [];
  const matrix = parseCsvText(String(csvText || ""));
  if (matrix.length < 2) {
    return { ok: false, errors: ["CSV 至少需要表头行和一行数据。"] };
  }

  const headerRow = matrix[0];
  const colMap = headerRow.map((h) => resolveCanonicalKey(h));
  const unknown = headerRow.filter((h, i) => h.trim() && !colMap[i]);
  if (unknown.length) {
    warnings.push(`未识别列（已忽略）：${unknown.slice(0, 8).join(", ")}`);
  }

  const hasReportType = colMap.includes("report_type");
  const shopRows = [];
  const skuRows = [];

  for (let r = 1; r < matrix.length; r++) {
    const cells = matrix[r];
    if (!cells.some((c) => String(c).trim())) continue;

    /** @type {Record<string, unknown>} */
    const row = {};
    colMap.forEach((key, i) => {
      if (!key) return;
      const raw = cells[i] ?? "";
      if (NUMERIC_KEYS.has(key)) {
        row[key] = parseNumber(raw);
      } else if (key === "report_type") {
        row[key] = normalizeReportType(raw);
      } else {
        row[key] = String(raw).trim();
      }
    });

    const reportType = hasReportType ? normalizeReportType(row.report_type) : inferRowType(row);
    if (reportType === "sku" || row.sku) {
      skuRows.push(pickKeys(row, SKU_CANONICAL_KEYS));
    } else {
      shopRows.push(pickKeys(row, SHOP_CANONICAL_KEYS));
    }
  }

  if (!shopRows.length && !skuRows.length) {
    return { ok: false, errors: ["没有解析到有效数据行。"] };
  }

  return { ok: true, shopRows, skuRows, errors, warnings };
}

function inferRowType(row) {
  if (row.sku || row.stock_available != null || row.unit_cost != null) return "sku";
  return "shop";
}

function pickKeys(row, keys) {
  /** @type {Record<string, unknown>} */
  const out = {};
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null && row[k] !== "") out[k] = row[k];
  }
  return out;
}
