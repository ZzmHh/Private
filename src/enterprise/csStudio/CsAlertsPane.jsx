import { useCallback, useEffect, useState } from "react";
import { csFetch, formatError } from "./csStudioApi.js";

function formatTime(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("zh-CN", { hour12: false });
  } catch {
    return iso;
  }
}

export function CsAlertsPane({ scopeShopId = "" }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("enterprise_token");
    if (!token) {
      setLoading(false);
      if (import.meta.env.DEV) {
        setAlerts([
          {
            id: "mock-alert",
            shopName: "TikTok US 主店",
            buyerText: "I want a refund, the item arrived broken.",
            intent: { category: "aftersales" },
            replyPreview: "We're sorry to hear that. Please share your order ID...",
            read: false,
            createdAt: new Date().toISOString(),
          },
        ]);
      } else {
        setError("请先登录");
      }
      return;
    }
    if (!scopeShopId) {
      setAlerts([]);
      setError("请先在顶部选择店铺");
      setLoading(false);
      return;
    }
    try {
      const data = await csFetch("/alerts", {}, scopeShopId, { unread: "1" });
      setAlerts(data.alerts || []);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  }, [scopeShopId]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  async function markRead(id) {
    setBusyId(id);
    try {
      await csFetch(`/alerts/${id}/read`, { method: "POST" }, scopeShopId);
      await loadAlerts();
    } catch {
      /* ignore */
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="ent-cs-alerts-pane">
      <div className="ent-cs-alerts-head">
        <p>售后类、需人工介入的会话会在此告警（插件 / 店铺 API 触发）。</p>
        <button type="button" className="ent-cs-query-btn" onClick={loadAlerts} disabled={loading}>
          {loading ? "刷新中…" : "刷新"}
        </button>
      </div>
      {error ? <p className="ent-cs-session-error">{error}</p> : null}
      {!alerts.length && !loading ? (
        <p className="ent-cs-empty ent-cs-empty--pad">暂无待处理告警</p>
      ) : (
        <ul className="ent-cs-alert-list">
          {alerts.map((a) => (
            <li key={a.id} className={a.read ? "is-read" : ""}>
              <div className="ent-cs-alert-body">
                <strong>
                  {a.intent?.category || "售后"} · {a.shopName || "店铺"}
                </strong>
                <p className="ent-cs-alert-buyer">{a.buyerText}</p>
                {a.replyPreview ? <pre className="ent-cs-alert-reply">{a.replyPreview}</pre> : null}
                <small>{formatTime(a.createdAt)}</small>
              </div>
              {!a.read ? (
                <button type="button" className="ent-cs-query-btn" disabled={busyId === a.id} onClick={() => markRead(a.id)}>
                  标记已处理
                </button>
              ) : (
                <span className="ent-cs-alert-read">已读</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
