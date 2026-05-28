import { useCallback, useEffect, useRef, useState } from "react";
import {
  FAQ_CATEGORY_OPTIONS,
  buildLanguageSelectOptions,
  downloadFaqTemplateCsv,
  emptyFaqDraft,
  getLanguageLabel,
  parseFaqCsvText,
} from "../../lib/csFaqTemplates.js";
import { csFetch, csFaqQuery, formatError } from "./csStudioApi.js";
import { CsShopBar } from "./CsShopBar.jsx";
import { CsToast } from "./CsToast.jsx";

const MOCK_TEMPLATES = [
  {
    id: "mock-1",
    name: "发货时效 EN",
    text: "Hi! Thanks for your order. We ship within 1–2 business days. You'll receive tracking once dispatched.",
    triggers: ["shipping", "delivery", "when ship"],
    category: "shipping",
    lang: "en",
  },
  {
    id: "mock-2",
    name: "价格咨询 EN",
    text: "The listed price is current before platform coupons. Happy to help with size or color!",
    triggers: ["price", "how much", "cost"],
    category: "price",
    lang: "en",
  },
];

export function CsFaqPane({ shops, shopKey, onShopKeyChange, scopeShopId = "" }) {
  const [templates, setTemplates] = useState([]);
  const [draft, setDraft] = useState(emptyFaqDraft);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const importRef = useRef(null);
  const languageOptions = buildLanguageSelectOptions();

  const shopLabel = shopKey
    ? shops.find((s) => (s.shopId || s.shopKey) === shopKey)?.shopName || shopKey
    : "全店通用（全局模板）";

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("enterprise_token");
    try {
      if (!token) {
        if (import.meta.env.DEV) {
          setTemplates(MOCK_TEMPLATES);
          return;
        }
        throw new Error("请先登录");
      }
      if (!scopeShopId) {
        setTemplates([]);
        return;
      }
      const data = await csFetch(
        `/faq?${csFaqQuery(scopeShopId, shopKey, { editor: "1" })}`,
        {},
        scopeShopId,
      );
      setTemplates(data.templates || []);
    } catch (err) {
      setTemplates([]);
      setToast(formatError(err));
    } finally {
      setLoading(false);
    }
  }, [shopKey, scopeShopId]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

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
      setToast("请填写回复内容。");
      return;
    }
    setBusy(true);
    try {
      if (!scopeShopId) throw new Error("请先在顶部选择店铺");
      await csFetch(
        "/faq",
        {
          method: "POST",
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
        },
        scopeShopId,
      );
      setToast(editingId ? "FAQ 模板已更新" : "FAQ 模板已添加");
      resetDraft();
      await loadTemplates();
    } catch (err) {
      setToast(formatError(err));
    } finally {
      setBusy(false);
    }
  }

  async function removeTemplate(id) {
    if (!window.confirm("确定删除这条 FAQ 模板？")) return;
    setBusy(true);
    try {
      if (!scopeShopId) throw new Error("请先在顶部选择店铺");
      await csFetch(`/faq/${id}`, { method: "DELETE" }, scopeShopId);
      setToast("已删除");
      if (editingId === id) resetDraft();
      await loadTemplates();
    } catch (err) {
      setToast(formatError(err));
    } finally {
      setBusy(false);
    }
  }

  async function importCsvText(text, mode) {
    const parsed = parseFaqCsvText(text);
    if (!parsed.length) {
      setToast("未能解析 CSV，请使用下载的模板格式。");
      return;
    }
    setBusy(true);
    try {
      if (!scopeShopId) throw new Error("请先在顶部选择店铺");
      const data = await csFetch(
        "/faq/import",
        {
          method: "POST",
          body: JSON.stringify({ shopKey: shopKey || "", mode, templates: parsed }),
        },
        scopeShopId,
      );
      setToast(`已导入 ${data.count} 条 FAQ 模板`);
      await loadTemplates();
    } catch (err) {
      setToast(formatError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleImportFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const text = await file.text();
    const mode = window.confirm("点「确定」= 合并导入（同名覆盖）；点「取消」= 全量替换现有模板")
      ? "merge"
      : "replace";
    await importCsvText(text, mode);
  }

  return (
    <div className="ent-cs-pane-scroll">
      <CsToast message={toast} onClear={() => setToast("")} />
      <CsShopBar
        shops={shops}
        shopKey={shopKey}
        onShopKeyChange={onShopKeyChange}
        hint="每个 TikTok 店铺可维护独立 FAQ；「全店通用」对所有店铺生效。"
      />

      <div className="ent-cs-toolbar">
        <p className="ent-cs-toolbar-intro">
          当前编辑：<strong>{shopLabel}</strong> · 共 {templates.length} 条模板
        </p>
        <div className="ent-cs-toolbar-actions">
          <button type="button" className="ent-cs-query-btn" onClick={downloadFaqTemplateCsv}>
            下载 CSV 模板
          </button>
          <label className="ent-cs-import-btn">
            导入 CSV
            <input ref={importRef} type="file" accept=".csv,text/csv" onChange={handleImportFile} hidden />
          </label>
          <button type="button" className="ent-cs-query-btn" onClick={loadTemplates} disabled={loading}>
            {loading ? "加载中…" : "刷新"}
          </button>
        </div>
      </div>

      <div className="ent-cs-card ent-cs-faq-editor">
        <h3>{editingId ? "编辑模板" : "新增模板"}</h3>
        <div className="ent-cs-faq-editor-grid">
          <label className="ent-cs-field">
            <span className="ent-cs-field-label">模板名称</span>
            <input
              className="ent-cs-control"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="例如：物流时效"
            />
          </label>
          <label className="ent-cs-field">
            <span className="ent-cs-field-label">触发关键词</span>
            <input
              className="ent-cs-control"
              value={draft.triggers}
              onChange={(e) => setDraft({ ...draft, triggers: e.target.value })}
              placeholder="物流 | shipping | 几天到"
            />
          </label>
          <label className="ent-cs-field">
            <span className="ent-cs-field-label">分类</span>
            <select
              className="ent-cs-control"
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
            >
              {FAQ_CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value || "auto"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="ent-cs-field">
            <span className="ent-cs-field-label">语言 / 国家站点</span>
            <select
              className="ent-cs-control"
              value={draft.lang}
              onChange={(e) => setDraft({ ...draft, lang: e.target.value })}
            >
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
        <label className="ent-cs-field">
          <span className="ent-cs-field-label">回复内容（可使用 {"{shopName}"}、{"{sla}"} 变量）</span>
          <textarea
            className="ent-cs-control ent-cs-textarea"
            rows={4}
            value={draft.text}
            onChange={(e) => setDraft({ ...draft, text: e.target.value })}
            placeholder="Hi! Thanks for reaching out..."
          />
        </label>
        <div className="ent-cs-inline-actions">
          <button type="button" className="ent-cs-submit ent-cs-submit--inline" disabled={busy} onClick={saveDraft}>
            {editingId ? "保存修改" : "添加模板"}
          </button>
          {editingId ? (
            <button type="button" className="ent-cs-query-btn" disabled={busy} onClick={resetDraft}>
              取消编辑
            </button>
          ) : null}
        </div>
      </div>

      {loading ? (
        <p className="ent-cs-empty ent-cs-empty--pad">加载 FAQ 模板中…</p>
      ) : !templates.length ? (
        <p className="ent-cs-empty ent-cs-empty--pad">还没有 FAQ 模板。可手动添加、CSV 导入，或使用「AI 生成 FAQ」。</p>
      ) : (
        <ul className="ent-cs-faq-list">
          {templates.map((t) => (
            <li key={t.id} className="ent-cs-faq-list-item">
              <div className="ent-cs-faq-list-body">
                <strong>{t.name}</strong>
                <p>
                  {t.text?.slice(0, 200)}
                  {t.text?.length > 200 ? "…" : ""}
                </p>
                <small>
                  {(t.triggers || []).join(" · ") || "无触发词"}
                  {t.category ? ` · ${t.category}` : ""}
                  {t.lang ? ` · ${getLanguageLabel(t.lang)}` : " · 通用"}
                </small>
              </div>
              <div className="ent-cs-faq-list-actions">
                <button type="button" className="ent-cs-query-btn" disabled={busy} onClick={() => startEdit(t)}>
                  编辑
                </button>
                <button
                  type="button"
                  className="ent-cs-query-btn ent-cs-query-btn--danger"
                  disabled={busy}
                  onClick={() => removeTemplate(t.id)}
                >
                  删除
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
