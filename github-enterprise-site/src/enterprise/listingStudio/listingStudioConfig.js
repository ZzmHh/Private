import {
  DEFAULT_SEA_MARKET,
  DEFAULT_WORKBENCH_PLATFORM,
  SEA_MARKET_OPTIONS,
  WORKBENCH_PLATFORM_OPTIONS,
} from "../config/workbenchScopeOptions.js";

const PLATFORMS = WORKBENCH_PLATFORM_OPTIONS.map((p) => ({ value: p.value, label: p.label }));
const MARKETS = SEA_MARKET_OPTIONS.map((m) => ({ value: m.value, label: m.label }));

const TONE_OPTIONS = [
  { value: "professional", label: "专业可信" },
  { value: "friendly", label: "亲和种草" },
  { value: "promo", label: "促销紧迫" },
];

export const listingStudio = {
  id: "listing",
  agentId: "listing",
  brandTitle: "Listing 转化优化",
  brandSubtitle: "Listing Studio",
  brandMark: "LS",
  intro: "按模块打磨标题、五点、关键词与 FAQ；左侧填商品信息，右侧预览可复制。生成后请人工合规复核。",
  sharedFields: [
    {
      key: "platform",
      label: "目标平台",
      type: "select",
      options: PLATFORMS,
      default: DEFAULT_WORKBENCH_PLATFORM,
    },
    {
      key: "market",
      label: "市场",
      type: "select",
      options: MARKETS,
      default: DEFAULT_SEA_MARKET,
    },
    {
      key: "product",
      label: "商品名称",
      type: "text",
      placeholder: "例如：Ultra-Quiet Pet Water Fountain 2.5L",
      required: true,
    },
    {
      key: "sku",
      label: "SKU（可选）",
      type: "text",
      placeholder: "店铺 SKU",
    },
    {
      key: "existing",
      label: "现有 Listing / 竞品参考（可选）",
      type: "textarea",
      rows: 4,
      placeholder: "粘贴当前标题、五点或竞品 Listing…",
    },
    {
      key: "notes",
      label: "补充说明（可选）",
      type: "textarea",
      rows: 2,
      placeholder: "类目限制、禁用词、主打卖点、目标人群…",
    },
  ],
  groups: [
    {
      id: "blocks",
      label: "Listing 模块",
      defaultOpen: true,
      tools: [
        {
          id: "title",
          name: "标题实验室",
          desc: "3–5 条高转化标题候选，含字符数与埋词说明。",
          panelHint: "生成可 A/B 测试的标题变体，遵守平台字符限制。",
          mockKey: "title",
          taskInstruction:
            "只输出标题模块：3–5 个标题候选（标注预估字符数），说明核心埋词与差异化角度。不要输出五点或关键词。",
          toolFields: [
            {
              key: "titleStyle",
              label: "标题策略",
              type: "select",
              options: [
                { value: "keyword-front", label: "前置核心词" },
                { value: "benefit-led", label: "利益点驱动" },
                { value: "brand-neutral", label: "白牌/generic 友好" },
              ],
              default: "keyword-front",
            },
            { key: "maxLen", label: "字符上限", type: "select", options: ["200", "150", "80"], default: "200" },
          ],
        },
        {
          id: "bullets",
          name: "五点与卖点",
          desc: "结构化五点描述 + 卖点层次（功能/场景/信任）。",
          panelHint: "按平台规范输出 5 条 bullet，避免绝对化用语。",
          mockKey: "bullets",
          taskInstruction:
            "只输出五点描述（Bullet Points）：5 条，每条独立价值点，首词大写规范，避免违禁绝对化表述。",
          toolFields: [
            {
              key: "tone",
              label: "语气",
              type: "select",
              options: TONE_OPTIONS,
              default: "professional",
            },
            {
              key: "focus",
              label: "侧重",
              type: "select",
              options: [
                { value: "features", label: "功能参数" },
                { value: "scenario", label: "使用场景" },
                { value: "trust", label: "信任背书" },
                { value: "mixed", label: "混合（推荐）" },
              ],
              default: "mixed",
            },
          ],
        },
        {
          id: "keywords",
          name: "后台关键词",
          desc: "Search Terms / 后台词组，区分核心词与长尾。",
          panelHint: "输出可粘贴后台的 keyword 块，标注字符占用。",
          mockKey: "keywords",
          taskInstruction:
            "只输出后台搜索词：核心词 5–8 个、长尾词 10–15 个、否定/避免词（如有）；标注总字符估算。",
          toolFields: [
            {
              key: "lang",
              label: "语言",
              type: "select",
              options: [
                { value: "en", label: "English" },
                { value: "de", label: "Deutsch" },
                { value: "es", label: "Español" },
              ],
              default: "en",
            },
          ],
        },
        {
          id: "faq",
          name: "FAQ 与合规",
          desc: "买家常问 FAQ + 平台合规提醒清单。",
          panelHint: "生成 FAQ 问答对，并列出需人工确认的合规点。",
          mockKey: "faq",
          taskInstruction:
            "输出：① 5–8 组买家 FAQ（Q&A）；② 合规检查清单（材质声明、认证、尺寸、保修等需人工核实项）。",
          toolFields: [
            {
              key: "market",
              label: "站点法规侧重",
              type: "select",
              options: [
                { value: "us", label: "美国（FCC/CPSIA 等）" },
                { value: "eu", label: "欧盟（CE/REACH）" },
                { value: "uk", label: "英国" },
                { value: "general", label: "通用" },
              ],
              default: "us",
            },
          ],
        },
        {
          id: "full",
          name: "完整 Listing 包",
          desc: "一次生成标题 + 五点 + 关键词 + FAQ 全套草稿。",
          panelHint: "适合新品上架；各模块可在左侧单独微调后重跑。",
          mockKey: "full",
          taskInstruction:
            "输出完整 Listing 包：标题 3 条、五点 5 条、后台关键词、FAQ 5 组、合规备注。分节清晰。",
          toolFields: [
            {
              key: "tone",
              label: "整体语气",
              type: "select",
              options: TONE_OPTIONS,
              default: "professional",
            },
          ],
        },
      ],
    },
  ],
};

export function defaultListingToolId() {
  return listingStudio.groups[0]?.tools[0]?.id || "title";
}

export function findListingTool(toolId) {
  for (const g of listingStudio.groups) {
    const hit = g.tools.find((t) => t.id === toolId);
    if (hit) return hit;
  }
  return listingStudio.groups[0]?.tools[0];
}
