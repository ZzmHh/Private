import { fetchJson } from "../../lib/fetchJson.js";
import { enterpriseAuthHeaders } from "../auth/enterpriseAuth.js";

export async function fetchScopeOptions(mode = "workbench") {
  const { response, data } = await fetchJson(
    `/api/enterprise/scope/options?mode=${encodeURIComponent(mode)}`,
    { headers: enterpriseAuthHeaders() },
  );
  if (!response.ok) throw new Error(data.error || "无法加载经营范围。");
  return data;
}

export async function resolveWorkbenchScope(body) {
  const { response, data } = await fetchJson("/api/enterprise/scope/resolve", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...enterpriseAuthHeaders() },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(data.error || "店铺范围无效。");
  return data;
}

export const SCOPE_STORAGE_KEY = "enterprise_workbench_scope";

export function readStoredScope() {
  try {
    const raw = localStorage.getItem(SCOPE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeStoredScope(scope) {
  if (!scope) {
    localStorage.removeItem(SCOPE_STORAGE_KEY);
    return;
  }
  localStorage.setItem(SCOPE_STORAGE_KEY, JSON.stringify(scope));
}

export const CONSOLE_SCOPE_STORAGE_KEY = "enterprise_console_scope";

export function readStoredConsoleView() {
  return localStorage.getItem(CONSOLE_SCOPE_STORAGE_KEY) || "";
}

export function writeStoredConsoleView(viewId) {
  if (!viewId) localStorage.removeItem(CONSOLE_SCOPE_STORAGE_KEY);
  else localStorage.setItem(CONSOLE_SCOPE_STORAGE_KEY, viewId);
}
