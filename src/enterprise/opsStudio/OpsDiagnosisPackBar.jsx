const PACK_ORDER = ["analytics", "orders", "ads", "inventory"];

export function OpsDiagnosisPackBar({ pack, compact = false }) {
  if (!pack) return null;
  return (
    <div className={`ent-ops-pack${compact ? " ent-ops-pack--compact" : ""}`}>
      <div className="ent-ops-pack-head">
        <strong>诊断包 {pack.done}/{pack.total}</strong>
        {!compact ? (
          <span>插件在卖家中心同步：概览 → 订单 → 广告 → 库存</span>
        ) : null}
      </div>
      <div className="ent-ops-pack-chips">
        {PACK_ORDER.map((key) => {
          const page = pack.pages?.[key];
          if (!page) return null;
          return (
            <span key={key} className={`ent-ops-pack-chip${page.synced ? " is-done" : ""}`}>
              {page.synced ? "✓" : "○"} {page.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
