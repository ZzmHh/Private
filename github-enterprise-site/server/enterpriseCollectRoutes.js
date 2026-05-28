/**
 * 企业站 · 采集箱 + 发布任务 API
 * /api/enterprise/collect/* · /api/enterprise/publish/*
 */
import { asyncHandler } from "./middleware/asyncHandler.js";
import { shopScopeFromRequest } from "./enterpriseScope.js";
import { buildAgentMessages } from "./agentSkills.js";
import {
  orgIdFromUser,
  listCollectItems,
  getCollectItem,
  createCollectItem,
  updateCollectItem,
  deleteCollectItem,
  listPublishJobs,
  getPublishJob,
  createPublishJob,
  updatePublishJob,
} from "./enterpriseCollectStore.js";

function enterprisePipelineCors(app) {
  for (const prefix of ["/api/enterprise/collect", "/api/enterprise/publish"]) {
    app.use(prefix, (req, res, next) => {
      const origin = req.headers.origin;
      if (
        origin &&
        (origin.startsWith("chrome-extension://") ||
          origin.startsWith("http://127.0.0.1") ||
          origin.startsWith("http://localhost"))
      ) {
        res.header("Access-Control-Allow-Origin", origin);
        res.header("Access-Control-Allow-Headers", "Authorization, Content-Type");
        res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
      }
      if (req.method === "OPTIONS") return res.sendStatus(204);
      next();
    });
  }
}

function handleError(res, error) {
  res.status(error.status || 500).json({ error: error.message || "请求失败。" });
}

/** @param {string} answer */
function parseListingFromLlm(answer) {
  const text = String(answer || "").trim();
  const titleMatch = text.match(/(?:标题|Title)[：:]\s*(.+)/i);
  const bullets = [];
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*[-*•\d]+[.)]\s*(.+)/);
    if (m) bullets.push(m[1].trim());
  }
  const kwMatch = text.match(/(?:关键词|Keywords)[：:]\s*(.+)/i);
  const catMatch = text.match(/(?:类目|Category)[：:]\s*(.+)/i);
  return {
    title: titleMatch?.[1]?.trim() || text.split("\n")[0]?.slice(0, 200) || "",
    bullets: bullets.length ? bullets.slice(0, 8) : text.split("\n").filter(Boolean).slice(1, 6),
    keywords: kwMatch?.[1]?.trim() || "",
    categoryHint: catMatch?.[1]?.trim() || "",
    description: text,
    raw: text,
  };
}

/**
 * @param {import("express").Express} app
 * @param {{ enterpriseAuthMiddleware: Function, apiKey: string, providerName: string, model: string, callChatCompletions: Function }} deps
 */
