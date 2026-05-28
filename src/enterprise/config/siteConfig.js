/**
 * 企业定制站 · 站点配置（部署时通过 Vite 环境变量注入，与凡梦 C 端无关）
 */
export function getEnterpriseSiteConfig() {
  const orgName = import.meta.env.VITE_ENTERPRISE_ORG_NAME || "企业 AI 工作台";
  const brandMark = import.meta.env.VITE_ENTERPRISE_BRAND_MARK || orgName.slice(0, 2).toUpperCase();
  const tagline =
    import.meta.env.VITE_ENTERPRISE_TAGLINE || "Agent 工作台 · 智能客服 · 业绩与利润诊断";
  const supportHint =
    import.meta.env.VITE_ENTERPRISE_SUPPORT_HINT || "账号由管理员分配，如需开通请联系企业管理员。";

  return {
    orgName,
    brandMark,
    tagline,
    supportHint,
    isStandalone: import.meta.env.VITE_ENTERPRISE_STANDALONE === "1",
  };
}
