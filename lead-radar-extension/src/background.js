importScripts("./providers.js", "./llmShared.js");

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

async function getSettings() {
  const { lead_radar_settings = {} } = await chrome.storage.local.get("lead_radar_settings");
  return LeadRadarLlm.mergeSettings({ ...DEFAULTS, ...lead_radar_settings });
}

function buildAnalyzePrompt(items, productDesc) {
  return [
    {
      role: "system",
      content: `你是社媒拓客专家。根据帖子内容判断是否为值得跟进的潜在客户，并写自然、非骚扰的中文触达话术。
推广信息（可软植入）：${productDesc || "（未填写）"}

只输出 JSON 数组：
[{"id":"...","score":0-100,"persona":"画像","pains":["痛点"],"worthOutreach":true,"reason":"理由","commentDraft":"公开评论","dmDraft":"私信版","hook":"一句话"}]
广告/招代理 → worthOutreach=false。`,
    },
    { role: "user", content: JSON.stringify(items) },
  ];
}

function parseAnalyzeJson(raw, fallback) {
  const t = String(raw || "");
  const a = t.indexOf("[");
  const b = t.lastIndexOf("]");
  if (a < 0 || b <= a) return fallback;
  try {
    return JSON.parse(t.slice(a, b + 1));
  } catch {
    return fallback;
  }
}

function fallbackResults(items, productDesc) {
  const pitch = productDesc ? `我们这边做${productDesc.slice(0, 40)}，可以交流下。` : "这类问题后来用工具化流程会省很多时间，可以交流下。";
  return items.map((it) => ({
    id: it.id,
    score: Math.max(it.localScore || 40, 40),
    persona: it.localHits?.[0] || "潜在用户",
    pains: it.localHits || [],
    worthOutreach: (it.localScore || 0) >= 25,
    reason: it.localHits?.length ? "命中意向词" : "宽松模式收录",
    commentDraft: `同感，${pitch}`,
    dmDraft: `你好，看到你提到${it.localHits?.[0] || "相关"}的问题，${pitch}`,
    hook: it.localHits?.[0] || "",
  }));
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    if (msg.type === "lr_get_settings") {
      sendResponse({ settings: await getSettings() });
      return;
    }
    if (msg.type === "lr_test_llm") {
      try {
        const s = await getSettings();
        if (!s.apiKey?.trim()) {
          sendResponse({ ok: false, error: "请先填写 API Key" });
          return;
        }
        const raw = await LeadRadarLlm.callWithSettings(s, [
          { role: "user", content: "只回复两个字：成功" },
        ]);
        sendResponse({ ok: true, preview: String(raw).slice(0, 120) });
      } catch (e) {
        sendResponse({ ok: false, error: e?.message || String(e) || "连接失败" });
      }
      return;
    }
    if (msg.type === "lr_analyze") {
      const items = msg.items || [];
      const s = await getSettings();
      const needAi = items.filter((it) => !(it.localNegatives || []).length);
      const low = items.filter((it) => (it.localNegatives || []).length);

      const map = {};
      for (const it of low) {
        map[it.id] = {
          id: it.id,
          score: it.localScore,
          persona: it.localHits?.[0] || "低优先",
          worthOutreach: false,
          reason: "意向弱或疑似广告",
          commentDraft: "",
          dmDraft: "",
          hook: "",
          platform: it.platform,
          author: it.author,
          url: it.url,
          textPreview: it.text?.slice(0, 160),
        };
      }

      if (needAi.length) {
        try {
          const raw = await LeadRadarLlm.callLlm(buildAnalyzePrompt(needAi, s.productDesc));
          const parsed = parseAnalyzeJson(raw, fallbackResults(needAi, s.productDesc));
          for (const row of parsed) {
            const src = needAi.find((x) => x.id === row.id);
            map[row.id] = {
              ...row,
              platform: src?.platform,
              author: src?.author,
              url: src?.url,
              textPreview: src?.text?.slice(0, 160),
            };
          }
        } catch (e) {
          for (const row of fallbackResults(needAi, s.productDesc)) {
            const src = needAi.find((x) => x.id === row.id);
            map[row.id] = {
              ...row,
              platform: src?.platform,
              author: src?.author,
              url: src?.url,
              textPreview: src?.text?.slice(0, 160),
              aiError: e.message,
            };
          }
        }
      }

      sendResponse({ results: items.map((it) => map[it.id]).filter(Boolean) });
      return;
    }
    if (msg.type === "lr_badge") {
      const n = Math.min(99, Number(msg.count) || 0);
      await chrome.action.setBadgeText({ text: n > 0 ? String(n) : "" });
      await chrome.action.setBadgeBackgroundColor({ color: "#ea580c" });
      sendResponse({ ok: true });
      return;
    }
    sendResponse({ error: `未识别的消息类型: ${msg?.type || "(空)"}` });
  })().catch((e) => sendResponse({ error: e.message || "后台处理失败" }));
  return true;
});
