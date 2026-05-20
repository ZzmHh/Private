import { readDb, getDatabaseInfo, dbBackend } from "../repositories/index.js";
import { getLastBackupAt } from "../jobs/dbBackup.js";
import { agentSkills } from "../agentSkills.js";

const startedAt = Date.now();

/**
 * @param {import("express").Express} app
 * @param {{ providerName: string, model: string, apiKey?: string }} deps
 */
export function registerHealthRoutes(app, { providerName, model, apiKey }) {
  app.get("/api/health", (_req, res) => {
    let dbOk = false;
    try {
      readDb();
      dbOk = true;
    } catch {
      dbOk = false;
    }

    const dbInfo = getDatabaseInfo();
    res.json({
      status: dbOk ? "ok" : "degraded",
      ok: dbOk,
      service: "凡梦AI",
      uptimeSec: Math.floor((Date.now() - startedAt) / 1000),
      provider: providerName,
      model,
      openclawConfigured: Boolean(apiKey),
      agents: Object.keys(agentSkills).length,
      db: {
        backend: dbBackend,
        ok: dbOk && dbInfo.ok,
        path: dbInfo.path,
        sizeBytes: dbInfo.sizeBytes,
        mtime: dbInfo.mtime,
        lastJsonBackup: getLastBackupAt(),
      },
    });
  });
}
