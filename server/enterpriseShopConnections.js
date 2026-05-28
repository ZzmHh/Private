import crypto from "node:crypto";
import { readDb, writeDb } from "./repositories/index.js";
import { createError } from "./lib/errors.js";
import { isEnterpriseUser } from "./enterpriseAuth.js";
import {
  ENTERPRISE_ORG_ID,
  PLATFORM_CATALOG,
  MARKET_LABELS,
  sanitizeOrgShop,
  getOrgShopById,
} from "./enterpriseOrgShops.js";
import { fetchStoreSnapshot } from "./integrations/storeApi/dispatcher.js";
import {
  buildTiktokAuthorizeUrl,
  buildTiktokConnectionTokenJson,
  exchangeTiktokAuthCodeForToken,
  fetchTiktokAuthorizedShops,
} from "./integrations/storeApi/tiktok/tiktokShopOAuth.js";
import {
  buildShopeeAuthorizeUrl,
  buildShopeeConnectionTokenJson,
  exchangeShopeeAuthCode,
} from "./integrations/storeApi/shopee/oauth.js";
import {
  buildLazadaAuthorizeUrl,
  buildLazadaConnectionTokenJson,
  exchangeLazadaAuthCode,
} from "./integrations/storeApi/lazada/oauth.js";
import {
  buildWalmartAuthorizeUrl,
  buildWalmartConnectionTokenJson,
  exchangeWalmartAuthCode,
} from "./integrations/storeApi/walmart/oauth.js";
import { buildOzonConnectionTokenJson } from "./integrations/storeApi/ozon/ozonConnector.js";
import { platformUsesOAuth } from "./integrations/storeApi/registry.js";

const OAUTH_STATE_SECRET =
  process.env.TIKTOK_OAUTH_STATE_SECRET?.trim() ||
  process.env.TIKTOK_SHOP_APP_SECRET?.trim() ||
  "fanmeng-enterprise-oauth-dev";

function maskSecret(value = "") {
  const s = String(value || "");
  if (!s) return "";
  if (s.length <= 8) return "********";
  return `${s.slice(0, 4)}****${s.slice(-4)}`;
}

function isOwner(user) {
  return user?.accountType === "enterprise_owner" || user?.enterpriseRole === "owner";
}

function assertOwner(user) {
  if (!isOwner(user)) throw createError("需要主账号权限。", 403);
}

function orgIdFor(user) {
  return user?.orgId || ENTERPRISE_ORG_ID;
}

function normalizePlatform(p) {
  const x = String(p || "").toLowerCase();
  return PLATFORM_CATALOG[x] ? x : x;
}

function findOrgShop(db, shopId, orgId) {
  return (db.orgShops || []).find(
    (s) => s.id === shopId && s.orgId === orgId && s.status !== "deleted",
  );
}

function findConnectionForShop(db, shopId) {
  return (
    (db.shopConnections || []).find(
      (c) =>
        c.shopId === shopId &&
        c.status !== "deleted" &&
        c.status !== "disconnected" &&
        c.credentialsEncrypted,
    ) || null
  );
}

function encryptCredentials(raw) {
  const text = typeof raw === "string" ? raw : JSON.stringify(raw);
  return Buffer.from(text, "utf8").toString("base64");
}

function decryptCredentials(encrypted) {
  if (!encrypted) return null;
  try {
    return Buffer.from(encrypted, "base64").toString("utf8");
  } catch {
    return null;
  }
}

export function sanitizeShopConnection(conn, { includeSecret = false } = {}) {
  if (!conn) return null;
  const base = {
    id: conn.id,
    orgId: conn.orgId,
    shopId: conn.shopId,
    platform: conn.platform,
    storeName: conn.storeName || "",
    status: conn.status || "disconnected",
    connectedByUserId: conn.connectedByUserId || null,
    connectedAt: conn.connectedAt || null,
    updatedAt: conn.updatedAt || null,
    lastSyncAt: conn.lastSyncAt || null,
    lastSyncStatus: conn.lastSyncStatus || "never",
    lastSyncError: conn.lastSyncError || null,
    lastSyncSummary: conn.lastSyncSummary || null,
    credentialsMasked: conn.credentialsMasked || null,
  };
  if (includeSecret) {
    base.apiToken = decryptCredentials(conn.credentialsEncrypted);
  }
  return base;
}

