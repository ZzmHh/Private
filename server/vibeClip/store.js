import crypto from "node:crypto";
import { readDb, writeDb } from "../repositories/index.js";

/**
 * @param {string} userId
 * @param {Date} [now]
 */
export function countUserJobsThisMonth(userId, now = new Date()) {
  const db = readDb();
  const monthPrefix = now.toISOString().slice(0, 7);
  return db.vibeClipJobs.filter(
    (j) => j.userId === userId && j.createdAt?.startsWith(monthPrefix) && j.status !== "failed",
  ).length;
}

/** @param {string} userId @param {string} jobId */
export function getVibeClipJob(userId, jobId) {
  const db = readDb();
  return db.vibeClipJobs.find((j) => j.id === jobId && j.userId === userId) || null;
}

/** @param {string} userId @param {number} [limit] */
export function listVibeClipJobs(userId, limit = 20) {
  const db = readDb();
  return db.vibeClipJobs
    .filter((j) => j.userId === userId)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, limit);
}

/**
 * @param {object} payload
 */
export function createVibeClipJob(payload) {
  const db = readDb();
  const job = {
    id: crypto.randomUUID(),
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...payload,
  };
  db.vibeClipJobs.unshift(job);
  db.vibeClipJobs = db.vibeClipJobs.slice(0, 5000);
  writeDb(db);
  return job;
}

/**
 * @param {string} userId
 * @param {string} jobId
 * @param {object} patch
 */
export function updateVibeClipJob(userId, jobId, patch) {
  const db = readDb();
  const job = db.vibeClipJobs.find((j) => j.id === jobId && j.userId === userId);
  if (!job) return null;
  Object.assign(job, patch, { updatedAt: new Date().toISOString() });
  writeDb(db);
  return job;
}
