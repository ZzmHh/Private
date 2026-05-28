import { getLanguageLabel } from "../../lib/csFaqTemplates.js";

export { getLanguageLabel };

export const CS_TIER_LABELS = {
  aftersales: "售后安抚",
  faq: "FAQ / 问候",
  night_ai: "夜间 AI 兜底",
  night_fallback: "夜间等候模板",
  day_ai: "白天 AI",
  product_ai: "商品 AI",
  manual: "人工草稿",
};

export const CS_ACTION_LABELS = {
  auto_send: "可自动发送",
  pending_confirm: "待卖家确认",
  draft: "仅草稿",
};

export function buildRouteMetaRows(routed) {
  if (!routed) return [];
  const faq = routed.faqMatch;
  const intent = routed.intent || {};
  const rows = [
    ["路由层级", CS_TIER_LABELS[routed.tier] || routed.tier || "—"],
    ["动作", CS_ACTION_LABELS[routed.action] || routed.action || "—"],
    ["识别语言", routed.langLabel || getLanguageLabel(routed.lang) || routed.lang || "—"],
    ["北京夜间", routed.beijingNight ? "是（休息时段）" : "否（工作时段）"],
    ["SLA 占位", routed.sla || "—"],
    ["意图分类", intent.category || "—"],
    ["路由说明", routed.reason || "—"],
  ];
  if (faq) {
    rows.push(["FAQ 模板", faq.name || "—"]);
    rows.push(["FAQ 来源", faq.source || "—"]);
    if (faq.lang) rows.push(["FAQ 语言", getLanguageLabel(faq.lang)]);
    if (faq.category) rows.push(["FAQ 分类", faq.category]);
    if (faq.score != null) rows.push(["匹配得分", String(faq.score)]);
    if (faq.shopKey != null) rows.push(["FAQ 店铺", faq.shopKey ? faq.shopKey : "全店通用"]);
  }
  if (routed.templateUsed) {
    rows.push([
      "内置模板",
      `${routed.templateUsed.kind || "—"} · ${getLanguageLabel(routed.templateUsed.lang)}`,
    ]);
  }
  if (routed.notifySeller) rows.push(["卖家告警", routed.sellerMessage || "将通知卖家"]);
  if (routed.productMatch?.name) rows.push(["识别商品", routed.productMatch.name]);
  if (routed.aiConfidence) rows.push(["AI 置信度", routed.aiConfidence]);
  return rows;
}

/** 无登录 token 时的演示路由结果 */
export function mockCsRouteResult(buyerText) {
  const lower = buyerText.toLowerCase();
  const isShipping = /ship|delivery|when|发货|物流/.test(lower);
  return {
    ok: true,
    tier: isShipping ? "faq" : "day_ai",
    action: isShipping ? "auto_send" : "pending_confirm",
    lang: /[\u4e00-\u9fff]/.test(buyerText) ? "zh" : "en",
    langLabel: /[\u4e00-\u9fff]/.test(buyerText) ? "中文" : "English",
    beijingNight: false,
    sla: "1-2 business days",
    reason: isShipping ? "命中 FAQ 模板「发货时效」" : "商品咨询，需结合店铺上下文生成",
    faqMatch: isShipping
      ? { name: "发货时效 EN", source: "user_template", category: "shipping", lang: "en", score: 0.91 }
      : null,
    replyText: isShipping
      ? "Hi! Thanks for your order. We ship within 1–2 business days. You'll receive tracking once dispatched."
      : "Thanks for reaching out! Could you share your order number so we can check the latest status for you?",
    aiConfidence: isShipping ? null : "medium",
  };
}
