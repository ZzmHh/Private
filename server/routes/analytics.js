import { recordProductEvent, getProductAnalytics, PRODUCT_EVENT_NAMES } from "../productEvents.js";
import { createError } from "../lib/errors.js";

/**
 * @param {import("express").Express} app
 * @param {{ authMiddleware: Function, adminMiddleware: Function, verifyToken: Function, getUserById: Function }} deps
 */
export function registerAnalyticsRoutes(app, { authMiddleware, adminMiddleware, verifyToken, getUserById }) {
  app.post("/api/track", (req, res) => {
    try {
      const { event, sessionId, path, properties } = req.body || {};
      const name = String(event || "").trim();
      if (!name || !PRODUCT_EVENT_NAMES.includes(name)) {
        throw createError("无效的事件名。", 400, "VALIDATION_ERROR");
      }

      let userId = null;
      const authHeader = req.headers.authorization || "";
      const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
      const decoded = verifyToken(token);
      if (decoded?.sub) {
        const user = getUserById(decoded.sub);
        if (user) userId = user.id;
      }

      const row = recordProductEvent({
        event: name,
        sessionId: String(sessionId || req.ip || "anonymous").slice(0, 64),
        userId,
        path: String(path || req.headers.referer || "").slice(0, 500),
        properties,
      });

      res.json({ ok: true, id: row?.id });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message || "埋点失败。" });
    }
  });

  app.get("/api/admin/analytics", authMiddleware, adminMiddleware, (req, res) => {
    const days = Math.min(30, Math.max(1, Number(req.query.days) || 7));
    res.json(getProductAnalytics({ days }));
  });
}
