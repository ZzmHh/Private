/**
 * 店铺官方 API 集成 — 共享类型（JSDoc）
 *
 * 各平台凭据形状不同，禁止假设「一个 Endpoint + 一段 Token」适用所有平台。
 */

/**
 * @typedef {Object} StoreSnapshotSuccess
 * @property {true} ok
 * @property {string} platform
 * @property {string|null} [storeName]
 * @property {string} pulledAt
 * @property {Record<string, unknown>} data
 */

/**
 * @typedef {Object} StoreSnapshotFailure
 * @property {false} ok
 * @property {string} [platform]
 * @property {string} error
 * @property {string} [hint]
 * @property {string} [connector]
 * @property {string[]} [nextSteps]
 * @property {string} [detail]
 */

/**
 * @typedef {StoreSnapshotSuccess|StoreSnapshotFailure} StoreSnapshotResult
 */

/**
 * 数据库 / 表单透传的通用秘密载荷（平台无关外壳）
 * @typedef {Object} StoreConnectionSecret
 * @property {string} [platform]
 * @property {string} [storeName]
 * @property {string} [apiEndpoint] — Shopify/Woo 用；Amazon 可作 region 提示；TikTok 可作 open-api base 或留空
 * @property {string} [apiToken] — 平台相关：纯 token、Basic、或 JSON 字符串
 */

export {};
