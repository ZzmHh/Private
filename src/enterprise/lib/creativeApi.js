import { entFetch } from "./enterpriseHttp.js";

const CREATIVE = "/api/enterprise/creative";

export async function fetchCreativeStatus() {
  return entFetch(`${CREATIVE}/status`);
}

/** @param {object} payload */
export async function submitVideoTask(payload) {
  const data = await entFetch(`${CREATIVE}/video/tasks`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.task;
}

/** @param {string} taskId */
export async function pollVideoTask(taskId) {
  const data = await entFetch(`${CREATIVE}/video/tasks/${encodeURIComponent(taskId)}`);
  return data.task;
}

/** @param {object} payload */
export async function generateImage(payload) {
  const data = await entFetch(`${CREATIVE}/image/generate`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.result;
}

/** @param {File} file */
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const TERMINAL = new Set(["succeeded", "success", "completed", "failed", "cancelled", "canceled"]);

/**
 * @param {string} taskId
 * @param {{ intervalMs?: number, maxAttempts?: number, onProgress?: (task: object) => void }} [opts]
 */
export async function waitForVideoTask(taskId, opts = {}) {
  const intervalMs = opts.intervalMs ?? 5000;
  const maxAttempts = opts.maxAttempts ?? 120;
  for (let i = 0; i < maxAttempts; i++) {
    const task = await pollVideoTask(taskId);
    opts.onProgress?.(task);
    const st = String(task.status || "").toLowerCase();
    if (st === "succeeded" || st === "success" || st === "completed") return task;
    if (st === "failed" || st === "cancelled" || st === "canceled") {
      throw new Error(task.error || "视频生成失败");
    }
    if (!TERMINAL.has(st)) {
      await new Promise((r) => setTimeout(r, intervalMs));
      continue;
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error("视频生成超时，请稍后用任务 ID 手动查询。");
}

/** @param {string} agentId @param {string} input */
export async function runEnterpriseAgent(agentId, input) {
  return entFetch("/api/enterprise/agents/run", {
    method: "POST",
    body: JSON.stringify({ agentId, input }),
  });
}
