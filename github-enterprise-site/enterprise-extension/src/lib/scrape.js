const EnterpriseScrape = {
  detectPageType(url, title) {
    const u = String(url || "").toLowerCase();
    const t = String(title || "").toLowerCase();
    if (/chat|message|im|conversation|customer|service|inbox/.test(u + t)) return "chat";
    if (/order|fulfillment|shipping/.test(u + t)) return "orders";
    if (/ads|advertis|promotion|campaign/.test(u + t)) return "ads";
    if (/product|inventory|stock|warehouse/.test(u + t)) return "inventory";
    if (/analytics|data|insight|performance|dashboard|home/.test(u + t)) return "analytics";
    return "general";
  },

  scrapePage() {
    const pageUrl = location.href;
    const title = document.title || "";
    const pageType = this.detectPageType(pageUrl, title);
    const textSample = (document.body?.innerText || "").slice(0, 8000);
    return {
      pageType,
      pageUrl,
      title,
      textSample,
      scrapedAt: new Date().toISOString(),
    };
  },
};

if (typeof globalThis !== "undefined") {
  globalThis.EnterpriseScrape = EnterpriseScrape;
}
