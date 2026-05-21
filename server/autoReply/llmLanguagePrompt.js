import { getLanguageLabel, getLanguageMeta } from "../../shared/tiktokShopLanguages.js";

/** LLM 系统提示：与 FAQ 一致的 13 种站点语言策略 */
export function buildCsReplyLanguageRule(langCode) {
  const code = String(langCode || "en").trim() || "en";
  const meta = getLanguageMeta(code);
  const label = getLanguageLabel(code, { zh: false });
  return `- 买家消息语言码为「${code}」。你必须用 ${label}${meta ? `（${meta.labelZh}）` : ""} 撰写回复正文，不要擅自改成中文或英文，除非买家语言就是 zh/en。`;
}

export function buildCsReplyUserLanguageLine(langCode) {
  const code = String(langCode || "en").trim() || "en";
  const label = getLanguageLabel(code, { zh: true });
  return `【语言】请严格使用：${label}（语言码 ${code}）`;
}
