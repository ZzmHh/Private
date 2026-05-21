import crypto from "node:crypto";
import { readDb, writeDb } from "./repositories/index.js";
import { getProductAnalytics } from "./productEvents.js";
import { createError } from "./lib/errors.js";

export { createError };

const isProduction = process.env.NODE_ENV === "production";
const tokenSecret = process.env.JWT_SECRET || (!isProduction ? process.env.OPENCLAW_API_KEY || "local-dev-secret" : "");

if (!tokenSecret) {
  throw new Error("生产环境必须配置 JWT_SECRET，不能使用默认登录密钥。");
}

const EARLY_BIRD_END_MS = new Date(process.env.EARLY_BIRD_END || "2026-08-31T23:59:59.999Z").getTime();
const EARLY_BIRD_MAX_SLOTS = Number(process.env.EARLY_BIRD_MAX_SLOTS || 100);
const AGENTS_ALL = ["trend", "content", "listing", "growth", "service", "profit"];
const AGENTS_BASIC = ["trend", "content", "listing"];
const PURCHASABLE_PLAN_IDS = new Set(["growth", "pro", "team"]);

const plans = {
  free: {
    name: "免费版",
    price: 0,
    purchasable: false,
    dailyLimit: 8,
    minuteLimit: 6,
    maxTokens: 1200,
    features: {
      agents: AGENTS_BASIC,
      autopilot: false,
      scraper: false,
      storeApiAgents: true,
      extensionAutoSend: false,
      csvImport: false,
      historyLimit: 15,
      shopLimit: 1,
    },
  },
  growth: {
    name: "成长版",
    price: 149,
    purchasable: true,
    dailyLimit: 120,
    minuteLimit: 15,
    maxTokens: 1600,
    features: {
      agents: AGENTS_ALL,
      autopilot: false,
      scraper: false,
      storeApiAgents: true,
      extensionAutoSend: true,
      csvImport: false,
      historyLimit: 50,
      shopLimit: 1,
    },
  },
  pro: {
    name: "专业版",
    price: 349,
    priceEarlyBird: 299,
    earlyBirdEligible: true,
    purchasable: true,
    dailyLimit: 500,
    minuteLimit: 30,
    maxTokens: 2200,
    features: {
      agents: AGENTS_ALL,
      autopilot: true,
      scraper: true,
      storeApiAgents: true,
      extensionAutoSend: true,
      csvImport: true,
      historyLimit: 100,
      shopLimit: 3,
    },
  },
  team: {
    name: "团队版",
    price: 799,
    priceEarlyBird: 699,
    earlyBirdEligible: true,
    purchasable: true,
    dailyLimit: 2000,
    minuteLimit: 80,
    maxTokens: 3200,
    features: {
      agents: AGENTS_ALL,
      autopilot: true,
      scraper: true,
      storeApiAgents: true,
      extensionAutoSend: true,
      csvImport: true,
      historyLimit: 500,
      shopLimit: 99,
      multiStore: true,
      weeklyReport: true,
      prioritySupport: true,
    },
  },
  /** @deprecated 旧账号 3 天试用（新注册已改为 free + 7 天专业体验） */
  trial: {
    name: "试用版",
    price: 0,
    purchasable: false,
    dailyLimit: 48,
    minuteLimit: 10,
    maxTokens: 1600,
    trialTotalCallCap: 100,
    trialAutopilotPerDay: 4,
    trialScrapePerDay: 6,
    features: {
      agents: AGENTS_ALL,
      autopilot: true,
      scraper: true,
      storeApiAgents: true,
      extensionAutoSend: true,
      csvImport: true,
      historyLimit: 40,
      shopLimit: 1,
    },
  },
  /** @deprecated 旧尝鲜版 */
  starter: {
    name: "尝鲜版",
    price: 99,
    purchasable: false,
    dailyLimit: 100,
    minuteLimit: 12,
    maxTokens: 1400,
    features: {
      agents: AGENTS_BASIC,
      autopilot: false,
      scraper: false,
      storeApiAgents: false,
      extensionAutoSend: false,
      csvImport: false,
      historyLimit: 30,
      shopLimit: 1,
    },
  },
  /** @deprecated 旧标准版 */
  standard: {
    name: "标准版",
    price: 299,
    purchasable: false,
    dailyLimit: 500,
    minuteLimit: 30,
    maxTokens: 2200,
    features: {
      agents: AGENTS_ALL,
      autopilot: true,
      scraper: true,
      storeApiAgents: true,
      extensionAutoSend: true,
      csvImport: true,
      historyLimit: 100,
      shopLimit: 3,
    },
  },
  /** @deprecated 旧全托版 */
  managed: {
    name: "全托版",
    price: 899,
    purchasable: false,
    dailyLimit: 2000,
    minuteLimit: 80,
    maxTokens: 3200,
    features: {
      agents: AGENTS_ALL,
      autopilot: true,
      scraper: true,
      storeApiAgents: true,
      extensionAutoSend: true,
      csvImport: true,
      historyLimit: 500,
      shopLimit: 99,
      multiStore: true,
      weeklyReport: true,
    },
  },
  enterprise: {
    name: "企业版",
    price: "定制",
    purchasable: false,
    dailyLimit: 10000,
    minuteLimit: 200,
    maxTokens: 5000,
    features: {
      agents: AGENTS_ALL,
      autopilot: true,
      scraper: true,
      storeApiAgents: true,
      extensionAutoSend: true,
      csvImport: true,
      historyLimit: 2000,
      shopLimit: 999,
      multiStore: true,
      weeklyReport: true,
      privateDeploy: true,
    },
  },
};

