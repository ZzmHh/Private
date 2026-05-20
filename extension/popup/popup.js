async function loadUi() {
  const s = await FanmengStorage.getSettings();
  document.getElementById("apiBase").value = s.apiBase || "http://127.0.0.1:8787";
  document.getElementById("shopName").value = s.shopName || "";
  document.getElementById("autoSync").checked = Boolean(s.autoSync);
  document.getElementById("autoSyncMinutes").value = String(s.autoSyncMinutes || 15);

  if (s.token) {
    document.getElementById("loginBlock").classList.add("hidden");
    document.getElementById("loggedBlock").classList.remove("hidden");
    try {
      const st = await FanmengApi.status();
      document.getElementById("userLine").textContent = `已登录：${st.user?.email || "—"} · 快照 ${st.snapshotCount} 条`;
    } catch (e) {
      document.getElementById("userLine").textContent = `Token 可能失效：${e.message}`;
    }
  }
}

function showMsg(text, ok) {
  const el = document.getElementById("msg");
  el.textContent = text || "";
  el.style.color = ok ? "#15803d" : "#b91c1c";
}

document.getElementById("loginBtn").addEventListener("click", async () => {
  showMsg("");
  try {
    await FanmengStorage.saveSettings({
      apiBase: document.getElementById("apiBase").value.trim(),
      shopName: document.getElementById("shopName").value.trim(),
      autoSync: document.getElementById("autoSync").checked,
      autoSyncMinutes: Number(document.getElementById("autoSyncMinutes").value) || 15,
    });
    await FanmengApi.login(
      document.getElementById("email").value.trim(),
      document.getElementById("password").value,
    );
    showMsg("登录成功", true);
    await loadUi();
  } catch (e) {
    showMsg(e.message || "登录失败");
  }
});

document.getElementById("logoutBtn").addEventListener("click", async () => {
  await FanmengStorage.clearAuth();
  document.getElementById("loginBlock").classList.remove("hidden");
  document.getElementById("loggedBlock").classList.add("hidden");
  showMsg("已退出", true);
});

["apiBase", "shopName", "autoSync", "autoSyncMinutes"].forEach((id) => {
  document.getElementById(id).addEventListener("change", async () => {
    await FanmengStorage.saveSettings({
      apiBase: document.getElementById("apiBase").value.trim(),
      shopName: document.getElementById("shopName").value.trim(),
      autoSync: document.getElementById("autoSync").checked,
      autoSyncMinutes: Number(document.getElementById("autoSyncMinutes").value) || 15,
    });
  });
});

document.getElementById("openSeller").addEventListener("click", () => {
  chrome.tabs.create({ url: "https://seller.tiktok.com/" });
});

loadUi();
