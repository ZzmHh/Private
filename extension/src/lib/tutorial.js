/**
 * 凡梦 TikTok Shop 插件 · 卖家试用教程（弹窗 + 卖家中心面板共用）
 */
const FanmengTutorial = {
  VERSION: 1,

  sections: [
    {
      id: "what",
      title: "这个插件能帮你做什么？",
      body: [
        "在 TikTok 卖家中心里，用 AI 帮你写买家回复、看店铺业绩、分析广告和库存。",
        "不需要 TikTok Open API / Partner 应用，在你已登录的浏览器里就能用。",
        "重要：插件只生成草稿，不会自动发送消息，避免误回复。",
      ],
    },
    {
      id: "setup",
      title: "第一次使用（约 2 分钟）",
      steps: [
        "点击浏览器右上角插件图标，填写凡梦 API 地址并登录（与凡梦网站同一账号）。",
        "点「打开 TikTok 卖家中心」，用店铺账号登录后台。",
        "刷新卖家中心页面，右侧会出现「凡梦AI」蓝色面板。",
        "点「绑定本页店铺」，把当前店铺记到插件里（多店可重复绑定后下拉切换）。",
      ],
    },
    {
      id: "cs",
      title: "客服话术：回复买家（最常用）",
      steps: [
        "进入卖家中心 → 买家消息 / 客服聊天页面。",
        "方式 A（推荐）：选中买家发来的文字 → 点「手动生成话术」，或右键选「凡梦生成回复」，或按 Ctrl+Shift+Y（Mac：⌘⇧Y）。",
        "方式 B：开启插件里「自动监听新消息」，有新买家消息时会自动生成草稿（仍不自动发送）。",
        "在面板「客服回复草稿」里改好措辞 → 点「填入聊天框」→ 你自己检查后点 TikTok 的发送按钮。",
        "常用回复可点「存为模板」，下次下拉「插入回复模板」快速复用。",
      ],
      tip: "若面板提示「未识别到买家消息」：用鼠标选中那条买家文字，再点「手动生成话术」即可。",
    },
    {
      id: "diag",
      title: "业绩诊断：看店做得怎么样",
      steps: [
        "在卖家中心依次打开：数据概览 → 订单 → 广告 → 库存（每页停留几秒）。",
        "每页可点面板「同步本页」，或开启「非聊天页自动同步诊断包」。",
        "看面板「诊断包 2/4、3/4…」进度，至少凑满 2/4 再点「业绩诊断」。",
        "分析结果出现在下方文本框，供你参考决策（数据来自当前页面，可能不完整）。",
      ],
    },
    {
      id: "profit",
      title: "广告库存利润（进阶）",
      steps: [
        "同样先同步诊断包页面（见上）。",
        "在凡梦网站「店铺配置」上传 TikTok 经营 CSV（SKU 成本、库存），分析会更准。",
        "回到卖家中心，点面板「广告库存利润」查看 AI 分析建议。",
      ],
    },
    {
      id: "billing",
      title: "订阅与试用（插件与网站共用账号）",
      steps: [
        "注册凡梦账号后默认有 3 天试用，试用期内插件与网站 Agent 共用调用额度。",
        "试用结束或需长期使用：在凡梦网站订阅「标准版」或更高套餐（尝鲜版不含 TikTok 插件）。",
        "插件弹窗登录后可见当前套餐；未订阅时面板会提示并显示「去网站订阅 / 续费」。",
        "支付完成后刷新卖家中心页面，即可继续使用同步、话术、诊断等功能。",
      ],
    },
    {
      id: "check",
      title: "怎么判断插件是否正常？",
      steps: [
        "面板顶部显示绿色「已登录 你的邮箱 · 店铺名」。",
        "点「同步本页」后，状态行出现「已同步」和时间。",
        "聊天页选中买家文字后，「客服回复草稿」里能出现 AI 文字。",
        "若失败：插件弹窗重新登录；chrome://extensions 重新加载插件后刷新卖家中心。",
      ],
    },
  ],

  faq: [
    { q: "需要 TikTok 开发者账号吗？", a: "不需要。插件读取你浏览器里已打开的卖家中心页面。" },
    { q: "会自动帮我把消息发出去吗？", a: "不会。必须你人工核对后，在 TikTok 里自己点发送。" },
    { q: "美国站 / 东南亚站都能用吗？", a: "可以。插件支持 seller.tiktok.com、seller-us.tiktok.com 等 TikTok 卖家域名。" },
    { q: "更新插件后要做什么？", a: "在 chrome://extensions 点「重新加载」，然后刷新卖家中心页面。" },
  ],

  escapeHtml(text) {
    return String(text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  },

  renderHtml(variant = "popup") {
    const compact = variant === "panel";
    const parts = [];

    parts.push(`<div class="fm-tut-wrap ${compact ? "fm-tut-panel" : "fm-tut-popup"}">`);
    if (!compact) {
      parts.push(
        `<p class="fm-tut-lead">专为 TikTok Shop 跨境卖家准备，按下面步骤操作即可试用。</p>`,
      );
    }

    for (const sec of this.sections) {
      parts.push(`<details class="fm-tut-section"${sec.id === "setup" || sec.id === "cs" ? " open" : ""}>`);
      parts.push(`<summary class="fm-tut-summary">${this.escapeHtml(sec.title)}</summary>`);
      parts.push(`<div class="fm-tut-body">`);
      if (sec.body) {
        for (const p of sec.body) {
          parts.push(`<p class="fm-tut-p">${this.escapeHtml(p)}</p>`);
        }
      }
      if (sec.steps) {
        parts.push(`<ol class="fm-tut-ol">`);
        for (const step of sec.steps) {
          parts.push(`<li>${this.escapeHtml(step)}</li>`);
        }
        parts.push(`</ol>`);
      }
      if (sec.tip) {
        parts.push(`<p class="fm-tut-tip">💡 ${this.escapeHtml(sec.tip)}</p>`);
      }
      parts.push(`</div></details>`);
    }

    parts.push(`<details class="fm-tut-section fm-tut-faq">`);
    parts.push(`<summary class="fm-tut-summary">常见问题</summary>`);
    parts.push(`<dl class="fm-tut-faq-list">`);
    for (const item of this.faq) {
      parts.push(`<dt>${this.escapeHtml(item.q)}</dt><dd>${this.escapeHtml(item.a)}</dd>`);
    }
    parts.push(`</dl></details>`);
    parts.push(`</div>`);
    return parts.join("");
  },

  mountInto(container, variant = "popup") {
    if (!container) return;
    container.innerHTML = this.renderHtml(variant);
  },

  async shouldAutoOpenPanel() {
    const data = await chrome.storage.local.get(["fanmeng_tutorial_panel_seen"]);
    return !data.fanmeng_tutorial_panel_seen;
  },

  async markPanelSeen() {
    await chrome.storage.local.set({ fanmeng_tutorial_panel_seen: true });
  },
};

if (typeof globalThis !== "undefined") {
  globalThis.FanmengTutorial = FanmengTutorial;
}