function countEarlyBirdLocks(db) {
  return db.users.filter((u) => u.earlyBirdLocked?.pro || u.earlyBirdLocked?.team).length;
}

function isEarlyBirdOpen(db) {
  if (Date.now() > EARLY_BIRD_END_MS) return false;
  return countEarlyBirdLocks(db) < EARLY_BIRD_MAX_SLOTS;
}

export function resolvePlanCheckoutPrice(planId, user, db = readDb()) {
  const plan = plans[planId];
  if (!plan || typeof plan.price !== "number") throw createError("请选择有效套餐。", 400);
  if (user?.earlyBirdLocked?.[planId] && plan.priceEarlyBird) return plan.priceEarlyBird;
  if (plan.priceEarlyBird && plan.earlyBirdEligible && isEarlyBirdOpen(db)) return plan.priceEarlyBird;
  return plan.price;
}

function isProTrialActive(user) {
  return Boolean(user?.proTrialEndsAt && Date.now() < new Date(user.proTrialEndsAt).getTime());
}

function resolveEffectivePlanId(user) {
  if (isSubscriptionActive(user)) {
    const paid = user.plan;
    if (paid && plans[paid] && paid !== "free") return paid;
  }
  if (isProTrialActive(user)) return "pro";
  if (user?.plan === "trial" && isTrialActive(user)) return "pro";
  return "free";
}

function newUserProTrialEndsAt(from = new Date()) {
  return new Date(from.getTime() + 1000 * 60 * 60 * 24 * 7).toISOString();
}

function base64url(input) {
  return Buffer.from(input).toString("base64url");
}

function sign(payload) {
  return crypto.createHmac("sha256", tokenSecret).update(payload).digest("base64url");
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, hash] = storedHash.split(":");
  return hashPassword(password, salt) === `${salt}:${hash}`;
}

function createVerificationCode() {
  return String(crypto.randomInt(100000, 1000000));
}

function hashVerificationCode(email, code, purpose = "email") {
  return crypto.createHmac("sha256", tokenSecret).update(`${purpose}:${email}:${code}`).digest("hex");
}

function isConfiguredAdminEmail(email) {
  const raw = String(process.env.ADMIN_EMAILS || "").trim();
  if (!raw) return false;
  const list = raw
    .split(/[,;]+/g)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(String(email || "").trim().toLowerCase());
}

/** 对外：管理员 = 库内标记 .env 白名单 任一满足（无需仅依赖启动时同步） */
export function effectiveIsAdmin(user) {
  if (!user) return false;
  return Boolean(user.isAdmin || isConfiguredAdminEmail(user.email));
}

function promoteAdminIfConfigured(user) {
  if (!user || !isConfiguredAdminEmail(user.email) || user.isAdmin) return false;
  user.isAdmin = true;
  return true;
}

function attachEmailVerification(user, now = new Date()) {
  const code = createVerificationCode();
  const expiresAt = new Date(now.getTime() + 1000 * 60 * 10);

  user.emailVerified = false;
  user.emailVerification = {
    codeHash: hashVerificationCode(user.email, code, "email"),
    expiresAt: expiresAt.toISOString(),
    sentAt: now.toISOString(),
    attempts: 0,
  };

  return code;
}

function attachPasswordReset(user, now = new Date()) {
  const code = createVerificationCode();
  const expiresAt = new Date(now.getTime() + 1000 * 60 * 10);

  user.passwordReset = {
    codeHash: hashVerificationCode(user.email, code, "password-reset"),
    expiresAt: expiresAt.toISOString(),
    sentAt: now.toISOString(),
    attempts: 0,
  };

  return code;
}

function isTrialActive(user) {
  return Boolean(user.trialEndsAt && Date.now() < new Date(user.trialEndsAt).getTime());
}

function isSubscriptionActive(user) {
  return Boolean(user.subscriptionEndsAt && Date.now() < new Date(user.subscriptionEndsAt).getTime());
}

export function getPlan(user) {
  const key = resolveEffectivePlanId(user);
  return plans[key] || plans.free;
}

function assertUserCanUsePlan(_user) {
  // 免费版永久可用（按日限额）；专业体验 / 付费在 getPlan 中体现更高额度
  return;
}

function maskToken(token = "") {
  if (!token) return "";
  if (token.length <= 8) return "********";
  return `${token.slice(0, 4)}****${token.slice(-4)}`;
}

export function createToken(user) {
  const payload = base64url(
    JSON.stringify({
      sub: user.id,
      email: user.email,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
    }),
  );
  return `${payload}.${sign(payload)}`;
}

