import rateLimit from "express-rate-limit";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { recordProductEvent } from "../productEvents.js";
import { buildRoastMessages, parseRoastJson } from "../viralLead/roastPrompt.js";
import {
  checkRoastQuota,
  createViralReport,
  getViralReport,
  incrementViralReportViews,
  publishViralReport,
  sanitizeReportForPublic,
} from "../viralLead/store.js";

const viralRoastLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.VIRAL_ROAST_RATE_MAX || 8),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "请求太频繁，请稍后再试。", code: "RATE_LIMITED" },
  skip: (req) => req.method === "OPTIONS",
});

function clientIp(req) {
  return String(req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || "unknown").slice(0, 64);
}

function siteBase(req) {
  const env = process.env.APP_PUBLIC_URL?.trim().replace(/\/+$/, "");
  if (env) return env;
  const host = req.get("host");
  const proto = req.get("x-forwarded-proto") || req.protocol || "http";
  return host ? `${proto}://${host}` : "http://127.0.0.1:8787";
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * @param {import("express").Express} app
 * @param {{ callChatCompletions: Function, apiKey: string, providerName: string, model: string }} deps
 */
export function registerViralLeadRoutes(app, { callChatCompletions, apiKey, providerName, model }) {
  app.post(
    "/api/viral/roast",
    viralRoastLimiter,
    asyncHandler(async (req, res) => {
      const { title, bullets, platform } = req.body || {};
      const ip = clientIp(req);

      if (!String(title || "").trim() && !String(bullets || "").trim()) {
        return res.status(400).json({ error: "请至少填写商品标题或 Listing 描述。" });
      }

      const quota = checkRoastQuota(ip);
      if (!quota.allowed) {
        return res.status(429).json({
          error: `今日免费处刑次数已用完（${quota.used} 次）。注册凡梦AI 可获得更多 Agent 额度。`,
          code: "VIRAL_QUOTA_EXCEEDED",
          remaining: 0,
        });
      }

      if (!apiKey) {
        return res.status(503).json({
          error: `Listing 处刑仪需要配置 ${providerName} API Key 后才能使用。`,
        });
      }

      const { response, data } = await callChatCompletions({
        model,
        temperature: 0.55,
        max_tokens: 1800,
        messages: buildRoastMessages({ title, bullets, platform }),
      });

      if (!response.ok) {
        return res.status(response.status).json({
          error: data?.error?.message || data?.message || "AI 处刑失败，请稍后重试。",
        });
      }

      const raw = data?.choices?.[0]?.message?.content || "";
      let parsed;
      try {
        parsed = parseRoastJson(raw);
      } catch (error) {
        return res.status(502).json({ error: error.message || "解析 AI 结果失败，请重试。" });
      }

      const report = createViralReport({
        title,
        bullets,
        platform,
        creatorIp: ip,
        result: parsed,
        score: parsed.score,
        verdict: parsed.verdict,
      });

      recordProductEvent({
        event: "viral_roast_complete",
        sessionId: ip,
        path: "/roast",
        properties: { score: parsed.score, reportId: report.id, refCode: report.refCode },
      });

      res.json({
        report: sanitizeReportForPublic(report),
        quota: { remaining: quota.remaining - 1, used: quota.used + 1 },
      });
    }),
  );

  app.get(
    "/api/viral/reports/:id",
    asyncHandler(async (req, res) => {
      const report = getViralReport(req.params.id);
      if (!report) {
        return res.status(404).json({ error: "报告不存在或已过期。" });
      }

      const isOwnerPreview = !report.isPublic;
      if (report.isPublic) {
        incrementViralReportViews(report.refCode);
        recordProductEvent({
          event: "viral_report_view",
          sessionId: clientIp(req),
          path: `/r/${report.refCode}`,
          properties: { reportId: report.id, refCode: report.refCode },
        });
      }

      res.json({
        report: sanitizeReportForPublic(report),
        preview: isOwnerPreview,
      });
    }),
  );

  app.post(
    "/api/viral/reports/:id/publish",
    viralRoastLimiter,
    asyncHandler(async (req, res) => {
      const report = getViralReport(req.params.id);
      if (!report) {
        return res.status(404).json({ error: "报告不存在。" });
      }

      const published = publishViralReport(report.id);
      recordProductEvent({
        event: "viral_report_publish",
        sessionId: clientIp(req),
        path: "/roast",
        properties: { reportId: report.id, refCode: report.refCode },
      });

      const base = siteBase(req);
      res.json({
        report: sanitizeReportForPublic(published),
        shareUrl: `${base}/r/${published.refCode}`,
        appUrl: `${base}/#r/${published.refCode}`,
      });
    }),
  );

  /** 社交分享 / SEO 落地：OG 标签 + 跳转 SPA */
  app.get("/r/:refCode", (req, res) => {
    const report = getViralReport(req.params.refCode);
    const base = siteBase(req);
    if (!report || !report.isPublic) {
      return res.redirect(302, `${base}/#roast`);
    }

    incrementViralReportViews(report.refCode);
    const title = escapeHtml(`${report.titlePreview} · Listing 得分 ${report.score} · ${report.verdict}`);
    const desc = escapeHtml(
      report.result?.shareTeaser ||
        report.result?.hookLine ||
        `这个 TikTok Listing 被 AI 处刑了，得分 ${report.score}/100。`,
    );
    const url = `${base}/r/${report.refCode}`;

    res.type("html").send(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <meta name="description" content="${desc}" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:url" content="${url}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta http-equiv="refresh" content="0;url=${base}/#r/${report.refCode}" />
  <link rel="canonical" href="${url}" />
</head>
<body>
  <p>正在打开 Listing 处刑报告… <a href="${base}/#r/${report.refCode}">点此进入</a></p>
</body>
</html>`);
  });
}
