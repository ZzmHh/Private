import { parseUniversalStoreMetricsCsv } from "./storeMetrics/parseCsv.js";
import { analyzeStoreMetrics } from "./storeMetrics/analyze.js";
import {
  saveStoreMetricsImport,
  getLatestStoreMetricsImport,
  listStoreMetricsImports,
} from "./storeMetrics/store.js";
import { getTemplateCsv, getTemplateDownloadName } from "./storeMetrics/templates.js";
import { ensureFeatureAccess } from "./db.js";

/**
 * @param {import("express").Express} app
 * @param {{ authMiddleware: Function }} deps
 */
export function registerStoreMetricsRoutes(app, { authMiddleware }) {
  app.get("/api/store-metrics/template/:kind", authMiddleware, (req, res) => {
    const kind = req.params.kind || "combined";
    const csv = getTemplateCsv(kind);
    const filename = getTemplateDownloadName(kind);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="fanmeng-template.csv"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    );
    res.send("\uFEFF" + csv);
  });

  app.get("/api/store-metrics/template/:kind/public", (req, res) => {
    const kind = req.params.kind || "combined";
    const csv = getTemplateCsv(kind);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.send("\uFEFF" + csv);
  });

  app.get("/api/store-metrics/latest", authMiddleware, (req, res) => {
    try {
      ensureFeatureAccess(req.user, "storeApiAgents");
      ensureFeatureAccess(req.user, "csvImport");
      const latest = getLatestStoreMetricsImport(req.user.id);
      const history = listStoreMetricsImports(req.user.id, 5);
      res.json({ latest, history });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message || "读取失败。" });
    }
  });

  app.post("/api/store-metrics/import", authMiddleware, (req, res) => {
    try {
      ensureFeatureAccess(req.user, "storeApiAgents");
      ensureFeatureAccess(req.user, "csvImport");
      const { csvText, label } = req.body || {};
      if (!csvText || !String(csvText).trim()) {
        return res.status(400).json({ error: "请提供 csvText。" });
      }

      const parsed = parseUniversalStoreMetricsCsv(String(csvText));
      if (!parsed.ok) {
        return res.status(400).json({ error: parsed.errors?.join(" ") || "CSV 解析失败。", warnings: parsed.warnings });
      }

      const analysis = analyzeStoreMetrics(parsed);
      const record = saveStoreMetricsImport({
        userId: req.user.id,
        label,
        parsed,
        analysis,
        warnings: parsed.warnings || [],
      });

      res.json({
        ok: true,
        import: {
          id: record.id,
          importedAt: record.importedAt,
          platform: record.platform,
          shopPeriods: record.shopRows.length,
          skuCount: record.skuRows.length,
        },
        analysis,
        warnings: parsed.warnings,
      });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message || "导入失败。" });
    }
  });
}

export { getStoreMetricsAgentContext } from "./storeMetrics/store.js";
