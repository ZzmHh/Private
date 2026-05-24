import "./loadEnv.js";
import express from "express";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { agentSkills, buildAgentMessages } from "./agentSkills.js";
import { sendPasswordResetEmail, sendVerificationEmail, sendPaymentClaimAdminEmail } from "./email.js";
import {
  adminConfirmOrderPayment,
  adminGrantUserSubscription,
  claimOrderPaymentSubmitted,
  confirmOrderPaymentByToken,
  completeRegistrationWithCode,
  createToken,
  createOrder,
  effectiveIsAdmin,
  ensureFeatureAccess,
  finalizeUsageLog,
  getAdminSummary,
  getOrderConfirmPreview,
  getStoreConnectionSecret,
  getUserById,
  incrementUsage,
  listPlans,
  listPublicPlans,
  listStoreConnections,
  listTasks,
  loginUser,
  registerUser,
  resendEmailVerification,
  requestPasswordReset,
  resetPassword,
  sanitizeUser,
  saveTask,
  saveFeedback,
  saveStoreConnection,
  simulatePayOrder,
  startRegistrationEmail,
  submitEnterpriseLead,
  syncAdminFlagsFromEnv,
  updateTaskFavorite,
  verifyEmailCode,
  verifyToken,
} from "./db.js";
import {
  fetchStoreSnapshot,
  fetchAmazonStoreSnapshot,
  fetchTikTokStoreSnapshot,
  assertPlatformSecret,
  snapshotRequiresSavedSecret,
} from "./integrations/storeApi/index.js";
import { buildPaymentPublicConfig } from "./paymentConfig.js";
import { handleTiktokBuyerMessageWebhook } from "./autoReply/tiktokInbound.js";
import { parseTikTokShopCredentials } from "./integrations/storeApi/tiktok/tiktokShopConnector.js";
import {
  buildTiktokAuthorizeUrl,
  buildTiktokConnectionTokenJson,
  decodeTiktokOAuthState,
  encodeTiktokOAuthState,
  exchangeTiktokAuthCodeForToken,
  fetchTiktokAuthorizedShops,
  getTiktokOAuthRedirectUri,
} from "./integrations/storeApi/tiktok/tiktokShopOAuth.js";
import { registerExtensionRoutes } from "./extensionRoutes.js";
import { getMergedExtensionContext } from "./extensionSync.js";
import { registerStoreMetricsRoutes, getStoreMetricsAgentContext } from "./storeMetricsRoutes.js";
import { registerVibeClipRoutes } from "./vibeClipRoutes.js";
import { requestIdMiddleware } from "./middleware/requestId.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { apiIpLimiter, extensionLimiter, agentRunLimiter } from "./middleware/rateLimit.js";
import { errorHandler, apiNotFoundHandler } from "./middleware/errorHandler.js";
import { asyncHandler } from "./middleware/asyncHandler.js";
import { validateBody, validators } from "./validate/index.js";
import { registerHealthRoutes } from "./routes/health.js";
import { registerSeoRoutes } from "./routes/seo.js";
import { registerAnalyticsRoutes } from "./routes/analytics.js";
import { startDbBackupScheduler } from "./jobs/dbBackup.js";
import { maybeRecordFirstAgentRun, recordProductEvent } from "./productEvents.js";
import { buildEchoTikContext, loadMarketCatalogMeta } from "./integrations/echotik/index.js";
import { prepareAgentRunInput } from "./prepareAgentRun.js";
import { streamChatCompletions } from "./llmStream.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

const port = Number(process.env.PORT || 8787);
const providerName = process.env.OPENCLAW_PROVIDER_NAME || "OpenClaw";
const baseUrl = process.env.OPENCLAW_BASE_URL || "https://api.openai.com/v1";
const model = process.env.OPENCLAW_MODEL || "gpt-4o-mini";
const apiKey = process.env.OPENCLAW_API_KEY || process.env.OPENAI_API_KEY;
const pythonCommand = process.env.PYTHON_COMMAND || "python";

function runPythonScraper({ platform = "TikTok Shop", market = "美国", category = "宠物用品", url = "" }) {
  return new Promise((resolve) => {
    const args = [
      path.join(__dirname, "scraper.py"),
      "--platform",
      platform,
      "--market",
      market,
      "--category",
      category,
    ];

    if (url) {
      args.push("--url", url);
    }

    const child = spawn(pythonCommand, args, {
      cwd: path.join(__dirname, ".."),
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      resolve({
        ok: false,
        error: "Python 爬虫执行超时。",
        detail: "已超过 60 秒，可能是目标站点加载慢、需要登录或被反爬拦截。",
        data: [],
      });
    }, 60000);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString("utf8");
    });
    child.on("close", () => {
      clearTimeout(timer);
      try {
        resolve(JSON.parse(stdout));
      } catch {
        resolve({
          ok: false,
          error: "Python 爬虫没有返回有效 JSON。",
          detail: stderr || stdout,
          data: [],
        });
      }
    });
  });
}

