import { PAIN_SOLUTIONS } from "./data/agents";

/** 痛点 → 方案 → 结果 叙事版 · ~113s @ 30fps */
export const INTRO = 180;
export const PAIN = 240;
export const BRIDGE = 180;
export const AGENT = 330;
export const EXTENSION = 270;
export const WORKFLOW = 150;
export const PRICING = 180;
export const CTA = 210;

export const AGENTS_START = INTRO + PAIN + BRIDGE;
export const EXTENSION_START = AGENTS_START + PAIN_SOLUTIONS.length * AGENT;
export const WORKFLOW_START = EXTENSION_START + EXTENSION;
export const PRICING_START = WORKFLOW_START + WORKFLOW;
export const CTA_START = PRICING_START + PRICING;

export const PROMO_DURATION = CTA_START + CTA;
