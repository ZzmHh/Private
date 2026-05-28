import crypto from "node:crypto";
import { readDb, writeDb } from "./repositories/index.js";
import { createError } from "./lib/errors.js";
import { isEnterpriseUser } from "./enterpriseAuth.js";

export const ENTERPRISE_ORG_ID = process.env.ENTERPRISE_ORG_ID || "org_default";

export const PLATFORM_CATALOG = {
  shopee: { label: "Shopee", regionGroup: "sea", color: "#EE4D2D", authMode: "oauth_sign" },
  tiktok: { label: "TikTok Shop", regionGroup: "sea", color: "#18181B", authMode: "oauth_sign" },
  lazada: { label: "Lazada", regionGroup: "sea", color: "#0F146D", authMode: "oauth_sign" },
  ozon: { label: "Ozon", regionGroup: "other", color: "#005BFF", authMode: "api_key" },
  walmart: { label: "Walmart", regionGroup: "other", color: "#0071CE", authMode: "oauth" },
};

export const MARKET_LABELS = {
  SG: "新加坡",
  MY: "马来西亚",
  TH: "泰国",
  ID: "印尼",
  VN: "越南",
  PH: "菲律宾",
  RU: "俄罗斯",
  US: "美国",
};

const DEMO_SHOPS = [
  { platform: "shopee", market: "TH", shopName: "Shopee 泰国 · 曼谷主店", externalShopId: "shopee_th_001" },
  { platform: "tiktok", market: "TH", shopName: "TikTok Shop 泰国 · 直播店", externalShopId: "tiktok_th_001" },
  { platform: "lazada", market: "MY", shopName: "Lazada 马来 · 旗舰店", externalShopId: "lazada_my_001" },
  { platform: "shopee", market: "SG", shopName: "Shopee 新加坡 · 主店", externalShopId: "shopee_sg_001" },
  { platform: "tiktok", market: "VN", shopName: "TikTok Shop 越南 · 二店", externalShopId: "tiktok_vn_001" },
  { platform: "lazada", market: "ID", shopName: "Lazada 印尼 · 雅加达店", externalShopId: "lazada_id_001" },
  { platform: "ozon", market: "RU", shopName: "Ozon 俄罗斯 · 跨境店", externalShopId: "ozon_ru_001", regionGroup: "other" },
  { platform: "walmart", market: "US", shopName: "Walmart US · 主店", externalShopId: "walmart_us_001", regionGroup: "other" },
];

function isOwner(user) {
  return user?.accountType === "enterprise_owner" || user?.enterpriseRole === "owner";
}

export function sanitizeOrgShop(shop) {
  if (!shop) return null;
  const platformMeta = PLATFORM_CATALOG[shop.platform] || {};
  return {
    id: shop.id,
    orgId: shop.orgId,
    platform: shop.platform,
    platformLabel: platformMeta.label || shop.platform,
    platformColor: platformMeta.color || null,
    market: shop.market,
    marketLabel: MARKET_LABELS[shop.market] || shop.market,
    regionGroup: shop.regionGroup || platformMeta.regionGroup || "sea",
    shopName: shop.shopName,
    externalShopId: shop.externalShopId,
    status: shop.status || "active",
  };
}

function listGrantsForMember(db, memberUserId) {
  return (db.memberShopGrants || []).filter((g) => g.memberUserId === memberUserId);
}

function listShopsForOrg(db, orgId) {
  return (db.orgShops || []).filter((s) => s.orgId === orgId && s.status !== "deleted");
}

export function getAccessibleShops(user) {
  const db = readDb();
  const orgId = user.orgId || ENTERPRISE_ORG_ID;
  const shops = listShopsForOrg(db, orgId).map(sanitizeOrgShop).filter(Boolean);

  if (isOwner(user)) return shops;

  const grantShopIds = new Set(listGrantsForMember(db, user.id).map((g) => g.shopId));
  return shops.filter((shop) => grantShopIds.has(shop.id));
}

export function getOrgShopById(shopId, user) {
  const shop = getAccessibleShops(user).find((s) => s.id === shopId);
  if (!shop) throw createError("店铺不存在或无权访问。", 403);
  return shop;
}

