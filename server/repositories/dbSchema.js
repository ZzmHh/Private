/** @typedef {import("./dbSchema.js").AppDb} AppDb */

export const defaultDb = {
  users: [],
  tasks: [],
  orders: [],
  usageLogs: [],
  feedback: [],
  storeConnections: [],
  extensionSnapshots: [],
  storeMetricsImports: [],
  csFaqTemplates: [],
  csSellerAlerts: [],
  csAutomationSettings: {},
  csRouteEvents: [],
  productEvents: [],
  vibeClipJobs: [],
};

/**
 * @param {Partial<AppDb>} db
 * @returns {AppDb}
 */
export function normalizeDb(db) {
  return {
    ...defaultDb,
    ...db,
    users: Array.isArray(db.users) ? db.users : [],
    tasks: Array.isArray(db.tasks) ? db.tasks : [],
    orders: Array.isArray(db.orders) ? db.orders : [],
    usageLogs: Array.isArray(db.usageLogs) ? db.usageLogs : [],
    feedback: Array.isArray(db.feedback) ? db.feedback : [],
    storeConnections: Array.isArray(db.storeConnections) ? db.storeConnections : [],
    extensionSnapshots: Array.isArray(db.extensionSnapshots) ? db.extensionSnapshots : [],
    storeMetricsImports: Array.isArray(db.storeMetricsImports) ? db.storeMetricsImports : [],
    csFaqTemplates: Array.isArray(db.csFaqTemplates) ? db.csFaqTemplates : [],
    csSellerAlerts: Array.isArray(db.csSellerAlerts) ? db.csSellerAlerts : [],
    csAutomationSettings:
      db.csAutomationSettings && typeof db.csAutomationSettings === "object" ? db.csAutomationSettings : {},
    csRouteEvents: Array.isArray(db.csRouteEvents) ? db.csRouteEvents : [],
    productEvents: Array.isArray(db.productEvents) ? db.productEvents : [],
    vibeClipJobs: Array.isArray(db.vibeClipJobs) ? db.vibeClipJobs : [],
  };
}
