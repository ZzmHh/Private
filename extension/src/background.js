importScripts("./lib/tiktok.js");

chrome.runtime.onInstalled.addListener(() => {
  console.log("[凡梦AI] TikTok Shop 助手已安装");
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "fanmeng-suggest-reply",
      title: "凡梦生成回复",
      contexts: ["selection"],
      documentUrlPatterns: FanmengTikTok.SELLER_URL_PATTERNS,
    });
  });
});

function sendSuggestToActiveTab(text = "") {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab?.id) return;
    chrome.tabs
      .sendMessage(tab.id, {
        type: "fanmeng_suggest_from_selection",
        text: String(text || ""),
      })
      .catch(() => {});
  });
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== "fanmeng-suggest-reply") return;
  const text = String(info.selectionText || "").trim();
  if (tab?.id) {
    chrome.tabs
      .sendMessage(tab.id, { type: "fanmeng_suggest_from_selection", text })
      .catch(() => {});
    return;
  }
  sendSuggestToActiveTab(text);
});

chrome.commands.onCommand.addListener((command) => {
  if (command !== "fanmeng-suggest-reply") return;
  sendSuggestToActiveTab("");
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "fanmeng_ping") {
    sendResponse({ ok: true });
    return true;
  }
  return false;
});
