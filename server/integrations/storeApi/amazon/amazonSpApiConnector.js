/**
 * Amazon Selling Partner API (SP-API) — 独立连接器
 *
 * 【阶段】第二优先级：在 TikTok Shop 连接器稳定后再在此文件实现 LWA 换票与 SigV4 请求。
 * 环境变量（实现时示例）：SPAPI_LWA_CLIENT_ID、SPAPI_LWA_CLIENT_SECRET、IAM 与 STS 等。
 */

/** @typedef {{ refreshToken?: string, sellerId?: string, marketplaceIds?: string[], region?: string }} AmazonSpApiParsedCredentials */

/**
 * @param {string} rawToken
 * @returns {AmazonSpApiParsedCredentials | null}
 */
export function parseAmazonSpApiCredentials(rawToken) {
  const raw = String(rawToken || "").trim();
  if (!raw) return null;
  if (raw.startsWith("{")) {
    try {
      const j = JSON.parse(raw);
      return {
        refreshToken: j.refreshToken || j.refresh_token,
        sellerId: j.sellerId || j.selling_partner_id,
        marketplaceIds: j.marketplaceIds || j.marketplace_ids,
        region: j.region,
      };
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * @param {import("../types.js").StoreConnectionSecret} secret
 * @returns {StoreSnapshotResult}
 */
export async function fetchAmazonSpApiSnapshot(secret) {
  const parsed = parseAmazonSpApiCredentials(secret?.apiToken || "");
  const regionHint = String(secret?.apiEndpoint || "").trim() || "请使用 JSON 配置 region 或单独字段";

  if (!parsed?.refreshToken) {
    return {
      ok: false,
      platform: "Amazon",
      connector: "sp-api",
      error: "未检测到 SP-API 所需的卖家授权信息。",
      hint: "Amazon 不使用与 Shopify 相同的「Endpoint + 单行 Token」。请在保存凭据时，将 apiToken 设为 JSON，至少包含 refreshToken（LWA 授权换发）、sellerId、selling_partner_id、marketplaceIds 等字段，具体以实现阶段文档为准。",
      nextSteps: [
        "Seller Central → 应用管理：创建开发者应用并完成 LWA + IAM 角色",
        "卖家对你的应用完成 OAuth，保存 refresh_token 与 seller 标识",
        "服务端用 LWA 刷新 access_token，再用 SigV4 请求 SP-API 区域端点",
        "本连接器文件 amazonSpApiConnector.js 中实现真实 HTTP 调用与错误映射",
      ],
    };
  }

  return {
    ok: false,
    platform: "Amazon",
    connector: "sp-api",
    error: "SP-API 只读拉单尚未在本仓库中实现。",
    hint: `已解析到 refreshToken（片段）与区域提示「${regionHint}」；需补齐 LWA 换票与 SigV4 签名后再请求 Orders API。`,
    nextSteps: [
      "在 amazonSpApiConnector.js 实现 LWA refresh 与 getOrders 最小调用",
      "将客户端密钥与 AWS 签名密钥仅放在环境变量中",
    ],
  };
}
