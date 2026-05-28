import { useCallback, useEffect, useMemo, useState } from "react";
import { growthStudio, defaultGrowthToolId, findGrowthTool } from "./growthStudioConfig.js";
import { OpsStudioShell } from "../opsStudio/OpsStudioShell.jsx";
import { OpsExtensionStatus } from "../opsStudio/OpsExtensionStatus.jsx";
import { OpsDiagnosisPackBar } from "../opsStudio/OpsDiagnosisPackBar.jsx";
import { OpsMetricsImport } from "../opsStudio/OpsMetricsImport.jsx";
import {
  OpsDiagnosisReport,
  OpsDriverList,
  OpsKpiGrid,
  OpsActionList,
} from "../opsStudio/OpsReportViews.jsx";
import {
  fetchWorkspaceSummary,
  formatError,
  runExtensionAnalyze,
} from "../opsStudio/opsStudioApi.js";
import {
  MOCK_KPI_BOARD,
  MOCK_WORKSPACE_SUMMARY,
  mockGrowthDiagnosisOutput,
} from "../opsStudio/opsStudioMocks.js";
import { CsToast } from "../csStudio/CsToast.jsx";
import "../creativeStudio/creativeStudio.css";
import "../csStudio/csStudio.css";
import "../opsStudio/opsStudio.css";

