/**
 * 夜间自动回复就绪评估：商品资料同步 + 可选 AI 自评
 */
import { extractProductCatalog } from "./extractProductCatalog.js";
import { buildFaqShopContext } from "./buildFaqShopContext.js";
import { callChatCompletionsJson, openClawConfigured, model } from "./llmClient.js";
import { getMergedExtensionContext } from "../extensionSync.js";

const MIN_PRODUCT_PAGES = 2;
const MIN_CATALOG_ITEMS = 3;
const MIN_TEXT_CHARS = 400;

function countProductPages(pages = []) {
  return pages.filter((p) => p.pageType === "product" || p.pageType === "inventory").length;
}

/**
 * @param {{ pages?: object[] } | null} mergedContext
 */
export function assessNightReadinessSync(mergedContext) {
  const pages = mergedContext?.pages || [];
  const productPages = countProductPages(pages);
  const catalog = extractProductCatalog(mergedContext);
  const shopCtx = buildFaqShopContext({ mergedContext });
  const gaps = [];

  if (productPages < MIN_PRODUCT_PAGES) {
    gaps.push(`请用插件同步至少 ${MIN_PRODUCT_PAGES} 个商品/库存页（当前 ${productPages} 页）。`);
  }
  if (catalog.length < MIN_CATALOG_ITEMS) {
    gaps.push(`商品线索不足（当前 ${catalog.length} 条，建议 ≥${MIN_CATALOG_ITEMS}）。`);
  }
  if ((shopCtx.textBlock || "").length < MIN_TEXT_CHARS) {
    gaps.push("页面文字摘录太少，请在商品详情页点「同步到 FAQ 素材」。");
  }

  const structurallyReady =
    productPages >= MIN_PRODUCT_PAGES &&
    catalog.length >= MIN_CATALOG_ITEMS &&
    (shopCtx.textBlock || "").length >= MIN_TEXT_CHARS;

  return {
    structurallyReady,
    productPages,
    catalogCount: catalog.length,
    snapshotCount: pages.length,
    textChars: (shopCtx.textBlock || "").length,
    gaps,
    canEnableNightAi: structurallyReady,
  };
}

function parseAssessment(raw) {
  try {
    const parsed = JSON.parse(String(raw || "").trim());
    if (parsed && typeof parsed === "object") return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * @param {string} userId
 * @param {string} [shopKey]
 * @param {{ pages?: object[] } | null} [mergedContext]
 */
export async function assessNightReadiness(userId, shopKey = "", mergedContext = null) {
  const ctx =
    mergedContext ||
    getMergedExtensionContext(userId, "tiktok", 20, shopKey || undefined) ||
    { pages: [] };

  const base = assessNightReadinessSync(ctx);
  if (!base.structurallyReady) {
    return {
      ...base,
      aiAssessment: null,
      canEnableNightAi: false,
      message: "商品资料尚未同步完整，暂不能开启夜间 AI 自动回复。",
    };
  }

  if (!openClawConfigured()) {
    return {
      ...base,
      aiAssessment: { canIndependentReply: true, confidence: "medium", summary: "未配置 LLM，仅按同步页数判定就绪。" },
      canEnableNightAi: true,
      message: "结构检查已通过，可开启夜间自动回复（建议配置 AI 后重新评估）。",
    };
  }

  const catalog = extractProductCatalog(ctx);
  const summaryLines = catalog.slice(0, 20).map((c) => `- ${c.name}: ${c.snippet.slice(0, 100)}`);

  const { response, data } = await callChatCompletionsJson({
    model,
    temperature: 0.2,
    max_tokens: 500,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `你是 TikTok Shop 客服系统审计员。根据卖家同步的商品摘要，判断夜间是否可以「独立、准确」自动回复常见售前问题。

只输出 JSON：
{
  "canIndependentReply": true/false,
  "confidence": "high|medium|low",
  "gaps": ["缺失点1", "..."],
  "summary": "≤120字结论"
}

canIndependentReply=true 仅当：多数 SKU 有名称+关键规格/价格线索，能回答尺码/颜色/是否在售等常见问题。缺价格可接受，但不能几乎无商品信息。`,
      },
      {
        role: "user",
        content: [`商品页数: ${base.productPages}`, `商品线索: ${base.catalogCount}`, "", ...summaryLines].join("\n"),
      },
    ],
  });

  if (!response.ok) {
    return {
      ...base,
      aiAssessment: null,
      canEnableNightAi: base.structurallyReady,
      message: "AI 评估暂不可用，已按同步页数判定为就绪。",
    };
  }

  const parsed = parseAssessment(data?.choices?.[0]?.message?.content || "");
  const canIndependentReply = Boolean(parsed?.canIndependentReply);
  const aiConfidence = ["high", "medium", "low"].includes(parsed?.confidence) ? parsed.confidence : "medium";

  return {
    ...base,
    aiAssessment: {
      canIndependentReply,
      confidence: aiConfidence,
      gaps: Array.isArray(parsed?.gaps) ? parsed.gaps.slice(0, 8) : [],
      summary: String(parsed?.summary || "").slice(0, 200),
      assessedAt: new Date().toISOString(),
    },
    canEnableNightAi: base.structurallyReady && canIndependentReply && aiConfidence !== "low",
    message: canIndependentReply
      ? "AI 评估：商品资料可支撑夜间自动回复。"
      : "AI 评估：资料仍不足，夜间将使用委婉等候模板，不建议开启全自动。",
  };
}
