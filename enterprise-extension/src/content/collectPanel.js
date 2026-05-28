/** 1688 / 货源页 · 采集到企业站采集箱 */
(function enterpriseCollectPanel() {
  const PANEL_ID = "enterprise-ext-collect-panel";

  function ensurePanel() {
    if (document.getElementById(PANEL_ID)) return;
    const el = document.createElement("div");
    el.id = PANEL_ID;
    el.className = "enterprise-ext-collect";
    el.innerHTML = `
      <button type="button" id="enterprise-ext-collect-btn">采集到企业站</button>
      <span id="enterprise-ext-collect-status"></span>
    `;
    document.documentElement.appendChild(el);
    el.querySelector("#enterprise-ext-collect-btn")?.addEventListener("click", collectCurrentPage);
  }

  function setStatus(text) {
    const status = document.getElementById("enterprise-ext-collect-status");
    if (status) status.textContent = text;
  }

  async function collectCurrentPage() {
    setStatus("采集中…");
    try {
      const scraped =
        typeof EnterpriseScrape1688 !== "undefined" ? EnterpriseScrape1688.scrape() : { pageUrl: location.href, title: document.title };
      await EnterpriseApi.collectFromPage({
        pageUrl: scraped.pageUrl,
        title: scraped.title,
        priceCny: scraped.priceCny,
        moq: scraped.moq,
        shipFrom: scraped.shipFrom,
        images: scraped.images,
        data: scraped,
      });
      setStatus("已入采集箱");
    } catch (err) {
      setStatus(err?.message || "采集失败");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ensurePanel);
  } else {
    ensurePanel();
  }
})();
