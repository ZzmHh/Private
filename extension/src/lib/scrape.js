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

  /** @returns {{ messages: object[], lastBuyer: object|null, recognized: boolean, profileId: string|null }} */
  parseChat(root = document.body, options = null) {
    return FanmengMessageParser.parse(root, options || {});
  },

  /** 读取 storage 缓存的布局偏好（由面板 init 时 loadChatLayoutCache） */
  parseChatWithPrefs(root = document.body, shopId = "") {
    const opts = FanmengStorage.getChatParseOptions(shopId, location.hostname);
    const parsed = this.parseChat(root, opts);
    if (parsed.recognized && parsed.profileId) {
      FanmengStorage.rememberChatLayoutSuccess(
        shopId,
        location.hostname,
        parsed.profileId,
        parsed.confidence,
      ).catch(() => {});
    }
    return parsed;
  },

  extractChatMessages(root) {
    const parsed = this.parseChat(root);
    return parsed.messages.map((m) => m.text);
  },

  extractChatMessagesWithRoles(root) {
    return this.parseChat(root).messages;
  },

  extractLatestBuyerMessage(root) {
    const parsed = this.parseChat(root);
    return parsed.lastBuyer?.text || "";
  },

  isChatRecognized(root) {
    return this.parseChat(root).recognized;
  },

  detectShopContext() {
    const pick = (sel) => {
      const el = document.querySelector(sel);
      return el?.innerText?.trim().slice(0, 120) || "";
    };
    const candidates = [
      pick("[class*='shop-name']"),
      pick("[class*='shopName']"),
      pick("[class*='store-name']"),
      pick("header h1"),
      pick("[class*='header'] [class*='title']"),
    ].filter(Boolean);

    let name = candidates[0] || "";
    if (!name && document.title) {
      name = document.title.replace(/\s*[-|].*TikTok.*$/i, "").trim();
    }
    if (!name) name = FanmengTikTok.PLATFORM_LABEL;

    const region = FanmengTikTok.detectRegion(location.hostname);
    const id = FanmengTikTok.buildShopId(name, location.hostname);

    return {
      id,
      name,
      platform: FanmengTikTok.PLATFORM,
      region,
      regionLabel: FanmengTikTok.regionLabel(region),
    };
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

    const shopHint = this.detectShopContext();
    data.shopHint = shopHint;

    if (pageType === "chat") {
      const chatParse = this.parseChatWithPrefs(document.body, shopHint.id);
      data.chatParse = {
        profileId: chatParse.profileId,
        profileLabel: chatParse.profileLabel,
        region: chatParse.region,
        recognized: chatParse.recognized,
        method: chatParse.method,
        confidence: chatParse.confidence,
        layoutMode: chatParse.layoutMode,
      };
      data.messagesWithRoles = chatParse.messages;
      data.recentMessages = chatParse.messages.map((m) => m.text);
      data.latestBuyerMessage = chatParse.lastBuyer?.text || "";
    }

    return { pageType, pageUrl: url, title, data };
  },
};

if (typeof globalThis !== "undefined") {
  globalThis.FanmengScrape = FanmengScrape;
}
