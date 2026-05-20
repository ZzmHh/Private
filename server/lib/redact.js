const SENSITIVE_KEY = /password|token|secret|authorization|apikey|api_key|cookie|credential|private/i;

/**
 * @param {unknown} value
 * @param {number} [depth]
 * @returns {unknown}
 */
export function redact(value, depth = 0) {
  if (depth > 6) return "[…]";
  if (value == null) return value;
  if (typeof value === "string") {
    if (value.length > 8 && /^Bearer\s+/i.test(value)) return "Bearer ***";
    if (value.length > 12 && /[a-zA-Z0-9_-]{20,}/.test(value)) return `${value.slice(0, 4)}***${value.slice(-2)}`;
    return value;
  }
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1));
  if (typeof value !== "object") return value;

  /** @type {Record<string, unknown>} */
  const out = {};
  for (const [key, val] of Object.entries(value)) {
    if (SENSITIVE_KEY.test(key)) {
      out[key] = "***";
    } else {
      out[key] = redact(val, depth + 1);
    }
  }
  return out;
}

/**
 * @param {string} message
 */
export function redactMessage(message = "") {
  return String(message).replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer ***");
}
