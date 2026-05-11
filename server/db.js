import crypto from "node:crypto";
import { readDb, writeDb } from "./repositories/jsonRepository.js";

const isProduction = process.env.NODE_ENV === "production";
const tokenSecret = process.env.JWT_SECRET || (!isProduction ? process.env.OPENCLAW_API_KEY || "local-dev-secret" : "");

if (!tokenSecret) {
  throw new Error("生产环境必须配置 JWT_SECRET，不能使用默认登录密钥。");
}

const plans = {
  trial: {
    name: "3天免费试用",
    dailyLimit: 30,
    minuteLimit: 8,
    maxTokens: 1200,
    features: {
      agents: ["trend", "content", "listing"],
      autopilot: true,
      scraper: false,
      storeApiAgents: false,
      historyLimit: 10,
    },
  },
  starter: {
    name: "尝鲜版",
    price: 99,
    dailyLimit: 100,
    minuteLimit: 12,
    maxTokens: 1400,
    features: {
      agents: ["trend", "content", "listing"],
      autopilot: false,
      scraper: false,
      storeApiAgents: false,
      historyLimit: 30,
    },
  },
  standard: {
    name: "标准版",
    price: 299,
    dailyLimit: 500,
    minuteLimit: 30,
    maxTokens: 2200,
    features: {
      agents: ["trend", "content", "listing", "growth", "service", "profit"],
      autopilot: true,
      scraper: true,
      storeApiAgents: true,
      historyLimit: 100,
    },
  },
  managed: {
    name: "全托版",
    price: 899,
    dailyLimit: 2000,
    minuteLimit: 80,
    maxTokens: 3200,
    features: {
      agents: ["trend", "content", "listing", "growth", "service", "profit"],
      autopilot: true,
      scraper: true,
      storeApiAgents: true,
      historyLimit: 500,
      multiStore: true,
      weeklyReport: true,
    },
  },
  enterprise: {
    name: "企业版",
    price: "定制",
    dailyLimit: 10000,
    minuteLimit: 200,
    maxTokens: 5000,
    features: {
      agents: ["trend", "content", "listing", "growth", "service", "profit"],
      autopilot: true,
      scraper: true,
      storeApiAgents: true,
      historyLimit: 2000,
      multiStore: true,
      weeklyReport: true,
      privateDeploy: true,
    },
  },
};

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

