/**
 * 火山方舟 · Seedance 视频生成（异步任务）
 * @see https://www.volcengine.com/docs/82379
 */

const DEFAULT_BASE = "https://ark.cn-beijing.volces.com/api/v3";

const MODEL_ALIASES = {
  "doubao-seedance-2.0": "doubao-seedance-2-0-260128",
  "doubao-seedance-2-0": "doubao-seedance-2-0-260128",
};

export function seedanceConfigured() {
  return Boolean(String(process.env.VOLC_ARK_API_KEY || "").trim());
}

function baseUrl() {
  return String(process.env.VOLC_ARK_BASE_URL || DEFAULT_BASE).replace(/\/+$/, "");
}

function resolveModel(model) {
  const m = String(model || process.env.SEEDANCE_MODEL || "doubao-seedance-2-0-260128").trim();
  return MODEL_ALIASES[m] || m;
}

async function arkFetch(path, options = {}) {
  const key = String(process.env.VOLC_ARK_API_KEY || "").trim();
  if (!key) throw new Error("未配置 VOLC_ARK_API_KEY，无法调用 Seedance。");

  const url = `${baseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(data.error?.message || data.message || data.error || `Seedance HTTP ${res.status}`);
    err.status = res.status;
    err.detail = data;
    throw err;
  }
  return data;
}

/**
 * @param {{ prompt: string, model?: string, ratio?: string, duration?: number, resolution?: string, refImageUrls?: string[], generateAudio?: boolean, watermark?: boolean }} opts
 */
export async function createSeedanceVideoTask(opts) {
  const prompt = String(opts.prompt || "").trim();
  if (!prompt) throw new Error("请填写视频提示词。");

  const content = [{ type: "text", text: prompt }];
  for (const url of opts.refImageUrls || []) {
    const u = String(url || "").trim();
    if (!u) continue;
    content.push({
      type: "image_url",
      image_url: { url: u },
      role: "reference_image",
    });
  }

  const body = {
    model: resolveModel(opts.model),
    content,
    ratio: opts.ratio || "16:9",
    duration: Math.min(60, Math.max(1, Number(opts.duration) || 5)),
    resolution: opts.resolution || "720p",
    watermark: Boolean(opts.watermark),
  };
  if (opts.generateAudio != null) body.generate_audio = Boolean(opts.generateAudio);

  const data = await arkFetch("/contents/generations/tasks", {
    method: "POST",
    body: JSON.stringify(body),
  });

  const taskId = data.id || data.task_id || data.data?.id;
  if (!taskId) throw new Error("Seedance 未返回 task id。");

  return normalizeTask({ ...data, id: taskId });
}

/** @param {string} taskId */
export async function getSeedanceVideoTask(taskId) {
  const id = String(taskId || "").trim();
  if (!id) throw new Error("请提供 taskId。");
  const data = await arkFetch(`/contents/generations/tasks/${encodeURIComponent(id)}`);
  return normalizeTask(data);
}

function normalizeTask(data) {
  const status = String(data.status || data.task_status || "unknown").toLowerCase();
  let videoUrl =
    data.content?.video_url ||
    data.output?.video_url ||
    data.result?.video_url ||
    data.video_url ||
    null;

  if (!videoUrl && Array.isArray(data.content)) {
    for (const item of data.content) {
      if (item?.video_url?.url) videoUrl = item.video_url.url;
      else if (typeof item?.video_url === "string") videoUrl = item.video_url;
    }
  }

  return {
    id: data.id || data.task_id,
    status,
    videoUrl,
    error: data.error?.message || data.fail_reason || data.message || null,
    raw: data,
  };
}