export function getShopConnectionSecret(shopId) {
  const db = readDb();
  const conn = findConnectionForShop(db, shopId);
  if (!conn?.credentialsEncrypted) return null;
  const apiToken = decryptCredentials(conn.credentialsEncrypted);
  if (!apiToken) return null;
  return {
    platform: conn.platform,
    storeName: conn.storeName,
    apiEndpoint: conn.apiEndpoint || "",
    apiToken,
  };
}

export function encodeEnterpriseShopOAuthState({ shopId, userId, platform = "" }) {
  const exp = Date.now() + 15 * 60 * 1000;
  const payload = JSON.stringify({ kind: "enterprise_shop", shopId, sub: userId, platform, exp });
  const b64 = Buffer.from(payload, "utf8").toString("base64url");
  const sig = crypto.createHmac("sha256", OAUTH_STATE_SECRET).update(b64).digest("base64url");
  return `${b64}.${sig}`;
}

export function decodeEnterpriseShopOAuthState(state) {
  const raw = String(state || "").trim();
  const dot = raw.indexOf(".");
  if (dot < 1) return null;
  const b64 = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  const expect = crypto.createHmac("sha256", OAUTH_STATE_SECRET).update(b64).digest("base64url");
  try {
    const a = Buffer.from(sig, "utf8");
    const b = Buffer.from(expect, "utf8");
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    const data = JSON.parse(Buffer.from(b64, "base64url").toString("utf8"));
    if (data?.kind !== "enterprise_shop" || !data.shopId || !data.sub) return null;
    if (typeof data.exp !== "number" || Date.now() > data.exp) return null;
    return { shopId: data.shopId, userId: data.sub, platform: data.platform || "" };
  } catch {
    return null;
  }
}

export function buildEnterpriseTiktokOAuthStartUrl(shopId, user) {
  return buildEnterprisePlatformOAuthStartUrl(shopId, user, "tiktok", buildTiktokAuthorizeUrl);
}

export function buildEnterpriseShopeeOAuthStartUrl(shopId, user) {
  return buildEnterprisePlatformOAuthStartUrl(shopId, user, "shopee", buildShopeeAuthorizeUrl);
}

export function buildEnterpriseLazadaOAuthStartUrl(shopId, user) {
  return buildEnterprisePlatformOAuthStartUrl(shopId, user, "lazada", buildLazadaAuthorizeUrl);
}

export function buildEnterpriseWalmartOAuthStartUrl(shopId, user) {
  return buildEnterprisePlatformOAuthStartUrl(shopId, user, "walmart", buildWalmartAuthorizeUrl);
}

function buildEnterprisePlatformOAuthStartUrl(shopId, user, expectedPlatform, buildAuthorizeUrl) {
  assertOwner(user);
  const db = readDb();
  const orgId = orgIdFor(user);
  const shop = findOrgShop(db, shopId, orgId);
  if (!shop) throw createError("店铺不存在。", 404);
  if (shop.platform !== expectedPlatform) {
    throw createError(`仅 ${PLATFORM_CATALOG[expectedPlatform]?.label || expectedPlatform} 店铺支持该 OAuth。`, 400);
  }
  const state = encodeEnterpriseShopOAuthState({ shopId, userId: user.id, platform: expectedPlatform });
  return buildAuthorizeUrl(state);
}

export function listEnterpriseMembers(user) {
  assertOwner(user);
  const db = readDb();
  const orgId = orgIdFor(user);
  return db.users
    .filter((u) => isEnterpriseUser(u) && u.accountType === "enterprise_member" && (u.orgId || orgId) === orgId)
    .map((u) => ({
      id: u.id,
      loginName: u.loginName,
      displayName: u.displayName || u.name || u.loginName,
      status: u.status || "active",
    }));
}

