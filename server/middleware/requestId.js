import crypto from "node:crypto";

/** @param {import("express").Request} req @param {import("express").Response} res @param {import("express").NextFunction} next */
export function requestIdMiddleware(req, res, next) {
  const incoming = req.headers["x-request-id"];
  req.requestId =
    typeof incoming === "string" && incoming.trim() ? incoming.trim().slice(0, 32) : crypto.randomUUID().slice(0, 8);
  res.setHeader("X-Request-Id", req.requestId);
  next();
}
