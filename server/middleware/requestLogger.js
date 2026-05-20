const SKIP_PREFIXES = ["/payment", "/downloads", "/public", "/assets", "/favicon"];

function shouldSkip(pathname = "") {
  if (!pathname.startsWith("/api") && !pathname.startsWith("/webhooks")) {
    if (SKIP_PREFIXES.some((p) => pathname.startsWith(p))) return true;
    if (!pathname.includes(".")) return pathname !== "/";
    return true;
  }
  return false;
}

/** @param {import("express").Request} req @param {import("express").Response} res @param {import("express").NextFunction} next */
export function requestLogger(req, res, next) {
  if (shouldSkip(req.path)) {
    return next();
  }

  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    const user = req.user?.id ? ` user=${String(req.user.id).slice(0, 8)}` : "";
    const line = `[${new Date().toISOString()}] ${req.method} ${req.path} → ${res.statusCode} (${ms}ms) reqId=${req.requestId}${user}`;

    if (res.statusCode >= 500) console.error(line);
    else if (res.statusCode >= 400) console.warn(line);
    else console.log(line);
  });
  next();
}
