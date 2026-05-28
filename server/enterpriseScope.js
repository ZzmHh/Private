import { createError } from "./lib/errors.js";
import { ensureEnterpriseOrgShopsSeed, getOrgShopById } from "./enterpriseOrgShops.js";

/** CS / 指标等复用存储时的隔离键（非用户 id） */
export function enterpriseDataScope(orgId, shopId) {
  return `ent:${orgId}:${shopId}`;
}

/**
 * @param {import("./enterpriseAuth.js").EnterpriseUser} user
 * @param {string} shopId
 */
export function assertEnterpriseShopAccess(user, shopId) {
  ensureEnterpriseOrgShopsSeed();
  const id = String(shopId || "").trim();
  if (!id) throw createError("请指定 shopId。", 400);
  const shop = getOrgShopById(id, user);
  if (!shop) throw createError("无权访问该店铺。", 403);
  const orgId = user.orgId || shop.orgId;
  return {
    orgId,
    shopId: id,
    shop,
    scopeKey: enterpriseDataScope(orgId, id),
  };
}

/**
 * @param {import("express").Request} req
 */
export function shopScopeFromRequest(req) {
  const shopId =
    String(req.body?.shopId || req.query?.shopId || req.body?.shopKey || req.query?.shopKey || "").trim();
  return assertEnterpriseShopAccess(req.user, shopId);
}