export function verifyToken(token) {
  if (!token || !token.includes(".")) return null;
  const [payload, signature] = token.split(".");

  if (sign(payload) !== signature) return null;

  const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  if (decoded.exp < Date.now()) return null;

  return decoded;
}

export function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash, emailVerification, passwordReset, loginSecurity, registrationPending, ...safeUser } = user;
  const effectivePlanId = resolveEffectivePlanId(user);
  const plan = getPlan(user);
  const today = new Date().toISOString().slice(0, 10);
  const legacyTrialPlan = plans.trial;
  const usageToday = user.usage?.[today] || {};
  const proTrialActive = isProTrialActive(user);
  const legacyTrialActive = user.plan === "trial" && isTrialActive(user);
  const trialEndingSoon =
    (proTrialActive || legacyTrialActive) &&
    (proTrialActive
      ? new Date(user.proTrialEndsAt).getTime() - Date.now() < 24 * 60 * 60 * 1000
      : user.trialEndsAt && new Date(user.trialEndsAt).getTime() - Date.now() < 24 * 60 * 60 * 1000);

  const earlyBird = {
    pro: { list: plans.pro.price, earlyBird: plans.pro.priceEarlyBird, locked: Boolean(user.earlyBirdLocked?.pro) },
    team: { list: plans.team.price, earlyBird: plans.team.priceEarlyBird, locked: Boolean(user.earlyBirdLocked?.team) },
    open: isEarlyBirdOpen(readDb()),
    endsAt: new Date(EARLY_BIRD_END_MS).toISOString(),
  };

  return {
    ...safeUser,
    emailVerified: user.emailVerified !== false,
    effectivePlanId,
    proTrialActive,
    trialActive: proTrialActive || legacyTrialActive,
    subscriptionActive: isSubscriptionActive(user),
    accessActive: true,
    planName: proTrialActive ? "专业版体验" : plan.name,
    planFeatures: plan.features,
    dailyLimit: plan.dailyLimit,
    minuteLimit: plan.minuteLimit,
    maxTokens: plan.maxTokens,
    isAdmin: effectiveIsAdmin(user),
    trialEndingSoon,
    earlyBird,
    trialQuota:
      legacyTrialActive
        ? {
            lifetimeUsed: user.trialLifetimeTotal || 0,
            lifetimeCap: legacyTrialPlan.trialTotalCallCap,
            todayTotal: usageToday.total || 0,
            todayDailyCap: legacyTrialPlan.dailyLimit,
            autopilotToday: usageToday.autopilot || 0,
            autopilotCap: legacyTrialPlan.trialAutopilotPerDay,
            scrapeToday: usageToday.scrape || 0,
            scrapeCap: legacyTrialPlan.trialScrapePerDay,
          }
        : proTrialActive
          ? {
              todayTotal: usageToday.total || 0,
              todayDailyCap: plan.dailyLimit,
              label: "专业版 7 日体验",
            }
          : effectivePlanId === "free"
            ? {
                todayTotal: usageToday.total || 0,
                todayDailyCap: plan.dailyLimit,
                label: "免费版每日额度",
              }
            : null,
  };
}

/**
 * 注册第一步：仅邮箱，创建「待完成」账号并发送验证码（邮件内 6 位数字）。
 */
export function startRegistrationEmail(email) {
  const db = readDb();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) throw createError("请填写邮箱。", 400);

  const existingUser = db.users.find((user) => user.email === normalizedEmail);
  const now = new Date();

  if (existingUser) {
    if (existingUser.emailVerified !== false) {
      throw createError("该邮箱已注册，请直接登录。", 409);
    }
    const verificationCode = attachEmailVerification(existingUser, now);
    writeDb(db);
    return { user: existingUser, verificationCode };
  }

  const user = {
    id: crypto.randomUUID(),
    name: "跨境卖家",
    storeName: "",
    email: normalizedEmail,
    passwordHash: "",
    registrationPending: true,
    plan: "free",
    proTrialStartedAt: now.toISOString(),
    proTrialEndsAt: newUserProTrialEndsAt(now),
    trialStartedAt: null,
    trialEndsAt: null,
    subscriptionEndsAt: null,
    usage: {},
    trialLifetimeTotal: 0,
    loginSecurity: { failedCount: 0, lockedUntil: null },
    emailVerified: false,
    isAdmin: db.users.length === 0 || isConfiguredAdminEmail(normalizedEmail),
    createdAt: now.toISOString(),
  };
  const verificationCode = attachEmailVerification(user, now);
  db.users.push(user);
  writeDb(db);
  return { user, verificationCode };
}

/**
 * 注册第二步：校验邮箱验证码并设置密码与资料，激活账号。
 */
