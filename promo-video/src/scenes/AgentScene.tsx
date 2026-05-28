import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  GlassCard,
  GradientHeadline,
  Kicker,
  PremiumShell,
  SceneFooter,
} from "../components/PremiumLayout";
import { PAIN_SOLUTIONS } from "../data/agents";

type Props = { agentIndex: number };

/** 痛点 → 凡梦解法 → 强大结果 三段式 */
export const AgentScene: React.FC<Props> = ({ agentIndex }) => {
  const item = PAIN_SOLUTIONS[agentIndex];
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const stepNum = String(agentIndex + 3).padStart(2, "0");

  const painIn = spring({ frame, fps, config: { damping: 200 } });
  const solutionIn = spring({ frame: frame - 12, fps, config: { damping: 200 } });
  const resultIn = spring({ frame: frame - 24, fps, config: { damping: 16, stiffness: 90 } });

  return (
    <PremiumShell
      accent={item.accent}
      accent2="#8A2BE2"
      variant="agent"
      footer={
        <SceneFooter
          moduleLabel={`${item.agentName} · 痛点击破`}
          step={stepNum}
          total="09"
        />
      }
    >
      <div style={{ marginBottom: 16 }}>
        <Kicker>{item.agentTagline} · {item.agentName}</Kicker>
        <GradientHeadline size={40}>痛点 → 方案 → 结果</GradientHeadline>
      </div>

      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1.15fr 1fr", gap: 24, alignItems: "stretch" }}>
        {/* 痛点 */}
        <div
          style={{
            opacity: painIn,
            transform: `translateX(${interpolate(painIn, [0, 1], [-24, 0])}px)`,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 900, color: "#fda4af", letterSpacing: "0.1em", marginBottom: 12 }}>
            😰 卖家困境
          </div>
          <GlassCard accent="#FF4081" style={{ flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", marginBottom: 12 }}>{item.painTitle}</div>
            <div style={{ fontSize: 16, color: "#fda4af", fontStyle: "italic", lineHeight: 1.5, marginBottom: 14 }}>
              「{item.painScene}」
            </div>
            <div style={{ fontSize: 15, color: "#94a3b8", lineHeight: 1.55 }}>{item.painDetail}</div>
          </GlassCard>
        </div>

        {/* 凡梦解法 — 中间最大 */}
        <div
          style={{
            opacity: solutionIn,
            transform: `scale(${interpolate(solutionIn, [0, 1], [0.94, 1])})`,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 900, color: item.accent, letterSpacing: "0.1em", marginBottom: 12 }}>
            ⚡ 凡梦AI 怎么做
          </div>
          <div
            style={{
              flex: 1,
              borderRadius: 24,
              padding: "28px 32px",
              background: item.gradient,
              boxShadow: `0 40px 100px ${item.accent}55`,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 12 }}>{item.emoji}</div>
            <div style={{ fontSize: 30, fontWeight: 900, color: "#fff", marginBottom: 14 }}>{item.agentName}</div>
            <div style={{ fontSize: 18, color: "rgba(255,255,255,0.92)", lineHeight: 1.55, marginBottom: 20 }}>
              {item.solution}
            </div>
            {item.powers.map((p, i) => {
              const pIn = spring({ frame: frame - 20 - i * 6, fps, config: { damping: 200 } });
              return (
                <div
                  key={p}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#fff",
                    marginBottom: 10,
                    opacity: pIn,
                  }}
                >
                  <span style={{ color: "rgba(255,255,255,0.9)" }}>✓</span> {p}
                </div>
              );
            })}
          </div>
        </div>

        {/* 强大结果 */}
        <div
          style={{
            opacity: resultIn,
            transform: `translateX(${interpolate(resultIn, [0, 1], [24, 0])}px)`,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 900, color: "#34d399", letterSpacing: "0.1em", marginBottom: 12 }}>
            ✅ 您得到什么
          </div>
          <GlassCard accent="#34d399" style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ fontSize: 17, color: "#94a3b8", marginBottom: 16, lineHeight: 1.5 }}>{item.outcome}</div>
            <div
              style={{
                padding: "20px 24px",
                borderRadius: 16,
                background: "rgba(52,211,153,0.12)",
                border: "1px solid rgba(52,211,153,0.35)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 800, color: "#34d399", marginBottom: 8, letterSpacing: "0.08em" }}>
                典型输出
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", lineHeight: 1.35 }}>{item.outcomeMetric}</div>
            </div>
          </GlassCard>
        </div>
      </div>
    </PremiumShell>
  );
};