export function ensureEnterpriseOrgShopsSeed() {
  const db = readDb();
  db.orgShops ||= [];
  db.memberShopGrants ||= [];

  const orgId = ENTERPRISE_ORG_ID;

  for (const user of db.users.filter((u) => isEnterpriseUser(u))) {
    if (!user.orgId) user.orgId = orgId;
  }

  const hasShops = db.orgShops.some((s) => s.orgId === orgId);
  if (!hasShops) {
    const now = new Date().toISOString();
    const createdShops = DEMO_SHOPS.map((item) => {
      const platformMeta = PLATFORM_CATALOG[item.platform] || {};
      return {
        id: `shop_${crypto.randomUUID()}`,
        orgId,
        platform: item.platform,
        market: item.market,
        regionGroup: item.regionGroup || platformMeta.regionGroup || "sea",
        shopName: item.shopName,
        externalShopId: item.externalShopId,
        status: "active",
        createdAt: now,
        updatedAt: now,
      };
    });

    db.orgShops.push(...createdShops);

    const member = db.users.find(
      (u) => isEnterpriseUser(u) && u.accountType === "enterprise_member",
    );
    if (member) {
      if (!member.orgId) member.orgId = orgId;
      const memberShops = createdShops.filter((s) => s.regionGroup === "sea").slice(0, 3);
      for (const shop of memberShops) {
        db.memberShopGrants.push({
          id: `grant_${crypto.randomUUID()}`,
          orgId,
          memberUserId: member.id,
          shopId: shop.id,
          agents: ["listing", "content", "service", "growth"],
          createdAt: now,
        });
      }
    }
  } else {
    const member = db.users.find(
      (u) => isEnterpriseUser(u) && u.accountType === "enterprise_member",
    );
    if (member) {
      if (!member.orgId) member.orgId = orgId;
      const hasGrants = db.memberShopGrants.some(
        (g) => g.orgId === orgId && g.memberUserId === member.id,
      );
      if (!hasGrants) {
        const now = new Date().toISOString();
        const seaShops = db.orgShops
          .filter((s) => s.orgId === orgId && s.regionGroup !== "other")
          .slice(0, 3);
        for (const shop of seaShops) {
          db.memberShopGrants.push({
            id: `grant_${crypto.randomUUID()}`,
            orgId,
            memberUserId: member.id,
            shopId: shop.id,
            agents: ["listing", "content", "service", "growth"],
            createdAt: now,
          });
        }
      }
    }
  }

  writeDb(db);
}

function groupShopsIntoScopeTree(shops) {
  const db = readDb();
  const platformMap = new Map();

  for (const shop of shops) {
    const conn = (db.shopConnections || []).find(
      (c) => c.shopId === shop.id && c.status === "connected" && c.credentialsEncrypted,
    );
    if (!platformMap.has(shop.platform)) {
      const meta = PLATFORM_CATALOG[shop.platform] || {};
      platformMap.set(shop.platform, {
        id: shop.platform,
        label: meta.label || shop.platform,
        regionGroup: meta.regionGroup || shop.regionGroup,
        color: meta.color || null,
        markets: new Map(),
      });
    }
    const platformNode = platformMap.get(shop.platform);
    if (!platformNode.markets.has(shop.market)) {
      platformNode.markets.set(shop.market, {
        id: shop.market,
        label: shop.marketLabel,
        shops: [],
      });
    }
    platformNode.markets.get(shop.market).shops.push({
      id: shop.id,
      name: shop.shopName,
      status: shop.status,
      connectionStatus: conn ? "connected" : "disconnected",
      lastSyncAt: conn?.lastSyncAt || null,
      lastSyncStatus: conn?.lastSyncStatus || "never",
    });
  }

  const seaPlatforms = [];
  const otherPlatforms = [];

  for (const platform of platformMap.values()) {
    const node = {
      ...platform,
      markets: [...platform.markets.values()],
    };
    if (node.regionGroup === "other") otherPlatforms.push(node);
    else seaPlatforms.push(node);
  }

  const sortFn = (a, b) => a.label.localeCompare(b.label, "zh-CN");
  seaPlatforms.sort(sortFn);
  otherPlatforms.sort(sortFn);

  return { seaPlatforms, otherPlatforms, platforms: [...seaPlatforms, ...otherPlatforms] };
}

export function buildScopeOptions(user, mode = "workbench") {
  ensureEnterpriseOrgShopsSeed();
  const shops = getAccessibleShops(user);
  const { seaPlatforms, otherPlatforms, platforms } = groupShopsIntoScopeTree(shops);

  const defaultShop = shops[0] || null;
  const defaultScope = defaultShop
    ? {
        platform: defaultShop.platform,
        market: defaultShop.market,
        shopId: defaultShop.id,
        shopName: defaultShop.shopName,
      }
    : null;

  const consoleViews = [
    { id: "all", label: "全部店铺" },
    { id: "sea", label: "东南亚汇总" },
    ...platforms.map((p) => ({ id: `platform:${p.id}`, label: p.label, platform: p.id })),
  ];

  if (mode === "console" && isOwner(user)) {
    return {
      mode: "console",
      shopCount: shops.length,
      seaPlatforms,
      otherPlatforms,
      platforms,
      consoleViews,
      defaultConsoleView: "all",
      defaultScope,
    };
  }

  return {
    mode: "workbench",
    shopCount: shops.length,
    seaPlatforms,
    otherPlatforms,
    platforms,
    defaultScope,
  };
}

export function resolveWorkbenchScope(user, { platform, market, shopId } = {}) {
  const shops = getAccessibleShops(user);
  if (!shops.length) {
    return { valid: false, scope: null, shops: [] };
  }

  let shop = null;
  if (shopId) {
    shop = shops.find((s) => s.id === shopId) || null;
  }
  if (!shop && platform && market) {
    shop = shops.find((s) => s.platform === platform && s.market === market) || null;
  }
  if (!shop) shop = shops[0];

  return {
    valid: true,
    scope: {
      platform: shop.platform,
      market: shop.market,
      shopId: shop.id,
      shopName: shop.shopName,
      platformLabel: shop.platformLabel,
      marketLabel: shop.marketLabel,
    },
    shops,
  };
}