function grantsForShop(db, shopId) {
  return (db.memberShopGrants || []).filter((g) => g.shopId === shopId);
}

export function listAdminShops(user) {
  assertOwner(user);
  const db = readDb();
  const orgId = orgIdFor(user);
  db.shopConnections ||= [];
  db.shopCatalogItems ||= [];

  const shops = (db.orgShops || [])
    .filter((s) => s.orgId === orgId && s.status !== "deleted")
    .map((shop) => {
      const base = sanitizeOrgShop(shop);
      const conn = findConnectionForShop(db, shop.id);
      const grants = grantsForShop(db, shop.id);
      const members = grants.map((g) => {
        const member = db.users.find((u) => u.id === g.memberUserId);
        return {
          memberUserId: g.memberUserId,
          loginName: member?.loginName || g.memberUserId,
          displayName: member?.displayName || member?.name || member?.loginName || "—",
          agents: g.agents || [],
        };
      });
      return {
        ...base,
        connection: sanitizeShopConnection(conn),
        grantCount: grants.length,
        members,
      };
    });

  return { shops, members: listEnterpriseMembers(user) };
}

export function createOrgShop(user, body) {
  assertOwner(user);
  const db = readDb();
  db.orgShops ||= [];
  const orgId = orgIdFor(user);
  const platform = normalizePlatform(body.platform);
  if (!PLATFORM_CATALOG[platform]) {
    throw createError("不支持的平台。", 400);
  }
  const market = String(body.market || "").trim().toUpperCase();
  if (!market) throw createError("请填写站点/市场。", 400);
  const shopName = String(body.shopName || "").trim();
  if (!shopName) throw createError("请填写店铺名称。", 400);

  const platformMeta = PLATFORM_CATALOG[platform];
  const now = new Date().toISOString();
  const shop = {
    id: `shop_${crypto.randomUUID()}`,
    orgId,
    platform,
    market,
    regionGroup: body.regionGroup || platformMeta.regionGroup || "sea",
    shopName,
    externalShopId: String(body.externalShopId || "").trim() || `${platform}_${market}_${Date.now()}`,
    status: "active",
    createdAt: now,
    updatedAt: now,
  };
  db.orgShops.push(shop);
  writeDb(db);
  return sanitizeOrgShop(shop);
}

export function saveShopApiConnection(user, shopId, config = {}) {
  assertOwner(user);
  const db = readDb();
  db.shopConnections ||= [];
  const orgId = orgIdFor(user);
  const shop = findOrgShop(db, shopId, orgId);
  if (!shop) throw createError("店铺不存在。", 404);

  let incomingToken = String(config.apiToken || "").trim();
  const clientId = String(config.clientId || "").trim();
  const apiKey = String(config.apiKey || "").trim();

  if (shop.platform === "ozon" && clientId && apiKey) {
    incomingToken = buildOzonConnectionTokenJson(clientId, apiKey);
  }

  if (!incomingToken) throw createError("请填写 API 凭证。", 400);

  const existing = findConnectionForShop(db, shopId);
  const now = new Date().toISOString();
  const connection = {
    id: existing?.id || `conn_${crypto.randomUUID()}`,
    orgId,
    shopId,
    platform: shop.platform,
    storeName: String(config.storeName || shop.shopName).slice(0, 120),
    apiEndpoint: String(config.apiEndpoint || "").trim(),
    credentialsEncrypted: encryptCredentials(incomingToken),
    credentialsMasked: maskSecret(incomingToken),
    status: "connected",
    connectedByUserId: user.id,
    connectedAt: existing?.connectedAt || now,
    updatedAt: now,
    lastSyncAt: existing?.lastSyncAt || null,
    lastSyncStatus: existing?.lastSyncStatus || "never",
    lastSyncError: null,
    lastSyncSummary: existing?.lastSyncSummary || null,
  };

  if (existing) {
    Object.assign(existing, connection);
  } else {
    db.shopConnections.push(connection);
  }
  writeDb(db);
  return sanitizeShopConnection(connection);
}

