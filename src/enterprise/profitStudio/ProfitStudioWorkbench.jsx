import { useCallback, useEffect, useMemo, useState } from "react";
import { profitStudio, defaultProfitToolId, findProfitTool } from "./profitStudioConfig.js";
import { OpsStudioShell } from "../opsStudio/OpsStudioShell.jsx";
import { OpsExtensionStatus } from "../opsStudio/OpsExtensionStatus.jsx";
import { OpsDiagnosisPackBar } from "../opsStudio/OpsDiagnosisPackBar.jsx";
import { OpsMetricsImport } from "../opsStudio/OpsMetricsImport.jsx";
import { OpsDataTable, OpsDiagnosisReport } from "../opsStudio/OpsReportViews.jsx";
import {
  fetchWorkspaceSummary,
  formatError,
  runExtensionAnalyze,
} from "../opsStudio/opsStudioApi.js";
import {
  MOCK_ADS_SNAPSHOT,
  MOCK_INVENTORY_SNAPSHOT,
  MOCK_WORKSPACE_SUMMARY,
  mockProfitAnalysisOutput,
} from "../opsStudio/opsStudioMocks.js";
import { downloadStoreMetricsTemplate } from "../../lib/storeMetricsTemplates.js";
import { CsToast } from "../csStudio/CsToast.jsx";
import "../creativeStudio/creativeStudio.css";
import "../csStudio/csStudio.css";
import "../opsStudio/opsStudio.css";

const PROFIT_MODES = [
  { id: "precise", label: "精算", desc: "广告/库存 + SKU 成本" },
  { id: "trend", label: "趋势", desc: "插件广告/库存样本" },
  { id: "framework", label: "框架", desc: "数据不足时的原则清单" },
];

const COST_TIPS = [
  "卖家中心 → 商品/库存：看在售 SKU 与库存（插件可同步样本）",
  "卖家中心 → 广告/推广：看花费、ROAS（插件可同步，非官方 API）",
  "财务/ERP 导出采购价、头程 → 填入 SKU 成本模板",
  "无法导出时：在「利润精算」页粘贴 SKU, 采购价, 头程 简易表",
];

