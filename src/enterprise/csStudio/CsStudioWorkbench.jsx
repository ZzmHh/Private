import { useCallback, useEffect, useMemo, useState } from "react";
import { csStudio, defaultCsToolId, findCsTool } from "./csStudioConfig.js";
import { mockCsRouteResult } from "./csStudioConstants.js";
import { csFetch } from "./csStudioApi.js";
import { ENT_EXTENSION, entFetch } from "../lib/enterpriseHttp.js";
import { CsRoutePreview } from "./CsRoutePreview.jsx";
import { CsSessionFeedPane } from "./CsSessionFeedPane.jsx";
import { CsAlertsPane } from "./CsAlertsPane.jsx";
import { CsFaqPane } from "./CsFaqPane.jsx";
import { CsFaqAiPane } from "./CsFaqAiPane.jsx";
import { CsRulesPane } from "./CsRulesPane.jsx";
import { CsAnalyticsPane } from "./CsAnalyticsPane.jsx";
import "../creativeStudio/creativeStudio.css";
import "./csStudio.css";

function CsDrillPane({ shops, shopKey, onShopKeyChange, onRouted, onLog, onError, onBusy, scopeShopId }) {
  const [buyerText, setBuyerText] = useState(
    "When will my order ship? I ordered 3 days ago.",
  );
  const [orderContext, setOrderContext] = useState("");
  const [busy, setBusy] = useState(false);
  const [routed, setRouted] = useState(null);
  const [error, setError] = useState("");

  const shopLabel = shopKey
    ? shops.find((s) => (s.shopId || s.shopKey) === shopKey)?.shopName || shopKey
    : "全店通用（全局 FAQ）";

  async function runDrill() {
    const text = buyerText.trim();
    if (!text) return;
    if (!scopeShopId) {
      setError("请先在顶部选择店铺");
      return;
    }

    setBusy(true);
    setError("");
    setRouted(null);
    onBusy?.(true);

    const token = localStorage.getItem("enterprise_token");
    try {
      if (!token) {
        if (import.meta.env.DEV) {
          await new Promise((r) => setTimeout(r, 650));
          const mock = mockCsRouteResult(text);
          setRouted(mock);
          onRouted?.(mock);
          onLog?.({ mode: "mock", buyerText: text, shopKey, routed: mock });
          return;
        }
        throw new Error("请先登录企业账号后再使用客服路由（需店铺 API / 插件权限）。");
      }

      const data = await csFetch(
        "/route",
        {
          method: "POST",
          body: JSON.stringify({
            buyerText: text,
            shopKey: shopKey || "",
            shopName: shopLabel,
            orderContext: orderContext.trim() || undefined,
            dryRun: true,
            logSession: true,
          }),
        },
        scopeShopId,
      );

      const result = data.routed || data;
      setRouted(result);
      onRouted?.(result);
      onLog?.({ mode: "api", buyerText: text, shopKey, shopLabel, response: data });
    } catch (err) {
      const msg = err?.message || "路由失败";
      setError(msg);
      onError?.(msg);
      onLog?.({ mode: "error", buyerText: text, shopKey, error: msg });
    } finally {
      setBusy(false);
      onBusy?.(false);
    }
  }

  function copyReply(text) {
    navigator.clipboard?.writeText(text || "");
  }

  return (
    <div className="ent-cs-split">
      <div className="ent-cs-form">
        <p className="ent-cs-form-intro">
          演练匹配：<strong>{shopKey ? "本店 FAQ + 全店通用" : "仅全店通用 FAQ"}</strong>
          。不消耗套餐次数、不发送到 TikTok。
        </p>

        <label className="ent-cs-field">
          <span className="ent-cs-field-label">店铺范围</span>
          <select
            className="ent-cs-control"
            value={shopKey}
            onChange={(e) => onShopKeyChange(e.target.value)}
          >
            <option value="">全店通用（全局模板）</option>
            {shops.map((s) => (
              <option key={s.shopId || s.shopKey} value={s.shopId || s.shopKey}>
                {s.shopName || s.shopId || s.shopKey}
              </option>
            ))}
          </select>
        </label>

        <label className="ent-cs-field">
          <span className="ent-cs-field-label">买家消息（必填）</span>
          <textarea
            className="ent-cs-control ent-cs-textarea"
            rows={5}
            value={buyerText}
            placeholder="Where is my order? It's been 2 weeks..."
            onChange={(e) => setBuyerText(e.target.value)}
          />
        </label>

        <label className="ent-cs-field">
          <span className="ent-cs-field-label">订单 / 页面上下文（可选）</span>
          <textarea
            className="ent-cs-control ent-cs-textarea"
            rows={3}
            value={orderContext}
            placeholder="模拟插件提供的订单号、SKU、物流状态等"
            onChange={(e) => setOrderContext(e.target.value)}
          />
        </label>

        <button type="button" className="ent-cs-submit" disabled={busy || !buyerText.trim()} onClick={runDrill}>
          {busy ? "路由中…" : "测试分层路由（演练）"}
        </button>

        <p className="ent-cs-form-footnote">
          分层路径：FAQ 命中自动发 → 白天商品 AI（默认待确认）→ 夜间须就绪评估 → 不确定则等候模板。
        </p>
      </div>

      <div className="ent-cs-preview ent-cs-preview--route">
        <div className="ent-cs-preview-toolbar">
          <span className={`ent-cs-status ent-cs-status--${busy ? "busy" : routed ? "ok" : "idle"}`}>
            {busy ? "路由中" : routed ? "已完成" : "等待演练"}
          </span>
        </div>
        <div className="ent-cs-preview-stage ent-cs-preview-stage--route">
          <CsRoutePreview routed={routed} busy={busy} error={error} onCopy={copyReply} />
        </div>
      </div>
    </div>
  );
}