export async function completeEnterpriseTiktokOAuth({ shopId, userId, authCode, shopCipherHint = "" }) {
  const db = readDb();
  let shop = null;
  for (const orgId of new Set([ENTERPRISE_ORG_ID, ...(db.orgShops || []).map((s) => s.orgId).filter(Boolean)])) {
    shop = findOrgShop(db, shopId, orgId);
    if (shop) break;
  }
  if (!shop) throw createError("店铺不存在。", 404);
  if (shop.platform !== "tiktok") throw createError("店铺平台不是 TikTok。", 400);

  const admin = db.users.find((u) => u.id === userId);
  if (!admin || !isOwner(admin)) throw createError("授权用户无效。", 403);

  const exchanged = await exchangeTiktokAuthCodeForToken(String(authCode).trim());
  if (!exchanged.ok) throw createError(exchanged.error || "换票失败。", 400);

  const tokenData = exchanged.data;
  const shopsResult = await fetchTiktokAuthorizedShops(tokenData.access_token);
  let shopCipher = String(shopCipherHint || "").trim();
  let shopMeta = {};

  if (shopsResult.ok && shopsResult.shops?.length) {
    const matched =
      shopsResult.shops.find((s) => shop.externalShopId && String(s.id) === String(shop.externalShopId)) ||
      shopsResult.shops[0];
    shopCipher = shopCipher || String(matched.cipher).trim();
    shopMeta = { id: matched.id, name: matched.name };
  }

  if (!shopCipher) {
    throw createError(shopsResult.error || "无法获取 shop_cipher。", 400);
  }

  const storeName = String(shopMeta.name || tokenData.seller_name || shop.shopName).slice(0, 120);
  const apiToken = buildTiktokConnectionTokenJson(tokenData, shopCipher, shopMeta);

  if (shopMeta.id && !shop.externalShopId) {
    shop.externalShopId = String(shopMeta.id);
    shop.updatedAt = new Date().toISOString();
  }

  const conn = saveShopApiConnection(admin, shopId, {
    apiToken,
    storeName,
    apiEndpoint: "",
  });

  writeDb(db);
  return { shop: sanitizeOrgShop(shop), connection: conn };
}

async function findEnterpriseShopForOAuth(shopId) {
  const db = readDb();
  let shop = null;
  for (const orgId of new Set([ENTERPRISE_ORG_ID, ...(db.orgShops || []).map((s) => s.orgId).filter(Boolean)])) {
    shop = findOrgShop(db, shopId, orgId);
    if (shop) break;
  }
  return { db, shop };
}

function assertOAuthAdmin(db, userId) {
  const admin = db.users.find((u) => u.id === userId);
  if (!admin || !isOwner(admin)) throw createError("授权用户无效。", 403);
  return admin;
}

export async function completeEnterpriseShopeeOAuth({ shopId, userId, authCode, shopIdHint = "" }) {
  const { db, shop } = await findEnterpriseShopForOAuth(shopId);
  if (!shop) throw createError("店铺不存在。", 404);
  if (shop.platform !== "shopee") throw createError("店铺平台不是 Shopee。", 400);

  const admin = assertOAuthAdmin(db, userId);
  const platformShopId = shopIdHint || shop.externalShopId;
  if (!platformShopId) throw createError("缺少 shop_id，请从 OAuth 回调确认或预先填写平台店铺 ID。", 400);

  const exchanged = await exchangeShopeeAuthCode(authCode, platformShopId);
  if (!exchanged.ok) throw createError(exchanged.error || "换票失败。", 400);

  const tokenData = exchanged.data;
  const apiToken = buildShopeeConnectionTokenJson(tokenData, platformShopId);
  const storeName = String(shop.shopName).slice(0, 120);

  if (tokenData.shop_id && !shop.externalShopId) {
    shop.externalShopId = String(tokenData.shop_id);
    shop.updatedAt = new Date().toISOString();
  }

  const conn = saveShopApiConnection(admin, shopId, { apiToken, storeName, apiEndpoint: "" });
  writeDb(db);
  return { shop: sanitizeOrgShop(shop), connection: conn };
}

