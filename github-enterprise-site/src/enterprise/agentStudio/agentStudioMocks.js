export function mockListingResult(mockKey, shared) {
  const product = shared.product || "Pet Water Fountain";
  const mocks = {
    title: {
      type: "listing-titles",
      items: [
        {
          text: `Ultra-Quiet Pet Water Fountain — 2.5L Automatic Dispenser for Cats & Dogs`,
          chars: 72,
          note: "核心词前置：Pet Water Fountain / Automatic",
        },
        {
          text: `2.5L Cat Water Fountain with Triple Filter — Whisper-Quiet Pump, BPA-Free Bowl`,
          chars: 78,
          note: "规格 + 信任：Triple Filter / BPA-Free",
        },
        {
          text: `Automatic Dog & Cat Fountain 2.5L — Fresh Water 7 Days, Easy-Clean Design`,
          chars: 74,
          note: "利益点：Fresh Water 7 Days",
        },
      ],
    },
    bullets: {
      type: "listing-bullets",
      items: [
        "Whisper-quiet pump (<40dB) keeps anxious pets calm — ideal for bedrooms & apartments",
        "Triple filtration system delivers fresh, great-tasting water for up to 7 days",
        "Generous 2.5L capacity means fewer refills for multi-pet households",
        "BPA-free bowl & dishwasher-safe parts for easy daily maintenance",
        "US plug, stable base & 12-month warranty — ready to use out of the box",
      ],
    },
    keywords: {
      type: "listing-keywords",
      core: ["pet fountain", "cat water dispenser", "dog water fountain", "automatic pet fountain", "2.5L"],
      longTail: [
        "quiet cat fountain",
        "pet water fountain filter",
        "automatic dog bowl",
        "cat drinking fountain indoor",
        "BPA free pet fountain",
        "large capacity pet fountain",
        "fountain for multiple cats",
      ],
      avoid: ["best", " #1 ", " cure "],
      charEstimate: "~480 / 500",
    },
    faq: {
      type: "listing-faq",
      faqs: [
        { q: "Is the pump noisy?", a: "The pump runs under 40dB — quieter than most refrigerators." },
        { q: "How often should I change the filter?", a: "We recommend every 2–4 weeks depending on pet count." },
        { q: "Is it BPA-free?", a: "Yes, the bowl and drinking components are BPA-free." },
        { q: "What plug type?", a: "US standard plug; 110–120V." },
        { q: "Can multiple pets use it?", a: "Yes, the 2.5L capacity suits 2–3 cats or small dogs." },
      ],
      compliance: [
        "核实 BPA-free / 材质声明是否有检测报告",
        "若宣传「7 天 fresh water」需有过滤逻辑依据",
        "保修条款需与店铺政策一致",
        "宠物类注意平台禁止医疗/治疗宣称",
      ],
    },
    full: {
      type: "listing-full",
      title: mockListingResult("title", shared),
      bullets: mockListingResult("bullets", shared),
      keywords: mockListingResult("keywords", shared),
      faq: mockListingResult("faq", shared),
    },
  };
  return mocks[mockKey] || { type: "raw", text: `演示输出：${product}` };
}

