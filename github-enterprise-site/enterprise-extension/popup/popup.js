async function loadUi() {
  const ver =
    (typeof EnterpriseExtensionConfig !== "undefined" && EnterpriseExtensionConfig.VERSION) || "dev";
  document.getElementById("versionLine").textContent = `TikTok Shop 企业助手 v${ver}`;

  const s = await EnterpriseStorage.getSettings();
  const defaultApi =
    (typeof EnterpriseExtensionConfig !== "undefined" && EnterpriseExtensionConfig.DEFAULT_API_BASE) ||
    "http://127.0.0.1:8787";
  document.getElementById("apiBase").value = s.apiBase || defaultApi;

  if (s.token) {
    document.getElementById("loginBlock").classList.add("hidden");
    document.getElementById("loggedBlock").classList.remove("hidden");
    document.getElementById("pendingFillJobId").value = s.pendingFillJobId || "";
    try {
      const me = await EnterpriseApi.request("/api/enterprise/auth/me");
      document.getElementById("userLine").textContent = `已登录：${me.user?.name || me.user?.loginName || "—"}`;
      await renderShops(s.shopId);
      await renderPendingJobs(s.pendingFillJobId);
    } catch (e) {
      document.getElementById("userLine").textContent = `Token 可能失效：${e.message}`;
    }
  }
}

async function renderPendingJobs(activeId = "") {
  const sel = document.getElementById("pendingJobSelect");
  sel.innerHTML = "";
  const empty = document.createElement("option");
  empty.value = "";
  empty.textContent = "自动使用最新待填任务";
  sel.appendChild(empty);
  try {
    const data = await EnterpriseApi.listPublishJobs("ready");
    for (const job of data.jobs || []) {
      const opt = document.createElement("option");
      opt.value = job.id;
      opt.textContent = `${job.title || "未命名"} · ${job.id.slice(0, 8)}`;
      if (job.id === activeId) opt.selected = true;
      sel.appendChild(opt);
    }
  } catch (e) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = `任务加载失败：${e.message}`;
    sel.appendChild(opt);
  }
}

async function renderShops(activeId) {
  const sel = document.getElementById("shopSelect");
  sel.innerHTML = "";
  try {
    const data = await EnterpriseApi.listShops();
    for (const shop of data.shops || []) {
      const opt = document.createElement("option");
      opt.value = shop.shopId;
      opt.textContent = `${shop.shopName || shop.shopId} (${shop.platform || "tiktok"})`;
      if (shop.shopId === activeId) opt.selected = true;
      sel.appendChild(opt);
    }
    if (!sel.options.length) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "暂无绑定店铺，请先在企业管理后台添加";
      sel.appendChild(opt);
    }
  } catch (e) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = `加载店铺失败：${e.message}`;
    sel.appendChild(opt);
  }
}

document.getElementById("loginBtn").addEventListener("click", async () => {
  const apiBase = document.getElementById("apiBase").value.trim();
  await EnterpriseStorage.saveSettings({ apiBase });
  const loginName = document.getElementById("loginName").value.trim();
  const password = document.getElementById("password").value;
  try {
    await EnterpriseApi.login(loginName, password);
    await loadUi();
  } catch (e) {
    alert(e.message || "登录失败");
  }
});

document.getElementById("logoutBtn").addEventListener("click", async () => {
  await EnterpriseStorage.clearAuth();
  document.getElementById("loggedBlock").classList.add("hidden");
  document.getElementById("loginBlock").classList.remove("hidden");
});

document.getElementById("shopSelect").addEventListener("change", async (e) => {
  const shopId = e.target.value;
  const label = e.target.selectedOptions[0]?.textContent || "";
  await EnterpriseStorage.saveSettings({ shopId, shopName: label.split(" (")[0] || "" });
});

document.getElementById("apiBase").addEventListener("change", async (e) => {
  await EnterpriseStorage.saveSettings({ apiBase: e.target.value.trim() });
});

document.getElementById("pendingFillJobId").addEventListener("change", async (e) => {
  await EnterpriseStorage.saveSettings({ pendingFillJobId: e.target.value.trim() });
});

document.getElementById("pendingJobSelect").addEventListener("change", async (e) => {
  const pendingFillJobId = e.target.value;
  document.getElementById("pendingFillJobId").value = pendingFillJobId;
  await EnterpriseStorage.saveSettings({ pendingFillJobId });
});

document.getElementById("refreshJobsBtn").addEventListener("click", async () => {
  const s = await EnterpriseStorage.getSettings();
  await renderPendingJobs(s.pendingFillJobId || "");
});

loadUi();
