import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  GradientHeadline,
  Kicker,
  PremiumShell,
  SceneFooter,
} from "../components/PremiumLayout";
import { BRAND, PRICING } from "../data/agents";

export const PricingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headIn = spring({ frame, fps, config: { damping: 200 } });

  return (
    <PremiumShell
      accent={BRAND.colors.blue}
      accent2={BRAND.colors.purple}
      footer={<SceneFooter moduleLabel="订阅套餐 · 按阶段选择" />}
    >
      <div style={{ textAlign: "center", opacity: headIn }}>
        <Kicker>Pricing</Kicker>
        <GradientHeadline size={44}>灵活订阅 · 早鸟价限时开放</GradientHeadline>
        <p style={{ margin: "12px 0 36px", fontSize: 18, color: "#94a3b8" }}>
          注册即免费版 + 7 天专业版体验 · 专业版 ¥299 / 团队版 ¥699 早鸟价
        </p>
      </div>
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, alignContent: "center" }}>
        {PRICING.map((plan, i) => {
          const cardIn = spring({ frame: frame - 10 - i * 8, fps, config: { damping: 16, stiffness: 110 } });
          const isPro = plan.name === "专业版";
          return (
            <div
              key={plan.name}
              style={{
                padding: "32px 24px",
                borderRadius: 24,
                background: isPro
                  ? `linear-gradient(160deg, ${BRAND.colors.blue}44, ${BRAND.colors.purple}33)`
                  : "rgba(255,255,255,0.07)",
                border: isPro ? `2px solid ${BRAND.colors.blue}` : "1px solid rgba(255,255,255,0.12)",
                boxShadow: isPro ? `0 28px 70px ${BRAND.colors.blue}33` : "none",
                opacity: cardIn,
                transform: `translateY(${interpolate(cardIn, [0, 1], [28, 0])}px)`,
                textAlign: "center",
              }}
            >
              {isPro ? (
                <div
                  style={{
                    display: "inline-block",
                    fontSize: 11,
                    fontWeight: 900,
                    padding: "5px 12px",
                    borderRadius: 999,
                    background: `linear-gradient(135deg, ${BRAND.colors.blue}, ${BRAND.colors.purple})`,
                    color: "#fff",
                    marginBottom: 14,
                  }}
                >
                  推荐
                </div>
              ) : (
                <div style={{ height: 28 }} />
              )}
              <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", marginBottom: 12 }}>{plan.name}</div>
              <div
                style={{
                  fontSize: 38,
                  fontWeight: 900,
                  background: `linear-gradient(135deg, ${BRAND.colors.blue}, ${BRAND.colors.purple})`,
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                  marginBottom: 12,
                }}
              >
                {plan.price}
              </div>
              <div style={{ fontSize: 15, color: "#94a3b8", lineHeight: 1.5 }}>{plan.highlight}</div>
            </div>
          );
        })}
      </div>
    </PremiumShell>
  );
};
