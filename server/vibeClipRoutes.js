import { ensureFeatureAccess, getPlan } from "./db.js";
import { analyzeProduct } from "./vibeClip/analyze.js";
import { runVibeClipGenerate } from "./vibeClip/generate.js";
import { countUserJobsThisMonth, getVibeClipJob, listVibeClipJobs } from "./vibeClip/store.js";
import { VIBE_CATEGORIES, VIBE_MOODS } from "./vibeClip/templates.js";

function getVibeClipMonthlyLimit(user) {
  const plan = getPlan(user);
  return plan.features.vibeClipMonthlyLimit ?? 0;
}

function ensureVibeClipQuota(user) {
  ensureFeatureAccess(user, "vibeClip");
  const limit = getVibeClipMonthlyLimit(user);
  const used = countUserJobsThisMonth(user.id);
  if (used >= limit) {
    const err = new Error(`本月氛围视频额度已用完（${used}/${limit}）。请升级套餐或下月再试。`);
    err.status = 403;
    throw err;
  }
  return { used, limit, remaining: limit - used };
}

/**
 * @param {import("express").Express} app
 * @param {{ authMiddleware: Function }} deps
 */
export function registerVibeClipRoutes(app, { authMiddleware }) {
  app.get("/api/vibeclip/templates", authMiddleware, (req, res) => {
    try {
      ensureFeatureAccess(req.user, "vibeClip");
      res.json({
        categories: VIBE_CATEGORIES.map(({ id, label, defaultMood }) => ({ id, label, defaultMood })),
        moods: VIBE_MOODS.map(({ id, label, tagline, accent, pace }) => ({
          id,
          label,
          tagline,
          accent,
          pace,
        })),
      });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message || "读取模板失败。" });
    }
  });

  app.get("/api/vibeclip/quota", authMiddleware, (req, res) => {
    try {
      const limit = getVibeClipMonthlyLimit(req.user);
      const used = countUserJobsThisMonth(req.user.id);
      const hasAccess = Boolean(getPlan(req.user).features.vibeClip);
      res.json({
        hasAccess,
        used,
        limit,
        remaining: Math.max(0, limit - used),
        label: "本月氛围视频条数",
      });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message || "读取额度失败。" });
    }
  });

  app.get("/api/vibeclip/jobs", authMiddleware, (req, res) => {
    try {
      ensureFeatureAccess(req.user, "vibeClip");
      res.json({ jobs: listVibeClipJobs(req.user.id, 30) });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message || "读取任务失败。" });
    }
  });

  app.get("/api/vibeclip/jobs/:id", authMiddleware, (req, res) => {
    try {
      ensureFeatureAccess(req.user, "vibeClip");
      const job = getVibeClipJob(req.user.id, req.params.id);
      if (!job) return res.status(404).json({ error: "任务不存在。" });
      res.json({ job });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message || "读取任务失败。" });
    }
  });

  app.post("/api/vibeclip/analyze", authMiddleware, (req, res) => {
    try {
      ensureFeatureAccess(req.user, "vibeClip");
      const { fileName, productHint, moodId } = req.body || {};
      const analysis = analyzeProduct({ fileName, productHint, moodId });
      res.json({ analysis });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message || "分析失败。" });
    }
  });

  app.post("/api/vibeclip/generate", authMiddleware, (req, res) => {
    try {
      const quota = ensureVibeClipQuota(req.user);
      const { imageDataUrl, fileName, productHint, moodId, categoryId } = req.body || {};
      const job = runVibeClipGenerate({
        userId: req.user.id,
        imageDataUrl,
        fileName,
        productHint,
        moodId,
        categoryId,
      });
      res.json({
        ok: true,
        job,
        quota: {
          ...quota,
          remaining: Math.max(0, quota.remaining - 1),
        },
      });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message || "生成失败。" });
    }
  });
}
