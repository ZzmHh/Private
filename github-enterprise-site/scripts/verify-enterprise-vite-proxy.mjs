/** 经 Vite 代理自检（模拟浏览器） */
const BASE = "http://127.0.0.1:5173";

async function main() {
  const loginRes = await fetch(`${BASE}/api/enterprise/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ loginName: "admin", password: "admin123" }),
  });
  const loginData = await loginRes.json().catch(() => ({}));
  if (!loginRes.ok) {
    console.error("FAIL vite proxy login", loginRes.status, loginData);
    process.exit(1);
  }

  const shopsRes = await fetch(`${BASE}/api/enterprise/admin/shops`, {
    headers: { Authorization: `Bearer ${loginData.token}` },
  });
  const shopsData = await shopsRes.json().catch(() => ({}));
  console.log("vite proxy admin/shops →", shopsRes.status, `shops=${shopsData.shops?.length ?? "?"}`);
  if (!shopsRes.ok) {
    console.error("FAIL", shopsData);
    process.exit(1);
  }
  console.log("OK: 前端代理链路正常");
}

main().catch((e) => {
  console.error("FAIL:", e.message);
  process.exit(1);
});
