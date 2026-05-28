import { useCallback, useEffect, useState } from "react";
import { TIKTOK_SHOP_LANGUAGES } from "../../lib/csFaqTemplates.js";
import { getLanguageLabel } from "./csStudioConstants.js";
import { csFetch, csFaqQuery, formatError } from "./csStudioApi.js";
import { CsShopBar } from "./CsShopBar.jsx";
import { CsToast } from "./CsToast.jsx";

const MOCK_SETTINGS = {
  extensionAutoSendFaq: true,
  extensionAutoSendAfterSales: true,
  daytimeAiTrustedAutoSend: false,
  nightAiEnabled: false,
  uncertainReplyTemplates: {
    en: "Thanks for your message! Our team is currently offline. We'll get back to you within 24 hours.",
    zh: "感谢您的留言！客服暂时离线，我们会在 24 小时内回复您。",
  },
  afterSalesTemplates: {
    en: "We're sorry to hear about the issue. Please share your order ID and photos — we'll resolve this ASAP.",
  },
  greetingTemplates: {
    en: "Hi! Thanks for reaching out. How can we help you today?",
  },
};

const MOCK_READINESS = {
  canEnableNightAi: false,
  productPages: 2,
  catalogCount: 12,
  snapshotCount: 3,
  gaps: ["商品页同步不足（建议 ≥4 页）", "尚未完成 AI 就绪评估"],
  message: "请先在插件中同步更多商品/库存页",
};

function MultiLangTemplatesEditor({ draftSettings, setDraftSettings, field, title, rows = 3 }) {
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
    <div className="ent-cs-card ent-cs-template-langs">
      <div className="ent-cs-template-langs-head">
        <strong>{title}</strong>
        <select className="ent-cs-control ent-cs-control--compact" value={lang} onChange={(e) => setLang(e.target.value)}>
          {TIKTOK_SHOP_LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {getLanguageLabel(l.code)}
            </option>
          ))}
        </select>
      </div>
      <textarea
        className="ent-cs-control ent-cs-textarea"
        rows={rows}
        value={value}
        onChange={(e) => update(e.target.value)}
      />
      <p className="ent-cs-field-hint">可使用 {"{shopName}"}、{"{sla}"} 变量 · 共 {TIKTOK_SHOP_LANGUAGES.length} 种站点语言</p>
    </div>
  );
}

