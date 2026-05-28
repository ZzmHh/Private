import { ENT_AGENTS, ENT_EXTENSION, ENT_METRICS, entAuthHeaders, entFetch, entShopQuery } from "../lib/enterpriseHttp.js";

export function authHeaders() {
  return entAuthHeaders();
}

export function formatRelativeTime(iso) {
  if (!iso) return "—";
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "刚刚";
    if (mins < 60) return `${mins} 分钟前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} 小时前`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} 天前`;
    return new Date(iso).toLocaleDateString("zh-CN");
  } catch {
    return iso;
  }
}

export function formatError(error) {
  return error?.message || String(error || "操作失败");
}

/** @param {string} [shopId] */
export async function fetchWorkspaceSummary(shopId) {
  const data = await entFetch(
    `${ENT_EXTENSION}/workspace-summary${entShopQuery(shopId, { platform: "tiktok" })}`,
  );
  return data.summary;
}

/** @param {string} [shopId] */
export async function fetchMetricsLatest(shopId) {
  const data = await entFetch(`${ENT_METRICS}/latest${entShopQuery(shopId)}`);
  return data.latest || null;
}

/** @param {string} agentId @param {string} input @param {string} [shopId] @param {object} [extra] */
export async function runExtensionAnalyze(agentId, input, shopId, extra = {}) {
  return entFetch(
    `${ENT_EXTENSION}/analyze`,
    {
      method: "POST",
      body: JSON.stringify({
        agentId,
        input,
        platform: "tiktok",
        includeSnapshots: true,
        shopId,
        ...extra,
      }),
    },
    shopId,
  );
}

/** @param {File} file @param {string} [shopId] */
export async function importMetricsCsv(file, shopId) {
  const csvText = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsText(file, "UTF-8");
  });
  return entFetch(
    `${ENT_METRICS}/import`,
    {
      method: "POST",
      body: JSON.stringify({ csvText, label: file.name, shopId }),
    },
    shopId,
  );
}
