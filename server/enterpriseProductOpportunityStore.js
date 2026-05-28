import crypto from "node:crypto";
import { readDb, writeDb } from "./repositories/index.js";

const MAX_OPPORTUNITIES_PER_ORG = 800;

function clamp(n, min = 0, max = 100) {
  const v = Number(n);
  if (!Number.isFinite(v)) return min;
  return Math.max(min, Math.min(max, Math.round(v)));
}

function text(value, max = 500) {
  return String(value || "").trim().slice(0, max);
}

function numberOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizePlatform(value, fallback = "manual") {
  return text(value || fallback, 32).toLowerCase();
}

function normalizeImages(images) {
  return Array.isArray(images) ? images.map(String).filter(Boolean).slice(0, 12) : [];
}

function scoreSupply(candidate) {
  const supply = candidate.supply || {};
  let score = 35;
  if (candidate.sourcePlatform === "1688") score += 22;
  if (candidate.sourceUrl) score += 8;
  if (candidate.image || candidate.images?.length) score += 8;
  if (supply.priceCny != null || candidate.price?.amount != null) score += 10;
  if (supply.moq != null && Number(supply.moq) <= 10) score += 7;
  if (supply.shipFrom) score += 4;
  return clamp(score);
}

function scoreMargin(candidate, assumptions = {}) {
  const supplyPrice = Number(candidate.supply?.priceCny ?? candidate.price?.amount);
  const suggested = Number(assumptions.targetSalePriceCny ?? candidate.assumptions?.targetSalePriceCny);
  if (!Number.isFinite(supplyPrice) || supplyPrice <= 0) return 45;
  if (!Number.isFinite(suggested) || suggested <= 0) {
    if (supplyPrice <= 20) return 72;
    if (supplyPrice <= 60) return 62;
    return 52;
  }
  const gross = (suggested - supplyPrice) / suggested;
  return clamp(gross * 160);
}

function scoreTrend(candidate) {
  const signal = candidate.trendSignals || {};
  const explicit = numberOrNull(signal.trendScore ?? signal.score ?? candidate.trendScore);
  if (explicit != null) return clamp(explicit);
  let score = 42;
  const heat = Number(signal.heat ?? signal.views ?? signal.salesRankSignal);
  if (Number.isFinite(heat)) score += Math.min(35, Math.log10(Math.max(heat, 1)) * 9);
  if (["tiktok", "tiktok_shop", "shopee", "lazada", "amazon", "temu", "aliexpress"].includes(candidate.sourcePlatform)) {
    score += 14;
  }
  if (candidate.keyword) score += 5;
  return clamp(score);
}

function scoreShopFit(candidate) {
  const signal = candidate.shopSignals || {};
  const explicit = numberOrNull(signal.shopFitScore ?? signal.score);
  if (explicit != null) return clamp(explicit);
  let score = 48;
  const sales = Number(signal.sales30d ?? signal.orders30d);
  const conversion = Number(signal.conversionRate);
  if (Number.isFinite(sales) && sales > 0) score += Math.min(25, Math.log10(sales + 1) * 10);
  if (Number.isFinite(conversion) && conversion > 0) score += Math.min(15, conversion * 100);
  if (signal.platform === candidate.targetPlatform) score += 6;
  return clamp(score);
}

function scoreRisk(candidate) {
  let score = 30;
  const title = `${candidate.title} ${candidate.category || ""}`.toLowerCase();
  if (/battery|电池|充电|cosmetic|化妆|食品|food|儿童|kids|baby|medical|药/.test(title)) score += 28;
  if (!candidate.sourceUrl) score += 8;
  if (!candidate.supply?.priceCny && candidate.sourcePlatform === "1688") score += 8;
  if (candidate.competitionSignals?.competitionScore != null) {
    score += Number(candidate.competitionSignals.competitionScore) * 0.25;
  }
  return clamp(score);
}

export function scoreProductOpportunity(candidate, assumptions = {}) {
  const supplyScore = scoreSupply(candidate);
  const marginScore = scoreMargin(candidate, assumptions);
  const trendScore = scoreTrend(candidate);
  const shopFitScore = scoreShopFit(candidate);
  const riskScore = scoreRisk(candidate);
  const overall = clamp(
    trendScore * 0.28 +
      supplyScore * 0.24 +
      marginScore * 0.22 +
      shopFitScore * 0.16 +
      (100 - riskScore) * 0.1,
  );
  return {
    overall,
    trend: trendScore,
    supply: supplyScore,
    margin: marginScore,
    shopFit: shopFitScore,
    risk: riskScore,
  };
}

