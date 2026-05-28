/**
 * 大模型调用 · popup 与 background 共用
 * 依赖：LeadRadarProviders（providers.js）
 */
const LeadRadarLlmCore = (function () {
  const LR_DEFAULTS = {
    providerId: "openai",
    apiBase: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
    apiKey: "",
  };

  function mergeSettings(raw) {
    return { ...LR_DEFAULTS, ...(raw || {}) };
  }

  function splitMessages(messages) {
    let system = "";
    const rest = [];
    for (const m of messages || []) {
      if (m.role === "system") system += (system ? "\n" : "") + m.content;
      else rest.push(m);
    }
    return { system, rest };
  }

  async function callOpenAiCompat(settings, messages) {
    const base = String(settings.apiBase || "").replace(/\/+$/, "");
    if (!base) throw new Error("请填写 API Base 地址");

    const provider = LeadRadarProviders.get(settings.providerId);
    const urls = [`${base}/chat/completions`];
    if (!base.endsWith("/v1")) urls.push(`${base}/v1/chat/completions`);

    const headers = {
      Authorization: `Bearer ${settings.apiKey.trim()}`,
      "Content-Type": "application/json",
    };
    if (provider?.extraHeaders) Object.assign(headers, provider.extraHeaders);

    let last;
    for (const url of urls) {
      let res;
      try {
        res = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify({
            model: settings.model,
            temperature: 0.5,
            max_tokens: 256,
            messages,
          }),
        });
      } catch (e) {
        throw new Error(`网络请求失败：${e.message || e}。请检查 API 地址与网络。`);
      }
      const data = await res.json().catch(() => ({}));
      last = { res, data, url };
      if (res.ok || res.status !== 404) break;
    }

    if (!last.res.ok) {
      const err =
        last.data?.error?.message ||
        last.data?.message ||
        (typeof last.data?.error === "string" ? last.data.error : null) ||
        `HTTP ${last.res.status}`;
      throw new Error(String(err));
    }
    return last.data?.choices?.[0]?.message?.content || "";
  }

  async function callAnthropic(settings, messages) {
    const { system, rest } = splitMessages(messages);
    let res;
    try {
      res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": settings.apiKey.trim(),
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: settings.model || "claude-3-5-sonnet-20241022",
          max_tokens: 256,
          system: system || undefined,
          messages: rest.map((m) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.content,
          })),
        }),
      });
    } catch (e) {
      throw new Error(`网络请求失败：${e.message || e}`);
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error?.message || data?.message || `Anthropic HTTP ${res.status}`);
    const block = data.content?.find((b) => b.type === "text");
    return block?.text || "";
  }

  async function callGemini(settings, messages) {
    const { system, rest } = splitMessages(messages);
    const model = settings.model || "gemini-2.0-flash";
    const base = (settings.apiBase || "https://generativelanguage.googleapis.com/v1beta").replace(/\/+$/, "");
    const url = `${base}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(settings.apiKey.trim())}`;

    const parts = [];
    if (system) parts.push({ text: `[System]\n${system}\n\n` });
    for (const m of rest) {
      parts.push({ text: `${m.role === "assistant" ? "Assistant" : "User"}: ${m.content}\n` });
    }

    let res;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts }],
          generationConfig: { temperature: 0.5, maxOutputTokens: 256 },
        }),
      });
    } catch (e) {
      throw new Error(`网络请求失败：${e.message || e}`);
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error?.message || JSON.stringify(data?.error) || `Gemini HTTP ${res.status}`);
    }
    return data.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
  }

  async function callWithSettings(settings, messages) {
    const s = mergeSettings(settings);
    if (!s.apiKey?.trim()) throw new Error("请先填写 API Key");

    const provider = LeadRadarProviders.get(s.providerId);
    const apiType = provider?.apiType || "openai_compat";

    if (apiType === "anthropic") return callAnthropic(s, messages);
    if (apiType === "gemini") return callGemini(s, messages);
    return callOpenAiCompat(s, messages);
  }

  async function callLlm(messages) {
    const { lead_radar_settings = {} } = await chrome.storage.local.get("lead_radar_settings");
    return callWithSettings(lead_radar_settings, messages);
  }

  return { mergeSettings, callWithSettings, callLlm };
})();

if (typeof globalThis !== "undefined") {
  globalThis.LeadRadarLlm = LeadRadarLlmCore;
}
