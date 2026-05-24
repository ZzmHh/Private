import { analyzeProduct } from "./analyze.js";
import { buildVariantCopy, getMoodById } from "./templates.js";
import { createVibeClipJob, updateVibeClipJob } from "./store.js";

const MAX_IMAGE_CHARS = 2_000_000;

/**
 * @param {{ imageDataUrl?: string, fileName?: string, productHint?: string, moodId?: string, categoryId?: string }} input
 */
export function validateGenerateInput(input) {
  if (!input.imageDataUrl || !String(input.imageDataUrl).startsWith("data:image/")) {
    return "请上传商品图片（JPG/PNG/WebP）。";
  }
  if (String(input.imageDataUrl).length > MAX_IMAGE_CHARS) {
    return "图片过大，请压缩后重试（建议 < 4MB）。";
  }
  return null;
}

/**
 * MVP 骨架：同步生成 3 个变体元数据（文案、氛围参数）。
 * V2 接 FFmpeg / Remotion 渲染真实 MP4。
 *
 * @param {{ userId: string, imageDataUrl: string, fileName?: string, productHint?: string, moodId?: string, categoryId?: string }} opts
 */
export function runVibeClipGenerate(opts) {
  const err = validateGenerateInput(opts);
  if (err) throw new Error(err);

  const analysis = analyzeProduct({
    fileName: opts.fileName,
    productHint: opts.productHint,
    moodId: opts.moodId,
  });

  const categoryId = opts.categoryId || analysis.categoryId;
  const moodId = opts.moodId || analysis.recommendedMoodId;
  const mood = getMoodById(moodId);

  const job = createVibeClipJob({
    userId: opts.userId,
    status: "processing",
    fileName: opts.fileName || "product.jpg",
    productHint: opts.productHint || "",
    categoryId,
    moodId,
    imageThumb: String(opts.imageDataUrl).slice(0, 120_000),
    analysis,
  });

  const variants = [0, 1, 2].map((index) => {
    const copy = buildVariantCopy({ categoryId, moodId, variantIndex: index });
    return {
      id: `${job.id}-v${index + 1}`,
      label: String.fromCharCode(65 + index),
      ...copy,
      durationSec: mood.pace === "fast" ? 10 : mood.pace === "slow" ? 14 : 12,
      aspectRatio: "9:16",
      renderStatus: "mock",
      previewNote: "MVP 骨架：变体文案与氛围参数已生成；FFmpeg 渲染接入后将提供 MP4 下载。",
    };
  });

  const publishPack = {
    suggestedCaption: variants[0].publishTitle,
    hashtags: variants[0].hashtags,
    bestTimeHint: "建议本地时间 19:00–22:00 发布（TikTok 晚间活跃段）",
  };

  return updateVibeClipJob(opts.userId, job.id, {
    status: "done",
    variants,
    selectedVariantId: variants[0].id,
    publishPack,
    completedAt: new Date().toISOString(),
  });
}
