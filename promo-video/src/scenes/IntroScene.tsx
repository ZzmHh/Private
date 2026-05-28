import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BrandLogo } from "../components/BrandLogo";
import {
  GlassCard,
  GradientHeadline,
  Kicker,
  PremiumShell,
  SceneFooter,
} from "../components/PremiumLayout";
import { BRAND, PLATFORMS } from "../data/agents";

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoIn = spring({ frame, fps, config: { damping: 14, stiffness: 70 } });
  const textIn = spring({ frame: frame - 12, fps, config: { damping: 200 } });

  return (
    <PremiumShell
      accent={BRAND.colors.blue}
      accent2={BRAND.colors.purple}
      footer={<SceneFooter moduleLabel="品牌介绍 · 凡梦AI" />}
    >
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 72 }}>
        <div
          style={{
            flex: 1,
            opacity: logoIn,
            transform: `scale(${interpolate(logoIn, [0, 1], [0.8, 1])})`,
            filter: `drop-shadow(0 24px 60px ${BRAND.colors.blue}66)`,
          }}
        >
          <BrandLogo height={240} />
        </div>
        <div
          style={{
            flex: 1.15,
            opacity: textIn,
            transform: `translateX(${interpolate(textIn, [0, 1], [48, 0])}px)`,
          }}
        >
          <Kicker>Cross-border AI Workbench</Kicker>
          <GradientHeadline size={58}>{BRAND.tagline}</GradientHeadline>
          <p style={{ margin: "24px 0 32px", fontSize: 24, lineHeight: 1.65, color: "#cbd5e1", maxWidth: 580 }}>
            {BRAND.sub}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {PLATFORMS.map((p, i) => {
              const chipIn = spring({ frame: frame - 24 - i * 4, fps, config: { damping: 200 } });
              return (
                <span
                  key={p}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 999,
                    fontSize: 15,
                    fontWeight: 800,
                    background: "rgba(255,255,255,0.1)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    color: "#e2e8f0",
                    opacity: chipIn,
                    transform: `translateY(${interpolate(chipIn, [0, 1], [16, 0])}px)`,
                  }}
                >
                  {p}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </PremiumShell>
  );
};
