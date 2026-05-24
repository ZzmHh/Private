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
  ],

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
    const here = location.pathname.split("/").pop() || "index.html";
    const map = {
      "index.html": "analytics",
      "analytics.html": "analytics",
      "orders.html": "orders",
      "products.html": "inventory",
      "ads.html": "ads",
      "chat.html": null,
    };
    const current = map[here];
    const chips = [
      { key: "analytics", label: "数据概览" },
      { key: "orders", label: "订单" },
      { key: "ads", label: "广告" },
      { key: "inventory", label: "库存/商品" },
    ];
    return `<div class="pack-banner" aria-label="Diagnosis pack">
      <strong style="width:100%;margin-bottom:4px;font-size:13px">诊断包 4/4 · 插件「同步本页」逐页上传</strong>
      ${chips
        .map((c) => {
          const done = current === c.key || (here === "index.html" && c.key === "analytics");
          return `<span class="pack-chip${done ? " is-done" : ""}">${done ? "✓" : "○"} ${c.label}</span>`;
        })
        .join("")}
    </div>`;
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
  },
};
