/**
 * 规则预计算：为 growth / profit Agent 提供可复算信号（非 LLM 编造）
 */

function pctChange(current, previous) {
  if (current == null || previous == null || previous === 0) return null;
  return Number((((current - previous) / Math.abs(previous)) * 100).toFixed(2));
}

function deriveRoas(adGmv, adSpend) {
  if (adGmv == null || adSpend == null || adSpend === 0) return null;
  return Number((adGmv / adSpend).toFixed(2));
}

function deriveAcos(adSpend, adGmv) {
  if (adSpend == null || adGmv == null || adGmv === 0) return null;
  return Number(((adSpend / adGmv) * 100).toFixed(2));
}

function sortPeriods(rows) {
  return [...rows].sort((a, b) => String(b.period_end || "").localeCompare(String(a.period_end || "")));
}

/**
 * @param {{ shopRows: object[], skuRows: object[] }} parsed
 */
export function analyzeStoreMetrics(parsed) {
  const shopRows = sortPeriods(parsed.shopRows || []);
  const skuRows = parsed.skuRows || [];
  const flags = [];
  const missing = [];

  const current = shopRows[0] || null;
  const previous = shopRows[1] || null;

  if (!current) {
    missing.push("缺少店铺汇总行（report_type=shop 或不含 sku 的行）");
  }

  const comparisons = {};
  if (current && previous) {
    comparisons.gmv_change_pct = pctChange(current.gmv, previous.gmv);
    comparisons.orders_change_pct = pctChange(current.orders, previous.orders);
    comparisons.conversion_rate_change_pt =
      current.conversion_rate_pct != null && previous.conversion_rate_pct != null
        ? Number((current.conversion_rate_pct - previous.conversion_rate_pct).toFixed(2))
        : null;
    comparisons.ad_spend_change_pct = pctChange(current.ad_spend, previous.ad_spend);
    comparisons.sessions_change_pct = pctChange(current.sessions, previous.sessions);
  } else if (current) {
    missing.push("建议再导入一行「上一周期」店铺数据以便环比");
  }

  if (current) {
    const roas = current.roas ?? deriveRoas(current.ad_gmv, current.ad_spend);
    const acos = current.acos_pct ?? deriveAcos(current.ad_spend, current.ad_gmv);
    if (roas != null) current._derived_roas = roas;
    if (acos != null) current._derived_acos_pct = acos;

    if (comparisons.gmv_change_pct != null && comparisons.gmv_change_pct <= -10) {
      flags.push({
        severity: "P0",
        code: "gmv_drop",
        message: `GMV 环比约 ${comparisons.gmv_change_pct}%`,
      });
    }
    if (
      comparisons.sessions_change_pct != null &&
      comparisons.sessions_change_pct <= -8 &&
      (comparisons.orders_change_pct == null || comparisons.orders_change_pct > -5)
    ) {
      flags.push({
        severity: "P1",
        code: "traffic_drop_cvr_stable",
        message: "流量/session 下滑而订单跌幅较小，优先检查曝光/广告/活动",
      });
    }
    if (
      comparisons.orders_change_pct != null &&
      comparisons.orders_change_pct <= -8 &&
      (comparisons.sessions_change_pct == null || comparisons.sessions_change_pct > -5)
    ) {
      flags.push({
        severity: "P0",
        code: "cvr_or_listing",
        message: "订单下滑而流量相对稳定，优先检查详情页/价格/评价/库存",
      });
    }
    if (current.refund_rate_pct != null && current.refund_rate_pct >= 5) {
      flags.push({
        severity: "P1",
        code: "high_refund",
        message: `退款率约 ${current.refund_rate_pct}%`,
      });
    }
    if (acos != null && acos >= 25) {
      flags.push({
        severity: "P1",
        code: "high_acos",
        message: `ACOS 约 ${acos}%（或广告效率偏弱）`,
      });
    }
  }

  const skuInsights = skuRows.slice(0, 50).map((s) => {
    const daily = s.daily_avg_sales_7d ?? s.daily_avg_sales_30d;
    const stock = s.stock_available;
    let daysCover = null;
    if (daily != null && daily > 0 && stock != null) {
      daysCover = Number((stock / daily).toFixed(1));
    }
    let contrib = null;
    if (s.unit_cost != null) {
      const fees = s.platform_fee_pct != null ? s.platform_fee_pct / 100 : 0;
      const varCost =
        s.unit_cost + (s.packaging_cost || 0) + (s.shipping_per_unit || 0) + (s.ad_spend || 0) / Math.max(daily || 1, 1);
      contrib = { variable_cost_approx: Number(varCost.toFixed(2)), has_unit_cost: true };
    }
    return {
      sku: s.sku,
      product_name: s.product_name,
      stock_available: stock,
      daily_avg_sales_7d: s.daily_avg_sales_7d,
      days_cover: daysCover,
      ad_spend: s.ad_spend,
      unit_cost: s.unit_cost,
      profit_hint: contrib,
      low_stock: daysCover != null && daysCover < 7,
      overstock: daysCover != null && daysCover > 60,
    };
  });

  const skusWithoutCost = skuRows.filter((s) => s.unit_cost == null).length;
  if (skuRows.length && skusWithoutCost === skuRows.length) {
    missing.push("SKU 行未含 unit_cost，利润分析将仅含广告/库存方向");
  }

  return {
    source: "universal-csv",
    analyzedAt: new Date().toISOString(),
    currentPeriod: current,
    previousPeriod: previous,
    comparisons,
    flags,
    skuInsights,
    skuCount: skuRows.length,
    dataQuality: {
      missing,
      shopPeriodCount: shopRows.length,
      confidence: shopRows.length >= 2 && skuRows.some((s) => s.unit_cost != null) ? "high" : shopRows.length ? "medium" : "low",
    },
  };
}