async function callChatCompletions(payload) {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");
  const endpoints = [`${normalizedBaseUrl}/chat/completions`];

  if (!normalizedBaseUrl.endsWith("/v1")) {
    endpoints.push(`${normalizedBaseUrl}/v1/chat/completions`);
  }

  let lastResult;

  for (const endpoint of endpoints) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const responseText = await response.text();
    let data;

    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      data = { raw: responseText };
    }

    lastResult = { response, data, endpoint };

    if (response.ok || response.status !== 404) {
      return lastResult;
    }
  }

  return lastResult;
}

/** TikTok Partner Webhook：URL 校验 / 买家消息自动话术（需在控制台配置本服务 URL） */
app.get("/webhooks/tiktok", (req, res) => {
  const challenge = req.query.challenge ?? req.query["hub.challenge"];
  if (challenge !== undefined && challenge !== null && String(challenge).length) {
    return res.status(200).send(String(challenge));
  }
  res.status(200).json({ ok: true, hint: "凡梦 TikTok Webhook 接入点" });
});

app.post("/webhooks/tiktok", express.json({ limit: "512kb" }), asyncHandler(async (req, res) => {
  const result = await handleTiktokBuyerMessageWebhook(req.body);
  res.status(200).json(result);
}));

app.use(express.json({ limit: "1mb" }));
app.use(requestIdMiddleware);
app.use(requestLogger);

app.use("/api", apiIpLimiter);
app.use("/api/extension", extensionLimiter);
app.use("/api/agents/run", agentRunLimiter);
app.use("/api/agents/run/stream", agentRunLimiter);
app.use("/api/autopilot/run", agentRunLimiter);

registerSeoRoutes(app);

app.use("/payment", express.static(path.join(__dirname, "../public/payment")));
app.use("/downloads", express.static(path.join(__dirname, "../public/downloads")));
app.use(express.static(path.join(__dirname, "../public")));

registerExtensionRoutes(app, {
  authMiddleware,
  apiKey,
  providerName,
  model,
  callChatCompletions,
});

registerStoreMetricsRoutes(app, { authMiddleware });
registerVibeClipRoutes(app, { authMiddleware });

registerHealthRoutes(app, { providerName, model, apiKey });

registerAnalyticsRoutes(app, {
  authMiddleware,
  adminMiddleware,
  verifyToken,
  getUserById,
});

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: "请先登录账号。" });
  }

  const user = getUserById(decoded.sub);
  if (!user) {
    return res.status(401).json({ error: "账号不存在，请重新登录。" });
  }

  req.user = user;
  next();
}

function adminMiddleware(req, res, next) {
  if (!effectiveIsAdmin(req.user)) {
    return res.status(403).json({ error: "需要管理员权限。" });
  }
  next();
}

/** 合并已保存凭据与 body.testConfig；storePlatform / testConfig.platform 指定多店铺中的哪一条 */
function resolveStoreSnapshotSecret(req, platformOverride) {
  const tc = req.body?.testConfig;
  const storePlatform = platformOverride || req.body?.storePlatform || tc?.platform;
  const testTok = String(tc?.apiToken || "").trim();
  const testMasked = testTok.includes("****");

  let secret = getStoreConnectionSecret(req.user.id, storePlatform ? String(storePlatform) : undefined);
  if (testTok && !testMasked) {
    secret = {
      platform: tc.platform || storePlatform || secret?.platform || "amazon",
      storeName: tc.storeName ?? secret?.storeName ?? "",
      apiEndpoint: tc.apiEndpoint ?? secret?.apiEndpoint ?? "",
      apiToken: testTok,
    };
  }
  return secret;
}

function pickStoreSnapshotSecret(userId, preferredPlatform) {
  const order = ["tiktok", "shopify", "woocommerce", "amazon"];
  const tryOne = (p) => {
    const s = getStoreConnectionSecret(userId, p);
    if (!s?.apiToken) return null;
    const merged = { ...s, platform: p };
    if (!snapshotRequiresSavedSecret(merged)) return null;
    return merged;
  };
  if (preferredPlatform && order.includes(String(preferredPlatform).toLowerCase())) {
    const hit = tryOne(String(preferredPlatform).toLowerCase());
    if (hit) return hit;
  }
  for (const p of order) {
    const hit = tryOne(p);
    if (hit) return hit;
  }
  return null;
}

function handleAuthError(res, error) {
  res.status(error.status || 500).json({ error: error.message || "账号服务异常。" });
}

app.post("/api/auth/register/start", (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email || !String(email).trim()) {
      return res.status(400).json({ error: "请填写邮箱。" });
    }

    const { user, verificationCode } = startRegistrationEmail(email);
    sendVerificationEmail({ to: user.email, code: verificationCode, name: user.name })
      .then((emailResult) => {
        res.json({
          registrationStep: "verify",
          email: user.email,
          emailDelivered: emailResult.delivered,
          devCode: emailResult.devCode,
          message: emailResult.delivered
            ? "验证码已发送到邮箱，请填写验证码并设置密码完成注册。"
            : "已生成验证码。当前未配置 SMTP，开发环境可直接使用页面提示的验证码。",
        });
      })
      .catch((error) => {
        res.status(500).json({ error: error.message || "验证码邮件发送失败，请稍后重试。" });
      });
  } catch (error) {
    handleAuthError(res, error);
  }
});

