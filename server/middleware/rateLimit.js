import rateLimit from "express-rate-limit";

function limiter({ windowMs, max, message }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: message, code: "RATE_LIMITED" },
    keyGenerator: (req) => req.user?.id || req.ip || "unknown",
    skip: (req) => req.method === "OPTIONS",
  });
}

/** 全站 /api IP 级防刷 */
export const apiIpLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.API_IP_RATE_MAX || 200),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "请求太频繁，请稍后再试。", code: "RATE_LIMITED" },
  skip: (req) => req.method === "OPTIONS",
});

/** 插件 API */
const isDev = process.env.NODE_ENV !== "production";
export const extensionLimiter = limiter({
  windowMs: 60 * 1000,
  max: Number(process.env.EXTENSION_RATE_MAX || (isDev ? 120 : 30)),
  message: "插件请求太频繁，请稍后再试。",
});

/** Agent / 全自动（烧 LLM 额度） */
export const agentRunLimiter = limiter({
  windowMs: 60 * 1000,
  max: Number(process.env.AGENT_RUN_RATE_MAX || 20),
  message: "Agent 调用太频繁，请稍后再试。",
});
