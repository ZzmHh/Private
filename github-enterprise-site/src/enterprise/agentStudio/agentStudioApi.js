import { ENT_AGENTS, entAuthHeaders } from "../lib/enterpriseHttp.js";

export function authHeaders() {
  return entAuthHeaders();
}

export function formatError(error) {
  return error?.message || String(error || "操作失败");
}

export async function runListingContentAgent(agentId, input) {
  const response = await fetch(`${ENT_AGENTS}/run`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ agentId, input }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "生成失败");
  return data;
}

export function buildAgentInput(studio, tool, shared, toolValues) {
  const lines = [
    `【任务模块】${tool.name}`,
    tool.taskInstruction || "",
    "",
    "—— 商品上下文 ——",
  ];
  for (const f of studio.sharedFields || []) {
    const v = shared[f.key]?.trim?.();
    if (v) lines.push(`${f.label}：${v}`);
  }
  for (const f of tool.toolFields || []) {
    const v = toolValues[f.key]?.trim?.();
    if (v) lines.push(`${f.label}：${v}`);
  }
  lines.push("", "请按模块要求输出结构化结果，便于卖家直接复制使用。");
  return lines.filter((l) => l !== undefined).join("\n");
}

export function defaultSharedValues(studio) {
  const out = { notes: "" };
  for (const f of studio.sharedFields || []) {
    out[f.key] = f.default ?? (f.type === "select" ? f.options?.[0]?.value ?? f.options?.[0] : "");
  }
  return out;
}

export function defaultToolValues(tool) {
  const out = {};
  for (const f of tool?.toolFields || []) {
    out[f.key] = f.default ?? (f.type === "select" ? f.options?.[0]?.value ?? f.options?.[0] : "");
  }
  return out;
}
