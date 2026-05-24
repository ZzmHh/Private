/**
 * 根据插件抓取的店铺上下文，AI 生成 FAQ 草稿（需人工确认后启用）
 */
import crypto from "node:crypto";
import { normalizeFaqLang } from "../../shared/tiktokShopLanguages.js";
import { pickLocalizedTemplate, DEFAULT_GREETING_TEMPLATES } from "./csBuiltinTemplates.js";
import { buildFaqShopContext, extractKnownPrices } from "./buildFaqShopContext.js";
import { callChatCompletionsJson, openClawConfigured, model } from "./llmClient.js";

const VALID_CATEGORIES = new Set(["greeting", "price", "shipping", "stock", "product", ""]);

const FAQ_GENERATE_SYSTEM = `你是 TikTok Shop 跨境电商客服 FAQ 设计助手。

任务：根据卖家店铺页面抓取内容，生成 6–10 条 FAQ 自动回复草稿，供卖家微调后启用。

【输出格式】只输出一个 JSON 数组，不要 markdown，不要解释。每项：
{
  "name": "模板名称（中文或英文，≤40字）",
  "triggers": ["关键词1","keyword2",...],  // 3–8 个，含中英文常见买家问法
  "text": "直接发给买家的回复正文，可用 {shopName} {sla} 变量",
  "category": "greeting|price|shipping|stock|product 之一",
  "lang": "en|zh|es|pt|vi|th|fil|ms|id|ja|de|it|fr 等",
  "needsReview": true/false,
  "reviewReason": "需确认原因（可选，≤80字）",
  "confidence": "high|medium|low"
}

【硬性规则】
1. 价格：只能使用「店铺上下文」里明确出现的价格数字；没有则 text 里写「请以商品页标价为准」或保留 {price}，needsReview=true。
2. 禁止编造：订单号、物流单号、具体到货日期、库存数量、退款已批准等。
3. 物流时效：上下文无确切天数时用「通常 1–3 个工作日发货（请卖家确认）」类保守表述，needsReview=true。
4. 退换货：无明确政策时用保守话术 + needsReview=true。
5. 至少包含：1 条问候、1 条物流、1 条价格相关；其余按上下文补充库存/规格/售后引导。
6. 语言：优先 primaryLang；若店铺明显多语言站点，可为同一 category 生成 1–2 种主要语言版本。
7. 回复每条 ≤ 350 字，语气友好专业。`;

function parseJsonArray(raw) {
  const text = String(raw || "").trim();
  if (!text) return [];
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed?.drafts)) return parsed.drafts;
    if (Array.isArray(parsed?.templates)) return parsed.templates;
  } catch {
    /* fall through */
  }
  const match = text.match(/\[[\s\S]*\]/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch {
      return [];
    }
  }
  return [];
}

function normalizeDraft(raw, index, context) {
  const category = VALID_CATEGORIES.has(String(raw.category || "").toLowerCase())
    ? String(raw.category).toLowerCase()
    : "";
  const triggers = (Array.isArray(raw.triggers) ? raw.triggers : String(raw.triggers || "").split(/[,，|/;；]+/))
    .map((s) => String(s).trim())
    .filter(Boolean)
    .slice(0, 12);

  let text = String(raw.text || "").trim().slice(0, 4000);
  if (!text) return null;

  const lang = normalizeFaqLang(raw.lang || context.primaryLang || "en");
  let needsReview = Boolean(raw.needsReview);
  let reviewReason = String(raw.reviewReason || "").slice(0, 120);

  const knownPrices = extractKnownPrices(context.textBlock);
  if (category === "price" || /\$\s*[\d,.]+|¥\s*[\d,.]+|\d+\s*元/.test(text)) {
    const mentionsPrice = /\$\s*[\d,.]+|¥\s*[\d,.]+|\d+\s*(?:USD|usd|美元|元)/.test(text);
    if (mentionsPrice && knownPrices.length === 0) {
      needsReview = true;
      reviewReason = reviewReason || "回复含价格表述，但抓取内容中未找到明确标价，请核对。";
      text = text.replace(/\$\s*[\d,.]+/g, "{price}").replace(/¥\s*[\d,.]+/g, "{price}");
    } else if (mentionsPrice && knownPrices.length > 0) {
      const ok = knownPrices.some((p) => text.includes(p.replace(/\s+/g, "")) || text.includes(p));
      if (!ok) {
        needsReview = true;
        reviewReason = reviewReason || "价格数字与页面抓取不一致，请核对。";
      }
    }
  }

  if (text.includes("{shopName}") === false && context.shopName) {
    /* keep as-is; shopName var optional */
  }

  return {
    id: raw.id || crypto.randomUUID(),
    name: String(raw.name || `FAQ-${index + 1}`).slice(0, 80),
    triggers: triggers.length ? triggers : ["help", "question"],
    text,
    category,
    lang,
    needsReview,
    reviewReason,
    confidence: ["high", "medium", "low"].includes(raw.confidence) ? raw.confidence : "medium",
    source: raw.source || "ai",
  };
}

