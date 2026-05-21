import {
  CS_TEMPLATE_LANGS,
  DEFAULT_AFTER_SALES_TEMPLATES,
  DEFAULT_GREETING_TEMPLATES,
  DEFAULT_SLA_DAY_BY_LANG,
  DEFAULT_SLA_NIGHT_BY_LANG,
} from "./csBuiltinTemplates.js";
import { normalizeFaqLang } from "../../shared/tiktokShopLanguages.js";

function copyTemplateMap(defaults, overrides = {}) {
  const out = { ...defaults };
  if (!overrides || typeof overrides !== "object") return out;
  for (const [key, val] of Object.entries(overrides)) {
    const lang = normalizeFaqLang(key);
    if (lang && typeof val === "string" && val.trim()) out[lang] = val.trim().slice(0, 4000);
  }
  return out;
}

export function defaultCsAutomationSettings() {
  return {
    restStartHour: 23,
    restEndHour: 9,
    nightAiEnabled: true,
    extensionAutoSendFaq: true,
    extensionAutoSendAfterSales: true,
    extensionAutoClickSend: true,
    afterSalesTemplates: { ...DEFAULT_AFTER_SALES_TEMPLATES },
    greetingTemplates: { ...DEFAULT_GREETING_TEMPLATES },
    slaDayByLang: { ...DEFAULT_SLA_DAY_BY_LANG },
    slaNightByLang: { ...DEFAULT_SLA_NIGHT_BY_LANG },
  };
}

export function normalizeCsAutomationSettings(raw = {}) {
  const base = defaultCsAutomationSettings();
  const merged = { ...base, ...raw };

  merged.afterSalesTemplates = copyTemplateMap(DEFAULT_AFTER_SALES_TEMPLATES, merged.afterSalesTemplates);
  merged.greetingTemplates = copyTemplateMap(DEFAULT_GREETING_TEMPLATES, merged.greetingTemplates);
  merged.slaDayByLang = copyTemplateMap(DEFAULT_SLA_DAY_BY_LANG, merged.slaDayByLang);
  merged.slaNightByLang = copyTemplateMap(DEFAULT_SLA_NIGHT_BY_LANG, merged.slaNightByLang);

  if (raw.afterSalesTemplateZh) merged.afterSalesTemplates.zh = String(raw.afterSalesTemplateZh).slice(0, 4000);
  if (raw.afterSalesTemplateEn) merged.afterSalesTemplates.en = String(raw.afterSalesTemplateEn).slice(0, 4000);
  if (raw.greetingTemplateZh) merged.greetingTemplates.zh = String(raw.greetingTemplateZh).slice(0, 4000);
  if (raw.greetingTemplateEn) merged.greetingTemplates.en = String(raw.greetingTemplateEn).slice(0, 4000);
  if (raw.daySlaZh) merged.slaDayByLang.zh = String(raw.daySlaZh).slice(0, 200);
  if (raw.daySlaEn) merged.slaDayByLang.en = String(raw.daySlaEn).slice(0, 200);
  if (raw.nightSlaZh) merged.slaNightByLang.zh = String(raw.nightSlaZh).slice(0, 200);
  if (raw.nightSlaEn) merged.slaNightByLang.en = String(raw.nightSlaEn).slice(0, 200);

  delete merged.afterSalesTemplateZh;
  delete merged.afterSalesTemplateEn;
  delete merged.greetingTemplateZh;
  delete merged.greetingTemplateEn;
  delete merged.daySlaZh;
  delete merged.daySlaEn;
  delete merged.nightSlaZh;
  delete merged.nightSlaEn;

  return merged;
}

export function listCsTemplateLangs() {
  return CS_TEMPLATE_LANGS;
}
