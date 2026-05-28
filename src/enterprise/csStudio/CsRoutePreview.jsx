import { CS_ACTION_LABELS, CS_TIER_LABELS, buildRouteMetaRows } from "./csStudioConstants.js";

export function CsRoutePreview({ routed, busy, error, onCopy }) {
  if (busy) {
    return (
      <div className="ent-cs-preview-loading">
        <div className="ent-cs-spinner" />
        <p>分层路由中…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ent-cs-cs-error">
        <strong>路由失败</strong>
        <p>{error}</p>
      </div>
    );
  }

  if (!routed) {
    return <div className="ent-cs-empty">粘贴买家消息后，点击「测试分层路由」查看结果</div>;
  }

  const tierLabel = CS_TIER_LABELS[routed.tier] || routed.tier || "—";
  const actionLabel = CS_ACTION_LABELS[routed.action] || routed.action || "—";
  const metaRows = buildRouteMetaRows(routed);

  return (
    <div className="ent-cs-route-preview">
      <div className="ent-cs-route-badges">
        <span className="ent-cs-route-badge ent-cs-route-badge--tier">{tierLabel}</span>
        <span
          className={`ent-cs-route-badge ent-cs-route-badge--action ent-cs-route-badge--${routed.action || "draft"}`}
        >
          {actionLabel}
        </span>
      </div>

      {routed.replyText ? (
        <div className="ent-cs-route-reply">
          <div className="ent-cs-route-reply-head">
            <strong>建议回复</strong>
            <button type="button" className="ent-cs-copy-btn" onClick={() => onCopy?.(routed.replyText)}>
              复制
            </button>
          </div>
          <pre className="ent-cs-route-reply-body">{routed.replyText}</pre>
        </div>
      ) : (
        <p className="ent-cs-empty">暂无回复话术</p>
      )}

      <dl className="ent-cs-route-meta">
        {metaRows.map(([label, val]) => (
          <div className="ent-cs-route-meta-row" key={label}>
            <dt>{label}</dt>
            <dd>{val}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
