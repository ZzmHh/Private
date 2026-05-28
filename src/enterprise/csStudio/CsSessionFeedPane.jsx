import { useCallback, useEffect, useState } from "react";
import { CS_ACTION_LABELS, CS_TIER_LABELS } from "./csStudioConstants.js";
import { csFetch } from "./csStudioApi.js";

const CHANNEL_LABELS = {
  extension: "Chrome 插件",
  webhook: "店铺 API Webhook",
  enterprise_drill: "企业站 · 演练",
};

function formatTime(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("zh-CN", { hour12: false });
  } catch {
    return iso;
  }
}

function mockSessions() {
  const now = Date.now();
  return [
    {
      id: "mock-1",
      channel: "webhook",
      tier: "faq",
      action: "auto_send",
      shopKey: "TikTok US 主店",
      buyerText: "When will my order ship?",
      replyText:
        "Hi! Thanks for your order. We ship within 1–2 business days. You'll receive tracking once dispatched.",
      reason: "命中 FAQ 模板「发货时效 EN」",
      faqName: "发货时效 EN",
      dryRun: false,
      createdAt: new Date(now - 3600_000).toISOString(),
    },
    {
      id: "mock-2",
      channel: "extension",
      tier: "day_ai",
      action: "pending_confirm",
      shopKey: "TikTok US 主店",
      buyerText: "Is this blender BPA free?",
      replyText:
        "Yes! The cup and blade assembly are BPA-free. Let me know if you need the certification link.",
      reason: "已识别商品，AI 生成回复，待卖家确认",
      dryRun: false,
      createdAt: new Date(now - 7200_000).toISOString(),
    },
  ];
}

export function CsSessionFeedPane({ shops, shopKey, onShopKeyChange, scopeShopId = "", onSelectSession }) {
  const [sessions, setSessions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [includeDrill, setIncludeDrill] = useState(true);
  const [error, setError] = useState("");

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("enterprise_token");
    try {
      if (!token) {
        if (import.meta.env.DEV) {
          setSessions(mockSessions());
          return;
        }
        throw new Error("请先登录后查看会话流水");
      }
      if (!scopeShopId) {
        setSessions([]);
        setError("请先在顶部选择店铺");
        return;
      }
      const extra = { limit: "50" };
      if (shopKey) extra.shopKey = shopKey;
      if (!includeDrill) extra.includeDrill = "0";
      const data = await csFetch("/sessions", {}, scopeShopId, extra);
      setSessions(data.sessions || []);
    } catch (err) {
      setError(err?.message || "加载失败");
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [shopKey, includeDrill, scopeShopId]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const selected = sessions.find((s) => s.id === selectedId) || sessions[0] || null;

  useEffect(() => {
    if (selected) onSelectSession?.(selected);
  }, [selected, onSelectSession]);

  return (
    <div className="ent-cs-split ent-cs-split--sessions">
      <div className="ent-cs-session-list">
        <div className="ent-cs-session-list-head">
          <label className="ent-cs-field ent-cs-field--inline">
            <span className="ent-cs-field-label">店铺</span>
            <select className="ent-cs-control" value={shopKey} onChange={(e) => onShopKeyChange(e.target.value)}>
              <option value="">全部</option>
              {shops.map((s) => (
                <option key={s.shopId || s.shopKey} value={s.shopId || s.shopKey}>
                  {s.shopName || s.shopId || s.shopKey}
                </option>
              ))}
            </select>
          </label>
          <label className="ent-cs-check-inline">
            <input type="checkbox" checked={includeDrill} onChange={(e) => setIncludeDrill(e.target.checked)} />
            含演练记录
          </label>
          <button type="button" className="ent-cs-query-btn" onClick={loadSessions} disabled={loading}>
            {loading ? "刷新中…" : "刷新"}
          </button>
        </div>

        {error ? <p className="ent-cs-session-error">{error}</p> : null}

        {!loading && !sessions.length ? (
          <p className="ent-cs-empty ent-cs-empty--pad">暂无会话记录。插件处理买家消息或店铺 API Webhook 后会出现在此。</p>
        ) : (
          <ul className="ent-cs-session-items">
            {sessions.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className={`ent-cs-session-item${selected?.id === s.id ? " is-active" : ""}`}
                  onClick={() => setSelectedId(s.id)}
                >
                  <div className="ent-cs-session-item-top">
                    <span className="ent-cs-session-channel">{CHANNEL_LABELS[s.channel] || s.channel}</span>
                    <time>{formatTime(s.createdAt)}</time>
                  </div>
                  <p className="ent-cs-session-preview">{s.buyerText || "（无买家文本）"}</p>
                  <div className="ent-cs-session-item-tags">
                    <span>{CS_TIER_LABELS[s.tier] || s.tier}</span>
                    <span>{CS_ACTION_LABELS[s.action] || s.action}</span>
                    {s.dryRun ? <span className="is-drill">演练</span> : null}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="ent-cs-session-detail">
        {!selected ? (
          <div className="ent-cs-empty">选择一条会话查看 AI 路由过程</div>
        ) : (
          <>
            <div className="ent-cs-session-detail-head">
              <span className="ent-cs-route-badge ent-cs-route-badge--tier">
                {CS_TIER_LABELS[selected.tier] || selected.tier}
              </span>
              <span className={`ent-cs-route-badge ent-cs-route-badge--action ent-cs-route-badge--${selected.action}`}>
                {CS_ACTION_LABELS[selected.action] || selected.action}
              </span>
              <span className="ent-cs-session-meta">
                {CHANNEL_LABELS[selected.channel] || selected.channel}
                {selected.shopKey ? ` · ${selected.shopKey}` : ""}
              </span>
            </div>

            <section className="ent-cs-session-block">
              <h4>买家消息</h4>
              <pre>{selected.buyerText || "—"}</pre>
            </section>

            <section className="ent-cs-session-block ent-cs-session-block--route">
              <h4>AI 路由说明</h4>
              <p>{selected.reason || "—"}</p>
              {selected.faqName ? <p className="ent-cs-session-faq">匹配 FAQ：{selected.faqName}</p> : null}
            </section>

            <section className="ent-cs-session-block ent-cs-session-block--reply">
              <h4>生成 / 发送的回复</h4>
              <pre>{selected.replyText || "（无回复文本）"}</pre>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
