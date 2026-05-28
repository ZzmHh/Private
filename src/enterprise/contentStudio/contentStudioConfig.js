import {
  DEFAULT_SEA_MARKET,
  DEFAULT_WORKBENCH_PLATFORM,
  SEA_MARKET_OPTIONS,
  WORKBENCH_PLATFORM_OPTIONS,
} from "../config/workbenchScopeOptions.js";

const CONTENT_PLATFORMS = WORKBENCH_PLATFORM_OPTIONS.map((p) => ({ value: p.value, label: p.label }));

const AUDIENCE_PRESETS = [
  { value: "gen-z", label: "Z 世代 18–24" },
  { value: "millennial", label: "千禧 25–34" },
  { value: "parent", label: "宝妈/家庭" },
  { value: "fitness", label: "健身人群" },
  { value: "pet", label: "宠物主" },
  { value: "custom", label: "自定义（见补充说明）" },
];

export const contentStudio = {
  id: "content",
  agentId: "content",
  brandTitle: "爆款内容生成",
  brandSubtitle: "Content Studio",
  brandMark: "CT",
  intro: "从 Hook → 脚本 → 分镜 → 达人 Brief 分步产出；左侧填 brief，右侧预览可复制给剪辑/达人。",
  sharedFields: [
    {
      key: "platform",
      label: "电商平台",
      type: "select",
      options: CONTENT_PLATFORMS,
      default: DEFAULT_WORKBENCH_PLATFORM,
    },
    {
      key: "market",
      label: "市场",
      type: "select",
      options: SEA_MARKET_OPTIONS.map((m) => ({ value: m.value, label: m.label })),
      default: DEFAULT_SEA_MARKET,
    },
    {
      key: "product",
      label: "商品 / 主题",
      type: "text",
      placeholder: "例如：便携式榨汁杯、宠物自动饮水机",
      required: true,
    },
    {
      key: "audience",
      label: "目标人群",
      type: "select",
      options: AUDIENCE_PRESETS,
      default: "gen-z",
    },
    {
      key: "sellingPoints",
      label: "核心卖点（可选）",
      type: "textarea",
      rows: 2,
      placeholder: "例如：30 秒出汁、USB 充电、易清洗",
    },
    {
      key: "notes",
      label: "补充说明（可选）",
      type: "textarea",
      rows: 2,
      placeholder: "内容调性、禁用表述、参考账号风格…",
    },
  ],
  groups: [
    {
      id: "create",
      label: "内容生产",
      defaultOpen: true,
      tools: [
        {
          id: "hooks",
          name: "Hook 库",
          desc: "3 秒钩子文案，痛点/对比/场景型。",
          panelHint: "生成 5–8 条开场 Hook，标注类型与适用镜头。",
          mockKey: "hooks",
          taskInstruction: "只输出 Hook 库：5–8 条 3 秒内开场文案，标注类型（痛点/对比/场景/反常识）。",
          toolFields: [
            {
              key: "hookLang",
              label: "口播语言",
              type: "select",
              options: [
                { value: "en", label: "English" },
                { value: "zh", label: "中文" },
                { value: "bilingual", label: "中英双语" },
              ],
              default: "en",
            },
          ],
        },
        {
          id: "scripts",
          name: "短视频脚本",
          desc: "15–30 秒竖屏卖货脚本，含口播与字幕提示。",
          panelHint: "完整脚本结构：Hook → 展示 → 卖点 → CTA。",
          mockKey: "scripts",
          taskInstruction: "输出 3 条完整短视频脚本（15–30 秒），含口播、画面描述、字幕要点。",
          toolFields: [
            {
              key: "duration",
              label: "时长",
              type: "select",
              options: [
                { value: "15", label: "15 秒" },
                { value: "30", label: "30 秒" },
                { value: "60", label: "60 秒" },
              ],
              default: "15",
            },
            {
              key: "format",
              label: "形式",
              type: "select",
              options: [
                { value: "ugc", label: "UGC 真实感" },
                { value: "demo", label: "产品演示" },
                { value: "story", label: "故事/vlog" },
              ],
              default: "ugc",
            },
          ],
        },
        {
          id: "storyboard",
          name: "分镜表",
          desc: "按秒级分镜，方便拍摄/剪辑执行。",
          panelHint: "表格化：时间轴 · 画面 · 口播 · 字幕 · 素材备注。",
          mockKey: "storyboard",
          taskInstruction: "输出分镜表：按时间轴（秒）列出画面、口播、字幕、所需素材/B-roll 备注。",
          toolFields: [
            {
              key: "duration",
              label: "总时长",
              type: "select",
              options: ["15", "30", "45"],
              default: "15",
            },
          ],
        },
        {
          id: "voiceover",
          name: "口播文案",
          desc: "纯口播文本，可按 120/150 字每分钟估算时长。",
          panelHint: "适合配音或 AI 口播；标注预估秒数。",
          mockKey: "voiceover",
          taskInstruction: "输出 2–3 版口播纯文本，标注预估时长（按 150 词/分钟或 220 字/分钟）。",
          toolFields: [
            {
              key: "voiceLang",
              label: "语言",
              type: "select",
              options: [
                { value: "en", label: "English" },
                { value: "zh", label: "中文" },
              ],
              default: "en",
            },
            { key: "cta", label: "CTA 目标", type: "text", placeholder: "点击链接 / 加购 / 关注", default: "点击链接购买" },
          ],
        },
        {
          id: "brief",
          name: "达人 Brief",
          desc: "给 KOL/UGC 达人的执行 brief（必拍清单 + 禁忌）。",
          panelHint: "含拍摄要求、交付规格、话术边界。",
          mockKey: "brief",
          taskInstruction:
            "输出达人 Brief：背景、必拍镜头清单、话术要点、禁忌、交付规格（画幅/时长/格式）、Timeline。",
          toolFields: [
            {
              key: "deliverable",
              label: "交付数量",
              type: "select",
              options: [
                { value: "1", label: "1 条成片" },
                { value: "3", label: "3 条变体" },
                { value: "5", label: "5 条混剪素材" },
              ],
              default: "1",
            },
          ],
        },
        {
          id: "batch",
          name: "批量变体",
          desc: "同一商品多条角度变体，便于矩阵测试。",
          panelHint: "输出 5 条不同切入点的 15 秒脚本摘要。",
          mockKey: "batch",
          taskInstruction: "输出 5 条内容变体：每条含 Hook + 核心卖点 + CTA 一行摘要，角度互不重复。",
          toolFields: [
            {
              key: "angles",
              label: "切入角度",
              type: "select",
              options: [
                { value: "auto", label: "AI 自动分配" },
                { value: "pain", label: "痛点为主" },
                { value: "social", label: "社交证明为主" },
              ],
              default: "auto",
            },
          ],
        },
      ],
    },
  ],
};

export function defaultContentToolId() {
  return contentStudio.groups[0]?.tools[0]?.id || "hooks";
}

export function findContentTool(toolId) {
  for (const g of contentStudio.groups) {
    const hit = g.tools.find((t) => t.id === toolId);
    if (hit) return hit;
  }
  return contentStudio.groups[0]?.tools[0];
}
