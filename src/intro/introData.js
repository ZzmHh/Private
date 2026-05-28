export const PAIN_SOLUTIONS_WEB = [
  {
    id: "trend",
    painTitle: "选品靠猜 · 跟品太慢",
    painScene: "爆款过了才看到，例会聊三小时没有清单",
    agentName: "爆款选品监控",
    solution: "机会评分 + 价格带 + 竞争强度 + 风险备注",
    outcome: "周报级选品清单 · 10 分钟出结论",
    accent: "#00A0FF",
  },
  {
    id: "content",
    painTitle: "脚本难产 · 素材风格飘",
    painScene: "一条 TikTok 从创意到脚本，团队耗两天",
    agentName: "爆款内容生成",
    solution: "脚本 + 分镜 + 口播 + 拍摄清单批量产出",
    outcome: "1 SKU · 5 套脚本 + 18 钩子",
    accent: "#db2777",
  },
  {
    id: "listing",
    painTitle: "有流量 · 无转化",
    painScene: "标题弱、关键词漏，老外 3 秒划走",
    agentName: "Listing 转化优化",
    solution: "标题 + 五点 + SEO + A+ 结构 + 多语言",
    outcome: "1 SKU · 3 版标题 + 完整 Listing",
    accent: "#0891b2",
  },
  {
    id: "growth",
    painTitle: "GMV 下滑 · 找不到主因",
    painScene: "广告、运营各说各话，开会没结论",
    agentName: "店铺业绩诊断",
    solution: "KPI 异常归因 + P0/P1 动作清单",
    outcome: "5 个 P0 动作 · 当天可执行",
    accent: "#16a34a",
  },
  {
    id: "service",
    painTitle: "客服拖垮团队",
    painScene: "半夜回物流，同样问题十种说法",
    agentName: "AI 客服售后",
    solution: "多语言话术 + FAQ 自动回复 + 插件内发送",
    outcome: "常见咨询 · 秒级首响草案",
    accent: "#8A2BE2",
  },
  {
    id: "profit",
    painTitle: "广告烧钱 · 利润盲区",
    painScene: "20 个 SKU 哪些该补货清仓，全靠 Excel 猜",
    agentName: "广告库存利润",
    solution: "补货 / 停投 / 清仓 + SKU 利润预警",
    outcome: "20 SKU · 分级动作清单",
    accent: "#ea580c",
  },
];

export const INTRO_AGENTS = [
  {
    id: "trend",
    name: "爆款选品监控",
    short: "趋势 · 机会 · 竞争强度",
    gradient: "linear-gradient(135deg, #2563eb, #7c3aed)",
    accent: "#2563eb",
  },
  {
    id: "content",
    name: "爆款内容生成",
    short: "脚本 · 分镜 · 口播 · Brief",
    gradient: "linear-gradient(135deg, #db2777, #f97316)",
    accent: "#db2777",
  },
  {
    id: "listing",
    name: "Listing 转化优化",
    short: "标题 · 五点 · SEO · FAQ",
    gradient: "linear-gradient(135deg, #0891b2, #10b981)",
    accent: "#0891b2",
  },
  {
    id: "growth",
    name: "业绩诊断",
    short: "KPI 异常 · P0/P1 动作",
    gradient: "linear-gradient(135deg, #16a34a, #65a30d)",
    accent: "#16a34a",
  },
  {
    id: "service",
    name: "AI 客服控制台",
    short: "多语言话术 · FAQ 自动化",
    gradient: "linear-gradient(135deg, #7c3aed, #4f46e5)",
    accent: "#7c3aed",
  },
  {
    id: "profit",
    name: "广告库存利润",
    short: "补货 · 停投 · 利润预警",
    gradient: "linear-gradient(135deg, #ea580c, #ca8a04)",
    accent: "#ea580c",
  },
];

export const INTRO_PLATFORMS = ["Amazon", "TikTok Shop", "Shopify", "Shopee", "Temu", "自建站 / ERP"];

export const INTRO_PRICING = [
  {
    id: "free",
    name: "免费版",
    price: "0",
    desc: "永久免费 · 试插件与基础 Agent",
    features: ["每日 8 次调用", "TikTok 插件基础", "3 个核心 Agent", "7 天专业版体验"],
    recommended: false,
  },
  {
    id: "growth",
    name: "成长版",
    price: "149",
    desc: "单店卖家 · 插件自动客服",
    features: ["每日 120 次", "插件 FAQ 自动发送", "6 Agent 全开", "1 个店铺"],
    recommended: false,
  },
  {
    id: "pro",
    name: "专业版",
    price: "349",
    priceEarlyBird: "299",
    desc: "CSV 诊断 + 利润精算",
    features: ["每日 500 次", "5 Agent 一键运营", "CSV 经营导入", "3 个店铺"],
    recommended: true,
  },
  {
    id: "team",
    name: "团队版",
    price: "799",
    priceEarlyBird: "699",
    desc: "多店团队 · 高频调用",
    features: ["每日 2,000 次", "不限店铺", "自动化周报", "优先支持"],
    recommended: false,
  },
];

export const INTRO_CASES = [
  {
    slug: "home-tiktok-us",
    title: "家居品类 · 美区短视频",
    quote: "把选品讨论和内容初稿从「每周耗两天」压到更短。",
    tags: ["选品监控", "内容生成"],
    kpi: "周更频次提升 · 素材更统一",
  },
  {
    slug: "amazon-multi-listing",
    title: "多站点亚马逊卖家",
    quote: "Listing 翻新可以批量产出，再配合业绩诊断拉出优先清单。",
    tags: ["Listing", "业绩诊断"],
    kpi: "改版周期缩短 · 讨论有据可依",
  },
  {
    slug: "cs-heavy-store",
    title: "客服密集型店铺",
    quote: "常见物流问题用模板先顶一轮，高风险单再人工介入。",
    tags: ["AI 客服", "知识库"],
    kpi: "响应更一致 · 重复劳动减少",
  },
];

export const INTRO_STATS = [
  { value: "6", suffix: "大", label: "痛点精准击破" },
  { value: "5", suffix: "段", label: "一键运营串联" },
  { value: "7", suffix: "天", label: "专业版体验" },
  { value: "12", suffix: "+", label: "语种客服支持" },
];
