import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  GradientHeadline,
  Kicker,
  PremiumShell,
  SceneFooter,
} from "../components/PremiumLayout";
import { BRAND, WORKFLOW } from "../data/agents";

export const WorkflowScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headIn = spring({ frame, fps, config: { damping: 200 } });

  return (
    <PremiumShell
      accent={BRAND.colors.blue}
      accent2="#00E5FF"
      footer={<SceneFooter moduleLabel="三步上手 · 今天就能用" />}
    >
      <div style={{ textAlign: "center", opacity: headIn }}>
        <Kicker>Get Started</Kicker>
        <GradientHeadline size={48}>注册 → 选模块 → 装插件</GradientHeadline>
        <p style={{ margin: "16px 0 48px", fontSize: 20, color: "#94a3b8" }}>7 天专业版全功能体验 · 无需信用卡</p>
      </div>
      <div style={{ flex: 1, display: "flex", gap: 28, alignItems: "center", justifyContent: "center" }}>
        {WORKFLOW.map((w, i) => {
          const stepIn = spring({ frame: frame - 10 - i * 14, fps, config: { damping: 16, stiffness: 100 } });
          return (
            <React.Fragment key={w.step}>
              <div
                style={{
                  flex: 1,
                  maxWidth: 340,
                  padding: "40px 32px",
                  borderRadius: 24,
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  textAlign: "center",
                  opacity: stepIn,
                  transform: `translateY(${interpolate(stepIn, [0, 1], [32, 0])}px)`,
                  boxShadow: `0 24px 60px ${BRAND.colors.blue}22`,
                }}
              >
                <div
                  style={{
                    fontSize: 48,
                    fontWeight: 900,
                    background: `linear-gradient(135deg, ${BRAND.colors.blue}, ${BRAND.colors.purple})`,
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                    marginBottom: 16,
                  }}
                >
                  {w.step}
                </div>
                <div style={{ fontSize: 26, fontWeight: 900, color: "#fff", marginBottom: 12 }}>{w.title}</div>
                <div style={{ fontSize: 17, color: "#94a3b8", lineHeight: 1.55 }}>{w.desc}</div>
              </div>
              {i < WORKFLOW.length - 1 ? (
                <div style={{ fontSize: 40, color: BRAND.colors.blue, opacity: stepIn, fontWeight: 300 }}>→</div>
              ) : null}
            </React.Fragment>
          );
        })}
      </div>
    </PremiumShell>
  );
};
