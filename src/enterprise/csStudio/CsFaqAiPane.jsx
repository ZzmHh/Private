import { useCallback, useEffect, useState } from "react";
import { buildLanguageSelectOptions } from "../../lib/csFaqTemplates.js";
import { getLanguageLabel } from "./csStudioConstants.js";
import { csFetch, csFaqQuery, formatError, formatRelativeTime } from "./csStudioApi.js";
import { CsShopBar } from "./CsShopBar.jsx";
import { CsToast } from "./CsToast.jsx";

const MOCK_CONTEXT = {
  ready: true,
  snapshotCount: 6,
  pageTypes: ["product", "shipping"],
  productPages: 4,
  catalogCount: 28,
  hints: ["已采集商品详情页 4 页", "已采集物流/发货政策页 2 页"],
  latestAt: new Date(Date.now() - 3600_000).toISOString(),
  shopName: "TikTok US 主店",
  primaryLang: "en",
};

const MOCK_DRAFTS = [
  {
    id: "d1",
    name: "发货时效",
    category: "shipping",
    lang: "en",
    triggers: ["shipping", "delivery", "when ship"],
    text: "We ship within 1–2 business days. Tracking is shared once dispatched.",
    needsReview: false,
  },
  {
    id: "d2",
    name: "退换货政策",
    category: "aftersales",
    lang: "en",
    triggers: ["return", "refund", "exchange"],
    text: "Returns accepted within 30 days if unused. Please share your order ID.",
    needsReview: true,
    reviewReason: "涉及售后政策，请核对是否与店铺实际政策一致",
  },
];

