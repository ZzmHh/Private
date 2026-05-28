/** 本地自检：企业站 admin/shops 路由 + 登录 + 列表 */
const BASE = "http://127.0.0.1:8787";

async function main() {
  const anon = await fetch(`${BASE}/api/enterprise/admin/shops`);
  const anonBody = await anon.json().catch(() => ({}));
  console.log("[1] 未登录 GET admin/shops →", anon.status, anonBody.error || anonBody);

  if (anon.status === 404) {
    console.error("FAIL: 仍是 404，后端未加载 enterprise admin 路由");
    process.exit(1);
  }
  if (anon.status !== 401) {
    console.warn("WARN: 期望 401，实际", anon.status);
  }

  const loginRes = await fetch(`${BASE}/api/enterprise/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ loginName: "admin", password: "admin123" }),
  });
  const loginData = await loginRes.json().catch(() => ({}));
  if (!loginRes.ok || !loginData.token) {
    console.error("FAIL: 登录失败", loginData);
    process.exit(1);
  }
  console.log("[2] 主账号登录 → 200");

  const shopsRes = await fetch(`${BASE}/api/enterprise/admin/shops`, {
    headers: { Authorization: `Bearer ${loginData.token}` },
  });
  const shopsData = await shopsRes.json().catch(() => ({}));
  console.log("[3] 已登录 GET admin/shops →", shopsRes.status, `shops=${shopsData.shops?.length ?? "?"}`);

  if (!shopsRes.ok) {
    console.error("FAIL:", shopsData);
    process.exit(1);
  }

  console.log("OK: 企业店铺 API 链路正常");
}

main().catch((e) => {
  console.error("FAIL:", e.message);
  process.exit(1);
});
