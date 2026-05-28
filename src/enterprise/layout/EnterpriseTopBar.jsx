import { EnterpriseIcon } from "../components/EnterpriseIcon.jsx";
import { EnterpriseModeSwitch } from "./EnterpriseModeSwitch.jsx";
import { getEnterpriseSiteConfig } from "../config/siteConfig.js";
import { useEnterpriseScope } from "../scope/EnterpriseScopeContext.jsx";
import { goToShopAuthorization } from "../components/EnterpriseShopBindPrompt.jsx";

function ScopeSelect({ label, value, disabled, onChange, children }) {
  return (
    <label className="enterprise-scope-select-wrap">
      <span className="enterprise-scope-select-label">{label}</span>
      <select
        className="enterprise-scope-select"
        value={value || ""}
        disabled={disabled}
        aria-label={label}
        onChange={(e) => onChange(e.target.value)}
      >
        {children}
      </select>
    </label>
  );
}

export function EnterpriseTopBar({
  mode,
  orgName,
  user,
  roleLabel,
  isOwner = true,
  standalone = false,
  onModeSwitch,
  onExit,
  sidebarCollapsed,
  onToggleSidebar,
  onOpenShopAuth,
}) {
  const site = getEnterpriseSiteConfig();
  const scope = useEnterpriseScope();
  const displayName = user?.displayName || user?.name || user?.loginName || user?.email || "用户";
  const initials = String(displayName).slice(0, 1).toUpperCase();
  const isConsole = mode === "console";
  const brandMark = standalone ? site.brandMark : "FM";

  const scopeBusy = scope.loading;
  const workbench = scope.workbenchScope;
  const currentShopOption = scope.shopOptions.find((s) => s.id === workbench?.shopId);
  const shopSyncHint =
    currentShopOption?.connectionStatus === "connected"
      ? currentShopOption.lastSyncAt
        ? `数据 ${new Date(currentShopOption.lastSyncAt).toLocaleString("zh-CN", { hour12: false })}`
        : "已绑定 · 待同步"
      : currentShopOption
        ? "未绑定 API"
        : null;

  return (
    <header className="enterprise-topbar">
      <div className="enterprise-topbar-brand">
        <span className="enterprise-topbar-mark">{brandMark}</span>
        <span>{orgName || "企业定制站"}</span>
      </div>

      <EnterpriseModeSwitch mode={mode} onSwitch={onModeSwitch} showConsole={isOwner} />

      <div className="enterprise-topbar-center">
        {isConsole && isOwner ? (
          <div className="enterprise-scope-bar">
            <ScopeSelect
              label="查看范围"
              value={scope.consoleView}
              disabled={scopeBusy}
              onChange={scope.setConsoleView}
            >
              {(scope.consoleViews || []).map((view) => (
                <option key={view.id} value={view.id}>
                  {view.label}
                </option>
              ))}
            </ScopeSelect>
            <input className="enterprise-search" type="search" placeholder="搜索订单、SKU、会话…" />
          </div>
        ) : (
          <div className="enterprise-scope-bar">
            {scopeBusy ? (
              <span className="enterprise-scope-empty">加载经营范围…</span>
            ) : scope.platformOptions.length ? (
              <>
                <ScopeSelect
                  label="平台"
                  value={workbench?.platform}
                  disabled={scopeBusy}
                  onChange={scope.setPlatform}
                >
                  {scope.platformOptions.map((platform) => (
                    <option key={platform.id} value={platform.id}>
                      {platform.label}
                    </option>
                  ))}
                </ScopeSelect>
                <ScopeSelect
                  label="市场"
                  value={workbench?.market}
                  disabled={scopeBusy || !scope.marketOptions.length}
                  onChange={scope.setMarket}
                >
                  {scope.marketOptions.map((market) => (
                    <option key={market.id} value={market.id}>
                      {market.label}
                    </option>
                  ))}
                </ScopeSelect>
                <ScopeSelect
                  label="店铺"
                  value={workbench?.shopId}
                  disabled={scopeBusy || !scope.shopOptions.length}
                  onChange={scope.setShop}
                >
                  {scope.shopOptions.map((shop) => (
                    <option key={shop.id} value={shop.id}>
                      {shop.name}
                    </option>
                  ))}
                </ScopeSelect>
                {shopSyncHint ? (
                  <span className={`enterprise-scope-sync is-${currentShopOption?.connectionStatus === "connected" ? "ok" : "warn"}`}>
                    {shopSyncHint}
                  </span>
                ) : null}
                {isOwner && currentShopOption?.connectionStatus !== "connected" ? (
                  <button
                    type="button"
                    className="enterprise-btn enterprise-btn-primary ent-topbar-bind-btn"
                    onClick={onOpenShopAuth || goToShopAuthorization}
                  >
                    绑定 API
                  </button>
                ) : null}
              </>
            ) : (
              <span className="enterprise-scope-empty">暂无授权店铺，请联系管理员</span>
            )}
            <input className="enterprise-search" type="search" placeholder="搜索历史任务、素材…" />
          </div>
        )}
      </div>

      <div className="enterprise-topbar-actions">
        <span className="enterprise-role-tag">{roleLabel || "演示账号"}</span>
        <button type="button" className="enterprise-icon-btn" title="通知" aria-label="通知">
          <EnterpriseIcon name="bell" size={16} />
        </button>
        {onExit ? (
          <button type="button" className="enterprise-btn enterprise-btn-ghost" onClick={onExit}>
            {standalone ? "退出登录" : "退出企业站"}
          </button>
        ) : null}
        <button
          type="button"
          className="enterprise-icon-btn"
          title={sidebarCollapsed ? "展开侧栏" : "收起侧栏"}
          aria-label="切换侧栏"
          onClick={onToggleSidebar}
        >
          <EnterpriseIcon name="menu" size={16} />
        </button>
        <button type="button" className="enterprise-user-chip">
          <span className="enterprise-user-avatar">{initials}</span>
          <span>{displayName}</span>
        </button>
      </div>
    </header>
  );
}
