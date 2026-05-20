/**
 * TikTok 卖家中心 · 凡梦 AI 浮动面板
 */
(function initFanmengPanel() {
  if (window.__fanmengPanelLoaded) return;
  window.__fanmengPanelLoaded = true;

  const PANEL_ID = "fanmeng-ai-panel-root";
  let autoSyncTimer = null;
  let lastSuggestedFor = "";

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function setStatus(msg, kind) {
    const s = document.querySelector(`#${PANEL_ID} .fm-status`);
    if (s) {
      s.textContent = msg;
      s.dataset.kind = kind || "";
    }
  }

  function findReplyInput() {
    const selectors = [
      "textarea",
      "[contenteditable='true']",
      "input[type='text']",
      "[class*='editor']",
      "[class*='input']",
    ];
    for (const sel of selectors) {
      const nodes = document.querySelectorAll(sel);
      for (const node of nodes) {
        if (!node.offsetParent && node.tagName !== "TEXTAREA") continue;
        const r = node.getBoundingClientRect?.();
        if (r && r.width > 80 && r.height > 20) return node;
      }
    }
    return null;
  }

  function fillReplyInput(text) {
    const input = findReplyInput();
    if (!input) return false;
    if (input.tagName === "TEXTAREA" || input.tagName === "INPUT") {
      input.focus();
      input.value = text;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      return true;
    }
    if (input.isContentEditable) {
      input.focus();
      input.textContent = text;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      return true;
    }
    return false;
  }

  async function syncCurrentPage() {
    setStatus("正在同步本页…", "busy");
    try {
      const scraped = FanmengScrape.scrapePage();
      await FanmengApi.pushSnapshot({
        pageType: scraped.pageType,
        pageUrl: scraped.pageUrl,
        title: scraped.title,
        data: scraped.data,
      });
      setStatus(`已同步 · ${scraped.pageType} · ${new Date().toLocaleTimeString()}`, "ok");
      return scraped;
    } catch (e) {
      setStatus(e.message || "同步失败", "err");
      throw e;
    }
  }

  async function runAnalyze(agentId) {
    setStatus(`正在运行 ${agentId}…`, "busy");
    try {
      await syncCurrentPage();
      const res = await FanmengApi.analyze(agentId);
      showResult(res.answer || "无输出");
      setStatus("分析完成，结果已展示", "ok");
    } catch (e) {
      setStatus(e.message || "分析失败", "err");
    }
  }

  async function suggestForLatestMessage() {
    const scraped = FanmengScrape.scrapePage();
    const buyerText =
      scraped.data.latestBuyerMessage ||
      scraped.data.recentMessages?.slice(-1)[0] ||
      prompt("未自动识别到买家消息，请粘贴买家原文：");
    if (!buyerText) {
      setStatus("未找到买家消息", "err");
      return;
    }
    if (buyerText === lastSuggestedFor) return;
    setStatus("正在生成话术…", "busy");
    try {
      const ctx = (scraped.data.textSample || "").slice(0, 800);
      const res = await FanmengApi.suggestReply({ buyerText, orderContext: ctx });
      lastSuggestedFor = buyerText;
      const box = document.querySelector(`#${PANEL_ID} .fm-reply-text`);
      if (box) box.value = res.text || "";
      setStatus("话术已生成，请核对后填入或发送", "ok");
    } catch (e) {
      setStatus(e.message || "生成失败", "err");
    }
  }

  function showResult(text) {
    const box = document.querySelector(`#${PANEL_ID} .fm-result`);
    if (box) box.value = text;
  }

  function buildPanel() {
    if (document.getElementById(PANEL_ID)) return;

    const root = el("div");
    root.id = PANEL_ID;

    const head = el("div", "fm-head");
    head.appendChild(el("strong", "fm-title", "凡梦AI"));
    const collapseBtn = el("button", "fm-icon-btn", "—");
    collapseBtn.type = "button";
    collapseBtn.title = "收起";
    head.appendChild(collapseBtn);

    const body = el("div", "fm-body");
    body.appendChild(el("p", "fm-status", "未连接"));

    const btnRow1 = el("div", "fm-row");
    const syncBtn = el("button", "fm-btn primary", "同步本页");
    syncBtn.type = "button";
    const csBtn = el("button", "fm-btn", "AI 客服话术");
    csBtn.type = "button";
    btnRow1.append(syncBtn, csBtn);

    const btnRow2 = el("div", "fm-row");
    const growthBtn = el("button", "fm-btn", "业绩诊断");
    growthBtn.type = "button";
    const profitBtn = el("button", "fm-btn", "广告库存利润");
    profitBtn.type = "button";
    btnRow2.append(growthBtn, profitBtn);

    const replyLabel = el("label", "fm-label", "客服回复草稿（人工确认后发送）");
    const replyArea = el("textarea", "fm-reply-text");
    replyArea.rows = 4;
    replyArea.placeholder = "点击「AI 客服话术」生成…";
    replyArea.classList.add("fm-reply-text");

    const fillBtn = el("button", "fm-btn", "填入聊天框");
    fillBtn.type = "button";

    const resultArea = el("textarea", "fm-result");
    resultArea.rows = 6;
    resultArea.placeholder = "业绩/利润分析结果…";
    resultArea.classList.add("fm-result");

    body.append(btnRow1, btnRow2, replyLabel, replyArea, fillBtn, resultArea);
    root.append(head, body);
    document.documentElement.appendChild(root);

    let collapsed = false;
    collapseBtn.addEventListener("click", () => {
      collapsed = !collapsed;
      body.style.display = collapsed ? "none" : "";
      collapseBtn.textContent = collapsed ? "+" : "—";
    });

    syncBtn.addEventListener("click", () => syncCurrentPage());
    csBtn.addEventListener("click", () => suggestForLatestMessage());
    growthBtn.addEventListener("click", () => runAnalyze("growth"));
    profitBtn.addEventListener("click", () => runAnalyze("profit"));
    fillBtn.addEventListener("click", () => {
      const text = replyArea.value.trim();
      if (!text) return setStatus("没有可填入的内容", "err");
      if (fillReplyInput(text)) setStatus("已填入聊天框，请人工检查后发送", "ok");
      else setStatus("未找到聊天输入框，请手动复制", "err");
    });

    makeDraggable(root, head);
  }

  function makeDraggable(panel, handle) {
    let sx = 0;
    let sy = 0;
    let ox = 0;
    let oy = 0;
    handle.style.cursor = "move";
    handle.addEventListener("mousedown", (e) => {
      if (e.target.tagName === "BUTTON") return;
      sx = e.clientX;
      sy = e.clientY;
      const rect = panel.getBoundingClientRect();
      ox = rect.left;
      oy = rect.top;
      function move(ev) {
        panel.style.left = `${ox + ev.clientX - sx}px`;
        panel.style.top = `${oy + ev.clientY - sy}px`;
        panel.style.right = "auto";
      }
      function up() {
        document.removeEventListener("mousemove", move);
        document.removeEventListener("mouseup", up);
      }
      document.addEventListener("mousemove", move);
      document.addEventListener("mouseup", up);
    });
  }

  async function setupAutoSync() {
    if (autoSyncTimer) {
      clearInterval(autoSyncTimer);
      autoSyncTimer = null;
    }
    const settings = await FanmengStorage.getSettings();
    if (!settings.autoSync || !settings.token) return;
    const ms = Math.max(5, Number(settings.autoSyncMinutes) || 15) * 60 * 1000;
    autoSyncTimer = setInterval(() => {
      syncCurrentPage().catch(() => {});
    }, ms);
  }

  async function boot() {
    buildPanel();
    try {
      const st = await FanmengApi.status();
      setStatus(`已登录 ${st.user?.email || ""} · 快照 ${st.snapshotCount} 条`, "ok");
    } catch {
      setStatus("请打开插件弹窗登录凡梦账号", "err");
    }
    await setupAutoSync();

    const pageType = FanmengScrape.detectPageType(location.href, document.title);
    if (pageType === "chat") {
      let chatDebounce = null;
      const observer = new MutationObserver(() => {
        clearTimeout(chatDebounce);
        chatDebounce = setTimeout(() => {
          suggestForLatestMessage().catch(() => {});
        }, 2500);
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.fanmeng_settings) setupAutoSync();
  });
})();
