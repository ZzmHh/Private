export type PainSolution = {
  id: string;
  emoji: string;
  painTitle: string;
  painScene: string;
  painDetail: string;
  agentName: string;
  agentTagline: string;
  solution: string;
  powers: string[];
  outcome: string;
  outcomeMetric: string;
  gradient: string;
  accent: string;
};

export const BRAND = {
  name: "凡梦AI",
  nameEn: "FANMENG AI",
  tagline: "跨境电商卖家的 AI 运营团队",
  sub: "深度理解卖家痛点 · 六大模块精准击破 · 输出可直接执行的方案",
  colors: {
    blue: "#00A0FF",
    purple: "#8A2BE2",
    pink: "#E040FB",
    navy: "#0a1020",
  },
};

/** 跨境卖家六大核心痛点（场景化） */
export const SELLER_PAINS = [
  {
    emoji: "😰",
    title: "不知道卖什么",
    scene: "「群里都在讨论爆款，你打开 5 个表格还是选不出来」",
    detail: "数据散在 TikTok、Amazon、各种榜单里，跟品慢半拍，赌 SKU 靠直觉",
  },
  {
    emoji: "🎬",
    title: "内容产出太慢",
    scene: "「一条视频从想创意到出脚本，团队耗两天，还经常被平台打回」",
    detail: "不会写钩子、分镜不统一、外包剪辑反复改稿",
  },
  {
    emoji: "📉",
    title: "Listing 不出单",
    scene: "「流量有了，就是不下单——标题弱、关键词漏、详情页打动不了老外」",
    detail: "五点描述像说明书，A+ 页面没结构，SEO 词靠猜",
  },
  {
    emoji: "📊",
    title: "数据看了等于没看",
    scene: "「GMV 掉了 18%，广告、库存、客服各说各话，开会两小时没结论」",
    detail: "KPI 异常找不到主因，不知道本周最该先做哪 3 件事",
  },
  {
    emoji: "💬",
    title: "客服把人拖垮",
    scene: "「买家半夜问物流，你起床回；同样问题答十遍，说法还不一样」",
    detail: "时差 + 重复劳动 + 差评威胁，小团队没有专职客服",
  },
  {
    emoji: "💸",
    title: "利润算不清楚",
    scene: "「广告在烧、库存压着、SKU 越多越看不清哪个在赚钱」",
    detail: "不知道该补货还是清仓，停投还是加预算，全靠感觉",
  },
];

