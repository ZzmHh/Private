import { fetchJson } from "../../lib/fetchJson.js";

export const ENTERPRISE_TOKEN_KEY = "enterprise_token";

export function getStoredEnterpriseToken() {
  return localStorage.getItem(ENTERPRISE_TOKEN_KEY) || "";
}

export function setStoredEnterpriseToken(token) {
  if (token) {
    localStorage.setItem(ENTERPRISE_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(ENTERPRISE_TOKEN_KEY);
  }
}

export function enterpriseAuthHeaders(token = getStoredEnterpriseToken()) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function loginEnterprise({ loginName, password }) {
  const { response, data } = await fetchJson("/api/enterprise/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ loginName, password }),
  });

  if (!response.ok) {
    throw new Error(data.error || "登录失败，请检查账号名和密码。");
  }

  return data;
}

export async function fetchEnterpriseSession(token = getStoredEnterpriseToken()) {
  if (!token) return null;

  const { response, data } = await fetchJson("/api/enterprise/auth/me", {
    headers: enterpriseAuthHeaders(token),
  });

  if (!response.ok) {
    setStoredEnterpriseToken("");
    return null;
  }

  return data.user || null;
}

export function logoutEnterprise() {
  setStoredEnterpriseToken("");
}
