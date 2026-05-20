/**
 * FAQ 模板匹配（插件/服务端同步的 triggers + 内置分类）
 */

const BUILTIN_BY_CATEGORY = {
  greeting: ["greeting", "hello", "在吗", "你好", "您好"],
  price: ["price", "价格", "多少钱", "售价"],
  shipping: ["shipping", "物流", "运费", "发货", "几天到"],
  stock: ["stock", "库存", "有货", "in stock"],
  product: ["product", "尺码", "size", "颜色", "color"],
};

export function matchFaqTemplate(buyerText, templates = [], intent = {}) {
  const text = String(buyerText || "").toLowerCase();
  const list = Array.isArray(templates) ? templates : [];
  let best = null;
  let bestScore = 0;

  for (const tpl of list) {
    const triggers = normalizeTriggers(tpl);
    let score = 0;
    for (const tr of triggers) {
      const t = tr.toLowerCase();
      if (!t) continue;
      if (text.includes(t)) score += t.length >= 4 ? 3 : 2;
    }
    if (tpl.category && intent.category && tpl.category === intent.category) {
      score += 2;
    }
    if (score > bestScore) {
      bestScore = score;
      best = tpl;
    }
  }

  if (best && bestScore >= 2) {
    return { template: best, score: bestScore, source: "user_template" };
  }

  for (const tpl of list) {
    const cats = BUILTIN_BY_CATEGORY[intent.category];
    if (!cats) continue;
    const triggers = normalizeTriggers(tpl);
    if (triggers.some((t) => cats.includes(t.toLowerCase()))) {
      return { template: tpl, score: 1, source: "category_hint" };
    }
  }

  return null;
}

function normalizeTriggers(tpl) {
  if (Array.isArray(tpl.triggers)) return tpl.triggers.map(String);
  if (typeof tpl.triggers === "string") {
    return tpl.triggers.split(/[,，|]/).map((s) => s.trim()).filter(Boolean);
  }
  if (tpl.name) return [String(tpl.name)];
  return [];
}