function CsToolPane({ toolId, tool, shops, shopKey, setShopKey, drillProps, scopeShopId }) {
  switch (toolId) {
    case "drill":
      return (
        <CsDrillPane
          shops={shops}
          shopKey={shopKey}
          onShopKeyChange={setShopKey}
          scopeShopId={scopeShopId}
          {...drillProps}
        />
      );
    case "sessions":
      return (
        <CsSessionFeedPane
          shops={shops}
          shopKey={shopKey}
          onShopKeyChange={setShopKey}
          scopeShopId={scopeShopId}
        />
      );
    case "faq":
      return (
        <CsFaqPane shops={shops} shopKey={shopKey} onShopKeyChange={setShopKey} scopeShopId={scopeShopId} />
      );
    case "faq-ai":
      return (
        <CsFaqAiPane shops={shops} shopKey={shopKey} onShopKeyChange={setShopKey} scopeShopId={scopeShopId} />
      );
    case "rules":
      return (
        <CsRulesPane shops={shops} shopKey={shopKey} onShopKeyChange={setShopKey} scopeShopId={scopeShopId} />
      );
    case "alerts":
      return <CsAlertsPane scopeShopId={scopeShopId} />;
    case "analytics":
      return <CsAnalyticsPane scopeShopId={scopeShopId} />;
    default:
      return (
        <div className="ent-cs-split ent-cs-split--single">
          <p className="ent-cs-empty ent-cs-empty--pad">未知工具：{tool?.name}</p>
        </div>
      );
  }
}