export function CsFaqAiPane({ shops, shopKey, onShopKeyChange, scopeShopId = "" }) {
  const [contextInfo, setContextInfo] = useState(null);
  const [drafts, setDrafts] = useState([]);
  const [selected, setSelected] = useState(() => new Set());
  const [primaryLang, setPrimaryLang] = useState("en");
  const [generating, setGenerating] = useState(false);
  const [loadingCtx, setLoadingCtx] = useState(false);
  const [busy, setBusy] = useState(false);
  const [warnings, setWarnings] = useState([]);
  const [toast, setToast] = useState("");
  const languageOptions = buildLanguageSelectOptions();

  const shopLabel = shopKey
    ? shops.find((s) => (s.shopId || s.shopKey) === shopKey)?.shopName || shopKey
    : "全店通用（全局模板）";

  const loadContext = useCallback(async () => {
    setLoadingCtx(true);
    const token = localStorage.getItem("enterprise_token");
    try {
      if (!token) {
        if (import.meta.env.DEV) {
          setContextInfo(MOCK_CONTEXT);
          setPrimaryLang(MOCK_CONTEXT.primaryLang);
          return;
        }
        throw new Error("请先登录");
      }
      if (!scopeShopId) {
        setContextInfo(null);
        return;
      }
      const data = await csFetch(
        `/faq/context?${csFaqQuery(scopeShopId, shopKey)}`,
        {},
        scopeShopId,
      );
      setContextInfo(data);
      if (data.primaryLang) setPrimaryLang(data.primaryLang);
    } catch (err) {
      setContextInfo(null);
      setToast(formatError(err));
    } finally {
      setLoadingCtx(false);
    }
  }, [shopKey, scopeShopId]);

  useEffect(() => {
    setDrafts([]);
    setSelected(new Set());
    setWarnings([]);
    loadContext();
  }, [loadContext, shopKey]);

  function toggleDraft(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll(on) {
    if (on) setSelected(new Set(drafts.map((d) => d.id)));
    else setSelected(new Set());
  }

  function updateDraftField(id, field, value) {
    setDrafts((list) => list.map((d) => (d.id === id ? { ...d, [field]: value } : d)));
  }

  async function runGenerate() {
    setGenerating(true);
    setBusy(true);
    const token = localStorage.getItem("enterprise_token");
    try {
      if (!token && import.meta.env.DEV) {
        await new Promise((r) => setTimeout(r, 800));
        setDrafts(MOCK_DRAFTS);
        setSelected(new Set(MOCK_DRAFTS.filter((d) => !d.needsReview).map((d) => d.id)));
        setToast(`已生成 ${MOCK_DRAFTS.length} 条 FAQ 草稿（演示）`);
        return;
      }
      if (!scopeShopId) throw new Error("请先在顶部选择店铺");
      const data = await csFetch(
        "/faq/generate",
        {
          method: "POST",
          body: JSON.stringify({
            shopKey: shopKey || "",
            shopName: contextInfo?.shopName || shopLabel,
            primaryLang,
          }),
        },
        scopeShopId,
      );
      setDrafts(data.drafts || []);
      setWarnings(data.warnings || []);
      setContextInfo((prev) => ({ ...(prev || {}), ...(data.contextSummary || {}) }));
      const ids = (data.drafts || []).filter((d) => !d.needsReview).map((d) => d.id);
      setSelected(new Set(ids.length ? ids : (data.drafts || []).map((d) => d.id)));
      setToast(`已生成 ${data.drafts?.length || 0} 条 FAQ 草稿，请核对后启用`);
    } catch (err) {
      setToast(formatError(err));
    } finally {
      setGenerating(false);
      setBusy(false);
    }
  }

  async function applySelected() {
    const picked = drafts.filter((d) => selected.has(d.id));
    if (!picked.length) {
      setToast("请至少勾选一条 FAQ 草稿。");
      return;
    }
    const risky = picked.filter((d) => d.needsReview);
    if (risky.length && !window.confirm(`有 ${risky.length} 条标记为「需确认」，仍要启用吗？`)) {
      return;
    }
    setBusy(true);
    try {
      if (!scopeShopId) throw new Error("请先在顶部选择店铺");
      const data = await csFetch(
        "/faq/generate/apply",
        {
          method: "POST",
          body: JSON.stringify({
            shopKey: shopKey || "",
            templates: picked.map((d) => ({
              name: d.name,
              text: d.text,
              triggers: d.triggers,
              category: d.category,
              lang: d.lang,
            })),
          }),
        },
        scopeShopId,
      );
      setToast(`已启用 ${data.count} 条 FAQ 模板`);
      setDrafts([]);
      setSelected(new Set());
      await loadContext();
    } catch (err) {
      setToast(formatError(err));
    } finally {
      setBusy(false);
    }
  }

  const ready = Boolean(contextInfo?.ready);

  return (
    <div className="ent-cs-pane-scroll">
      <CsToast message={toast} onClear={() => setToast("")} />
      <CsShopBar
        shops={shops}
        shopKey={shopKey}
        onShopKeyChange={onShopKeyChange}
        hint="插件在卖家中心同步商品/物流页后，AI 根据店铺信息批量生成 FAQ 草稿。"
      />

      <div className="ent-cs-card ent-cs-faq-ai-head">
        <div>
          <h3>AI 生成 FAQ 草稿</h3>
          <p>同步店铺页面素材 → 选择主语言 → 生成草稿 → 微调后一键启用到 FAQ 模板库。</p>
        </div>
        <button type="button" className="ent-cs-query-btn" disabled={loadingCtx || busy} onClick={loadContext}>
          {loadingCtx ? "刷新中…" : "刷新素材"}
        </button>
      </div>

      <div className={`ent-cs-readiness ${ready ? "is-ready" : "is-pending"}`}>
        <div className="ent-cs-readiness-head">
          <strong>店铺素材状态</strong>
          <span className={`ent-cs-dot${ready ? " is-on" : ""}`} aria-hidden />
          <span>
            {ready
              ? `已采集 ${contextInfo?.snapshotCount || 0} 页 · ${(contextInfo?.pageTypes || []).join(" / ") || "—"}`
              : "尚未检测到插件同步的店铺页面"}
            {contextInfo?.latestAt ? ` · ${formatRelativeTime(contextInfo.latestAt)}` : ""}
          </span>
        </div>
        {(contextInfo?.hints || []).length ? (
          <ul className="ent-cs-hint-list">
            {(contextInfo.hints || []).map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        ) : null}
      </div>

      {!ready ? (
        <p className="ent-cs-empty ent-cs-empty--pad">
          请安装企业浏览器助手 → 登录 TikTok 卖家中心 → 打开<strong>商品、订单/发货</strong>等页面 → 点插件「同步本页」或「同步到 FAQ 素材」。
        </p>
      ) : (
        <div className="ent-cs-inline-actions ent-cs-faq-ai-actions">
          <label className="ent-cs-field ent-cs-field--inline">
            <span className="ent-cs-field-label">主语言</span>
            <select
              className="ent-cs-control"
              value={primaryLang}
              disabled={generating || busy}
              onChange={(e) => setPrimaryLang(e.target.value)}
            >
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
          <button type="button" className="ent-cs-submit ent-cs-submit--inline" disabled={generating || busy} onClick={runGenerate}>
            {generating ? "生成中…" : "AI 生成 FAQ 草稿"}
          </button>
        </div>
      )}

      {warnings.length ? (
        <ul className="ent-cs-warn-list">
          {warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      ) : null}

      {drafts.length ? (
        <div className="ent-cs-card ent-cs-faq-drafts">
          <div className="ent-cs-faq-drafts-head">
            <strong>{drafts.length} 条草稿</strong>
            <div className="ent-cs-toolbar-actions">
              <button type="button" className="ent-cs-query-btn" onClick={() => toggleAll(true)}>
                全选
              </button>
              <button type="button" className="ent-cs-query-btn" onClick={() => toggleAll(false)}>
                全不选
              </button>
              <button type="button" className="ent-cs-submit ent-cs-submit--inline" disabled={busy || !selected.size} onClick={applySelected}>
                启用选中 ({selected.size})
              </button>
            </div>
          </div>
          <ul className="ent-cs-faq-draft-list">
            {drafts.map((d) => (
              <li key={d.id} className={d.needsReview ? "needs-review" : ""}>
                <label className="ent-cs-draft-check">
                  <input type="checkbox" checked={selected.has(d.id)} onChange={() => toggleDraft(d.id)} />
                  <span>
                    <strong>{d.name}</strong>
                    {d.category ? ` · ${d.category}` : ""}
                    {d.lang ? ` · ${getLanguageLabel(d.lang)}` : ""}
                    {d.needsReview ? <em className="ent-cs-badge-warn">需确认</em> : null}
                  </span>
                </label>
                {d.reviewReason ? <p className="ent-cs-review-reason">{d.reviewReason}</p> : null}
                <label className="ent-cs-field">
                  <span className="ent-cs-field-label">触发词（| 分隔）</span>
                  <input
                    className="ent-cs-control"
                    value={(d.triggers || []).join(" | ")}
                    onChange={(e) =>
                      updateDraftField(
                        d.id,
                        "triggers",
                        e.target.value
                          .split(/[,，|/;；]+/)
                          .map((s) => s.trim())
                          .filter(Boolean),
                      )
                    }
                  />
                </label>
                <label className="ent-cs-field">
                  <span className="ent-cs-field-label">回复内容</span>
                  <textarea
                    className="ent-cs-control ent-cs-textarea"
                    rows={3}
                    value={d.text || ""}
                    onChange={(e) => updateDraftField(d.id, "text", e.target.value)}
                  />
                </label>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
