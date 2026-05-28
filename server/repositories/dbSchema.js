/** @typedef {import("./dbSchema.js").AppDb} AppDb */

export const defaultDb = {
  users: [],
  tasks: [],
  orders: [],
  usageLogs: [],
  feedback: [],
  storeConnections: [],
  orgShops: [],
  memberShopGrants: [],
  shopConnections: [],
  shopCatalogItems: [],
  extensionSnapshots: [],
  enterpriseExtensionSnapshots: [],
  enterpriseCollectItems: [],
  enterprisePublishJobs: [],
  enterpriseProductOpportunities: [],
  storeMetricsImports: [],
  enterpriseStoreMetricsImports: [],
  csFaqTemplates: [],
  csSellerAlerts: [],
  csAutomationSettings: {},
  csRouteEvents: [],
  productEvents: [],
  vibeClipJobs: [],
  viralReports: [],
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
    orgShops: Array.isArray(db.orgShops) ? db.orgShops : [],
    memberShopGrants: Array.isArray(db.memberShopGrants) ? db.memberShopGrants : [],
    shopConnections: Array.isArray(db.shopConnections) ? db.shopConnections : [],
    shopCatalogItems: Array.isArray(db.shopCatalogItems) ? db.shopCatalogItems : [],
    extensionSnapshots: Array.isArray(db.extensionSnapshots) ? db.extensionSnapshots : [],
    enterpriseExtensionSnapshots: Array.isArray(db.enterpriseExtensionSnapshots)
      ? db.enterpriseExtensionSnapshots
      : [],
    enterpriseCollectItems: Array.isArray(db.enterpriseCollectItems) ? db.enterpriseCollectItems : [],
    enterprisePublishJobs: Array.isArray(db.enterprisePublishJobs) ? db.enterprisePublishJobs : [],
    enterpriseProductOpportunities: Array.isArray(db.enterpriseProductOpportunities)
      ? db.enterpriseProductOpportunities
      : [],
    storeMetricsImports: Array.isArray(db.storeMetricsImports) ? db.storeMetricsImports : [],
    enterpriseStoreMetricsImports: Array.isArray(db.enterpriseStoreMetricsImports)
      ? db.enterpriseStoreMetricsImports
      : [],
    csFaqTemplates: Array.isArray(db.csFaqTemplates) ? db.csFaqTemplates : [],
    csSellerAlerts: Array.isArray(db.csSellerAlerts) ? db.csSellerAlerts : [],
    csAutomationSettings:
      db.csAutomationSettings && typeof db.csAutomationSettings === "object" ? db.csAutomationSettings : {},
    csRouteEvents: Array.isArray(db.csRouteEvents) ? db.csRouteEvents : [],
    productEvents: Array.isArray(db.productEvents) ? db.productEvents : [],
    vibeClipJobs: Array.isArray(db.vibeClipJobs) ? db.vibeClipJobs : [],
    viralReports: Array.isArray(db.viralReports) ? db.viralReports : [],
  };
}