export function CsStudioWorkbench({ user, scopeShopId = "" }) {
  const [openGroups, setOpenGroups] = useState(() =>
    Object.fromEntries(csStudio.groups.map((g) => [g.id, g.defaultOpen !== false])),
  );
  const [toolId, setToolId] = useState(defaultCsToolId);
  const [shops, setShops] = useState([]);
  const [shopKey, setShopKey] = useState("");
  const [logOpen, setLogOpen] = useState(false);
  const [execLog, setExecLog] = useState(null);

  const tool = useMemo(() => findCsTool(toolId), [toolId]);
  const userLabel = user?.name || user?.email || "未登录";
  const showExecLog = toolId === "drill";

  const loadShops = useCallback(async () => {
    const token = localStorage.getItem("enterprise_token");
    if (!token) return;
    try {
      const data = await entFetch(`${ENT_EXTENSION}/shops`);
      if (data.ok) setShops(data.shops || []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    loadShops();
  }, [loadShops]);

  useEffect(() => {
    setExecLog(null);
    setLogOpen(false);
  }, [toolId]);

  function toggleGroup(id) {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="ent-cs-root ent-cs-root--service">
      <aside className="ent-cs-sidebar">
        <div className="ent-cs-brand">
          <span className="ent-cs-brand-mark">CS</span>
          <div>
            <strong>{csStudio.brandTitle}</strong>
            <small>{csStudio.brandSubtitle}</small>
          </div>
        </div>

        <nav className="ent-cs-nav" aria-label="智能客服工具">
          {csStudio.groups.map((group) => (
            <div className="ent-cs-nav-group" key={group.id}>
              <button type="button" className="ent-cs-nav-group-head" onClick={() => toggleGroup(group.id)}>
                <span>{group.label}</span>
                <span className="ent-cs-nav-caret">{openGroups[group.id] ? "⌄" : "›"}</span>
              </button>
              {openGroups[group.id]
                ? group.tools.map((t) => (
                    <button
                      type="button"
                      key={t.id}
                      className={`ent-cs-nav-item${t.id === toolId ? " is-active" : ""}`}
                      onClick={() => setToolId(t.id)}
                    >
                      <strong>{t.name}</strong>
                      <span>{t.desc}</span>
                    </button>
                  ))
                : null}
            </div>
          ))}
        </nav>
      </aside>

      <div className="ent-cs-main">
        <header className="ent-cs-header">
          <div>
            <h1>{tool?.name}</h1>
            <p className="ent-cs-header-intro">{csStudio.intro}</p>
          </div>
          <div className="ent-cs-header-user">
            <span className="ent-cs-user-avatar">{userLabel.slice(0, 1)}</span>
            <span>{userLabel}</span>
          </div>
        </header>

        <section className="ent-cs-panel">
          <div className="ent-cs-panel-head">
            <h2>功能操作区</h2>
            <p>{tool?.panelHint || "选择左侧工具开始配置或查看数据。"}</p>
          </div>

          {tool?.ready ? (
            <>
              {!scopeShopId ? (
                <div className="ent-ops-callout ent-ops-callout--warn ent-cs-scope-hint">
                  请先在顶部选择店铺，客服与插件数据按 orgId + shopId 隔离。
                </div>
              ) : null}
              <CsToolPane
                toolId={toolId}
                tool={tool}
                shops={shops}
                shopKey={shopKey}
                setShopKey={setShopKey}
                scopeShopId={scopeShopId}
                drillProps={{
                  onRouted: () => setLogOpen(true),
                  onLog: setExecLog,
                  onError: () => setLogOpen(true),
                }}
              />
            </>
          ) : (
            <div className="ent-cs-split ent-cs-split--single">
              <p className="ent-cs-empty ent-cs-empty--pad">该模块尚未开放。</p>
            </div>
          )}
        </section>

        {showExecLog ? (
          <footer className="ent-cs-log">
            <button type="button" className="ent-cs-log-toggle" onClick={() => setLogOpen((v) => !v)}>
              {logOpen ? "▼" : "▶"} 执行结果（{logOpen ? "点击收起" : "默认折叠，点击展开"}）
            </button>
            {logOpen ? (
              <pre className="ent-cs-log-body">
                {execLog ? JSON.stringify(execLog, null, 2) : "暂无执行记录"}
              </pre>
            ) : null}
          </footer>
        ) : null}
      </div>
    </div>
  );
}