app.post("/api/auth/register/complete", (req, res) => {
  try {
    const { email, code, password, confirmPassword, name, storeName } = req.body || {};
    if (!email || !code || !password) {
      return res.status(400).json({ error: "请填写邮箱、验证码和密码。" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: "两次输入的密码不一致。" });
    }

    const user = completeRegistrationWithCode({ email, code, password, name, storeName });
    res.json({ token: createToken(user), user: sanitizeUser(user) });
  } catch (error) {
    handleAuthError(res, error);
  }
});

app.post("/api/auth/register", (req, res) => {
  try {
    const { name, storeName, email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: "请填写邮箱和密码。" });
    }

    const { user, verificationCode } = registerUser({ name, storeName, email, password });
    sendVerificationEmail({ to: user.email, code: verificationCode, name: user.name })
      .then((emailResult) => {
        res.json({
          verificationRequired: true,
          email: user.email,
          emailDelivered: emailResult.delivered,
          devCode: emailResult.devCode,
          message: emailResult.delivered
            ? "验证码已发送到邮箱，请完成验证。"
            : "已生成验证码。当前未配置 SMTP，开发环境可直接使用页面提示的验证码。",
        });
      })
      .catch((error) => {
        res.status(500).json({ error: error.message || "验证码邮件发送失败，请稍后重试。" });
      });
  } catch (error) {
    handleAuthError(res, error);
  }
});

app.post("/api/auth/login", validateBody(validators.login), (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: "请填写邮箱和密码。" });
    }

    const user = loginUser({ email, password });
    res.json({ token: createToken(user), user: sanitizeUser(user) });
  } catch (error) {
    if (error.code === "EMAIL_NOT_VERIFIED") {
      return res.status(error.status).json({
        error: error.message,
        verificationRequired: true,
        email: req.body?.email,
      });
    }
    if (error.code === "REGISTRATION_INCOMPLETE") {
      return res.status(error.status).json({
        error: error.message,
        registrationIncomplete: true,
        email: req.body?.email,
      });
    }
    return handleAuthError(res, error);
  }
});

app.post("/api/auth/verify-email", (req, res) => {
  try {
    const { email, code } = req.body || {};

    if (!email || !code) {
      return res.status(400).json({ error: "请填写邮箱和验证码。" });
    }

    const user = verifyEmailCode({ email, code });
    res.json({ token: createToken(user), user: sanitizeUser(user) });
  } catch (error) {
    handleAuthError(res, error);
  }
});

app.post("/api/auth/resend-verification", (req, res) => {
  try {
    const { email } = req.body || {};

    if (!email) {
      return res.status(400).json({ error: "请填写邮箱。" });
    }

    const { user, verificationCode } = resendEmailVerification(email);
    sendVerificationEmail({ to: user.email, code: verificationCode, name: user.name })
      .then((emailResult) => {
        res.json({
          verificationRequired: true,
          email: user.email,
          emailDelivered: emailResult.delivered,
          devCode: emailResult.devCode,
          message: emailResult.delivered
            ? "新的验证码已发送到邮箱。"
            : "已重新生成验证码。当前未配置 SMTP，开发环境可直接使用页面提示的验证码。",
        });
      })
      .catch((error) => {
        res.status(500).json({ error: error.message || "验证码邮件发送失败，请稍后重试。" });
      });
  } catch (error) {
    handleAuthError(res, error);
  }
});

app.post("/api/auth/request-password-reset", (req, res) => {
  try {
    const { email } = req.body || {};

    if (!email) {
      return res.status(400).json({ error: "请填写邮箱。" });
    }

    const { user, resetCode } = requestPasswordReset(email);
    sendPasswordResetEmail({ to: user.email, code: resetCode, name: user.name })
      .then((emailResult) => {
        res.json({
          email: user.email,
          emailDelivered: emailResult.delivered,
          devCode: emailResult.devCode,
          message: emailResult.delivered
            ? "重置密码验证码已发送到邮箱。"
            : "已生成重置验证码。当前未配置 SMTP，开发环境可直接使用页面提示的验证码。",
        });
      })
      .catch((error) => {
        res.status(500).json({ error: error.message || "重置密码邮件发送失败，请稍后重试。" });
      });
  } catch (error) {
    handleAuthError(res, error);
  }
});

app.post("/api/auth/reset-password", (req, res) => {
  try {
    const { email, code, password } = req.body || {};

    if (!email || !code || !password) {
      return res.status(400).json({ error: "请填写邮箱、验证码和新密码。" });
    }

    const user = resetPassword({ email, code, password });
    res.json({ token: createToken(user), user: sanitizeUser(user) });
  } catch (error) {
    handleAuthError(res, error);
  }
});

app.get("/api/me", authMiddleware, (req, res) => {
  const connections = listStoreConnections(req.user.id);
  res.json({
    user: sanitizeUser(req.user),
    tasks: listTasks(req.user.id),
    plans: listPlans(),
    publicPlans: listPublicPlans(req.user),
    storeConnections: connections,
    storeConnection: connections[0] || null,
  });
});

app.get("/api/billing/payment-config", (req, res) => {
  res.json(buildPaymentPublicConfig(req));
});