function normalizeOpportunityPayload(orgId, payload = {}, userId = "") {
  const now = new Date().toISOString();
  const sourcePlatform = normalizePlatform(payload.sourcePlatform || payload.platform || payload.source);
  const targetPlatform = normalizePlatform(payload.targetPlatform || payload.target || "tiktok");
  const market = text(payload.market || "TH", 16).toUpperCase();
  const supply = payload.supply && typeof payload.supply === "object" ? { ...payload.supply } : {};
  if (payload.priceCny != null && supply.priceCny == null) supply.priceCny = numberOrNull(payload.priceCny);
  if (payload.moq != null && supply.moq == null) supply.moq = numberOrNull(payload.moq);
  if (payload.shipFrom && !supply.shipFrom) supply.shipFrom = text(payload.shipFrom, 200);

  const images = normalizeImages(payload.images);
  const candidate = {
    id: text(payload.id, 120) || `opp_${crypto.randomUUID()}`,
    orgId,
    sourcePlatform,
    sourceType: text(payload.sourceType || "manual", 40),
    sourceId: text(payload.sourceId, 120) || null,
    sourceUrl: text(payload.sourceUrl || payload.url, 2000),
    title: text(payload.title || payload.name || "未命名选品", 500),
    category: text(payload.category || payload.categoryHint, 200),
    keyword: text(payload.keyword, 120),
    targetPlatform,
    market,
    price: payload.price && typeof payload.price === "object" ? payload.price : null,
    supply,
    image: text(payload.image || images[0], 2000),
    images,
    trendSignals: payload.trendSignals && typeof payload.trendSignals === "object" ? payload.trendSignals : {},
    shopSignals: payload.shopSignals && typeof payload.shopSignals === "object" ? payload.shopSignals : {},
    competitionSignals:
      payload.competitionSignals && typeof payload.competitionSignals === "object" ? payload.competitionSignals : {},
    assumptions: payload.assumptions && typeof payload.assumptions === "object" ? payload.assumptions : {},
    recommendation: text(payload.recommendation || payload.notes, 2000),
    raw: payload.raw && typeof payload.raw === "object" ? payload.raw : {},
    status: text(payload.status || "candidate", 40),
    createdByUserId: userId || payload.createdByUserId || null,
    createdAt: payload.createdAt || now,
    updatedAt: now,
  };
  candidate.score = scoreProductOpportunity(candidate);
  candidate.reasons = buildReasons(candidate);
  return candidate;
}

function buildReasons(candidate) {
  const reasons = [];
  if (candidate.sourcePlatform === "1688") reasons.push("已有 1688 货源，可继续核算采购价与上架素材。");
  if (candidate.score?.trend >= 70) reasons.push("趋势信号较强，适合优先验证搜索/内容热度。");
  if (candidate.score?.margin >= 70) reasons.push("毛利空间初步较好，可进入测款池。");
  if (candidate.score?.risk >= 65) reasons.push("合规或履约风险偏高，上架前需要人工复核。");
  if (!reasons.length) reasons.push("数据已入选品池，建议补充榜单热度、竞品价格和真实店铺销售数据。");
  return reasons;
}

function upsertOpportunityInDb(db, orgId, payload, userId = "") {
  db.enterpriseProductOpportunities ||= [];
  const next = normalizeOpportunityPayload(orgId, payload, userId);
  const idx = db.enterpriseProductOpportunities.findIndex(
    (item) =>
      item.orgId === orgId &&
      ((next.sourceId && item.sourceId === next.sourceId && item.sourcePlatform === next.sourcePlatform) ||
        (next.sourceUrl && item.sourceUrl === next.sourceUrl)),
  );
  if (idx >= 0) {
    const prev = db.enterpriseProductOpportunities[idx];
    db.enterpriseProductOpportunities[idx] = {
      ...prev,
      ...next,
      id: prev.id,
      createdAt: prev.createdAt,
      createdByUserId: prev.createdByUserId || next.createdByUserId,
    };
    return db.enterpriseProductOpportunities[idx];
  }
  db.enterpriseProductOpportunities.unshift(next);
  return next;
}

export function listProductOpportunities(orgId, opts = {}) {
  const limit = Math.min(Number(opts.limit) || 80, 200);
  let items = (readDb().enterpriseProductOpportunities || []).filter((item) => item.orgId === orgId);
  if (opts.targetPlatform) items = items.filter((item) => item.targetPlatform === normalizePlatform(opts.targetPlatform));
  if (opts.market) items = items.filter((item) => item.market === text(opts.market, 16).toUpperCase());
  if (opts.sourcePlatform) items = items.filter((item) => item.sourcePlatform === normalizePlatform(opts.sourcePlatform));
  if (opts.status) items = items.filter((item) => item.status === opts.status);
  return items
    .sort((a, b) => Number(b.score?.overall || 0) - Number(a.score?.overall || 0))
    .slice(0, limit);
}

export function getProductOpportunity(orgId, id) {
  return (readDb().enterpriseProductOpportunities || []).find((item) => item.orgId === orgId && item.id === id) || null;
}

