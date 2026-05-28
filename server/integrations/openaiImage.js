/**
 * OpenAI 兼容图片生成（ChatGPT / DALL·E 等，走 OPENCLAW_BASE_URL + OPENCLAW_API_KEY）
 */

function imageBaseUrl() {
  return String(process.env.OPENCLAW_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");
}

function imageApiKey() {
  return String(process.env.OPENCLAW_API_KEY || process.env.OPENAI_API_KEY || "").trim();
}

export function openaiImageConfigured() {
  return Boolean(imageApiKey());
}

function resolveImageModel(model) {
  const m = String(model || process.env.OPENAI_IMAGE_MODEL || "dall-e-3").trim();
  if (m === "gpt-image-2") return process.env.OPENAI_IMAGE_MODEL || "dall-e-3";
  return m;
}

/** @param {string} ratio */
function ratioToSize(ratio) {
  const r = String(ratio || "1:1");
  if (r === "16:9" || r === "3:2") return "1792x1024";
  if (r === "9:16" || r === "2:3") return "1024x1792";
  return "1024x1024";
}

/**
 * @param {{ prompt: string, model?: string, ratio?: string, n?: number }} opts
 */
export async function generateOpenAIImage(opts) {
  const key = imageApiKey();
  if (!key) throw new Error("未配置 OPENCLAW_API_KEY / OPENAI_API_KEY，无法生成图片。");

  const prompt = String(opts.prompt || "").trim();
  if (!prompt) throw new Error("请填写图片提示词。");

  const model = resolveImageModel(opts.model);
  const size = ratioToSize(opts.ratio);
  const base = imageBaseUrl();
  const endpoints = [`${base}/images/generations`];
  if (!base.endsWith("/v1")) endpoints.push(`${base}/v1/images/generations`);

  let lastErr;
  for (const endpoint of endpoints) {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt,
        n: Math.min(4, Math.max(1, Number(opts.n) || 1)),
        size,
        response_format: "url",
      }),
    });
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }
    if (res.ok) {
      const urls = (data.data || []).map((d) => d.url || d.b64_json).filter(Boolean);
      if (!urls.length) throw new Error("图片 API 未返回结果 URL。");
      return {
        model,
        size,
        urls: urls.map((u) => (String(u).startsWith("http") ? u : `data:image/png;base64,${u}`)),
        revisedPrompt: data.data?.[0]?.revised_prompt || null,
      };
    }
    lastErr = new Error(data.error?.message || data.message || `图片生成失败 HTTP ${res.status}`);
    if (res.status !== 404) throw lastErr;
  }
  throw lastErr || new Error("图片生成 API 不可用。");
}
