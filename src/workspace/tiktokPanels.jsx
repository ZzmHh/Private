import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Check,
  Circle,
  Headphones,
  LineChart,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  UploadCloud,
  Zap,
} from "lucide-react";
import {
  FAQ_CATEGORY_OPTIONS,
  TIKTOK_SHOP_LANGUAGES,
  buildLanguageSelectOptions,
  downloadFaqTemplateCsv,
  emptyFaqDraft,
  getLanguageLabel,
  parseFaqCsvText,
} from "../lib/csFaqTemplates.js";

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
  { id: "analytics", label: "数据看板" },
  { id: "rules", label: "自动化规则" },
  { id: "faq", label: "FAQ 模板" },
  { id: "drill", label: "离线演练" },
];

const TIER_LABELS = {
  aftersales: "售后安抚",
  faq: "FAQ / 问候",
  night_ai: "夜间 AI 兜底",
  manual: "人工草稿",
};

const ACTION_LABELS = {
  auto_send: "可自动发送",
  draft: "仅草稿",
};

function CsShopScopeBar({ shops, shopKey, onShopKeyChange, hint }) {
  return (
    <div className="tt-cs-shop-bar">
      <label>
        店铺范围
        <select value={shopKey} onChange={(e) => onShopKeyChange(e.target.value)}>
          <option value="">全店通用（全局模板）</option>
          {shops.map((s) => (
            <option key={s.shopKey} value={s.shopKey}>
              {s.shopName || s.shopKey}
            </option>
          ))}
        </select>
      </label>
      <p className="tt-hint">{hint}</p>
    </div>
  );
}

