import { useEnterpriseScope } from "../scope/EnterpriseScopeContext.jsx";
import { EnterpriseShopBindPrompt } from "../components/EnterpriseShopBindPrompt.jsx";

/** Agent 内店铺上下文条（读顶栏 WorkScope，不重复选店） */
export function AgentShopContextBar({ isOwner = false, onGoBind }) {
  const scopeCtx = useEnterpriseScope();
  const scope = scopeCtx.workbenchScope;
  const shop = scopeCtx.shopOptions.find((s) => s.id === scope?.shopId);

  if (scopeCtx.loading) {
    return (
      <div className="ent-shop-bind ent-shop-bind--compact is-info">
        <span>正在加载店铺与 API 状态…</span>
      </div>
    );
  }

  if (!scope?.shopId) {
    return (
      <EnterpriseShopBindPrompt
        variant="banner"
        isOwner={isOwner}
        noShopSelected
        onGoBind={onGoBind}
      />
    );
  }

  return (
    <EnterpriseShopBindPrompt
      variant="banner"
      isOwner={isOwner}
      shopName={scope.shopName}
      platformLabel={scope.platformLabel}
      marketLabel={scope.marketLabel}
      connectionStatus={shop?.connectionStatus || "disconnected"}
      lastSyncAt={shop?.lastSyncAt}
      onGoBind={onGoBind}
    />
  );
}
