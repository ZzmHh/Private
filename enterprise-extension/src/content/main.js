/**
 * TikTok 卖家中心 content script：同步快照 + 填入上架包
 */
(function enterpriseContentMain() {
  const PANEL_ID = "enterprise-ext-panel";

  function ensurePanel() {
    if (document.getElementById(PANEL_ID)) return;
    const el = document.createElement("div");
    el.id = PANEL_ID;
    el.innerHTML = `
      <button type="button" id="enterprise-ext-sync">同步本页</button>
      <button type="button" id="enterprise-ext-fill">填入上架包</button>
      <span id="enterprise-ext-status"></span>
    `;
    document.documentElement.appendChild(el);
    el.querySelector("#enterprise-ext-sync")?.addEventListener("click", syncCurrentPage);
    el.querySelector("#enterprise-ext-fill")?.addEventListener("click", fillListingPack);
  }

  function setStatus(text) {
    const status = document.getElementById("enterprise-ext-status");
    if (status) status.textContent = text;
  }

  async function syncCurrentPage() {
    setStatus("同步中…");
    try {
      const title = document.title || "";
      const pageUrl = location.href;
      const pageType = /chat|message/i.test(pageUrl) ? "chat" : /product|item|listing|create/i.test(pageUrl) ? "product" : "unknown";
      const data = typeof EnterpriseScrape !== "undefined" ? EnterpriseScrape.scrapePage() : { title, url: pageUrl };
      await EnterpriseApi.pushSnapshot({ pageType, pageUrl, title, data });
      setStatus("已同步");
    } catch (err) {
      setStatus(err?.message || "同步失败");
    }
  }

  async function resolveFillJobId() {
    const settings = await EnterpriseStorage.getSettings();
    if (settings.pendingFillJobId) return settings.pendingFillJobId;
    const data = await EnterpriseApi.listPublishJobs("ready");
    const job = (data.jobs || [])[0];
    return job?.id || "";
  }

  async function fillListingPack() {
    setStatus("加载上架包…");
    try {
      const jobId = await resolveFillJobId();
      if (!jobId) {
        setStatus("无待填任务：请在弹窗填写任务 ID");
        return;
      }
      const data = await EnterpriseApi.getFillPack(jobId);
      const pack = data.fillPack || {};
      if (typeof EnterpriseListingFill === "undefined") {
        setStatus("填表模块未加载");
        return;
      }
      const result = await EnterpriseListingFill.fill(pack);
      if (result.ok) {
        await EnterpriseApi.markJobFilled(jobId, result);
        setStatus(result.message || "已填入");
      } else {
        setStatus(result.message || "填表失败");
      }
    } catch (err) {
      setStatus(err?.message || "填表失败");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ensurePanel);
  } else {
    ensurePanel();
  }
})();
