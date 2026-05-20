import { createError } from "../lib/errors.js";

/**
 * @param {unknown} val
 * @param {string} field
 * @param {{ max?: number, minLen?: number }} [opts]
 */
export function requireString(val, field, opts = {}) {
  if (typeof val !== "string" || !val.trim()) {
    throw createError(`${field} 不能为空。`, 400, "VALIDATION_ERROR");
  }
  const trimmed = val.trim();
  if (opts.minLen != null && trimmed.length < opts.minLen) {
    throw createError(`${field} 太短。`, 400, "VALIDATION_ERROR");
  }
  if (opts.max != null && trimmed.length > opts.max) {
    throw createError(`${field} 过长（最多 ${opts.max} 字符）。`, 400, "VALIDATION_ERROR");
  }
  return trimmed;
}

/** @param {unknown} val @param {string} field */
export function requireEmail(val, field = "邮箱") {
  const email = requireString(val, field, { max: 254 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError(`${field} 格式不正确。`, 400, "VALIDATION_ERROR");
  }
  return email.toLowerCase();
}

/**
 * @param {unknown} val
 * @param {string} field
 * @param {readonly string[]} allowed
 */
export function requireEnum(val, field, allowed) {
  const s = requireString(val, field, { max: 64 });
  if (!allowed.includes(s)) {
    throw createError(`${field} 无效，允许值：${allowed.join(" / ")}。`, 400, "VALIDATION_ERROR");
  }
  return s;
}

/**
 * @param {(body: Record<string, unknown>) => void} validateFn
 * @returns {import("express").RequestHandler}
 */
export function validateBody(validateFn) {
  return (req, _res, next) => {
    try {
      validateFn(req.body || {});
      next();
    } catch (err) {
      next(err);
    }
  };
}

export const validators = {
  login(body) {
    requireEmail(body.email);
    requireString(body.password, "密码", { minLen: 1, max: 128 });
  },

  agentRun(body) {
    requireEnum(body.agentId, "agentId", ["trend", "content", "listing", "growth", "service", "profit"]);
    if (body.input != null && typeof body.input !== "string") {
      throw createError("input 必须是字符串。", 400, "VALIDATION_ERROR");
    }
    if (typeof body.input === "string" && body.input.length > 20000) {
      throw createError("input 过长（最多 20000 字符）。", 400, "VALIDATION_ERROR");
    }
  },

  autopilotRun(body) {
    if (body.input != null && typeof body.input !== "string") {
      throw createError("input 必须是字符串。", 400, "VALIDATION_ERROR");
    }
    if (typeof body.input === "string" && body.input.length > 20000) {
      throw createError("input 过长。", 400, "VALIDATION_ERROR");
    }
  },

  csBuyerText(body) {
    requireString(body.buyerText, "buyerText", { max: 4000 });
  },

  extensionSnapshot(body) {
    if (!body.data || typeof body.data !== "object" || Array.isArray(body.data)) {
      throw createError("请提供 data 对象（页面抓取结果）。", 400, "VALIDATION_ERROR");
    }
  },
};