function buildFallbackDrafts(context) {
  const lang = context.primaryLang || "en";
  const shop = context.shopName || "{shopName}";
  const greeting = pickLocalizedTemplate(DEFAULT_GREETING_TEMPLATES, lang, "en").replace(/\{shopName\}/g, shop);

  const drafts = [
    {
      id: crypto.randomUUID(),
      name: lang === "zh" ? "问候" : "Greeting",
      triggers: lang === "zh" ? ["你好", "在吗", "hello", "hi"] : ["hello", "hi", "hey", "你好"],
      text: greeting.includes("{shopName}") ? greeting : greeting,
      category: "greeting",
      lang,
      needsReview: false,
      reviewReason: "",
      confidence: "high",
      source: "fallback",
    },
    {
      id: crypto.randomUUID(),
      name: lang === "zh" ? "物流时效" : "Shipping time",
      triggers:
        lang === "zh"
          ? ["物流", "发货", "几天到", "shipping", "delivery"]
          : ["shipping", "delivery", "when ship", "how long", "物流", "发货"],
      text:
        lang === "zh"
          ? `您好！${shop} 一般在 1–3 个工作日内发货，具体以商品页与平台物流信息为准。发货后我们会更新物流单号，请您留意订单详情。`
          : `Hi! ${shop} typically ships within 1–3 business days. Tracking will be updated once dispatched. Please check your order details for the latest status.`,
      category: "shipping",
      lang,
      needsReview: true,
      reviewReason: "请根据实际发货时效修改天数表述。",
      confidence: "medium",
      source: "fallback",
    },
    {
      id: crypto.randomUUID(),
      name: lang === "zh" ? "价格咨询" : "Price inquiry",
      triggers:
        lang === "zh"
          ? ["价格", "多少钱", "price", "how much", "cost"]
          : ["price", "how much", "cost", "多少钱", "价格"],
      text:
        lang === "zh"
          ? `您好！商品价格以 TikTok 商品页展示为准（含平台活动前的标价）。如需确认规格/颜色，请告诉我具体款式，我来帮您核对。`
          : `Hello! The price shown on our TikTok product page is the current listing price before platform coupons. Tell me which variant you need and I can help confirm details.`,
      category: "price",
      lang,
      needsReview: true,
      reviewReason: "请勿编造具体金额；如有固定促销价请在回复中写明。",
      confidence: "medium",
      source: "fallback",
    },
    {
      id: crypto.randomUUID(),
      name: lang === "zh" ? "库存/有货" : "Stock availability",
      triggers:
        lang === "zh"
          ? ["有货吗", "库存", "in stock", "available"]
          : ["in stock", "available", "库存", "有货"],
      text:
        lang === "zh"
          ? `您好！库存以商品页显示为准。若显示可下单通常即有货；如遇缺货，平台会提示或订单延迟，我们会尽快联系您。`
          : `Hi! Stock follows what's shown on the product page. If checkout is available, the item is generally in stock. We'll reach out if anything changes.`,
      category: "stock",
      lang,
      needsReview: true,
      reviewReason: "建议同步商品/库存页后补充具体 SKU 信息。",
      confidence: "low",
      source: "fallback",
    },
  ];

  if (context.textBlock.length > 200) {
    drafts.push({
      id: crypto.randomUUID(),
      name: lang === "zh" ? "产品规格" : "Product details",
      triggers: ["size", "color", "spec", "尺码", "颜色", "规格"],
      text:
        lang === "zh"
          ? `您好！关于规格/尺码/颜色，请参考商品详情页描述。请告诉我您看中的商品链接或款式，我帮您确认。`
          : `Hello! For size, color, or specs, please refer to the product description. Share the item or variant you want and I'll help confirm.`,
      category: "product",
      lang,
      needsReview: true,
      reviewReason: "请根据商品页实际规格补充具体信息。",
      confidence: "low",
      source: "fallback",
    });
  }

  return drafts;
}

