/**
 * SEO：sitemap.xml / robots.txt
 */

const PUBLIC_HASH_ROUTES = [
  { loc: "", changefreq: "weekly", priority: "1.0" },
  { loc: "#login", changefreq: "monthly", priority: "0.6" },
  { loc: "#register", changefreq: "monthly", priority: "0.8" },
  { loc: "#cases", changefreq: "weekly", priority: "0.7" },
  { loc: "#subscription", changefreq: "weekly", priority: "0.7" },
];

const CASE_SLUGS = ["home-tiktok-us", "amazon-multi-listing", "cs-heavy-store"];

const STATIC_PATHS = [
  "/privacy-extension.html",
  "/downloads/fanmeng-tiktok-extension.zip",
];

function siteBase(req) {
  const env = process.env.APP_PUBLIC_URL?.trim().replace(/\/+$/, "");
  if (env) return env;
  const host = req.get("host");
  const proto = req.get("x-forwarded-proto") || req.protocol || "http";
  return host ? `${proto}://${host}` : "http://127.0.0.1:8787";
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildSitemapXml(req) {
  const base = siteBase(req);
  const lastmod = new Date().toISOString().slice(0, 10);
  const urls = [];

  for (const r of PUBLIC_HASH_ROUTES) {
    urls.push({ loc: `${base}/${r.loc}`, changefreq: r.changefreq, priority: r.priority, lastmod });
  }
  for (const slug of CASE_SLUGS) {
    urls.push({
      loc: `${base}/#case/${slug}`,
      changefreq: "monthly",
      priority: "0.6",
      lastmod,
    });
  }
  for (const p of STATIC_PATHS) {
    if (p.endsWith(".zip")) continue;
    urls.push({ loc: `${base}${p}`, changefreq: "monthly", priority: "0.5", lastmod });
  }

  const body = urls
    .map(
      (u) => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`;
}

export function buildRobotsTxt(req) {
  const base = siteBase(req);
  return `User-agent: *
Allow: /

# 凡梦AI 官网 · 允许抓取公开页（SPA 主内容在 / 与各 hash 路由）
Disallow: /api/

Sitemap: ${base}/sitemap.xml
`;
}

/**
 * @param {import("express").Express} app
 */
export function registerSeoRoutes(app) {
  app.get("/sitemap.xml", (req, res) => {
    res.type("application/xml").send(buildSitemapXml(req));
  });

  app.get("/robots.txt", (req, res) => {
    res.type("text/plain; charset=utf-8").send(buildRobotsTxt(req));
  });
}
