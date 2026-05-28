/**
 * 企业 AI 工作台 · 浏览器助手 API（/api/enterprise/extension/*）
 * 与凡梦 C 端 /api/extension/* 完全隔离：enterprise_token + orgId/shopId
 */
import { agentSkills, buildAgentMessages } from "./agentSkills.js";
import { generateBuyerReplyText } from "./autoReply/generateBuyerReply.js";
import { routeBuyerMessage } from "./autoReply/routeBuyerMessage.js";
import { assessNightReadiness } from "./autoReply/assessNightReadiness.js";
import { listLanguagesForApi } from "../shared/tiktokShopLanguages.js";
import { getCsAnalyticsSummary, listCsSessionEvents, recordCsRouteEvent } from "./autoReply/csAnalytics.js";
import { parseFaqImportPayload, FAQ_IMPORT_SAMPLE_CSV } from "./autoReply/parseFaqImport.js";
import { buildFaqShopContext } from "./autoReply/buildFaqShopContext.js";
import { generateFaqDrafts } from "./autoReply/generateFaqDrafts.js";
import { withDbLock } from "./repositories/index.js";
import {
  deleteCsFaqTemplate,
  getCsSettings,
  importCsFaqTemplates,
  listCsFaqTemplates,
  listCsFaqTemplatesForEditor,
  listCsSellerAlerts,
  markCsAlertRead,
  saveCsSettings,
  syncCsFaqTemplates,
  upsertCsFaqTemplate,
} from "./autoReply/csStore.js";
import { validateBody, validators } from "./validate/index.js";
import { asyncHandler } from "./middleware/asyncHandler.js";
import { shopScopeFromRequest } from "./enterpriseScope.js";
import { getAccessibleShops } from "./enterpriseOrgShops.js";
import {
  getMergedEnterpriseExtensionContext,
  listEnterpriseExtensionSnapshots,
  saveEnterpriseExtensionSnapshot,
} from "./enterpriseExtensionSync.js";
import { buildEnterpriseExtensionWorkspaceSummary } from "./enterpriseExtensionWorkspace.js";
import {
  getEnterpriseStoreMetricsAgentContext,
  getLatestEnterpriseStoreMetricsImport,
  saveEnterpriseStoreMetricsImport,
} from "./enterpriseStoreMetrics.js";
import { parseUniversalStoreMetricsCsv } from "./storeMetrics/parseCsv.js";
import { analyzeStoreMetrics } from "./storeMetrics/analyze.js";

function enterpriseExtensionCors(app) {
  app.use("/api/enterprise/extension", (req, res, next) => {
    const origin = req.headers.origin;
    if (
      origin &&
      (origin.startsWith("chrome-extension://") ||
        origin.startsWith("http://127.0.0.1") ||
        origin.startsWith("http://localhost"))
    ) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header("Access-Control-Allow-Headers", "Authorization, Content-Type");
      res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    }
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });
}

function handleScopeError(res, error) {
  res.status(error.status || 500).json({ error: error.message || "请求失败。" });
}

/**
 * @param {import("express").Express} app
 * @param {{ enterpriseAuthMiddleware: Function, apiKey: string, providerName: string, model: string, callChatCompletions: Function }} deps
 */
