/** 智能客服 Studio · 工具导航 */

export const csStudio = {
  id: "service",
  brandTitle: "智能客服",
  brandSubtitle: "AI 客服工作台",
  intro:
    "真实回复在 TikTok 插件或店铺 API 发送；此处用于配置、演练、会话审核与数据看板。",
  groups: [
    {
      id: "session",
      label: "会话处理",
      defaultOpen: true,
      tools: [
        {
          id: "drill",
          name: "离线演练",
          desc: "粘贴买家消息，测试 FAQ / 分层 AI / 夜间路由，不消耗额度。",
          ready: true,
          panelHint: "左侧填写参数，右侧查看路由层级与建议回复。",
        },
        {
          id: "sessions",
          name: "会话流水",
          desc: "查看买家消息、AI 如何路由与生成回复（插件 / 店铺 API / 演练）。",
          ready: true,
          panelHint: "左侧会话列表，右侧查看完整买家消息与 AI 路由过程。",
        },
      ],
    },
    {
      id: "kb",
      label: "知识库",
      defaultOpen: true,
      tools: [
        {
          id: "faq",
          name: "FAQ 模板",
          desc: "按店铺维护触发词与回复，支持多语言与 CSV 导入。",
          ready: true,
          panelHint: "维护触发词与自动回复模板，支持多语言与 CSV 批量导入。",
        },
        {
          id: "faq-ai",
          name: "AI 生成 FAQ",
          desc: "插件同步商品/物流页后，AI 批量生成 FAQ 草稿。",
          ready: true,
          panelHint: "基于插件同步的店铺素材，AI 批量生成 FAQ 草稿供审核启用。",
        },
      ],
    },
    {
      id: "auto",
      label: "自动化",
      defaultOpen: false,
      tools: [
        {
          id: "rules",
          name: "规则与夜间",
          desc: "FAQ 自动发、售后告警、白天信任 AI、夜间就绪评估。",
          ready: true,
          panelHint: "配置自动发送策略、夜间 AI 与多语言兜底模板。",
        },
      ],
    },
    {
      id: "ops",
      label: "运营数据",
      defaultOpen: false,
      tools: [
        {
          id: "alerts",
          name: "待处理告警",
          desc: "售后类会话告警，插件 / Webhook 处理后汇总到此。",
          ready: true,
          panelHint: "售后类、需人工介入的会话汇总与处理。",
        },
        {
          id: "analytics",
          name: "数据看板",
          desc: "FAQ 命中率、夜间 AI 占比、按日路由分布。",
          ready: true,
          panelHint: "FAQ 命中率、自动发送率、语言分布与按日趋势。",
        },
      ],
    },
  ],
};

export function defaultCsToolId() {
  return csStudio.groups[0]?.tools[0]?.id || "drill";
}

export function findCsTool(toolId) {
  for (const group of csStudio.groups) {
    const hit = group.tools.find((t) => t.id === toolId);
    if (hit) return hit;
  }
  return csStudio.groups[0]?.tools[0] || null;
}
