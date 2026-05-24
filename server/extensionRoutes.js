/**
 * 凡梦 AI Chrome 插件 API
 */
import { agentSkills, buildAgentMessages } from "./agentSkills.js";
import { generateBuyerReplyText } from "./autoReply/generateBuyerReply.js";
import { routeBuyerMessage } from "./autoReply/routeBuyerMessage.js";
import { assessNightReadiness } from "./autoReply/assessNightReadiness.js";
import { listLanguagesForApi } from "../shared/tiktokShopLanguages.js";
import { getCsAnalyticsSummary, recordCsRouteEvent } from "./autoReply/csAnalytics.js";
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
import {
  ensureFeatureAccess,
  finalizeUsageLog,
  getPlan,
  incrementUsage,
  saveTask,
  sanitizeUser,
} from "./db.js";
import {
  listExtensionSnapshots,
  saveExtensionSnapshot,
  getMergedExtensionContext,
  listExtensionShops,
} from "./extensionSync.js";
import { getStoreMetricsAgentContext } from "./storeMetrics/store.js";
import { buildExtensionWorkspaceSummary } from "./extensionWorkspace.js";
import { validateBody, validators } from "./validate/index.js";
import { asyncHandler } from "./middleware/asyncHandler.js";

function extensionBillingUrl() {
  const base = process.env.APP_PUBLIC_URL?.trim().replace(/\/+$/, "");
  return base ? `${base}/#subscription` : null;
}

function extensionEntitlements(rawUser) {
  const user = sanitizeUser(rawUser);
  let extensionAllowed = true;
  let extensionBlockReason = "";
  try {
    ensureFeatureAccess(rawUser, "storeApiAgents");
  } catch (error) {
    extensionAllowed = false;
    extensionBlockReason = error.message || "当前套餐不支持 TikTok 插件。";
  }
  return {
    accessActive: Boolean(user.accessActive),
    plan: user.plan,
    effectivePlanId: user.effectivePlanId,
    planName: user.planName,
    trialActive: Boolean(user.trialActive),
    proTrialActive: Boolean(user.proTrialActive),
    subscriptionActive: Boolean(user.subscriptionActive),
    storeApiAgents: Boolean(user.planFeatures?.storeApiAgents),
    extensionAutoSend: Boolean(user.planFeatures?.extensionAutoSend),
    csvImport: Boolean(user.planFeatures?.csvImport),
    extensionAllowed,
    extensionBlockReason,
    trialQuota: user.trialQuota || null,
    earlyBird: user.earlyBird || null,
  };
}

/**
 * @param {import("express").Express} app
 * @param {{ authMiddleware: Function, apiKey: string, providerName: string, model: string, callChatCompletions: Function }} deps
 */
