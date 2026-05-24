/**
 * 分层客服路由：FAQ 直发 → 售后模板+告警 → 白天 AI 待确认/信任自动 → 夜间就绪+AI 自评 → 委婉模板
 */
import { classifyBuyerIntent, detectBuyerLanguage } from "./classifyBuyerIntent.js";
import { applyTemplateVars, getSlaText, isBeijingRestHours } from "./beijingTime.js";
import { matchFaqTemplate } from "./matchFaq.js";
import {
  createCsSellerAlert,
  getCsSettings,
  listCsFaqTemplates,
} from "./csStore.js";
import { getLanguageLabel } from "../../shared/tiktokShopLanguages.js";
import { pickLocalizedTemplate } from "./csBuiltinTemplates.js";
import { generateSmartCsReply } from "./generateSmartCsReply.js";
import { assessNightReadinessSync } from "./assessNightReadiness.js";

function uncertainReply(settings, lang, beijingNight, shopName) {
  const sla = getSlaText({ lang, beijingNight, settings });
  const tpl = pickLocalizedTemplate(settings.uncertainReplyTemplates, lang);
  return applyTemplateVars(tpl, { sla, shopName });
}

function shopReadinessKey(shopKey) {
  const sk = String(shopKey || "").trim();
  return sk || "_default";
}

/**
 * @param {{
 *   buyerText: string,
 *   userId: string,
 *   shopKey?: string,
 *   shopName?: string,
 *   channel?: 'webhook'|'extension',
 *   orderContext?: string,
 *   mergedContext?: object|null,
 *   faqTemplates?: object[],
 *   settings?: object,
 *   planAllowsAutoSend?: boolean,
 * }} input
 */
