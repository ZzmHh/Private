import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  GlassCard,
  GradientHeadline,
  Kicker,
  PremiumShell,
  SceneFooter,
} from "../components/PremiumLayout";
import { SELLER_PAINS } from "../data/agents";

export const PainScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headIn = spring({ frame, fps, config: { damping: 200 } });

  return (
    <PremiumShell
      accent="#FF4081"
      accent2="#8A2BE2"
      footer={<SceneFooter moduleLabel="卖家痛点深度分析" step="01" total="09" />}
    >
      <div style={{ opacity: headIn }}>
        <Kicker>The Real Pain</Kicker>
        <GradientHeadline size={46}>跨境卖家的 6 个「深夜崩溃」时刻</GradientHeadline>
        <p style={{ margin: "14px 0 28px", fontSize: 19, color: "#94a3b8", maxWidth: 800 }}>
          不是不懂电商——是<strong style={{ color: "#fff" }}> 工具分散、决策靠猜、执行靠人力 </strong>
        </p>
      </div>
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gridTemplateRows: "repeat(2, 1fr)",
          gap: 16,
          alignContent: "stretch",
        }}
      >
        {SELLER_PAINS.map((item, i) => {
          const cardIn = spring({ frame: frame - 8 - i * 7, fps, config: { damping: 16, stiffness: 100 } });
          return (
            <GlassCard
              key={item.title}
              accent="#FF4081"
              style={{
                opacity: cardIn,
                transform: `translateY(${interpolate(cardIn, [0, 1], [28, 0])}px)`,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>{item.emoji}</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", marginBottom: 8 }}>{item.title}</div>
              <div style={{ fontSize: 15, color: "#fda4af", fontStyle: "italic", lineHeight: 1.45, marginBottom: 10, flex: 1 }}>
                {item.scene}
              </div>
              <div style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.45 }}>{item.detail}</div>
            </GlassCard>
          );
        })}
      </div>
    </PremiumShell>
  );
};