export async function completeEnterpriseLazadaOAuth({ shopId, userId, authCode }) {
  const { db, shop } = await findEnterpriseShopForOAuth(shopId);
  if (!shop) throw createError("店铺不存在。", 404);
  if (shop.platform !== "lazada") throw createError("店铺平台不是 Lazada。", 400);

  const admin = assertOAuthAdmin(db, userId);
  const exchanged = await exchangeLazadaAuthCode(authCode, shop.market || "SG");
  if (!exchanged.ok) throw createError(exchanged.error || "换票失败。", 400);

  const tokenData = exchanged.data;
  const apiToken = buildLazadaConnectionTokenJson(tokenData, shop.market || tokenData.country || "SG");
  const storeName = String(tokenData.account || shop.shopName).slice(0, 120);

  const conn = saveShopApiConnection(admin, shopId, {
    apiToken,
    storeName,
    apiEndpoint: shop.market || tokenData.country || "",
  });
  writeDb(db);
  return { shop: sanitizeOrgShop(shop), connection: conn };
}

export async function completeEnterpriseWalmartOAuth({ shopId, userId, authCode }) {
  const { db, shop } = await findEnterpriseShopForOAuth(shopId);
  if (!shop) throw createError("店铺不存在。", 404);
  if (shop.platform !== "walmart") throw createError("店铺平台不是 Walmart。", 400);

  const admin = assertOAuthAdmin(db, userId);
  const exchanged = await exchangeWalmartAuthCode(authCode);
  if (!exchanged.ok) throw createError(exchanged.error || "换票失败。", 400);

  const tokenData = exchanged.data;
  const apiToken = buildWalmartConnectionTokenJson(tokenData);
  const storeName = String(shop.shopName).slice(0, 120);

  const conn = saveShopApiConnection(admin, shopId, { apiToken, storeName, apiEndpoint: "" });
  writeDb(db);
  return { shop: sanitizeOrgShop(shop), connection: conn };
}

export function getPlatformBindHint(platform) {
  const meta = PLATFORM_CATALOG[normalizePlatform(platform)] || {};
  if (meta.authMode === "api_key") {
    return "在 Ozon Seller 后台创建 Client-Id 与 Api-Key，粘贴到绑定表单。";
  }
  if (platformUsesOAuth(platform)) {
    return `点击「${meta.label || platform} 授权」完成 OAuth，或手动粘贴 OAuth JSON。`;
  }
  return "粘贴平台 API 凭证 JSON。";
}

export function disconnectShopConnection(user, shopId) {
  assertOwner(user);
  const db = readDb();
  const orgId = orgIdFor(user);
  if (!findOrgShop(db, shopId, orgId)) throw createError("店铺不存在。", 404);

  const conn = findConnectionForShop(db, shopId);
  if (!conn) return { ok: true };

  conn.status = "disconnected";
  conn.credentialsEncrypted = "";
  conn.credentialsMasked = "";
  conn.updatedAt = new Date().toISOString();
  conn.lastSyncStatus = "never";
  conn.lastSyncError = null;
  writeDb(db);
  return { ok: true };
}

export function setShopMemberGrants(user, shopId, { memberUserIds = [], agents = null } = {}) {
  assertOwner(user);
  const db = readDb();
  const orgId = orgIdFor(user);
  if (!findOrgShop(db, shopId, orgId)) throw createError("店铺不存在。", 404);

  db.memberShopGrants ||= [];
  const allowedIds = new Set(
    memberUserIds.filter((id) =>
      db.users.some(
        (u) =>
          u.id === id &&
          isEnterpriseUser(u) &&
          u.accountType === "enterprise_member" &&
          (u.orgId || orgId) === orgId,
      ),
    ),
  );

  db.memberShopGrants = db.memberShopGrants.filter((g) => g.shopId !== shopId);
  const now = new Date().toISOString();
  const defaultAgents = agents || ["listing", "content", "service", "growth", "profit"];
  for (const memberUserId of allowedIds) {
    db.memberShopGrants.push({
      id: `grant_${crypto.randomUUID()}`,
      orgId,
      memberUserId,
      shopId,
      agents: defaultAgents,
      createdAt: now,
    });
  }
  writeDb(db);
  return grantsForShop(db, shopId).map((g) => {
    const member = db.users.find((u) => u.id === g.memberUserId);
    return {
      memberUserId: g.memberUserId,
      loginName: member?.loginName,
      displayName: member?.displayName || member?.name,
      agents: g.agents,
    };
  });
}

