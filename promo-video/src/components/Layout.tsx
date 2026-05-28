import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BRAND } from "../data/agents";

export const Background: React.FC<{ accent?: string }> = ({ accent = BRAND.colors.blue }) => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, 1800], [0, 40]);

  return (
    <AbsoluteFill style={{ background: "#fafbff" }}>
      <div
        style={{
          position: "absolute",
          inset: -80,
          backgroundImage: `
            linear-gradient(rgba(0,160,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,160,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
          transform: `translate(${drift * 0.2}px, ${drift * 0.1}px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          top: -200,
          left: -100,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accent}22, transparent 70%)`,
          filter: "blur(40px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          bottom: -150,
          right: -80,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${BRAND.colors.purple}20, transparent 70%)`,
          filter: "blur(40px)",
        }}
      />
    </AbsoluteFill>
  );
};

export const SceneShell: React.FC<{
  children: React.ReactNode;
  accent?: string;
  padding?: string;
}> = ({ children, accent, padding = "0 80px" }) => (
  <AbsoluteFill>
    <Background accent={accent} />
    <AbsoluteFill
      style={{
        padding,
        fontFamily: 'Inter, "Microsoft YaHei", "PingFang SC", system-ui, sans-serif',
        color: BRAND.colors.navy,
      }}
    >
      {children}
    </AbsoluteFill>
  </AbsoluteFill>
);

export const SectionLabel: React.FC<{ children: React.ReactNode; light?: boolean }> = ({
  children,
  light,
}) => (
  <div
    style={{
      fontSize: 14,
      fontWeight: 800,
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      color: light ? "#93c5fd" : BRAND.colors.blue,
      marginBottom: 12,
    }}
  >
    {children}
  </div>
);

export const GradientText: React.FC<{ children: React.ReactNode; size?: number }> = ({
  children,
  size = 48,
}) => (
  <span
    style={{
      fontSize: size,
      fontWeight: 900,
      letterSpacing: "-0.03em",
      background: `linear-gradient(135deg, ${BRAND.colors.blue}, ${BRAND.colors.purple})`,
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      color: "transparent",
    }}
  >
    {children}
  </span>
);
