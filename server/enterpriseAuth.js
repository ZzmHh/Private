import crypto from "node:crypto";
import { readDb, writeDb } from "./repositories/index.js";
import { createError } from "./lib/errors.js";
import { createToken, hashPassword, verifyPassword } from "./db.js";

const ENTERPRISE_ACCOUNT_TYPES = new Set(["enterprise_owner", "enterprise_member"]);

function normalizeLoginName(loginName) {
  return String(loginName || "").trim().toLowerCase();
}

function enterpriseOrgName() {
  return String(process.env.ENTERPRISE_ORG_NAME || "企业 AI 工作台").trim();
}

function isEnterpriseUser(user) {
  return Boolean(user && ENTERPRISE_ACCOUNT_TYPES.has(user.accountType));
}

export function sanitizeEnterpriseUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name || user.displayName || user.loginName,
    loginName: user.loginName,
    displayName: user.displayName || user.name || user.loginName,
    orgName: user.orgName || enterpriseOrgName(),
    orgId: user.orgId || process.env.ENTERPRISE_ORG_ID || "org_default",
    enterpriseRole: user.enterpriseRole || (user.accountType === "enterprise_owner" ? "owner" : "member"),
    enterpriseRoleLabel:
      user.enterpriseRoleLabel ||
      (user.accountType === "enterprise_owner" ? "主账号" : "子账号"),
    accountType: user.accountType,
    status: user.status || "active",
  };
}

export function ensureEnterpriseSeedAccounts() {
  const db = readDb();
  const hasEnterprise = db.users.some((user) => isEnterpriseUser(user));
  if (hasEnterprise) return;

  const orgName = enterpriseOrgName();
  const orgId = process.env.ENTERPRISE_ORG_ID || "org_default";
  const ownerLogin = normalizeLoginName(process.env.ENTERPRISE_OWNER_LOGIN || "admin");
  const ownerPassword = process.env.ENTERPRISE_OWNER_PASSWORD || "admin123";
  const now = new Date().toISOString();

  const owner = {
    id: `ent_${crypto.randomUUID()}`,
    accountType: "enterprise_owner",
    enterpriseRole: "owner",
    loginName: ownerLogin,
    name: "管理员",
    displayName: "管理员",
    orgName,
    orgId,
    status: "active",
    passwordHash: hashPassword(ownerPassword),
    tokenVersion: 0,
    createdAt: now,
    updatedAt: now,
  };

  db.users.push(owner);

  const memberLogin = normalizeLoginName(process.env.ENTERPRISE_DEMO_MEMBER_LOGIN || "ops001");
  const memberPassword = process.env.ENTERPRISE_DEMO_MEMBER_PASSWORD || "member123";
  if (memberLogin) {
    db.users.push({
      id: `ent_${crypto.randomUUID()}`,
      accountType: "enterprise_member",
      enterpriseRole: "member",
      loginName: memberLogin,
      name: "运营示例",
      displayName: "运营示例",
      orgName,
      status: "active",
      passwordHash: hashPassword(memberPassword),
      tokenVersion: 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  writeDb(db);
}

export function loginEnterpriseUser({ loginName, password }) {
  ensureEnterpriseSeedAccounts();

  const db = readDb();
  const normalized = normalizeLoginName(loginName);
  const user = db.users.find(
    (entry) => isEnterpriseUser(entry) && normalizeLoginName(entry.loginName) === normalized,
  );

  if (!user || !user.passwordHash) {
    throw createError("账号名或密码错误。", 401);
  }

  if (user.status === "disabled") {
    throw createError("该账号已停用，请联系管理员。", 403);
  }

  user.loginSecurity ||= { failedCount: 0, lockedUntil: null };
  if (user.loginSecurity.lockedUntil && Date.now() < new Date(user.loginSecurity.lockedUntil).getTime()) {
    throw createError("登录尝试过多，请稍后再试。", 429);
  }

  if (!verifyPassword(password, user.passwordHash)) {
    user.loginSecurity.failedCount = (user.loginSecurity.failedCount || 0) + 1;
    if (user.loginSecurity.failedCount >= 6) {
      user.loginSecurity.lockedUntil = new Date(Date.now() + 1000 * 60 * 15).toISOString();
    }
    writeDb(db);
    throw createError("账号名或密码错误。", 401);
  }

  user.loginSecurity = { failedCount: 0, lockedUntil: null };
  user.lastLoginAt = new Date().toISOString();
  writeDb(db);

  return user;
}

export function getEnterpriseUserById(userId) {
  const db = readDb();
  const user = db.users.find((entry) => entry.id === userId) || null;
  if (!isEnterpriseUser(user)) return null;
  if (user.status === "disabled") return null;
  return user;
}

export { isEnterpriseUser };
