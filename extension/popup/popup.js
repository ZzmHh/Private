async function loadUi() {
  const s = await FanmengStorage.getSettings();
  const defaultApi =
    (typeof FanmengExtensionConfig !== "undefined" && FanmengExtensionConfig.DEFAULT_API_BASE) ||
    "http://127.0.0.1:8787";
  document.getElementById("apiBase").value = s.apiBase || defaultApi;
  document.getElementById("autoSync").checked = Boolean(s.autoSync);
  document.getElementById("autoSyncMinutes").value = String(s.autoSyncMinutes || 15);
  document.getElementById("autoCsListen").checked = s.autoCsListen !== false;
  document.getElementById("autoDiagnosisSync").checked = s.autoDiagnosisSync !== false;

  const planLine = document.getElementById("planLine");
  const subscribeBtn = document.getElementById("subscribeBtn");

  if (s.token) {
    document.getElementById("loginBlock").classList.add("hidden");
    document.getElementById("loggedBlock").classList.remove("hidden");
    try {
      const st = await FanmengApi.status();
      document.getElementById("userLine").textContent = `已登录：${st.user?.email || "—"}`;
      const ent = await FanmengApi.refreshEntitlements();
      planLine.textContent = FanmengBilling.planStatusLine(ent);
      planLine.className = "plan-line";
      if (ent.extensionAllowed) {
        if (ent.trialActive) planLine.classList.add("is-warn");
        subscribeBtn.classList.add("hidden");
      } else {
        planLine.classList.add("is-err");
        planLine.textContent = ent.extensionBlockReason || "需要订阅标准版才能使用插件";
        subscribeBtn.classList.remove("hidden");
      }
    } catch (e) {
      document.getElementById("userLine").textContent = `Token 可能失效：${e.message}`;
      planLine.textContent = "";
      subscribeBtn.classList.add("hidden");
    }
  } else {
    planLine.textContent = "登录后同步网站套餐；插件与网站共用账号与订阅。";
    planLine.className = "plan-line";
    subscribeBtn.classList.add("hidden");
  }

  await renderShops();
  await renderTemplates();
}

async function renderShops() {
  const ul = document.getElementById("shopList");
  const shops = await FanmengStorage.getShops();
  const settings = await FanmengStorage.getSettings();
  ul.innerHTML = "";
  if (!shops.length) {
    ul.innerHTML = "<li class='muted'>暂无，请在卖家中心绑定</li>";
    return;
  }
  for (const shop of shops) {
    const li = document.createElement("li");
    const active = shop.id === settings.activeShopId ? " ★" : "";
    li.textContent = `${shop.name}${active}`;
    ul.appendChild(li);
  }
}

async function renderTemplates() {
  const ul = document.getElementById("templateList");
  const templates = await FanmengStorage.getTemplates();
  ul.innerHTML = "";
  if (!templates.length) {
    ul.innerHTML = "<li class='muted'>暂无</li>";
    return;
  }
  for (const t of templates.slice(0, 8)) {
    const li = document.createElement("li");
    li.innerHTML = `<span>${t.name}</span> <button type="button" data-id="${t.id}" class="linkish">删除</button>`;
    li.querySelector("button").addEventListener("click", async () => {
      await FanmengStorage.deleteTemplate(t.id);
      await renderTemplates();
    });
    ul.appendChild(li);
  }
}

function showMsg(text, ok) {
  const el = document.getElementById("msg");
  el.textContent = text || "";
  el.style.color = ok ? "#15803d" : "#b91c1c";
}

async function persistSettings() {
  await FanmengStorage.saveSettings({
    apiBase: document.getElementById("apiBase").value.trim(),
    autoSync: document.getElementById("autoSync").checked,
    autoSyncMinutes: Number(document.getElementById("autoSyncMinutes").value) || 15,
    autoCsListen: document.getElementById("autoCsListen").checked,
    autoDiagnosisSync: document.getElementById("autoDiagnosisSync").checked,
  });
}

document.getElementById("loginBtn").addEventListener("click", async () => {
  showMsg("");
  try {
    await persistSettings();
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

["apiBase", "autoSync", "autoSyncMinutes", "autoCsListen", "autoDiagnosisSync"].forEach((id) => {
  document.getElementById(id).addEventListener("change", persistSettings);
});

document.getElementById("openSeller").addEventListener("click", () => {
  chrome.tabs.create({ url: FanmengTikTok.DEFAULT_SELLER_URL });
});

document.getElementById("subscribeBtn").addEventListener("click", async () => {
  const ent = await FanmengBilling.getEntitlements();
  const url = ent.billingUrl || FanmengBilling.billingUrlFromApiBase(document.getElementById("apiBase").value);
  if (url) chrome.tabs.create({ url });
  else showMsg("请先在网站注册并打开订阅页");
});

FanmengTutorial.mountInto(document.getElementById("tutorialMount"), "popup");
loadUi();
