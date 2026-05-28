const LeadRadarDom = {
  platform() {
    const h = location.hostname.replace(/^www\./, "");
    if (h.includes("tiktok.com")) return "tiktok";
    if (h === "x.com" || h === "twitter.com") return "x";
    if (h.includes("xiaohongshu.com")) return "xiaohongshu";
    if (h.includes("douyin.com")) return "douyin";
    if (h.includes("facebook.com")) return "facebook";
    return "web";
  },

  hash(text) {
    let h = 0;
    const s = String(text).slice(0, 400);
    for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
    return `lr_${Math.abs(h)}`;
  },

  textOf(node) {
    const c = node.cloneNode(true);
    c.querySelectorAll("script,style,button,svg").forEach((e) => e.remove());
    return (c.innerText || "").replace(/\s+/g, " ").trim();
  },

  extract() {
    const p = this.platform();
    if (p === "tiktok") return this._merge(this._tiktok(), p);
    if (p === "x") return this._merge(this._x(), p);
    if (p === "xiaohongshu") return this._merge(this._xhs(), p);
    if (p === "douyin") return this._merge(this._douyin(), p);
    return this._merge(this._generic(), p);
  },

  _merge(primary, platform) {
    if (primary.length >= 5) return primary.slice(0, 40);
    const extra = this._collectVisibleTexts(platform);
    const seen = new Set(primary.map((x) => x.id));
    for (const row of extra) {
      if (seen.has(row.id)) continue;
      seen.add(row.id);
      primary.push(row);
    }
    return primary.slice(0, 40);
  },

  /** 兜底：抓取页面上像评论/描述的文字块 */
  _collectVisibleTexts(platform) {
    const out = [];
    const seen = new Set();
    const sels = [
      "[data-e2e*='comment']",
      "[class*='comment']",
      "[class*='Comment']",
      "[class*='note-text']",
      "[class*='desc']",
      "[class*='content']",
      "[class*='title']",
      "p",
      "span",
    ];

    for (const sel of sels) {
      try {
        document.querySelectorAll(sel).forEach((node) => {
          if (node.closest("#lead-radar-root")) return;
          if (node.querySelector("p, div, span") && node.childElementCount > 6) return;
          const text = this.textOf(node);
          if (text.length < 12 || text.length > 700) return;
          if (/^(点赞|收藏|分享|关注|评论|转发|\d+[万w]?)$/.test(text)) return;
          const id = this.hash(text.slice(0, 120));
          if (seen.has(id)) return;
          seen.add(id);
          out.push({
            id,
            platform,
            author: "用户",
            url: location.href,
            text,
            element: node,
          });
        });
      } catch {
        /* ignore */
      }
    }
    return out.slice(0, 25);
  },

  /** 抖音网页版：推荐页文字少，搜索页/评论区更有效 */
  _douyin() {
    const out = [];
    const seen = new Set();

    const push = (node, text, author, url) => {
      const t = String(text || "").trim();
      if (t.length < 8) return;
      const id = this.hash(t.slice(0, 120));
      if (seen.has(id)) return;
      seen.add(id);
      out.push({
        id,
        platform: "douyin",
        author: author || "抖音用户",
        url: url || location.href,
        text: t,
        element: node,
      });
    };

    const selectors = [
      '[class*="CommentItem"]',
      '[class*="comment-item"]',
      '[class*="commentItem"]',
      '[class*="search-result"]',
      '[class*="SearchResult"]',
      '[class*="video-info-detail"]',
      '[data-e2e="search-common"]',
      "div[class*='title']",
      "span[class*='title']",
      "p[class*='desc']",
      "div[class*='content']",
    ];

    for (const sel of selectors) {
      try {
        document.querySelectorAll(sel).forEach((node) => {
          if (node.closest("#lead-radar-root")) return;
          const text = this.textOf(node);
          if (text.length < 10 || text.length > 900) return;
          const author =
            node.querySelector('[class*="author"], [class*="nickname"], [class*="name"]')?.textContent?.trim() ||
            "抖音用户";
          push(node, text, author, location.href);
        });
      } catch {
        /* ignore invalid selector */
      }
    }

    // 搜索页：链接带 /search/
    if (location.pathname.includes("/search")) {
      document.querySelectorAll("a[href*='/video/'], a[href*='modal_id']").forEach((a) => {
        const block = a.closest("div")?.parentElement || a.parentElement;
        if (!block) return;
        const text = this.textOf(block);
        if (text.length >= 15) push(block, text, "抖音用户", a.href || location.href);
      });
    }

    if (out.length) return out.slice(0, 40);
    return out;
  },

  _tiktok() {
    const out = [];
    const sels = [
      '[data-e2e="recommend-list-item"]',
      '[data-e2e="comment-level-1"]',
      '[data-e2e="comment-level-2"]',
      '[data-e2e="search-card-item"]',
      '[data-e2e="search-comment-container"]',
      '[class*="DivCommentItemContainer"]',
      '[class*="CommentItem"]',
    ];
    const seen = new Set();
    for (const sel of sels) {
      document.querySelectorAll(sel).forEach((node) => {
        const text = this.textOf(node);
        if (text.length < 12) return;
        const id = this.hash(text.slice(0, 120));
        if (seen.has(id)) return;
        seen.add(id);
        out.push({
          id,
          platform: "tiktok",
          author: node.querySelector('[data-e2e="video-author-uniqueid"]')?.textContent?.trim() || "用户",
          url: node.querySelector('a[href*="/video/"]')?.href || location.href,
          text,
          element: node,
        });
      });
    }
    return out.slice(0, 40);
  },

  _x() {
    const out = [];
    document.querySelectorAll('article[data-testid="tweet"]').forEach((node) => {
      const text = node.querySelector('[data-testid="tweetText"]')?.innerText?.trim() || "";
      if (text.length < 12) return;
      out.push({
        id: this.hash(text),
        platform: "x",
        author: node.querySelector('[data-testid="User-Name"]')?.innerText?.split("\n")[0] || "用户",
        url: node.querySelector('a[href*="/status/"]')?.href || location.href,
        text,
        element: node,
      });
    });
    return out.slice(0, 40);
  },

  _xhs() {
    const out = [];
    document.querySelectorAll(
      "section.note-item, .note-item, .comment-item, [class*='comment-item'], [class*='note-content'], [class*='title']",
    ).forEach((node) => {
      const text = this.textOf(node);
      if (text.length < 12) return;
      out.push({
        id: this.hash(text.slice(0, 120)),
        platform: "xiaohongshu",
        author: node.querySelector(".name, [class*='author']")?.textContent?.trim() || "用户",
        url: location.href,
        text,
        element: node,
      });
    });
    return out.slice(0, 40);
  },

  _generic() {
    const out = [];
    document.querySelectorAll("article,[role='article']").forEach((node) => {
      if (node.closest("#lead-radar-root")) return;
      const text = this.textOf(node);
      if (text.length < 25 || text.length > 800) return;
      out.push({ id: this.hash(text), platform: this.platform(), author: "用户", url: location.href, text, element: node });
    });
    return out.slice(0, 25);
  },

  fillInput(text) {
    const sels = [
      '[data-e2e="comment-input"]',
      '[class*="comment-input"]',
      '[class*="CommentInput"]',
      'div[contenteditable="true"][role="textbox"]',
      'textarea[placeholder*="评论"]',
      'textarea[placeholder*="说点什么"]',
      'div[contenteditable="true"]',
      "textarea",
    ];
    for (const sel of sels) {
      const el = document.querySelector(sel);
      if (!el || el.closest("#lead-radar-root")) continue;
      el.focus();
      if (el.isContentEditable) {
        el.textContent = text;
        el.dispatchEvent(new InputEvent("input", { bubbles: true }));
      } else {
        el.value = text;
        el.dispatchEvent(new Event("input", { bubbles: true }));
      }
      return true;
    }
    return false;
  },

  highlight(el) {
    if (!el) return;
    el.style.outline = "2px solid #f97316";
    el.style.outlineOffset = "2px";
    setTimeout(() => {
      el.style.outline = "";
    }, 3000);
  },
};

if (typeof globalThis !== "undefined") globalThis.LeadRadarDom = LeadRadarDom;
