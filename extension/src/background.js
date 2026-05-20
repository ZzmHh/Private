chrome.runtime.onInstalled.addListener(() => {
  console.log("[凡梦AI] TikTok Shop 助手已安装");
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "fanmeng_ping") {
    sendResponse({ ok: true });
    return true;
  }
  return false;
});
