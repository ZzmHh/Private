import { useCallback, useEffect, useState } from "react";
import { downloadStoreMetricsTemplate } from "../../lib/storeMetricsTemplates.js";
import { fetchMetricsLatest, formatError, formatRelativeTime, importMetricsCsv } from "./opsStudioApi.js";
import { CsToast } from "../csStudio/CsToast.jsx";

export function OpsMetricsImport({ variant = "both", onImported, scopeShopId = "" }) {
  const [latest, setLatest] = useState(null);
  const [busy, setBusy] = useState(null);
  const [toast, setToast] = useState("");

  const loadLatest = useCallback(async () => {
    const token = localStorage.getItem("enterprise_token");
    if (!token) {
      if (import.meta.env.DEV) {
        setLatest({
          importedAt: new Date(Date.now() - 86400_000).toISOString(),
          label: "demo-shop-metrics.csv",
          skuCount: 28,
          shopPeriods: 2,
          analysis: {
            currentPeriod: { gmv: 12500, orders: 420, conversion_rate_pct: 3.2, ad_spend: 850, roas: 7.29 },
            flags: [
              { severity: "P0", message: "GMV 环比约 -12%" },
              { severity: "P1", message: "广告 ROAS 下滑，花费占比上升" },
            ],
          },
        });
      }
      return;
    }
    if (!scopeShopId) {
      setLatest(null);
      return;
    }
    try {
      setLatest(await fetchMetricsLatest(scopeShopId));
    } catch {
      setLatest(null);
    }
  }, [scopeShopId]);

  useEffect(() => {
    loadLatest();
  }, [loadLatest]);

  async function handleImportFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!scopeShopId) {
      setToast("请先在顶部选择店铺");
      return;
    }
    setBusy("import");
    try {
      const data = await importMetricsCsv(file, scopeShopId);
      setLatest(data.import ? { ...data.import, analysis: data.analysis } : null);
      await loadLatest();
      onImported?.(data);
      setToast(
        `导入成功：店铺周期 ${data.import?.shopPeriods ?? 0}、SKU ${data.import?.skuCount ?? 0}`,
      );
    } catch (err) {
      setToast(formatError(err));
    } finally {
      setBusy(null);
    }
  }

  const analysis = latest?.analysis;
  const showShop = variant === "both" || variant === "growth";
  const showSku = variant === "both" || variant === "profit";

  return (
    <div className="ent-ops-metrics">
      <CsToast message={toast} onClear={() => setToast("")} />
      <div className="ent-ops-metrics-head">
        <h3>经营数据 CSV</h3>
        <span className="ent-ops-badge">推荐 · 可环比</span>
      </div>
      <p className="ent-ops-metrics-desc">
        从 TikTok 卖家后台导出或手工填入两个统计周期，系统可自动算 GMV/广告/转化环比；SKU 表填采购价+头程后可算毛利。
      </p>
      <div className="ent-ops-metrics-actions">
        {showShop ? (
          <button
            type="button"
            className="ent-cs-query-btn"
            disabled={Boolean(busy)}
            onClick={() => downloadStoreMetricsTemplate("shop")}
          >
            下载店铺汇总模板
          </button>
        ) : null}
        {showSku ? (
          <button
            type="button"
            className="ent-cs-query-btn"
            disabled={Boolean(busy)}
            onClick={() => downloadStoreMetricsTemplate("sku")}
          >
            下载 SKU 成本模板
          </button>
        ) : null}
        <label className="ent-cs-import-btn">
          {busy === "import" ? "导入中…" : "导入 CSV"}
          <input type="file" accept=".csv,text/csv" onChange={handleImportFile} hidden />
        </label>
      </div>
      {latest ? (
        <div className="ent-ops-metrics-latest">
          <strong>最近导入：{latest.label || "—"}</strong>
          <p>
            SKU {latest.skuCount ?? 0} 条 · 店铺周期 {latest.shopPeriods ?? latest.shopRows?.length ?? 0} 行
            {latest.importedAt ? ` · ${formatRelativeTime(latest.importedAt)}` : ""}
          </p>
          {analysis?.flags?.length ? (
            <ul className="ent-ops-flag-list">
              {analysis.flags.map((f) => (
                <li key={f.message} className={`is-${(f.severity || "p1").toLowerCase()}`}>
                  <span>{f.severity}</span> {f.message}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : (
        <p className="ent-ops-empty-inline">尚未导入 CSV；可先靠插件快照做趋势分析，精算需补 SKU 成本。</p>
      )}
    </div>
  );
}
