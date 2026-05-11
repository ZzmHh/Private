import "dotenv/config";

const baseUrl = (process.env.OPENCLAW_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
const model = process.env.OPENCLAW_MODEL || "gpt-4o-mini";
const apiKey = process.env.OPENCLAW_API_KEY || process.env.OPENAI_API_KEY;

export async function callChatCompletionsJson(payload) {
  const endpoints = [`${baseUrl}/chat/completions`];
  if (!baseUrl.endsWith("/v1")) {
    endpoints.push(`${baseUrl}/v1/chat/completions`);
  }

  let last;
  for (const endpoint of endpoints) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const responseText = await response.text();
    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      data = { raw: responseText };
    }
    last = { response, data, endpoint };
    if (response.ok || response.status !== 404) {
      return last;
    }
  }
  return last;
}

export function openClawConfigured() {
  return Boolean(apiKey);
}

export { model, apiKey };