app.post("/api/billing/orders", authMiddleware, (req, res) => {
  try {
    const { planId, paymentMethod } = req.body || {};
    const order = createOrder({ userId: req.user.id, planId, paymentMethod });
    recordProductEvent({
      event: "order_create",
      userId: req.user.id,
      sessionId: `user:${req.user.id}`,
      path: "/#subscription",
      properties: { planId, orderId: order.id },
    });
    res.json({ order });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || "订单创建失败。" });
  }
});

app.post("/api/billing/orders/:orderId/claim-paid", authMiddleware, async (req, res) => {
  try {
    const { payerNote } = req.body || {};
    const order = claimOrderPaymentSubmitted({
      userId: req.user.id,
      orderId: req.params.orderId,
      payerNote,
    });
    const user = getUserById(req.user.id);
    const base = process.env.APP_PUBLIC_URL?.trim().replace(/\/+$/, "") || `http://127.0.0.1:${port}`;
    const confirmUrl = `${base}/#confirm-payment?token=${encodeURIComponent(order.confirmToken || "")}`;
    sendPaymentClaimAdminEmail({ order, user, confirmUrl }).catch((err) => {
      console.warn("[billing] admin notify email failed:", err?.message || err);
    });
    recordProductEvent({
      event: "order_claim_paid",
      userId: req.user.id,
      sessionId: `user:${req.user.id}`,
      path: "/#subscription",
      properties: { orderId: order.id },
    });
    res.json({
      order,
      user: sanitizeUser(user),
      paymentGraceHours: 24,
      confirmUrl: effectiveIsAdmin(user) ? confirmUrl : undefined,
    });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || "提交失败。" });
  }
});

app.get("/api/billing/orders/confirm-preview/:token", (req, res) => {
  try {
    res.json(getOrderConfirmPreview(req.params.token));
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || "预览失败。" });
  }
});

app.post("/api/billing/orders/confirm-by-token/:token", async (req, res) => {
  try {
    const { order, user } = confirmOrderPaymentByToken(req.params.token);
    res.json({ ok: true, order, userEmail: user?.email, planName: user?.plan });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || "确认失败。" });
  }
});

app.get("/api/echotik/catalog", (_req, res) => {
  res.json(loadMarketCatalogMeta());
});

app.post("/api/billing/orders/:orderId/simulate-pay", authMiddleware, (req, res) => {
  try {
    const { order, user } = simulatePayOrder({ userId: req.user.id, orderId: req.params.orderId });
    res.json({ order, user: sanitizeUser(user), plans: listPlans() });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || "模拟支付失败。" });
  }
});

app.post("/api/billing/enterprise-leads", authMiddleware, (req, res) => {
  try {
    const lead = submitEnterpriseLead({ userId: req.user.id, contact: req.body || {} });
    res.json({ lead });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || "提交定制需求失败。" });
  }
});

app.post("/api/store-connection", authMiddleware, (req, res) => {
  try {
    const storeConnection = saveStoreConnection({ userId: req.user.id, config: req.body || {} });
    res.json({ storeConnection });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || "店铺 API 配置保存失败。" });
  }
});

/**
 * TikTok Shop OAuth：返回授权页 URL（浏览器需整页跳转，故不用 GET 以免无法带 Bearer）
 */
app.post("/api/store/tiktok/oauth/url", authMiddleware, (req, res) => {
  try {
    if (!getTiktokOAuthRedirectUri()) {
      return res.status(503).json({
        error: "服务端未配置 TIKTOK_SHOP_OAUTH_REDIRECT_URI，无法发起 TikTok 授权。",
        hint: "在 Partner Center 登记与此完全一致的回调 URL，并写入环境变量。",
      });
    }
    const state = encodeTiktokOAuthState(req.user.id);
    const url = buildTiktokAuthorizeUrl(state);
    res.json({ url, state });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || "无法生成 TikTok 授权链接。" });
  }
});

function publicAppRedirectPath(query) {
  const base = process.env.APP_PUBLIC_URL?.trim().replace(/\/+$/, "");
  if (base) {
    const u = new URL(base.includes("://") ? base : `https://${base}`);
    for (const [k, v] of Object.entries(query)) {
      if (v != null && v !== "") u.searchParams.set(k, String(v));
    }
    return u.toString();
  }
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v != null && v !== "") qs.set(k, String(v));
  }
  const q = qs.toString();
  return q ? `/?${q}` : "/";
}