export function completeRegistrationWithCode({ email, code, password, name, storeName }) {
  const db = readDb();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedCode = String(code || "").trim();
  const user = db.users.find((entry) => entry.email === normalizedEmail);

  if (!user) throw createError("请先发送验证码。", 404);
  if (user.emailVerified !== false) {
    throw createError("该邮箱已注册，请直接登录。", 409);
  }
  if (!password || String(password).length < 6) {
    throw createError("密码至少 6 位。", 400);
  }
  if (!/^\d{6}$/.test(normalizedCode)) throw createError("请输入 6 位邮箱验证码。", 400);

  const verification = user.emailVerification;
  if (!verification?.codeHash || Date.now() > new Date(verification.expiresAt).getTime()) {
    throw createError("验证码已过期，请重新发送。", 410);
  }

  verification.attempts = (verification.attempts || 0) + 1;
  if (verification.attempts > 6) {
    writeDb(db);
    throw createError("验证码错误次数过多，请重新发送验证码。", 429);
  }

  if (verification.codeHash !== hashVerificationCode(normalizedEmail, normalizedCode, "email")) {
    writeDb(db);
    throw createError("验证码不正确，请检查邮箱后重试。", 400);
  }

  user.passwordHash = hashPassword(password);
  user.name = name?.trim() || user.name || "跨境卖家";
  user.storeName = storeName?.trim() || "";
  user.emailVerified = true;
  user.emailVerifiedAt = new Date().toISOString();
  delete user.emailVerification;
  if (user.registrationPending) delete user.registrationPending;
  promoteAdminIfConfigured(user);
  writeDb(db);
  return user;
}

export function registerUser({ name, storeName, email, password }) {
  const db = readDb();
  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = db.users.find((user) => user.email === normalizedEmail);

  if (existingUser?.emailVerified !== false) {
    throw createError("该邮箱已经注册。", 409);
  }

  const now = new Date();
  if (existingUser) {
    existingUser.name = name || existingUser.name || "跨境卖家";
    existingUser.storeName = storeName || existingUser.storeName || "";
    existingUser.passwordHash = hashPassword(password);
    delete existingUser.registrationPending;
    const verificationCode = attachEmailVerification(existingUser, now);
    writeDb(db);
    return { user: existingUser, verificationCode };
  }

  const user = {
    id: crypto.randomUUID(),
    name: name || "跨境卖家",
    storeName: storeName || "",
    email: normalizedEmail,
    passwordHash: hashPassword(password),
    plan: "free",
    proTrialStartedAt: now.toISOString(),
    proTrialEndsAt: newUserProTrialEndsAt(now),
    trialStartedAt: null,
    trialEndsAt: null,
    subscriptionEndsAt: null,
    usage: {},
    trialLifetimeTotal: 0,
    loginSecurity: { failedCount: 0, lockedUntil: null },
    emailVerified: false,
    isAdmin: db.users.length === 0 || isConfiguredAdminEmail(normalizedEmail),
    createdAt: now.toISOString(),
  };
  const verificationCode = attachEmailVerification(user, now);

  db.users.push(user);
  writeDb(db);
  return { user, verificationCode };
}

export function loginUser({ email, password }) {
  const db = readDb();
  const normalizedEmail = email.trim().toLowerCase();
  const user = db.users.find((entry) => entry.email === normalizedEmail);

  if (!user) {
    throw createError("邮箱或密码错误。", 401);
  }

  if (user.registrationPending || !user.passwordHash) {
    throw createError("该邮箱注册尚未完成，请先完成验证码与密码设置。", 403, "REGISTRATION_INCOMPLETE");
  }

  user.loginSecurity ||= { failedCount: 0, lockedUntil: null };
  if (user.loginSecurity.lockedUntil && Date.now() < new Date(user.loginSecurity.lockedUntil).getTime()) {
    throw createError("登录失败次数过多，请 15 分钟后再试。", 429, "LOGIN_LOCKED");
  }

  if (!verifyPassword(password, user.passwordHash)) {
    user.loginSecurity.failedCount = (user.loginSecurity.failedCount || 0) + 1;
    if (user.loginSecurity.failedCount >= 6) {
      user.loginSecurity.lockedUntil = new Date(Date.now() + 1000 * 60 * 15).toISOString();
    }
    writeDb(db);
    throw createError("邮箱或密码错误。", 401);
  }

  user.loginSecurity = { failedCount: 0, lockedUntil: null };
  user.lastLoginAt = new Date().toISOString();
  writeDb(db);

  if (user.emailVerified === false) {
    throw createError("请先完成邮箱验证后再登录。", 403, "EMAIL_NOT_VERIFIED");
  }

  promoteAdminIfConfigured(user);
  writeDb(db);

  return user;
}

