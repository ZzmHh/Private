import { callChatCompletionsJson, openClawConfigured, model } from "./llmClient.js";
import { detectBuyerLanguage } from "./classifyBuyerIntent.js";

const NIGHT_SYSTEM = `你是 TikTok Shop 跨境店铺夜间值班客服（仅售前/一般咨询，非售后）。

【必须遵守】
- 只输出可直接发给买家的正文，无标题无列表。
- 使用与买家相同的语言（中文或英文）。
- 不承诺退款、赔偿、改价、具体到货日期；不说已操作后台。
- 没有确切价格/库存数据时，说明「上班后会确认」，不要编造数字。
- 语气简短友好，不超过 350 字（英文约 220 词）。

【上下文】
下方可能有插件同步的页面摘要，仅作参考；若与买家问题无关可忽略。`;

/**
 * 北京时间夜间 · 非售后 · FAQ 未命中时的 AI 兜底
 */
export async function generateNightBuyerReplyText({
  buyerText,
  shopName = "",
  orderContext = "",
  languageHint = "",
}) {
  if (!openClawConfigured()) {
    return { ok: false, error: "未配置 LLM API Key，夜间 AI 兜底不可用。" };
  }

  const lang = languageHint || detectBuyerLanguage(buyerText);
  const userBlock = [
    `店铺：${shopName || "TikTok Shop"}`,
    `请用${lang === "zh" ? "中文" : "英文"}回复。`,
    "",
    "买家消息：",
    String(buyerText || "").slice(0, 2000),
    orderContext ? `\n【页面/商品上下文（未核实）】\n${String(orderContext).slice(0, 1500)}` : "",
  ].join("\n");

  const { response, data } = await callChatCompletionsJson({
    model,
    temperature: 0.3,
    max_tokens: 500,
    messages: [
      { role: "system", content: NIGHT_SYSTEM },
      { role: "user", content: userBlock },
    ],
  });

  if (!response.ok) {
    return {
      ok: false,
      error: data?.error?.message || data?.message || `模型调用失败 HTTP ${response.status}`,
    };
  }

  const text = (data?.choices?.[0]?.message?.content || "").trim();
  if (!text) return { ok: false, error: "模型没有返回可用话术。" };
  return { ok: true, text: text.slice(0, 2000), lang };
}