function CsAnalyticsPanel({ authHeaders, analytics, loading, onReload, days, onDaysChange }) {
  if (loading && !analytics) {
    return <p className="tt-empty">加载客服数据中…</p>;
  }
  if (!analytics) {
    return (
      <p className="tt-empty">
        暂无统计数据。插件在 TikTok 聊天页处理买家消息后会自动累计。
        <button type="button" className="header-ghost slim" onClick={onReload}>
          刷新
        </button>
      </p>
    );
  }

  const metrics = [
    { label: "FAQ 模板命中率", value: `${analytics.faqHitRate}%`, hint: "用户 FAQ 模板命中 / 总路由" },
    { label: "自动发送率", value: `${analytics.autoSendRate}%`, hint: "套餐允许且动作为 auto_send" },
    { label: "售后路由占比", value: `${analytics.aftersalesRate}%`, hint: "触发售后安抚 + 告警" },
    { label: "夜间 AI 占比", value: `${analytics.nightAiRate}%`, hint: "北京休息时段 AI 兜底" },
    {
      label: "售后告警均时",
      value: analytics.alertAvgHandleMinutes != null ? `${analytics.alertAvgHandleMinutes} 分钟` : "—",
      hint: "从告警到标记已处理的平均时长",
    },
    { label: "待处理告警", value: String(analytics.alertUnread ?? 0), hint: `近 ${analytics.windowDays} 天共 ${analytics.totalRoutes} 次路由` },
  ];

  return (
    <div className="tt-cs-analytics">
      <div className="tt-cs-analytics-toolbar">
        <label>
          统计窗口
          <select value={days} onChange={(e) => onDaysChange(Number(e.target.value))}>
            <option value={7}>近 7 天</option>
            <option value={30}>近 30 天</option>
            <option value={90}>近 90 天</option>
          </select>
        </label>
        <button type="button" className="header-ghost slim" onClick={onReload}>
          <RefreshCw size={14} aria-hidden /> 刷新
        </button>
      </div>
      <div className="tt-cs-analytics-grid">
        {metrics.map((m) => (
          <div key={m.label} className="tt-cs-metric-card">
            <span>{m.label}</span>
            <strong>{m.value}</strong>
            <small>{m.hint}</small>
          </div>
        ))}
      </div>
      {analytics.byDay?.length ? (
        <div className="tt-cs-analytics-section">
          <h5>近 {analytics.byDay.length} 日趋势</h5>
          <ul className="tt-cs-trend-list">
            {analytics.byDay.map((d) => (
              <li key={d.date}>
                <span>{d.date}</span>
                <span>{d.total} 次路由</span>
                <span>FAQ {d.faq}</span>
                <span>自动发 {d.autoSend}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {analytics.byLang?.length ? (
        <div className="tt-cs-analytics-section">
          <h5>买家语言分布</h5>
          <ul className="tt-cs-lang-list">
            {analytics.byLang.map((row) => (
              <li key={row.lang}>
                <span>{getLanguageLabel(row.lang)}</span>
                <em>{row.count}</em>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function CsMultiLangTemplatesEditor({ draftSettings, setDraftSettings, field, title, rows = 3 }) {
  const [lang, setLang] = useState("en");
  const map = draftSettings?.[field] || {};
  const value = map[lang] || "";

  function update(nextText) {
    setDraftSettings({
      ...draftSettings,
      [field]: { ...map, [lang]: nextText },
    });
  }

  return (
    <div className="tt-cs-template-langs">
      <div className="tt-cs-template-langs-head">
        <strong>{title}</strong>
        <select value={lang} onChange={(e) => setLang(e.target.value)}>
          {TIKTOK_SHOP_LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {getLanguageLabel(l.code)}
            </option>
          ))}
        </select>
      </div>
      <textarea rows={rows} value={value} onChange={(e) => update(e.target.value)} />
      <p className="tt-hint">可使用 {"{shopName}"}、{"{sla}"} 变量 · 共 {TIKTOK_SHOP_LANGUAGES.length} 种站点语言</p>
    </div>
  );
}

function DrillResultPanel({ result }) {
  if (!result) return null;
  const faq = result.faqMatch;
  const intent = result.intent || {};
  const rows = [
    ["路由层级", TIER_LABELS[result.tier] || result.tier || "—"],
    ["动作", ACTION_LABELS[result.action] || result.action || "—"],
    ["识别语言", result.langLabel || getLanguageLabel(result.lang) || result.lang || "—"],
    ["北京夜间", result.beijingNight ? "是（休息时段）" : "否（工作时段）"],
    ["SLA 占位", result.sla || "—"],
    ["意图分类", intent.category || "—"],
    ["路由说明", result.reason || "—"],
  ];
  if (faq) {
    rows.push(["FAQ 模板", faq.name || "—"]);
    rows.push(["FAQ 来源", faq.source || "—"]);
    if (faq.lang) rows.push(["FAQ 语言", getLanguageLabel(faq.lang)]);
    if (faq.category) rows.push(["FAQ 分类", faq.category]);
    if (faq.score != null) rows.push(["匹配得分", String(faq.score)]);
    if (faq.shopKey != null) rows.push(["FAQ 店铺", faq.shopKey ? faq.shopKey : "全店通用"]);
  }
  if (result.templateUsed) {
    rows.push(["内置模板", `${result.templateUsed.kind || "—"} · ${getLanguageLabel(result.templateUsed.lang)}`]);
  }
  if (result.notifySeller) rows.push(["卖家告警", result.sellerMessage || "将通知卖家"]);

  return (
    <div className="tt-drill-result">
      <strong>演练结果</strong>
      <dl className="tt-drill-grid">
        {rows.map(([label, val]) => (
          <div key={label} className="tt-drill-kv">
            <dt>{label}</dt>
            <dd>{val}</dd>
          </div>
        ))}
      </dl>
      {result.replyText ? (
        <>
          <strong className="tt-drill-reply-label">拟回复话术</strong>
          <pre>{result.replyText}</pre>
        </>
      ) : null}
      {result.error ? <p className="tt-drill-error">{result.error}</p> : null}
    </div>
  );
}

function FaqTemplateManager({ authHeaders, showToast, formatError, templates, onReload, busy, setBusy, shopKey, shopLabel }) {
  const [draft, setDraft] = useState(emptyFaqDraft);
  const [editingId, setEditingId] = useState(null);
  const importRef = useRef(null);
  const languageOptions = buildLanguageSelectOptions();

  function startEdit(template) {
    setEditingId(template.id);
    setDraft({
      id: template.id,
      name: template.name || "",
      triggers: (template.triggers || []).join(" | "),
      text: template.text || "",
      category: template.category || "",
      lang: template.lang || "en",
    });
  }

  function resetDraft() {
    setEditingId(null);
    setDraft(emptyFaqDraft());
  }

  async function saveDraft() {
    if (!draft.text.trim()) {
      showToast("请填写回复内容。");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/extension/cs/faq", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          shopKey: shopKey || "",
          template: {
            id: draft.id || undefined,
            name: draft.name.trim() || "未命名模板",
            text: draft.text.trim(),
            triggers: draft.triggers
              .split(/[,，|/;；]+/)
              .map((s) => s.trim())
              .filter(Boolean),
            category: draft.category,
            lang: draft.lang || "",
          },
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      showToast(editingId ? "FAQ 模板已更新" : "FAQ 模板已添加");
      resetDraft();
      await onReload();
    } catch (error) {
      showToast(formatError(error));
    } finally {
      setBusy(false);
    }
  }

  async function removeTemplate(id) {
    if (!window.confirm("确定删除这条 FAQ 模板？")) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/extension/cs/faq/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      showToast("已删除");
      if (editingId === id) resetDraft();
      await onReload();
    } catch (error) {
      showToast(formatError(error));
    } finally {
      setBusy(false);
    }
  }

  async function importCsvText(text, mode) {
    const parsed = parseFaqCsvText(text);
    if (!parsed.length) {
      showToast("未能解析 CSV，请使用下载的模板格式。");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/extension/cs/faq/import", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ shopKey: shopKey || "", mode, templates: parsed }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      showToast(`已导入 ${data.count} 条 FAQ 模板`);
      await onReload();
    } catch (error) {
      showToast(formatError(error));
    } finally {
      setBusy(false);
    }
  }

  async function handleImportFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const text = await file.text();
    const mode = window.confirm("点「确定」= 合并导入（同名覆盖）；点「取消」= 全量替换现有模板") ? "merge" : "replace";
    await importCsvText(text, mode);
  }

  return (
    <div className="tt-faq-manager">
      <div className="tt-faq-toolbar">
        <p className="tt-hint tt-faq-intro">
          当前编辑：<strong>{shopLabel}</strong>。覆盖 15 国站点语言；插件识别买家语言后优先匹配同语言 FAQ。
        </p>
        <div className="tt-faq-toolbar-actions">
          <button type="button" className="header-ghost slim" onClick={downloadFaqTemplateCsv}>
            下载 CSV 模板
          </button>
          <label className="import-btn slim">
            <UploadCloud size={14} aria-hidden />
            导入 CSV
            <input ref={importRef} type="file" accept=".csv,text/csv" onChange={handleImportFile} hidden />
          </label>
        </div>
      </div>

      <div className="tt-faq-editor">
        <h5>{editingId ? "编辑模板" : "新增模板"}</h5>
        <div className="tt-faq-editor-grid">
          <label>
            模板名称
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="例如：物流时效"
            />
          </label>
          <label>
            触发关键词
            <input
              value={draft.triggers}
              onChange={(e) => setDraft({ ...draft, triggers: e.target.value })}
              placeholder="物流 | shipping | 几天到（用 | 或逗号分隔）"
            />
          </label>
          <label>
            分类
            <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
              {FAQ_CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value || "auto"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            语言 / 国家站点
            <select value={draft.lang} onChange={(e) => setDraft({ ...draft, lang: e.target.value })}>
              <option value="">通用（不限语言）</option>
              {languageOptions.map((group) => (
                <optgroup key={group.id} label={group.label}>
                  {group.options.map((opt) => (
                    <option key={`${group.id}-${opt.value}`} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
        </div>
        <label className="tt-note-field">
          回复内容（可使用 {"{shopName}"}、{"{sla}"} 变量）
          <textarea
            rows={4}
            value={draft.text}
            onChange={(e) => setDraft({ ...draft, text: e.target.value })}
            placeholder="Hi! Thanks for reaching out..."
          />
        </label>
        <div className="tt-faq-editor-actions">
          <button type="button" className="continue-checkout slim" disabled={busy} onClick={saveDraft}>
            <Plus size={14} aria-hidden /> {editingId ? "保存修改" : "添加模板"}
          </button>
          {editingId ? (
            <button type="button" className="header-ghost slim" disabled={busy} onClick={resetDraft}>
              取消编辑
            </button>
          ) : null}
        </div>
      </div>

      {!templates.length ? (
        <p className="tt-empty">还没有 FAQ。可上方手动添加，或下载 CSV 模板填好后导入。</p>
      ) : (
        <ul className="tt-faq-list">
          {templates.map((t) => (
            <li key={t.id}>
              <div className="tt-faq-list-body">
                <strong>{t.name}</strong>
                <p>{t.text?.slice(0, 200)}{t.text?.length > 200 ? "…" : ""}</p>
                <small>
                  {(t.triggers || []).join(" · ") || "无触发词"}
                  {t.category ? ` · ${t.category}` : ""}
                  {t.lang ? ` · ${getLanguageLabel(t.lang)}` : " · 通用"}
                </small>
              </div>
              <div className="tt-faq-list-actions">
                <button type="button" className="header-ghost slim" disabled={busy} onClick={() => startEdit(t)}>
                  编辑
                </button>
                <button type="button" className="header-ghost slim danger" disabled={busy} onClick={() => removeTemplate(t.id)}>
                  <Trash2 size={14} aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

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
  const [shops, setShops] = useState([]);
  const [csShopKey, setCsShopKey] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [analyticsDays, setAnalyticsDays] = useState(30);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [draftSettings, setDraftSettings] = useState(null);

  const shopLabel = csShopKey
    ? shops.find((s) => s.shopKey === csShopKey)?.shopName || csShopKey
    : "全店通用（全局模板）";

  async function loadShops() {
    try {
      const response = await fetch("/api/extension/cs/shops?platform=tiktok", { headers: authHeaders() });
      const data = await response.json();
      if (response.ok) setShops(data.shops || []);
    } catch {
      /* ignore */
    }
  }

  async function loadFaqForShop(shopKey = csShopKey) {
    try {
      const qs = new URLSearchParams({ editor: "1", shopKey: shopKey || "" });
      const response = await fetch(`/api/extension/cs/faq?${qs}`, { headers: authHeaders() });
      const data = await response.json();
      if (response.ok) setFaqTemplates(data.templates || []);
    } catch {
      /* ignore */
    }
  }

  async function loadAnalytics(days = analyticsDays) {
    setAnalyticsLoading(true);
    try {
      const response = await fetch(`/api/extension/cs/analytics?days=${days}`, { headers: authHeaders() });
      const data = await response.json();
      if (response.ok) setAnalytics(data.analytics);
    } catch {
      setAnalytics(null);
    } finally {
      setAnalyticsLoading(false);
    }
  }

  async function loadCsData() {
    try {
      const [aRes, sRes] = await Promise.all([
        fetch("/api/extension/cs/alerts", { headers: authHeaders() }),
        fetch("/api/extension/cs/settings", { headers: authHeaders() }),
      ]);
      const [aData, sData] = await Promise.all([aRes.json(), sRes.json()]);
      if (aRes.ok) setAlerts(aData.alerts || []);
      if (sRes.ok) {
        setSettings(sData.settings);
        setDraftSettings(sData.settings);
      }
      await loadFaqForShop(csShopKey);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    loadShops();
    loadCsData();
  }, []);

  useEffect(() => {
    loadFaqForShop(csShopKey);
  }, [csShopKey]);

  useEffect(() => {
    if (tab === "analytics") loadAnalytics(analyticsDays);
  }, [tab, analyticsDays]);

  async function markRead(id) {
    setBusy(true);
    try {
      const response = await fetch(`/api/extension/cs/alerts/${id}/read`, { method: "POST", headers: authHeaders() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      await loadCsData();
      if (tab === "analytics") await loadAnalytics(analyticsDays);
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
            <strong>实时回复在 TikTok 插件里完成</strong>（识别消息、生成话术、FAQ/售后自动发）。此处配置规则、<strong>管理 FAQ 模板</strong>、处理告警。
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

      {tab === "analytics" && (
        <div className="tt-cs-pane">
          <CsAnalyticsPanel
            authHeaders={authHeaders}
            analytics={analytics}
            loading={analyticsLoading}
            onReload={() => loadAnalytics(analyticsDays)}
            days={analyticsDays}
            onDaysChange={setAnalyticsDays}
          />
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
          <CsMultiLangTemplatesEditor
            draftSettings={draftSettings}
            setDraftSettings={setDraftSettings}
            field="afterSalesTemplates"
            title="售后安抚模板"
            rows={3}
          />
          <CsMultiLangTemplatesEditor
            draftSettings={draftSettings}
            setDraftSettings={setDraftSettings}
            field="greetingTemplates"
            title="问候模板"
            rows={2}
          />
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
          <CsShopScopeBar
            shops={shops}
            shopKey={csShopKey}
            onShopKeyChange={setCsShopKey}
            hint="每个 TikTok 店铺可维护独立 FAQ；「全店通用」对所有店铺生效。需先在插件里打开对应店铺页面以出现在列表中。"
          />
          <FaqTemplateManager
            authHeaders={authHeaders}
            showToast={showToast}
            formatError={formatError}
            templates={faqTemplates}
            onReload={() => loadFaqForShop(csShopKey)}
            busy={busy}
            setBusy={setBusy}
            shopKey={csShopKey}
            shopLabel={shopLabel}
          />
        </div>
      )}

      {tab === "drill" && (
        <div className="tt-cs-pane">
          <CsShopScopeBar
            shops={shops}
            shopKey={csShopKey}
            onShopKeyChange={setCsShopKey}
            hint={`演练将匹配：${csShopKey ? "本店 FAQ + 全店通用" : "仅全店通用 FAQ"}。不消耗套餐次数、不发送到 TikTok。`}
          />
          <p className="tt-hint">粘贴一条买家消息，测试分层路由（FAQ / 售后 / 夜间 AI / 草稿）。</p>
          <label className="tt-note-field">
            买家消息
            <textarea
              rows={4}
              value={drillText}
              onChange={(e) => onDrillTextChange(e.target.value)}
              placeholder="Where is my order? It's been 2 weeks..."
            />
          </label>
          <button
            type="button"
            className="continue-checkout slim"
            disabled={drillBusy || !drillText.trim()}
            onClick={() => onDrillRun(csShopKey)}
          >
            {drillBusy ? "路由中…" : "测试分层路由"}
          </button>
          <DrillResultPanel result={drillResult} />
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
