/**
 * TikTok 卖家中心 · 凡梦 AI 浮动面板 v0.3
 */
(function initFanmengPanel() {
  if (window.__fanmengPanelLoaded) return;
  window.__fanmengPanelLoaded = true;

  const PANEL_ID = "fanmeng-ai-panel-root";
  let autoSyncTimer = null;
  let activeShop = null;
  let chatStop = null;
  let cachedEntitlements = null;

  function handlePaidApiError(e) {
    const msg = e?.message || "请求失败";
    setStatus(msg, "err");
    if (e?.status === 402 || e?.status === 403 || e?.code === "SUBSCRIPTION_EXPIRED") {
      refreshEntitlements().catch(() => {});
    }
  }

  async function refreshEntitlements() {
    try {
      cachedEntitlements = await FanmengApi.refreshEntitlements(activeShop?.id);
    } catch {
      cachedEntitlements = await FanmengBilling.getEntitlements();
    }
    applyPaywallUI(cachedEntitlements);
    return cachedEntitlements;
  }

  function applyPaywallUI(ent) {
    const paywall = document.querySelector(`#${PANEL_ID} .fm-paywall`);
    const text = document.querySelector(`#${PANEL_ID} .fm-paywall-text`);
    const planLine = document.querySelector(`#${PANEL_ID} .fm-plan-line`);
    if (!paywall) return;

    const allowed = Boolean(ent?.extensionAllowed);
    paywall.classList.toggle("hidden", allowed);

    if (text) {
      text.textContent = allowed
        ? ""
        : ent?.extensionBlockReason || "请订阅标准版或更高套餐后使用 TikTok 插件。";
    }

    if (planLine) {
      planLine.textContent = allowed ? FanmengBilling.planStatusLine(ent) : "";
      planLine.dataset.kind = ent?.trialActive ? "warn" : allowed ? "ok" : "err";
    }

    document.querySelectorAll(`#${PANEL_ID} .fm-paid-action`).forEach((btn) => {
      btn.disabled = !allowed;
      btn.title = allowed ? "" : "需要有效订阅";
    });
  }

  async function requireExtensionAccess(fromAuto = false) {
    const ent = cachedEntitlements || (await refreshEntitlements());
    if (ent?.extensionAllowed) return ent;
    if (!fromAuto) {
      setStatus(ent?.extensionBlockReason || "请先订阅后使用", "err");
    }
    throw new Error(ent?.extensionBlockReason || "EXTENSION_PAYWALL");
  }

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  const RECOGNITION_FAIL_HINT = "未识别到买家消息，请选中一条消息后点「手动生成话术」";

  function getSelectedChatText() {
    return FanmengMessageParser.getSelectedText();
  }

  function roleLabel(role) {
    if (role === "buyer") return "买家";
    if (role === "seller") return "卖家";
    if (role === "system") return "系统";
    return "?";
  }

  function renderMessageList(messages) {
    const box = document.querySelector(`#${PANEL_ID} .fm-msg-list`);
    if (!box) return;
    box.innerHTML = "";
    const list = (messages || []).slice(-6);
    if (!list.length) {
      box.appendChild(el("p", "fm-msg-empty", "暂无识别到的消息"));
      return;
    }
    for (const m of list) {
      const row = el("div", `fm-msg-item fm-msg-${m.role || "unknown"}`);
      const badge = el("span", "fm-msg-role", roleLabel(m.role));
      const text = el("span", "fm-msg-text", m.text.slice(0, 120) + (m.text.length > 120 ? "…" : ""));
      row.append(badge, text);
      box.appendChild(row);
    }
  }

  function refreshChatPreview() {
    const pt = FanmengScrape.detectPageType(location.href, document.title);
    const section = document.querySelector(`#${PANEL_ID} .fm-chat-section`);
    if (section) section.style.display = pt === "chat" ? "" : "none";
    if (pt !== "chat") return;

    const parsed = FanmengScrape.parseChat(document.body);
    renderMessageList(parsed.messages);

    const meta = document.querySelector(`#${PANEL_ID} .fm-chat-meta`);
    if (meta) {
      const profile = parsed.profileLabel || parsed.profileId || "—";
      meta.textContent = parsed.recognized
        ? `已识别 · ${profile} · 最后买家消息已就绪`
        : `布局 ${profile} · ${RECOGNITION_FAIL_HINT}`;
      meta.dataset.kind = parsed.recognized ? "ok" : "err";
    }
  }

  function setStatus(msg, kind) {
    const s = document.querySelector(`#${PANEL_ID} .fm-status`);
    if (s) {
      s.textContent = msg;
      s.dataset.kind = kind || "";
    }
  }

  async function resolveActiveShop(scraped) {
    const hint = scraped?.data?.shopHint || FanmengScrape.detectShopContext();
    let shop = await FanmengStorage.getActiveShop();
    if (!shop || (await FanmengStorage.getShops()).length === 0) {
      shop = await FanmengStorage.upsertShop({
        id: hint.id,
        name: hint.name,
        platform: hint.platform,
        region: hint.region,
      });
      await FanmengStorage.setActiveShopId(shop.id);
    }
    activeShop = shop;
    await refreshShopSelect();
    return shop;
  }

  async function refreshShopSelect() {
    const sel = document.querySelector(`#${PANEL_ID} .fm-shop-select`);
    if (!sel) return;
    const shops = await FanmengStorage.getShops();
    const settings = await FanmengStorage.getSettings();
    sel.innerHTML = "";
    for (const s of shops) {
      const opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = s.name;
      if (s.id === settings.activeShopId) opt.selected = true;
      sel.appendChild(opt);
    }
    activeShop = shops.find((s) => s.id === settings.activeShopId) || shops[0] || null;
  }

  async function refreshDiagnosisProgress() {
    const el = document.querySelector(`#${PANEL_ID} .fm-diag-progress`);
    if (!el || !activeShop) return;
    const p = await FanmengDiagnosisPack.getProgress(activeShop.id);
    const parts = FanmengDiagnosisPack.keys.map((k) => {
      const ok = !p.missing.includes(k);
      return `${ok ? "✓" : "○"}${FanmengDiagnosisPack.labelForKey(k)}`;
    });
    el.textContent = `诊断包 ${p.done}/${p.total}：${parts.join(" ")}`;
  }

  async function refreshTemplateSelect() {
    const sel = document.querySelector(`#${PANEL_ID} .fm-template-select`);
    if (!sel) return;
    const templates = await FanmengStorage.getTemplates(activeShop?.id);
    sel.innerHTML = '<option value="">插入回复模板…</option>';
    for (const t of templates) {
      const opt = document.createElement("option");
      opt.value = t.id;
      opt.textContent = t.name;
      sel.appendChild(opt);
    }
  }

  function findReplyInput() {
    const selectors = ["textarea", "[contenteditable='true']", "input[type='text']", "[class*='editor']"];
    for (const sel of selectors) {
      for (const node of document.querySelectorAll(sel)) {
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

  function tryAutoClickSend() {
    const labels = /^(发送|send|reply|回复)$/i;
    const candidates = document.querySelectorAll("button, [role='button'], a");
    for (const btn of candidates) {
      if (!btn.offsetParent) continue;
      const t = (btn.innerText || btn.getAttribute("aria-label") || "").trim();
      if (!labels.test(t) && !/send/i.test(t)) continue;
      const r = btn.getBoundingClientRect();
      if (r.width < 24 || r.height < 16) continue;
      btn.click();
      return true;
    }
    return false;
  }

  async function getFaqTemplatesForApi() {
    const templates = await FanmengStorage.getTemplates(activeShop?.id);
    return templates.map((t) => ({
      id: t.id,
      name: t.name,
      text: t.text,
      triggers: t.triggers?.length ? t.triggers : t.name.split(/[,，|/]/).map((s) => s.trim()).filter(Boolean),
      category: t.category || "",
      lang: t.lang || "zh",
    }));
  }

  async function syncFaqToServer() {
    if (!activeShop) return;
    try {
      const templates = await getFaqTemplatesForApi();
      if (templates.length) {
        await FanmengApi.syncFaqTemplates(activeShop.id, templates);
      }
    } catch {
      /* 离线时忽略 */
    }
  }

  async function refreshCsAlerts() {
    const box = document.querySelector(`#${PANEL_ID} .fm-cs-alerts`);
    if (!box) return;
    try {
      const res = await FanmengApi.getCsAlerts();
      const alerts = res.alerts || [];
      box.innerHTML = "";
      if (!alerts.length) {
        box.classList.add("hidden");
        return;
      }
      box.classList.remove("hidden");
      for (const a of alerts.slice(0, 5)) {
        const row = el("div", "fm-cs-alert-item");
        row.appendChild(el("strong", "", "⚠️ 售后待处理"));
        row.appendChild(el("span", "fm-cs-alert-text", (a.buyerText || "").slice(0, 100)));
        box.appendChild(row);
      }
    } catch {
      box.classList.add("hidden");
    }
  }

  async function applyRoutedCsResult(res, opts = {}) {
    const { fromAuto = false, via = "" } = opts;
    const routed = res.routed || res;
    const text = res.text || routed.replyText || "";
    const box = document.querySelector(`#${PANEL_ID} .fm-reply-text`);
    if (box) box.value = text;

    const tierLabel = {
      faq: "FAQ 模板",
      aftersales: "售后安抚",
      night_ai: "夜间 AI",
      manual: "人工草稿",
    }[routed.tier || res.tier] || routed.tier || "";

    if (routed.action === "auto_send" || res.action === "auto_send") {
      fillReplyInput(text);
      const sent = tryAutoClickSend();
      setStatus(
        sent
          ? `已自动发送（${tierLabel}）${via}`
          : `已填入聊天框（${tierLabel}），请点发送${via}`,
        sent ? "ok" : "busy",
      );
    } else {
      setStatus(
        fromAuto
          ? `已生成${tierLabel}${via}（${routed.reason || "请核对后发送"}）`
          : `${tierLabel}${via}：${routed.reason || "请核对后填入或发送"}`,
        routed.notifySeller ? "err" : "ok",
      );
    }

    if (routed.notifySeller && routed.sellerMessage) {
      setStatus(routed.sellerMessage, "err");
      await refreshCsAlerts();
    }
  }

  async function syncCurrentPage(opts = {}) {
    const { silent = false } = opts;
    try {
      await requireExtensionAccess(silent);
    } catch {
      return;
    }
    if (!silent) setStatus("正在同步本页…", "busy");
    try {
      const scraped = FanmengScrape.scrapePage();
      const shop = await resolveActiveShop(scraped);
      await FanmengApi.pushSnapshot({
        pageType: scraped.pageType,
        pageUrl: scraped.pageUrl,
        title: scraped.title,
        shopKey: shop.id,
        shopName: shop.name,
        data: scraped.data,
      });
      await FanmengDiagnosisPack.markFromScrape(shop.id, scraped);
      await refreshDiagnosisProgress();
      if (!silent) {
        setStatus(`已同步 · ${shop.name} · ${scraped.pageType} · ${new Date().toLocaleTimeString()}`, "ok");
      }
      return scraped;
    } catch (e) {
      if (!silent) handlePaidApiError(e);
      throw e;
    }
  }

  async function runAnalyze(agentId) {
    setStatus(`正在运行 ${agentId}…`, "busy");
    try {
      await requireExtensionAccess();
      const shop = activeShop || (await resolveActiveShop(FanmengScrape.scrapePage()));
      const prog = await FanmengDiagnosisPack.getProgress(shop.id);
      if (prog.done < 2) {
        setStatus(`诊断包仅 ${prog.done}/4，建议先打开：${prog.missing.map(FanmengDiagnosisPack.labelForKey).join("、")}`, "busy");
      }
      await syncCurrentPage({ silent: true });
      const res = await FanmengApi.analyze(agentId, undefined, shop.id);
      showResult(res.answer || "无输出");
      setStatus("分析完成（已合并诊断包页面 + CSV）", "ok");
    } catch (e) {
      handlePaidApiError(e);
    }
  }

  async function suggestForLatestMessage(buyerTextOverride, opts = {}) {
    const { fromAuto = false, fromSelection = false } = opts;
    try {
      await requireExtensionAccess(fromAuto);
    } catch {
      return;
    }
    refreshChatPreview();
    const scraped = FanmengScrape.scrapePage();
    const shop = await resolveActiveShop(scraped);

    const selected = getSelectedChatText();
    let buyerText = buyerTextOverride || "";
    if (!buyerText && (fromSelection || !fromAuto)) {
      buyerText = selected;
    }
    if (!buyerText && !fromSelection) {
      buyerText = scraped.data.latestBuyerMessage || "";
    }

    if (!buyerText?.trim()) {
      setStatus(RECOGNITION_FAIL_HINT, "err");
      refreshChatPreview();
      return;
    }

    if (!fromAuto) setStatus("正在智能路由客服…", "busy");
    else setStatus("检测到新消息，正在路由…", "busy");
    try {
      const ctx = (scraped.data.textSample || "").slice(0, 800);
      const faqTemplates = await getFaqTemplatesForApi();
      const res = await FanmengApi.routeCsMessage({
        buyerText: buyerText.trim(),
        orderContext: ctx,
        shopName: shop.name,
        shopKey: shop.id,
        faqTemplates,
        syncFaq: true,
      });
      const via = fromSelection || selected ? "（来自选中文字）" : "";
      await applyRoutedCsResult(res, { fromAuto, via });
      refreshChatPreview();
    } catch (e) {
      handlePaidApiError(e);
    }
  }

  async function suggestFromSelection(forwardedText = "") {
    const text = String(forwardedText || getSelectedChatText() || "").trim();
    if (!text) {
      setStatus(RECOGNITION_FAIL_HINT, "err");
      refreshChatPreview();
      return;
    }
    await suggestForLatestMessage(text, { fromSelection: true });
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
    const headActions = el("div", "fm-head-actions");
    const tutBtn = el("button", "fm-icon-btn fm-tut-btn", "?");
    tutBtn.type = "button";
    tutBtn.title = "卖家试用教程";
    const collapseBtn = el("button", "fm-icon-btn", "—");
    collapseBtn.type = "button";
    headActions.append(tutBtn, collapseBtn);
    head.appendChild(headActions);

    const body = el("div", "fm-body");
    body.appendChild(el("p", "fm-status", "未连接"));

    const paywall = el("div", "fm-paywall hidden");
    paywall.appendChild(el("p", "fm-paywall-text", ""));
    const subscribeBtn = el("button", "fm-btn primary fm-paywall-btn", "去网站订阅 / 续费");
    subscribeBtn.type = "button";
    paywall.appendChild(subscribeBtn);
    body.appendChild(paywall);

    const planLine = el("p", "fm-plan-line fm-hint", "");
    body.appendChild(planLine);

    const alertsBox = el("div", "fm-cs-alerts hidden");
    body.appendChild(alertsBox);
    body.appendChild(el("p", "fm-hint fm-cs-tier-hint", "FAQ 命中自动发 · 售后转人工 · 北京23:00–09:00 AI 守店"));

    const tutBox = el("div", "fm-tutorial-box hidden");
    tutBox.appendChild(el("p", "fm-label", "📖 卖家试用教程（点 ? 随时打开）"));
    const tutMount = el("div", "fm-tutorial-mount");
    tutBox.appendChild(tutMount);
    body.appendChild(tutBox);

    const shopRow = el("div", "fm-row fm-shop-row");
    const shopSelect = el("select", "fm-shop-select");
    shopSelect.title = "切换店铺";
    const bindShopBtn = el("button", "fm-btn slim", "绑定本页店铺");
    bindShopBtn.type = "button";
    shopRow.append(shopSelect, bindShopBtn);

    body.appendChild(shopRow);
    body.appendChild(el("p", "fm-diag-progress fm-hint", "诊断包 0/4"));

    const chatSection = el("div", "fm-chat-section");
    chatSection.style.display = "none";
    chatSection.appendChild(el("p", "fm-label", "消息识别（买家 / 卖家 / 系统）"));
    chatSection.appendChild(el("p", "fm-chat-meta fm-hint", "进入聊天页后自动识别"));
    chatSection.appendChild(el("div", "fm-msg-list"));
    chatSection.appendChild(
      el("p", "fm-hint fm-shortcut-hint", "选中买家文字 → 右键「凡梦生成回复」或 Ctrl+Shift+Y"),
    );
    body.appendChild(chatSection);

    const btnRow1 = el("div", "fm-row");
    const syncBtn = el("button", "fm-btn primary fm-paid-action", "同步本页");
    syncBtn.type = "button";
    const csBtn = el("button", "fm-btn fm-paid-action", "手动生成话术");
    csBtn.type = "button";
    btnRow1.append(syncBtn, csBtn);

    const btnRow2 = el("div", "fm-row");
    const growthBtn = el("button", "fm-btn fm-paid-action", "业绩诊断");
    growthBtn.type = "button";
    const profitBtn = el("button", "fm-btn fm-paid-action", "广告库存利润");
    profitBtn.type = "button";
    btnRow2.append(growthBtn, profitBtn);

    const replyLabel = el("label", "fm-label", "客服回复草稿（FAQ/售后可自动发送）");
    const replyArea = el("textarea", "fm-reply-text");
    replyArea.rows = 4;
    replyArea.placeholder = "开启「自动监听新消息」后此处会自动填入…";

    const tplRow = el("div", "fm-row");
    const tplSelect = el("select", "fm-template-select");
    tplSelect.innerHTML = '<option value="">插入回复模板…</option>';
    const saveTplBtn = el("button", "fm-btn slim", "存为模板");
    saveTplBtn.type = "button";
    tplRow.append(tplSelect, saveTplBtn);

    const fillBtn = el("button", "fm-btn", "填入聊天框");
    fillBtn.type = "button";

    const resultArea = el("textarea", "fm-result");
    resultArea.rows = 5;
    resultArea.placeholder = "业绩/利润分析结果…";

    body.append(btnRow1, btnRow2, replyLabel, replyArea, tplRow, fillBtn, resultArea);
    root.append(head, body);
    document.documentElement.appendChild(root);

    collapseBtn.addEventListener("click", () => {
      const hidden = body.style.display === "none";
      body.style.display = hidden ? "" : "none";
      collapseBtn.textContent = hidden ? "—" : "+";
    });

    FanmengTutorial.mountInto(tutMount, "panel");
    tutBtn.addEventListener("click", () => {
      tutBox.classList.toggle("hidden");
    });

    subscribeBtn.addEventListener("click", async () => {
      const ent = cachedEntitlements || (await FanmengBilling.getEntitlements());
      FanmengBilling.openBillingPage(ent);
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

    shopSelect.addEventListener("change", async () => {
      await FanmengStorage.setActiveShopId(shopSelect.value);
      activeShop = (await FanmengStorage.getShops()).find((s) => s.id === shopSelect.value) || null;
      await refreshDiagnosisProgress();
      await refreshTemplateSelect();
      setStatus(`已切换店铺：${activeShop?.name || ""}`, "ok");
    });

    bindShopBtn.addEventListener("click", async () => {
      const hint = FanmengScrape.detectShopContext();
      const shop = await FanmengStorage.upsertShop({
        id: hint.id,
        name: hint.name,
        platform: hint.platform,
        region: hint.region,
      });
      await FanmengStorage.setActiveShopId(shop.id);
      activeShop = shop;
      await refreshShopSelect();
      setStatus(`已绑定店铺：${shop.name}`, "ok");
    });

    saveTplBtn.addEventListener("click", async () => {
      const text = replyArea.value.trim();
      if (!text) return setStatus("草稿为空，无法保存模板", "err");
      const name = prompt("模板名称", "常用回复");
      if (!name) return;
      const triggers = prompt("触发关键词（逗号分隔，可选）", name) || name;
      await FanmengStorage.saveTemplate({
        name,
        text,
        shopId: activeShop?.id,
        triggers: triggers.split(/[,，|/]/).map((s) => s.trim()).filter(Boolean),
      });
      await refreshTemplateSelect();
      await syncFaqToServer();
      setStatus("模板已保存并同步到服务端", "ok");
    });

    tplSelect.addEventListener("change", async () => {
      const id = tplSelect.value;
      if (!id) return;
      const templates = await FanmengStorage.getTemplates(activeShop?.id);
      const t = templates.find((x) => x.id === id);
      if (t) replyArea.value = t.text;
      tplSelect.value = "";
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
      if (e.target.tagName === "BUTTON" || e.target.tagName === "SELECT") return;
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
    if (!settings.token) return;
    const ms = Math.max(5, Number(settings.autoSyncMinutes) || 15) * 60 * 1000;
    if (settings.autoSync || settings.autoDiagnosisSync) {
      autoSyncTimer = setInterval(() => {
        const pt = FanmengScrape.detectPageType(location.href, document.title);
        if (pt === "chat") return;
        syncCurrentPage({ silent: true }).catch(() => {});
      }, settings.autoSync ? ms : ms * 2);
    }
  }

  let chatPreviewTimer = null;

  function setupChatPreviewRefresh() {
    if (chatPreviewTimer) {
      clearInterval(chatPreviewTimer);
      chatPreviewTimer = null;
    }
    refreshChatPreview();
    chatPreviewTimer = setInterval(() => {
      if (FanmengScrape.detectPageType(location.href, document.title) === "chat") {
        refreshChatPreview();
      }
    }, 3500);
  }

  function setupChatWatcher() {
    if (chatStop) chatStop();
    chatStop = FanmengChatWatcher.onNewMessage(({ buyerText, recognitionFailed, hint }) => {
      if (recognitionFailed) {
        setStatus(hint || RECOGNITION_FAIL_HINT, "err");
        refreshChatPreview();
        return;
      }
      suggestForLatestMessage(buyerText, { fromAuto: true });
    });
    setupChatPreviewRefresh();
  }

  async function migrateTiktokShops() {
    const shops = await FanmengStorage.getShops();
    const next = shops.map((s) => FanmengTikTok.normalizeShop(s));
    const changed = next.some((s, i) => s.platform !== shops[i].platform);
    if (changed) await FanmengStorage.saveShops(next);
  }

  async function boot() {
    buildPanel();
    await migrateTiktokShops();

    const tutBox = document.querySelector(`#${PANEL_ID} .fm-tutorial-box`);
    if (tutBox && (await FanmengTutorial.shouldAutoOpenPanel())) {
      tutBox.classList.remove("hidden");
      await FanmengTutorial.markPanelSeen();
    }

    try {
      const shop = await resolveActiveShop();
      const st = await FanmengApi.status(shop?.id);
      await refreshEntitlements();
      setStatus(`已登录 ${st.user?.email || ""} · ${shop?.name || "未绑定店铺"}`, "ok");
    } catch {
      setStatus("请打开插件弹窗登录凡梦账号", "err");
    }
    await refreshDiagnosisProgress();
    await refreshTemplateSelect();
    await setupAutoSync();
    await syncFaqToServer();
    setupChatWatcher();
    refreshCsAlerts();
    setInterval(refreshCsAlerts, 60000);

    const pt = FanmengScrape.detectPageType(location.href, document.title);
    if (pt !== "chat") {
      const settings = await FanmengStorage.getSettings();
      if (settings.autoDiagnosisSync && settings.token) {
        syncCurrentPage({ silent: true }).catch(() => {});
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.fanmeng_settings) {
      setupAutoSync();
      if (chatStop) {
        setupChatWatcher();
      }
    }
  });

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === "fanmeng_suggest_from_selection") {
      suggestFromSelection(msg.text).then(() => sendResponse({ ok: true })).catch(() => sendResponse({ ok: false }));
      return true;
    }
    return false;
  });
})();
