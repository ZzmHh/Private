import { redactMessage } from "../lib/redact.js";

/** @param {import("express").Request} req @param {import("express").Response} res */
export function apiNotFoundHandler(req, res) {
  if (!req.path.startsWith("/api")) {
    return res.status(404).send("Not Found");
  }
  res.status(404).json({
    error: "接口不存在。",
    path: req.path,
    requestId: req.requestId,
  });
}

/** @param {Error & { status?: number; code?: string }} err @param {import("express").Request} req @param {import("express").Response} res @param {import("express").NextFunction} _next */
export function errorHandler(err, req, res, _next) {
  const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 500;
  const message = redactMessage(err.message || "服务器内部错误。");

  if (status >= 500) {
    console.error(`[ERROR] ${req.method} ${req.path} reqId=${req.requestId}:`, message);
    if (process.env.NODE_ENV !== "production" && err.stack) {
      console.error(err.stack);
    }
  }

  /** @type {Record<string, unknown>} */
  const body = {
    error: message,
    requestId: req.requestId,
  };
  if (err.code) body.code = err.code;

  if (!res.headersSent) {
    res.status(status).json(body);
  }
}
