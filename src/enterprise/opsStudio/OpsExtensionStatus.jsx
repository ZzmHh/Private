import { formatRelativeTime } from "./opsStudioApi.js";

export function OpsExtensionStatus({ summary, loading, onRefresh }) {
  const connected = summary?.extensionConnected;
  return (
    <section className="ent-ops-status" aria-label="插件数据状态">
      <div className="ent-ops-status-main">
        <span className={`ent-ops-dot${connected ? " is-on" : ""}`} aria-hidden />
        <div>
          <strong>{connected ? "插件已有同步数据" : "尚未检测到插件同步"}</strong>
          <p>
            {summary?.shopName ? `${summary.shopName} · ` : ""}
            最后同步 {formatRelativeTime(summary?.latestSnapshotAt)}
            {summary?.metricsImport ? ` · CSV ${summary.metricsImport.skuCount} SKU` : ""}
          </p>
        </div>
      </div>
      <button type="button" className="ent-cs-query-btn" onClick={onRefresh} disabled={loading}>
        {loading ? "刷新中…" : "刷新状态"}
      </button>
    </section>
  );
}