export function verifyEmailCode({ email, code }) {
  const db = readDb();
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedCode = String(code || "").trim();
  const user = db.users.find((entry) => entry.email === normalizedEmail);

  if (!user) throw createError("账号不存在，请重新注册。", 404);
  if (user.registrationPending) {
    throw createError("请返回注册页，填写验证码、密码与资料后点击「完成注册」。", 400);
  }
  if (user.emailVerified !== false) return user;
  if (!/^\d{6}$/.test(normalizedCode)) throw createError("请输入 6 位邮箱验证码。", 400);

  const verification = user.emailVerification;
  if (!verification?.codeHash || Date.now() > new Date(verification.expiresAt).getTime()) {
    throw createError("验证码已过期，请重新发送。", 410);
  }

  verification.attempts = (verification.attempts || 0) + 1;
  if (verification.attempts > 6) {
    writeDb(db);
    throw createError("验证码错误次数过多，请重新发送验证码。", 429);
  }

  if (verification.codeHash !== hashVerificationCode(normalizedEmail, normalizedCode, "email")) {
    writeDb(db);
    throw createError("验证码不正确，请检查邮箱后重试。", 400);
  }

  user.emailVerified = true;
  user.emailVerifiedAt = new Date().toISOString();
  delete user.emailVerification;
  promoteAdminIfConfigured(user);
  writeDb(db);
  return user;
}

export function resendEmailVerification(email) {
  const db = readDb();
  const normalizedEmail = email.trim().toLowerCase();
  const user = db.users.find((entry) => entry.email === normalizedEmail);

  if (!user) throw createError("账号不存在，请先注册。", 404);
  if (user.emailVerified !== false) throw createError("该邮箱已完成验证，请直接登录。", 409);

  const verificationCode = attachEmailVerification(user);
  writeDb(db);
  return { user, verificationCode };
}

export function requestPasswordReset(email) {
  const db = readDb();
  const normalizedEmail = email.trim().toLowerCase();
  const user = db.users.find((entry) => entry.email === normalizedEmail);

  if (!user) throw createError("该邮箱未注册。", 404);

  const resetCode = attachPasswordReset(user);
  writeDb(db);
  return { user, resetCode };
}

export function resetPassword({ email, code, password }) {
  const db = readDb();
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedCode = String(code || "").trim();
  const user = db.users.find((entry) => entry.email === normalizedEmail);

  if (!user) throw createError("该邮箱未注册。", 404);
  if (!/^\d{6}$/.test(normalizedCode)) throw createError("请输入 6 位验证码。", 400);

  const reset = user.passwordReset;
  if (!reset?.codeHash || Date.now() > new Date(reset.expiresAt).getTime()) {
    throw createError("重置验证码已过期，请重新发送。", 410);
  }

  reset.attempts = (reset.attempts || 0) + 1;
  if (reset.attempts > 6) {
    writeDb(db);
    throw createError("验证码错误次数过多，请重新发送。", 429);
  }

  if (reset.codeHash !== hashVerificationCode(normalizedEmail, normalizedCode, "password-reset")) {
    writeDb(db);
    throw createError("验证码不正确，请检查后重试。", 400);
  }

  user.passwordHash = hashPassword(password);
  user.loginSecurity = { failedCount: 0, lockedUntil: null };
  delete user.passwordReset;
  writeDb(db);
  return user;
}

export function getUserById(userId) {
  const db = readDb();
  return db.users.find((user) => user.id === userId) || null;
}

export function incrementUsage(userId, type) {
  const db = readDb();
  const user = db.users.find((entry) => entry.id === userId);

  if (!user) throw createError("用户不存在。", 401);
  assertUserCanUsePlan(user);

  const today = new Date().toISOString().slice(0, 10);
  const plan = getPlan(user);
  const now = Date.now();
  const recentMinuteTotal = db.usageLogs.filter((log) => log.userId === userId && now - new Date(log.createdAt).getTime() < 60000).length;

  if (recentMinuteTotal >= plan.minuteLimit) {
    throw createError(`调用过于频繁，${plan.name} 每分钟最多 ${plan.minuteLimit} 次。`, 429);
  }

  user.usage ||= {};
  const todayUsage = user.usage[today] || { total: 0 };

  if (user.plan === "trial" && isTrialActive(user)) {
    const t = plans.trial;
    const lifeCap = t.trialTotalCallCap ?? 99999;
    const lifeUsed = user.trialLifetimeTotal || 0;
    if (lifeUsed >= lifeCap) {
      throw createError(`试用期内总调用次数已达 ${lifeCap} 次，请订阅后继续。`, 429, "TRIAL_LIFETIME_CAP");
    }
    if (type === "autopilot" && (todayUsage.autopilot || 0) >= (t.trialAutopilotPerDay ?? 99)) {
      throw createError(
        `试用期内「5 Agent 运营」每日最多 ${t.trialAutopilotPerDay} 次，请明日再试或订阅解锁更高额度。`,
        429,
        "TRIAL_AUTOPILOT_CAP",
      );
    }
    if (type === "scrape" && (todayUsage.scrape || 0) >= (t.trialScrapePerDay ?? 99)) {
      throw createError(
        `试用期内「公开页参考抓取」每日最多 ${t.trialScrapePerDay} 次，请明日再试或订阅解锁更高额度。`,
        429,
        "TRIAL_SCRAPE_CAP",
      );
    }
  }

  user.usage[today] = todayUsage;
  user.usage[today].total = (user.usage[today].total || 0) + 1;
  user.usage[today][type] = (user.usage[today][type] || 0) + 1;

  if (user.usage[today].total > plan.dailyLimit) {
    throw createError(`今日调用次数已达到 ${plan.name} 上限。`, 429);
  }

  if (user.plan === "trial" && isTrialActive(user)) {
    user.trialLifetimeTotal = (user.trialLifetimeTotal || 0) + 1;
  }

  const usageLog = {
    id: crypto.randomUUID(),
    userId,
    userEmail: user.email,
    type,
    status: "started",
    createdAt: new Date().toISOString(),
  };
  db.usageLogs.unshift(usageLog);
  db.usageLogs = db.usageLogs.slice(0, 5000);

  writeDb(db);
  return {
    logId: usageLog.id,
    usage: user.usage[today],
    limit: plan.dailyLimit,
    minuteLimit: plan.minuteLimit,
    maxTokens: plan.maxTokens,
  };
}

