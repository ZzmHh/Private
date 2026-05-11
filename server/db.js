import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const dbPath = path.join(process.cwd(), "data", "app-db.json");
const tokenSecret = process.env.JWT_SECRET || process.env.OPENCLAW_API_KEY || "local-dev-secret";

const plans = {
  trial: {
    name: "3天免费试用",
    dailyLimit: 30,
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

function ensureDb() {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ users: [], tasks: [] }, null, 2), "utf8");
  }
}

function readDb() {
  ensureDb();
  return JSON.parse(fs.readFileSync(dbPath, "utf8"));
}

function writeDb(db) {
  ensureDb();
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf8");
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

function hashVerificationCode(email, code) {
  return crypto.createHmac("sha256", tokenSecret).update(`${email}:${code}`).digest("hex");
}

function attachEmailVerification(user, now = new Date()) {
  const code = createVerificationCode();
  const expiresAt = new Date(now.getTime() + 1000 * 60 * 10);

  user.emailVerified = false;
  user.emailVerification = {
    codeHash: hashVerificationCode(user.email, code),
    expiresAt: expiresAt.toISOString(),
    sentAt: now.toISOString(),
    attempts: 0,
  };

  return code;
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
  const { passwordHash, emailVerification, ...safeUser } = user;
  return {
    ...safeUser,
    emailVerified: user.emailVerified !== false,
    trialActive: Date.now() < new Date(user.trialEndsAt).getTime(),
    planName: plans[user.plan]?.name || "未知套餐",
    planFeatures: plans[user.plan]?.features || plans.trial.features,
    dailyLimit: plans[user.plan]?.dailyLimit || plans.trial.dailyLimit,
  };
}

export function registerUser({ name, storeName, email, password }) {
  const db = readDb();
  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = db.users.find((user) => user.email === normalizedEmail);

  if (existingUser?.emailVerified !== false) {
    const error = new Error("该邮箱已经注册。");
    error.status = 409;
    throw error;
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
    emailVerified: false,
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

  if (!user || !verifyPassword(password, user.passwordHash)) {
    const error = new Error("邮箱或密码错误。");
    error.status = 401;
    throw error;
  }

  if (user.emailVerified === false) {
    const error = new Error("请先完成邮箱验证后再登录。");
    error.status = 403;
    error.code = "EMAIL_NOT_VERIFIED";
    throw error;
  }

  return user;
}

export function verifyEmailCode({ email, code }) {
  const db = readDb();
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedCode = String(code || "").trim();
  const user = db.users.find((entry) => entry.email === normalizedEmail);

  if (!user) {
    const error = new Error("账号不存在，请重新注册。");
    error.status = 404;
    throw error;
  }

  if (user.emailVerified !== false) {
    return user;
  }

  if (!/^\d{6}$/.test(normalizedCode)) {
    const error = new Error("请输入 6 位邮箱验证码。");
    error.status = 400;
    throw error;
  }

  const verification = user.emailVerification;
  if (!verification?.codeHash || Date.now() > new Date(verification.expiresAt).getTime()) {
    const error = new Error("验证码已过期，请重新发送。");
    error.status = 410;
    throw error;
  }

  verification.attempts = (verification.attempts || 0) + 1;
  if (verification.attempts > 6) {
    writeDb(db);
    const error = new Error("验证码错误次数过多，请重新发送验证码。");
    error.status = 429;
    throw error;
  }

  if (verification.codeHash !== hashVerificationCode(normalizedEmail, normalizedCode)) {
    writeDb(db);
    const error = new Error("验证码不正确，请检查邮箱后重试。");
    error.status = 400;
    throw error;
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

  if (!user) {
    const error = new Error("账号不存在，请先注册。");
    error.status = 404;
    throw error;
  }

  if (user.emailVerified !== false) {
    const error = new Error("该邮箱已完成验证，请直接登录。");
    error.status = 409;
    throw error;
  }

  const verificationCode = attachEmailVerification(user);
  writeDb(db);
  return { user, verificationCode };
}

export function getUserById(userId) {
  const db = readDb();
  return db.users.find((user) => user.id === userId) || null;
}

export function incrementUsage(userId, type) {
  const db = readDb();
  const user = db.users.find((entry) => entry.id === userId);

  if (!user) {
    const error = new Error("用户不存在。");
    error.status = 401;
    throw error;
  }

  const today = new Date().toISOString().slice(0, 10);
  const plan = plans[user.plan] || plans.trial;
  const trialActive = Date.now() < new Date(user.trialEndsAt).getTime();
  const subscriptionActive =
    user.subscriptionEndsAt && Date.now() < new Date(user.subscriptionEndsAt).getTime();

  if (!trialActive && !subscriptionActive && user.plan === "trial") {
    const error = new Error("3 天免费试用已结束，请订阅后继续使用。");
    error.status = 402;
    throw error;
  }

  user.usage[today] ||= { total: 0 };
  user.usage[today].total += 1;
  user.usage[today][type] = (user.usage[today][type] || 0) + 1;

  if (user.usage[today].total > plan.dailyLimit) {
    const error = new Error(`今日调用次数已达到 ${plan.name} 上限。`);
    error.status = 429;
    throw error;
  }

  writeDb(db);
  return { usage: user.usage[today], limit: plan.dailyLimit };
}

export function ensureFeatureAccess(user, feature, detail) {
  const plan = plans[user.plan] || plans.trial;
  const features = plan.features;

  if (feature === "agent" && !features.agents.includes(detail)) {
    const error = new Error(`当前套餐不支持该 Agent，请升级到标准版或更高套餐。`);
    error.status = 403;
    throw error;
  }

  if (feature === "autopilot" && !features.autopilot) {
    const error = new Error("当前套餐不支持 6 Agent 全自动运行，请升级到标准版或更高套餐。");
    error.status = 403;
    throw error;
  }

  if (feature === "scraper" && !features.scraper) {
    const error = new Error("当前套餐不支持实时抓取数据源，请升级到标准版或更高套餐。");
    error.status = 403;
    throw error;
  }

  if (feature === "storeApiAgents" && !features.storeApiAgents) {
    const error = new Error("当前套餐不支持店铺 API 强数据 Agent，请升级到标准版或更高套餐。");
    error.status = 403;
    throw error;
  }
}

export function activatePlan(userId, planId) {
  if (!plans[planId] || planId === "trial") {
    const error = new Error("请选择有效套餐。");
    error.status = 400;
    throw error;
  }

  const db = readDb();
  const user = db.users.find((entry) => entry.id === userId);

  if (!user) {
    const error = new Error("用户不存在。");
    error.status = 401;
    throw error;
  }

  const now = new Date();
  const subscriptionEndsAt = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30);
  user.plan = planId;
  user.subscriptionStartedAt = now.toISOString();
  user.subscriptionEndsAt = subscriptionEndsAt.toISOString();

  writeDb(db);
  return user;
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
    createdAt: new Date().toISOString(),
  };

  db.tasks.unshift(task);
  db.tasks = db.tasks.slice(0, 1000);
  writeDb(db);
  return task;
}

export function listTasks(userId) {
  const db = readDb();
  return db.tasks.filter((task) => task.userId === userId).slice(0, 30);
}

export function listPlans() {
  return plans;
}
