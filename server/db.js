import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const dbPath = path.join(process.cwd(), "data", "app-db.json");
const tokenSecret = process.env.JWT_SECRET || process.env.OPENCLAW_API_KEY || "local-dev-secret";

const plans = {
  trial: { name: "3天免费试用", dailyLimit: 30 },
  starter: { name: "尝鲜版", price: 99, dailyLimit: 100 },
  standard: { name: "标准版", price: 299, dailyLimit: 500 },
  managed: { name: "全托版", price: 899, dailyLimit: 2000 },
  enterprise: { name: "企业版", price: "定制", dailyLimit: 10000 },
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
  const { passwordHash, ...safeUser } = user;
  return {
    ...safeUser,
    trialActive: Date.now() < new Date(user.trialEndsAt).getTime(),
    planName: plans[user.plan]?.name || "未知套餐",
  };
}

export function registerUser({ name, storeName, email, password }) {
  const db = readDb();
  const normalizedEmail = email.trim().toLowerCase();

  if (db.users.some((user) => user.email === normalizedEmail)) {
    const error = new Error("该邮箱已经注册。");
    error.status = 409;
    throw error;
  }

  const now = new Date();
  const trialEndsAt = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 3);
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
    createdAt: now.toISOString(),
  };

  db.users.push(user);
  writeDb(db);
  return user;
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

  return user;
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