export function registerEnterpriseCollectRoutes(app, deps) {
  const { enterpriseAuthMiddleware, apiKey, providerName, model, callChatCompletions } = deps;
  enterprisePipelineCors(app);

  app.get("/api/enterprise/collect/items", enterpriseAuthMiddleware, (req, res) => {
    try {
      const orgId = orgIdFromUser(req.user);
      const items = listCollectItems(orgId, {
        status: req.query.status ? String(req.query.status) : undefined,
        sourcePlatform: req.query.sourcePlatform ? String(req.query.sourcePlatform) : undefined,
        limit: Number(req.query.limit) || 100,
      });
      res.json({ ok: true, items });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/enterprise/collect/items/:id", enterpriseAuthMiddleware, (req, res) => {
    try {
      const orgId = orgIdFromUser(req.user);
      const item = getCollectItem(orgId, req.params.id);
      if (!item) return res.status(404).json({ error: "采集项不存在。" });
      res.json({ ok: true, item });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/enterprise/collect/items", enterpriseAuthMiddleware, (req, res) => {
    try {
      const orgId = orgIdFromUser(req.user);
      const body = req.body || {};
      const sourceUrl = String(body.sourceUrl || "").trim();
      if (!sourceUrl && !body.title) {
        return res.status(400).json({ error: "请提供 sourceUrl 或 title。" });
      }
      const item = createCollectItem(orgId, body, req.user.id);
      res.json({ ok: true, item });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/enterprise/collect/from-extension", enterpriseAuthMiddleware, (req, res) => {
    try {
      const orgId = orgIdFromUser(req.user);
      const body = req.body || {};
      const pageUrl = String(body.pageUrl || body.sourceUrl || "").trim();
      if (!pageUrl) return res.status(400).json({ error: "缺少 pageUrl。" });
      const platform = /1688\.com/i.test(pageUrl)
        ? "1688"
        : /taobao\.com/i.test(pageUrl)
          ? "taobao"
          : /yangkeduo|pinduoduo/i.test(pageUrl)
            ? "pdd"
            : String(body.sourcePlatform || "manual");

      const item = createCollectItem(
        orgId,
        {
          sourcePlatform: platform,
          sourceUrl: pageUrl,
          title: body.title || documentTitleFromPayload(body),
          priceCny: body.priceCny,
          moq: body.moq,
          shipFrom: body.shipFrom,
          images: body.images,
          raw: body.data || body.raw || body,
        },
        req.user.id,
      );
      res.json({ ok: true, item });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.patch("/api/enterprise/collect/items/:id", enterpriseAuthMiddleware, (req, res) => {
    try {
      const orgId = orgIdFromUser(req.user);
      const item = updateCollectItem(orgId, req.params.id, req.body || {});
      if (!item) return res.status(404).json({ error: "采集项不存在。" });
      res.json({ ok: true, item });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.delete("/api/enterprise/collect/items/:id", enterpriseAuthMiddleware, (req, res) => {
    try {
      const orgId = orgIdFromUser(req.user);
      if (!deleteCollectItem(orgId, req.params.id)) {
        return res.status(404).json({ error: "采集项不存在。" });
      }
      res.json({ ok: true });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post(
    "/api/enterprise/collect/items/:id/generate-listing",
    enterpriseAuthMiddleware,
    asyncHandler(async (req, res) => {
      const orgId = orgIdFromUser(req.user);
      const item = getCollectItem(orgId, req.params.id);
      if (!item) return res.status(404).json({ error: "采集项不存在。" });
      if (!apiKey) return res.status(400).json({ error: `还没有配置 ${providerName} API Key。` });

      const { market, language, titleStrategy } = req.body || {};
      const prompt = [
        `货源平台：${item.sourcePlatform}`,
        `货源链接：${item.sourceUrl}`,
        `原标题：${item.title}`,
        item.priceCny != null ? `批发价：¥${item.priceCny}` : "",
        item.opportunityNotes ? `备注：${item.opportunityNotes}` : "",
        market ? `目标市场：${market}` : "",
        language ? `文案语言：${language}` : "泰语+英语",
        titleStrategy ? `标题策略：${titleStrategy}` : "",
        "",
        "请输出：标题、5条卖点 bullet、关键词、类目建议。",
      ]
        .filter(Boolean)
        .join("\n");

      const { response, data } = await callChatCompletions({
        model,
        temperature: 0.45,
        max_tokens: 4096,
        messages: buildAgentMessages("listing", prompt),
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: data?.error?.message || "Listing 生成失败。" });
      }

      const answer = data?.choices?.[0]?.message?.content || "";
      const listing = parseListingFromLlm(answer);
      const updated = updateCollectItem(orgId, item.id, { listing, status: "listed" });
      res.json({ ok: true, item: updated, answer, listing, provider: providerName, model });
    }),
  );

  app.get("/api/enterprise/publish/jobs", enterpriseAuthMiddleware, (req, res) => {
    try {
      const orgId = orgIdFromUser(req.user);
      const shopId = String(req.query.shopId || "").trim();
      const jobs = listPublishJobs(orgId, shopId, {
        status: req.query.status ? String(req.query.status) : undefined,
        limit: Number(req.query.limit) || 50,
      });
      res.json({ ok: true, jobs });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/enterprise/publish/jobs/:id", enterpriseAuthMiddleware, (req, res) => {
    try {
      const orgId = orgIdFromUser(req.user);
      const job = getPublishJob(orgId, req.params.id);
      if (!job) return res.status(404).json({ error: "发布任务不存在。" });
      res.json({ ok: true, job });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/enterprise/publish/jobs/:id/fill-pack", enterpriseAuthMiddleware, (req, res) => {
    try {
      const orgId = orgIdFromUser(req.user);
      const job = getPublishJob(orgId, req.params.id);
      if (!job) return res.status(404).json({ error: "发布任务不存在。" });
      res.json({ ok: true, fillPack: job.fillPack || {}, jobId: job.id, title: job.title });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/enterprise/publish/jobs", enterpriseAuthMiddleware, (req, res) => {
    try {
      const { orgId, shopId, shop } = shopScopeFromRequest(req);
      const body = req.body || {};
      const collectItemId = String(body.collectItemId || "").trim();
      let payload = { ...body, shopId };

      if (collectItemId) {
        const item = getCollectItem(orgId, collectItemId);
        if (!item) return res.status(404).json({ error: "采集项不存在。" });
        payload = {
          collectItemId,
          title: body.title || item.listing?.title || item.title,
          listing: body.listing || item.listing,
          sourceUrl: item.sourceUrl,
          sourcePriceCny: item.priceCny,
          salePrice: body.salePrice,
          stock: body.stock,
          fulfillment: body.fulfillment,
          currency: body.currency || (shop.market === "TH" ? "THB" : "USD"),
        };
      }

      const job = createPublishJob(orgId, shopId, payload, req.user.id);
      if (collectItemId) {
        updateCollectItem(orgId, collectItemId, { status: "publishing" });
      }
      res.json({ ok: true, job });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.patch("/api/enterprise/publish/jobs/:id", enterpriseAuthMiddleware, (req, res) => {
    try {
      const orgId = orgIdFromUser(req.user);
      const body = req.body || {};
      const allowed = {};
      for (const key of ["status", "platformProductId", "error", "salePrice", "stock", "listing"]) {
        if (body[key] !== undefined) allowed[key] = body[key];
      }
      const job = updatePublishJob(orgId, req.params.id, allowed);
      if (!job) return res.status(404).json({ error: "发布任务不存在。" });
      if (job.collectItemId && job.status === "published") {
        updateCollectItem(orgId, job.collectItemId, { status: "published" });
      }
      res.json({ ok: true, job });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/enterprise/publish/jobs/:id/mark-filled", enterpriseAuthMiddleware, (req, res) => {
    try {
      const orgId = orgIdFromUser(req.user);
      const job = updatePublishJob(orgId, req.params.id, { status: "filled" });
      if (!job) return res.status(404).json({ error: "发布任务不存在。" });
      res.json({ ok: true, job });
    } catch (error) {
      handleError(res, error);
    }
  });
}

/** @param {object} body */
function documentTitleFromPayload(body) {
  if (body.title) return String(body.title);
  const data = body.data || body.raw;
  if (data && typeof data === "object" && data.title) return String(data.title);
  return "未命名商品";
}