/**
 * @param {{ mergedContext?: object, inlinePages?: object[], shopName?: string, primaryLang?: string }} input
 */
export async function generateFaqDrafts(input = {}) {
  const context = buildFaqShopContext(input);

  if (!context.ready) {
    return {
      ok: false,
      error: "店铺素材不足。请用 Chrome 插件在卖家中心打开商品/订单等页面并点「同步本页」。",
      contextSummary: {
        shopName: context.shopName,
        pageTypes: context.pageTypes,
        snapshotCount: context.snapshotCount,
        hints: context.hints,
      },
    };
  }

  const warnings = [...context.hints];
  let drafts = [];
  let modelUsed = null;

  if (openClawConfigured()) {
    const userBlock = [
      `店铺名: ${context.shopName || "（未知）"}`,
      `建议主语言 primaryLang: ${context.primaryLang}`,
      `已抓取页面类型: ${context.pageTypes.join(", ") || "无"}`,
      `已知标价片段: ${extractKnownPrices(context.textBlock).join(", ") || "无"}`,
      "",
      "=== 店铺页面抓取内容 ===",
      context.textBlock,
    ].join("\n");

    try {
      const { response, data } = await callChatCompletionsJson({
        model,
        temperature: 0.25,
        max_tokens: 2800,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: `${FAQ_GENERATE_SYSTEM}\n\n请把 JSON 数组放在 {"drafts":[...]} 对象里输出。` },
          { role: "user", content: userBlock },
        ],
      });

      if (!response.ok) {
        warnings.push(`AI 生成失败（${data?.error?.message || response.status}），已使用基础模板兜底。`);
        drafts = buildFallbackDrafts(context);
      } else {
        const rawContent = data?.choices?.[0]?.message?.content || "";
        const parsed = parseJsonArray(rawContent);
        drafts = parsed
          .map((row, i) => normalizeDraft(row, i, context))
          .filter(Boolean)
          .slice(0, 14);
        modelUsed = model;
        if (!drafts.length) {
          warnings.push("AI 返回格式异常，已使用基础模板兜底。");
          drafts = buildFallbackDrafts(context);
        }
      }
    } catch (error) {
      warnings.push(`AI 服务不可用（${error.message || "network"}），已使用基础模板兜底。`);
      drafts = buildFallbackDrafts(context);
    }
  } else {
    warnings.push("未配置 OPENCLAW_API_KEY，已使用基础 FAQ 模板（建议配置 AI 后重新生成）。");
    drafts = buildFallbackDrafts(context);
  }

  const needsReviewCount = drafts.filter((d) => d.needsReview).length;

  return {
    ok: true,
    drafts,
    contextSummary: {
      shopName: context.shopName,
      primaryLang: context.primaryLang,
      pageTypes: context.pageTypes,
      snapshotCount: context.snapshotCount,
      latestAt: context.latestAt,
      hints: context.hints,
      needsReviewCount,
    },
    warnings,
    modelUsed,
  };
}