export function upsertProductOpportunity(orgId, payload, userId = "") {
  const db = readDb();
  const item = upsertOpportunityInDb(db, orgId, payload, userId);
  const mine = db.enterpriseProductOpportunities
    .filter((i) => i.orgId === orgId)
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
    .slice(0, MAX_OPPORTUNITIES_PER_ORG);
  const others = db.enterpriseProductOpportunities.filter((i) => i.orgId !== orgId);
  db.enterpriseProductOpportunities = [...mine, ...others];
  writeDb(db);
  return item;
}

export function updateProductOpportunityScore(orgId, id, patch = {}) {
  const db = readDb();
  db.enterpriseProductOpportunities ||= [];
  const idx = db.enterpriseProductOpportunities.findIndex((item) => item.orgId === orgId && item.id === id);
  if (idx < 0) return null;
  const prev = db.enterpriseProductOpportunities[idx];
  const next = {
    ...prev,
    assumptions: {
      ...(prev.assumptions || {}),
      ...(patch.assumptions && typeof patch.assumptions === "object" ? patch.assumptions : {}),
    },
    trendSignals: {
      ...(prev.trendSignals || {}),
      ...(patch.trendSignals && typeof patch.trendSignals === "object" ? patch.trendSignals : {}),
    },
    shopSignals: {
      ...(prev.shopSignals || {}),
      ...(patch.shopSignals && typeof patch.shopSignals === "object" ? patch.shopSignals : {}),
    },
    competitionSignals: {
      ...(prev.competitionSignals || {}),
      ...(patch.competitionSignals && typeof patch.competitionSignals === "object" ? patch.competitionSignals : {}),
    },
    status: patch.status ? text(patch.status, 40) : prev.status,
    updatedAt: new Date().toISOString(),
  };
  next.score = scoreProductOpportunity(next, next.assumptions);
  next.reasons = buildReasons(next);
  db.enterpriseProductOpportunities[idx] = next;
  writeDb(db);
  return next;
}

function opportunityFromCollectItem(item, defaults = {}) {
  return {
    sourcePlatform: item.sourcePlatform || "1688",
    sourceType: "collect_item",
    sourceId: item.id,
    sourceUrl: item.sourceUrl,
    title: item.title,
    category: item.listing?.categoryHint || "",
    targetPlatform: item.targetPlatform || defaults.targetPlatform || "tiktok",
    market: item.market || defaults.market || "TH",
    priceCny: item.priceCny,
    moq: item.moq,
    shipFrom: item.shipFrom,
    images: item.images,
    supply: {
      priceCny: item.priceCny,
      moq: item.moq,
      shipFrom: item.shipFrom,
    },
    recommendation: item.opportunityNotes || "来自采集箱，可继续做利润核算、Listing 和发布。",
    raw: { collectItemId: item.id },
  };
}

function opportunityFromShopCatalogItem(item, defaults = {}) {
  const sales30d = Number(item.sales30d ?? item.orders30d ?? item.metrics?.sales30d);
  return {
    sourcePlatform: item.platform || defaults.targetPlatform || "shop",
    sourceType: "owned_shop",
    sourceId: item.id,
    sourceUrl: item.url || item.productUrl || "",
    title: item.title || item.name || item.sku || "店铺商品",
    category: item.category || "",
    targetPlatform: item.platform || defaults.targetPlatform || "tiktok",
    market: item.market || defaults.market || "TH",
    image: item.image || item.mainImage || "",
    shopSignals: {
      platform: item.platform || defaults.targetPlatform,
      sales30d: Number.isFinite(sales30d) ? sales30d : undefined,
      conversionRate: item.conversionRate ?? item.metrics?.conversionRate,
    },
    recommendation: "来自自有店铺数据，可用来反推相似品机会和目标市场适配度。",
    raw: { shopCatalogItemId: item.id, shopId: item.shopId },
  };
}

export function refreshProductOpportunitiesFromSources(orgId, defaults = {}, userId = "") {
  const db = readDb();
  db.enterpriseProductOpportunities ||= [];
  let imported = 0;

  for (const item of db.enterpriseCollectItems || []) {
    if (item.orgId !== orgId) continue;
    upsertOpportunityInDb(db, orgId, opportunityFromCollectItem(item, defaults), userId);
    imported += 1;
  }

  for (const item of db.shopCatalogItems || []) {
    if (item.orgId !== orgId) continue;
    upsertOpportunityInDb(db, orgId, opportunityFromShopCatalogItem(item, defaults), userId);
    imported += 1;
  }

  const mine = db.enterpriseProductOpportunities
    .filter((i) => i.orgId === orgId)
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
    .slice(0, MAX_OPPORTUNITIES_PER_ORG);
  const others = db.enterpriseProductOpportunities.filter((i) => i.orgId !== orgId);
  db.enterpriseProductOpportunities = [...mine, ...others];
  writeDb(db);
  return { imported, total: mine.length };
}
