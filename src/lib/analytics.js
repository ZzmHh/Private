/**
 * 前端埋点 + Umami（可选）
 */

let umamiLoaded = false;

export function getSessionId() {
  try {
    let id = sessionStorage.getItem("fanmeng_sid");
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem("fanmeng_sid", id);
    }
    return id;
  } catch {
    return "anonymous";
  }
}

export function initUmami() {
  const websiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID?.trim();
  const scriptUrl = import.meta.env.VITE_UMAMI_SCRIPT_URL?.trim();
  if (!websiteId || !scriptUrl || umamiLoaded) return;

  const s = document.createElement("script");
  s.async = true;
  s.defer = true;
  s.src = scriptUrl;
  s.setAttribute("data-website-id", websiteId);
  document.head.appendChild(s);
  umamiLoaded = true;
}

/**
 * @param {string} event
 * @param {Record<string, unknown>} [properties]
 * @param {{ path?: string, token?: string }} [opts]
 */
export function trackEvent(event, properties = {}, opts = {}) {
  const path = opts.path ?? `${window.location.pathname}${window.location.hash || ""}`;

  try {
    if (typeof window.umami?.track === "function") {
      window.umami.track(event, properties);
    }
  } catch {
    /* ignore */
  }

  const headers = { "Content-Type": "application/json" };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;

  fetch("/api/track", {
    method: "POST",
    headers,
    body: JSON.stringify({
      event,
      sessionId: getSessionId(),
      path,
      properties,
    }),
    keepalive: true,
  }).catch(() => {});
}

export function trackPageView(hashRoute = "", token = "") {
  trackEvent("page_view", { route: hashRoute || "home" }, { token });
}

export function trackCtaRegister(token = "") {
  trackEvent("cta_register_click", {}, { token });
}
