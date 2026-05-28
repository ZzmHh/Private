import crypto from "node:crypto";
import { readDb, writeDb } from "../repositories/index.js";

const MAX_REPORTS = 10000;
const REPORT_TTL_DAYS = 90;

/** @typedef {{
 *   id: string,
 *   refCode: string,
 *   titlePreview: string,
 *   input: { title: string, bullets: string, platform: string },
 *   result: object,
 *   score: number,
 *   verdict: string,
 *   isPublic: boolean,
 *   views: number,
 *   roastRuns: number,
 *   conversions: number,
 *   creatorIp: string,
 *   createdAt: string,
 *   publishedAt: string | null,
 * }} ViralReport */

function shortRef(id) {
  return id.replace(/-/g, "").slice(0, 8);
}

function trimReports(db) {
  if (!Array.isArray(db.viralReports)) db.viralReports = [];
  const cutoff = Date.now() - REPORT_TTL_DAYS * 24 * 60 * 60 * 1000;
  db.viralReports = db.viralReports.filter((r) => new Date(r.createdAt).getTime() >= cutoff);
  if (db.viralReports.length > MAX_REPORTS) {
    db.viralReports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    db.viralReports = db.viralReports.slice(0, MAX_REPORTS);
  }
}

/** @returns {ViralReport | null} */
export function getViralReport(idOrRef) {
  const key = String(idOrRef || "").trim();
  if (!key) return null;
  const db = readDb();
  const list = db.viralReports || [];
  return (
    list.find((r) => r.id === key || r.refCode === key) ||
    list.find((r) => r.id.startsWith(key) || r.refCode.startsWith(key)) ||
    null
  );
}

/** @param {{ title: string, bullets: string, platform?: string, creatorIp?: string, result: object, score: number, verdict: string }} input */
export function createViralReport(input) {
  const db = readDb();
  db.viralReports ||= [];
  trimReports(db);

  const id = crypto.randomUUID();
  const title = String(input.title || "").trim();
  /** @type {ViralReport} */
  const report = {
    id,
    refCode: shortRef(id),
    titlePreview: title.slice(0, 80) || "未命名商品",
    input: {
      title,
      bullets: String(input.bullets || "").trim(),
      platform: String(input.platform || "TikTok Shop").trim(),
    },
    result: input.result,
    score: Number(input.score) || 0,
    verdict: String(input.verdict || "").slice(0, 120),
    isPublic: false,
    views: 0,
    roastRuns: 1,
    conversions: 0,
    creatorIp: String(input.creatorIp || "").slice(0, 64),
    createdAt: new Date().toISOString(),
    publishedAt: null,
  };

  db.viralReports.unshift(report);
  writeDb(db);
  return report;
}

export function publishViralReport(idOrRef) {
  const db = readDb();
  const report = getViralReport(idOrRef);
  if (!report) return null;
  report.isPublic = true;
  report.publishedAt = report.publishedAt || new Date().toISOString();
  const idx = (db.viralReports || []).findIndex((r) => r.id === report.id);
  if (idx >= 0) {
    db.viralReports[idx] = report;
    writeDb(db);
  }
  return report;
}

export function incrementViralReportViews(idOrRef) {
  const db = readDb();
  const report = getViralReport(idOrRef);
  if (!report || !report.isPublic) return null;
  report.views = (report.views || 0) + 1;
  const idx = (db.viralReports || []).findIndex((r) => r.id === report.id);
  if (idx >= 0) {
    db.viralReports[idx] = report;
    writeDb(db);
  }
  return report;
}

export function recordViralConversion(refCode) {
  const code = String(refCode || "").trim();
  if (!code) return null;
  const db = readDb();
  const report = getViralReport(code);
  if (!report) return null;
  report.conversions = (report.conversions || 0) + 1;
  const idx = (db.viralReports || []).findIndex((r) => r.id === report.id);
  if (idx >= 0) {
    db.viralReports[idx] = report;
    writeDb(db);
  }
  return report;
}

/** @returns {{ allowed: boolean, remaining: number, used: number }} */
export function checkRoastQuota(ip) {
  const key = String(ip || "unknown").slice(0, 64);
  const dailyCap = Number(process.env.VIRAL_ROAST_DAILY_CAP || 5);
  const db = readDb();
  const today = new Date().toISOString().slice(0, 10);
  const used = (db.viralReports || []).filter(
    (r) => r.creatorIp === key && r.createdAt?.startsWith(today),
  ).length;
  return {
    allowed: used < dailyCap,
    remaining: Math.max(0, dailyCap - used),
    used,
  };
}

export function sanitizeReportForPublic(report) {
  if (!report) return null;
  return {
    id: report.id,
    refCode: report.refCode,
    titlePreview: report.titlePreview,
    platform: report.input?.platform,
    score: report.score,
    verdict: report.verdict,
    result: report.result,
    views: report.views,
    conversions: report.conversions,
    isPublic: report.isPublic,
    publishedAt: report.publishedAt,
    createdAt: report.createdAt,
  };
}
