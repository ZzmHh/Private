/** 各 Agent 工作台 UI 规格（输入项、输出结构、演示数据） */

import {
  DEFAULT_SEA_MARKET,
  DEFAULT_WORKBENCH_PLATFORM,
  SEA_MARKET_OPTIONS,
  WORKBENCH_PLATFORM_OPTIONS,
} from "../config/workbenchScopeOptions.js";

export const agentWorkbenchSpecs = {
  trend: {
    inputLabel: "选品任务",
    inputPlaceholder:
      "补充预算、客单价、差异化方向等，例如：客单价 $15–35，优先轻小件、可短视频展示",
    fields: [
      {
        key: "platform",
        label: "平台",
        type: "select",
        options: WORKBENCH_PLATFORM_OPTIONS,
        default: DEFAULT_WORKBENCH_PLATFORM,
        width: "half",
      },
      {
        key: "market",
        label: "市场",
        type: "select",
        options: SEA_MARKET_OPTIONS,
        default: DEFAULT_SEA_MARKET,
        width: "half",
      },
    ],
    outputTitle: "选品机会清单",
    emptyHint: "选择平台与东南亚市场后生成趋势评估；类目将在接入第三方选品 API 后开放。",
  },
  content: {
    inputLabel: "内容任务",
    inputPlaceholder: "描述商品、人群与内容形式，例如：便携式榨汁杯 · Z 世代 · 15 秒竖屏",
    fields: [
      { key: "product", label: "商品", placeholder: "便携式榨汁杯", width: "half" },
      { key: "audience", label: "目标人群", placeholder: "18–28 岁健身人群", width: "half" },
    ],
    outputTitle: "脚本与分镜",
    emptyHint: "生成后可复制单条脚本，或导出完整 Brief 给剪辑/达人。",
  },
  listing: {
    inputLabel: "Listing 任务",
    inputPlaceholder: "粘贴现有标题/卖点或描述商品，例如：宠物饮水机 · 静音泵 · 2.5L",
    fields: [
      {
        key: "platform",
        label: "平台",
        type: "select",
        options: WORKBENCH_PLATFORM_OPTIONS,
        default: DEFAULT_WORKBENCH_PLATFORM,
        width: "third",
      },
      {
        key: "market",
        label: "市场",
        type: "select",
        options: SEA_MARKET_OPTIONS,
        default: DEFAULT_SEA_MARKET,
        width: "third",
      },
      { key: "sku", label: "SKU（可选）", placeholder: "店铺 SKU", width: "third" },
    ],
    outputTitle: "Listing 方案",
    emptyHint: "输出标题候选、五点描述、后台关键词与 FAQ 草稿，需人工合规复核。",
  },
  growth: {
    inputLabel: "诊断说明",
    inputPlaceholder: "可选补充：关注 GMV 下滑、退款率、某 SKU 库存积压等",
    fields: [{ key: "range", label: "数据周期", type: "select", options: ["近 7 天", "近 30 天", "本月"], width: "half" }],
    toggles: [{ key: "attachStore", label: "附带已同步店铺数据" }],
    outputTitle: "业绩诊断报告",
    emptyHint: "基于店铺 API / 插件同步数据，输出 KPI 摘要与 P0/P1 动作清单。",
    requiresStore: true,
  },
  service: {
    inputLabel: "买家消息（模拟）",
    inputPlaceholder: "输入买家原文，例如：When will my order ship? I ordered 3 days ago.",
    fields: [{ key: "lang", label: "回复语言", type: "select", options: ["跟随买家", "中文", "English"], width: "half" }],
    outputTitle: "话术建议",
    emptyHint: "匹配 FAQ 与店铺政策，给出可直接发送或微调后发送的回复。",
    requiresStore: true,
  },
  profit: {
    inputLabel: "分析 focus",
    inputPlaceholder: "例如：重点看广告 ROAS 与 FBA 库存周转，SKU 成本表已导入",
    toggles: [
      { key: "attachAds", label: "附带广告快照" },
      { key: "attachInv", label: "附带库存快照" },
    ],
    outputTitle: "广告 · 库存 · 利润",
    emptyHint: "输出广告效率、库存风险 SKU 与利润倾向表；缺成本数据会标注待补字段。",
    requiresStore: true,
  },
  visual: {
    inputLabel: "美化需求",
    inputPlaceholder: "例如：3 套主图卖点排版，中英双语，强调续航与降噪",
    fields: [
      { key: "kit", label: "品牌 Kit", type: "select", options: ["默认品牌", "客户 Kit A", "客户 Kit B"], width: "half" },
      { key: "sizes", label: "输出尺寸", type: "select", options: ["1:1 + 9:16", "仅 1:1", "仅 9:16"], width: "half" },
    ],
    outputTitle: "图文方案预览",
    emptyHint: "上传商品图后生成排版方案；可下载多尺寸 PNG。",
    enterpriseOnly: true,
  },
  video: {
    inputLabel: "视频 brief",
    inputPlaceholder: "例如：15 秒竖屏卖货片，开场 3 秒钩子，展示前后对比",
    fields: [
      { key: "duration", label: "时长", type: "select", options: ["15 秒", "30 秒", "60 秒"], width: "third" },
      { key: "ratio", label: "画幅", type: "select", options: ["9:16", "1:1"], width: "third" },
      { key: "voice", label: "口播", type: "select", options: ["无口播", "中文", "English"], width: "third" },
    ],
    outputTitle: "分镜与生成任务",
    emptyHint: "提交后进入生成队列，完成后出现在素材库。",
    enterpriseOnly: true,
  },
};

