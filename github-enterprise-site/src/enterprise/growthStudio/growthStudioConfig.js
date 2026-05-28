export const growthStudio = {
  id: "growth",
  brandTitle: "业绩诊断",
  brandSubtitle: "Growth Studio",
  brandMark: "GR",
  intro:
    "连接 TikTok 插件快照 + 经营 CSV，输出 KPI 异常、归因假设与 P0/P1 动作清单。建议诊断包 ≥2/4 再运行。",
  groups: [
    {
      id: "data",
      label: "数据基础",
      defaultOpen: true,
      tools: [
        {
          id: "connect",
          name: "数据连接",
          desc: "插件同步状态、诊断包进度、CSV 导入。",
          panelHint: "先凑齐数据，再运行业绩诊断；CSV 两周期可自动算环比。",
        },
        {
          id: "kpi",
          name: "KPI 看板",
          desc: "GMV、转化、广告、退款等核心指标与驱动因素。",
          panelHint: "基于最近导入 CSV 或规则预计算的 KPI 摘要。",
        },
      ],
    },
    {
      id: "analyze",
      label: "诊断分析",
      defaultOpen: true,
      tools: [
        {
          id: "diagnose",
          name: "运行业绩诊断",
          desc: "AI 结合快照与 CSV，生成结构化报告与动作清单。",
          panelHint: "左侧配置周期与关注点，右侧查看诊断报告。",
        },
        {
          id: "actions",
          name: "动作跟踪",
          desc: "最近一次诊断的 P0/P1 待办，便于团队执行。",
          panelHint: "按优先级排列的可执行动作，可对照 KPI 看板验证效果。",
        },
      ],
    },
  ],
};

export function defaultGrowthToolId() {
  return growthStudio.groups[0]?.tools[0]?.id || "connect";
}

export function findGrowthTool(toolId) {
  for (const group of growthStudio.groups) {
    const hit = group.tools.find((t) => t.id === toolId);
    if (hit) return hit;
  }
  return growthStudio.groups[0]?.tools[0] || null;
}
