import {
  buildScopeOptions,
  ensureEnterpriseOrgShopsSeed,
  getOrgShopById,
  resolveWorkbenchScope,
} from "./enterpriseOrgShops.js";
import {
  buildEnterpriseTiktokOAuthStartUrl,
  buildEnterpriseShopeeOAuthStartUrl,
  buildEnterpriseLazadaOAuthStartUrl,
  buildEnterpriseWalmartOAuthStartUrl,
  completeEnterpriseTiktokOAuth,
  createOrgShop,
  disconnectShopConnection,
  getShopDataStatus,
  listAdminShops,
  listShopCatalogProducts,
  saveShopApiConnection,
  setShopMemberGrants,
  syncEnterpriseShopData,
} from "./enterpriseShopConnections.js";

function requireEnterpriseOwner(req, res, next) {
  const isOwner =
    req.user?.accountType === "enterprise_owner" || req.user?.enterpriseRole === "owner";
  if (!isOwner) {
    return res.status(403).json({ error: "需要主账号权限。" });
  }
  next();
}

export function registerEnterpriseRoutes(app, { enterpriseAuthMiddleware }) {
  app.get("/api/enterprise/scope/options", enterpriseAuthMiddleware, (req, res) => {
    ensureEnterpriseOrgShopsSeed();
    const mode = req.query.mode === "console" ? "console" : "workbench";
    const options = buildScopeOptions(req.user, mode);
    res.json(options);
  });

  app.post("/api/enterprise/scope/resolve", enterpriseAuthMiddleware, (req, res) => {
    ensureEnterpriseOrgShopsSeed();
    const { platform, market, shopId } = req.body || {};
    const result = resolveWorkbenchScope(req.user, { platform, market, shopId });
    if (!result.valid) {
      return res.status(404).json({ error: "暂无可用店铺，请联系管理员授权。" });
    }
    res.json(result);
  });

  app.get("/api/enterprise/shops", enterpriseAuthMiddleware, (req, res) => {
    ensureEnterpriseOrgShopsSeed();
    const mode = req.query.mode === "console" ? "console" : "workbench";
    const options = buildScopeOptions(req.user, mode);
    res.json({ shops: options.platforms.flatMap((p) => p.markets.flatMap((m) => m.shops)) });
  });

  app.get("/api/enterprise/shops/:shopId", enterpriseAuthMiddleware, (req, res) => {
    ensureEnterpriseOrgShopsSeed();
    try {
      const shop = getOrgShopById(req.params.shopId, req.user);
      const status = getShopDataStatus(req.user, req.params.shopId);
      res.json({ shop, connection: status.connection, productCount: status.productCount });
    } catch (error) {
      res.status(error.status || 400).json({ error: error.message });
    }
  });

  app.get("/api/enterprise/shops/:shopId/status", enterpriseAuthMiddleware, (req, res) => {
    ensureEnterpriseOrgShopsSeed();
    try {
      res.json(getShopDataStatus(req.user, req.params.shopId));
    } catch (error) {
      res.status(error.status || 400).json({ error: error.message });
    }
  });

  app.get("/api/enterprise/shops/:shopId/products", enterpriseAuthMiddleware, (req, res) => {
    ensureEnterpriseOrgShopsSeed();
    try {
      const products = listShopCatalogProducts(req.user, req.params.shopId);
      res.json({ products });
    } catch (error) {
      res.status(error.status || 400).json({ error: error.message });
    }
  });

  app.post("/api/enterprise/shops/:shopId/sync", enterpriseAuthMiddleware, async (req, res) => {
    ensureEnterpriseOrgShopsSeed();
    try {
      const result = await syncEnterpriseShopData(req.user, req.params.shopId);
      res.json(result);
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  });

  app.get(
    "/api/enterprise/admin/shops",
    enterpriseAuthMiddleware,
    requireEnterpriseOwner,
    (req, res) => {
      ensureEnterpriseOrgShopsSeed();
      try {
        res.json(listAdminShops(req.user));
      } catch (error) {
        res.status(error.status || 500).json({ error: error.message });
      }
    },
  );

  app.post(
    "/api/enterprise/admin/shops",
    enterpriseAuthMiddleware,
    requireEnterpriseOwner,
    (req, res) => {
      ensureEnterpriseOrgShopsSeed();
      try {
        const shop = createOrgShop(req.user, req.body || {});
        res.status(201).json({ shop });
      } catch (error) {
        res.status(error.status || 400).json({ error: error.message });
      }
    },
  );

  app.post(
    "/api/enterprise/admin/shops/:shopId/connect",
    enterpriseAuthMiddleware,
    requireEnterpriseOwner,
    (req, res) => {
      ensureEnterpriseOrgShopsSeed();
      try {
        const connection = saveShopApiConnection(req.user, req.params.shopId, req.body || {});
        res.json({ connection });
      } catch (error) {
        res.status(error.status || 400).json({ error: error.message });
      }
    },
  );

  app.delete(
    "/api/enterprise/admin/shops/:shopId/connect",
    enterpriseAuthMiddleware,
    requireEnterpriseOwner,
    (req, res) => {
      ensureEnterpriseOrgShopsSeed();
      try {
        res.json(disconnectShopConnection(req.user, req.params.shopId));
      } catch (error) {
        res.status(error.status || 400).json({ error: error.message });
      }
    },
  );

  app.get(
    "/api/enterprise/admin/shops/:shopId/oauth/tiktok",
    enterpriseAuthMiddleware,
    requireEnterpriseOwner,
    (req, res) => {
      ensureEnterpriseOrgShopsSeed();
      try {
        const authorizeUrl = buildEnterpriseTiktokOAuthStartUrl(req.params.shopId, req.user);
        res.json({ authorizeUrl });
      } catch (error) {
        res.status(error.status || 400).json({ error: error.message });
      }
    },
  );

  app.get(
    "/api/enterprise/admin/shops/:shopId/oauth/shopee",
    enterpriseAuthMiddleware,
    requireEnterpriseOwner,
    (req, res) => {
      ensureEnterpriseOrgShopsSeed();
      try {
        const authorizeUrl = buildEnterpriseShopeeOAuthStartUrl(req.params.shopId, req.user);
        res.json({ authorizeUrl });
      } catch (error) {
        res.status(error.status || 400).json({ error: error.message });
      }
    },
  );

  app.get(
    "/api/enterprise/admin/shops/:shopId/oauth/lazada",
    enterpriseAuthMiddleware,
    requireEnterpriseOwner,
    (req, res) => {
      ensureEnterpriseOrgShopsSeed();
      try {
        const authorizeUrl = buildEnterpriseLazadaOAuthStartUrl(req.params.shopId, req.user);
        res.json({ authorizeUrl });
      } catch (error) {
        res.status(error.status || 400).json({ error: error.message });
      }
    },
  );

  app.get(
    "/api/enterprise/admin/shops/:shopId/oauth/walmart",
    enterpriseAuthMiddleware,
    requireEnterpriseOwner,
    (req, res) => {
      ensureEnterpriseOrgShopsSeed();
      try {
        const authorizeUrl = buildEnterpriseWalmartOAuthStartUrl(req.params.shopId, req.user);
        res.json({ authorizeUrl });
      } catch (error) {
        res.status(error.status || 400).json({ error: error.message });
      }
    },
  );

  app.put(
    "/api/enterprise/admin/shops/:shopId/grants",
    enterpriseAuthMiddleware,
    requireEnterpriseOwner,
    (req, res) => {
      ensureEnterpriseOrgShopsSeed();
      try {
        const grants = setShopMemberGrants(req.user, req.params.shopId, req.body || {});
        res.json({ grants });
      } catch (error) {
        res.status(error.status || 400).json({ error: error.message });
      }
    },
  );

  app.post(
    "/api/enterprise/admin/shops/:shopId/sync",
    enterpriseAuthMiddleware,
    requireEnterpriseOwner,
    async (req, res) => {
      ensureEnterpriseOrgShopsSeed();
      try {
        const result = await syncEnterpriseShopData(req.user, req.params.shopId);
        res.json(result);
      } catch (error) {
        res.status(error.status || 500).json({ error: error.message });
      }
    },
  );
}

export { completeEnterpriseTiktokOAuth, decodeEnterpriseShopOAuthState } from "./enterpriseShopConnections.js";
