/**
 * 企业定制站 · 路由与导航
 * 双模式：console（主账号监控）| workbench（全员 Agent 工作台）
 */
export const ENTERPRISE_HASH_PREFIX = "enterprise";

/** @typedef {"console" | "workbench"} EnterpriseMode */

/** 控制台导航 — 主账号查看、组织与监控 */
export const enterpriseConsoleNavGroups = [
  {
    id: "overview",
    label: "总览",
    items: [{ id: "overview", path: "console/overview", label: "企业总览", icon: "layout-dashboard" }],
  },
  {
    id: "organization",
    label: "组织",
    items: [
      { id: "org-accounts", path: "console/org/accounts", label: "子账号", icon: "users" },
      { id: "org-roles", path: "console/org/roles", label: "角色权限", icon: "shield" },
      { id: "org-shops", path: "console/org/shops", label: "店铺授权", icon: "store" },
      { id: "org-agents", path: "console/org/agents", label: "Agent 开通", icon: "cpu" },
    ],
  },
  {
    id: "commerce",
    label: "交易",
    items: [
      { id: "commerce-orders", path: "console/commerce/orders", label: "订单", icon: "package" },
      { id: "commerce-inventory", path: "console/commerce/inventory", label: "库存", icon: "boxes" },
      { id: "commerce-products", path: "console/commerce/products", label: "商品", icon: "tag" },
    ],
  },
  {
    id: "monitor",
    label: "监控",
    items: [
      { id: "monitor-usage", path: "console/monitor/usage", label: "Agent 用量", icon: "bar-chart" },
      { id: "service-live", path: "console/monitor/cs", label: "会话监控", icon: "message-square" },
      { id: "service-alerts", path: "console/monitor/alerts", label: "告警", icon: "bell" },
    ],
  },
  {
    id: "automation",
    label: "自动化",
    items: [
      { id: "auto-workflows", path: "console/automation/workflows", label: "工作流", icon: "workflow" },
      { id: "auto-jobs", path: "console/automation/jobs", label: "API 任务队列", icon: "cpu" },
    ],
  },
  {
    id: "settings",
    label: "设置",
    items: [
      { id: "settings-ai", path: "console/settings/ai", label: "AI 与额度", icon: "sparkles" },
      { id: "settings-brand", path: "console/settings/brand", label: "品牌 Kit", icon: "palette" },
      { id: "settings-audit", path: "console/settings/audit", label: "审计日志", icon: "scroll-text" },
    ],
  },
];

const legacyConsolePathMap = {
  overview: "console/overview",
  "org/accounts": "console/org/accounts",
  "org/roles": "console/org/roles",
  "org/shops": "console/org/shops",
  "commerce/orders": "console/commerce/orders",
  "commerce/inventory": "console/commerce/inventory",
  "commerce/products": "console/commerce/products",
  "service/live": "console/monitor/cs",
  "service/alerts": "console/monitor/alerts",
  "growth/reports": "console/monitor/usage",
  "automation/workflows": "console/automation/workflows",
  "automation/jobs": "console/automation/jobs",
  "settings/ai": "console/settings/ai",
  "settings/brand": "console/settings/brand",
  "settings/audit": "console/settings/audit",
};

const legacyWorkbenchPathMap = {
  "ops/trend": "workbench/trend",
  "ops/content": "workbench/content",
  "ops/listing": "workbench/listing",
  "ops/creative": "workbench/visual",
  "growth/diagnosis": "workbench/growth",
  "growth/profit": "workbench/profit",
  "service/faq": "workbench/service",
};

/** @returns {object | null} */
export function findConsoleNavItemByPath(path) {
  for (const group of enterpriseConsoleNavGroups) {
    const hit = group.items.find((i) => i.path === path);
    if (hit) return hit;
  }
  return null;
}

function findConsoleGroupByItemId(itemId) {
  for (const group of enterpriseConsoleNavGroups) {
    if (group.items.some((i) => i.id === itemId)) return group;
  }
  return null;
}

function normalizeEnterprisePath(rawPath) {
  let path = String(rawPath || "").replace(/\/+$/, "") || "console/overview";

  if (path === "overview") path = "console/overview";
  if (legacyConsolePathMap[path]) path = legacyConsolePathMap[path];
  if (legacyWorkbenchPathMap[path]) path = legacyWorkbenchPathMap[path];

  if (path === "console" || path === "console/") path = "console/overview";
  if (path === "workbench" || path === "workbench/") path = "workbench/trend";

  return path;
}

/**
 * @returns {{
 *   mode: EnterpriseMode,
 *   path: string,
 *   agentId: string | null,
 *   item: object | null,
 *   group: object | null,
 * } | null}
 */
export function parseEnterpriseRoute(hash) {
  const raw = String(hash || "")
    .replace(/^#/, "")
    .trim();
  if (raw !== ENTERPRISE_HASH_PREFIX && !raw.startsWith(`${ENTERPRISE_HASH_PREFIX}/`)) {
    return null;
  }

  let sub = raw === ENTERPRISE_HASH_PREFIX ? "" : raw.slice(`${ENTERPRISE_HASH_PREFIX}/`.length);
  const path = normalizeEnterprisePath(sub);

  if (path.startsWith("workbench/")) {
    const agentId = path.slice("workbench/".length) || "trend";
    return {
      mode: "workbench",
      path,
      agentId,
      item: null,
      group: null,
    };
  }

  const item = findConsoleNavItemByPath(path);
  return {
    mode: "console",
    path,
    agentId: null,
    item,
    group: item ? findConsoleGroupByItemId(item.id) : null,
  };
}

export function enterpriseHref(path = "console/overview") {
  if (path === "console/overview" || path === "overview") {
    return `#${ENTERPRISE_HASH_PREFIX}/console/overview`;
  }
  return `#${ENTERPRISE_HASH_PREFIX}/${path.replace(/^\/+/, "")}`;
}

export function enterpriseWorkbenchHref(agentId = "trend") {
  return `#${ENTERPRISE_HASH_PREFIX}/workbench/${agentId}`;
}
