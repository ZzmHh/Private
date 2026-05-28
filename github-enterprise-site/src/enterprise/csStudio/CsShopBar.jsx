export function CsShopBar({ shops, shopKey, onShopKeyChange, hint }) {
  return (
    <div className="ent-cs-shop-bar">
      <label className="ent-cs-field ent-cs-field--inline ent-cs-shop-bar-field">
        <span className="ent-cs-field-label">FAQ 范围</span>
        <select className="ent-cs-control" value={shopKey} onChange={(e) => onShopKeyChange(e.target.value)}>
          <option value="">全店通用（全局模板）</option>
          {shops.map((s) => (
            <option key={s.shopId || s.shopKey} value={s.shopId || s.shopKey}>
              {s.shopName || s.shopId || s.shopKey}
            </option>
          ))}
        </select>
      </label>
      {hint ? <p className="ent-cs-shop-bar-hint">{hint}</p> : null}
    </div>
  );
}