function useWorkspaceSummary(scopeShopId) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("enterprise_token");
    try {
      if (!token) {
        if (import.meta.env.DEV) {
          setSummary(MOCK_WORKSPACE_SUMMARY);
          return;
        }
        setSummary(null);
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

function GrowthConnectPane({ summary, loading, onRefresh, onImported, scopeShopId }) {
  return (
    <div className="ent-ops-pane-scroll">
      <OpsExtensionStatus summary={summary} loading={loading} onRefresh={onRefresh} />
      <OpsDiagnosisPackBar pack={summary?.diagnosisPack} />
      {!scopeShopId ? (
        <div className="ent-ops-callout ent-ops-callout--warn">请先在顶部选择店铺。</div>
      ) : !summary?.growthReady ? (
        <div className="ent-ops-callout ent-ops-callout--warn">
          数据未就绪：请用插件同步至少 2 类页面（概览/订单/广告/库存），或导入店铺经营 CSV。
        </div>
      ) : (
        <div className="ent-ops-callout ent-ops-callout--ok">已满足最低诊断条件，可进入「运行业绩诊断」。</div>
      )}
      <OpsMetricsImport variant="growth" scopeShopId={scopeShopId} onImported={onImported} />
      <details className="ent-ops-guide">
        <summary>卖家实操：如何凑齐诊断包</summary>
        <ol>
          <li>安装企业浏览器助手并登录 TikTok 卖家中心</li>
          <li>依次打开「数据概览」「订单」「广告/推广」「商品库存」页面</li>
          <li>每页点击插件「同步本页」—— 进度见上方诊断包</li>
          <li>（推荐）下载店铺 CSV 模板，填本周期 + 上周期两行后导入</li>
        </ol>
      </details>
    </div>
  );
}

function GrowthKpiPane() {
  const board = MOCK_KPI_BOARD;
  return (
    <div className="ent-ops-pane-scroll">
      <p className="ent-ops-period-label">{board.period}</p>
      <OpsKpiGrid kpis={board.metrics.map((m) => ({ ...m, value: m.value, status: m.status }))} />
      <div className="ent-ops-card">
        <h3>波动驱动因素（规则预计算）</h3>
        <OpsDriverList drivers={board.drivers} />
      </div>
      <p className="ent-ops-field-hint">
        导入两周期店铺 CSV 后，KPI 与驱动因素将基于你的真实数据重算；当前为演示结构。
      </p>
    </div>
  );
}

function GrowthDiagnosePane({ summary, onReport, scopeShopId }) {
  const [range, setRange] = useState("近 7 天");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState(null);
  const [rawAnswer, setRawAnswer] = useState("");
  const [toast, setToast] = useState("");
  const ready = summary?.growthReady;

  async function runDiagnosis() {
    setBusy(true);
    setReport(null);
    setRawAnswer("");
    const token = localStorage.getItem("enterprise_token");
    const input = [
      `数据周期：${range}`,
      note.trim() ? `卖家补充：${note.trim()}` : "",
      "请输出：KPI 摘要、P0/P1 动作清单、需人工补充的数据字段。",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      if (!token) {
        if (import.meta.env.DEV) {
          await new Promise((r) => setTimeout(r, 700));
          const mock = mockGrowthDiagnosisOutput(note);
          setReport(mock);
          onReport?.(mock);
          return;
        }
        throw new Error("请先登录后再运行业绩诊断");
      }
      if (!scopeShopId) throw new Error("请先在顶部选择店铺");
      const data = await runExtensionAnalyze("growth", input, scopeShopId);
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
        <OpsDiagnosisPackBar pack={summary?.diagnosisPack} compact />
        {!ready ? (
          <div className="ent-ops-callout ent-ops-callout--warn">请先完成「数据连接」中的诊断包或 CSV 导入。</div>
        ) : null}
        <label className="ent-cs-field">
          <span className="ent-cs-field-label">数据周期</span>
          <select className="ent-cs-control" value={range} onChange={(e) => setRange(e.target.value)}>
            <option>近 7 天</option>
            <option>近 30 天</option>
            <option>本月</option>
            <option>自定义（随 CSV 周期）</option>
          </select>
        </label>
        <label className="ent-cs-field">
          <span className="ent-cs-field-label">诊断重点（可选）</span>
          <textarea
            className="ent-cs-control ent-cs-textarea"
            rows={4}
            value={note}
            placeholder="例如：GMV 下滑、某 SKU 库存积压、广告 ROAS 变差…"
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
        <button type="button" className="ent-cs-submit" disabled={!ready || busy} onClick={runDiagnosis}>
          {busy ? "诊断生成中…" : "运行业绩诊断"}
        </button>
        <p className="ent-cs-form-footnote">消耗套餐 Agent 次数；报告基于插件快照 + CSV，非 TikTok 官方 API。</p>
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

function GrowthActionsPane({ lastReport }) {
  const actions = lastReport?.actions || mockGrowthDiagnosisOutput("").actions;
  return (
    <div className="ent-ops-pane-scroll">
      <p className="ent-ops-metrics-desc">
        来自最近一次「运行业绩诊断」的待办。建议 P0 当日处理，P1 本周内闭环，并在 KPI 看板验证效果。
      </p>
      <OpsActionList actions={actions} />
      {!lastReport ? (
        <p className="ent-ops-field-hint">当前为演示动作清单；运行诊断后将自动更新。</p>
      ) : null}
    </div>
  );
}

export function GrowthStudioWorkbench({ user, scopeShopId = "" }) {
  const [toolId, setToolId] = useState(defaultGrowthToolId);
  const [lastReport, setLastReport] = useState(null);
  const [logOpen, setLogOpen] = useState(false);
  const [execLog, setExecLog] = useState(null);
  const { summary, loading, reload } = useWorkspaceSummary(scopeShopId);
  const tool = useMemo(() => findGrowthTool(toolId), [toolId]);

  useEffect(() => {
    setExecLog(null);
    setLogOpen(false);
  }, [toolId]);

  function handleReport(report) {
    setLastReport(report);
    setExecLog(report);
    setLogOpen(true);
  }

  let pane = null;
  if (toolId === "connect") {
    pane = (
      <GrowthConnectPane
        summary={summary}
        loading={loading}
        onRefresh={reload}
        onImported={reload}
        scopeShopId={scopeShopId}
      />
    );
  } else if (toolId === "kpi") {
    pane = <GrowthKpiPane />;
  } else if (toolId === "diagnose") {
    pane = <GrowthDiagnosePane summary={summary} onReport={handleReport} scopeShopId={scopeShopId} />;
  } else if (toolId === "actions") {
    pane = <GrowthActionsPane lastReport={lastReport} />;
  }

  return (
    <OpsStudioShell
      studio={growthStudio}
      toolId={toolId}
      onToolIdChange={setToolId}
      user={user}
      panelHint={tool?.panelHint}
      showLog={toolId === "diagnose"}
      logOpen={logOpen}
      onLogToggle={() => setLogOpen((v) => !v)}
      execLog={execLog}
    >
      {pane}
    </OpsStudioShell>
  );
}
