/**
 * 北京时间 · 卖家休息时段与 SLA 文案
 */

export function getBeijingDateParts(date = new Date()) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Shanghai",
    hour: "numeric",
    hour12: false,
    weekday: "short",
  });
  const parts = fmt.formatToParts(date);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  return { hour, weekday: parts.find((p) => p.type === "weekday")?.value };
}

/** 默认 23:00–09:00 北京时间视为休息 */
export function isBeijingRestHours(settings = {}, date = new Date()) {
  const start = Number(settings.restStartHour ?? 23);
  const end = Number(settings.restEndHour ?? 9);
  const { hour } = getBeijingDateParts(date);

  if (start === end) return false;
  if (start > end) {
    return hour >= start || hour < end;
  }
  return hour >= start && hour < end;
}

export function getSlaText({ lang = "zh", beijingNight = false, settings = {} } = {}) {
  if (lang === "zh") {
    return beijingNight
      ? String(settings.nightSlaZh || "9 小时内")
      : String(settings.daySlaZh || "2 小时内");
  }
  return beijingNight
    ? String(settings.nightSlaEn || "within 9 hours")
    : String(settings.daySlaEn || "within 2 hours");
}

export function applyTemplateVars(text, vars = {}) {
  let out = String(text || "");
  for (const [k, v] of Object.entries(vars)) {
    out = out.replace(new RegExp(`\\{${k}\\}`, "g"), String(v ?? ""));
  }
  return out;
}
