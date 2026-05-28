const LeadRadarMsg = {
  async send(type, payload = {}) {
    try {
      const res = await chrome.runtime.sendMessage({ type, ...payload });
      if (res === undefined) {
        return {
          error: "无法连接插件后台，请到 chrome://extensions 点击「重新加载」",
        };
      }
      return res;
    } catch (e) {
      return {
        error: e?.message || "插件通信失败，请重新加载扩展",
      };
    }
  },
};

if (typeof globalThis !== "undefined") globalThis.LeadRadarMsg = LeadRadarMsg;
