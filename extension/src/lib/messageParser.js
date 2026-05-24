/**
 * 聊天消息解析：多 profile 尝试、role 标注、取最后一条 buyer
 */
const FanmengMessageParser = {
  MAX_MESSAGES: 30,
  MAX_TEXT_LEN: 500,

  parse(root = document.body, options = {}) {
    const hostname = location.hostname;
    const chain = FanmengChatSelectors.getProfileChain(hostname, {
      preferredId: options.preferredProfileId || null,
      forcedId: options.forcedProfileId || null,
    });
    let best = {
      messages: [],
      profileId: null,
      profileLabel: null,
      method: "none",
      confidence: 0,
    };

    for (const profile of chain) {
      const result = this._extractWithProfile(root, profile);
      if (result.messages.length > best.messages.length || result.confidence > best.confidence) {
        best = result;
      }
      if (result.messages.length >= 2 && result.confidence >= 0.5) break;
    }

    if (best.messages.length === 0) {
      const fallback = this._extractHeuristic(root);
      if (fallback.messages.length) best = fallback;
    }

    best.messages = this._dedupeMessages(best.messages).slice(-this.MAX_MESSAGES);
    best.lastBuyer = this.getLastBuyer(best.messages);
    best.region = FanmengTikTok.detectRegion(hostname);
    best.confidence = best.confidence ?? this._scoreConfidence(best.messages);
    best.recognized = Boolean(best.lastBuyer?.text?.trim());
    best.layoutMode = options.forcedProfileId
      ? "manual"
      : options.preferredProfileId
        ? "learned"
        : "auto";

    return best;
  },

  getLastBuyer(messages) {
    const list = Array.isArray(messages) ? messages : messages?.messages || [];
    for (let i = list.length - 1; i >= 0; i--) {
      if (list[i].role === "buyer" && list[i].text?.trim().length >= 1) {
        return list[i];
      }
    }
    return null;
  },

  getSelectedText() {
    const sel = window.getSelection?.();
    if (!sel || sel.isCollapsed) return "";
    const text = String(sel.toString() || "").trim();
    if (text.length < 1 || text.length > 2000) return "";
    return text;
  },

  _extractWithProfile(root, profile) {
    const messages = [];
    let chatRoot = root;

    for (const sel of profile.chatPanel || []) {
      const panel = root.querySelector(sel);
      if (panel && this._visible(panel)) {
        chatRoot = panel;
        break;
      }
    }

    let listEl = null;
    for (const sel of profile.messageList || []) {
      const el = chatRoot.querySelector(sel);
      if (el && this._visible(el)) {
        listEl = el;
        break;
      }
    }
    const searchRoot = listEl || chatRoot;

    const items = [];
    for (const sel of profile.messageItem || []) {
      searchRoot.querySelectorAll(sel).forEach((el) => {
        if (this._visible(el)) items.push(el);
      });
      if (items.length >= 3) break;
    }

    const seenEl = new WeakSet();
    for (const el of items) {
      if (seenEl.has(el)) continue;
      seenEl.add(el);
      const text = this._extractText(el, profile);
      if (!text || this._shouldSkipText(text)) continue;
      const role = this._classifyRole(el, profile, text);
      messages.push({
        role,
        text: text.slice(0, this.MAX_TEXT_LEN),
        ts: this._extractTime(el),
        source: profile.id,
      });
    }

    const confidence = this._scoreConfidence(messages);
    return {
      messages,
      profileId: profile.id,
      profileLabel: profile.label,
      method: "profile",
      confidence,
    };
  },

  _extractHeuristic(root) {
    const messages = [];
    const generic = FanmengChatSelectors.profiles.generic;
    const candidates = root.querySelectorAll(
      "[class*='message'], [class*='bubble'], [class*='chat'], [data-testid*='message'], [role='listitem']",
    );

    candidates.forEach((el) => {
      if (!this._visible(el)) return;
      const text = (el.innerText || "").trim().replace(/\s+/g, " ");
      if (!text || text.length < 2 || text.length > 800) return;
      if (this._shouldSkipText(text)) return;
      const role = this._classifyRole(el, generic, text);
      messages.push({
        role,
        text: text.slice(0, this.MAX_TEXT_LEN),
        ts: "",
        source: "heuristic",
      });
    });

    return {
      messages: this._dedupeMessages(messages),
      profileId: "heuristic",
      profileLabel: "Heuristic",
      method: "heuristic",
      confidence: messages.length ? 0.25 : 0,
    };
  },

  _extractText(el, profile) {
    for (const sel of profile.textNode || []) {
      const node = el.querySelector(sel);
      if (node) {
        const t = (node.innerText || "").trim();
        if (t.length >= 1) return t.replace(/\s+/g, " ");
      }
    }
    const full = (el.innerText || "").trim().replace(/\s+/g, " ");
    const lines = full.split("\n").map((l) => l.trim()).filter(Boolean);
    const filtered = lines.filter((l) => !this._shouldSkipText(l));
    return (filtered.length ? filtered.join("\n") : full).slice(0, 800);
  },

  _classifyRole(el, profile, text) {
    const cls =
      `${el.className || ""} ${el.getAttribute?.("data-testid") || ""} ${el.getAttribute?.("data-role") || ""} ${el.getAttribute?.("data-type") || ""}`.toLowerCase();
    const parentCls =
      `${el.parentElement?.className || ""} ${el.closest?.("[class*='message']")?.className || ""}`.toLowerCase();
    const combined = `${cls} ${parentCls}`;

    if (profile.systemClass?.test(combined)) return "system";
    if (profile.sellerClass?.test(combined)) return "seller";
    if (profile.buyerClass?.test(combined)) return "buyer";

    const align = this._getAlignment(el);
    if (align === "left") return "buyer";
    if (align === "right") return "seller";
    if (align === "center") return "system";

    const firstLine = text.split("\n")[0]?.trim() || text;
    for (const rule of FanmengChatSelectors.prefixRoleRules) {
      if (rule.re.test(firstLine)) return rule.role;
    }

    if (/^(system|系统|自动回复|auto)/i.test(firstLine)) return "system";
    if (/^(you|shop|seller|客服|商家|店铺)/i.test(firstLine)) return "seller";

    return "unknown";
  },

  _getAlignment(el) {
    const rect = el.getBoundingClientRect();
    if (!rect.width) return "unknown";
    const container =
      el.closest("[class*='message-list'], [class*='chat-content'], [class*='conversation'], [role='log'], [role='list']") ||
      el.parentElement;
    if (!container) return "unknown";
    const cr = container.getBoundingClientRect();
    if (!cr.width) return "unknown";
    const cx = rect.left + rect.width / 2;
    const mid = cr.left + cr.width / 2;
    const threshold = Math.min(40, cr.width * 0.12);
    if (cx < mid - threshold) return "left";
    if (cx > mid + threshold) return "right";
    if (Math.abs(cx - mid) < threshold * 0.5) return "center";
    return "unknown";
  },

  _extractTime(el) {
    const timeEl = el.querySelector("time, [class*='time'], [class*='timestamp']");
    return timeEl?.innerText?.trim()?.slice(0, 40) || "";
  },

  _shouldSkipText(text) {
    const t = String(text || "").trim();
    if (t.length < 2) return true;
    for (const re of FanmengChatSelectors.skipTextPatterns) {
      if (re.test(t)) return true;
    }
    return false;
  },

  _visible(el) {
    if (!el?.getBoundingClientRect) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  },

  _dedupeMessages(messages) {
    const out = [];
    const seen = new Set();
    for (const m of messages) {
      const key = `${m.role}:${m.text.slice(0, 120)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(m);
    }
    return out;
  },

  _scoreConfidence(messages) {
    if (!messages.length) return 0;
    const withRole = messages.filter((m) => m.role !== "unknown").length;
    const buyers = messages.filter((m) => m.role === "buyer").length;
    let score = Math.min(messages.length / 8, 0.4) + (withRole / messages.length) * 0.35;
    if (buyers > 0) score += 0.25;
    return Math.min(score, 1);
  },
};

if (typeof globalThis !== "undefined") {
  globalThis.FanmengMessageParser = FanmengMessageParser;
}