export async function routeBuyerMessage(input) {
  const buyerText = String(input.buyerText || "").trim();
  const settings = input.settings || getCsSettings(input.userId);
  const planAllowsAutoSend = input.planAllowsAutoSend !== false;
  const intent = classifyBuyerIntent(buyerText);
  const lang = detectBuyerLanguage(buyerText);
  const beijingNight = isBeijingRestHours(settings);
  const sla = getSlaText({ lang, beijingNight, settings });
  const shopName = input.shopName || "";
  const channel = input.channel || "extension";

  const templates =
    input.faqTemplates?.length > 0
      ? input.faqTemplates
      : listCsFaqTemplates(input.userId, input.shopKey);

  const base = {
    intent,
    lang,
    beijingNight,
    sla,
    channel,
  };

  // —— 售后：标准模板 + 通知卖家 ——
  if (intent.tier === "aftersales") {
    const tpl = pickLocalizedTemplate(settings.afterSalesTemplates, lang);
    const replyText = applyTemplateVars(tpl, { sla, shopName });
    createCsSellerAlert({
      userId: input.userId,
      shopKey: input.shopKey,
      shopName,
      buyerText,
      intent,
      replyPreview: replyText,
      channel,
    });
    const autoSend =
      planAllowsAutoSend &&
      (channel === "webhook" ||
        (channel === "extension" && settings.extensionAutoSendAfterSales !== false));
    return {
      ok: true,
      ...base,
      tier: "aftersales",
      action: autoSend ? "auto_send" : "draft",
      replyText,
      langLabel: getLanguageLabel(lang),
      templateUsed: { kind: "aftersales", lang },
      notifySeller: true,
      sellerMessage: `⚠️ 售后待处理：买家消息需人工跟进（${intent.category}）`,
      reason: "售后类问题：已发安抚模板并通知卖家",
    };
  }

  // —— FAQ 模板命中 ——
  const faqHit = matchFaqTemplate(buyerText, templates, intent, lang);
  if (faqHit?.template?.text) {
    const replyText = applyTemplateVars(faqHit.template.text, { sla, shopName });
    const autoSend =
      planAllowsAutoSend &&
      (channel === "webhook" ||
        (channel === "extension" && settings.extensionAutoSendFaq !== false));
    return {
      ok: true,
      ...base,
      tier: "faq",
      action: autoSend ? "auto_send" : "draft",
      replyText,
      langLabel: getLanguageLabel(lang),
      faqMatch: {
        id: faqHit.template.id,
        name: faqHit.template.name,
        source: faqHit.source,
        lang: faqHit.template.lang,
        shopKey: faqHit.template.shopKey || "",
        category: faqHit.template.category || "",
        score: faqHit.score,
      },
      notifySeller: false,
      reason: "FAQ 模板命中，可自动发送",
    };
  }

  // —— 简单问候（无模板时用内置） ——
  if (intent.category === "greeting") {
    const replyText = applyTemplateVars(
      pickLocalizedTemplate(settings.greetingTemplates, lang),
      { sla, shopName },
    );
    const autoSend =
      planAllowsAutoSend &&
      (channel === "webhook" ||
        (channel === "extension" && settings.extensionAutoSendFaq !== false));
    return {
      ok: true,
      ...base,
      tier: "faq",
      action: autoSend ? "auto_send" : "draft",
      replyText,
      langLabel: getLanguageLabel(lang),
      faqMatch: { name: "builtin_greeting", source: "builtin", lang },
      templateUsed: { kind: "greeting", lang },
      notifySeller: false,
      reason: "问候语内置模板",
    };
  }

  // —— 北京夜间 · 非售后 · FAQ 未命中（须显式开启 nightAiEnabled）——
  if (beijingNight && settings.nightAiEnabled === true) {
    const readiness = assessNightReadinessSync(input.mergedContext);
    const storedReady = settings.nightReadinessByShop?.[shopReadinessKey(input.shopKey)];

    if (!readiness.canEnableNightAi && storedReady?.canEnableNightAi !== true) {
      const replyText = uncertainReply(settings, lang, true, shopName);
      const autoSend = planAllowsAutoSend && channel === "webhook" ? true : planAllowsAutoSend;
      return {
        ok: true,
        ...base,
        tier: "night_fallback",
        action: autoSend ? "auto_send" : "draft",
        replyText,
        notifySeller: false,
        nightReadiness: readiness,
        reason: "夜间商品资料或 AI 评估未就绪，已发送委婉等候模板",
      };
    }

    const smart = await generateSmartCsReply({
      buyerText,
      shopName,
      mergedContext: input.mergedContext,
      orderContext: input.orderContext,
      languageHint: lang,
      mode: "night",
    });

    if (smart.ok && smart.canAutoSend && smart.confidence === "high" && planAllowsAutoSend) {
      return {
        ok: true,
        ...base,
        tier: "night_ai",
        action: "auto_send",
        replyText: smart.text,
        aiConfidence: smart.confidence,
        productMatch: smart.productMatch,
        notifySeller: false,
        reason: "夜间 AI 高置信度，已自动回复",
      };
    }

    const replyText = uncertainReply(settings, lang, true, shopName);
    return {
      ok: true,
      ...base,
      tier: "night_fallback",
      action: planAllowsAutoSend ? "auto_send" : "draft",
      replyText,
      aiConfidence: smart.confidence || "low",
      productMatch: smart.productMatch || null,
      notifySeller: false,
      reason: smart.uncertainReason || "夜间 AI 无法确证，已发送委婉等候模板",
    };
  }

  // —— 白天 · 智能商品感知回复 ——
  const smart = await generateSmartCsReply({
    buyerText,
    shopName,
    mergedContext: input.mergedContext,
    orderContext: input.orderContext,
    languageHint: lang,
    mode: "daytime",
  });

  if (smart.ok) {
    const trustedAuto =
      planAllowsAutoSend &&
      settings.daytimeAiTrustedAutoSend === true &&
      smart.canAutoSend &&
      smart.confidence === "high";

    return {
      ok: true,
      ...base,
      tier: smart.productMatch ? "product_ai" : "day_ai",
      action: trustedAuto ? "auto_send" : "pending_confirm",
      replyText: smart.text,
      aiConfidence: smart.confidence,
      productMatch: smart.productMatch,
      notifySeller: false,
      reason: trustedAuto
        ? "已识别商品并高置信度回复，已自动发送"
        : smart.productMatch
          ? `已识别商品「${smart.productMatch.name}」，请确认 AI 回复后发送`
          : "AI 已生成回复，请确认后发送（可开启「白天信任 AI 自动发送」）",
    };
  }

  const replyText = uncertainReply(settings, lang, false, shopName);
  return {
    ok: false,
    ...base,
    tier: "manual",
    action: "pending_confirm",
    replyText,
    error: smart.error,
    notifySeller: false,
    reason: smart.error || "AI 生成失败，已提供保守回复供确认",
  };
}

/**
 * Webhook / 插件共用：尝试出站发送
 */
export async function dispatchAutoSend({ routeResult, sendFn }) {
  if (!routeResult?.replyText?.trim()) {
    return { sent: false, reason: "无话术" };
  }
  if (routeResult.action !== "auto_send") {
    return { sent: false, reason: routeResult.reason || "仅草稿" };
  }
  if (typeof sendFn !== "function") {
    return { sent: false, dryRun: true, reason: "无 conversation_id 或未配置出站" };
  }
  const send = await sendFn(routeResult.replyText);
  return { sent: Boolean(send?.ok), send };
}
