const DEFAULTS = {
  providerId: "openai",
  apiBase: "https://api.openai.com/v1",
  model: "gpt-4o-mini",
  apiKey: "",
  autoScan: true,
  minScore: 55,
  minLocalScore: 12,
  looseScan: true,
  autoDraft: true,
  scanSec: 4,
  productDesc: "",
};

let currentProvider = null;

function msg(text, ok) {
  const el = document.getElementById("msg");
  el.textContent = text;
  el.style.color = ok ? "#15803d" : ok === false ? "#b91c1c" : "#64748b";
}

function fillProviderSelect() {
  const sel = document.getElementById("providerId");
  sel.innerHTML = "";
  for (const g of LeadRadarProviders.groups()) {
    const og = document.createElement("optgroup");
    og.label = g.name;
    for (const p of g.items) {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.name;
      og.appendChild(opt);
    }
    sel.appendChild(og);
  }
}

function fillModelSelect(provider, savedModel) {
  const sel = document.getElementById("modelSelect");
  const customWrap = document.getElementById("customModelWrap");
  sel.innerHTML = "";

  if (!provider.models?.length) {
    customWrap.classList.remove("hidden");
    sel.classList.add("hidden");
    document.getElementById("modelCustom").value = savedModel || provider.defaultModel || "";
    return;
  }

  sel.classList.remove("hidden");
  customWrap.classList.add("hidden");

  for (const m of provider.models) {
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = m;
    sel.appendChild(opt);
  }
  const optCustom = document.createElement("option");
  optCustom.value = "__custom__";
  optCustom.textContent = "自定义模型 ID…";
  sel.appendChild(optCustom);

  const pick = provider.models.includes(savedModel) ? savedModel : savedModel || provider.defaultModel;
  if (provider.models.includes(pick)) {
    sel.value = pick;
  } else if (savedModel) {
    sel.value = "__custom__";
    customWrap.classList.remove("hidden");
    document.getElementById("modelCustom").value = savedModel;
  } else {
    sel.value = provider.defaultModel;
  }
}

function applyProvider(providerId, saved = {}) {
  currentProvider = LeadRadarProviders.get(providerId);
  document.getElementById("providerId").value = providerId;

  if (saved.apiBase && providerId === saved.providerId) {
    document.getElementById("apiBase").value = saved.apiBase;
  } else if (currentProvider.baseUrl) {
    document.getElementById("apiBase").value = currentProvider.baseUrl;
  } else {
    document.getElementById("apiBase").value = "";
  }

  document.getElementById("keyLabel").textContent = currentProvider.keyLabel || "API Key";
  document.getElementById("apiKey").placeholder = currentProvider.keyHint || "";

  const doc = document.getElementById("providerDoc");
  if (currentProvider.docUrl) {
    doc.innerHTML = `<a href="${currentProvider.docUrl}" target="_blank" rel="noopener">获取 API Key →</a>`;
  } else {
    doc.textContent = providerId === "custom" ? "填写任意 OpenAI 兼容接口地址" : "";
  }

  fillModelSelect(currentProvider, saved.model);
}

function readModel() {
  const sel = document.getElementById("modelSelect");
  if (sel.classList.contains("hidden")) {
    return document.getElementById("modelCustom").value.trim();
  }
  if (sel.value === "__custom__") {
    return document.getElementById("modelCustom").value.trim();
  }
  return sel.value;
}

async function load() {
  fillProviderSelect();
  const { lead_radar_settings = {} } = await chrome.storage.local.get("lead_radar_settings");
  const s = { ...DEFAULTS, ...lead_radar_settings };
  applyProvider(s.providerId || "openai", s);
  document.getElementById("apiKey").value = s.apiKey;
  document.getElementById("productDesc").value = s.productDesc;
  document.getElementById("autoScan").checked = s.autoScan !== false;
  document.getElementById("autoDraft").checked = s.autoDraft !== false;
  document.getElementById("looseScan").checked = s.looseScan !== false;
  document.getElementById("minScore").value = s.minScore ?? 55;
  document.getElementById("minLocalScore").value = s.minLocalScore ?? 12;
  document.getElementById("scanSec").value = s.scanSec ?? 4;
}

document.getElementById("providerId").addEventListener("change", (e) => {
  applyProvider(e.target.value, {});
});

document.getElementById("modelSelect").addEventListener("change", (e) => {
  const customWrap = document.getElementById("customModelWrap");
  if (e.target.value === "__custom__") customWrap.classList.remove("hidden");
  else customWrap.classList.add("hidden");
});

async function saveSettings() {
  const providerId = document.getElementById("providerId").value;
  const model = readModel() || LeadRadarProviders.get(providerId).defaultModel;
  const next = {
    providerId,
    apiBase: document.getElementById("apiBase").value.trim(),
    apiKey: document.getElementById("apiKey").value.trim(),
    model,
    productDesc: document.getElementById("productDesc").value.trim(),
    autoScan: document.getElementById("autoScan").checked,
    autoDraft: document.getElementById("autoDraft").checked,
    looseScan: document.getElementById("looseScan").checked,
    minScore: Number(document.getElementById("minScore").value) || 55,
    minLocalScore: Number(document.getElementById("minLocalScore").value) || 12,
    scanSec: Number(document.getElementById("scanSec").value) || 4,
  };
  await chrome.storage.local.set({ lead_radar_settings: next });
  return next;
}

document.getElementById("saveBtn").addEventListener("click", async () => {
  await saveSettings();
  msg("已保存", true);
});

document.getElementById("testBtn").addEventListener("click", async () => {
  msg("测试中…", null);
  const settings = await saveSettings();
  if (!settings.apiKey?.trim()) {
    msg("请先填写 API Key", false);
    return;
  }
  if (!settings.model?.trim()) {
    msg("请选择或填写模型名称", false);
    return;
  }
  try {
    // 在弹窗内直接请求 API，不依赖后台 Service Worker（避免 unknown）
    const raw = await LeadRadarLlm.callWithSettings(settings, [
      { role: "user", content: "只回复两个字：成功" },
    ]);
    msg(`连接成功：${String(raw).slice(0, 60) || "OK"}`, true);
  } catch (e) {
    msg(e?.message || "连接失败", false);
  }
});

load();
