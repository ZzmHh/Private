import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  GlassCard,
  GradientHeadline,
  Kicker,
  PremiumShell,
  SceneFooter,
} from "../components/PremiumLayout";
import { BRAND, POWER_HIGHLIGHTS } from "../data/agents";

export const BridgeScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headIn = spring({ frame, fps, config: { damping: 200 } });

  return (
    <PremiumShell
      accent={BRAND.colors.blue}
      accent2={BRAND.colors.purple}
      footer={<SceneFooter moduleLabel="凡梦AI · 痛点 → 方案 一一对应" step="02" total="09" />}
    >
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
        <div style={{ opacity: headIn, transform: `scale(${interpolate(headIn, [0, 1], [0.92, 1])})` }}>
          <Kicker>The Solution</Kicker>
          <GradientHeadline size={54}>一个平台 · 精准击破每个痛点</GradientHeadline>
          <p style={{ margin: "20px auto 48px", fontSize: 22, color: "#cbd5e1", maxWidth: 720, lineHeight: 1.6 }}>
            {BRAND.name} 不是又一个 ChatGPT 壳——<br />
            是<strong style={{ color: "#fff" }}> 6 个专业 Agent + TikTok 插件 + 一键运营 </strong>组成的 AI 团队
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, width: "100%", maxWidth: 1100 }}>
          {POWER_HIGHLIGHTS.map((h, i) => {
            const cardIn = spring({ frame: frame - 14 - i * 8, fps, config: { damping: 16, stiffness: 110 } });
            return (
              <GlassCard
                key={h.label}
                accent={BRAND.colors.blue}
                style={{
                  textAlign: "center",
                  opacity: cardIn,
                  transform: `translateY(${interpolate(cardIn, [0, 1], [24, 0])}px)`,
                }}
              >
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 900,
                    background: `linear-gradient(135deg, ${BRAND.colors.blue}, ${BRAND.colors.purple})`,
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                    marginBottom: 8,
                  }}
                >
                  {h.label}
                </div>
                <div style={{ fontSize: 15, color: "#94a3b8", lineHeight: 1.45 }}>{h.desc}</div>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </PremiumShell>
  );
};
