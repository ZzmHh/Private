/** 网站侧 · TikTok 插件安装引导配置（Vite 环境变量） */
export const extensionInstallConfig = {
  chromeStoreUrl: String(import.meta.env.VITE_EXTENSION_CWS_URL || "").trim(),
  zipDownloadUrl: String(import.meta.env.VITE_EXTENSION_ZIP_URL || "/downloads/fanmeng-tiktok-extension.zip").trim(),
  /** 提示卖家在插件里填写的 API 地址（可与网站同域） */
  defaultApiBase: String(import.meta.env.VITE_PUBLIC_API_URL || "").trim(),
  privacyUrl: String(import.meta.env.VITE_EXTENSION_PRIVACY_URL || "/privacy-extension.html").trim(),
  websiteUrl: String(import.meta.env.VITE_PUBLIC_APP_URL || "").trim(),
};

export const EXTENSION_INSTALL_DISMISS_KEY = "fanmeng_extension_install_dismissed_v1";

export function extensionInstallAvailable(user, isBetaMode) {
  if (!user || isBetaMode) return Boolean(user);
  if (!user.accessActive) return false;
  return Boolean(user.planFeatures?.storeApiAgents);
}
