import { callChatCompletionsJson, openClawConfigured, model } from "./llmClient.js";
import { detectBuyerLanguage } from "./classifyBuyerIntent.js";
import { buildCsReplyLanguageRule, buildCsReplyUserLanguageLine } from "./llmLanguagePrompt.js";

const BUYER_REPLY_SYSTEM = `你是跨境电商店铺客服助手，代表卖家在「店铺内聊天」里回复买家。

【必须遵守】
- 只输出「直接发给买家的正文」一种内容，不要标题、不要分节、不要写「摘要」「Checklist」。
- 单条回复尽量不超过 400 字（拉丁语系约 280 词以内），语气友好、专业。
- 语言规则见下方「站点语言」说明，与 FAQ 模板语言策略一致。
- 不承诺退款、不承诺赔偿金额、不承诺改价、不声称已操作后台；涉及纠纷、差评威胁、法律问题，用委婉话术引导买家等待店主处理。
- 物流/到货时间没有确切单号时，用「我们会尽快核实/请您稍等」类表述，不说死日期。

【禁止】
- 不写「我是 AI」除非买家明确问。
- 不编造订单号、物流单号、库存数字。`;

/**
 * 生成可自动发出的买家可见话术（不含工单、不含内部 Checklist）
 * @param {{ buyerText: string, shopName?: string, platform?: string, languageHint?: string }} param0
 */
export async function generateBuyerReplyText({
  buyerText,
  shopName = "",
  platform = "TikTok Shop",
  languageHint = "",
}) {
  if (!openClawConfigured()) {
    return {
      ok: false,
      error: "未配置 OPENCLAW_API_KEY / OPENAI_API_KEY，无法生成自动话术。",
    };
  }

  const lang = languageHint || detectBuyerLanguage(buyerText);
  const userBlock = [
    `平台：${platform}`,
    shopName ? `店铺名（展示用）：${shopName}` : "",
    buildCsReplyUserLanguageLine(lang),
    "",
    "买家最新消息：",
    String(buyerText || "").slice(0, 4000),
  ]
    .filter(Boolean)
    .join("\n");

  const system = `${BUYER_REPLY_SYSTEM}\n\n【站点语言】\n${buildCsReplyLanguageRule(lang)}`;

  const { response, data } = await callChatCompletionsJson({
    model,
    temperature: 0.35,
    max_tokens: 600,
    messages: [
      { role: "system", content: system },
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
  if (!text) {
    return { ok: false, error: "模型没有返回可用话术。" };
  }

  return { ok: true, text: text.slice(0, 2000), lang };
}
