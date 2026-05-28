export function buildRoastMessages({ title, bullets, platform }) {
  const listing = [
    `平台：${platform || "TikTok Shop"}`,
    `标题：${title || "（空）"}`,
    bullets ? `五点/描述：\n${bullets}` : "五点/描述：（未提供）",
  ].join("\n\n");

  return [
    {
      role: "system",
      content: `你是跨境电商 Listing 转化专家，风格像 TikTok 爆款拆解博主：毒舌、具体、可执行，但不人身攻击。
任务：对卖家粘贴的商品 Listing 做「公开处刑」式诊断，并给出可直接替换的优化稿。

必须只输出一个 JSON 对象，不要 markdown 代码块，格式：
{
  "score": 0-100 的整数（60 以下很差，60-75 一般，76-89 不错，90+ 优秀）,
  "verdict": "8-16 字中文判决，如「老外3秒划走」「像说明书不像卖货」",
  "hookLine": "一句话点破最大问题（20字内）",
  "roasts": ["毒舌点评1", "毒舌点评2", "毒舌点评3"],
  "fixes": ["可执行修改1", "可执行修改2", "可执行修改3"],
  "improvedTitle": "优化后的英文标题（含核心关键词）",
  "improvedBullets": ["英文 bullet 1", "英文 bullet 2", "英文 bullet 3", "英文 bullet 4", "英文 bullet 5"],
  "shareTeaser": "适合发朋友圈/卖家群的30字以内文案，带悬念"
}

规则：
- roasts 要具体指出标题/卖点/关键词/买家视角问题，禁止空泛「不够好」
- improvedBullets 5 条，符合 ${platform || "TikTok Shop"} 买家阅读习惯
- 若信息不足，在 roasts 里说明假设，仍给出可替换文案`,
    },
    {
      role: "user",
      content: listing,
    },
  ];
}

export function parseRoastJson(raw) {
  const text = String(raw || "").trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) {
    throw new Error("模型返回格式异常，请重试。");
  }
  const parsed = JSON.parse(text.slice(start, end + 1));
  const score = Math.min(100, Math.max(0, Math.round(Number(parsed.score) || 0)));
  return {
    score,
    verdict: String(parsed.verdict || "待优化").slice(0, 120),
    hookLine: String(parsed.hookLine || "").slice(0, 80),
    roasts: Array.isArray(parsed.roasts) ? parsed.roasts.map(String).slice(0, 5) : [],
    fixes: Array.isArray(parsed.fixes) ? parsed.fixes.map(String).slice(0, 5) : [],
    improvedTitle: String(parsed.improvedTitle || "").slice(0, 500),
    improvedBullets: Array.isArray(parsed.improvedBullets)
      ? parsed.improvedBullets.map(String).slice(0, 5)
      : [],
    shareTeaser: String(parsed.shareTeaser || "我的 Listing 被 AI 处刑了，分数低得不敢看…").slice(0, 120),
  };
}
