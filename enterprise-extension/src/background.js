importScripts("./lib/tiktok.js");

chrome.runtime.onInstalled.addListener(() => {
  console.log("[企业 AI] TikTok Shop 助手已安装");
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "enterprise_ping") {
    sendResponse({ ok: true });
    return true;
  }
  return false;
});
