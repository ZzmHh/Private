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
  let cachedCsSettings = null;
  let lastChatProfileId = null;

  const DEFAULT_CS_SETTINGS = {
    extensionAutoSendFaq: true,
    extensionAutoSendAfterSales: true,
    extensionAutoClickSend: true,
  };

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

  async function getCsSettingsCached(force = false) {
    if (!force && cachedCsSettings) return cachedCsSettings;
    try {
      const res = await FanmengApi.getCsSettings();
      cachedCsSettings = { ...DEFAULT_CS_SETTINGS, ...(res.settings || {}) };
    } catch {
      cachedCsSettings = { ...DEFAULT_CS_SETTINGS };
    }
    return cachedCsSettings;
  }

  function dispatchInputEvents(node) {
    node.dispatchEvent(new Event("input", { bubbles: true }));
    node.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function setNativeInputValue(node, text) {
    const proto =
      node.tagName === "TEXTAREA"
        ? window.HTMLTextAreaElement.prototype
        : node.tagName === "INPUT"
          ? window.HTMLInputElement.prototype
          : null;
    const setter = proto && Object.getOwnPropertyDescriptor(proto, "value")?.set;
    if (setter) {
      setter.call(node, text);
    } else if (node.isContentEditable) {
      node.textContent = text;
    } else {
      node.value = text;
    }
  }
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

  function isMockCsPage() {
    try {
      const h = location.hostname.toLowerCase();
      return (h === "127.0.0.1" || h === "localhost") && /\/mock\/tiktok/i.test(location.pathname);
    } catch {
      return false;
    }
  }

  function formatConfidence(conf) {
    return `${Math.round(Math.max(0, Math.min(1, Number(conf) || 0)) * 100)}%`;
  }

  function formatChatMeta(parsed) {
    const profile = parsed.profileLabel || parsed.profileId || "—";
    const conf = formatConfidence(parsed.confidence);
    const region = FanmengTikTok.regionLabel(parsed.region || FanmengTikTok.detectRegion());
    const mockTag = isMockCsPage() ? " · 模拟页" : "";
    const modeTag =
      parsed.layoutMode === "manual"
        ? " · 手动布局"
        : parsed.layoutMode === "learned"
          ? " · 已记忆"
          : "";
    if (parsed.recognized) {
      return `✓ ${profile} · 置信 ${conf} · ${region}${modeTag}${mockTag} · 买家消息就绪`;
    }
    return `✗ ${profile} · 置信 ${conf} · ${region}${modeTag}${mockTag} · ${RECOGNITION_FAIL_HINT}`;
  }

  async function parseChatForPanel() {
    const parsed = FanmengScrape.parseChatWithPrefs(document.body, activeShop?.id);
    lastChatProfileId = parsed.profileId || lastChatProfileId;
    return parsed;
  }

  async function refreshChatPreview() {
    const pt = FanmengScrape.detectPageType(location.href, document.title);
    const section = document.querySelector(`#${PANEL_ID} .fm-chat-section`);
    if (section) section.style.display = pt === "chat" ? "" : "none";
    if (pt !== "chat") return;

    const parsed = await parseChatForPanel();
    renderMessageList(parsed.messages);

    const meta = document.querySelector(`#${PANEL_ID} .fm-chat-meta`);
    if (meta) {
      meta.textContent = formatChatMeta(parsed);
      meta.dataset.kind = parsed.recognized ? "ok" : "err";
    }

    const detail = document.querySelector(`#${PANEL_ID} .fm-chat-layout-detail`);
    if (detail) {
      const buyers = (parsed.messages || []).filter((m) => m.role === "buyer").length;
      const sellers = (parsed.messages || []).filter((m) => m.role === "seller").length;
      detail.textContent = `解析 ${parsed.messages?.length || 0} 条（买家 ${buyers} / 卖家 ${sellers}）· 方法 ${parsed.method || "—"}`;
    }
  }

  async function refreshChatLayoutSelect() {
    const sel = document.querySelector(`#${PANEL_ID} .fm-chat-layout-select`);
    if (!sel) return;
    const cache = await FanmengStorage.loadChatLayoutCache();
    const includeMock = isMockCsPage();
    const options = FanmengChatSelectors.listLayoutOptions(includeMock);
    const current = cache.override || "auto";
    sel.innerHTML = "";
    for (const opt of options) {
      const o = document.createElement("option");
      o.value = opt.id;
      o.textContent = opt.label;
      if (opt.id === current) o.selected = true;
      sel.appendChild(o);
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
    const p = await FanmengDiagnosisPack.fetchProgress(activeShop.id, { force: true });
    const parts = FanmengDiagnosisPack.keys.map((k) => {
      const ok = !p.missing.includes(k);
      return `${ok ? "✓" : "○"}${FanmengDiagnosisPack.labelForKey(k)}`;
    });
    const sourceHint = p.source === "server" ? "" : "（离线缓存）";
    el.textContent = `诊断包 ${p.done}/${p.total}${sourceHint}：${parts.join(" ")}`;
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

  function findReplyInput(profileId = lastChatProfileId) {
    const selectors = [
      "textarea",
      "[contenteditable='true']",
      "[contenteditable='plaintext-only']",
      "input[type='text']",
      "[class*='editor']",
      "[class*='Editor']",
      "[role='textbox']",
    ];
    const scopes = [];
    const chatRoot = FanmengChatSelectors.findChatPanelRoot(profileId, document.body);
    if (chatRoot) scopes.push(chatRoot);
    scopes.push(document.body);

    const scored = [];
    for (const scope of scopes) {
      const scopeBonus = scope === chatRoot ? 50000 : 0;
      for (const sel of selectors) {
        for (const node of scope.querySelectorAll(sel)) {
          if (node.closest(`#${PANEL_ID}`)) continue;
          if (!node.offsetParent && node.tagName !== "TEXTAREA") continue;
          const r = node.getBoundingClientRect?.();
          if (!r || r.width < 80 || r.height < 20) continue;
          const nearBottom = r.top > window.innerHeight * 0.45 ? 10 : 0;
          scored.push({ node, score: scopeBonus + r.width * r.height + nearBottom });
        }
      }
      if (scope === chatRoot && scored.length) break;
    }
    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.node || null;
  }

  function fillReplyInput(text) {
    const input = findReplyInput();
    if (!input) return false;
    input.focus();
    if (input.tagName === "TEXTAREA" || input.tagName === "INPUT") {
      setNativeInputValue(input, text);
      dispatchInputEvents(input);
      return true;
    }
    if (input.isContentEditable) {
      input.textContent = text;
      dispatchInputEvents(input);
      return true;
    }
    return false;
  }

  function findSendButtonNearInput(input) {
    if (!input) return null;
    let root = input.parentElement;
    for (let depth = 0; depth < 6 && root; depth += 1) {
      const local = root.querySelectorAll("button, [role='button'], a");
      for (const btn of local) {
        if (!btn.offsetParent) continue;
        const t = (btn.innerText || btn.getAttribute("aria-label") || btn.title || "").trim();
        if (/^(发送|send|reply|回复)$/i.test(t) || /send|发送|reply|回复/i.test(t)) {
          const r = btn.getBoundingClientRect();
          if (r.width >= 24 && r.height >= 16) return btn;
        }
      }
      root = root.parentElement;
    }
    return null;
  }

  function tryAutoClickSend() {
    const input = findReplyInput();
    const nearBtn = findSendButtonNearInput(input);
    if (nearBtn) {
      nearBtn.click();
      return true;
    }
    const labels = /^(发送|send|reply|回复)$/i;
    const candidates = document.querySelectorAll(
      "button, [role='button'], a, [data-e2e*='send'], [class*='send'], [class*='Send']",
    );
    for (const btn of candidates) {
      if (!btn.offsetParent) continue;
      const t = (btn.innerText || btn.getAttribute("aria-label") || btn.title || "").trim();
      if (!labels.test(t) && !/send|发送|reply|回复/i.test(t)) continue;
      const r = btn.getBoundingClientRect();
      if (r.width < 24 || r.height < 16) continue;
      btn.click();
      return true;
    }
    return false;
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function tryAutoClickSendWithRetry(maxAttempts = 4) {
    for (let i = 0; i < maxAttempts; i += 1) {
      if (i > 0) await sleep(120 * i);
      if (tryAutoClickSend()) return true;
    }
    return false;
  }

  async function getFaqTemplatesForApi() {
    try {
      const res = await FanmengApi.getFaqTemplates(activeShop?.id || "");
      if (Array.isArray(res.templates) && res.templates.length) {
        return res.templates.map((t) => ({
          id: t.id,
          name: t.name,
          text: t.text,
          triggers: t.triggers?.length ? t.triggers : [],
          category: t.category || "",
          lang: t.lang || "zh",
        }));
      }
    } catch {
      /* 离线时回退本地 */
    }
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
      const res = await FanmengApi.getFaqTemplates(activeShop.id);
      if (Array.isArray(res.templates) && res.templates.length) return;
      const templates = await FanmengStorage.getTemplates(activeShop.id);
      if (templates.length) {
        await FanmengApi.syncFaqTemplates(activeShop.id, templates.map((t) => ({
          id: t.id,
          name: t.name,
          text: t.text,
          triggers: t.triggers || [],
          category: t.category || "",
          lang: t.lang || "zh",
        })));
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

  function hidePendingConfirmRow() {
    document.querySelector(`#${PANEL_ID} .fm-pending-row`)?.remove();
  }

  function ensurePendingConfirmRow() {
    const existing = document.querySelector(`#${PANEL_ID} .fm-pending-row`);
    if (existing) return existing;

    const row = el("div", "fm-pending-row fm-row");
    const confirmBtn = el("button", "fm-btn primary", "确认发送");
    const dismissBtn = el("button", "fm-btn", "我来回复");
    confirmBtn.type = "button";
    dismissBtn.type = "button";
    row.append(confirmBtn, dismissBtn);

    const replyArea = document.querySelector(`#${PANEL_ID} .fm-reply-text`);
    if (replyArea?.parentNode) {
      replyArea.parentNode.insertBefore(row, replyArea.nextSibling);
    }

    confirmBtn.addEventListener("click", async () => {
      const text = document.querySelector(`#${PANEL_ID} .fm-reply-text`)?.value?.trim();
      if (!text) {
        setStatus("没有可发送的内容", "err");
        return;
      }
      const filled = fillReplyInput(text);
      if (!filled) {
        setStatus("未找到聊天输入框，请手动复制", "err");
        return;
      }
      await sleep(180);
      const sent = await tryAutoClickSendWithRetry();
      hidePendingConfirmRow();
      setStatus(sent ? "已确认并发送给买家" : "已填入聊天框，请手动点发送", sent ? "ok" : "busy");
    });

    dismissBtn.addEventListener("click", () => {
      hidePendingConfirmRow();
      setStatus("已取消 AI 发送，请您自行回复买家", "ok");
    });

    return row;
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
      night_fallback: "夜间等候",
      day_ai: "白天 AI",
      product_ai: "商品 AI",
      manual: "人工草稿",
    }[routed.tier || res.tier] || routed.tier || "";

    const shouldAutoSend = routed.action === "auto_send" || res.action === "auto_send";
    const shouldPending =
      routed.action === "pending_confirm" || res.action === "pending_confirm";

    if (shouldPending) {
      ensurePendingConfirmRow();
      setStatus(
        routed.productMatch?.name
          ? `已识别「${routed.productMatch.name}」· ${routed.reason || "请确认后发送"}${via}`
          : `${routed.reason || "AI 已生成回复，请确认后发送"}${via}`,
        "ok",
      );
      if (routed.notifySeller && routed.sellerMessage) {
        setStatus(routed.sellerMessage, "err");
        await refreshCsAlerts();
      }
      return;
    }

    hidePendingConfirmRow();

    if (shouldAutoSend) {
      const csSettings = await getCsSettingsCached();
      const filled = fillReplyInput(text);
      if (!filled) {
        setStatus(`已生成${tierLabel}${via}，但未找到聊天输入框，请复制后手动粘贴`, "busy");
        return;
      }
      if (csSettings.extensionAutoClickSend === false) {
        setStatus(`已填入聊天框（${tierLabel}），请人工点发送${via}`, "ok");
        return;
      }
      await sleep(180);
      const sent = await tryAutoClickSendWithRetry();
      setStatus(
        sent
          ? `已自动发送（${tierLabel}）${via}`
          : `已填入聊天框（${tierLabel}），未找到发送按钮，请手动点发送${via}`,
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

  async function openFaqWorkspace() {
    try {
      const settings = await FanmengStorage.getSettings();
      const apiBase = FanmengApi.normalizeBase(settings.apiBase);
      if (!apiBase) {
        setStatus("请先在插件弹窗配置凡梦 API 地址", "err");
        return;
      }
      const workspace = FanmengPermissions.resolveWorkspaceUrl(apiBase);
      await FanmengPermissions.ensureHostPermission(apiBase);
      await FanmengPermissions.ensureHostPermission(workspace);
      const url = `${workspace}/#cs-faq`;
      const opened = window.open(url, "_blank", "noopener,noreferrer");
      if (!opened) {
        setStatus(`请允许弹窗，或手动打开：${url}`, "err");
        return;
      }
      setStatus("已打开 FAQ 生成页面（请确认已登录凡梦）", "ok");
    } catch (e) {
      setStatus(e.message || "无法打开网站", "err");
    }
  }

  async function syncPageForFaqMaterial() {
    try {
      await requireExtensionAccess();
    } catch {
      return;
    }
    setStatus("正在同步本页作为 FAQ 素材…", "busy");
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
      FanmengDiagnosisPack.invalidateCache();
      await refreshDiagnosisProgress();
      let hint = `已同步 ${scraped.pageType} · 页面数据已上传`;
      try {
        const ctx = await FanmengApi.getFaqGenerateContext(shop.id);
        const n = ctx.snapshotCount || 0;
        hint =
          n >= 2
            ? `FAQ 素材 ${n} 页 · 点下方「网站 · FAQ 生成」`
            : `已同步 ${scraped.pageType} · 建议再同步商品/订单页，然后点「网站 · AI 生成 FAQ」`;
      } catch (ctxErr) {
        if (ctxErr?.status === 404 || /接口不存在/.test(ctxErr?.message || "")) {
          hint = `已同步 ${scraped.pageType} · 素材已保存（网站 FAQ 统计接口待更新，不影响同步本页）`;
        } else {
          throw ctxErr;
        }
      }
      setStatus(hint, "ok");
    } catch (e) {
      handlePaidApiError(e);
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
      FanmengDiagnosisPack.invalidateCache();
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
    tutBtn.title = "打开/关闭卖家教程";
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
    body.appendChild(el("p", "fm-hint fm-cs-tier-hint", "FAQ 命中自动发 · 白天 AI 需您确认 · 夜间需商品资料+AI评估通过才全自动"));

    const tutBox = el("div", "fm-tutorial-box hidden");
    const tutHead = el("div", "fm-tutorial-head");
    tutHead.appendChild(el("span", "fm-label", "📖 卖家试用教程"));
    const tutCloseBtn = el("button", "fm-icon-btn fm-tut-close", "×");
    tutCloseBtn.type = "button";
    tutCloseBtn.title = "关闭教程";
    tutHead.appendChild(tutCloseBtn);
    tutBox.appendChild(tutHead);
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
    const layoutRow = el("div", "fm-row fm-chat-layout-row");
    const layoutSelect = el("select", "fm-chat-layout-select");
    layoutSelect.title = "识别失败时可手动切换跨境/区域布局";
    layoutRow.appendChild(layoutSelect);
    chatSection.appendChild(layoutRow);
    chatSection.appendChild(el("p", "fm-chat-meta fm-hint", "进入聊天页后自动识别"));
    chatSection.appendChild(el("p", "fm-chat-layout-detail fm-hint", ""));
    chatSection.appendChild(el("div", "fm-msg-list"));
    chatSection.appendChild(
      el("p", "fm-hint fm-shortcut-hint", "选中买家文字 → 右键「凡梦生成回复」或 Ctrl+Shift+Y"),
    );
    body.appendChild(chatSection);

    const btnRow1 = el("div", "fm-row");
    const syncBtn = el("button", "fm-btn primary fm-paid-action", "同步本页");
    syncBtn.type = "button";
    const faqSyncBtn = el("button", "fm-btn fm-paid-action", "同步到 FAQ 素材");
    faqSyncBtn.type = "button";
    faqSyncBtn.title = "抓取本页商品/物流等信息，供网站 AI 生成 FAQ";
    const csBtn = el("button", "fm-btn fm-paid-action", "手动生成话术");
    csBtn.type = "button";
    const faqWebBtn = el("button", "fm-btn fm-paid-action", "网站 · FAQ 生成");
    faqWebBtn.type = "button";
    faqWebBtn.title = "打开凡梦网站客服控制台，AI 生成 FAQ 模板";
    btnRow1.append(syncBtn, faqSyncBtn, csBtn);

    const btnRowFaq = el("div", "fm-row");
    btnRowFaq.append(faqWebBtn);

    const btnRow2 = el("div", "fm-row");
    const growthBtn = el("button", "fm-btn fm-paid-action", "业绩诊断");
    growthBtn.type = "button";
    const profitBtn = el("button", "fm-btn fm-paid-action", "广告库存利润");
    profitBtn.type = "button";
    btnRow2.append(growthBtn, profitBtn);

    const replyLabel = el("label", "fm-label", "客服回复草稿（FAQ/夜间等候可自动发，白天 AI 请确认）");
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

    body.append(btnRow1, btnRowFaq, btnRow2, replyLabel, replyArea, tplRow, fillBtn, resultArea);
    root.append(head, body);
    document.documentElement.appendChild(root);

    collapseBtn.addEventListener("click", () => {
      const hidden = body.style.display === "none";
      body.style.display = hidden ? "" : "none";
      collapseBtn.textContent = hidden ? "—" : "+";
    });

    FanmengTutorial.mountInto(tutMount, "panel");
    tutBtn.addEventListener("click", () => {
      const willHide = !tutBox.classList.contains("hidden");
      tutBox.classList.toggle("hidden");
      if (willHide) FanmengTutorial.markPanelSeen();
    });
    tutCloseBtn.addEventListener("click", () => {
      tutBox.classList.add("hidden");
      FanmengTutorial.markPanelSeen();
    });

    subscribeBtn.addEventListener("click", async () => {
      const ent = cachedEntitlements || (await FanmengBilling.getEntitlements());
      FanmengBilling.openBillingPage(ent);
    });

    syncBtn.addEventListener("click", () => syncCurrentPage());
    faqSyncBtn.addEventListener("click", () => syncPageForFaqMaterial());
    faqWebBtn.addEventListener("click", () => openFaqWorkspace());
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
      await refreshChatLayoutSelect();
      await refreshChatPreview();
      setStatus(`已切换店铺：${activeShop?.name || ""}`, "ok");
    });

    layoutSelect.addEventListener("change", async () => {
      await FanmengStorage.setChatLayoutOverride(layoutSelect.value);
      await refreshChatLayoutSelect();
      await refreshChatPreview();
      setStatus(
        layoutSelect.value === "auto" ? "已恢复自动布局识别" : `已切换布局：${layoutSelect.selectedOptions[0]?.textContent || layoutSelect.value}`,
        "ok",
      );
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
    }

    try {
      const shop = await resolveActiveShop();
      const st = await FanmengApi.status(shop?.id);
      await refreshEntitlements();
      await getCsSettingsCached(true);
      const mockHint = isMockCsPage() ? " · 模拟客服页" : "";
      setStatus(`已登录 ${st.user?.email || ""} · ${shop?.name || "未绑定店铺"}${mockHint}`, "ok");
    } catch {
      setStatus(isMockCsPage() ? "模拟页已加载 · 请打开插件弹窗登录凡梦账号" : "请打开插件弹窗登录凡梦账号", "err");
    }
    await refreshDiagnosisProgress();
    await refreshTemplateSelect();
    await FanmengStorage.loadChatLayoutCache();
    await refreshChatLayoutSelect();
    await refreshChatPreview();
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

  if (isMockCsPage()) {
    const ver =
      (typeof FanmengExtensionConfig !== "undefined" && FanmengExtensionConfig.VERSION) || "?";
    console.info(`[凡梦AI] 模拟客服页已注入 · v${ver} · ${location.href}`);
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
