/**
 * 企业站插件环境配置（开发默认；生产由 npm run build:enterprise-extension 覆写）
 */
const EnterpriseExtensionConfig = {
  BUILD: "dev",
  VERSION: "0.1.0",
  DEFAULT_API_BASE: "http://127.0.0.1:8787",
  WEBSITE_URL: "http://127.0.0.1:5173/enterprise.html",
  PRIVACY_URL: "",
};

if (typeof globalThis !== "undefined") {
  globalThis.EnterpriseExtensionConfig = EnterpriseExtensionConfig;
}
