import { VIBE_CATEGORIES, VIBE_MOODS, getCategoryById, getMoodById } from "./templates.js";

/**
 * MVP：基于文件名 / 用户提示 / 关键词启发式识别品类与推荐氛围。
 * V2 可接 Vision LLM 看图。
 *
 * @param {{ fileName?: string, productHint?: string, moodId?: string }} input
 */
export function analyzeProduct(input = {}) {
  const hint = `${input.fileName || ""} ${input.productHint || ""}`.toLowerCase();
  let matched = VIBE_CATEGORIES[0];
  let score = 0;

  for (const cat of VIBE_CATEGORIES) {
    const hits = cat.keywords.filter((kw) => hint.includes(kw.toLowerCase())).length;
    if (hits > score) {
      score = hits;
      matched = cat;
    }
  }

  const moodId = input.moodId || matched.defaultMood;
  const mood = getMoodById(moodId);
  const category = getCategoryById(matched.id);

  return {
    categoryId: category.id,
    categoryLabel: category.label,
    recommendedMoodId: mood.id,
    recommendedMoodLabel: mood.label,
    moodTagline: mood.tagline,
    confidence: score > 0 ? "medium" : "low",
    analysisNote:
      score > 0
        ? `根据素材信息识别为「${category.label}」，推荐「${mood.label}」氛围。`
        : `暂未识别具体品类，默认按「${category.label}」处理；可手动切换氛围。`,
    availableMoods: VIBE_MOODS.map((m) => ({
      id: m.id,
      label: m.label,
      tagline: m.tagline,
      accent: m.accent,
    })),
  };
}