export function getAgentWorkbenchSpec(agentId) {
  return agentWorkbenchSpecs[agentId] || agentWorkbenchSpecs.trend;
}

export function buildMockOutput(agentId, input, fields = {}) {
  const specs = {
    trend: () => ({
      type: "table",
      summary: "基于输入的市场与类目，以下为演示结构化输出（接入 API 后为真实模型结果）。",
      sections: [
        {
          title: "机会方向 Top 5",
          rows: [
            ["折叠收纳箱", "搜索趋势 ↑", "竞争中等", "建议测款"],
            ["真空压缩袋套装", "短视频带货强", "竞争偏高", "需差异化主图"],
            ["床底收纳抽屉", "客单适配", "竞争低", "优先"],
            ["桌面收纳格", "连带率高", "竞争中等", "可组合销售"],
            ["旅行收纳分装", "季节波动", "竞争低", "Q2 提前备货"],
          ],
          columns: ["方向", "信号", "竞争", "建议"],
        },
        {
          title: "风险备注",
          bullets: ["需验证头程与平台类目资质", "美国站注意 CPSIA 等合规", "建议补充：近 30 天竞品价带与差评主题"],
        },
      ],
    }),
    content: () => ({
      type: "scripts",
      items: [
        { hook: "Hook A · 痛点", body: "「健身房只喝蛋白粉？这台杯子 30 秒出鲜榨。」展示杯身 + 水果入镜。" },
        { hook: "Hook B · 对比", body: "分屏：普通杯 vs 一键清洗。口播：「出差也能天天喝鲜的。」" },
        { hook: "Hook C · 场景", body: "办公室午休 15 秒制作；字幕强调 USB 充电与静音。" },
      ],
    }),
    listing: () => ({
      type: "listing",
      title: "Ultra-Quiet Pet Water Fountain — 2.5L Automatic Dispenser",
      bullets: [
        "Whisper-quiet pump (<40dB) for anxious pets",
        "Triple filtration · fresh water for 7 days",
        "2.5L capacity · fewer refills for multi-pet homes",
        "BPA-free bowl · dishwasher-safe parts",
        "US plug · 12-month warranty",
      ],
      keywords: "pet fountain, cat water dispenser, quiet, automatic",
    }),
    growth: () => ({
      type: "diagnosis",
      kpis: [
        { label: "GMV", value: "↓ 8.2%", status: "warn" },
        { label: "转化率", value: "2.1%", status: "ok" },
        { label: "退款率", value: "↑ 1.2pp", status: "warn" },
        { label: "会话响应", value: "4.2h", status: "warn" },
      ],
      actions: [
        { level: "P0", text: "排查 Top3 SKU 退款原因（物流延迟占比 62%）" },
        { level: "P0", text: "启用 FAQ 自动回复「发货时效」" },
        { level: "P1", text: "广告组 A 点击降但花费升 — 缩预算 15% 观察 3 天" },
      ],
    }),
    service: () => ({
      type: "cs",
      matchedFaq: "发货时效 · 标准品",
      reply:
        "Hi! Thanks for your order. Standard items ship within 1–2 business days. You'll receive tracking once dispatched. Need to change the address? Reply before we ship.",
      note: "置信度 0.92 · 建议人工确认地址变更规则",
    }),
    profit: () => ({
      type: "table",
      summary: "广告与库存快照已附带（演示）。",
      sections: [
        {
          title: "广告效率（Top SKU）",
          columns: ["SKU", "Spend", "ROAS", "建议"],
          rows: [
            ["SKU-001", "$420", "2.8", "维持"],
            ["SKU-002", "$310", "1.4", "降出价"],
            ["SKU-003", "$180", "3.1", "加预算"],
          ],
        },
        {
          title: "库存风险",
          bullets: ["SKU-002：可售天数 45 · 建议减采", "SKU-004：断货风险 · 7 天内补货"],
        },
      ],
    }),
    visual: () => ({
      type: "visual",
      variants: [
        { name: "方案 A · 卖点堆叠", size: "1080×1080" },
        { name: "方案 B · 前后对比", size: "1080×1920" },
        { name: "方案 C · 品牌色块", size: "1080×1080" },
      ],
    }),
    video: () => ({
      type: "video",
      shots: [
        { t: "0–3s", desc: "特写产品 + 字幕钩子「还在用有线？」" },
        { t: "3–8s", desc: "使用场景 · 办公室/通勤" },
        { t: "8–12s", desc: "卖点三连：降噪 / 续航 / 轻量" },
        { t: "12–15s", desc: "CTA + 价格锚点" },
      ],
      jobId: "JOB-DEMO-001",
      status: "queued",
    }),
  };
  const fn = specs[agentId] || specs.trend;
  return fn(input, fields);
}
