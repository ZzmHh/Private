import { asyncHandler } from "./middleware/asyncHandler.js";
import { orgIdFromUser } from "./enterpriseCollectStore.js";
import {
  getProductOpportunity,
  listProductOpportunities,
  refreshProductOpportunitiesFromSources,
  updateProductOpportunityScore,
  upsertProductOpportunity,
} from "./enterpriseProductOpportunityStore.js";

function handleError(res, error) {
  res.status(error.status || 500).json({ error: error.message || "请求失败。" });
}

function parseBodyArray(body) {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.items)) return body.items;
  if (Array.isArray(body?.opportunities)) return body.opportunities;
  return null;
}

/**
 * 企业站 · 跨平台爆款选品机会池
 *
 * 数据来源先统一成候选池：1688 采集箱、自有店铺商品、手工/第三方趋势信号。
 * 后续服务器上线后，只需要新增 connector 把外部 API 结果写进这个池子。
 */
export function registerEnterpriseProductOpportunityRoutes(app, { enterpriseAuthMiddleware }) {
  app.get("/api/enterprise/product-opportunities", enterpriseAuthMiddleware, (req, res) => {
    try {
      const orgId = orgIdFromUser(req.user);
      const opportunities = listProductOpportunities(orgId, {
        targetPlatform: req.query.targetPlatform ? String(req.query.targetPlatform) : undefined,
        market: req.query.market ? String(req.query.market) : undefined,
        sourcePlatform: req.query.sourcePlatform ? String(req.query.sourcePlatform) : undefined,
        status: req.query.status ? String(req.query.status) : undefined,
        limit: Number(req.query.limit) || 80,
      });
      res.json({ ok: true, opportunities });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/enterprise/product-opportunities/:id", enterpriseAuthMiddleware, (req, res) => {
    try {
      const orgId = orgIdFromUser(req.user);
      const opportunity = getProductOpportunity(orgId, req.params.id);
      if (!opportunity) return res.status(404).json({ error: "选品机会不存在。" });
      res.json({ ok: true, opportunity });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/enterprise/product-opportunities", enterpriseAuthMiddleware, (req, res) => {
    try {
      const orgId = orgIdFromUser(req.user);
      const item = upsertProductOpportunity(orgId, req.body || {}, req.user.id);
      res.json({ ok: true, opportunity: item });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/enterprise/product-opportunities/import", enterpriseAuthMiddleware, (req, res) => {
    try {
      const orgId = orgIdFromUser(req.user);
      const items = parseBodyArray(req.body);
      if (!items) return res.status(400).json({ error: "请传入 items 数组。" });
      const imported = items.map((item) => upsertProductOpportunity(orgId, item, req.user.id));
      res.json({ ok: true, importedCount: imported.length, opportunities: imported });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/enterprise/product-opportunities/refresh", enterpriseAuthMiddleware, (req, res) => {
    try {
      const orgId = orgIdFromUser(req.user);
      const result = refreshProductOpportunitiesFromSources(
        orgId,
        {
          targetPlatform: req.body?.targetPlatform || req.query.targetPlatform,
          market: req.body?.market || req.query.market,
        },
        req.user.id,
      );
      const opportunities = listProductOpportunities(orgId, {
        targetPlatform: req.body?.targetPlatform || req.query.targetPlatform,
        market: req.body?.market || req.query.market,
        limit: Number(req.body?.limit || req.query.limit) || 80,
      });
      res.json({ ok: true, ...result, opportunities });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post(
    "/api/enterprise/product-opportunities/:id/rescore",
    enterpriseAuthMiddleware,
    asyncHandler(async (req, res) => {
      const orgId = orgIdFromUser(req.user);
      const opportunity = updateProductOpportunityScore(orgId, req.params.id, req.body || {});
      if (!opportunity) return res.status(404).json({ error: "选品机会不存在。" });
      res.json({ ok: true, opportunity });
    }),
  );
}
