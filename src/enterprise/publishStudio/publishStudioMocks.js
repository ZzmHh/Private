export const MOCK_OPPORTUNITY = {
  id: "opp_demo_001",
  title: "折叠收纳箱 · 家居收纳",
  platform: "TikTok Shop",
  market: "泰国 TH",
  category: "家居收纳",
  score: 4.2,
  signals: ["搜索趋势 ↑", "短视频带货强", "竞争中等"],
  risks: ["需验证类目资质", "注意体积重物流"],
  fromAgent: "爆款选品监控",
  createdAt: "2026-05-27 10:20",
};

export const MOCK_1688_SOURCES = [
  {
    id: "src_1688_1",
    platform: "1688",
    title: "折叠收纳箱 大号 透明可视 家用衣柜整理",
    priceCny: 18.5,
    moq: 2,
    shipFrom: "浙江义乌",
    matchScore: 92,
    image: "📦",
    tags: ["高匹配", "低 MOQ"],
  },
  {
    id: "src_1688_2",
    platform: "1688",
    title: "床底收纳抽屉 扁平 滑轮 塑料",
    priceCny: 22,
    moq: 5,
    shipFrom: "广东佛山",
    matchScore: 78,
    image: "🗄️",
    tags: ["相似款"],
  },
  {
    id: "src_1688_3",
    platform: "1688",
    title: "真空压缩袋套装 旅行收纳",
    priceCny: 12.8,
    moq: 10,
    shipFrom: "江苏南通",
    matchScore: 65,
    image: "👜",
    tags: ["低价备选"],
  },
];

export const MOCK_LISTING_PREVIEW = {
  title: "กล่องเก็บของพับได้ ขนาดใหญ่ ใสดูของได้ — Foldable Storage Box",
  bullets: [
    "พับเก็บง่าย ประหยัดพื้นที่ — ใช้ได้ทั้งตู้เสื้อผ้า ใต้เตียง",
    "วัสดุ PP แข็งแรง ทนทาน ไม่มีกลิ่น",
    "ฝาใสมองเห็นของข้างใน หยิบใช้สะดวก",
    "เหมาะกับหอพัก บ้านเช่า ครอบครัวเล็ก",
    "จัดส่งจากไทย 1–2 วันทำการ",
  ],
  keywords: "storage box, foldable, organizer, กล่องเก็บของ",
  categoryHint: "Home & Living > Storage",
  images: [
    { label: "主图 1:1", status: "ready" },
    { label: "场景图 9:16", status: "ready" },
    { label: "尺寸说明", status: "pending" },
  ],
};

export const MOCK_PUBLISH_JOBS = [
  {
    id: "job_001",
    title: "折叠收纳箱",
    shop: "TikTok Shop 泰国 · 直播店",
    status: "published",
    platformProductId: "TT-8829103",
    updatedAt: "昨天 16:42",
  },
  {
    id: "job_002",
    title: "宠物饮水机",
    shop: "Shopee 新加坡 · 主店",
    status: "review",
    platformProductId: null,
    updatedAt: "今天 09:15",
  },
  {
    id: "job_003",
    title: "榨汁杯",
    shop: "Lazada 马来 · 旗舰店",
    status: "failed",
    platformProductId: null,
    updatedAt: "今天 08:02",
    error: "类目属性「容量」缺失",
  },
];

export function mockPriceBreakdown(sourcePriceCny = 18.5) {
  const rate = 4.85;
  const intlShip = 12;
  const commission = 0.08;
  const margin = 0.35;
  const base = sourcePriceCny * rate + intlShip;
  const withFees = base / (1 - commission);
  const sale = withFees * (1 + margin);
  return {
    sourceCny: sourcePriceCny,
    rate,
    intlShip,
    commissionPct: commission * 100,
    marginPct: margin * 100,
    suggestedThb: Math.ceil(sale * 0.95),
    suggestedUsd: (sale / rate / 4.85).toFixed(2),
  };
}