/** TikTok 授权回调（浏览器直达，无 Authorization 头；靠 state 校验 User） */
app.get("/api/store/tiktok/oauth/callback", async (req, res) => {
  const q = req.query || {};
  try {
    const errParam = q.error || q.error_string;
    if (errParam) {
      return res.redirect(
        302,
        publicAppRedirectPath({
          tiktok_oauth: "error",
          tiktok_msg: String(errParam).slice(0, 240),
        }),
      );
    }

    const state = decodeTiktokOAuthState(q.state);
    if (!state) {
      return res.redirect(
        302,
        publicAppRedirectPath({
          tiktok_oauth: "error",
          tiktok_msg: "state无效或已过期请重新发起连接",
        }),
      );
    }

    const authCode = q.code || q.auth_code;
    if (!authCode || !String(authCode).trim()) {
      return res.redirect(
        302,
        publicAppRedirectPath({
          tiktok_oauth: "error",
          tiktok_msg: "未返回授权码",
        }),
      );
    }

    const exchanged = await exchangeTiktokAuthCodeForToken(String(authCode).trim());
    if (!exchanged.ok) {
      return res.redirect(
        302,
        publicAppRedirectPath({
          tiktok_oauth: "error",
          tiktok_msg: exchanged.error || "换票失败",
        }),
      );
    }

    const tokenData = exchanged.data;
    const shopsResult = await fetchTiktokAuthorizedShops(tokenData.access_token);
    let shopCipher = String(q.shop_cipher || q.shopCipher || "").trim();
    let shopMeta = {};

    if (shopsResult.ok && shopsResult.shops?.length) {
      const first = shopsResult.shops[0];
      shopCipher = shopCipher || String(first.cipher).trim();
      shopMeta = { id: first.id, name: first.name };
    }

    if (!shopCipher) {
      return res.redirect(
        302,
        publicAppRedirectPath({
          tiktok_oauth: "error",
          tiktok_msg: shopsResult.error || "无法获取shop_cipher请在Partner后台确认应用店铺权限",
        }),
      );
    }

    const sellerName = tokenData.seller_name || shopMeta.name || "";
    const storeName = String(shopMeta.name || sellerName || "TikTok Shop").slice(0, 120);
    const apiToken = buildTiktokConnectionTokenJson(tokenData, shopCipher, shopMeta);

    saveStoreConnection({
      userId: state,
      config: {
        platform: "tiktok",
        storeName,
        apiEndpoint: "",
        apiToken,
      },
    });

    return res.redirect(302, publicAppRedirectPath({ tiktok_oauth: "ok" }));
  } catch (error) {
    console.error("[tiktok oauth callback]", error);
    return res.redirect(
      302,
      publicAppRedirectPath({
        tiktok_oauth: "error",
        tiktok_msg: error.message || "回调处理失败",
      }),
    );
  }
});

/** 聚合快照：按 platform 分发至 Amazon / TikTok / Shopify / Woo */
app.post("/api/store/snapshot", authMiddleware, async (req, res) => {
  try {
    ensureFeatureAccess(req.user, "storeApiAgents");
    const secret = resolveStoreSnapshotSecret(req);

    if (!secret || !snapshotRequiresSavedSecret(secret)) {
      const plat = String(secret?.platform || "").toLowerCase();
      const errMsg =
        plat === "amazon" || plat === "tiktok"
          ? "请填写凭据：Amazon / TikTok 通常将 apiToken 存为 JSON（OAuth 完成后由服务端写入）；不必与 Shopify 一样填写 Endpoint。"
          : "请填写 Endpoint 与完整密钥；试连时使用 testConfig 传入未脱敏 Token。";
      return res.status(400).json({ ok: false, error: errMsg });
    }

    const snap = await fetchStoreSnapshot(secret);
    res.json(snap);
  } catch (error) {
    res.status(error.status || 500).json({ ok: false, error: error.message || "店铺快照拉取失败。" });
  }
});

/** Amazon SP-API 专用快照（强制 platform=amazon） */
app.post("/api/store/amazon/snapshot", authMiddleware, async (req, res) => {
  try {
    ensureFeatureAccess(req.user, "storeApiAgents");
    const secret = resolveStoreSnapshotSecret(req, "amazon");
    const gate = assertPlatformSecret("amazon", secret);
    if (!gate.ok) {
      return res.status(400).json({ ok: false, error: gate.error });
    }
    if (!snapshotRequiresSavedSecret(secret)) {
      return res.status(400).json({
        ok: false,
        error: "请提供 Amazon 侧凭据：apiToken 建议为 JSON，至少含 refreshToken、sellerId 等（以实现阶段文档为准）。",
      });
    }
    const snap = await fetchAmazonStoreSnapshot(secret);
    res.json(snap);
  } catch (error) {
    res.status(error.status || 500).json({ ok: false, error: error.message || "Amazon 店铺快照失败。" });
  }
});

/** TikTok Shop Open API 专用快照（强制 platform=tiktok） */
app.post("/api/store/tiktok/snapshot", authMiddleware, async (req, res) => {
  try {
    ensureFeatureAccess(req.user, "storeApiAgents");
    const secret = resolveStoreSnapshotSecret(req, "tiktok");
    const gate = assertPlatformSecret("tiktok", secret);
    if (!gate.ok) {
      return res.status(400).json({ ok: false, error: gate.error });
    }
    if (!snapshotRequiresSavedSecret(secret)) {
      return res.status(400).json({
        ok: false,
        error: "请提供 TikTok Shop 侧凭据：apiToken 建议为 JSON，含 accessToken、shopCipher 等（以实现阶段文档为准）。",
      });
    }
    const snap = await fetchTikTokStoreSnapshot(secret);
    res.json(snap);
  } catch (error) {
    res.status(error.status || 500).json({ ok: false, error: error.message || "TikTok 店铺快照失败。" });
  }
});

