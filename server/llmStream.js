/**
 * OpenAI 兼容 Chat Completions SSE 流式解析
 */

/**
 * @param {object} payload
 * @param {{ apiKey: string, baseUrl: string }} config
 * @returns {AsyncGenerator<{ type: 'delta' | 'done', text?: string, raw?: object }>}
 */
export async function* streamChatCompletions(payload, { apiKey, baseUrl }) {
  const normalizedBaseUrl = String(baseUrl || "").replace(/\/$/, "");
  const endpoints = [`${normalizedBaseUrl}/chat/completions`];
  if (!normalizedBaseUrl.endsWith("/v1")) {
    endpoints.push(`${normalizedBaseUrl}/v1/chat/completions`);
  }

  let response;
  let endpoint = endpoints[0];
  for (const url of endpoints) {
    endpoint = url;
    response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({ ...payload, stream: true }),
    });
    if (response.ok || response.status !== 404) break;
  }

  if (!response.ok) {
    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }
    yield { type: "done", raw: { ok: false, status: response.status, endpoint, data } };
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    yield { type: "done", raw: { ok: false, error: "响应体不可流式读取" } };
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n");
    buffer = parts.pop() || "";

    for (const line of parts) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const dataStr = trimmed.slice(5).trim();
      if (!dataStr || dataStr === "[DONE]") continue;
      try {
        const parsed = JSON.parse(dataStr);
        const delta = parsed?.choices?.[0]?.delta?.content;
        if (delta) yield { type: "delta", text: delta };
      } catch {
        /* ignore malformed chunk */
      }
    }
  }

  yield { type: "done", raw: { ok: true, endpoint } };
}