export function finalizeUsageLog(logId, patch = {}) {
  const db = readDb();
  const log = db.usageLogs.find((entry) => entry.id === logId);

  if (log) {
    Object.assign(log, patch, {
      finishedAt: new Date().toISOString(),
      durationMs: patch.startedAt ? Date.now() - patch.startedAt : patch.durationMs,
    });
    writeDb(db);
  }
}

export function ensureFeatureAccess(user, feature, detail) {
  assertUserCanUsePlan(user);
  const plan = getPlan(user);
  const features = plan.features;

  if (feature === "agent" && !features.agents.includes(detail)) {
    throw createError("当前套餐不支持该 Agent，请升级到成长版或专业版。", 403);
  }

  if (feature === "autopilot" && !features.autopilot) {
    throw createError("当前套餐不支持 5 Agent 运营一键生成，请升级到专业版或更高套餐。", 403);
  }

  if (feature === "scraper" && !features.scraper) {
    throw createError("当前套餐不支持公开页参考抓取，请升级到专业版或更高套餐。", 403);
  }

  if (feature === "storeApiAgents" && !features.storeApiAgents) {
    throw createError("当前套餐不支持 TikTok 插件与店铺 Agent，请升级到成长版或更高套餐。", 403);
  }

  if (feature === "csvImport" && !features.csvImport) {
    throw createError("当前套餐不支持 CSV 经营数据导入，请升级到专业版或更高套餐。", 403);
  }

  if (feature === "extensionAutoSend" && !features.extensionAutoSend) {
    throw createError("当前套餐不支持插件自动发送，请升级到成长版或更高套餐。", 403);
  }
}

export function createOrder({ userId, planId, paymentMethod = "wechat" }) {
  if (!PURCHASABLE_PLAN_IDS.has(planId)) throw createError("请选择有效套餐（成长版 / 专业版 / 团队版）。", 400);

  const db = readDb();
  const user = db.users.find((entry) => entry.id === userId);
  if (!user) throw createError("用户不存在。", 401);

  const plan = plans[planId];
  const amount = resolvePlanCheckoutPrice(planId, user, db);

  const order = {
    id: crypto.randomUUID(),
    orderNo: `FM${Date.now()}${crypto.randomInt(1000, 9999)}`,
    userId,
    userEmail: user.email,
    planId,
    planName: plan.name,
    amount,
    listPrice: plan.price,
    earlyBirdApplied: amount !== plan.price,
    paymentMethod,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  db.orders.unshift(order);
  db.orders = db.orders.slice(0, 2000);
  writeDb(db);
  return order;
}

export function simulatePayOrder({ userId, orderId }) {
  if (isProduction) throw createError("生产环境不允许模拟支付。", 403);

  const db = readDb();
  const order = db.orders.find((entry) => entry.id === orderId && entry.userId === userId);
  if (!order) throw createError("订单不存在。", 404);
  if (order.status === "paid") {
    return { order, user: db.users.find((entry) => entry.id === userId) };
  }

  applyPaidOrderToUser(db, order, `DEV-${order.orderNo}`);
  writeDb(db);
  return { order, user: db.users.find((entry) => entry.id === userId) };
}

export function claimOrderPaymentSubmitted({ userId, orderId, payerNote = "" }) {
  const db = readDb();
  const order = db.orders.find((entry) => entry.id === orderId && entry.userId === userId);
  if (!order) throw createError("订单不存在。", 404);
  if (order.status === "paid") throw createError("订单已支付，无需重复提交。", 409);
  if (order.status === "awaiting_confirm") throw createError("已收到您的付款提醒，请等待核实。", 409);
  if (order.status !== "pending") throw createError("当前订单不可提交付款提醒。", 400);

  order.status = "awaiting_confirm";
  order.claimedAt = new Date().toISOString();
  order.payerNote = String(payerNote || "").trim().slice(0, 500);
  writeDb(db);
  return order;
}

export function adminConfirmOrderPayment({ orderId }) {
  const db = readDb();
  const order = db.orders.find((entry) => entry.id === orderId);
  if (!order) throw createError("订单不存在。", 404);
  if (order.status === "paid") {
    return { order, user: db.users.find((entry) => entry.id === order.userId) };
  }
  if (order.status !== "pending" && order.status !== "awaiting_confirm") {
    throw createError("该订单状态不可确认收款。", 400);
  }

  const tradeNo = `MANUAL-${order.orderNo}`;
  applyPaidOrderToUser(db, order, tradeNo);
  writeDb(db);
  return { order, user: db.users.find((entry) => entry.id === order.userId) };
}

function applyPaidOrderToUser(db, order, paymentTradeNo) {
  const user = db.users.find((entry) => entry.id === order.userId);
  if (!user) throw createError("用户不存在。", 401);

  const now = new Date();
  const subscriptionEndsAt = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30);
  order.status = "paid";
  order.paidAt = now.toISOString();
  order.paymentTradeNo = paymentTradeNo;

  user.plan = order.planId;
  user.subscriptionStartedAt = now.toISOString();
  user.subscriptionEndsAt = subscriptionEndsAt.toISOString();
  user.lastPaidOrderId = order.id;
  if (order.earlyBirdApplied) {
    user.earlyBirdLocked ||= {};
    user.earlyBirdLocked[order.planId] = true;
  }

  return user;
}