export function registerExtensionRoutes(app, { authMiddleware, apiKey, providerName, model, callChatCompletions }) {
  app.use("/api/extension", (req, res, next) => {
    const origin = req.headers.origin;
    if (origin && (origin.startsWith("chrome-extension://") || origin.startsWith("http://127.0.0.1") || origin.startsWith("http://localhost"))) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header("Access-Control-Allow-Headers", "Authorization, Content-Type");
      res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    }
    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }
    next();
  });

  app.get("/api/extension/status", authMiddleware, (req, res) => {
    const platform = String(req.query.platform || "tiktok").toLowerCase();
    const shopKey = String(req.query.shopKey || "").trim();
    let snaps = listExtensionSnapshots(req.user.id, platform, 20);
    if (shopKey) snaps = snaps.filter((s) => s.shopKey === shopKey);
    const user = sanitizeUser(req.user);
    res.json({
      ok: true,
      user: { email: user.email, name: user.name },
      entitlements: extensionEntitlements(req.user),
      billingUrl: extensionBillingUrl(),
      platform,
      shopKey: shopKey || null,
      snapshotCount: snaps.length,
      latestAt: snaps[0]?.pulledAt || null,
      pageTypes: [...new Set(snaps.map((s) => s.pageType))],
    });
  });

  app.get("/api/extension/workspace-summary", authMiddleware, (req, res) => {
    try {
      const platform = String(req.query.platform || "tiktok").toLowerCase();
      res.json({ ok: true, summary: buildExtensionWorkspaceSummary(req.user.id, platform) });
    } catch (error) {
      res.status(500).json({ error: error.message || "读取工作台摘要失败。" });
    }
  });

  app.get("/api/extension/cs/shops", authMiddleware, (req, res) => {
    try {
      ensureFeatureAccess(req.user, "storeApiAgents");
      const platform = String(req.query.platform || "tiktok").toLowerCase();
      const shops = listExtensionShops(req.user.id, platform);
      res.json({ ok: true, shops });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message || "读取店铺列表失败。" });
    }
  });

  app.get("/api/extension/cs/faq", authMiddleware, (req, res) => {
    try {
      ensureFeatureAccess(req.user, "storeApiAgents");
      const shopKey = String(req.query.shopKey || "");
      const editor = req.query.editor === "1" || req.query.editor === "true";
      const templates = editor
        ? listCsFaqTemplatesForEditor(req.user.id, shopKey)
        : listCsFaqTemplates(req.user.id, shopKey);
      res.json({ ok: true, templates, shopKey, scope: editor ? "editor" : "route" });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message || "读取 FAQ 失败。" });
    }
  });

  app.get("/api/extension/cs/faq/languages", authMiddleware, (_req, res) => {
    res.json({ ok: true, ...listLanguagesForApi() });
  });

  app.get("/api/extension/cs/faq/template.csv", authMiddleware, (_req, res) => {
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="fanmeng-faq-template.csv"');
    res.send(`\uFEFF${FAQ_IMPORT_SAMPLE_CSV}`);
  });

  app.post("/api/extension/cs/faq", authMiddleware, (req, res) => {
    try {
      ensureFeatureAccess(req.user, "storeApiAgents");
      const { shopKey, template } = req.body || {};
      if (!template?.text?.trim()) {
        return res.status(400).json({ error: "请填写回复内容。" });
      }
      const row = upsertCsFaqTemplate(req.user.id, String(shopKey || ""), template);
      res.json({ ok: true, template: row });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message || "保存 FAQ 失败。" });
    }
  });

  app.delete("/api/extension/cs/faq/:id", authMiddleware, (req, res) => {
    try {
      ensureFeatureAccess(req.user, "storeApiAgents");
      const ok = deleteCsFaqTemplate(req.user.id, req.params.id);
      if (!ok) return res.status(404).json({ error: "模板不存在。" });
      res.json({ ok: true });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message || "删除 FAQ 失败。" });
    }
  });

  app.post("/api/extension/cs/faq/import", authMiddleware, asyncHandler(async (req, res) => {
    try {
      ensureFeatureAccess(req.user, "storeApiAgents");
      const { shopKey, mode, csv, templates, payload } = req.body || {};
      const parsed = parseFaqImportPayload(templates || payload || csv || "");
      if (!parsed.length) {
        return res.status(400).json({ error: "未能解析任何 FAQ 行，请检查 CSV/JSON 格式。" });
      }
      const rows = await withDbLock(async () =>
        importCsFaqTemplates(req.user.id, String(shopKey || ""), parsed, {
          mode: mode === "replace" ? "replace" : "merge",
        }),
      );
      res.json({ ok: true, count: rows.length, templates: rows });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message || "导入 FAQ 失败。" });
    }
  }));

  app.get("/api/extension/cs/faq/context", authMiddleware, (req, res) => {
    try {
      ensureFeatureAccess(req.user, "storeApiAgents");
      const shopKey = String(req.query.shopKey || "").trim();
      const merged = getMergedExtensionContext(req.user.id, "tiktok", 12, shopKey || undefined);
      const ctx = buildFaqShopContext({ mergedContext: merged, shopName: req.query.shopName || "" });
      res.json({
        ok: true,
        shopKey,
        ready: ctx.ready,
        shopName: ctx.shopName,
        primaryLang: ctx.primaryLang,
        pageTypes: ctx.pageTypes,
        snapshotCount: ctx.snapshotCount,
        latestAt: ctx.latestAt,
        hints: ctx.hints,
      });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message || "读取 FAQ 素材失败。" });
    }
  });

  app.post("/api/extension/cs/faq/generate", authMiddleware, asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    let usage;
    try {
      ensureFeatureAccess(req.user, "storeApiAgents");
      ensureFeatureAccess(req.user, "agent", "service");
      const { shopKey, shopName, primaryLang, pages, useSnapshots = true } = req.body || {};
      const sk = String(shopKey || "").trim();

      const merged =
        useSnapshots !== false ? getMergedExtensionContext(req.user.id, "tiktok", 12, sk || undefined) : null;

      usage = incrementUsage(req.user.id, "service");
      const result = await generateFaqDrafts({
        mergedContext: merged,
        inlinePages: Array.isArray(pages) ? pages : [],
        shopName: shopName || merged?.pages?.[0]?.shopName || "",
        primaryLang: primaryLang || undefined,
      });

      if (usage?.logId) {
        finalizeUsageLog(usage.logId, {
          type: "service",
          status: result.ok ? "success" : "failed",
          inputLength: result.contextSummary?.snapshotCount || 0,
          outputLength: (result.drafts || []).length,
          startedAt,
          metadata: { action: "faq_generate", shopKey: sk, draftCount: (result.drafts || []).length },
        });
      }

      if (!result.ok) {
        return res.status(400).json({
          error: result.error,
          contextSummary: result.contextSummary,
          billingUrl: extensionBillingUrl(),
        });
      }

      res.json({
        ok: true,
        drafts: result.drafts,
        contextSummary: result.contextSummary,
        warnings: result.warnings,
        modelUsed: result.modelUsed,
      });
    } catch (error) {
      res.status(error.status || 500).json({
        error: error.message || "生成 FAQ 草稿失败。",
        billingUrl: extensionBillingUrl(),
      });
    }
  }));

  app.post("/api/extension/cs/faq/generate/apply", authMiddleware, asyncHandler(async (req, res) => {
    try {
      ensureFeatureAccess(req.user, "storeApiAgents");
      const { shopKey, templates } = req.body || {};
      const list = (templates || [])
        .filter((t) => t?.text?.trim())
        .map((t) => ({
          name: t.name,
          text: t.text,
          triggers: t.triggers,
          category: t.category,
          lang: t.lang,
        }));
      if (!list.length) {
        return res.status(400).json({ error: "请至少选择一条有效 FAQ 草稿。" });
      }
      const rows = await withDbLock(async () =>
        importCsFaqTemplates(req.user.id, String(shopKey || ""), list, { mode: "merge" }),
      );
      res.json({ ok: true, count: rows.length, templates: rows });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message || "启用 FAQ 草稿失败。" });
    }
  }));

  app.post("/api/extension/snapshot", authMiddleware, validateBody(validators.extensionSnapshot), (req, res) => {
    try {
      ensureFeatureAccess(req.user, "storeApiAgents");
      const { platform, pageType, pageUrl, title, data, shopKey, shopName } = req.body || {};
      const snapshot = saveExtensionSnapshot({
        userId: req.user.id,
        platform: platform || "tiktok",
        pageType: pageType || "unknown",
        pageUrl: pageUrl || "",
        title: title || "",
        shopKey: shopKey || "",
        shopName: shopName || "",
        data,
      });
      res.json({ ok: true, snapshot: { id: snapshot.id, pulledAt: snapshot.pulledAt, pageType: snapshot.pageType } });
    } catch (error) {
      res.status(error.status || 500).json({
        error: error.message || "快照保存失败。",
        code: error.code || "",
        billingUrl: extensionBillingUrl(),
      });
    }
  });

  app.post("/api/extension/cs/route", authMiddleware, validateBody(validators.csBuyerText), asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    let usage;
    try {
      ensureFeatureAccess(req.user, "agent", "service");
      ensureFeatureAccess(req.user, "storeApiAgents");
      const { buyerText, shopKey, shopName, orderContext, faqTemplates, syncFaq, dryRun } = req.body || {};

      const sk = String(shopKey || "").trim();
      if (syncFaq !== false && Array.isArray(faqTemplates) && faqTemplates.length) {
        syncCsFaqTemplates(req.user.id, sk, faqTemplates);
      }

      let ctxText = String(orderContext || "").slice(0, 2000);
      const merged = getMergedExtensionContext(req.user.id, "tiktok", 12, sk || undefined);
      if (!ctxText && merged) {
        ctxText = JSON.stringify(merged).slice(0, 2000);
      }

      usage = dryRun ? null : incrementUsage(req.user.id, "service");
      const routed = await routeBuyerMessage({
        buyerText: String(buyerText).trim(),
        userId: req.user.id,
        shopKey: sk,
        shopName: shopName || "",
        channel: "extension",
        orderContext: ctxText,
        mergedContext: merged,
        faqTemplates: faqTemplates?.length ? faqTemplates : listCsFaqTemplates(req.user.id, sk),
        settings: getCsSettings(req.user.id),
        planAllowsAutoSend: Boolean(getPlan(req.user).features.extensionAutoSend),
      });

      if (usage?.logId) {
        finalizeUsageLog(usage.logId, {
          type: "service",
          status: routed.ok !== false ? "success" : "failed",
          inputLength: String(buyerText).length,
          outputLength: (routed.replyText || "").length,
          startedAt,
          metadata: { tier: routed.tier, action: routed.action, dryRun: Boolean(dryRun) },
        });
      }

      if (!dryRun) {
        recordCsRouteEvent({
          userId: req.user.id,
          shopKey: sk,
          channel: "extension",
          tier: routed.tier,
          action: routed.action,
          lang: routed.lang,
          faqHit: routed.tier === "faq" && routed.faqMatch?.source === "user_template",
        });
      }

      res.json({
        ok: routed.ok !== false,
        routed,
        text: routed.replyText || "",
        action: routed.action,
        tier: routed.tier,
        notifySeller: routed.notifySeller,
        sellerMessage: routed.sellerMessage,
        reason: routed.reason,
        dryRun: Boolean(dryRun),
        usage: usage || null,
      });
    } catch (error) {
      if (usage?.logId) {
        finalizeUsageLog(usage.logId, { type: "service", status: "failed", error: error.message, startedAt });
      }
      res.status(error.status || 500).json({
        error: error.message || "客服路由失败。",
        billingUrl: extensionBillingUrl(),
        requestId: req.requestId,
      });
    }
  }));

  app.post("/api/extension/cs/suggest", authMiddleware, validateBody(validators.csBuyerText), asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    let usage;
    try {
      ensureFeatureAccess(req.user, "agent", "service");
      ensureFeatureAccess(req.user, "storeApiAgents");
      const { buyerText, shopName, shopKey, orderContext, useLegacy } = req.body || {};

      if (useLegacy !== true) {
        const sk = String(shopKey || "").trim();
        let ctxText = String(orderContext || "").slice(0, 2000);
        const merged = getMergedExtensionContext(req.user.id, "tiktok", 12, sk || undefined);
        if (!ctxText && merged) {
          ctxText = JSON.stringify(merged).slice(0, 2000);
        }
        usage = incrementUsage(req.user.id, "service");
        const routed = await routeBuyerMessage({
          buyerText: String(buyerText).trim(),
          userId: req.user.id,
          shopKey: sk,
          shopName: shopName || "",
          channel: "extension",
          orderContext: ctxText,
          mergedContext: merged,
          settings: getCsSettings(req.user.id),
          planAllowsAutoSend: Boolean(getPlan(req.user).features.extensionAutoSend),
        });
        finalizeUsageLog(usage.logId, {
          type: "service",
          status: "success",
          inputLength: String(buyerText).length,
          outputLength: (routed.replyText || "").length,
          startedAt,
          metadata: { tier: routed.tier, action: routed.action },
        });
        recordCsRouteEvent({
          userId: req.user.id,
          shopKey: sk,
          channel: "extension",
          tier: routed.tier,
          action: routed.action,
          lang: routed.lang,
          faqHit: routed.tier === "faq" && routed.faqMatch?.source === "user_template",
        });
        return res.json({
          ok: true,
          text: routed.replyText || "",
          routed,
          mode: routed.action === "auto_send" ? "auto-send-candidate" : "buyer-visible-draft",
          hint: routed.reason || "请人工核对后再发送。",
          usage,
        });
      }

      usage = incrementUsage(req.user.id, "service");
      const merged = [
        String(buyerText).trim(),
        orderContext ? `\n\n【页面上下文（插件提供，未核实）】\n${String(orderContext).slice(0, 1500)}` : "",
      ].join("");

      const result = await generateBuyerReplyText({
        buyerText: merged,
        shopName: shopName || "",
        platform: "TikTok Shop",
      });

      if (!result.ok) {
        finalizeUsageLog(usage.logId, { type: "service", status: "failed", error: result.error, startedAt });
        return res.status(500).json({ error: result.error });
      }

      finalizeUsageLog(usage.logId, {
        type: "service",
        status: "success",
        inputLength: merged.length,
        outputLength: result.text.length,
        startedAt,
      });

      res.json({
        ok: true,
        text: result.text,
        mode: "buyer-visible-draft",
        hint: "请人工核对后再发送；复杂问题为草稿，FAQ/夜间/售后安抚会尝试自动发送。",
        usage,
      });
    } catch (error) {
      if (usage?.logId) {
        finalizeUsageLog(usage.logId, { type: "service", status: "failed", error: error.message, startedAt });
      }
      res.status(error.status || 500).json({
        error: error.message || "话术生成失败。",
        code: error.code || "",
        billingUrl: extensionBillingUrl(),
        requestId: req.requestId,
      });
    }
  }));

  app.post("/api/extension/cs/faq/sync", authMiddleware, (req, res) => {
    try {
      ensureFeatureAccess(req.user, "storeApiAgents");
      const { shopKey, templates } = req.body || {};
      const rows = syncCsFaqTemplates(req.user.id, String(shopKey || ""), templates || []);
      res.json({ ok: true, count: rows.length, templates: rows });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message || "FAQ 同步失败。" });
    }
  });

  app.get("/api/extension/cs/alerts", authMiddleware, (req, res) => {
    try {
      ensureFeatureAccess(req.user, "storeApiAgents");
      const unreadOnly = req.query.unread === "1";
      const alerts = listCsSellerAlerts(req.user.id, { unreadOnly, limit: 30 });
      res.json({ ok: true, alerts });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message || "读取告警失败。" });
    }
  });

  app.post("/api/extension/cs/alerts/:id/read", authMiddleware, (req, res) => {
    try {
      const alert = markCsAlertRead(req.user.id, req.params.id);
      res.json({ ok: true, alert });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message || "更新失败。" });
    }
  });

  app.get("/api/extension/cs/analytics", authMiddleware, (req, res) => {
    try {
      ensureFeatureAccess(req.user, "storeApiAgents");
      const days = Math.min(90, Math.max(7, Number(req.query.days) || 30));
      res.json({ ok: true, analytics: getCsAnalyticsSummary(req.user.id, { days }) });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message || "读取客服数据失败。" });
    }
  });

  app.get("/api/extension/cs/settings", authMiddleware, (req, res) => {
    try {
      ensureFeatureAccess(req.user, "storeApiAgents");
      res.json({ ok: true, settings: getCsSettings(req.user.id) });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message || "读取设置失败。" });
    }
  });

  app.post("/api/extension/cs/settings", authMiddleware, asyncHandler(async (req, res) => {
    try {
      ensureFeatureAccess(req.user, "storeApiAgents");
      const partial = { ...(req.body || {}) };
      const shopKey = String(partial.nightReadinessShopKey || partial.shopKey || "").trim();

      if (partial.nightAiEnabled === true) {
        const assessment = await assessNightReadiness(req.user.id, shopKey);
        if (!assessment.canEnableNightAi) {
          return res.status(400).json({
            error: assessment.message || "商品资料或 AI 评估未通过，暂不能开启夜间自动回复。",
            readiness: assessment,
          });
        }
        const current = getCsSettings(req.user.id);
        partial.nightReadinessByShop = {
          ...(current.nightReadinessByShop || {}),
          [shopKey || "_default"]: assessment,
        };
      }

      delete partial.nightReadinessShopKey;
      delete partial.shopKey;

      const settings = saveCsSettings(req.user.id, partial);
      res.json({ ok: true, settings });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message || "保存设置失败。" });
    }
  }));

  app.get("/api/extension/cs/readiness", authMiddleware, asyncHandler(async (req, res) => {
    try {
      ensureFeatureAccess(req.user, "storeApiAgents");
      const shopKey = String(req.query.shopKey || "").trim();
      const readiness = await assessNightReadiness(req.user.id, shopKey);
      res.json({ ok: true, readiness });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message || "读取就绪状态失败。" });
    }
  }));

  app.post("/api/extension/cs/readiness/assess", authMiddleware, asyncHandler(async (req, res) => {
    try {
      ensureFeatureAccess(req.user, "storeApiAgents");
      const shopKey = String(req.body?.shopKey || "").trim();
      const readiness = await assessNightReadiness(req.user.id, shopKey);
      const current = getCsSettings(req.user.id);
      saveCsSettings(req.user.id, {
        nightReadinessByShop: {
          ...(current.nightReadinessByShop || {}),
          [shopKey || "_default"]: readiness,
        },
      });
      res.json({ ok: true, readiness });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message || "AI 评估失败。" });
    }
  }));

  app.post("/api/extension/analyze", authMiddleware, async (req, res) => {
    const startedAt = Date.now();
    let usage;
    try {
      const { agentId, input, platform, includeSnapshots } = req.body || {};
      const allowed = ["growth", "profit", "service"];
      if (!allowed.includes(agentId)) {
        return res.status(400).json({ error: `agentId 须为 ${allowed.join(" / ")} 之一。` });
      }
      if (!apiKey) {
        return res.status(400).json({ error: `还没有配置 ${providerName} API Key。` });
      }

      ensureFeatureAccess(req.user, "agent", agentId);
      ensureFeatureAccess(req.user, "storeApiAgents");

      usage = incrementUsage(req.user.id, agentId);
      const plat = String(platform || "tiktok").toLowerCase();
      const shopKey = String(req.body?.shopKey || "").trim();
      let enrichedInput = typeof input === "string" && input.trim()
        ? input.trim()
        : agentId === "growth"
          ? "基于浏览器插件同步的 TikTok Shop 后台页面数据，做店铺业绩诊断（连接版）：给出 P0/P1 行动与需补充字段。"
          : agentId === "profit"
            ? "基于浏览器插件同步的数据，做广告与库存/利润方向分析；缺 SKU 成本时列待导入字段。"
            : "基于插件提供的上下文，输出客服策略摘要。";

      if (includeSnapshots !== false) {
        const ctx = getMergedExtensionContext(req.user.id, plat, 8, shopKey || undefined);
        const metricsCtx = getStoreMetricsAgentContext(req.user.id, plat);
        const blocks = [];
        if (metricsCtx) {
          blocks.push(
            "## 多平台通用 CSV 经营数据（已解析 + 规则预计算）",
            JSON.stringify(metricsCtx, null, 2),
          );
        }
        if (ctx) {
          blocks.push(
            "## 浏览器插件同步的店铺页面快照（卖家已登录后台；非官方 API，可能不完整）",
            JSON.stringify(ctx, null, 2),
          );
        }
        if (blocks.length) {
          enrichedInput = [enrichedInput, "", ...blocks].join("\n");
        } else {
          enrichedInput = [
            enrichedInput,
            "",
            "## 店铺数据",
            "当前无 CSV 导入或插件快照。请导入通用 CSV 或在卖家中心点击插件「同步本页」。",
          ].join("\n");
        }
      }

      const { response, data, endpoint } = await callChatCompletions({
        model,
        temperature: 0.45,
        max_tokens: usage.maxTokens,
        messages: buildAgentMessages(agentId, enrichedInput),
      });

      if (!response.ok) {
        finalizeUsageLog(usage.logId, {
          type: agentId,
          status: "failed",
          inputLength: enrichedInput.length,
          outputLength: JSON.stringify(data).length,
          error: data?.error?.message || data?.message,
          startedAt,
        });
        return res.status(response.status).json({
          error: data?.error?.message || data?.message || "模型调用失败。",
          endpoint,
        });
      }

      const answer = data?.choices?.[0]?.message?.content || "模型没有返回内容。";
      finalizeUsageLog(usage.logId, {
        type: agentId,
        status: "success",
        inputLength: enrichedInput.length,
        outputLength: answer.length,
        model,
        startedAt,
      });

      const task = saveTask({
        userId: req.user.id,
        type: agentId,
        title: `插件 · ${agentSkills[agentId]?.name || agentId}`,
        input: enrichedInput,
        answer,
        metadata: { source: "extension", usage },
      });

      res.json({ ok: true, agentId, answer, task, usage });
    } catch (error) {
      if (usage?.logId) {
        finalizeUsageLog(usage.logId, { type: req.body?.agentId || "extension", status: "failed", error: error.message, startedAt });
      }
      res.status(error.status || 500).json({
        error: error.message || "分析失败。",
        code: error.code || "",
        billingUrl: extensionBillingUrl(),
      });
    }
  });
}