export const PAIN_SOLUTIONS: PainSolution[] = [
  {
    id: "trend",
    emoji: "📦",
    painTitle: "选品靠猜 · 跟品太慢",
    painScene: "爆款过了才看到，例会聊三小时没有清单",
    painDetail: "TikTok、Amazon 数据分散，缺统一的机会评估框架",
    agentName: "爆款选品监控",
    agentTagline: "Module 01",
    solution: "自动抓取趋势信号，输出机会评分 + 价格带 + 竞争强度",
    powers: ["多平台热销趋势参考", "机会评分 & 风险备注", "可执行验证清单"],
    outcome: "从「凭感觉赌 SKU」→「按清单决策」",
    outcomeMetric: "周报级选品清单 · 10 分钟出结论",
    gradient: "linear-gradient(135deg, #00A0FF, #2563eb)",
    accent: "#00A0FF",
  },
  {
    id: "content",
    emoji: "✍️",
    painTitle: "脚本难产 · 素材风格飘",
    painScene: "一条 TikTok 从创意到脚本，团队耗两天",
    painDetail: "钩子弱、分镜乱、外包剪辑不懂当期主推卖点",
    agentName: "爆款内容生成",
    agentTagline: "Module 02",
    solution: "按 SKU 批量生成脚本、分镜、口播、拍摄清单",
    powers: ["痛点/测评/场景多风格", "转化钩子矩阵", "达人 Brief 一页纸"],
    outcome: "从「临时加塞写脚本」→「排期批量产出」",
    outcomeMetric: "1 SKU · 5 套脚本 + 18 钩子",
    gradient: "linear-gradient(135deg, #db2777, #f97316)",
    accent: "#db2777",
  },
  {
    id: "listing",
    emoji: "✨",
    painTitle: "有流量 · 无转化",
    painScene: "标题关键词弱，老外划走只需 3 秒",
    painDetail: "五点像说明书，FAQ 缺失，多语言本地化靠机翻",
    agentName: "Listing 转化优化",
    agentTagline: "Module 03",
    solution: "高转化标题 + 五点 + SEO 词库 + A+ 结构 + FAQ",
    powers: ["Amazon/TikTok 平台适配", "42+ SEO 关键词扩展", "EN/DE 等多语言"],
    outcome: "从「凭感觉写详情」→「结构化高转化文案」",
    outcomeMetric: "1 SKU · 3 版标题 + 完整 Listing",
    gradient: "linear-gradient(135deg, #0891b2, #10b981)",
    accent: "#0891b2",
  },
  {
    id: "growth",
    emoji: "📈",
    painTitle: "GMV 下滑 · 找不到主因",
    painScene: "广告说曝光问题，运营说转化问题，谁也说服不了谁",
    painDetail: "数据在 ERP、平台后台、表格里各一份，对不齐",
    agentName: "店铺业绩诊断",
    agentTagline: "Module 04",
    solution: "插件同步 + CSV 导入，KPI 异常归因 + P0/P1 动作",
    powers: ["GMV/转化/ROI 联动看", "异常假设树", "缺什么数据会明示"],
    outcome: "从「开会扯皮」→「一页纸对齐优先级」",
    outcomeMetric: "5 个 P0 动作 · 当天可执行",
    gradient: "linear-gradient(135deg, #16a34a, #65a30d)",
    accent: "#16a34a",
  },
  {
    id: "service",
    emoji: "🎧",
    painTitle: "客服拖垮团队",
    painScene: "物流、退款、差评威胁——夜班同事靠临场发挥",
    painDetail: "同样问题十种说法，容易引发二次纠纷",
    agentName: "AI 客服售后",
    agentTagline: "Module 05",
    solution: "多语言话术 + FAQ 规则 + TikTok 插件内自动填入发送",
    powers: ["12+ 语种草案", "FAQ/夜间自动回复", "高风险订单升级人审"],
    outcome: "从「人工硬扛」→「模板化 + AI 兜底」",
    outcomeMetric: "常见咨询 · 秒级首响草案",
    gradient: "linear-gradient(135deg, #8A2BE2, #4f46e5)",
    accent: "#8A2BE2",
  },
  {
    id: "profit",
    emoji: "💰",
    painTitle: "广告烧钱 · 利润盲区",
    painScene: "20 个 SKU，哪些该补货、哪些该清仓，全靠 Excel 猜",
    painDetail: "广告费、库存、采购、平台佣金没串起来",
    agentName: "广告库存利润",
    agentTagline: "Module 06",
    solution: "联动广告效率、库存周转、SKU 成本，输出利润预警",
    powers: ["补货/停投/清仓建议", "滞销 & 断货预警", "SKU 利润倾向精算"],
    outcome: "从「感觉在赚钱」→「按 SKU 看清利润」",
    outcomeMetric: "20 SKU · 分级动作清单",
    gradient: "linear-gradient(135deg, #ea580c, #ca8a04)",
    accent: "#ea580c",
  },
];

export const PROMO_AGENTS = PAIN_SOLUTIONS;

export const POWER_HIGHLIGHTS = [
  { label: "6 大模块", desc: "覆盖选品→内容→Listing→诊断→客服→利润" },
  { label: "5 Agent 一键运营", desc: "单轮串联完整运营方案" },
  { label: "TikTok 插件", desc: "卖家中心内同步数据 + 自动客服" },
  { label: "7 天专业版", desc: "注册即享全功能体验" },
];

export const AUTOPILOT = {
  title: "5 Agent 运营一键生成",
  desc: "输入类目与目标，单轮输出：选品清单 → 内容脚本 → Listing 文案 → 业绩诊断 → 利润建议",
  note: "客服话术建议单独在 AI 客服模块生成，确保人工可控",
};

export const EXTENSION = {
  title: "TikTok Shop Chrome 插件",
  desc: "在卖家已登录的后台直接运行——同步 KPI、自动生成回复、FAQ 夜间自动发送",
  bullets: [
    "不用 Open API，浏览器读取当前页面",
    "选中买家消息 → AI 生成 → 自动填入发送",
    "诊断包：概览 / 订单 / 广告 / 库存",
  ],
};

export const WORKFLOW = [
  { step: "01", title: "免费注册", desc: "7 天专业版全功能" },
  { step: "02", title: "选模块 / 一键运营", desc: "输入业务问题即出方案" },
  { step: "03", title: "装插件跑 TikTok", desc: "后台内自动客服 + 同步" },
];

export const PRICING = [
  { name: "免费版", price: "¥0", highlight: "每日 8 次 · 试核心能力" },
  { name: "成长版", price: "¥149/月", highlight: "插件自动客服 · 120 次/日" },
  { name: "专业版", price: "¥299/月", highlight: "CSV 诊断 + 一键运营" },
  { name: "团队版", price: "¥699/月", highlight: "多店 · 2000 次/日" },
];

export const PLATFORMS = ["Amazon", "TikTok Shop", "Shopify", "Shopee", "Temu"];

// legacy alias
export const PAIN_POINTS = SELLER_PAINS.map((p) => ({ title: p.title, desc: p.detail }));
