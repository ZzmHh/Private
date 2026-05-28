import { enterpriseHref } from "../navConfig.js";
import { EnterpriseIcon } from "./EnterpriseIcon.jsx";

export function goToShopAuthorization() {
  window.location.hash = enterpriseHref("console/org/shops").slice(1);
  window.scrollTo(0, 0);
}

/**
 * 店铺 API 绑定提示 — 主账号可跳转「控制台 → 店铺授权」；子账号提示联系管理员
 */
export function EnterpriseShopBindPrompt({
  isOwner = false,
  variant = "banner",
  shopName,
  platformLabel,
  marketLabel,
  connectionStatus = "disconnected",
  lastSyncAt,
  noShopSelected = false,
  onGoBind,
}) {
  const goBind = onGoBind || goToShopAuthorization;
  const connected = connectionStatus === "connected";

  if (variant === "compact" && connected && !noShopSelected) {
    return (
      <div className="ent-shop-bind ent-shop-bind--compact is-ok">
        <EnterpriseIcon name="store" size={16} />
        <span>
          {platformLabel} · {marketLabel} · {shopName}
          {lastSyncAt ? ` · 同步 ${new Date(lastSyncAt).toLocaleString("zh-CN", { hour12: false })}` : " · 已绑定"}
        </span>
        {isOwner ? (
          <button type="button" className="enterprise-btn enterprise-btn-ghost ent-shop-bind-link" onClick={goBind}>
            管理绑定
          </button>
        ) : null}
      </div>
    );
  }

  let title = "店铺尚未绑定 API";
  let desc = isOwner
    ? "在「控制台 → 店铺授权」粘贴 API 或 TikTok OAuth，凭证保存在本系统服务器，全员无需重复绑定。"
    : "请联系企业管理员在控制台完成店铺 API 绑定，并为你分配可用店铺。";

  if (noShopSelected) {
    title = "请先在顶栏选择店铺";
    desc = isOwner
      ? "选择平台 / 市场 / 店铺后，可在此 Agent 使用店铺数据；若尚未绑定 API，请前往店铺授权。"
      : "在顶栏选择被授权的店铺；若列表为空，请联系管理员添加店铺并授权。";
  } else if (connected) {
    title = "当前店铺已绑定 API";
    desc = lastSyncAt
      ? `最近同步：${new Date(lastSyncAt).toLocaleString("zh-CN", { hour12: false })}`
      : "可点击「立即同步」拉取最新订单与商品数据。";
  }

  return (
    <div
      className={`ent-shop-bind ent-shop-bind--${variant}${connected ? " is-ok" : noShopSelected ? " is-info" : " is-warn"}`}
      role="status"
    >
      <div className="ent-shop-bind-icon">
        <EnterpriseIcon name="store" size={variant === "banner" ? 22 : 18} />
      </div>
      <div className="ent-shop-bind-body">
        <strong>{title}</strong>
        <p>{desc}</p>
        {shopName && !noShopSelected ? (
          <p className="ent-shop-bind-meta">
            当前：{platformLabel} · {marketLabel} · {shopName}
          </p>
        ) : null}
      </div>
      <div className="ent-shop-bind-actions">
        {isOwner ? (
          <>
            <button type="button" className="enterprise-btn enterprise-btn-primary" onClick={goBind}>
              {connected ? "店铺授权管理" : "去绑定店铺 API"}
            </button>
            {!connected && !noShopSelected ? (
              <span className="ent-shop-bind-hint">无需登录服务器</span>
            ) : null}
          </>
        ) : (
          <span className="ent-shop-bind-hint">绑定入口仅主账号可见</span>
        )}
      </div>
    </div>
  );
}
