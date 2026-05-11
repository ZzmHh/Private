import "dotenv/config";
import express from "express";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { agentSkills, buildAgentMessages } from "./agentSkills.js";
import { sendVerificationEmail } from "./email.js";
import {
  activatePlan,
  createToken,
  ensureFeatureAccess,
  getUserById,
  incrementUsage,
  listPlans,
  listTasks,
  loginUser,
  registerUser,
  resendEmailVerification,
  sanitizeUser,
  saveTask,
  verifyEmailCode,
  verifyToken,
} from "./db.js";

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

app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "凡梦AI",
    provider: providerName,
    model,
    openclawConfigured: Boolean(apiKey),
  });
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

function handleAuthError(res, error) {
  res.status(error.status || 500).json({ error: error.message || "账号服务异常。" });
}

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

app.post("/api/auth/login", (req, res) => {
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

app.get("/api/me", authMiddleware, (req, res) => {
  res.json({ user: sanitizeUser(req.user), tasks: listTasks(req.user.id), plans: listPlans() });
});

app.post("/api/billing/activate", authMiddleware, (req, res) => {
  try {
    const { planId } = req.body || {};
    const user = activatePlan(req.user.id, planId);
    res.json({ user: sanitizeUser(user), plans: listPlans() });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || "套餐开通失败。" });
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
  try {
    const { platform, market, category, url } = req.body || {};
    ensureFeatureAccess(req.user, "scraper");
    incrementUsage(req.user.id, "scrape");
    const result = await runPythonScraper({ platform, market, category, url });
    res.status(result.ok ? 200 : 500).json(result);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || "爬虫执行失败。" });
  }
});

function buildAutopilotMessages({ platform, market, category, extra }) {
  return [
    {
      role: "system",
      content: [
        "你是跨境电商多 Agent 总控系统，由 OpenClaw 接管 6 个专业 Agent 协同工作。",
        "目标用户是不懂 AI 的跨境电商卖家。你必须把复杂分析转成可直接执行的经营方案。",
        "",
        "你需要按以下 6 个 Agent 顺序输出完整方案：",
        "1. 爆款选品监控 Agent：给 3 个商品机会和测试理由。",
        "2. 爆款内容生成 Agent：给 2 条短视频脚本。",
        "3. Listing 转化优化 Agent：给 1 个英文标题、5 个卖点、5 个关键词。",
        "4. 店铺业绩诊断 Agent：给接入店铺 API 后要监控的 5 个指标。",
        "5. AI 客服售后 Agent：给 3 个高频问题和英文回复模板。",
        "6. 广告库存利润 Agent：给广告预算、补货、利润风险建议。",
        "",
        "要求：",
        "- 用中文输出，涉及海外买家页面和客服回复时同时给英文成稿。",
        "- 如果用户提供了爬虫真实数据，必须优先基于真实数据分析；如果爬虫失败，明确说明失败原因并给基于常见市场经验的启动方案。",
        "- 每个模块控制在 120 字以内。",
        "- 最后给一个简短 7 天执行计划。",
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

app.post("/api/autopilot/run", authMiddleware, async (req, res) => {
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

    const usage = incrementUsage(req.user.id, "autopilot");

    let scrapeResult = null;
    let enrichedInput = input || extra || "";

    if (scrape?.enabled) {
      ensureFeatureAccess(req.user, "scraper");
      scrapeResult = await runPythonScraper({
        platform: scrape.platform,
        market: scrape.market,
        category: scrape.category,
        url: scrape.url,
      });
      enrichedInput = [
        enrichedInput,
        "",
        "Python/Playwright 实时抓取结果：",
        JSON.stringify(scrapeResult, null, 2),
      ].join("\n");
    }

    const { response, data, endpoint } = await callChatCompletions({
      model,
      temperature: 0.4,
      max_tokens: 1800,
      messages: input
        ? buildAutopilotMessages({ platform: "用户自由输入", market: "用户自由输入", category: "用户自由输入", extra: enrichedInput })
        : buildAutopilotMessages({ platform, market, category, extra: enrichedInput }),
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || data?.message || `${providerName} 全自动运行失败。`,
        endpoint,
        detail: data,
      });
    }

    const answer = data?.choices?.[0]?.message?.content || "模型没有返回内容。";
    const task = saveTask({
      userId: req.user.id,
      type: "autopilot",
      title: "6 Agent 全自动运行",
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
    res.status(error.status || 500).json({ error: error.message || "全自动运行失败。" });
  }
});

app.post("/api/agents/run", authMiddleware, async (req, res) => {
  try {
    const { agentId, input, scrape } = req.body || {};

    if (!agentId || typeof input !== "string" || !input.trim()) {
      return res.status(400).json({ error: "请提供 agentId 和要执行的业务问题。" });
    }

    if (!apiKey) {
      return res.status(400).json({
        error: `还没有配置 ${providerName} API Key。请在 .env 中设置 OPENCLAW_API_KEY。`,
      });
    }

    ensureFeatureAccess(req.user, "agent", agentId);

    if (["growth", "service", "profit"].includes(agentId)) {
      ensureFeatureAccess(req.user, "storeApiAgents");
    }

    const usage = incrementUsage(req.user.id, agentId);
    let scrapeResult = null;
    let enrichedInput = input.trim();

    if (agentId === "trend" && scrape?.enabled) {
      ensureFeatureAccess(req.user, "scraper");
      scrapeResult = await runPythonScraper({
        platform: scrape.platform,
        market: scrape.market,
        category: scrape.category,
        url: scrape.url,
      });
      enrichedInput = [
        enrichedInput,
        "",
        "Python/Playwright 爆款数据抓取结果：",
        JSON.stringify(scrapeResult, null, 2),
      ].join("\n");
    }

    const { response, data, endpoint } = await callChatCompletions({
        model,
        temperature: 0.45,
        messages: buildAgentMessages(agentId, enrichedInput),
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || data?.message || `${providerName} 模型调用失败。`,
        endpoint,
        detail: data,
      });
    }

    const answer = data?.choices?.[0]?.message?.content || "模型没有返回内容。";
    const task = saveTask({
      userId: req.user.id,
      type: agentId,
      title: agentSkills[agentId]?.name || "Agent 任务",
      input: enrichedInput,
      answer,
      metadata: { usage, scrape: scrapeResult },
    });

    res.json({
      provider: providerName,
      model,
      agentId,
      scrape: scrapeResult,
      answer,
      task,
      usage,
    });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || "Agent 执行失败。" });
  }
});

app.use(express.static(path.join(__dirname, "../dist")));

app.use((_req, res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

app.listen(port, () => {
  console.log(`凡梦AI server running at http://127.0.0.1:${port}`);
});
