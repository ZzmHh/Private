export const profitStudio = {
  id: "profit",
  brandTitle: "广告库存利润",
  brandSubtitle: "Profit Studio",
  brandMark: "PF",
  intro:
    "插件抓广告花费与库存样本；精确毛利需 SKU 成本 CSV。先看清广告效率与库存风险，再跑利润精算。",
  groups: [
    {
      id: "data",
      label: "数据基础",
      defaultOpen: true,
      tools: [
        {
          id: "connect",
          name: "数据连接",
          desc: "诊断包、SKU 成本 CSV、插件同步指引。",
          panelHint: "精算模式 = 广告/库存快照 + SKU 成本表。",
        },
        {
          id: "cost",
          name: "SKU 成本",
          desc: "成本模板下载、CSV 导入、手工补录说明。",
          panelHint: "插件无法读取采购价；成本是算毛利的前提。",
        },
      ],
    },
    {
      id: "analyze",
      label: "分析模块",
      defaultOpen: true,
      tools: [
        {
          id: "ads",
          name: "广告效率",
          desc: "花费、ROAS、ACOS 与停投/加码建议。",
          panelHint: "按 SKU / 广告组查看效率，识别烧钱款与可放量款。",
        },
        {
          id: "inventory",
          name: "库存周转",
          desc: "可售天数、断货与滞销 SKU 清单。",
          panelHint: "结合 7 日销量估算可售天数，输出补货/减采优先级。",
        },
        {
          id: "profit-run",
          name: "利润精算",
          desc: "趋势 / 精算 / 框架三模式，输出综合建议。",
          panelHint: "左侧选模式与成本表，右侧查看利润倾向报告。",
        },
      ],
    },
  ],
};

export function defaultProfitToolId() {
  return profitStudio.groups[0]?.tools[0]?.id || "connect";
}

export function findProfitTool(toolId) {
  for (const group of profitStudio.groups) {
    const hit = group.tools.find((t) => t.id === toolId);
    if (hit) return hit;
  }
  return profitStudio.groups[0]?.tools[0] || null;
}
