import { defaultWorkbenchAgentId } from "./workbenchConfig.js";
import { enterpriseHref, enterpriseWorkbenchHref } from "./navConfig.js";

export const ENTERPRISE_ROLE_OWNER = "owner";
export const ENTERPRISE_ROLE_MEMBER = "member";

/** 主账号：组织所有者，登录后进控制台总览 */
export function isEnterpriseOwner(user) {
  if (!user) return false;
  if (user.accountType === "enterprise_owner") return true;
  if (user.accountType === "enterprise_member") return false;
  if (user.enterpriseRole === ENTERPRISE_ROLE_OWNER) return true;
  if (user.enterpriseRole === ENTERPRISE_ROLE_MEMBER) return false;
  if (user.isEnterpriseOwner === true) return true;
  if (user.email === "preview@local") return true;
  if (user.plan === "enterprise" && !user.enterpriseOrgId && !user.enterpriseParentUserId) return true;
  return false;
}

export function getEnterpriseRoleLabel(user) {
  if (user?.enterpriseRoleLabel) return user.enterpriseRoleLabel;
  return isEnterpriseOwner(user) ? "主账号" : "子账号";
}

/** 登录后或进入 #enterprise 时的默认落地页 */
export function enterpriseDefaultHash(user) {
  if (isEnterpriseOwner(user)) {
    return enterpriseHref("console/overview");
  }
  return enterpriseWorkbenchHref(defaultWorkbenchAgentId());
}

/**
 * 登录后根据角色解析企业站落地路由（子账号不能进控制台）
 * @param {object | null | undefined} user
 * @param {ReturnType<import("./navConfig.js").parseEnterpriseRoute>} route
 */
export function resolveEnterpriseLandingHash(user, route) {
  if (!isEnterpriseOwner(user)) {
    if (route?.mode === "workbench" && route.agentId) {
      return enterpriseWorkbenchHref(route.agentId);
    }
    return enterpriseDefaultHash(user);
  }

  if (route?.mode === "workbench" && route.agentId) {
    return enterpriseWorkbenchHref(route.agentId);
  }
  if (route?.path?.startsWith("console/")) {
    return enterpriseHref(route.path);
  }
  return enterpriseDefaultHash(user);
}

/** 子账号误进控制台时重定向到工作台 */
export function enterpriseGuardHash(user, route) {
  if (!user || isEnterpriseOwner(user)) return null;
  if (route?.mode === "console") {
    return enterpriseWorkbenchHref(route.agentId || defaultWorkbenchAgentId());
  }
  return null;
}
