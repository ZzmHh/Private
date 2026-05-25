/**
 * 凡梦 · TikTok Shop 本地模拟卖家中心（插件测试用）
 */
window.MockShop = {
  STORAGE_KEY: "fanmeng_mock_shop_v1",

  pages: [
    { id: "hub", href: "index.html", label: "Home", icon: "⌂" },
    { id: "analytics", href: "analytics.html", label: "Analytics", icon: "📊" },
    { id: "orders", href: "orders.html", label: "Orders", icon: "📦" },
    { id: "products", href: "products.html", label: "Products", icon: "🏷" },
    { id: "ads", href: "ads.html", label: "Ads", icon: "📣" },
    { id: "chat", href: "chat.html", label: "Messages", icon: "💬" },
    { id: "analyze", href: "analyze.html", label: "Insights AI", icon: "🧠" },
  ],

  PACK_KEYS: ["analytics", "orders", "ads", "inventory"],

  defaultShopName: "Fanmeng Demo Store US",

  getShopName() {
    try {
      return localStorage.getItem(`${this.STORAGE_KEY}_name`) || this.defaultShopName;
    } catch {
      return this.defaultShopName;
    }
  },

  setShopName(name) {
    const n = String(name || "").trim() || this.defaultShopName;
    try {
      localStorage.setItem(`${this.STORAGE_KEY}_name`, n);
    } catch {
      /* ignore */
    }
    this.syncShopName();
    return n;
  },

  syncShopName() {
    const name = this.getShopName();
    document.querySelectorAll(".shop-name, #shopName").forEach((el) => {
      if (el.tagName === "INPUT") {
        el.value = name;
      } else {
        el.textContent = name;
      }
    });
  },

  renderNav(activeId) {
    const nav = document.getElementById("mockNav");
    if (!nav) return;
    nav.innerHTML = this.pages
      .map((p) => {
        const active = p.id === activeId ? " is-active" : "";
        return `<a class="tts-nav-item${active}" href="${p.href}"><span class="tts-nav-icon">${p.icon}</span>${p.label}</a>`;
      })
      .join("");
  },

  renderShell(activeId) {
    const mount = document.getElementById("mockShell");
    if (!mount) return;

    mount.innerHTML = `
      <div class="mock-watermark">MOCK · 插件测试</div>
      <div id="extProbe" class="ext-probe warn">正在检测凡梦插件…</div>
      <header class="tts-topbar">
        <div class="tts-logo">
          <div class="tts-logo-mark" aria-hidden="true"></div>
          TikTok Shop <span>Seller Center</span>
        </div>
        <div class="shop-name" id="shopName">${this.getShopName()}</div>
      </header>
      <div class="tts-shell">
        <nav class="tts-nav" id="mockNav" aria-label="Mock navigation"></nav>
        <div class="tts-main" id="mockMain"></div>
      </div>`;

    const main = document.getElementById("mockMain");
    const content = document.getElementById("mockPageContent");
    if (main && content) {
      main.appendChild(content);
      content.hidden = false;
    }

    this.renderNav(activeId);
    this.syncShopName();
    this.bindShopNameInput();
    this.probeExtension();
    window.setInterval(() => this.probeExtension(), 5000);
  },

  bindShopNameInput() {
    const input = document.getElementById("shopNameInput");
    if (!input) return;
    input.value = this.getShopName();
    input.addEventListener("input", () => this.setShopName(input.value));
  },

  renderPackBanner() {
    const state = this.getSyncState();
    const done = this.PACK_KEYS.filter((k) => state[k]).length;
    const chips = [
      { key: "analytics", label: "数据概览", href: "analytics.html" },
      { key: "orders", label: "订单", href: "orders.html" },
      { key: "ads", label: "广告", href: "ads.html" },
      { key: "inventory", label: "库存/商品", href: "products.html" },
    ];
    return `<div class="pack-banner" aria-label="Diagnosis pack">
      <strong style="width:100%;margin-bottom:4px;font-size:13px">诊断包 ${done}/4 · 逐页打开并点插件「同步本页」</strong>
      ${chips
        .map((c) => {
          const ok = Boolean(state[c.key]);
          return `<a class="pack-chip${ok ? " is-done" : ""}" href="${c.href}">${ok ? "✓" : "○"} ${c.label}</a>`;
        })
        .join("")}
      <button type="button" class="pack-reset" onclick="MockShop.resetSyncState()">重置进度</button>
    </div>`;
  },

  getSyncState() {
    try {
      const raw = localStorage.getItem(`${this.STORAGE_KEY}_sync`);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  },

  markPageSynced(packKey) {
    if (!this.PACK_KEYS.includes(packKey)) return;
    const state = this.getSyncState();
    state[packKey] = new Date().toISOString();
    try {
      localStorage.setItem(`${this.STORAGE_KEY}_sync`, JSON.stringify(state));
    } catch {
      /* ignore */
    }
    document.querySelectorAll(".pack-banner").forEach((el) => {
      el.outerHTML = this.renderPackBanner();
    });
    document.dispatchEvent(new CustomEvent("fanmeng-mock-sync", { detail: { packKey, state: this.getSyncState() } }));
  },

  resetSyncState() {
    try {
      localStorage.removeItem(`${this.STORAGE_KEY}_sync`);
    } catch {
      /* ignore */
    }
    document.querySelectorAll(".pack-banner").forEach((el) => {
      el.outerHTML = this.renderPackBanner();
    });
    document.dispatchEvent(new CustomEvent("fanmeng-mock-sync", { detail: { state: {} } }));
  },

  getSyncDoneCount() {
    const state = this.getSyncState();
    return this.PACK_KEYS.filter((k) => state[k]).length;
  },

  getWorkspaceUrl() {
    const host = location.hostname;
    if (host === "127.0.0.1" || host === "localhost") {
      const port = location.port === "8787" ? "5173" : location.port || "5173";
      return `${location.protocol}//${host}:${port}`;
    }
    return `${location.protocol}//${host}`;
  },

  openFanmengAgent(agentId, { profitMode = "" } = {}) {
    const workspace = this.getWorkspaceUrl();
    const hash = agentId === "growth" ? "growth-run" : "profit-run";
    try {
      sessionStorage.setItem(
        "fanmeng_pending_agent_run",
        JSON.stringify({
          agentId,
          autoRun: true,
          profitMode: profitMode || "",
          ts: Date.now(),
        }),
      );
    } catch {
      /* ignore */
    }
    window.open(`${workspace}/#${hash}`, "_blank", "noopener,noreferrer");
  },

  renderAnalyzeStatus() {
    const done = this.getSyncDoneCount();
    const growthReady = done >= 2;
    const state = this.getSyncState();
    const hasAds = Boolean(state.ads);
    const hasInv = Boolean(state.inventory);
    let profitMode = "framework";
    let profitLabel = "框架模式";
    if (hasAds && hasInv) {
      profitMode = "trend";
      profitLabel = "趋势模式";
    }
    if (done >= 4) {
      profitMode = "precise";
      profitLabel = "精算模式（演示）";
    }
    return { done, growthReady, profitMode, profitLabel, hasAds, hasInv, state };
  },

  probeExtension() {
    const probe = document.getElementById("extProbe");
    if (!probe) return;
    const panel = document.getElementById("fanmeng-ai-panel-root");
    if (panel) {
      probe.className = "ext-probe ok";
      probe.textContent = "凡梦插件已注入。请打开右侧浮动面板测试同步、客服、诊断包。";
      return;
    }
    probe.className = "ext-probe err";
    probe.innerHTML =
      "未检测到插件面板。请到 chrome://extensions 重新加载凡梦插件，并确认 API 地址与网站账号已登录。";
  },

  init(activeId) {
    this.renderShell(activeId);
    const packMap = {
      analytics: "analytics",
      orders: "orders",
      products: "inventory",
      ads: "ads",
    };
    if (packMap[activeId]) {
      this.markPageSynced(packMap[activeId]);
    }
  },
};