function createError(message, status = 400, code = "") {
  const error = new Error(message);
  error.status = status;
  if (code) error.code = code;
  return error;
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

function getPlan(user) {
  return plans[user?.plan] || plans.trial;
}

function assertUserCanUsePlan(user) {
  if (isTrialActive(user) || isSubscriptionActive(user)) return;

  const message = user.plan === "trial" ? "3 天免费试用已结束，请订阅后继续使用。" : "当前套餐已到期，请续费后继续使用。";
  throw createError(message, 402, "SUBSCRIPTION_EXPIRED");
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
  const { passwordHash, emailVerification, passwordReset, loginSecurity, ...safeUser } = user;
  const plan = getPlan(user);

  return {
    ...safeUser,
    emailVerified: user.emailVerified !== false,
    trialActive: isTrialActive(user),
    subscriptionActive: isSubscriptionActive(user),
    accessActive: isTrialActive(user) || isSubscriptionActive(user),
    planName: plan.name,
    planFeatures: plan.features,
    dailyLimit: plan.dailyLimit,
    minuteLimit: plan.minuteLimit,
    maxTokens: plan.maxTokens,
    isAdmin: Boolean(user.isAdmin),
  };
}

export function registerUser({ name, storeName, email, password }) {
  const db = readDb();
  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = db.users.find((user) => user.email === normalizedEmail);

  if (existingUser?.emailVerified !== false) {
    throw createError("该邮箱已经注册。", 409);
  }

  const now = new Date();
  const trialEndsAt = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 3);
  if (existingUser) {
    existingUser.name = name || existingUser.name || "跨境卖家";
    existingUser.storeName = storeName || existingUser.storeName || "";
    existingUser.passwordHash = hashPassword(password);
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
    plan: "trial",
    trialStartedAt: now.toISOString(),
    trialEndsAt: trialEndsAt.toISOString(),
    subscriptionEndsAt: null,
    usage: {},
    loginSecurity: { failedCount: 0, lockedUntil: null },
    emailVerified: false,
    isAdmin: db.users.length === 0,
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

  return user;
}

export function verifyEmailCode({ email, code }) {
  const db = readDb();
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedCode = String(code || "").trim();
  const user = db.users.find((entry) => entry.email === normalizedEmail);

  if (!user) throw createError("账号不存在，请重新注册。", 404);
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
  user.usage[today] ||= { total: 0 };
  user.usage[today].total += 1;
  user.usage[today][type] = (user.usage[today][type] || 0) + 1;

  if (user.usage[today].total > plan.dailyLimit) {
    throw createError(`今日调用次数已达到 ${plan.name} 上限。`, 429);
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
    throw createError("当前套餐不支持该 Agent，请升级到标准版或更高套餐。", 403);
  }

  if (feature === "autopilot" && !features.autopilot) {
    throw createError("当前套餐不支持 6 Agent 全自动运行，请升级到标准版或更高套餐。", 403);
  }

  if (feature === "scraper" && !features.scraper) {
    throw createError("当前套餐不支持实时抓取数据源，请升级到标准版或更高套餐。", 403);
  }

  if (feature === "storeApiAgents" && !features.storeApiAgents) {
    throw createError("当前套餐不支持店铺 API 强数据 Agent，请升级到标准版或更高套餐。", 403);
  }
}

export function createOrder({ userId, planId, paymentMethod = "wechat" }) {
  if (!plans[planId] || planId === "trial") throw createError("请选择有效套餐。", 400);

  const db = readDb();
  const user = db.users.find((entry) => entry.id === userId);
  if (!user) throw createError("用户不存在。", 401);

  const plan = plans[planId];
  if (planId === "enterprise") throw createError("企业版需要提交联系信息。", 400);

  const order = {
    id: crypto.randomUUID(),
    orderNo: `FM${Date.now()}${crypto.randomInt(1000, 9999)}`,
    userId,
    userEmail: user.email,
    planId,
    planName: plan.name,
    amount: plan.price,
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
  if (order.status === "paid") return { order, user: db.users.find((entry) => entry.id === userId) };

  const user = db.users.find((entry) => entry.id === userId);
  if (!user) throw createError("用户不存在。", 401);

  const now = new Date();
  const subscriptionEndsAt = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30);
  order.status = "paid";
  order.paidAt = now.toISOString();
  order.paymentTradeNo = `DEV-${order.orderNo}`;

  user.plan = order.planId;
  user.subscriptionStartedAt = now.toISOString();
  user.subscriptionEndsAt = subscriptionEndsAt.toISOString();
  user.lastPaidOrderId = order.id;

  writeDb(db);
  return { order, user };
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

export function saveStoreConnection({ userId, config }) {
  const db = readDb();
  const user = db.users.find((entry) => entry.id === userId);
  if (!user) throw createError("用户不存在。", 401);

  const existing = db.storeConnections.find((entry) => entry.userId === userId);
  const connection = {
    id: existing?.id || crypto.randomUUID(),
    userId,
    platform: config.platform || "Amazon",
    storeName: config.storeName || "",
    apiEndpoint: config.apiEndpoint || "",
    apiTokenEncrypted: config.apiToken ? Buffer.from(config.apiToken).toString("base64") : existing?.apiTokenEncrypted || "",
    apiTokenMasked: config.apiToken ? maskToken(config.apiToken) : existing?.apiTokenMasked || "",
    status: config.storeName && config.apiEndpoint && (config.apiToken || existing?.apiTokenEncrypted) ? "connected" : "draft",
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
  const db = readDb();
  const connection = db.storeConnections.find((entry) => entry.userId === userId);
  return sanitizeStoreConnection(connection);
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

export function getAdminSummary() {
  const db = readDb();
  const today = new Date().toISOString().slice(0, 10);
  const todaysLogs = db.usageLogs.filter((log) => log.createdAt?.startsWith(today));
  const paidUsers = db.users.filter((user) => user.plan !== "trial" && isSubscriptionActive(user));

  return {
    metrics: {
      users: db.users.length,
      paidUsers: paidUsers.length,
      orders: db.orders.length,
      pendingOrders: db.orders.filter((order) => order.status === "pending").length,
      callsToday: todaysLogs.length,
      failedCallsToday: todaysLogs.filter((log) => log.status === "failed").length,
      feedback: db.feedback.length,
    },
    users: db.users.slice(0, 50).map(sanitizeUser),
    orders: db.orders.slice(0, 50),
    usageLogs: db.usageLogs.slice(0, 80),
    feedback: db.feedback.slice(0, 50),
  };
}

export function listPlans() {
  return plans;
}
