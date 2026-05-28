/** 跨境 / 电商 / 工具寻求类意图信号 */
const LeadRadarSignals = {
  INTENT: [
    { id: "tiktok_shop", label: "TikTok Shop", weight: 18, patterns: [/tiktok\s*shop/i, /tiktok开店/, /tk\s*店/] },
    { id: "cross_border", label: "跨境电商", weight: 14, patterns: [/跨境/, /出海/, /独立站/, /cross[\s-]?border/i] },
    { id: "listing", label: "Listing/转化", weight: 16, patterns: [/listing/i, /不出单/, /没转化/, /标题优化/, /主图/] },
    { id: "traffic", label: "流量痛点", weight: 15, patterns: [/没流量/, /零播放/, /播放量低/, /no views/i] },
    { id: "选品", label: "选品", weight: 14, patterns: [/选品/, /跟卖/, /爆款/, /什么好卖/] },
    { id: "客服", label: "客服压力", weight: 12, patterns: [/客服/, /售后/, /退货/, /半夜回/] },
    { id: "求工具", label: "找工具/方法", weight: 20, patterns: [/有没有工具/, /求推荐/, /怎么解决/, /带带/, /有没有大佬/, /什么软件/, /哪个平台/] },
    { id: "新手", label: "新手", weight: 13, patterns: [/刚开店/, /零基础/, /小白/, /求带/, /新手/, /刚开始/] },
    { id: "业绩", label: "业绩/广告", weight: 15, patterns: [/gmv/i, /业绩下滑/, /广告烧/, /acos/i, /roi/i, /投流/, /转化率/] },
    { id: "学习", label: "学习求助", weight: 12, patterns: [/怎么学/, /教程/, /课程/, /培训/, /有没有课/, /从哪开始/] },
    { id: "成本", label: "成本/利润", weight: 11, patterns: [/利润/, /成本/, /亏钱/, /不赚钱/, /太卷/] },
  ],
  NEGATIVE: [
    { weight: -25, patterns: [/限时\s*\d+元/, /扫码领取/, /训练营.*招生/, /代理招募/] },
    { weight: -20, patterns: [/私信领取/, /评论区扣\s*\d+/, /日入\s*\d+万/] },
    { weight: -15, patterns: [/招代理/, /躺赚/] },
  ],

  score(text) {
    const raw = String(text || "").trim();
    if (raw.length < 8) return { score: 0, hits: [], negatives: [] };
    let score = 0;
    const hits = [];
    const negatives = [];
    for (const sig of this.INTENT) {
      if (sig.patterns.some((p) => p.test(raw))) {
        score += sig.weight;
        hits.push(sig.label);
      }
    }
    for (const neg of this.NEGATIVE) {
      if (neg.patterns.some((p) => p.test(raw))) negatives.push("spam");
    }
    if (/[?？]|怎么办|如何|怎么|求助|有没有|能不能|为什么/.test(raw)) score += 8;
    if (raw.length > 40 && raw.length < 600) score += 5;
    return { score: Math.min(100, Math.max(0, score)), hits, negatives };
  },
};

if (typeof globalThis !== "undefined") globalThis.LeadRadarSignals = LeadRadarSignals;