function NightReadinessBlock({ readiness, loading, busy, onRefresh, onAssess }) {
  if (loading && !readiness) {
    return <p className="ent-cs-empty ent-cs-empty--pad">正在检查夜间自动回复就绪状态…</p>;
  }
  if (!readiness) {
    return (
      <div className="ent-cs-card ent-cs-readiness is-pending">
        <p className="ent-cs-empty">尚未评估。请先在插件中同步商品/库存页。</p>
        <button type="button" className="ent-cs-query-btn" disabled={busy} onClick={onRefresh}>
          刷新
        </button>
      </div>
    );
  }

  const ready = readiness.canEnableNightAi;
  return (
    <div className={`ent-cs-card ent-cs-readiness ${ready ? "is-ready" : "is-pending"}`}>
      <div className="ent-cs-readiness-head">
        <strong>夜间自动回复就绪</strong>
        <span className={`ent-cs-dot${ready ? " is-on" : ""}`} aria-hidden />
        <span>{ready ? "可开启" : "未就绪"}</span>
      </div>
      <ul className="ent-cs-hint-list">
        <li>商品/库存页：{readiness.productPages ?? 0} 页</li>
        <li>商品线索：{readiness.catalogCount ?? 0} 条</li>
        <li>已同步快照：{readiness.snapshotCount ?? 0} 页</li>
      </ul>
      {(readiness.gaps || []).length ? (
        <ul className="ent-cs-warn-list">
          {readiness.gaps.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>
      ) : null}
      {readiness.aiAssessment?.summary ? (
        <p className="ent-cs-field-hint">AI 评估：{readiness.aiAssessment.summary}</p>
      ) : null}
      {readiness.message ? <p className="ent-cs-field-hint">{readiness.message}</p> : null}
      <div className="ent-cs-inline-actions">
        <button type="button" className="ent-cs-query-btn" disabled={busy} onClick={onRefresh}>
          刷新检查
        </button>
        <button type="button" className="ent-cs-submit ent-cs-submit--inline" disabled={busy} onClick={onAssess}>
          {busy ? "评估中…" : "AI 重新评估"}
        </button>
      </div>
    </div>
  );
}

export function CsRulesPane({ shops, shopKey, onShopKeyChange, scopeShopId = "" }) {
  const [settings, setSettings] = useState(null);
  const [draftSettings, setDraftSettings] = useState(null);
  const [nightReadiness, setNightReadiness] = useState(null);
  const [readinessLoading, setReadinessLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  const loadSettings = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("enterprise_token");
    try {
      if (!token) {
        if (import.meta.env.DEV) {
          setSettings(MOCK_SETTINGS);
          setDraftSettings(MOCK_SETTINGS);
          return;
        }
        throw new Error("请先登录");
      }
      if (!scopeShopId) {
        setSettings(null);
        setDraftSettings(null);
        return;
      }
      const data = await csFetch("/settings", {}, scopeShopId);
      setSettings(data.settings);
      setDraftSettings(data.settings);
    } catch (err) {
      setToast(formatError(err));
    } finally {
      setLoading(false);
    }
  }, [scopeShopId]);

  const loadNightReadiness = useCallback(async () => {
    setReadinessLoading(true);
    const token = localStorage.getItem("enterprise_token");
    try {
      if (!token) {
        if (import.meta.env.DEV) {
          setNightReadiness(MOCK_READINESS);
          return;
        }
        return;
      }
      if (!scopeShopId) {
        setNightReadiness(null);
        return;
      }
      const data = await csFetch(
        `/readiness?${csFaqQuery(scopeShopId, shopKey)}`,
        {},
        scopeShopId,
      );
      setNightReadiness(data.readiness || null);
    } catch {
      setNightReadiness(null);
    } finally {
      setReadinessLoading(false);
    }
  }, [shopKey, scopeShopId]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    loadNightReadiness();
  }, [loadNightReadiness]);

  async function runNightAssess() {
    setBusy(true);
    try {
      if (!scopeShopId) throw new Error("请先在顶部选择店铺");
      const data = await csFetch(
        "/readiness/assess",
        { method: "POST", body: JSON.stringify({ shopKey: shopKey || "" }) },
        scopeShopId,
      );
      setNightReadiness(data.readiness || null);
      setToast(data.readiness?.canEnableNightAi ? "评估通过，可开启夜间自动回复" : "评估未通过，请先同步商品资料");
    } catch (err) {
      setToast(formatError(err));
    } finally {
      setBusy(false);
    }
  }

  async function saveSettings() {
    setBusy(true);
    try {
      if (!scopeShopId) throw new Error("请先在顶部选择店铺");
      const data = await csFetch(
        "/settings",
        {
          method: "POST",
          body: JSON.stringify({
            ...(draftSettings || {}),
            shopKey: shopKey || "",
          }),
        },
        scopeShopId,
      );
      setSettings(data.settings);
      setToast("自动化规则已保存");
    } catch (err) {
      setToast(formatError(err));
    } finally {
      setBusy(false);
    }
  }

  if (loading || !draftSettings) {
    return <p className="ent-cs-empty ent-cs-empty--pad">加载自动化规则…</p>;
  }

  return (
    <div className="ent-cs-pane-scroll">
      <CsToast message={toast} onClear={() => setToast("")} />
      <CsShopBar
        shops={shops}
        shopKey={shopKey}
        onShopKeyChange={onShopKeyChange}
        hint="夜间就绪评估与 FAQ 按店铺隔离。请先在插件绑定并同步该店铺的商品/库存页。"
      />

      <div className="ent-cs-card ent-cs-rules-toggles">
        <h3>插件 / Webhook 自动发送</h3>
        <label className="ent-cs-toggle-row">
          <input
            type="checkbox"
            checked={Boolean(draftSettings.extensionAutoSendFaq)}
            onChange={(e) => setDraftSettings({ ...draftSettings, extensionAutoSendFaq: e.target.checked })}
          />
          FAQ 匹配后自动发送
        </label>
        <label className="ent-cs-toggle-row">
          <input
            type="checkbox"
            checked={Boolean(draftSettings.extensionAutoSendAfterSales)}
            onChange={(e) => setDraftSettings({ ...draftSettings, extensionAutoSendAfterSales: e.target.checked })}
          />
          售后类自动发安抚模板并告警
        </label>
        <label className="ent-cs-toggle-row">
          <input
            type="checkbox"
            checked={Boolean(draftSettings.daytimeAiTrustedAutoSend)}
            onChange={(e) => setDraftSettings({ ...draftSettings, daytimeAiTrustedAutoSend: e.target.checked })}
          />
          白天：信任 AI 高置信度回复（自动发送，无需逐条确认）
        </label>
        <p className="ent-cs-field-hint">
          默认白天 AI 会识别商品并生成回复，但需在插件里点「确认发送」。开启此项后，仅当 AI 自评高置信度才会自动发。
        </p>
      </div>

      <NightReadinessBlock
        readiness={nightReadiness}
        loading={readinessLoading}
        busy={busy}
        onRefresh={loadNightReadiness}
        onAssess={runNightAssess}
      />

      <div className="ent-cs-card ent-cs-rules-toggles">
        <h3>夜间模式</h3>
        <label className="ent-cs-toggle-row">
          <input
            type="checkbox"
            checked={Boolean(draftSettings.nightAiEnabled)}
            disabled={!nightReadiness?.canEnableNightAi}
            onChange={(e) => setDraftSettings({ ...draftSettings, nightAiEnabled: e.target.checked })}
          />
          北京夜间（23:00–09:00）启用 AI 自动回复
        </label>
        <p className="ent-cs-field-hint">
          夜间须先完成上方就绪评估。AI 无法确证时会自动发「委婉等候」模板，不会编造商品细节。
        </p>
      </div>

      <MultiLangTemplatesEditor
        draftSettings={draftSettings}
        setDraftSettings={setDraftSettings}
        field="uncertainReplyTemplates"
        title="低置信度 / 夜间等候模板"
        rows={3}
      />
      <MultiLangTemplatesEditor
        draftSettings={draftSettings}
        setDraftSettings={setDraftSettings}
        field="afterSalesTemplates"
        title="售后安抚模板"
        rows={3}
      />
      <MultiLangTemplatesEditor
        draftSettings={draftSettings}
        setDraftSettings={setDraftSettings}
        field="greetingTemplates"
        title="问候模板"
        rows={2}
      />

      <div className="ent-cs-inline-actions ent-cs-rules-save">
        <button type="button" className="ent-cs-submit ent-cs-submit--inline" disabled={busy} onClick={saveSettings}>
          保存规则
        </button>
        {settings ? (
          <span className="ent-cs-field-hint">上次保存的配置将同步到插件与店铺 API Webhook 路由。</span>
        ) : null}
      </div>

      <p className="ent-cs-security-note">
        插件与 Webhook <strong>不会</strong>代替你在后台改订单/退款；高风险仍须人工确认。
      </p>
    </div>
  );
}
