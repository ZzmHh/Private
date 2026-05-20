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

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== "fanmeng-suggest-reply" || !tab?.id) return;
  const text = String(info.selectionText || "").trim();
  chrome.tabs.sendMessage(tab.id, {
    type: "fanmeng_suggest_from_selection",
    text,
  }).catch(() => {});
});

chrome.commands.onCommand.addListener((command, tab) => {
  if (command !== "fanmeng-suggest-reply" || !tab?.id) return;
  chrome.tabs.sendMessage(tab.id, {
    type: "fanmeng_suggest_from_selection",
    text: "",
  }).catch(() => {});
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "fanmeng_ping") {
    sendResponse({ ok: true });
    return true;
  }
  return false;
});
