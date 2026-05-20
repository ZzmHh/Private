/**
 * 聊天页：检测新买家消息并触发话术（不自动发送）
 */
const FanmengChatWatcher = {
  lastFingerprint: "",
  pollTimer: null,
  debounceTimer: null,
  lastFailHintAt: 0,

  RECOGNITION_FAIL_HINT: "未识别到买家消息，请选中一条消息后点「手动生成话术」",

  fingerprint(text) {
    return String(text || "")
      .trim()
      .slice(0, 500);
  },

  async shouldAutoListen() {
    const s = await FanmengStorage.getSettings();
    return Boolean(s.autoCsListen && s.token);
  },

  onNewMessage(callback) {
    const tick = async () => {
      if (!(await this.shouldAutoListen())) return;
      if (FanmengScrape.detectPageType(location.href, document.title) !== "chat") return;

      const parsed = FanmengScrape.parseChat(document.body);
      const scraped = FanmengScrape.scrapePage();
      const buyerText = parsed.lastBuyer?.text || "";

      if (!buyerText) {
        const now = Date.now();
        if (now - this.lastFailHintAt > 15000) {
          this.lastFailHintAt = now;
          callback({
            buyerText: "",
            scraped,
            parsed,
            isNew: false,
            recognitionFailed: true,
            hint: this.RECOGNITION_FAIL_HINT,
          });
        }
        return;
      }

      const fp = this.fingerprint(buyerText);
      if (!fp || fp.length < 2) return;
      if (fp === this.lastFingerprint) return;

      this.lastFingerprint = fp;
      callback({
        buyerText,
        scraped,
        parsed,
        isNew: true,
        recognitionFailed: false,
      });
    };

    const observer = new MutationObserver(() => {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(tick, 1200);
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    this.pollTimer = setInterval(tick, 4000);
    tick();
    return () => {
      observer.disconnect();
      clearInterval(this.pollTimer);
      clearTimeout(this.debounceTimer);
    };
  },

  resetFingerprint() {
    this.lastFingerprint = "";
  },
};

if (typeof globalThis !== "undefined") {
  globalThis.FanmengChatWatcher = FanmengChatWatcher;
}
