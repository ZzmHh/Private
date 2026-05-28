import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  GlassCard,
  GradientHeadline,
  Kicker,
  PremiumShell,
  SceneFooter,
} from "../components/PremiumLayout";
import { AUTOPILOT, BRAND, PROMO_AGENTS } from "../data/agents";

export const OverviewScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headIn = spring({ frame, fps, config: { damping: 200 } });

  return (
    <PremiumShell
      accent={BRAND.colors.blue}
      accent2={BRAND.colors.purple}
      footer={<SceneFooter moduleLabel="产品全景 · 6 大模块一览" step="02" total="08" />}
    >
      <div style={{ opacity: headIn }}>
        <Kicker>Product Overview</Kicker>
        <GradientHeadline size={48}>
          一个工作台 · 六大模块 · 专注 TikTok Shop
        </GradientHeadline>
      </div>
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gridTemplateRows: "repeat(2, 1fr)",
          gap: 16,
          marginTop: 28,
          alignContent: "stretch",
        }}
      >
        {PROMO_AGENTS.map((a, i) => {
          const in_ = spring({ frame: frame - 8 - i * 6, fps, config: { damping: 16, stiffness: 120 } });
          return (
            <div
              key={a.id}
              style={{
                padding: "22px 24px",
                borderRadius: 20,
                background: `linear-gradient(145deg, ${a.accent}33, rgba(255,255,255,0.06))`,
                border: `1px solid ${a.accent}55`,
                boxShadow: `0 16px 40px ${a.accent}22`,
                opacity: in_,
                transform: `scale(${interpolate(in_, [0, 1], [0.88, 1])})`,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 900, color: a.accent, letterSpacing: "0.1em", marginBottom: 8 }}>
                {a.tagline}
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>{a.name}</div>
              <div style={{ fontSize: 14, color: "#94a3b8", marginTop: 6, lineHeight: 1.4 }}>{a.desc.slice(0, 42)}…</div>
            </div>
          );
        })}
      </div>
      <GlassCard accent={BRAND.colors.blue} style={{ marginTop: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ fontSize: 40 }}>⚡</div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#fff", marginBottom: 6 }}>{AUTOPILOT.title}</div>
            <div style={{ fontSize: 17, color: "#94a3b8", lineHeight: 1.5 }}>{AUTOPILOT.desc}</div>
            <div style={{ marginTop: 8, fontSize: 13, color: "#64748b" }}>※ {AUTOPILOT.note}</div>
          </div>
        </div>
      </GlassCard>
    </PremiumShell>
  );
};
