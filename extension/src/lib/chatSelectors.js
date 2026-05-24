/**
 * TikTok 卖家中心 · 多区域/多布局聊天 DOM 选择器配置
 * 按 hostname 匹配区域，再按 profile 链式尝试，最后走 generic 兜底
 */
const FanmengChatSelectors = {
  /** @type {'buyer'|'seller'|'system'|'unknown'} */
  ROLES: { BUYER: "buyer", SELLER: "seller", SYSTEM: "system", UNKNOWN: "unknown" },

  /** hostname 片段 → 优先 profile id 列表 */
  regionProfileOrder(hostname = location.hostname) {
    return FanmengTikTok.chatProfileOrder(hostname);
  },

  /** 各区域布局 profile */
  profiles: {
    /** 美国本土卖家中心 */
    us: {
      id: "us",
      label: "US Seller Center",
      chatPanel: [
        "[class*='ChatRoom']",
        "[class*='chat-room']",
        "[class*='im-chat']",
        "[class*='conversation-panel']",
        "[class*='message-panel']",
        "[data-testid*='chat-panel']",
        "[data-testid*='conversation-detail']",
        "main [class*='detail']",
      ],
      messageList: [
        "[class*='message-list']",
        "[class*='MessageList']",
        "[class*='chat-content']",
        "[class*='im-content']",
        "[role='log']",
        "[role='list']",
        "[class*='scroll'] [class*='list']",
      ],
      messageItem: [
        "[class*='message-item']",
        "[class*='MessageItem']",
        "[class*='chat-item']",
        "[class*='bubble-wrap']",
        "[class*='msg-row']",
        "[data-testid*='message-item']",
        "[data-testid*='chat-message']",
        "[role='listitem']",
      ],
      textNode: [
        "[class*='message-text']",
        "[class*='MessageText']",
        "[class*='bubble-content']",
        "[class*='msg-content']",
        "[class*='text-content']",
        "p",
        "span",
      ],
      buyerClass: /customer|buyer|user|left|incoming|from-user|visitor|consumer|client/i,
      sellerClass: /seller|shop|merchant|self|outgoing|right|from-shop|from-seller|my-message|agent/i,
      systemClass: /system|notice|tip|auto-reply|notification|divider|timestamp|center|announcement/i,
    },

    /** 美国跨境 / TikTok Global Shop US */
    us_global: {
      id: "us_global",
      label: "US Global Shop",
      chatPanel: [
        "[class*='ChatDetail']",
        "[class*='chat-detail']",
        "[class*='ConversationDetail']",
        "[class*='im-panel']",
        "[class*='message-container']",
      ],
      messageList: [
        "[class*='message-list']",
        "[class*='MessageList']",
        "[class*='chat-body']",
        "[class*='im-message-list']",
        "[role='log']",
      ],
      messageItem: [
        "[class*='message-row']",
        "[class*='MessageRow']",
        "[class*='chat-bubble']",
        "[class*='im-message']",
        "[data-testid*='message']",
      ],
      textNode: [
        "[class*='content']",
        "[class*='text']",
        "[class*='body']",
        "p",
      ],
      buyerClass: /buyer|customer|user|left|incoming|consumer/i,
      sellerClass: /seller|shop|self|right|outgoing|staff|cs/i,
      systemClass: /system|notice|auto|tip|divider|center/i,
    },

    /** 东南亚 / 默认 seller.tiktok.com */
    sea: {
      id: "sea",
      label: "SEA Seller Center",
      chatPanel: [
        "[class*='chat']",
        "[class*='Chat']",
        "[class*='im-']",
        "[class*='conversation']",
        "[class*='inbox-detail']",
        "[class*='message-detail']",
      ],
      messageList: [
        "[class*='message-list']",
        "[class*='chat-list']",
        "[class*='msg-list']",
        "[class*='im-list']",
        "[role='log']",
        "[role='list']",
      ],
      messageItem: [
        "[class*='message']",
        "[class*='bubble']",
        "[class*='msg-']",
        "[data-testid*='message']",
        "li",
      ],
      textNode: [
        "[class*='text']",
        "[class*='content']",
        "[class*='body']",
        "p",
        "span",
      ],
      buyerClass: /buyer|customer|user|left|incoming|pembeli|pelanggan|买家|用户/i,
      sellerClass: /seller|shop|merchant|self|right|outgoing|客服|商家|店铺/i,
      systemClass: /system|notice|tip|auto|系统|通知|divider|center/i,
    },

    /** 跨境 TikTok Global Shop */
    global_cb: {
      id: "global_cb",
      label: "Global Cross-border",
      chatPanel: [
        "[class*='Chat']",
        "[class*='IM']",
        "[class*='conversation']",
        "[class*='message-area']",
      ],
      messageList: [
        "[class*='MessageList']",
        "[class*='message-list']",
        "[class*='chat-scroll']",
        "[role='log']",
      ],
      messageItem: [
        "[class*='MessageItem']",
        "[class*='message-item']",
        "[class*='bubble']",
        "[data-testid*='message']",
      ],
      textNode: [
        "[class*='message-text']",
        "[class*='text']",
        "[class*='content']",
      ],
      buyerClass: /buyer|customer|user|left|incoming/i,
      sellerClass: /seller|shop|self|right|outgoing|merchant/i,
      systemClass: /system|notice|auto|tip|center/i,
    },

    /** 凡梦本地 TikTok 客服模拟页 */
    mock: {
      id: "mock",
      label: "Fanmeng Mock Seller Center",
      chatPanel: [".chat-room", ".ChatRoom", ".conversation-panel", "[data-fanmeng-mock='tiktok-cs']"],
      messageList: [".message-list", ".MessageList", ".chat-content"],
      messageItem: [".message-list > .message-item", ".message-item[data-role]"],
      textNode: [".message-text", ".bubble-content", "p"],
      buyerClass: /buyer|incoming|customer|left/i,
      sellerClass: /seller|outgoing|shop|merchant|right|self/i,
      systemClass: /system|notice|tip|divider|center/i,
    },

    /** 通用兜底：最宽匹配 */
    generic: {
      id: "generic",
      label: "Generic fallback",
      chatPanel: ["main", "[role='main']", "body"],
      messageList: [
        "[class*='message-list']",
        "[class*='chat-content']",
        "[class*='conversation']",
        "[role='log']",
        "[role='list']",
      ],
      messageItem: [
        "[class*='message']",
        "[class*='bubble']",
        "[class*='chat-item']",
        "[data-testid*='message']",
        "[role='listitem']",
        "li",
      ],
      textNode: ["[class*='text']", "[class*='content']", "p", "span"],
      buyerClass: /buyer|customer|user|left|incoming|visitor|买家|用户/i,
      sellerClass: /seller|shop|merchant|self|right|outgoing|客服|商家|店铺|you/i,
      systemClass: /system|notice|tip|auto|系统|通知|divider|timestamp|center/i,
    },
  },

  /** 文本层面排除：非对话内容 */
  skipTextPatterns: [
    /^(发送|Send|Reply|回复|Today|Yesterday|今天|昨天|刚刚|Just now)$/i,
    /^(已读|Read|Delivered|Sending|发送中)$/i,
    /^\d{1,2}:\d{2}(\s*(AM|PM))?$/,
    /^\d{4}[-/]\d{1,2}[-/]\d{1,2}/,
    /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)/i,
  ],

  /** 首行前缀 → 角色 */
  prefixRoleRules: [
    { role: "system", re: /^(system|系统|自动回复|auto.?reply|notification|通知|tip|提示)/i },
    { role: "seller", re: /^(you|shop|seller|merchant|客服|商家|我的店铺|店铺|我)/i },
    { role: "buyer", re: /^(buyer|customer|user|买家|用户|客户)/i },
  ],

  getProfileChain(hostname, options = {}) {
    const { preferredId, forcedId } = options;
    if (forcedId && this.profiles[forcedId]) {
      const forced = this.profiles[forcedId];
      const generic = this.profiles.generic;
      return generic && forced.id !== generic.id ? [forced, generic] : [forced];
    }

    const order = [];
    try {
      const path = typeof location !== "undefined" ? String(location.pathname || "") : "";
      const h = String(hostname || (typeof location !== "undefined" ? location.hostname : "")).toLowerCase();
      if ((h === "127.0.0.1" || h === "localhost") && /\/mock\/tiktok/i.test(path)) {
        order.push("mock");
      }
    } catch {
      /* ignore */
    }
    if (preferredId && this.profiles[preferredId] && !order.includes(preferredId)) {
      order.unshift(preferredId);
    }
    for (const id of this.regionProfileOrder(hostname)) {
      if (!order.includes(id)) order.push(id);
    }
    const seen = new Set();
    const chain = [];
    for (const id of order) {
      if (seen.has(id)) continue;
      seen.add(id);
      const p = this.profiles[id];
      if (p) chain.push(p);
    }
    return chain;
  },

  /** 面板「聊天布局」下拉选项 */
  listLayoutOptions(includeMock = false) {
    const ids = ["auto", "us", "us_global", "sea", "global_cb", "generic"];
    if (includeMock) ids.splice(1, 0, "mock");
    return ids.map((id) => {
      if (id === "auto") return { id, label: "自动（域名 + 记忆布局）" };
      const p = this.profiles[id];
      return { id, label: p?.label || id };
    });
  },

  getProfileById(id) {
    return this.profiles[id] || null;
  },

  findChatPanelRoot(profileId, root = document.body) {
    const profile = this.getProfileById(profileId);
    if (!profile) return null;
    for (const sel of profile.chatPanel || []) {
      const el = root.querySelector(sel);
      if (el?.getBoundingClientRect?.().width > 0 && el.getBoundingClientRect().height > 0) return el;
    }
    return null;
  },
};

if (typeof globalThis !== "undefined") {
  globalThis.FanmengChatSelectors = FanmengChatSelectors;
}
