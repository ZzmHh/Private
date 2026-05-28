import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BrandLogo } from "../components/BrandLogo";
import { GradientHeadline, PremiumShell, SceneFooter } from "../components/PremiumLayout";
import { BRAND } from "../data/agents";

export const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const mainIn = spring({ frame, fps, config: { damping: 14, stiffness: 80 } });
  const btnScale = interpolate(Math.sin(frame / 10), [-1, 1], [0.97, 1.05]);

  return (
    <PremiumShell
      accent={BRAND.colors.blue}
      accent2={BRAND.colors.pink}
      footer={<SceneFooter moduleLabel="立即体验凡梦AI" />}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          opacity: mainIn,
          transform: `scale(${interpolate(mainIn, [0, 1], [0.9, 1])})`,
        }}
      >
        <div style={{ filter: `drop-shadow(0 32px 80px ${BRAND.colors.blue}55)` }}>
          <BrandLogo height={180} />
        </div>
        <div style={{ marginTop: 36, marginBottom: 20 }}>
          <GradientHeadline size={52}>让 AI 成为您的跨境运营团队</GradientHeadline>
        </div>
        <p style={{ margin: "0 0 40px", fontSize: 22, color: "#94a3b8", maxWidth: 780, lineHeight: 1.65 }}>
          选品 · 内容 · Listing · 业绩诊断 · 客服话术 · 广告库存利润
          <br />
          <strong style={{ color: "#fff" }}>免费注册</strong> · 7 天专业版全功能 · TikTok 插件即装即用
        </p>
        <div
          style={{
            transform: `scale(${btnScale})`,
            padding: "22px 64px",
            borderRadius: 999,
            background: `linear-gradient(135deg, ${BRAND.colors.blue}, ${BRAND.colors.purple})`,
            color: "#fff",
            fontSize: 28,
            fontWeight: 900,
            boxShadow: `0 24px 60px ${BRAND.colors.blue}55, 0 0 80px ${BRAND.colors.purple}33`,
            border: "1px solid rgba(255,255,255,0.25)",
          }}
        >
          立即体验凡梦AI →
        </div>
        <div style={{ marginTop: 32, fontSize: 15, color: "#64748b", letterSpacing: "0.25em", fontWeight: 700 }}>
          {BRAND.nameEn}
        </div>
      </div>
    </PremiumShell>
  );
};