/**
 * 模拟买家消息 → 生成自动话术；默认不发店（sendReal: true 且提供 conversationId 才尝试调 Partner 出站接口）
 */
app.post("/api/store/tiktok/auto-reply/simulate", authMiddleware, async (req, res) => {
  try {
    ensureFeatureAccess(req.user, "storeApiAgents");
    const secretFull = getStoreConnectionSecret(req.user.id, "tiktok");
    if (!secretFull || String(secretFull.platform).toLowerCase() !== "tiktok") {
      return res.status(400).json({ error: "请先在店铺 API 中选择 TikTok 并保存凭据。" });
    }
    const parsed = parseTikTokShopCredentials(secretFull.apiToken || "");
    if (!parsed?.shopCipher) {
      return res.status(400).json({ error: "凭据 JSON 中缺少 shop_cipher。" });
    }
    const { buyerText, conversationId, sendReal } = req.body || {};
    if (!buyerText || !String(buyerText).trim()) {
      return res.status(400).json({ error: "请提供 buyerText。" });
    }
    const payload = {
      type: "NEW_MESSAGE",
      data: {
        shop_cipher: parsed.shopCipher,
        conversation_id: conversationId != null && conversationId !== "" ? String(conversationId) : "",
        message_id: `sim-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        content: String(buyerText),
      },
    };
    const result = await handleTiktokBuyerMessageWebhook(payload, {
      force: true,
      simulateDryRun: sendReal !== true,
    });
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || "模拟失败。" });
  }
});

app.post("/api/tasks/:taskId/favorite", authMiddleware, (req, res) => {
  try {
    const task = updateTaskFavorite({
      userId: req.user.id,
      taskId: req.params.taskId,
      favorite: req.body?.favorite,
    });
    res.json({ task });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || "任务收藏失败。" });
  }
});

app.post("/api/feedback", authMiddleware, (req, res) => {
  try {
    const feedback = saveFeedback({ userId: req.user.id, payload: req.body || {} });
    res.json({ feedback });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || "反馈提交失败。" });
  }
});

app.get("/api/admin/summary", authMiddleware, adminMiddleware, (_req, res) => {
  res.json(getAdminSummary());
});

app.post("/api/admin/orders/:orderId/confirm-payment", authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { order, user } = adminConfirmOrderPayment({ orderId: req.params.orderId });
    res.json({ order, user: sanitizeUser(user) });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || "确认失败。" });
  }
});

app.post("/api/admin/users/:userId/grant-subscription", authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { planId, days } = req.body || {};
    const updated = adminGrantUserSubscription({
      adminUser: req.user,
      targetUserId: req.params.userId,
      planId,
      days,
    });
    res.json({ user: updated, plans: listPlans() });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || "开通失败。" });
  }
});

app.get("/api/agents", (_req, res) => {
  res.json({
    provider: providerName,
    model,
    configured: Boolean(apiKey),
    agents: Object.entries(agentSkills).map(([id, agent]) => ({
      id,
      name: agent.name,
      skills: agent.skills,
      output: agent.output,
    })),
  });
});

app.post("/api/scrape/run", authMiddleware, async (req, res) => {
  const startedAt = Date.now();
  let usage;
  try {
    const { platform, market, category, url } = req.body || {};
    ensureFeatureAccess(req.user, "scraper");
    usage = incrementUsage(req.user.id, "scrape");
    const result = await runPythonScraper({ platform, market, category, url });
    finalizeUsageLog(usage.logId, {
      type: "scrape",
      status: result.ok ? "success" : "failed",
      inputLength: JSON.stringify(req.body || {}).length,
      outputLength: JSON.stringify(result).length,
      startedAt,
    });
    res.status(result.ok ? 200 : 500).json(result);
  } catch (error) {
    if (usage?.logId) {
      finalizeUsageLog(usage.logId, { type: "scrape", status: "failed", error: error.message, startedAt });
    }
    res.status(error.status || 500).json({ error: error.message || "爬虫执行失败。" });
  }
});

function buildAutopilotMessages({ platform, market, category, extra }) {
  return [
    {
      role: "system",
      content: [
        "你是跨境电商「单轮结构化输出」运营总控：在一次回复中按 5 个业务模块顺序组织内容（非独立多 Agent 调度；各模块结论须自洽）。",
        "说明：不含「AI 客服全自动应答」——客服场景需人工对话式处理，应使用工作台中单独的「AI 客服售后」Agent 生成话术草稿。",
        "目标用户是不懂 AI 的跨境电商卖家，输出须可直接执行、并诚实标注数据与假设。",
        "",
        "按以下 5 段顺序输出（每段可用 ### 小标题）：",
        "1. 爆款选品监控：3 个机会 + 测试理由；若仅有爬虫/公开页样本，注明为公开页抽样并建议与多源数据交叉验证。",
        "2. 爆款内容：2 条短视频脚本要点。",
        "3. Listing：1 个英文标题草案、5 个卖点关键词方向、5 个搜索词方向（无缺品信息时标假设）。",
        "4. 店铺业绩诊断：诊断版—建议监控的 5～8 个指标与健康区间/假设；勿写「已读取实时后台」。",
        "5. 广告库存利润：广告与补货/清仓原则；无 SKU 成本数据时给框架与待导入字段清单。",
        "",
        "【数据与边界】",
        "- Playwright/爬虫结果为公开页面取样，不是平台官方实时行情；失败或无数据时降级为市场经验方案并说明。",
        "- 禁止伪造订单/库存/物流；未提供店铺数据时默认诊断版表述。",
        "",
        "【篇幅】每段约 100～150 字为宜；末段附 7 天执行节奏（按天或按阶段列表）。",
        "【表格】若某段适合用对照表展示（如机会清单、指标列表），请使用 Markdown 表格（| 列 | 列 |）而非仅用换行分隔。",
      ].join("\n"),
    },
    {
      role: "user",
      content: [
        `平台：${platform}`,
        `市场：${market}`,
        `类目：${category}`,
        extra ? `补充要求：${extra}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    },
  ];
}

app.post("/api/autopilot/run", authMiddleware, validateBody(validators.autopilotRun), async (req, res) => {
  const startedAt = Date.now();
  let usage;
  try {
    const { input, platform, market, category, extra, scrape } = req.body || {};

    if (!input && (!platform || !market || !category)) {
      return res.status(400).json({ error: "请描述你的平台、市场、类目和经营要求。" });
    }

    if (!apiKey) {
      return res.status(400).json({
        error: `还没有配置 ${providerName} API Key。请在 .env 中设置 OPENCLAW_API_KEY。`,
      });
    }

    ensureFeatureAccess(req.user, "autopilot");

    usage = incrementUsage(req.user.id, "autopilot");

    let scrapeResult = null;
    let enrichedInput = input || extra || "";

    if (scrape?.enabled) {
      ensureFeatureAccess(req.user, "scraper");
      incrementUsage(req.user.id, "scrape");
      scrapeResult = await runPythonScraper({
        platform: scrape.platform,
        market: scrape.market,
        category: scrape.category,
        url: scrape.url,
      });
      enrichedInput = [
        enrichedInput,
        "",
        "Python/Playwright 公开页面参考数据（非官方实时、仅供交叉验证）：",
        JSON.stringify(scrapeResult, null, 2),
      ].join("\n");
    }

    const { response, data, endpoint } = await callChatCompletions({
      model,
      temperature: 0.4,
      max_tokens: usage.maxTokens,
      messages: input
        ? buildAutopilotMessages({ platform: "用户自由输入", market: "用户自由输入", category: "用户自由输入", extra: enrichedInput })
        : buildAutopilotMessages({ platform, market, category, extra: enrichedInput }),
    });

    if (!response.ok) {
      finalizeUsageLog(usage.logId, {
        type: "autopilot",
        status: "failed",
        inputLength: enrichedInput.length,
        outputLength: JSON.stringify(data).length,
        error: data?.error?.message || data?.message,
        startedAt,
      });
      return res.status(response.status).json({
        error: data?.error?.message || data?.message || `${providerName} 5 Agent 运营生成失败。`,
        endpoint,
        detail: data,
      });
    }

    const answer = data?.choices?.[0]?.message?.content || "模型没有返回内容。";
    finalizeUsageLog(usage.logId, {
      type: "autopilot",
      status: "success",
      inputLength: enrichedInput.length,
      outputLength: answer.length,
      model,
      startedAt,
    });
    const task = saveTask({
      userId: req.user.id,
      type: "autopilot",
      title: "5 Agent 运营一键生成",
      input: enrichedInput,
      answer,
      metadata: { scrape: scrapeResult, usage },
    });

    res.json({
      provider: providerName,
      model,
      scrape: scrapeResult,
      answer,
      task,
      usage,
    });
  } catch (error) {
    if (usage?.logId) {
      finalizeUsageLog(usage.logId, { type: "autopilot", status: "failed", error: error.message, startedAt });
    }
    res.status(error.status || 500).json({ error: error.message || "5 Agent 运营生成失败。" });
  }
});

app.post("/api/agents/run", authMiddleware, validateBody(validators.agentRun), async (req, res) => {
  const startedAt = Date.now();
  let usage;
  try {
    if (!apiKey) {
      return res.status(400).json({
        error: `还没有配置 ${providerName} API Key。请在 .env 中设置 OPENCLAW_API_KEY。`,
      });
    }

    const prepared = await prepareAgentRunInput(req.user, req.body, {
      runPythonScraper,
      pickStoreSnapshotSecret,
    });
    const { agentId, enrichedInput, scrapeResult, echotikContext } = prepared;
    usage = prepared.usage;

    const { response, data, endpoint } = await callChatCompletions({
      model,
      temperature: 0.45,
      max_tokens: usage.maxTokens,
      messages: buildAgentMessages(agentId, enrichedInput),
    });

    if (!response.ok) {
      finalizeUsageLog(usage.logId, {
        type: agentId,
        status: "failed",
        inputLength: enrichedInput.length,
        outputLength: JSON.stringify(data).length,
        error: data?.error?.message || data?.message,
        startedAt,
      });
      return res.status(response.status).json({
        error: data?.error?.message || data?.message || `${providerName} 模型调用失败。`,
        endpoint,
        detail: data,
      });
    }

    const answer = data?.choices?.[0]?.message?.content || "模型没有返回内容。";
    finalizeUsageLog(usage.logId, {
      type: agentId,
      status: "success",
      inputLength: enrichedInput.length,
      outputLength: answer.length,
      model,
      startedAt,
    });
    const task = saveTask({
      userId: req.user.id,
      type: agentId,
      title: agentSkills[agentId]?.name || "Agent 任务",
      input: enrichedInput,
      answer,
      metadata: { usage, scrape: scrapeResult, echotik: echotikContext },
    });

    maybeRecordFirstAgentRun(req.user.id);
    recordProductEvent({
      event: "agent_run",
      userId: req.user.id,
      sessionId: `user:${req.user.id}`,
      path: "/workspace",
      properties: { agentId },
    });

    res.json({
      provider: providerName,
      model,
      agentId,
      scrape: scrapeResult,
      echotik: echotikContext,
      answer,
      task,
      usage,
    });
  } catch (error) {
    if (usage?.logId) {
      finalizeUsageLog(usage.logId, { type: req.body?.agentId || "agent", status: "failed", error: error.message, startedAt });
    }
    res.status(error.status || 500).json({ error: error.message || "Agent 执行失败。" });
  }
});

app.post("/api/agents/run/stream", authMiddleware, validateBody(validators.agentRun), async (req, res) => {
  const startedAt = Date.now();
  let usage;
  try {
    if (!apiKey) {
      return res.status(400).json({
        error: `还没有配置 ${providerName} API Key。请在 .env 中设置 OPENCLAW_API_KEY。`,
      });
    }

    const prepared = await prepareAgentRunInput(req.user, req.body, {
      runPythonScraper,
      pickStoreSnapshotSecret,
    });
    const { agentId, enrichedInput, scrapeResult, echotikContext } = prepared;
    usage = prepared.usage;

    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    let answer = "";
    const stream = streamChatCompletions(
      {
        model,
        temperature: 0.45,
        max_tokens: usage.maxTokens,
        messages: buildAgentMessages(agentId, enrichedInput),
      },
      { apiKey, baseUrl },
    );

    for await (const chunk of stream) {
      if (chunk.type === "delta" && chunk.text) {
        answer += chunk.text;
        res.write(`event: delta\ndata: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }
      if (chunk.type === "done" && chunk.raw && chunk.raw.ok === false) {
        finalizeUsageLog(usage.logId, {
          type: agentId,
          status: "failed",
          inputLength: enrichedInput.length,
          error: chunk.raw.data?.error?.message || chunk.raw.data?.message || "流式调用失败",
          startedAt,
        });
        res.write(`event: error\ndata: ${JSON.stringify({ error: chunk.raw.data?.error?.message || "模型流式调用失败" })}\n\n`);
        res.end();
        return;
      }
    }

    if (!answer.trim()) {
      finalizeUsageLog(usage.logId, {
        type: agentId,
        status: "failed",
        inputLength: enrichedInput.length,
        error: "模型没有返回内容",
        startedAt,
      });
      res.write(`event: error\ndata: ${JSON.stringify({ error: "模型没有返回内容。" })}\n\n`);
      res.end();
      return;
    }

    finalizeUsageLog(usage.logId, {
      type: agentId,
      status: "success",
      inputLength: enrichedInput.length,
      outputLength: answer.length,
      model,
      startedAt,
    });
    const task = saveTask({
      userId: req.user.id,
      type: agentId,
      title: agentSkills[agentId]?.name || "Agent 任务",
      input: enrichedInput,
      answer,
      metadata: { usage, scrape: scrapeResult, echotik: echotikContext, streamed: true },
    });

    maybeRecordFirstAgentRun(req.user.id);
    recordProductEvent({
      event: "agent_run",
      userId: req.user.id,
      sessionId: `user:${req.user.id}`,
      path: "/workspace",
      properties: { agentId, streamed: true },
    });

    res.write(
      `event: done\ndata: ${JSON.stringify({
        ok: true,
        provider: providerName,
        model,
        agentId,
        answer,
        task,
        scrape: scrapeResult,
        echotik: echotikContext,
        usage,
      })}\n\n`,
    );
    res.end();
  } catch (error) {
    if (usage?.logId) {
      finalizeUsageLog(usage.logId, { type: req.body?.agentId || "agent", status: "failed", error: error.message, startedAt });
    }
    if (!res.headersSent) {
      res.status(error.status || 500).json({ error: error.message || "Agent 流式执行失败。" });
    } else {
      res.write(`event: error\ndata: ${JSON.stringify({ error: error.message || "Agent 流式执行失败。" })}\n\n`);
      res.end();
    }
  }
});

app.use(express.static(path.join(__dirname, "../dist")));

app.use((req, res, next) => {
  if (req.path.startsWith("/api") || req.path.startsWith("/webhooks")) {
    return apiNotFoundHandler(req, res);
  }
  next();
});

app.use(errorHandler);

app.use((_req, res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

syncAdminFlagsFromEnv();
startDbBackupScheduler();

app.listen(port, () => {
  console.log(`凡梦AI server running at http://127.0.0.1:${port}`);
});