export async function syncEnterpriseShopData(user, shopId) {
  const db = readDb();
  const orgId = orgIdFor(user);
  const shop = findOrgShop(db, shopId, orgId);
  if (!shop) throw createError("店铺不存在。", 404);

  if (!isOwner(user)) {
    const grant = (db.memberShopGrants || []).find(
      (g) => g.memberUserId === user.id && g.shopId === shopId,
    );
    if (!grant) throw createError("无权同步该店铺。", 403);
  }

  const conn = findConnectionForShop(db, shopId);
  if (!conn || conn.status !== "connected" || !conn.credentialsEncrypted) {
    throw createError("店铺尚未绑定 API，请联系管理员在控制台完成授权。", 400);
  }

  const secret = getShopConnectionSecret(shopId);
  const snap = await fetchStoreSnapshot(secret);
  const now = new Date().toISOString();

  if (!snap.ok) {
    conn.lastSyncAt = now;
    conn.lastSyncStatus = "error";
    conn.lastSyncError = snap.error || "同步失败";
    conn.updatedAt = now;
    writeDb(db);
    throw createError(snap.error || "同步失败。", 502);
  }

  const ordersSample = snap.data?.orders_sample || [];
  const productsSample = snap.data?.products_sample || [];

  db.shopCatalogItems ||= [];
  db.shopCatalogItems = db.shopCatalogItems.filter((item) => item.shopId !== shopId);

  for (const [idx, p] of productsSample.entries()) {
    db.shopCatalogItems.push({
      id: `prod_${crypto.randomUUID()}`,
      orgId,
      shopId,
      externalProductId: String(p.id || p.product_id || idx),
      title: String(p.title || p.name || `商品 ${idx + 1}`).slice(0, 500),
      sku: String(p.sku || "").slice(0, 120),
      status: p.status || "active",
      raw: p,
      syncedAt: now,
    });
  }

  conn.lastSyncAt = now;
  conn.lastSyncStatus = "ok";
  conn.lastSyncError = null;
  conn.lastSyncSummary = {
    orderSampleCount: ordersSample.length,
    productCount: productsSample.length,
    platform: snap.platform || shop.platform,
    pulledAt: snap.pulledAt || now,
  };
  conn.updatedAt = now;
  writeDb(db);

  return {
    ok: true,
    shop: sanitizeOrgShop(shop),
    connection: sanitizeShopConnection(conn),
    snapshot: {
      ordersSample,
      productCount: productsSample.length,
    },
  };
}

export function getShopDataStatus(user, shopId) {
  const shop = getOrgShopById(shopId, user);
  const db = readDb();
  const conn = findConnectionForShop(db, shopId);
  return {
    shop,
    connection: sanitizeShopConnection(conn),
    productCount: (db.shopCatalogItems || []).filter((p) => p.shopId === shopId).length,
  };
}

export function listShopCatalogProducts(user, shopId) {
  getShopDataStatus(user, shopId);
  const db = readDb();
  return (db.shopCatalogItems || [])
    .filter((p) => p.shopId === shopId)
    .map((p) => ({
      id: p.id,
      externalProductId: p.externalProductId,
      title: p.title,
      sku: p.sku,
      status: p.status,
      syncedAt: p.syncedAt,
    }));
}

export function enrichShopWithConnection(shop, db) {
  const conn = findConnectionForShop(db, shop.id);
  return {
    ...shop,
    connectionStatus: conn?.status === "connected" ? "connected" : "disconnected",
    lastSyncAt: conn?.lastSyncAt || null,
    lastSyncStatus: conn?.lastSyncStatus || "never",
  };
}
