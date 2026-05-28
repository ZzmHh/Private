/**
 * 企业定制站 · Agent 工作台配置
 * 子账号在此使用 Agent；能力对齐凡梦 + 企业增项（图文美化、AI 视频）
 */
export const ENTERPRISE_WORKBENCH_PREFIX = "workbench";

export const enterpriseWorkbenchAgents = [
  {
    id: "trend",
    name: "爆款选品监控",
    icon: "search",
    category: "运营",
    desc: "趋势与机会评估，输出可执行的选品清单与风险备注。",
    prompt: "帮我评估 TikTok Shop 泰国市场家居收纳类目的机会方向，并说明需要补充哪些验证数据。",
    legacyParity: true,
    dataScope: "market",
  },
  {
    id: "content",
    name: "爆款内容生成",
    icon: "file-text",
    category: "运营",
    desc: "短视频脚本、分镜、口播与达人 Brief。",
    prompt: "为一款便携式榨汁杯生成 5 条 TikTok 爆款短视频脚本。",
    legacyParity: true,
    dataScope: "shop_enhanced",
  },
  {
    id: "listing",
    name: "Listing 转化优化",
    icon: "list",
    category: "运营",
    desc: "标题、五点、关键词、FAQ 与 A+ 结构。",
    prompt: "把这款宠物饮水机优化成 Amazon US 高转化 Listing。",
    legacyParity: true,
    dataScope: "shop_enhanced",
  },
  {
    id: "publish",
    name: "智能上架",
    icon: "upload",
    category: "运营",
    desc: "选品机会 → 1688 货源 → Listing → 审核 → 发布到当前店铺。",
    prompt: "基于选品机会，匹配 1688 货源并上架到 TikTok Shop 泰国店。",
    legacyParity: false,
    enterpriseOnly: true,
    requiresStore: true,
    dataScope: "shop_required",
  },
  {
    id: "growth",
    name: "业绩诊断",
    icon: "activity",
    category: "增长",
    desc: "基于店铺数据输出 KPI 异常与 P0/P1 动作清单。",
    prompt: "基于已同步的 TikTok 店铺数据，做连接版业绩诊断。",
    legacyParity: true,
    requiresStore: true,
    dataScope: "shop_required",
  },
  {
    id: "service",
    name: "智能客服",
    icon: "message-square",
    category: "客服",
    desc: "FAQ 匹配、话术建议与自动化规则（配合店铺 API / 插件）。",
    prompt: "买家问「什么时候发货」，请给出符合店铺政策的回复建议。",
    legacyParity: true,
    requiresStore: true,
    dataScope: "shop_required",
  },
  {
    id: "profit",
    name: "广告库存利润",
    icon: "trending-up",
    category: "增长",
    desc: "广告效率、库存周转与 SKU 利润倾向分析。",
    prompt: "基于插件快照与成本数据，输出广告与库存优化建议。",
    legacyParity: true,
    requiresStore: true,
    dataScope: "shop_required",
  },
  {
    id: "visual",
    name: "图文美化",
    icon: "image",
    category: "创意",
    desc: "主图/海报/白底图/背景替换等 7 款图片工具，左参右预览。",
    prompt: "根据图1，生成淘宝用的商品主图，要求没有错别字，没有品牌名",
    legacyParity: false,
    enterpriseOnly: true,
    dataScope: "model_only",
  },
  {
    id: "video",
    name: "AI 视频生成",
    icon: "sparkles",
    category: "创意",
    desc: "Seedance2 / 首尾帧 / 自由视频，支持任务轮询与结果下载。",
    prompt: "例如：一只猫在海边奔跑，电影感，夕阳，4k",
    legacyParity: false,
    enterpriseOnly: true,
    dataScope: "model_only",
  },
];

export function findWorkbenchAgent(id) {
  return enterpriseWorkbenchAgents.find((a) => a.id === id) || null;
}

export function defaultWorkbenchAgentId() {
  return enterpriseWorkbenchAgents[0]?.id || "trend";
}

export function workbenchAgentGroups() {
  const map = new Map();
  for (const agent of enterpriseWorkbenchAgents) {
    const list = map.get(agent.category) || [];
    list.push(agent);
    map.set(agent.category, list);
  }
  return [...map.entries()].map(([label, items]) => ({ label, items }));
}