export function mockContentResult(mockKey, shared) {
  const product = shared.product || "Portable Blender";
  const mocks = {
    hooks: {
      type: "content-hooks",
      items: [
        { type: "痛点", text: "Still skipping breakfast because you're 'too busy'?", shot: "通勤赶时间特写" },
        { type: "对比", text: "Bulky blender vs this — fits in your gym bag.", shot: "分屏对比" },
        { type: "场景", text: "Office lunch hack in 30 seconds.", shot: "工位制作" },
        { type: "反常识", text: "I stopped buying $8 smoothies.", shot: "便利店价签对比" },
        { type: "社交证明", text: "2M views can't be wrong — here's why.", shot: "播放量 overlay" },
      ],
    },
    scripts: {
      type: "content-scripts",
      items: [
        {
          title: "脚本 A · 痛点通勤",
          hook: "No time for breakfast?",
          body: "Watch this — fruit in, 30 seconds, fresh juice at your desk. USB charge, one-button clean. Link in bio.",
          shots: "Opening: tired face → cup demo → sip smile → CTA",
        },
        {
          title: "脚本 B · 健身房",
          hook: "Post-workout fuel without the mess.",
          body: "Protein + banana in the portable blender. Quiet motor, no chunks. Gym bag essential.",
          shots: "Gym locker → blend → drink → pack away",
        },
        {
          title: "脚本 C · 对比",
          hook: "Stop overpaying for smoothies.",
          body: "This $29 cup vs $8 daily drinks — math checks out in a week.",
          shots: "Receipt stack → product hero → math text overlay",
        },
      ],
    },
    storyboard: {
      type: "content-storyboard",
      shots: [
        { t: "0–2s", visual: "Hook 字幕 + 痛点特写", vo: "No time for breakfast?", sub: "NO TIME?" },
        { t: "2–6s", visual: "水果入杯、一键启动", vo: "30 seconds. That's it.", sub: "30 SEC" },
        { t: "6–10s", visual: "成品特写、喝一口", vo: "Fresh juice anywhere.", sub: "FRESH ✓" },
        { t: "10–13s", visual: "USB 充电、易拆洗", vo: "Charges anywhere. Cleans in seconds.", sub: "" },
        { t: "13–15s", visual: "CTA + 价格锚点", vo: "Link below — thank me later.", sub: "SHOP NOW" },
      ],
    },
    voiceover: {
      type: "content-voiceover",
      items: [
        {
          label: "版本 A · 15s",
          text: "Mornings are chaos. This portable blender changed that — fruit in, thirty seconds, done. USB rechargeable, fits any bag. Tap the link.",
          estSec: 14,
        },
        {
          label: "版本 B · 20s",
          text: "I used to skip breakfast or overpay for smoothies. Not anymore. One button, fresh juice at my desk or after the gym. Easy to clean. Check the link.",
          estSec: 18,
        },
      ],
    },
    brief: {
      type: "content-brief",
      sections: [
        {
          title: "背景",
          body: `推广 ${product}，面向 TikTok 18–28 健身/通勤人群，真实 UGC 感，避免过度广告腔。`,
        },
        {
          title: "必拍镜头",
          body: "① 开场 3 秒钩子（痛点脸/对比）② 30 秒制作过程 ③ 成品饮用 ④ 便携/充电细节 ⑤ CTA 口播",
        },
        {
          title: "话术要点",
          body: "强调 30 秒、USB、易清洗；可提价格优势但勿虚假对比",
        },
        {
          title: "禁忌",
          body: "禁止医疗宣称、禁止未授权品牌、禁止绝对化「最好/第一」",
        },
        {
          title: "交付",
          body: "9:16 · 15–30s · MP4 · 1 条成片 + 3 条 raw clips · 3 日内交付",
        },
      ],
    },
    batch: {
      type: "content-batch",
      rows: [
        ["通勤痛点", "30 秒办公室出汁", "Link — breakfast solved"],
        ["健身场景", "蛋白+水果 post-workout", "Gym bag essential"],
        ["价格对比", "$8/天 vs 一台杯", "Pays for itself"],
        ["清洗演示", "5 秒拆洗", "No excuse not to use"],
        ["送礼场景", "闺蜜礼物", "Gift that gets used"],
      ],
      columns: ["角度", "Hook + 卖点", "CTA"],
    },
  };
  return mocks[mockKey] || { type: "raw", text: `演示：${product} · ${mockKey}` };
}

export function mockAgentResult(studioId, mockKey, shared) {
  if (studioId === "listing") return mockListingResult(mockKey, shared);
  return mockContentResult(mockKey, shared);
}