export function submitEnterpriseLead({ userId, contact }) {
  const db = readDb();
  const user = db.users.find((entry) => entry.id === userId);
  if (!user) throw createError("用户不存在。", 401);

  const lead = {
    id: crypto.randomUUID(),
    userId,
    userEmail: user.email,
    type: "enterprise",
    contact,
    status: "new",
    createdAt: new Date().toISOString(),
  };
  db.feedback.unshift(lead);
  writeDb(db);
  return lead;
}

export function saveTask({ userId, type, title, input, answer, metadata = {} }) {
  const db = readDb();
  const task = {
    id: crypto.randomUUID(),
    userId,
    type,
    title,
    input,
    answer,
    metadata,
    favorite: false,
    createdAt: new Date().toISOString(),
  };

  db.tasks.unshift(task);
  db.tasks = db.tasks.slice(0, 5000);
  writeDb(db);
  return task;
}

export function listTasks(userId) {
  const db = readDb();
  const user = db.users.find((entry) => entry.id === userId);
  const limit = getPlan(user).features.historyLimit || 30;
  return db.tasks.filter((task) => task.userId === userId).slice(0, limit);
}

export function updateTaskFavorite({ userId, taskId, favorite }) {
  const db = readDb();
  const task = db.tasks.find((entry) => entry.id === taskId && entry.userId === userId);
  if (!task) throw createError("任务不存在。", 404);
  task.favorite = Boolean(favorite);
  writeDb(db);
  return task;
}

function normalizeStorePlatform(p) {
  const x = String(p || "amazon").toLowerCase();
  return ["shopify", "woocommerce", "amazon", "tiktok"].includes(x) ? x : "amazon";
}

export function listStoreConnections(userId) {
  const db = readDb();
  return db.storeConnections
    .filter((entry) => entry.userId === userId)
    .map((c) => sanitizeStoreConnection(c))
    .filter(Boolean);
}

export function saveStoreConnection({ userId, config }) {
  const db = readDb();
  const user = db.users.find((entry) => entry.id === userId);
  if (!user) throw createError("用户不存在。", 401);

  const platform = normalizeStorePlatform(config.platform);
  const existing = db.storeConnections.find(
    (entry) => entry.userId === userId && normalizeStorePlatform(entry.platform) === platform,
  );
  const incomingToken = String(config.apiToken || "").trim();
  const looksMasked = incomingToken.includes("****");
  let apiTokenEncrypted = existing?.apiTokenEncrypted || "";
  let apiTokenMasked = existing?.apiTokenMasked || "";
  if (incomingToken && !looksMasked) {
    apiTokenEncrypted = Buffer.from(incomingToken).toString("base64");
    apiTokenMasked = maskToken(incomingToken);
  }

  const connection = {
    id: existing?.id || crypto.randomUUID(),
    userId,
    platform,
    storeName: config.storeName || "",
    apiEndpoint: config.apiEndpoint || "",
    apiTokenEncrypted,
    apiTokenMasked,
    autoBuyerReply:
      config.autoBuyerReply !== undefined ? Boolean(config.autoBuyerReply) : Boolean(existing?.autoBuyerReply),
    status:
      config.storeName &&
      apiTokenEncrypted &&
      (platform === "amazon" || platform === "tiktok" || config.apiEndpoint)
        ? "connected"
        : "draft",
    updatedAt: new Date().toISOString(),
    createdAt: existing?.createdAt || new Date().toISOString(),
  };

  if (existing) {
    Object.assign(existing, connection);
  } else {
    db.storeConnections.unshift(connection);
  }

  writeDb(db);
  return sanitizeStoreConnection(connection);
}

export function getStoreConnection(userId) {
  const list = listStoreConnections(userId);
  return list[0] || null;
}

