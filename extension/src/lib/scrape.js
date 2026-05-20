const FanmengScrape = {
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

  extractNumbers(text) {
    const found = [];
    const re = /(?:GMV|订单|Order|Sales|Revenue|Spend|ROAS|ACOS|库存|Stock|转化|CVR)[^\d]{0,20}([\d,.]+%?)/gi;
    let m;
    while ((m = re.exec(text)) && found.length < 40) {
      found.push({ label: m[0].slice(0, 60), value: m[1] });
    }
    return found;
  },

  extractTables(root) {
    const tables = [];
    root.querySelectorAll("table").forEach((table, idx) => {
      if (idx > 4) return;
      const rows = [];
      table.querySelectorAll("tr").forEach((tr, ri) => {
        if (ri > 8) return;
        const cells = [...tr.querySelectorAll("th,td")].map((c) => c.innerText.trim().slice(0, 120)).filter(Boolean);
        if (cells.length) rows.push(cells);
      });
      if (rows.length) tables.push(rows);
    });
    return tables;
  },

  extractStatCards(root) {
    const cards = [];
    const selectors = [
      "[class*='metric']",
      "[class*='stat']",
      "[class*='card']",
      "[class*='overview']",
      "[data-testid]",
    ];
    const seen = new Set();
    for (const sel of selectors) {
      root.querySelectorAll(sel).forEach((el) => {
        const text = (el.innerText || "").trim().replace(/\s+/g, " ");
        if (text.length < 4 || text.length > 400 || seen.has(text)) return;
        if (/\d/.test(text)) {
          seen.add(text);
          cards.push(text.slice(0, 200));
        }
      });
      if (cards.length >= 24) break;
    }
    return cards.slice(0, 24);
  },

  extractChatMessages(root) {
    const messages = [];
    const candidates = root.querySelectorAll(
      "[class*='message'], [class*='chat'], [class*='bubble'], [role='listitem'], li",
    );
    candidates.forEach((el) => {
      const text = (el.innerText || "").trim();
      if (text.length < 2 || text.length > 800) return;
      if (/^(发送|Send|Reply|回复|Today|Yesterday)/i.test(text)) return;
      messages.push(text.slice(0, 400));
    });
    const uniq = [...new Set(messages)];
    return uniq.slice(-12);
  },

  scrapePage() {
    const url = location.href;
    const title = document.title;
    const pageType = this.detectPageType(url, title);
    const bodyText = (document.body?.innerText || "").slice(0, 12000);

    const data = {
      pageType,
      url,
      title,
      capturedAt: new Date().toISOString(),
      metrics: this.extractNumbers(bodyText),
      statCards: this.extractStatCards(document.body),
      tables: this.extractTables(document.body),
      textSample: bodyText.slice(0, 6000),
    };

    if (pageType === "chat") {
      data.recentMessages = this.extractChatMessages(document.body);
      data.latestBuyerMessage = data.recentMessages[data.recentMessages.length - 1] || "";
    }

    return { pageType, pageUrl: url, title, data };
  },
};

if (typeof globalThis !== "undefined") {
  globalThis.FanmengScrape = FanmengScrape;
}
