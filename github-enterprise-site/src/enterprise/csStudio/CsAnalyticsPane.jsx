import { useCallback, useEffect, useState } from "react";
import { getLanguageLabel } from "./csStudioConstants.js";
import { csFetch } from "./csStudioApi.js";

const MOCK_ANALYTICS = {
  windowDays: 30,
  totalRoutes: 128,
  faqHitRate: 38,
  autoSendRate: 24,
  aftersalesRate: 12,
  nightAiRate: 8,
  alertUnread: 2,
  alertAvgHandleMinutes: 47,
  byDay: [
    { date: "05-14", total: 18, faq: 7, autoSend: 5 },
    { date: "05-15", total: 22, faq: 9, autoSend: 6 },
    { date: "05-16", total: 15, faq: 5, autoSend: 3 },
    { date: "05-17", total: 20, faq: 8, autoSend: 4 },
    { date: "05-18", total: 25, faq: 10, autoSend: 7 },
    { date: "05-19", total: 16, faq: 6, autoSend: 4 },
    { date: "05-20", total: 12, faq: 4, autoSend: 3 },
  ],
  byLang: [
    { lang: "en", count: 72 },
    { lang: "th", count: 18 },
    { lang: "vi", count: 14 },
    { lang: "id", count: 12 },
    { lang: "es", count: 8 },
  ],
};

export function CsAnalyticsPane({ scopeShopId = "" }) {
  const [analytics, setAnalytics] = useState(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("enterprise_token");
    try {
      if (!token) {
        if (import.meta.env.DEV) {
          setAnalytics({ ...MOCK_ANALYTICS, windowDays: days });
          return;
        }
        setAnalytics(null);
        return;
      }
      if (!scopeShopId) {
        setAnalytics(null);
        return;
      }
      const data = await csFetch("/analytics", {}, scopeShopId, { days: String(days) });
      setAnalytics(data.analytics);
    } catch {
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  }, [days, scopeShopId]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  if (loading && !analytics) {
    return <p className="ent-cs-empty ent-cs-empty--pad">加载客服数据中…</p>;
  }

  if (!analytics) {
    return (
      <div className="ent-cs-pane-scroll">
        <p className="ent-cs-empty ent-cs-empty--pad">
          暂无统计数据。插件或店铺 API 处理买家消息后会自动累计。
          <button type="button" className="ent-cs-query-btn" style={{ marginLeft: 8 }} onClick={loadAnalytics}>
            刷新
          </button>
        </p>
      </div>
    );
  }

  const metrics = [
    { label: "FAQ 模板命中率", value: `${analytics.faqHitRate}%`, hint: "FAQ 命中 / 总路由" },
    { label: "自动发送率", value: `${analytics.autoSendRate}%`, hint: "动作为 auto_send 的占比" },
    { label: "售后路由占比", value: `${analytics.aftersalesRate}%`, hint: "触发售后安抚 + 告警" },
    { label: "夜间 AI 占比", value: `${analytics.nightAiRate}%`, hint: "北京休息时段 AI 兜底" },
    {
      label: "售后告警均时",
      value: analytics.alertAvgHandleMinutes != null ? `${analytics.alertAvgHandleMinutes} 分钟` : "—",
      hint: "从告警到标记已处理的平均时长",
    },
    {
      label: "待处理告警",
      value: String(analytics.alertUnread ?? 0),
      hint: `近 ${analytics.windowDays} 天共 ${analytics.totalRoutes} 次路由`,
    },
  ];

  const maxTotal = Math.max(...(analytics.byDay || []).map((d) => d.total), 1);

  return (
    <div className="ent-cs-pane-scroll">
      <div className="ent-cs-analytics-toolbar">
        <label className="ent-cs-field ent-cs-field--inline">
          <span className="ent-cs-field-label">统计窗口</span>
          <select className="ent-cs-control" value={days} onChange={(e) => setDays(Number(e.target.value))}>
            <option value={7}>近 7 天</option>
            <option value={30}>近 30 天</option>
            <option value={90}>近 90 天</option>
          </select>
        </label>
        <button type="button" className="ent-cs-query-btn" onClick={loadAnalytics} disabled={loading}>
          {loading ? "刷新中…" : "刷新"}
        </button>
      </div>

      <div className="ent-cs-analytics-grid">
        {metrics.map((m) => (
          <div key={m.label} className="ent-cs-metric-card">
            <span className="ent-cs-metric-label">{m.label}</span>
            <strong className="ent-cs-metric-value">{m.value}</strong>
            <small>{m.hint}</small>
          </div>
        ))}
      </div>

      {analytics.byDay?.length ? (
        <div className="ent-cs-card ent-cs-analytics-section">
          <h3>近 {analytics.byDay.length} 日趋势</h3>
          <ul className="ent-cs-trend-list">
            {analytics.byDay.map((d) => (
              <li key={d.date}>
                <span className="ent-cs-trend-date">{d.date}</span>
                <div className="ent-cs-trend-bar-wrap">
                  <div className="ent-cs-trend-bar" style={{ width: `${(d.total / maxTotal) * 100}%` }} />
                </div>
                <span className="ent-cs-trend-stats">
                  {d.total} 次 · FAQ {d.faq} · 自动发 {d.autoSend}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {analytics.byLang?.length ? (
        <div className="ent-cs-card ent-cs-analytics-section">
          <h3>买家语言分布</h3>
          <ul className="ent-cs-lang-list">
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
