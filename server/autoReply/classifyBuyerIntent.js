/**
 * 买家消息意图 · 售前 FAQ / 一般 / 售后（售后优先）
 */
import {
  AFTERSALES_PATTERNS,
  FAQ_PRICE_PATTERNS,
  FAQ_PRODUCT_PATTERNS,
  FAQ_SHIPPING_PATTERNS,
  FAQ_STOCK_PATTERNS,
  GREETING_PATTERNS,
  matchesAny,
} from "./intentKeywords.js";

export function classifyBuyerIntent(buyerText) {
  const text = String(buyerText || "").trim();

  if (!text) {
    return { tier: "unknown", category: "empty", risk: "low", faqEligible: false };
  }

  if (matchesAny(text, AFTERSALES_PATTERNS)) {
    return {
      tier: "aftersales",
      category: "aftersales",
      risk: "high",
      faqEligible: false,
      reason: "命中售后/纠纷关键词",
    };
  }

  if (matchesAny(text, GREETING_PATTERNS)) {
    return { tier: "faq", category: "greeting", risk: "low", faqEligible: true };
  }
  if (matchesAny(text, FAQ_PRICE_PATTERNS)) {
    return { tier: "faq", category: "price", risk: "low", faqEligible: true };
  }
  if (matchesAny(text, FAQ_SHIPPING_PATTERNS)) {
    return { tier: "faq", category: "shipping", risk: "low", faqEligible: true };
  }
  if (matchesAny(text, FAQ_STOCK_PATTERNS)) {
    return { tier: "faq", category: "stock", risk: "low", faqEligible: true };
  }
  if (matchesAny(text, FAQ_PRODUCT_PATTERNS)) {
    return { tier: "faq", category: "product", risk: "low", faqEligible: true };
  }

  if (text.length <= 40 && !/[?？]/.test(text)) {
    return { tier: "general", category: "short", risk: "medium", faqEligible: false };
  }

  return { tier: "general", category: "general", risk: "medium", faqEligible: false };
}

export { detectBuyerLanguage } from "../../shared/tiktokShopLanguages.js";
