/** 1688 / 货源页 DOM 抓取 */
const EnterpriseScrape1688 = {
  scrape() {
    const pageUrl = location.href;
    const title =
      document.querySelector("h1")?.innerText?.trim() ||
      document.querySelector(".title-text")?.innerText?.trim() ||
      document.querySelector('[class*="offer-title"]')?.innerText?.trim() ||
      document.title?.replace(/-阿里巴巴.*$/, "").trim();

    const bodyText = document.body?.innerText || "";
    const priceMatch = bodyText.match(/(?:¥|￥)\s*([\d.]+)/) || bodyText.match(/([\d.]+)\s*元/);
    const priceCny = priceMatch ? Number(priceMatch[1]) : null;

    const moqMatch = bodyText.match(/(\d+)\s*(?:件|个|套)[^\n]{0,12}起批/);
    const shipMatch = bodyText.match(/(?:发货地|所在地)[：:\s]*([^\n]+)/);

    const images = [...document.querySelectorAll("img")]
      .map((img) => img.src || img.getAttribute("data-src") || "")
      .filter((src) => /alicdn|1688|cbu01/.test(src) && !/icon|logo|avatar/i.test(src))
      .slice(0, 8);

    return {
      pageUrl,
      title: String(title || "未命名商品").slice(0, 300),
      priceCny: Number.isFinite(priceCny) ? priceCny : null,
      moq: moqMatch ? Number(moqMatch[1]) : null,
      shipFrom: shipMatch ? String(shipMatch[1]).trim().slice(0, 80) : "",
      images,
      scrapedAt: new Date().toISOString(),
    };
  },
};

if (typeof globalThis !== "undefined") {
  globalThis.EnterpriseScrape1688 = EnterpriseScrape1688;
}
