/** 演示数据 · 未登录 / 无 API Key 时使用 */

export const MOCK_WORKSPACE_SUMMARY = {
  platform: "tiktok",
  extensionConnected: true,
  latestSnapshotAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
  shopName: "TikTok US 主店",
  shopKey: "tiktok-us-main",
  snapshotCount: 6,
  diagnosisPack: {
    done: 3,
    total: 4,
    pages: {
      analytics: { label: "数据概览", synced: true, syncedAt: null, pageType: "analytics" },
      orders: { label: "订单", synced: true, syncedAt: null, pageType: "orders" },
      ads: { label: "广告", synced: true, syncedAt: null, pageType: "ads" },
      inventory: { label: "库存/商品", synced: false, syncedAt: null, pageType: null },
    },
  },
  metricsImport: { importedAt: null, skuCount: 28, shopPeriods: 2, hasAnalysis: true },
  growthReady: true,
  profit: {
    mode: "trend",
    modeLabel: "趋势模式",
    hint: "插件已抓到广告/订单页样本；导入 SKU 成本后可升级精算模式。",
    hasAds: true,
    hasInventory: false,
    hasOrders: true,
    hasAnalytics: true,
    hasSkuCost: true,
    skuCount: 28,
    canRunTrend: true,
    canRunPrecise: false,
    canRunFramework: true,
    recommendedActions: [
      { id: "sync_inventory", label: "打开商品/库存页 → 插件「同步本页」" },
    ],
  },
};

export function mockGrowthDiagnosisOutput(note) {
  return {
    type: "diagnosis",
    generatedAt: new Date().toISOString(),
    mode: "连接版 · 演示",
    kpis: [
      { label: "GMV（环比）", value: "↓ 8.2%", status: "warn" },
      { label: "转化率", value: "2.1%", status: "ok" },
      { label: "退款率", value: "↑ 1.2pp", status: "warn" },
      { label: "广告 ROAS", value: "2.4", status: "warn" },
      { label: "会话响应", value: "4.2h", status: "warn" },
      { label: "可售天数（均值）", value: "32 天", status: "ok" },
    ],
    actions: [
      { level: "P0", text: "Top3 SKU 退款原因：物流延迟占 62%，优先补 FAQ「发货时效」并核查仓配 SLA" },
      { level: "P0", text: "GMV 下滑主因：广告组 A 点击成本升 18%、转化持平 — 缩预算 15% 观察 3 天" },
      { level: "P1", text: "SKU-002 库存可售 45 天，建议减采或搭配 bundle 清库存" },
      { level: "P1", text: "会话响应 >4h，启用智能客服 FAQ 自动发 + 白天 AI 草稿" },
      { level: "P2", text: "补充库存页插件同步，解锁 SKU 级周转诊断" },
    ],
    narrative: (note ? `【卖家补充】${note}\n\n` : "") +
      "整体：流量与 GMV 同步走弱，转化未明显恶化，优先排查广告效率与物流体验；库存端暂无断货风险但存在滞销 SKU。",
  };
}

export function mockProfitAnalysisOutput(mode, note) {
  return {
    type: "profit",
    generatedAt: new Date().toISOString(),
    mode: mode === "precise" ? "精算模式" : mode === "trend" ? "趋势模式" : "框架模式",
    summary: "基于插件广告/订单样本 + SKU 成本表（演示）。精确数字需以卖家后台为准。",
    ads: {
      columns: ["SKU", "7日花费", "ROAS", "ACOS", "建议"],
      rows: [
        ["SKU-001 榨汁杯", "$420", "2.8", "36%", "维持 · 主力款"],
        ["SKU-002 宠物杯", "$310", "1.4", "71%", "降出价 20% 或停投"],
        ["SKU-003 收纳箱", "$180", "3.1", "32%", "可加预算 10%"],
        ["SKU-004 分装瓶", "$95", "0.9", "111%", "立即停投"],
      ],
    },
    inventory: {
      columns: ["SKU", "可售库存", "7日日均", "可售天数", "风险"],
      rows: [
        ["SKU-001", "240", "8.5", "28", "正常"],
        ["SKU-002", "380", "3.1", "122", "滞销 · 减采"],
        ["SKU-003", "52", "6.2", "8", "断货风险 · 补货"],
        ["SKU-004", "18", "4.0", "4", "紧急补货"],
      ],
    },
    profitRows: mode === "precise" || mode === "trend"
      ? {
          columns: ["SKU", "售价区间", "单件毛利*", "广告占比*", "倾向"],
          rows: [
            ["SKU-001", "$29–32", "≈ 38%", "中", "保利润 · 控广告"],
            ["SKU-002", "$24–26", "≈ 22%", "高", "清库存 · 降广告"],
            ["SKU-003", "$18–20", "≈ 41%", "低", "可放量"],
          ],
          footnote: "* 基于导入成本表估算，不含平台动态佣金/券补差",
        }
      : null,
    principles: mode === "framework"
      ? [
          "先凑齐诊断包 ≥2/4 或导入店铺 CSV，再跑趋势/精算",
          "广告：ROAS < 保本线连续 3 天 → 降预算；ROAS 稳定且库存充足 → 小步加量",
          "库存：可售天数 >90 → 促销/捆绑；<14 → 补货优先级 P0",
          "利润：无 SKU 成本时不猜毛利，只给框架动作",
        ]
      : null,
    narrative: note || "",
  };
}

export const MOCK_ADS_SNAPSHOT = {
  columns: ["广告组 / SKU", "花费", "点击", "CPC", "ROAS", "状态"],
  rows: [
    ["Spark · 榨汁杯主款", "$186", "920", "$0.20", "2.9", "正常"],
    ["Video · 宠物杯测款", "$142", "410", "$0.35", "1.3", "需优化"],
    ["Search · 收纳套装", "$98", "650", "$0.15", "3.4", "可加码"],
    ["Retarget · 店铺访客", "$64", "280", "$0.23", "2.1", "观察"],
  ],
};

export const MOCK_INVENTORY_SNAPSHOT = {
  columns: ["SKU", "名称", "可售", "在途", "7日销", "可售天", "标签"],
  rows: [
    ["SKU-001", "便携榨汁杯", "240", "100", "59", "28", "—"],
    ["SKU-002", "宠物饮水机", "380", "0", "22", "122", "滞销"],
    ["SKU-003", "折叠收纳箱", "52", "200", "43", "8", "补货"],
    ["SKU-004", "旅行分装瓶", "18", "0", "28", "4", "断货"],
  ],
};

export const MOCK_KPI_BOARD = {
  period: "近 7 天 vs 上 7 天",
  metrics: [
    { label: "GMV", value: "$12,500", delta: "-8.2%", status: "warn" },
    { label: "订单数", value: "420", delta: "-9.7%", status: "warn" },
    { label: "转化率", value: "3.2%", delta: "-0.3pp", status: "ok" },
    { label: "广告花费", value: "$850", delta: "+9.0%", status: "warn" },
    { label: "广告 ROAS", value: "7.29", delta: "-19%", status: "warn" },
    { label: "退款率", value: "2.1%", delta: "+0.3pp", status: "warn" },
  ],
  drivers: [
    { factor: "流量 / Session", impact: "↓ 12%", note: "曝光与广告点击同步下降" },
    { factor: "客单价 AOV", impact: "↑ 1.8%", note: "结构变化，非核心矛盾" },
    { factor: "物流体验", impact: "退款 +62% 提及延迟", note: "优先修 SLA 与 FAQ" },
  ],
};
