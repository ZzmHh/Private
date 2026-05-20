/**
 * 分层客服路由：FAQ 直发 → 售后模板+告警 → 北京夜间 AI 兜底 → 否则草稿
 */
import { classifyBuyerIntent, detectBuyerLanguage } from "./classifyBuyerIntent.js";
import { applyTemplateVars, getSlaText, isBeijingRestHours } from "./beijingTime.js";
import { matchFaqTemplate } from "./matchFaq.js";
import {
  createCsSellerAlert,
  defaultCsAutomationSettings,
  getCsSettings,
  listCsFaqTemplates,
} from "./csStore.js";
import { generateNightBuyerReplyText } from "./generateNightBuyerReply.js";
import { generateBuyerReplyText } from "./generateBuyerReply.js";

/**
 * @param {{
 *   buyerText: string,
 *   userId: string,
 *   shopKey?: string,
 *   shopName?: string,
 *   channel?: 'webhook'|'extension',
 *   orderContext?: string,
 *   faqTemplates?: object[],
 *   settings?: object,
 * }} input
 */
export async function routeBuyerMessage(input) {
  const buyerText = String(input.buyerText || "").trim();
  const settings = { ...defaultCsAutomationSettings(), ...(input.settings || getCsSettings(input.userId)) };
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
    const tpl =
      lang === "zh" ? settings.afterSalesTemplateZh : settings.afterSalesTemplateEn;
    const replyText = applyTemplateVars(tpl, { sla, shopName });
    const alert = createCsSellerAlert({
      userId: input.userId,
      shopKey: input.shopKey,
      shopName,
      buyerText,
      intent,
      replyPreview: replyText,
      channel,
    });
    const autoSend =
      channel === "webhook" ||
      (channel === "extension" && settings.extensionAutoSendAfterSales !== false);
    return {
      ok: true,
      ...base,
      tier: "aftersales",
      action: autoSend ? "auto_send" : "draft",
      replyText,
      notifySeller: true,
      sellerMessage: `⚠️ 售后待处理：买家消息需人工跟进（${intent.category}）`,
      alertId: alert.id,
      reason: "售后类问题：已发安抚模板并通知卖家",
    };
  }

  // —— FAQ 模板命中 ——
  const faqHit = matchFaqTemplate(buyerText, templates, intent);
  if (faqHit?.template?.text) {
    const replyText = applyTemplateVars(faqHit.template.text, { sla, shopName });
    const autoSend =
      channel === "webhook" ||
      (channel === "extension" && settings.extensionAutoSendFaq !== false);
    return {
      ok: true,
      ...base,
      tier: "faq",
      action: autoSend ? "auto_send" : "draft",
      replyText,
      faqMatch: { name: faqHit.template.name, source: faqHit.source },
      notifySeller: false,
      reason: "FAQ 模板命中，可自动发送",
    };
  }

  // —— 简单问候（无模板时用内置） ——
  if (intent.category === "greeting") {
    const replyText = applyTemplateVars(
      lang === "zh" ? settings.greetingTemplateZh : settings.greetingTemplateEn,
      { sla, shopName },
    );
    const autoSend =
      channel === "webhook" ||
      (channel === "extension" && settings.extensionAutoSendFaq !== false);
    return {
      ok: true,
      ...base,
      tier: "faq",
      action: autoSend ? "auto_send" : "draft",
      replyText,
      faqMatch: { name: "builtin_greeting", source: "builtin" },
      notifySeller: false,
      reason: "问候语内置模板",
    };
  }

  // —— 北京夜间 · 非售后 · FAQ 未命中 · AI 兜底 ——
  if (beijingNight && settings.nightAiEnabled !== false) {
    const gen = await generateNightBuyerReplyText({
      buyerText,
      shopName,
      orderContext: input.orderContext || "",
      languageHint: lang,
    });
    if (gen.ok) {
      return {
        ok: true,
        ...base,
        tier: "night_ai",
        action: "auto_send",
        replyText: gen.text,
        notifySeller: false,
        reason: "北京时间休息时段，AI 售前兜底（非售后）",
      };
    }
    return {
      ok: false,
      ...base,
      tier: "night_ai",
      action: "draft",
      error: gen.error,
      notifySeller: false,
      reason: "夜间 AI 失败，请人工处理",
    };
  }

  // —— 白天：生成草稿，不自动发 ——
  const draft = await generateBuyerReplyText({
    buyerText,
    shopName,
    platform: "TikTok Shop",
    languageHint: lang,
  });

  return {
    ok: draft.ok,
    ...base,
    tier: "manual",
    action: "draft",
    replyText: draft.ok ? draft.text : "",
    error: draft.error,
    notifySeller: false,
    reason: beijingNight
      ? "休息时段但未开启夜间 AI"
      : "非 FAQ/非售后，白天需人工确认后发送",
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
