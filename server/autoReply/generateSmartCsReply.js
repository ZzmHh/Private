/**
 * 商品感知客服回复 + AI 自评置信度（白天确认 / 夜间自动发 gate）
 */
import { callChatCompletionsJson, openClawConfigured, model } from "./llmClient.js";
import { detectBuyerLanguage } from "./classifyBuyerIntent.js";
import { buildCsReplyLanguageRule, buildCsReplyUserLanguageLine } from "./llmLanguagePrompt.js";
import { extractProductCatalog, matchProductInquiry } from "./extractProductCatalog.js";
import { buildFaqShopContext } from "./buildFaqShopContext.js";

const SMART_REPLY_SYSTEM = `你是 TikTok Shop 跨境客服助手。根据买家消息与「店铺商品上下文」生成可直接发给买家的回复。

【输出】只输出 JSON 对象（不要 markdown）：
{
  "text": "发给买家的正文",
  "confidence": "high|medium|low",
  "canAutoSend": true/false,
  "uncertainReason": "若 canAutoSend=false，简短说明原因（≤120字）",
  "productName": "识别到的商品名或空字符串"
}

【规则】
1. 只使用上下文里出现的商品名、规格、价格；没有的数据不要编造，改用「我需要核对后回复您」类表述并把 canAutoSend 设为 false。
2. 价格/库存/到货日期无确切依据 → confidence=low, canAutoSend=false。
3. 买家问的具体 SKU 在上下文找不到 → confidence=low 或 medium, canAutoSend=false。
4. 上下文充分且问题明确（尺码、颜色、是否兼容等能从摘录回答）→ confidence=high, canAutoSend=true。
5. 语气友好专业；拉丁语系 ≤220 词，中文 ≤350 字。
6. 不承诺退款/赔偿/改价；不说已在后台操作。`;

function parseSmartReply(raw) {
  const text = String(raw || "").trim();
  if (!text) return null;
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === "object") return parsed;
  } catch {
    /* fall through */
  }
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
  return null;
}

function buildProductContextBlock(mergedContext, buyerText) {
  const catalog = extractProductCatalog(mergedContext);
  const match = matchProductInquiry(buyerText, catalog);
  const shopCtx = buildFaqShopContext({ mergedContext });
  const lines = [];

  if (match) {
    lines.push(
      "【疑似咨询商品】",
      `名称: ${match.name}`,
      `页面类型: ${match.pageType}`,
      `摘录: ${match.snippet}`,
    );
  }

  if (catalog.length) {
    lines.push("", "【店铺商品列表摘要（前 12 条）】");
    for (const item of catalog.slice(0, 12)) {
      lines.push(`- ${item.name}: ${item.snippet.slice(0, 120)}`);
    }
  }

  if (shopCtx.textBlock) {
    lines.push("", "【页面抓取摘录】", shopCtx.textBlock.slice(0, 6000));
  }

  return { block: lines.join("\n"), productMatch: match, catalogSize: catalog.length };
}

/**
 * @param {{
 *   buyerText: string,
 *   shopName?: string,
 *   mergedContext?: object|null,
 *   orderContext?: string,
 *   languageHint?: string,
 *   mode?: 'daytime'|'night',
 * }} input
 */
export async function generateSmartCsReply(input = {}) {
  const buyerText = String(input.buyerText || "").trim();
  if (!buyerText) {
    return { ok: false, error: "买家消息为空。" };
  }

  if (!openClawConfigured()) {
    return { ok: false, error: "未配置 LLM API Key，无法生成智能回复。" };
  }

  const lang = input.languageHint || detectBuyerLanguage(buyerText);
  const { block, productMatch, catalogSize } = buildProductContextBlock(input.mergedContext, buyerText);
  const strictNight = input.mode === "night";

  const userBlock = [
    `店铺: ${input.shopName || "TikTok Shop"}`,
    buildCsReplyUserLanguageLine(lang),
    strictNight ? "【模式】夜间自动回复：仅当信息充分才设 canAutoSend=true，否则 false。" : "【模式】白天：生成供卖家确认的回复，信息不足时 canAutoSend=false。",
    `商品线索数: ${catalogSize}`,
    "",
    "买家消息:",
    buyerText.slice(0, 2000),
    block ? `\n${block}` : "\n（暂无商品页同步数据，请勿编造细节）",
    input.orderContext ? `\n【聊天页上下文】\n${String(input.orderContext).slice(0, 800)}` : "",
  ].join("\n");

  const system = `${SMART_REPLY_SYSTEM}\n\n【站点语言】\n${buildCsReplyLanguageRule(lang)}`;

  const { response, data } = await callChatCompletionsJson({
    model,
    temperature: strictNight ? 0.25 : 0.35,
    max_tokens: strictNight ? 650 : 750,
    response_format: { type: "json_object" },
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

  const parsed = parseSmartReply(data?.choices?.[0]?.message?.content || "");
  const replyText = String(parsed?.text || "").trim();
  if (!replyText) {
    return { ok: false, error: "模型没有返回可用话术。" };
  }

  let confidence = ["high", "medium", "low"].includes(parsed.confidence) ? parsed.confidence : "medium";
  let canAutoSend = Boolean(parsed.canAutoSend);

  if (strictNight) {
    if (catalogSize < 2) {
      canAutoSend = false;
      confidence = "low";
    }
    if (confidence !== "high") canAutoSend = false;
  } else if (confidence === "low") {
    canAutoSend = false;
  }

  return {
    ok: true,
    text: replyText.slice(0, 2000),
    confidence,
    canAutoSend,
    uncertainReason: String(parsed.uncertainReason || "").slice(0, 200),
    productMatch: productMatch
      ? { name: productMatch.name, score: productMatch.score, pageType: productMatch.pageType }
      : parsed.productName
        ? { name: String(parsed.productName).slice(0, 120), score: 0, pageType: "" }
        : null,
    catalogSize,
    lang,
  };
}
