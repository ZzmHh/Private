/**
 * 插件环境配置（开发默认值；生产包由 npm run build:extension 覆写）
 */
const FanmengExtensionConfig = {
  BUILD: "dev",
  VERSION: "0.4.8",
  DEFAULT_API_BASE: "http://127.0.0.1:8787",
  CHROME_STORE_URL: "",
  PRIVACY_URL: "",
  WEBSITE_URL: "",
};

if (typeof globalThis !== "undefined") {
  globalThis.FanmengExtensionConfig = FanmengExtensionConfig;
}
