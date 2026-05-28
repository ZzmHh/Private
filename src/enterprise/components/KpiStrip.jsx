export function KpiStrip({ items }) {
  return (
    <div className="enterprise-kpi-strip">
      {items.map((item) => (
        <div className="enterprise-kpi" key={item.label}>
          <div className="enterprise-kpi-label">{item.label}</div>
          <div className="enterprise-kpi-value">{item.value}</div>
          {item.meta ? <div className="enterprise-kpi-meta">{item.meta}</div> : null}
        </div>
      ))}
    </div>
  );
}
