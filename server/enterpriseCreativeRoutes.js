/**
 * 企业站 · 创意生成 API（Seedance 视频 + OpenAI 图片）
 * 密钥仅存服务端；前端走 enterprise_token
 */
import { asyncHandler } from "./middleware/asyncHandler.js";
import { createSeedanceVideoTask, getSeedanceVideoTask, seedanceConfigured } from "./integrations/volcSeedance.js";
import { generateOpenAIImage, openaiImageConfigured } from "./integrations/openaiImage.js";

/**
 * @param {import("express").Express} app
 * @param {{ enterpriseAuthMiddleware: Function }} deps
 */
export function registerEnterpriseCreativeRoutes(app, { enterpriseAuthMiddleware }) {
  app.get("/api/enterprise/creative/status", enterpriseAuthMiddleware, (_req, res) => {
    res.json({
      ok: true,
      seedance: seedanceConfigured(),
      openaiImage: openaiImageConfigured(),
      seedanceModel: process.env.SEEDANCE_MODEL || "doubao-seedance-2-0-260128",
      imageModel: process.env.OPENAI_IMAGE_MODEL || "dall-e-3",
    });
  });

  app.post(
    "/api/enterprise/creative/video/tasks",
    enterpriseAuthMiddleware,
    asyncHandler(async (req, res) => {
      if (!seedanceConfigured()) {
        return res.status(400).json({ error: "未配置 VOLC_ARK_API_KEY，请在服务器 .env 中设置。" });
      }
      const {
        prompt,
        model,
        ratio,
        duration,
        resolution,
        refImageUrls,
        refImagesBase64,
        generateAudio,
        watermark,
      } = req.body || {};

      const urls = [...(Array.isArray(refImageUrls) ? refImageUrls : []), ...(Array.isArray(refImagesBase64) ? refImagesBase64 : [])]
        .map((u) => String(u || "").trim())
        .filter(Boolean);

      const task = await createSeedanceVideoTask({
        prompt,
        model,
        ratio,
        duration,
        resolution,
        refImageUrls: urls,
        generateAudio: generateAudio === true || generateAudio === "true",
        watermark: watermark === true || watermark === "true",
      });

      res.json({ ok: true, task });
    }),
  );

  app.get(
    "/api/enterprise/creative/video/tasks/:taskId",
    enterpriseAuthMiddleware,
    asyncHandler(async (req, res) => {
      if (!seedanceConfigured()) {
        return res.status(400).json({ error: "未配置 VOLC_ARK_API_KEY。" });
      }
      const task = await getSeedanceVideoTask(req.params.taskId);
      res.json({ ok: true, task });
    }),
  );

  app.post(
    "/api/enterprise/creative/image/generate",
    enterpriseAuthMiddleware,
    asyncHandler(async (req, res) => {
      if (!openaiImageConfigured()) {
        return res.status(400).json({ error: "未配置 OPENCLAW_API_KEY / OPENAI_API_KEY。" });
      }
      const { prompt, model, ratio, n } = req.body || {};
      const result = await generateOpenAIImage({ prompt, model, ratio, n });
      res.json({ ok: true, result });
    }),
  );
}