export function registerEnterpriseExtensionRoutes(app, deps) {
  const { enterpriseAuthMiddleware, apiKey, providerName, model, callChatCompletions } = deps;
  enterpriseExtensionCors(app);

  app.get("/api/enterprise/extension/status", enterpriseAuthMiddleware, (req, res) => {
    try {
      const { orgId, shopId, shop, scopeKey } = shopScopeFromRequest(req);
      const platform = String(req.query.platform || shop.platform || "tiktok").toLowerCase();
      const snaps = listEnterpriseExtensionSnapshots(orgId, shopId, platform, 20);
      res.json({
        ok: true,
        orgId,
        shopId,
        shopName: shop.shopName,
        platform,
        snapshotCount: snaps.length,
        latestAt: snaps[0]?.pulledAt || null,
        pageTypes: [...new Set(snaps.map((s) => s.pageType))],
        scopeKey,
      });
    } catch (error) {
      handleScopeError(res, error);
    }
  });

  app.get("/api/enterprise/extension/shops", enterpriseAuthMiddleware, (req, res) => {
    try {
      const shops = getAccessibleShops(req.user).map((s) => ({
        shopId: s.id,
        shopName: s.shopName,
        platform: s.platform,
        market: s.market,
      }));
      res.json({ ok: true, shops });
    } catch (error) {
      handleScopeError(res, error);
    }
  });

  app.get("/api/enterprise/extension/workspace-summary", enterpriseAuthMiddleware, (req, res) => {
    try {
      const { orgId, shopId, shop, scopeKey } = shopScopeFromRequest(req);
      const platform = String(req.query.platform || shop.platform || "tiktok").toLowerCase();
      const summary = buildEnterpriseExtensionWorkspaceSummary(orgId, shopId, scopeKey, platform);
      res.json({ ok: true, summary });
    } catch (error) {
      handleScopeError(res, error);
    }
  });

  app.post(
    "/api/enterprise/extension/snapshot",
    enterpriseAuthMiddleware,
    validateBody(validators.extensionSnapshot),
    (req, res) => {
      try {
        const { orgId, shopId, shop } = shopScopeFromRequest(req);
        const { platform, pageType, pageUrl, title, data, shopName } = req.body || {};
        const snapshot = saveEnterpriseExtensionSnapshot({
          orgId,
          shopId,
          platform: platform || shop.platform || "tiktok",
          pageType: pageType || "unknown",
          pageUrl: pageUrl || "",
          title: title || "",
          shopName: shopName || shop.shopName || "",
          data,
          syncedByUserId: req.user.id,
        });
        res.json({
          ok: true,
          snapshot: { id: snapshot.id, pulledAt: snapshot.pulledAt, pageType: snapshot.pageType },
        });
      } catch (error) {
        handleScopeError(res, error);
      }
    },
  );

  app.post("/api/enterprise/extension/analyze", enterpriseAuthMiddleware, async (req, res) => {
    try {
      if (!apiKey) {
        return res.status(400).json({ error: `还没有配置 ${providerName} API Key。` });
      }
      const { orgId, shopId, shop, scopeKey } = shopScopeFromRequest(req);
      const { agentId, input, platform, includeSnapshots } = req.body || {};
      const allowed = ["growth", "profit", "service"];
      if (!allowed.includes(agentId)) {
        return res.status(400).json({ error: `agentId 须为 ${allowed.join(" / ")} 之一。` });
      }

      const plat = String(platform || shop.platform || "tiktok").toLowerCase();
      let enrichedInput =
        typeof input === "string" && input.trim()
          ? input.trim()
          : agentId === "growth"
            ? `基于企业浏览器助手同步的 ${shop.shopName} 页面数据，做业绩诊断：给出 P0/P1 行动。`
            : agentId === "profit"
              ? "基于页面快照与 CSV，做广告与库存/利润方向分析。"
              : "基于店铺上下文，输出客服策略摘要。";

      if (includeSnapshots !== false) {
        const ctx = getMergedEnterpriseExtensionContext(orgId, shopId, plat, 8);
        const metricsCtx = getEnterpriseStoreMetricsAgentContext(scopeKey, plat);
        const blocks = [];
        if (metricsCtx) blocks.push("## 经营 CSV", JSON.stringify(metricsCtx, null, 2));
        if (ctx) blocks.push("## 浏览器助手页面快照", JSON.stringify(ctx, null, 2));
        enrichedInput = blocks.length
          ? [enrichedInput, "", ...blocks].join("\n")
          : `${enrichedInput}\n\n## 数据\n暂无 CSV 或页面快照，请用浏览器助手「同步本页」或导入 CSV。`;
      }

      const { response, data } = await callChatCompletions({
        model,
        temperature: 0.45,
        max_tokens: 4096,
        messages: buildAgentMessages(agentId, enrichedInput),
      });

      if (!response.ok) {
        return res.status(response.status).json({
          error: data?.error?.message || data?.message || "模型调用失败。",
        });
      }

      const answer = data?.choices?.[0]?.message?.content || "模型没有返回内容。";
      res.json({ ok: true, agentId, answer, shopId, orgId });
    } catch (error) {
      handleScopeError(res, error);
    }
  });

  // ── 经营 CSV（企业独立存储）──
  app.get("/api/enterprise/metrics/latest", enterpriseAuthMiddleware, (req, res) => {
    try {
      const { scopeKey } = shopScopeFromRequest(req);
      res.json({ ok: true, latest: getLatestEnterpriseStoreMetricsImport(scopeKey) });
    } catch (error) {
      handleScopeError(res, error);
    }
  });

  app.post("/api/enterprise/metrics/import", enterpriseAuthMiddleware, (req, res) => {
    try {
      const { orgId, shopId, scopeKey } = shopScopeFromRequest(req);
      const { csvText, label } = req.body || {};
      if (!String(csvText || "").trim()) {
        return res.status(400).json({ error: "请上传 CSV 内容。" });
      }
      const parsed = parseUniversalStoreMetricsCsv(String(csvText));
      if (!parsed.ok) {
        return res.status(400).json({ error: parsed.errors?.join(" ") || "CSV 解析失败。", warnings: parsed.warnings });
      }
      const analysis = analyzeStoreMetrics(parsed);
      const record = saveEnterpriseStoreMetricsImport({
        scopeKey,
        orgId,
        shopId,
        label: label || "经营数据导入",
        parsed,
        analysis,
        warnings: parsed.warnings || [],
      });
      res.json({ ok: true, import: record, analysis, warnings: parsed.warnings });
    } catch (error) {
      handleScopeError(res, error);
    }
  });

  // ── 客服 CS（scopeKey 隔离，逻辑复用 csStore）──

  app.get("/api/enterprise/extension/cs/faq", enterpriseAuthMiddleware, (req, res) => {
    try {
      const { shopId, scopeKey } = shopScopeFromRequest(req);
      const editor = req.query.editor === "1" || req.query.editor === "true";
      const templates = editor
        ? listCsFaqTemplatesForEditor(scopeKey, shopId)
        : listCsFaqTemplates(scopeKey, shopId);
      res.json({ ok: true, templates, shopId, scope: editor ? "editor" : "route" });
    } catch (error) {
      handleScopeError(res, error);
    }
  });

  app.get("/api/enterprise/extension/cs/faq/languages", enterpriseAuthMiddleware, (_req, res) => {
    res.json({ ok: true, ...listLanguagesForApi() });
  });

  app.get("/api/enterprise/extension/cs/faq/template.csv", enterpriseAuthMiddleware, (_req, res) => {
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="enterprise-faq-template.csv"');
    res.send(`\uFEFF${FAQ_IMPORT_SAMPLE_CSV}`);
  });

  app.post("/api/enterprise/extension/cs/faq", enterpriseAuthMiddleware, (req, res) => {
    try {
      const { shopId, scopeKey } = shopScopeFromRequest(req);
      const { template } = req.body || {};
      if (!template?.text?.trim()) return res.status(400).json({ error: "请填写回复内容。" });
      const row = upsertCsFaqTemplate(scopeKey, shopId, template);
      res.json({ ok: true, template: row });
    } catch (error) {
      handleScopeError(res, error);
    }
  });

  app.delete("/api/enterprise/extension/cs/faq/:id", enterpriseAuthMiddleware, (req, res) => {
    try {
      const { scopeKey } = shopScopeFromRequest(req);
      const ok = deleteCsFaqTemplate(scopeKey, req.params.id);
      if (!ok) return res.status(404).json({ error: "模板不存在。" });
      res.json({ ok: true });
    } catch (error) {
      handleScopeError(res, error);
    }
  });

  app.post(
    "/api/enterprise/extension/cs/faq/import",
    enterpriseAuthMiddleware,
    asyncHandler(async (req, res) => {
      try {
        const { shopId, scopeKey } = shopScopeFromRequest(req);
        const { mode, csv, templates, payload } = req.body || {};
        const parsed = parseFaqImportPayload(templates || payload || csv || "");
        if (!parsed.length) return res.status(400).json({ error: "未能解析任何 FAQ 行。" });
        const rows = await withDbLock(async () =>
          importCsFaqTemplates(scopeKey, shopId, parsed, { mode: mode === "replace" ? "replace" : "merge" }),
        );
        res.json({ ok: true, count: rows.length, templates: rows });
      } catch (error) {
        handleScopeError(res, error);
      }
    }),
  );

  app.get("/api/enterprise/extension/cs/faq/context", enterpriseAuthMiddleware, (req, res) => {
    try {
      const { orgId, shopId, shop } = shopScopeFromRequest(req);
      const merged = getMergedEnterpriseExtensionContext(orgId, shopId, shop.platform || "tiktok", 12);
      const ctx = buildFaqShopContext({ mergedContext: merged, shopName: shop.shopName || "" });
      res.json({
        ok: true,
        shopId,
        ready: ctx.ready,
        shopName: ctx.shopName,
        primaryLang: ctx.primaryLang,
        pageTypes: ctx.pageTypes,
        snapshotCount: ctx.snapshotCount,
        latestAt: ctx.latestAt,
        hints: ctx.hints,
      });
    } catch (error) {
      handleScopeError(res, error);
    }
  });

  app.post(
    "/api/enterprise/extension/cs/faq/generate",
    enterpriseAuthMiddleware,
    asyncHandler(async (req, res) => {
      try {
        const { orgId, shopId, shop } = shopScopeFromRequest(req);
        const { primaryLang, pages, useSnapshots = true } = req.body || {};
        const merged =
          useSnapshots !== false
            ? getMergedEnterpriseExtensionContext(orgId, shopId, shop.platform || "tiktok", 12)
            : null;
        const result = await generateFaqDrafts({
          mergedContext: merged,
          inlinePages: Array.isArray(pages) ? pages : [],
          shopName: shop.shopName || "",
          primaryLang: primaryLang || undefined,
        });
        if (!result.ok) return res.status(400).json({ error: result.error, contextSummary: result.contextSummary });
        res.json({
          ok: true,
          drafts: result.drafts,
          contextSummary: result.contextSummary,
          warnings: result.warnings,
          modelUsed: result.modelUsed,
        });
      } catch (error) {
        handleScopeError(res, error);
      }
    }),
  );

  app.post("/api/enterprise/extension/cs/faq/generate/apply", enterpriseAuthMiddleware, asyncHandler(async (req, res) => {
    try {
      const { shopId, scopeKey } = shopScopeFromRequest(req);
      const { templates } = req.body || {};
      const list = (templates || [])
        .filter((t) => t?.text?.trim())
        .map((t) => ({ name: t.name, text: t.text, triggers: t.triggers, category: t.category, lang: t.lang }));
      if (!list.length) return res.status(400).json({ error: "请至少选择一条有效 FAQ 草稿。" });
      const rows = await withDbLock(async () => importCsFaqTemplates(scopeKey, shopId, list, { mode: "merge" }));
      res.json({ ok: true, count: rows.length, templates: rows });
    } catch (error) {
      handleScopeError(res, error);
    }
  }));

  app.post("/api/enterprise/extension/cs/route", enterpriseAuthMiddleware, validateBody(validators.csBuyerText), asyncHandler(async (req, res) => {
    try {
      const { orgId, shopId, shop, scopeKey } = shopScopeFromRequest(req);
      const { buyerText, orderContext, faqTemplates, syncFaq, dryRun } = req.body || {};
      if (syncFaq !== false && Array.isArray(faqTemplates) && faqTemplates.length) {
        try {
          syncCsFaqTemplates(scopeKey, shopId, faqTemplates);
        } catch {
          /* non-fatal */
        }
      }
      let ctxText = String(orderContext || "").slice(0, 2000);
      const merged = getMergedEnterpriseExtensionContext(orgId, shopId, shop.platform || "tiktok", 12);
      if (!ctxText && merged) ctxText = JSON.stringify(merged).slice(0, 2000);

      const routed = await routeBuyerMessage({
        buyerText: String(buyerText).trim(),
        userId: scopeKey,
        shopKey: shopId,
        shopName: shop.shopName || "",
        channel: dryRun ? "enterprise_drill" : "enterprise_extension",
        orderContext: ctxText,
        mergedContext: merged,
        faqTemplates: faqTemplates?.length ? faqTemplates : listCsFaqTemplates(scopeKey, shopId),
        settings: getCsSettings(scopeKey),
        planAllowsAutoSend: true,
      });

      if (!dryRun || req.body?.logSession !== false) {
        recordCsRouteEvent({
          userId: scopeKey,
          shopKey: shopId,
          channel: dryRun ? "enterprise_drill" : "enterprise_extension",
          tier: routed.tier,
          action: routed.action,
          lang: routed.lang,
          faqHit: routed.tier === "faq" && routed.faqMatch?.source === "user_template",
          dryRun: Boolean(dryRun),
          logSession: dryRun ? req.body?.logSession !== false : true,
          buyerText,
          replyText: routed.replyText,
          reason: routed.reason,
          faqName: routed.faqMatch?.name,
        });
      }

      res.json({
        ok: routed.ok !== false,
        routed,
        text: routed.replyText || "",
        action: routed.action,
        tier: routed.tier,
        dryRun: Boolean(dryRun),
      });
    } catch (error) {
      handleScopeError(res, error);
    }
  }));

  app.get("/api/enterprise/extension/cs/alerts", enterpriseAuthMiddleware, (req, res) => {
    try {
      const { scopeKey } = shopScopeFromRequest(req);
      const unreadOnly = req.query.unread === "1";
      const alerts = listCsSellerAlerts(scopeKey, { unreadOnly, limit: 30 });
      res.json({ ok: true, alerts });
    } catch (error) {
      handleScopeError(res, error);
    }
  });

  app.post("/api/enterprise/extension/cs/alerts/:id/read", enterpriseAuthMiddleware, (req, res) => {
    try {
      const { scopeKey } = shopScopeFromRequest(req);
      const alert = markCsAlertRead(scopeKey, req.params.id);
      res.json({ ok: true, alert });
    } catch (error) {
      handleScopeError(res, error);
    }
  });

  app.get("/api/enterprise/extension/cs/analytics", enterpriseAuthMiddleware, (req, res) => {
    try {
      const { scopeKey } = shopScopeFromRequest(req);
      const days = Math.min(90, Math.max(7, Number(req.query.days) || 30));
      res.json({ ok: true, analytics: getCsAnalyticsSummary(scopeKey, { days }) });
    } catch (error) {
      handleScopeError(res, error);
    }
  });

  app.get("/api/enterprise/extension/cs/sessions", enterpriseAuthMiddleware, (req, res) => {
    try {
      const { shopId, scopeKey } = shopScopeFromRequest(req);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
      const includeDrill = req.query.includeDrill !== "0";
      const sessions = listCsSessionEvents(scopeKey, { limit, shopKey: shopId, includeDrill });
      res.json({ ok: true, sessions });
    } catch (error) {
      handleScopeError(res, error);
    }
  });

  app.get("/api/enterprise/extension/cs/settings", enterpriseAuthMiddleware, (req, res) => {
    try {
      const { scopeKey } = shopScopeFromRequest(req);
      res.json({ ok: true, settings: getCsSettings(scopeKey) });
    } catch (error) {
      handleScopeError(res, error);
    }
  });

  app.post("/api/enterprise/extension/cs/settings", enterpriseAuthMiddleware, asyncHandler(async (req, res) => {
    try {
      const { shopId, scopeKey, orgId } = shopScopeFromRequest(req);
      const partial = { ...(req.body || {}) };
      if (partial.nightAiEnabled === true) {
        const merged = getMergedEnterpriseExtensionContext(orgId, shopId, "tiktok", 20);
        const assessment = await assessNightReadiness(scopeKey, shopId, merged);
        if (!assessment.canEnableNightAi) {
          return res.status(400).json({ error: assessment.message || "暂不能开启夜间自动回复。", readiness: assessment });
        }
        const current = getCsSettings(scopeKey);
        partial.nightReadinessByShop = { ...(current.nightReadinessByShop || {}), [shopId]: assessment };
      }
      delete partial.nightReadinessShopKey;
      delete partial.shopKey;
      delete partial.shopId;
      const settings = saveCsSettings(scopeKey, partial);
      res.json({ ok: true, settings });
    } catch (error) {
      handleScopeError(res, error);
    }
  }));

  app.get("/api/enterprise/extension/cs/readiness", enterpriseAuthMiddleware, asyncHandler(async (req, res) => {
    try {
      const { orgId, shopId, scopeKey } = shopScopeFromRequest(req);
      const merged = getMergedEnterpriseExtensionContext(orgId, shopId, "tiktok", 20);
      const readiness = await assessNightReadiness(scopeKey, shopId, merged);
      res.json({ ok: true, readiness });
    } catch (error) {
      handleScopeError(res, error);
    }
  }));

  app.post("/api/enterprise/extension/cs/readiness/assess", enterpriseAuthMiddleware, asyncHandler(async (req, res) => {
    try {
      const { orgId, shopId, scopeKey } = shopScopeFromRequest(req);
      const merged = getMergedEnterpriseExtensionContext(orgId, shopId, "tiktok", 20);
      const readiness = await assessNightReadiness(scopeKey, shopId, merged);
      const current = getCsSettings(scopeKey);
      saveCsSettings(scopeKey, {
        nightReadinessByShop: { ...(current.nightReadinessByShop || {}), [shopId]: readiness },
      });
      res.json({ ok: true, readiness });
    } catch (error) {
      handleScopeError(res, error);
    }
  }));

  // 企业 Agent（Listing 等内容生成，不走凡梦 /api/agents/run）
  app.post("/api/enterprise/agents/run", enterpriseAuthMiddleware, validateBody(validators.agentRun), async (req, res) => {
    try {
      if (!apiKey) return res.status(400).json({ error: `还没有配置 ${providerName} API Key。` });
      const { agentId, input } = req.body || {};
      if (!agentSkills[agentId]) return res.status(400).json({ error: "未知 Agent。" });
      const enrichedInput = String(input || "").trim();
      if (!enrichedInput) return res.status(400).json({ error: "请填写输入。" });

      const { response, data } = await callChatCompletions({
        model,
        temperature: 0.45,
        max_tokens: 4096,
        messages: buildAgentMessages(agentId, enrichedInput),
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: data?.error?.message || "模型调用失败。" });
      }

      const answer = data?.choices?.[0]?.message?.content || "";
      res.json({ ok: true, agentId, answer, provider: providerName, model });
    } catch (error) {
      handleScopeError(res, error);
    }
  });
}