function useWorkspaceSummary(scopeShopId) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("enterprise_token");
    try {
      if (!token) {
        if (import.meta.env.DEV) setSummary(MOCK_WORKSPACE_SUMMARY);
        else setSummary(null);
        return;
      }
      if (!scopeShopId) {
        setSummary(null);
        return;
      }
      setSummary(await fetchWorkspaceSummary(scopeShopId));
    } catch {
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [scopeShopId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { summary, loading, reload };
}

function ProfitConnectPane({ summary, loading, onRefresh, onImported, scopeShopId }) {
  const profit = summary?.profit;
  return (
    <div className="ent-ops-pane-scroll">
      <OpsExtensionStatus summary={summary} loading={loading} onRefresh={onRefresh} />
      <div className="ent-ops-card ent-ops-mode-card">
        <span className="ent-ops-badge">{profit?.modeLabel || "框架模式"}</span>
        <p>{profit?.hint}</p>
        <div className="ent-ops-signals">
          <span className={profit?.hasAds ? "is-yes" : ""}>广告页 {profit?.hasAds ? "✓" : "○"}</span>
          <span className={profit?.hasInventory ? "is-yes" : ""}>库存页 {profit?.hasInventory ? "✓" : "○"}</span>
          <span className={profit?.hasSkuCost ? "is-yes" : ""}>
            SKU 成本 {profit?.hasSkuCost ? `✓ ${profit.skuCount}` : "○"}
          </span>
        </div>
      </div>
      <OpsDiagnosisPackBar pack={summary?.diagnosisPack} compact />
      <OpsMetricsImport variant="profit" scopeShopId={scopeShopId} onImported={onImported} />
      {(profit?.recommendedActions || []).length ? (
        <ul className="ent-ops-hint-list">
          {profit.recommendedActions.map((a) => (
            <li key={a.id}>{a.label}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function ProfitCostPane({ scopeShopId }) {
  return (
    <div className="ent-ops-pane-scroll">
      <div className="ent-ops-card">
        <h3>SKU 成本是算毛利的前提</h3>
        <p>插件<strong>无法</strong>读取 TikTok 后台的采购价/头程；精确利润分析必须导入成本 CSV 或手工补录。</p>
      </div>
      <div className="ent-ops-metrics-actions">
        <button type="button" className="ent-cs-query-btn" onClick={() => downloadStoreMetricsTemplate("sku")}>
          下载 SKU 成本模板
        </button>
        <button type="button" className="ent-cs-query-btn" onClick={() => downloadStoreMetricsTemplate("combined")}>
          下载通用合并模板
        </button>
      </div>
      <OpsMetricsImport variant="profit" scopeShopId={scopeShopId} />
      <details className="ent-ops-guide" open>
        <summary>数据补齐路径（卖家常用）</summary>
        <ol>
          {COST_TIPS.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ol>
      </details>
      <label className="ent-cs-field">
        <span className="ent-cs-field-label">手工成本表示例格式</span>
        <textarea
          className="ent-cs-control ent-cs-textarea"
          rows={5}
          readOnly
          value={"SKU, 采购价, 头程\nSKU-001, 12.5, 3.2\nSKU-002, 8.0, 2.1"}
        />
      </label>
    </div>
  );
}

function ProfitAdsPane() {
  const snap = MOCK_ADS_SNAPSHOT;
  return (
    <div className="ent-ops-pane-scroll">
      <p className="ent-ops-metrics-desc">
        基于插件同步的广告页样本 + CSV 广告字段。ROAS 持续低于保本线 → 降预算；稳定且库存充足 → 小步加码。
      </p>
      <OpsDataTable title="广告效率快照" columns={snap.columns} rows={snap.rows} />
      <div className="ent-ops-card">
        <h3>卖家动作建议</h3>
        <ul className="ent-ops-bullets">
          <li>Video · 宠物杯：ROAS 1.3，CPC 偏高 — 先改素材/受众，无效则降预算 20%</li>
          <li>Search · 收纳套装：ROAS 3.4 — 可试 +10% 预算，监控 3 天库存消耗</li>
          <li>SKU-004 分装瓶：ROAS 0.9 — 立即停投，避免亏损放大</li>
        </ul>
      </div>
    </div>
  );
}

function ProfitInventoryPane() {
  const snap = MOCK_INVENTORY_SNAPSHOT;
  return (
    <div className="ent-ops-pane-scroll">
      <p className="ent-ops-metrics-desc">
        可售天数 = 可售库存 ÷ 7 日日均销量。&lt;14 天优先补货；&gt;90 天考虑促销清库存。
      </p>
      <OpsDataTable title="库存周转快照" columns={snap.columns} rows={snap.rows} />
      <div className="ent-ops-card">
        <h3>补货 / 减采优先级</h3>
        <ul className="ent-ops-bullets">
          <li><strong>P0</strong> SKU-004 旅行分装瓶 — 4 天可售，紧急补货</li>
          <li><strong>P0</strong> SKU-003 折叠收纳箱 — 8 天可售，在途 200 确认 ETA</li>
          <li><strong>P1</strong> SKU-002 宠物饮水机 — 122 天滞销，bundle / 折扣清仓</li>
        </ul>
      </div>
    </div>
  );
}

function ProfitRunPane({ summary, onReport, scopeShopId }) {
  const profit = summary?.profit;
  const [profitMode, setProfitMode] = useState("trend");
  const [manualCost, setManualCost] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState(null);
  const [rawAnswer, setRawAnswer] = useState("");
  const [toast, setToast] = useState("");

  const canRun =
    profitMode === "framework" ||
    (profitMode === "precise" && profit?.canRunPrecise) ||
    (profitMode === "trend" && profit?.canRunTrend);

  async function runAnalysis() {
    setBusy(true);
    setReport(null);
    setRawAnswer("");
    const token = localStorage.getItem("enterprise_token");
    const input = [
      `分析模式：${profitMode}`,
      manualCost.trim() ? `手工成本表：\n${manualCost.trim()}` : "",
      note.trim() ? `分析重点：${note.trim()}` : "",
      "请输出：广告效率表、库存风险、SKU 利润倾向（有成本时）、停投/补货建议。",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      if (!token) {
        if (import.meta.env.DEV) {
          await new Promise((r) => setTimeout(r, 750));
          const mock = mockProfitAnalysisOutput(profitMode, note);
          setReport(mock);
          onReport?.(mock);
          return;
        }
        throw new Error("请先登录后再运行利润分析");
      }
      if (!scopeShopId) throw new Error("请先在顶部选择店铺");
      const data = await runExtensionAnalyze("profit", input, scopeShopId);
      setRawAnswer(data.answer || "");
      setReport(null);
      onReport?.({ rawAnswer: data.answer });
    } catch (err) {
      setToast(formatError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ent-cs-split ent-ops-split-run">
      <CsToast message={toast} onClear={() => setToast("")} />
      <div className="ent-cs-form">
        <div className="ent-ops-mode-picker">
          <span className="ent-cs-field-label">分析模式</span>
          <div className="ent-ops-mode-btns">
            {PROFIT_MODES.map((m) => {
              const disabled =
                m.id === "precise" ? !profit?.canRunPrecise : m.id === "trend" ? !profit?.canRunTrend : false;
              return (
                <button
                  key={m.id}
                  type="button"
                  title={m.desc}
                  className={`ent-ops-mode-btn${profitMode === m.id ? " is-active" : ""}`}
                  disabled={disabled}
                  onClick={() => setProfitMode(m.id)}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>
        <label className="ent-cs-field">
          <span className="ent-cs-field-label">手工 SKU 成本（可选）</span>
          <textarea
            className="ent-cs-control ent-cs-textarea"
            rows={4}
            value={manualCost}
            placeholder={"SKU, 采购价, 头程\nSKU-001, 12.5, 3.2"}
            onChange={(e) => setManualCost(e.target.value)}
          />
        </label>
        <label className="ent-cs-field">
          <span className="ent-cs-field-label">分析重点（可选）</span>
          <textarea
            className="ent-cs-control ent-cs-textarea"
            rows={2}
            value={note}
            placeholder="例如：哪些 SKU 停投、哪些需补货、广告预算如何调整…"
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
        <button type="button" className="ent-cs-submit" disabled={!canRun || busy} onClick={runAnalysis}>
          {busy ? "分析中…" : "运行利润精算"}
        </button>
        <p className="ent-cs-form-footnote">精算需 SKU 成本 + 广告/库存快照；框架模式可在数据不足时给原则清单。</p>
      </div>
      <div className="ent-cs-preview ent-cs-preview--route">
        <div className="ent-cs-preview-toolbar">
          <span className={`ent-cs-status ent-cs-status--${busy ? "busy" : report ? "ok" : "idle"}`}>
            {busy ? "生成中" : report ? "已完成" : "等待运行"}
          </span>
        </div>
        <div className="ent-cs-preview-stage ent-cs-preview-stage--route ent-ops-preview-scroll">
          <OpsDiagnosisReport report={report} rawAnswer={rawAnswer} />
        </div>
      </div>
    </div>
  );
}

export function ProfitStudioWorkbench({ user, scopeShopId = "" }) {
  const [toolId, setToolId] = useState(defaultProfitToolId);
  const [execLog, setExecLog] = useState(null);
  const [logOpen, setLogOpen] = useState(false);
  const { summary, loading, reload } = useWorkspaceSummary(scopeShopId);
  const tool = useMemo(() => findProfitTool(toolId), [toolId]);

  useEffect(() => {
    setExecLog(null);
    setLogOpen(false);
  }, [toolId]);

  function handleReport(report) {
    setExecLog(report);
    setLogOpen(true);
  }

  let pane = null;
  if (toolId === "connect") {
    pane = (
      <ProfitConnectPane
        summary={summary}
        loading={loading}
        onRefresh={reload}
        onImported={reload}
        scopeShopId={scopeShopId}
      />
    );
  } else if (toolId === "cost") {
    pane = <ProfitCostPane scopeShopId={scopeShopId} />;
  } else if (toolId === "ads") {
    pane = <ProfitAdsPane />;
  } else if (toolId === "inventory") {
    pane = <ProfitInventoryPane />;
  } else if (toolId === "profit-run") {
    pane = <ProfitRunPane summary={summary} onReport={handleReport} scopeShopId={scopeShopId} />;
  }

  return (
    <OpsStudioShell
      studio={profitStudio}
      toolId={toolId}
      onToolIdChange={setToolId}
      user={user}
      panelHint={tool?.panelHint}
      showLog={toolId === "profit-run"}
      logOpen={logOpen}
      onLogToggle={() => setLogOpen((v) => !v)}
      execLog={execLog}
    >
      {pane}
    </OpsStudioShell>
  );
}
