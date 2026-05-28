/**
 * Smoke test enterprise extension API (requires dev server on :8787)
 */
const BASE = process.env.API_BASE || "http://127.0.0.1:8787";

async function main() {
  const loginRes = await fetch(`${BASE}/api/enterprise/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ loginName: "admin", password: "admin123" }),
  });
  const login = await loginRes.json();
  if (!loginRes.ok) throw new Error(login.error || "login failed");
  const headers = { Authorization: `Bearer ${login.token}` };

  const shopsRes = await fetch(`${BASE}/api/enterprise/extension/shops`, { headers });
  const shops = await shopsRes.json();
  if (!shopsRes.ok) throw new Error(shops.error || "shops failed");
  const shopId = shops.shops?.[0]?.shopId;
  if (!shopId) throw new Error("no shops bound");

  const q = new URLSearchParams({ shopId, platform: "tiktok" });
  for (const path of [
    `/api/enterprise/extension/status?${q}`,
    `/api/enterprise/extension/workspace-summary?${q}`,
    `/api/enterprise/metrics/latest?${q}`,
    `/api/enterprise/extension/cs/settings?${q}`,
    "/api/enterprise/creative/status",
    "/api/enterprise/collect/items",
  ]) {
    const res = await fetch(`${BASE}${path}`, { headers });
    const data = await res.json();
    if (!res.ok) throw new Error(`${path} → ${data.error || res.status}`);
    console.log("OK", path.split("?")[0]);
  }

  const collectRes = await fetch(`${BASE}/api/enterprise/collect/items`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      sourceUrl: "https://detail.1688.com/offer/smoke-test.html",
      title: "Smoke Test 采集项",
      sourcePlatform: "1688",
      priceCny: 19.9,
    }),
  });
  const collectData = await collectRes.json();
  if (!collectRes.ok) throw new Error(collectData.error || "collect create failed");
  const itemId = collectData.item?.id;
  console.log("OK POST /api/enterprise/collect/items", itemId);

  const pubRes = await fetch(`${BASE}/api/enterprise/publish/jobs`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      shopId,
      collectItemId: itemId,
      salePrice: "299",
      stock: "50",
      listing: { title: "Smoke Listing", bullets: ["a", "b"] },
    }),
  });
  const pubData = await pubRes.json();
  if (!pubRes.ok) throw new Error(pubData.error || "publish job failed");
  console.log("OK POST /api/enterprise/publish/jobs", pubData.job?.id);

  const jobsRes = await fetch(`${BASE}/api/enterprise/publish/jobs?shopId=${encodeURIComponent(shopId)}`, { headers });
  const jobsData = await jobsRes.json();
  if (!jobsRes.ok) throw new Error(jobsData.error || "publish jobs list failed");
  console.log("OK GET /api/enterprise/publish/jobs", jobsData.jobs?.length);
  console.log("enterprise extension smoke test passed, shopId=", shopId);
}

main().catch((e) => {
  console.error("FAIL:", e.message);
  process.exit(1);
});
