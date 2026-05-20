/**
 * 买家消息意图 · 售前 FAQ / 一般 / 售后（售后优先）
 */

const AFTERSALES_RE =
  /退款|退货|换货|补发|少发|错发|漏发|损坏|破损|质量问题|差评|投诉|纠纷|赔偿|改价|取消订单|没收到|lost|refund|return|exchange|damaged|broken|wrong item|missing|not received|chargeback|dispute|complaint|bad review/i;

const FAQ_PRICE_RE =
  /多少钱|什么价|价格|售价|how much|price|cost|\$\s*\d|usd|discount|优惠|打折|coupon|promo/i;

const FAQ_SHIPPING_RE =
  /运费|物流|几天到|多久到|发货|快递|tracking|ship|shipping|delivery|when will i receive|arrive/i;

const FAQ_STOCK_RE =
  /有货|库存|还有吗|in stock|available|out of stock|缺货/i;

const FAQ_PRODUCT_RE =
  /尺码|size|颜色|color|材质|material|规格|怎么用|how to use|是什么|what is/i;

const GREETING_RE = /^(hi|hello|hey|在吗|你好|您好|哈喽|有人吗)[\s!?。！？]*$/i;

export function classifyBuyerIntent(buyerText) {
  const text = String(buyerText || "").trim();
  const lower = text.toLowerCase();

  if (!text) {
    return { tier: "unknown", category: "empty", risk: "low", faqEligible: false };
  }

  if (AFTERSALES_RE.test(text)) {
    return {
      tier: "aftersales",
      category: "aftersales",
      risk: "high",
      faqEligible: false,
      reason: "命中售后/纠纷关键词",
    };
  }

  if (GREETING_RE.test(text)) {
    return { tier: "faq", category: "greeting", risk: "low", faqEligible: true };
  }
  if (FAQ_PRICE_RE.test(text)) {
    return { tier: "faq", category: "price", risk: "low", faqEligible: true };
  }
  if (FAQ_SHIPPING_RE.test(text)) {
    return { tier: "faq", category: "shipping", risk: "low", faqEligible: true };
  }
  if (FAQ_STOCK_RE.test(text)) {
    return { tier: "faq", category: "stock", risk: "low", faqEligible: true };
  }
  if (FAQ_PRODUCT_RE.test(text)) {
    return { tier: "faq", category: "product", risk: "low", faqEligible: true };
  }

  if (text.length <= 40 && !/[?？]/.test(text)) {
    return { tier: "general", category: "short", risk: "medium", faqEligible: false };
  }

  return { tier: "general", category: "general", risk: "medium", faqEligible: false };
}

export function detectBuyerLanguage(buyerText) {
  const text = String(buyerText || "");
  const cjk = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const latin = (text.match(/[a-zA-Z]/g) || []).length;
  if (cjk > latin && cjk >= 2) return "zh";
  if (latin >= 4) return "en";
  return "en";
}
