import React, { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Check,
  Circle,
  Headphones,
  LineChart,
  RefreshCw,
  Shield,
  Zap,
} from "lucide-react";

const PACK_ORDER = ["analytics", "orders", "ads", "inventory"];

function formatRelativeTime(iso) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "刚刚";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`;
  return new Date(iso).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function useExtensionWorkspaceSummary(authHeaders, enabled = true) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const response = await fetch("/api/extension/workspace-summary?platform=tiktok", { headers: authHeaders() });
      const data = await response.json();
      if (response.ok) setSummary(data.summary);
    } catch {
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [authHeaders, enabled]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { summary, loading, reload };
}

function DiagnosisPackBar({ pack, compact = false }) {
  if (!pack) return null;
  return (
    <div className={`tt-pack-bar ${compact ? "is-compact" : ""}`}>
      <div className="tt-pack-head">
        <strong>诊断包 {pack.done}/{pack.total}</strong>
        {!compact && <span>插件在卖家中心同步：概览 → 订单 → 广告 → 库存</span>}
      </div>
      <div className="tt-pack-chips">
        {PACK_ORDER.map((key) => {
          const page = pack.pages?.[key];
          if (!page) return null;
          return (
            <span key={key} className={page.synced ? "tt-pack-chip is-done" : "tt-pack-chip"}>
              {page.synced ? <Check size={14} aria-hidden /> : <Circle size={12} aria-hidden />}
              {page.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function ExtensionStatusStrip({ summary, loading, onRefresh, onOpenExtensionGuide }) {
  return (
    <section className="tt-status-strip" aria-label="TikTok 插件数据状态">
      <div className="tt-status-main">
        <span className={summary?.extensionConnected ? "tt-dot is-on" : "tt-dot"} aria-hidden />
        <div>
          <strong>{summary?.extensionConnected ? "插件已有同步数据" : "尚未检测到插件同步"}</strong>
          <p>
            {summary?.shopName ? `${summary.shopName} · ` : ""}
            最后同步 {formatRelativeTime(summary?.latestSnapshotAt)}
            {summary?.metricsImport ? ` · CSV ${summary.metricsImport.skuCount} SKU` : ""}
          </p>
        </div>
      </div>
      <div className="tt-status-actions">
        <button type="button" className="header-ghost slim" onClick={onRefresh} disabled={loading}>
          <RefreshCw size={14} aria-hidden /> 刷新
        </button>
        {!summary?.extensionConnected && onOpenExtensionGuide ? (
          <button type="button" className="continue-checkout slim" onClick={onOpenExtensionGuide}>
            安装 TikTok 插件
          </button>
        ) : null}
      </div>
    </section>
  );
}

export function GrowthDiagnosisPanel({ summary, onRun, running, note, onNoteChange, metricsSection }) {
  const ready = summary?.growthReady;
  return (
    <div className="tt-agent-panel">
      <div className="tt-panel-intro">
        <BarChart3 size={20} aria-hidden />
        <div>
          <h4>业绩诊断中心</h4>
          <p>插件采集后台页面 + 可选 CSV，生成 P0/P1 动作清单。建议诊断包至少 2/4 再运行。</p>
        </div>
      </div>
      <DiagnosisPackBar pack={summary?.diagnosisPack} />
      {!ready ? (
        <div className="tt-callout tt-callout-warn">
          <AlertTriangle size={16} aria-hidden />
          <p>数据未就绪：请用插件在卖家中心同步至少 2 类页面，或导入店铺经营 CSV。</p>
        </div>
      ) : null}
      {metricsSection}
      <label className="tt-note-field">
        补充说明（可选）
        <textarea
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder="例如：最近 7 天 GMV 下滑、主推 SKU、想重点看的指标…"
          rows={3}
        />
      </label>
      <button type="button" className="continue-checkout tt-run-btn" disabled={!ready || running} onClick={onRun}>
        {running ? "诊断生成中…" : ready ? "运行业绩诊断" : "请先同步诊断包或导入 CSV"}
      </button>
    </div>
  );
}

const PROFIT_EXPORT_TIPS = [
  "卖家中心 → 商品/库存：看在售 SKU 与库存数量（插件可同步样本）",
  "卖家中心 → 广告/推广：看花费、ROAS（插件可同步样本，非官方 API）",
  "卖家中心 → 财务/结算导出 或 ERP：采购价、头程 → 填入「SKU 库存/成本模板」",
  "无法导出成本时：在下方粘贴「SKU, 采购价, 头程」简易表，精度低于 CSV",
];

export function ProfitWorkbenchPanel({
  summary,
  onRun,
  running,
  note,
  onNoteChange,
  manualCost,
  onManualCostChange,
  profitMode,
  onProfitModeChange,
  metricsSection,
}) {
  const profit = summary?.profit;
  const modes = [
    { id: "precise", label: "精算", desc: "广告/库存快照 + SKU 成本", disabled: !profit?.canRunPrecise },
    { id: "trend", label: "趋势", desc: "仅插件广告/库存样本", disabled: !profit?.canRunTrend },
    { id: "framework", label: "框架", desc: "无完整数据时的原则清单", disabled: false },
  ];

  return (
    <div className="tt-agent-panel">
      <div className="tt-panel-intro">
        <LineChart size={20} aria-hidden />
        <div>
          <h4>广告 · 库存 · 利润工作台</h4>
          <p>
            插件<strong>不能</strong>读取 SKU 采购成本；精确毛利依赖 CSV 或手工成本表。插件适合抓广告花费与库存数量样本。
          </p>
        </div>
      </div>

      <div className="tt-profit-mode-card">
        <span className="tt-profit-mode-badge">{profit?.modeLabel || "框架模式"}</span>
        <p>{profit?.hint}</p>
        <div className="tt-profit-signals">
          <span className={profit?.hasAds ? "is-yes" : ""}>广告页 {profit?.hasAds ? "✓" : "○"}</span>
          <span className={profit?.hasInventory ? "is-yes" : ""}>库存页 {profit?.hasInventory ? "✓" : "○"}</span>
          <span className={profit?.hasSkuCost ? "is-yes" : ""}>SKU 成本 {profit?.hasSkuCost ? `✓ ${profit.skuCount}` : "○"}</span>
        </div>
      </div>

      <DiagnosisPackBar pack={summary?.diagnosisPack} compact />

      <details className="tt-export-guide">
        <summary>插件抓不到成本？推荐数据补齐路径</summary>
        <ol>
          {PROFIT_EXPORT_TIPS.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ol>
      </details>

      {metricsSection}

      <div className="tt-mode-picker">
        <span className="tt-mode-picker-label">分析模式</span>
        {modes.map((m) => (
          <button
            key={m.id}
            type="button"
            className={profitMode === m.id ? "tt-mode-btn is-active" : "tt-mode-btn"}
            disabled={m.disabled}
            onClick={() => onProfitModeChange(m.id)}
            title={m.desc}
          >
            {m.label}
          </button>
        ))}
      </div>

      <label className="tt-note-field">
        手工 SKU 成本表（可选，插件无法获取）
        <textarea
          value={manualCost}
          onChange={(e) => onManualCostChange(e.target.value)}
          placeholder={"SKU, 采购价, 头程\nSKU-001, 12.5, 3.2\nSKU-002, 8.0, 2.1"}
          rows={4}
        />
      </label>

      <label className="tt-note-field">
        分析重点（可选）
        <textarea
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder="例如：哪些 SKU 应停投、哪些需补货、广告预算如何调整…"
          rows={2}
        />
      </label>

      <button
        type="button"
        className="continue-checkout tt-run-btn"
        disabled={running || (profitMode === "precise" && !profit?.canRunPrecise) || (profitMode === "trend" && !profit?.canRunTrend)}
        onClick={() => onRun(profitMode)}
      >
        {running ? "分析中…" : "运行利润分析"}
      </button>
    </div>
  );
}

const CS_TABS = [
  { id: "alerts", label: "待处理" },
  { id: "rules", label: "自动化规则" },
  { id: "faq", label: "FAQ 模板" },
  { id: "drill", label: "离线演练" },
];

export function CsControlConsole({
  authHeaders,
  showToast,
  formatError,
  summary,
  onRefreshSummary,
  onOpenExtensionGuide,
  drillText,
  onDrillTextChange,
  onDrillRun,
  drillResult,
  drillBusy,
}) {
  const [tab, setTab] = useState("alerts");
  const [alerts, setAlerts] = useState([]);
  const [settings, setSettings] = useState(null);
  const [faqTemplates, setFaqTemplates] = useState([]);
  const [busy, setBusy] = useState(false);
  const [draftSettings, setDraftSettings] = useState(null);

  async function loadCsData() {
    try {
      const [aRes, sRes, fRes] = await Promise.all([
        fetch("/api/extension/cs/alerts", { headers: authHeaders() }),
        fetch("/api/extension/cs/settings", { headers: authHeaders() }),
        fetch("/api/extension/cs/faq", { headers: authHeaders() }),
      ]);
      const [aData, sData, fData] = await Promise.all([aRes.json(), sRes.json(), fRes.json()]);
      if (aRes.ok) setAlerts(aData.alerts || []);
      if (sRes.ok) {
        setSettings(sData.settings);
        setDraftSettings(sData.settings);
      }
      if (fRes.ok) setFaqTemplates(fData.templates || []);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    loadCsData();
  }, []);

  async function markRead(id) {
    setBusy(true);
    try {
      const response = await fetch(`/api/extension/cs/alerts/${id}/read`, { method: "POST", headers: authHeaders() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      await loadCsData();
    } catch (error) {
      showToast(formatError(error));
    } finally {
      setBusy(false);
    }
  }

  async function saveSettings() {
    setBusy(true);
    try {
      const response = await fetch("/api/extension/cs/settings", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(draftSettings || {}),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setSettings(data.settings);
      showToast("自动化规则已保存");
    } catch (error) {
      showToast(formatError(error));
    } finally {
      setBusy(false);
    }
  }

  const unreadCount = alerts.filter((a) => !a.read).length;

  return (
    <div className="tt-agent-panel tt-cs-console">
      <div className="tt-panel-intro">
        <Headphones size={20} aria-hidden />
        <div>
          <h4>客服控制台</h4>
          <p>
            <strong>实时回复在 TikTok 插件里完成</strong>（识别消息、生成话术、FAQ/售后自动发）。此处配置规则、处理告警、管理 FAQ。
          </p>
        </div>
      </div>

      <ExtensionStatusStrip
        summary={summary}
        loading={false}
        onRefresh={() => {
          onRefreshSummary?.();
          loadCsData();
        }}
        onOpenExtensionGuide={onOpenExtensionGuide}
      />

      <div className="tt-cs-tabs" role="tablist">
        {CS_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={tab === t.id ? "tt-cs-tab is-active" : "tt-cs-tab"}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {t.id === "alerts" && unreadCount > 0 ? <em>{unreadCount}</em> : null}
          </button>
        ))}
      </div>

      {tab === "alerts" && (
        <div className="tt-cs-pane">
          {!alerts.length ? (
            <p className="tt-empty">暂无售后告警。插件在 TikTok 聊天页处理买家消息；售后类会自动通知此处。</p>
          ) : (
            <ul className="tt-alert-list">
              {alerts.map((a) => (
                <li key={a.id} className={a.read ? "is-read" : ""}>
                  <div>
                    <strong>{a.intent?.category || "售后"} · {a.shopName || "店铺"}</strong>
                    <p>{a.buyerText?.slice(0, 200)}</p>
                    <small>{formatRelativeTime(a.createdAt)} · {a.channel || "extension"}</small>
                  </div>
                  {!a.read ? (
                    <button type="button" className="header-ghost slim" disabled={busy} onClick={() => markRead(a.id)}>
                      标记已处理
                    </button>
                  ) : (
                    <span className="tt-read-tag">已读</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "rules" && draftSettings && (
        <div className="tt-cs-pane">
          <label className="tt-toggle-row">
            <input
              type="checkbox"
              checked={Boolean(draftSettings.extensionAutoSendFaq)}
              onChange={(e) => setDraftSettings({ ...draftSettings, extensionAutoSendFaq: e.target.checked })}
            />
            插件：FAQ 匹配后自动发送
          </label>
          <label className="tt-toggle-row">
            <input
              type="checkbox"
              checked={Boolean(draftSettings.extensionAutoSendAfterSales)}
              onChange={(e) => setDraftSettings({ ...draftSettings, extensionAutoSendAfterSales: e.target.checked })}
            />
            插件：售后类自动发安抚模板并告警
          </label>
          <label className="tt-toggle-row">
            <input
              type="checkbox"
              checked={Boolean(draftSettings.nightAiEnabled)}
              onChange={(e) => setDraftSettings({ ...draftSettings, nightAiEnabled: e.target.checked })}
            />
            北京夜间（23:00–09:00）启用 AI 兜底回复
          </label>
          <label className="tt-note-field">
            售后安抚模板（中文）
            <textarea
              rows={3}
              value={draftSettings.afterSalesTemplateZh || ""}
              onChange={(e) => setDraftSettings({ ...draftSettings, afterSalesTemplateZh: e.target.value })}
            />
          </label>
          <button type="button" className="continue-checkout slim" disabled={busy} onClick={saveSettings}>
            保存规则
          </button>
          <p className="tt-hint">
            <Shield size={14} aria-hidden /> 插件<strong>不会</strong>代替你在后台改订单/退款；高风险仍须人工确认。
          </p>
        </div>
      )}

      {tab === "faq" && (
        <div className="tt-cs-pane">
          {!faqTemplates.length ? (
            <p className="tt-empty">
              暂无 FAQ 模板。可在插件面板维护，或后续在此添加。模板用于插件自动匹配买家常见问题。
            </p>
          ) : (
            <ul className="tt-faq-list">
              {faqTemplates.slice(0, 20).map((t) => (
                <li key={t.id}>
                  <strong>{t.name}</strong>
                  <p>{t.text?.slice(0, 160)}</p>
                  <small>{(t.triggers || []).join(" · ") || "无触发词"}</small>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "drill" && (
        <div className="tt-cs-pane">
          <p className="tt-hint">粘贴一条买家消息，测试分层路由（FAQ / 售后 / 夜间 AI / 草稿），不发送到 TikTok。</p>
          <label className="tt-note-field">
            买家消息
            <textarea
              rows={4}
              value={drillText}
              onChange={(e) => onDrillTextChange(e.target.value)}
              placeholder="Where is my order? It's been 2 weeks..."
            />
          </label>
          <button type="button" className="continue-checkout slim" disabled={drillBusy || !drillText.trim()} onClick={onDrillRun}>
            {drillBusy ? "路由中…" : "测试分层路由"}
          </button>
          {drillResult ? (
            <div className="tt-drill-result">
              <strong>层级：{drillResult.tier}</strong>
              <p>{drillResult.reason}</p>
              {drillResult.replyText ? <pre>{drillResult.replyText}</pre> : null}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export function TikTokAgentHint({ agentId }) {
  if (agentId === "service") {
    return (
      <p className="tt-workspace-hint">
        <Zap size={14} aria-hidden /> 主战场在 <strong>TikTok 插件</strong>；本页为控制台 + 离线演练。
      </p>
    );
  }
  if (agentId === "profit") {
    return (
      <p className="tt-workspace-hint">
        利润精算需 <strong>SKU 成本 CSV</strong>；插件仅辅助广告/库存页面样本。
      </p>
    );
  }
  if (agentId === "growth") {
    return (
      <p className="tt-workspace-hint">
        建议诊断包 ≥2/4 或已导入经营 CSV 后再运行。
      </p>
    );
  }
  return null;
}
