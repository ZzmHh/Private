import { entFetch } from "./enterpriseHttp.js";

const COLLECT = "/api/enterprise/collect";
const PUBLISH = "/api/enterprise/publish";

export async function listCollectItems(opts = {}) {
  const qs = new URLSearchParams();
  if (opts.status) qs.set("status", opts.status);
  if (opts.sourcePlatform) qs.set("sourcePlatform", opts.sourcePlatform);
  const q = qs.toString();
  const data = await entFetch(`${COLLECT}/items${q ? `?${q}` : ""}`);
  return data.items || [];
}

/** @param {object} payload */
export async function createCollectItem(payload) {
  const data = await entFetch(`${COLLECT}/items`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.item;
}

/** @param {string} id @param {object} patch */
export async function updateCollectItem(id, patch) {
  const data = await entFetch(`${COLLECT}/items/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  return data.item;
}

/** @param {string} id */
export async function deleteCollectItem(id) {
  return entFetch(`${COLLECT}/items/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/**
 * @param {string} id
 * @param {{ market?: string, language?: string, titleStrategy?: string }} [opts]
 */
export async function generateListing(id, opts = {}) {
  const data = await entFetch(`${COLLECT}/items/${encodeURIComponent(id)}/generate-listing`, {
    method: "POST",
    body: JSON.stringify(opts),
  });
  return data;
}

/** @param {string} [shopId] */
export async function listPublishJobs(shopId = "") {
  const q = shopId ? `?shopId=${encodeURIComponent(shopId)}` : "";
  const data = await entFetch(`${PUBLISH}/jobs${q}`);
  return data.jobs || [];
}

/** @param {object} payload @param {string} shopId */
export async function createPublishJob(payload, shopId) {
  const data = await entFetch(
    `${PUBLISH}/jobs`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    shopId,
  );
  return data.job;
}

/** @param {string} id @param {object} patch */
export async function updatePublishJob(id, patch) {
  const data = await entFetch(`${PUBLISH}/jobs/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  return data.job;
}

/** @param {string} id */
export async function getPublishFillPack(id) {
  return entFetch(`${PUBLISH}/jobs/${encodeURIComponent(id)}/fill-pack`);
}
