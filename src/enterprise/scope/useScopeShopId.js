import { useEnterpriseScope } from "./EnterpriseScopeContext.jsx";

/** 工作台当前选中店铺 id（企业 extension / metrics API 必填） */
export function useScopeShopId() {
  const { workbenchScope, loading } = useEnterpriseScope();
  return { shopId: workbenchScope?.shopId || "", loading, workbenchScope };
}
