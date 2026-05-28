import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BRAND } from "../data/agents";

type Props = {
  accent?: string;
  accent2?: string;
  variant?: "dark" | "rich" | "agent";
};

/** 高饱和全屏背景 — 填满上下，避免留白 */
export const PremiumBackground: React.FC<Props> = ({
  accent = BRAND.colors.blue,
  accent2 = BRAND.colors.purple,
  variant = "rich",
}) => {
  const frame = useCurrentFrame();
  const pulse = interpolate(Math.sin(frame / 35), [-1, 1], [0.92, 1.08]);
  const driftX = interpolate(frame, [0, 900], [0, 60]);

  const baseBg =
    variant === "dark"
      ? "linear-gradient(165deg, #060912 0%, #0f0a28 45%, #081428 100%)"
      : "linear-gradient(155deg, #0a1020 0%, #1a0e3a 38%, #0c2048 72%, #12082a 100%)";

  return (
    <AbsoluteFill style={{ background: baseBg }}>
      {/* 顶部主光晕 */}
      <div
        style={{
          position: "absolute",
          width: 900,
          height: 900,
          top: -280,
          right: -120,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accent}88 0%, ${accent}44 35%, transparent 68%)`,
          transform: `scale(${pulse}) translateX(${driftX * 0.3}px)`,
          filter: "blur(2px)",
        }}
      />
      {/* 左下副光晕 — 填充下方空白 */}
      <div
        style={{
          position: "absolute",
          width: 780,
          height: 780,
          bottom: -220,
          left: -100,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accent2}77 0%, ${accent2}33 40%, transparent 70%)`,
          transform: `scale(${pulse * 1.05})`,
        }}
      />
      {/* 中下装饰光 — 专门填底部 */}
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: 280,
          bottom: 0,
          left: 0,
          background: `linear-gradient(0deg, ${accent}22 0%, ${accent2}11 50%, transparent 100%)`,
        }}
      />
      {/* 网格纹理 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
          `,
          backgroundSize: "56px 56px",
          transform: `translate(${driftX * 0.15}px, 0)`,
          opacity: 0.5,
        }}
      />
      {/* 扫描线 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, transparent 0%, ${accent}08 50%, transparent 100%)`,
          transform: `translateY(${interpolate(frame % 120, [0, 120], [-1080, 1080])}px)`,
          opacity: 0.6,
        }}
      />
      {/* 底部品牌条 */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 4,
          background: `linear-gradient(90deg, ${accent}, ${accent2}, ${BRAND.colors.pink})`,
        }}
      />
    </AbsoluteFill>
  );
};

type ShellProps = {
  children: React.ReactNode;
  accent?: string;
  accent2?: string;
  footer?: React.ReactNode;
  variant?: "dark" | "rich" | "agent";
};

export const PremiumShell: React.FC<ShellProps> = ({
  children,
  accent,
  accent2,
  footer,
  variant = "rich",
}) => (
  <AbsoluteFill>
    <PremiumBackground accent={accent} accent2={accent2} variant={variant} />
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        fontFamily: 'Inter, "Microsoft YaHei", "PingFang SC", system-ui, sans-serif',
        color: "#f8fafc",
      }}
    >
      <div style={{ flex: 1, padding: "48px 72px 24px", display: "flex", flexDirection: "column" }}>
        {children}
      </div>
      {footer ? (
        <div style={{ padding: "0 72px 28px", flexShrink: 0 }}>{footer}</div>
      ) : null}
    </AbsoluteFill>
  </AbsoluteFill>
);

export const SceneFooter: React.FC<{
  moduleLabel: string;
  step?: string;
  total?: string;
}> = ({ moduleLabel, step, total }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "16px 24px",
      borderRadius: 16,
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.12)",
      backdropFilter: "blur(12px)",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${BRAND.colors.blue}, ${BRAND.colors.purple})`,
          boxShadow: `0 0 12px ${BRAND.colors.blue}`,
        }}
      />
      <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: "0.08em", color: "#94a3b8" }}>
        FANMENG AI
      </span>
    </div>
    <span style={{ fontSize: 16, fontWeight: 800, color: "#e2e8f0" }}>{moduleLabel}</span>
    {step && total ? (
      <span style={{ fontSize: 14, fontWeight: 700, color: "#64748b" }}>
        {step} / {total}
      </span>
    ) : (
      <span style={{ fontSize: 14, fontWeight: 700, color: "#64748b" }}>fanmeng-ai.com</span>
    )}
  </div>
);

export const Kicker: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 16px",
      borderRadius: 999,
      fontSize: 13,
      fontWeight: 800,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      color: "#fff",
      background: `linear-gradient(135deg, ${BRAND.colors.blue}44, ${BRAND.colors.purple}44)`,
      border: "1px solid rgba(255,255,255,0.2)",
      marginBottom: 20,
    }}
  >
    {children}
  </div>
);

export const GradientHeadline: React.FC<{ children: React.ReactNode; size?: number }> = ({
  children,
  size = 56,
}) => (
  <h2
    style={{
      margin: 0,
      fontSize: size,
      fontWeight: 900,
      letterSpacing: "-0.035em",
      lineHeight: 1.08,
      background: `linear-gradient(135deg, #ffffff 0%, ${BRAND.colors.blue} 50%, ${BRAND.colors.purple} 100%)`,
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      color: "transparent",
    }}
  >
    {children}
  </h2>
);

export const GlassCard: React.FC<{
  children: React.ReactNode;
  accent?: string;
  style?: React.CSSProperties;
}> = ({ children, accent = BRAND.colors.blue, style }) => (
  <div
    style={{
      padding: "28px 32px",
      borderRadius: 24,
      background: "rgba(255,255,255,0.08)",
      border: `1px solid rgba(255,255,255,0.14)`,
      boxShadow: `0 24px 60px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.1)`,
      backdropFilter: "blur(16px)",
      borderTop: `3px solid ${accent}`,
      ...style,
    }}
  >
    {children}
  </div>
);