/** @param {string} [platform] — tiktok / amazon / shopify / woocommerce；省略则取该用户任意一条（兼容旧逻辑） */
export function getStoreConnectionSecret(userId, platform) {
  const db = readDb();
  let connection;
  if (platform) {
    const p = normalizeStorePlatform(platform);
    connection = db.storeConnections.find(
      (entry) => entry.userId === userId && normalizeStorePlatform(entry.platform) === p,
    );
  } else {
    connection = db.storeConnections.find((entry) => entry.userId === userId);
  }
  if (!connection?.apiTokenEncrypted) return null;
  try {
    const apiToken = Buffer.from(connection.apiTokenEncrypted, "base64").toString("utf8");
    return {
      platform: connection.platform,
      storeName: connection.storeName,
      apiEndpoint: connection.apiEndpoint,
      apiToken,
      autoBuyerReply: Boolean(connection.autoBuyerReply),
    };
  } catch {
    return null;
  }
}

function sanitizeStoreConnection(connection) {
  if (!connection) return null;
  const { apiTokenEncrypted, ...safeConnection } = connection;
  return safeConnection;
}

export function saveFeedback({ userId, payload }) {
  const db = readDb();
  const user = db.users.find((entry) => entry.id === userId);
  const feedback = {
    id: crypto.randomUUID(),
    userId,
    userEmail: user?.email || "",
    type: payload.type || "feedback",
    payload,
    status: "new",
    createdAt: new Date().toISOString(),
  };
  db.feedback.unshift(feedback);
  db.feedback = db.feedback.slice(0, 1000);
  writeDb(db);
  return feedback;
}

/**
 * 启动时同步：.env ADMIN_EMAILS 中的邮箱一律 isAdmin=true（便于你只控制自己的账号）。
 */
export function syncAdminFlagsFromEnv() {
  const db = readDb();
  let touched = false;
  for (const user of db.users) {
    if (isConfiguredAdminEmail(user.email) && !user.isAdmin) {
      user.isAdmin = true;
      touched = true;
    }
  }
  if (touched) writeDb(db);
}

export function adminGrantUserSubscription({ adminUser, targetUserId, planId, days = 30 }) {
  if (!effectiveIsAdmin(adminUser)) throw createError("需要管理员权限。", 403);
  if (!plans[planId] || planId === "free" || planId === "trial") {
    throw createError("请选择有效套餐（free / growth / pro / team 或 legacy starter/standard/managed）。", 400);
  }

  const n = Number(days);
  const grantDays = Number.isFinite(n) ? Math.min(730, Math.max(1, Math.floor(n))) : 30;

  const db = readDb();
  const user = db.users.find((entry) => entry.id === targetUserId);
  if (!user) throw createError("用户不存在。", 404);

  const now = new Date();
  user.plan = planId;
  user.subscriptionStartedAt = now.toISOString();
  user.subscriptionEndsAt = new Date(now.getTime() + grantDays * 86400000).toISOString();
  user.adminLastGrantedAt = now.toISOString();
  user.adminLastGrantedBy = adminUser.id;
  writeDb(db);

  return sanitizeUser(user);
}

export function getAdminSummary() {
  const db = readDb();
  const today = new Date().toISOString().slice(0, 10);
  const todaysLogs = db.usageLogs.filter((log) => log.createdAt?.startsWith(today));
  const paidUsers = db.users.filter(
    (user) => PURCHASABLE_PLAN_IDS.has(user.plan) || ["starter", "standard", "managed", "enterprise"].includes(user.plan),
  ).filter((user) => isSubscriptionActive(user));
  const analytics = getProductAnalytics({ days: 7 });

  return {
    metrics: {
      用户总数: db.users.length,
      付费用户: paidUsers.length,
      订单总数: db.orders.length,
      待付款订单: db.orders.filter((order) => order.status === "pending").length,
      待确认收款: db.orders.filter((order) => order.status === "awaiting_confirm").length,
      今日API调用: todaysLogs.length,
      今日失败调用: todaysLogs.filter((log) => log.status === "failed").length,
      反馈条数: db.feedback.length,
      今日埋点事件: analytics.highlights.eventsToday,
      今日新注册: analytics.highlights.registrationsToday,
      今日创建订单: analytics.highlights.ordersToday,
      今日插件安装点击: analytics.highlights.extensionClicksToday,
    },
    analytics,
    users: db.users.slice(0, 120).map(sanitizeUser),
    orders: db.orders.slice(0, 50),
    usageLogs: db.usageLogs.slice(0, 80),
    feedback: db.feedback.slice(0, 50),
  };
}

export function listPlans() {
  return plans;
}

export function listPublicPlans(user) {
  const db = readDb();
  return ["growth", "pro", "team"].map((id) => {
    const plan = plans[id];
    const checkoutPrice = resolvePlanCheckoutPrice(id, user, db);
    return {
      id,
      name: plan.name,
      price: plan.price,
      checkoutPrice,
      priceEarlyBird: plan.priceEarlyBird || null,
      earlyBirdEligible: Boolean(plan.priceEarlyBird && (user?.earlyBirdLocked?.[id] || isEarlyBirdOpen(db))),
      earlyBirdLocked: Boolean(user?.earlyBirdLocked?.[id]),
      dailyLimit: plan.dailyLimit,
      features: plan.features,
    };
  });
}
