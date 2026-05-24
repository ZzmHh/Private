/** VibeClip 品类与氛围模板（MVP 骨架） */

export const VIBE_CATEGORIES = [
  {
    id: "home_decor",
    label: "家居摆件",
    keywords: ["home", "decor", "摆件", "家居", "room", "desk", "花瓶", "香薰"],
    defaultMood: "minimal_luxury",
  },
  {
    id: "beauty",
    label: "美妆护肤",
    keywords: ["beauty", "skincare", "美妆", "护肤", "lip", "cream", "serum"],
    defaultMood: "dreamy_soft",
  },
  {
    id: "accessory",
    label: "饰品配件",
    keywords: ["jewelry", "accessory", "饰品", "项链", "ring", "earring", "phone case"],
    defaultMood: "minimal_luxury",
  },
];

export const VIBE_MOODS = [
  {
    id: "minimal_luxury",
    label: "极简高级",
    tagline: "强调质感，让人想放在显眼的位置",
    bgm: "soft_minimal_piano",
    colorGrade: "warm_beige",
    accent: "#c4a882",
    pace: "slow",
  },
  {
    id: "dreamy_soft",
    label: "梦幻治愈",
    tagline: "柔光氛围，拉停留、建信任",
    bgm: "ambient_dream",
    colorGrade: "soft_pink",
    accent: "#e8b4cb",
    pace: "medium",
  },
  {
    id: "promo_energy",
    label: "促销转化",
    tagline: "快节奏、醒目字幕，适合冲单",
    bgm: "upbeat_pop",
    colorGrade: "vivid_contrast",
    accent: "#ff6b35",
    pace: "fast",
  },
];

/** @param {string} moodId */
export function getMoodById(moodId) {
  return VIBE_MOODS.find((m) => m.id === moodId) || VIBE_MOODS[0];
}

/** @param {string} categoryId */
export function getCategoryById(categoryId) {
  return VIBE_CATEGORIES.find((c) => c.id === categoryId) || VIBE_CATEGORIES[0];
}

/**
 * @param {{ categoryId: string, moodId: string, variantIndex: number }} opts
 */
export function buildVariantCopy({ categoryId, moodId, variantIndex }) {
  const category = getCategoryById(categoryId);
  const mood = getMoodById(moodId);

  const headlines = {
    home_decor: {
      minimal_luxury: ["放在桌上，像一件小艺术品", "给房间添一抹 quietly 的高级感", "不是摆件，是日常里的仪式感"],
      dreamy_soft: ["一点光，整个角落都温柔了", "回家第一眼，就被它治愈", "慢下来，感受空间里的呼吸感"],
      promo_energy: ["今日下单，把高级感带回家", "限时福利 · 提升桌面氛围", "卖爆了：人手一件的氛围神器"],
    },
    beauty: {
      minimal_luxury: ["上脸即高级，妆面干净透亮", "护肤的尽头，是质感", "成分看得见，状态藏不住"],
      dreamy_soft: ["像被云朵轻轻包裹的肤感", "每天睡前，给自己一点温柔", "光线下，皮肤在发光"],
      promo_energy: ["今日必入 · 口碑爆款返场", "限时套装，省下一周咖啡钱", "闺蜜都在问链接的那款"],
    },
    accessory: {
      minimal_luxury: ["细节，决定整体质感", "不张扬，但一眼高级", "日常佩戴，也像精心搭配"],
      dreamy_soft: ["轻轻一点，造型就完整了", "小物件，大氛围", "适合送礼，也适合犒赏自己"],
      promo_energy: ["上新特惠 · 库存不多", "搭配神器，今日特价", "点击链接，把氛围戴在身上"],
    },
  };

  const bullets = {
    minimal_luxury: ["强调材质与光影", "适合主图视频 / 质感展示", "9:16 竖屏 · 无口播"],
    dreamy_soft: ["感官引导文案", "适合拉停留与种草", "9:16 竖屏 · 轻 BGM"],
    promo_energy: ["醒目字幕与节奏", "适合促销 / 冲转化", "9:16 竖屏 · 快节奏"],
  };

  const pool = headlines[categoryId]?.[moodId] || headlines.home_decor.minimal_luxury;
  const headline = pool[variantIndex % pool.length];

  return {
    headline,
    bullets: bullets[moodId] || bullets.minimal_luxury,
    moodLabel: mood.label,
    categoryLabel: category.label,
    bgm: mood.bgm,
    colorGrade: mood.colorGrade,
    accent: mood.accent,
    hashtags: ["#TikTokShop", "#musthave", `#${category.label.replace(/\s/g, "")}`],
    publishTitle: `${headline} · ${category.label}`,
  };
}
