/**
 * 获客雷达 · 独立社媒拓客插件
 */
(function () {
  if (window.__leadRadarLoaded) return;
  window.__leadRadarLoaded = true;

  const ROOT = "lead-radar-root";
  let config = {};
  let queue = [];
  let seen = new Set();
  let scanning = false;
  let timer = null;

  const PLATFORM_LABELS = {
    tiktok: "TikTok",
    x: "X",
    xiaohongshu: "小红书",
    douyin: "抖音",
    facebook: "Facebook",
    web: "网页",
  };

  async function load() {
    const { lead_radar_queue = [] } = await chrome.storage.local.get("lead_radar_queue");
    queue = lead_radar_queue;
    const res = await LeadRadarMsg.send("lr_get_settings");
    if (res?.error) {
      status(res.error, "err");
      return;
    }
    config = res?.settings || {};
    render();
    badge();
  }

  async function save() {
    queue = queue.slice(0, 50);
    await chrome.storage.local.set({ lead_radar_queue: queue });
    badge();
    render();
  }

  function badge() {
    const min = config.minScore || 55;
    const n = queue.filter((l) => l.status === "new" && l.score >= min).length;
    LeadRadarMsg.send("lr_badge", { count: n });
  }

  function ui(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function panel() {
    if (document.getElementById(ROOT)) return document.getElementById(ROOT);
    const root = ui("div", "lr-root");
    root.id = ROOT;
    root.innerHTML = `
      <button type="button" class="lr-fab" title="获客雷达">🎯<span class="lr-fab-badge">0</span></button>
      <div class="lr-drawer hidden">
        <header class="lr-head">
          <strong>获客雷达</strong>
          <span class="lr-plat"></span>
          <button type="button" class="lr-x">×</button>
        </header>
        <p class="lr-status">就绪</p>
        <div class="lr-bar">
          <label><input type="checkbox" id="lr-auto" checked /> 自动扫描</label>
          <button type="button" id="lr-scan" class="lr-btn">立即扫描</button>
        </div>
        <div class="lr-list"></div>
        <footer class="lr-foot">AI 拓客话术 · 人工确认后发送 · v1.2</footer>
      </div>`;
    document.body.appendChild(root);
    root.querySelector(".lr-fab").onclick = () => root.querySelector(".lr-drawer").classList.toggle("hidden");
    root.querySelector(".lr-x").onclick = () => root.querySelector(".lr-drawer").classList.add("hidden");
    root.querySelector("#lr-scan").onclick = () => scan(true);
    root.querySelector("#lr-auto").onchange = async (e) => {
      config.autoScan = e.target.checked;
      await chrome.storage.local.set({ lead_radar_settings: { ...config, autoScan: e.target.checked } });
      setupTimer();
    };
    const plat = LeadRadarDom.platform();
    root.querySelector(".lr-plat").textContent = PLATFORM_LABELS[plat] || plat;
    return root;
  }

  function status(msg, kind) {
    const el = document.querySelector(`#${ROOT} .lr-status`);
    if (el) {
      el.textContent = msg;
      el.className = `lr-status ${kind || ""}`.trim();
    }
  }

  function render() {
    const list = document.querySelector(`#${ROOT} .lr-list`);
    const fab = document.querySelector(`#${ROOT} .lr-fab-badge`);
    if (!list) return;
    const min = config.minScore || 55;
    const hot = queue.filter((l) => l.status !== "skipped" && l.score >= min).length;
    if (fab) fab.textContent = String(hot);
    const visible = queue.filter((l) => l.status !== "skipped").slice(0, 15);
    if (!visible.length) {
      list.innerHTML = `<p class="lr-empty">打开 <b>TikTok / 小红书 搜索页</b>，搜「TikTok开店」「跨境选品」，展开评论区后点「立即扫描」。</p>`;
      return;
    }
    list.innerHTML = "";
    for (const lead of visible) {
      const isHot = lead.score >= min;
      const card = ui("div", `lr-card ${isHot ? "hot" : "watch"}`);
      card.innerHTML = `
        <div class="lr-meta">
          <span class="lr-score">${lead.score}</span>
          <b>${lead.persona || "客户"}</b>
          <i>@${lead.author || ""}</i>
          ${isHot ? "" : '<em class="lr-tag">观察</em>'}
        </div>
        <p class="lr-prev">${(lead.textPreview || lead.text || "").slice(0, 100)}</p>
        <p class="lr-draft">${(lead.commentDraft || lead.dmDraft || lead.reason || "待生成话术").slice(0, 180)}</p>
        <div class="lr-actions">
          <button type="button" data-a="fill" class="lr-btn">填入评论</button>
          <button type="button" data-a="copy" class="lr-btn ghost">复制</button>
          <button type="button" data-a="skip" class="lr-btn ghost">忽略</button>
        </div>`;
      card.querySelector('[data-a="fill"]').onclick = () => {
        const t = lead.commentDraft || lead.dmDraft || "";
        if (LeadRadarDom.fillInput(t)) status("已填入，请确认后发送", "ok");
        else {
          navigator.clipboard.writeText(t);
          status("未找到输入框，已复制", "warn");
        }
        lead.status = "drafted";
        save();
      };
      card.querySelector('[data-a="copy"]').onclick = () => {
        navigator.clipboard.writeText(lead.commentDraft || lead.dmDraft || "");
        status("已复制", "ok");
      };
      card.querySelector('[data-a="skip"]').onclick = () => {
        const item = queue.find((x) => x.id === lead.id);
        if (item) item.status = "skipped";
        save();
        render();
      };
      list.appendChild(card);
    }
  }

  async function scan(manual) {
    if (scanning) return;
    scanning = true;
    status(manual ? "扫描本页…" : "自动扫描…");
    try {
      const raw = LeadRadarDom.extract();
      const extracted = raw.length;
      const loose = config.looseScan !== false;
      const minLocal = Number(config.minLocalScore) || 12;
      const minScore = config.minScore || 55;
      const batch = [];

      for (const item of raw) {
        if (seen.has(item.id)) continue;
        const local = LeadRadarSignals.score(item.text);
        if (local.negatives.length) continue;
        if (loose) {
          if (item.text.length < 12) continue;
        } else if (local.score < minLocal) {
          continue;
        }
        seen.add(item.id);
        batch.push({
          id: item.id,
          platform: item.platform,
          author: item.author,
          url: item.url,
          text: item.text,
          localScore: local.score,
          localHits: local.hits,
          localNegatives: local.negatives,
          _el: item.element,
        });
      }

      if (!batch.length) {
        const plat = LeadRadarDom.platform();
        const tip =
          plat === "douyin"
            ? "抖音推荐页几乎没文字。请搜索「跨境」并打开视频评论区再扫。"
            : "本页文字太少。请去搜索页或展开评论区。";
        status(`找到 ${extracted} 段文字，0 条可分析。${tip}`, "warn");
        return;
      }

      const toAnalyze = batch.sort((a, b) => b.localScore - a.localScore).slice(0, 15);
      const payload = toAnalyze.map(({ _el, ...r }) => r);
      const { results, error } = await LeadRadarMsg.send("lr_analyze", { items: payload });
      if (error) throw new Error(error);

      let hot = 0;
      let watch = 0;
      for (const row of results || []) {
        if (!row) continue;
        if (queue.some((q) => q.id === row.id && q.status !== "skipped")) continue;
        const src = toAnalyze.find((b) => b.id === row.id);
        const entry = { ...row, status: "new", foundAt: new Date().toISOString() };
        const existing = queue.findIndex((q) => q.id === row.id);
        if (existing >= 0) queue[existing] = { ...queue[existing], ...entry };
        else queue.unshift(entry);

        if (row.score >= minScore) {
          hot++;
          if (src?._el) LeadRadarDom.highlight(src._el);
          if (config.autoDraft) {
            try {
              await navigator.clipboard.writeText(row.commentDraft || row.dmDraft || "");
            } catch {
              /* ignore */
            }
          }
        } else {
          watch++;
        }
      }

      await save();
      const aiNote = !config.apiKey?.trim() ? "（未配 API Key，使用规则话术）" : "";
      status(
        `本页 ${extracted} 段 → 分析 ${toAnalyze.length} 条 → 精准 ${hot} / 观察 ${watch}${aiNote}`,
        hot ? "ok" : watch ? "warn" : "warn",
      );
    } catch (e) {
      status(e.message || "扫描失败", "err");
    } finally {
      scanning = false;
    }
  }

  function setupTimer() {
    if (timer) clearInterval(timer);
    if (!config.autoScan) return;
    timer = setInterval(() => scan(false), (config.scanSec || 4) * 1000);
  }

  function boot() {
    panel();
    status("获客雷达已启动，可点「立即扫描」", "ok");
    load().then(() => {
      const auto = document.querySelector("#lr-auto");
      if (auto) auto.checked = config.autoScan !== false;
      setupTimer();
      new MutationObserver(() => {
        if (!config.autoScan) return;
        clearTimeout(boot._d);
        boot._d = setTimeout(() => scan(false), 1500);
      }).observe(document.body, { childList: true, subtree: true });
      setTimeout(() => scan(false), 2500);
    });

    // 抖音/SPA 切页后刷新平台标签
    let lastHref = location.href;
    setInterval(() => {
      if (location.href !== lastHref) {
        lastHref = location.href;
        const el = document.querySelector(`#${ROOT} .lr-plat`);
        if (el) {
          const plat = LeadRadarDom.platform();
          el.textContent = PLATFORM_LABELS[plat] || plat;
        }
        if (config.autoScan !== false) setTimeout(() => scan(true), 2000);
      }
    }, 1500);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
