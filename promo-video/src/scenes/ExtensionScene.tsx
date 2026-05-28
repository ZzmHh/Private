import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  GlassCard,
  GradientHeadline,
  Kicker,
  PremiumShell,
  SceneFooter,
} from "../components/PremiumLayout";
import { BRAND, EXTENSION } from "../data/agents";

export const ExtensionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const leftIn = spring({ frame, fps, config: { damping: 200 } });
  const chatIn = spring({ frame: frame - 12, fps, config: { damping: 16, stiffness: 90 } });

  const buyer = "Where is my order? It's been 10 days, please help!";
  const reply =
    "Hi! I checked your tracking — package cleared customs yesterday. Expected delivery in 2–3 business days. Let me know if you need anything else!";
  const buyerLen = Math.min(
    buyer.length,
    Math.floor(interpolate(frame, [25, 70], [0, buyer.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })),
  );
  const replyLen = Math.min(
    reply.length,
    Math.floor(interpolate(frame, [75, 130], [0, reply.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })),
  );

  return (
    <PremiumShell
      accent={BRAND.colors.purple}
      accent2={BRAND.colors.pink}
      footer={<SceneFooter moduleLabel="TikTok Shop Chrome 插件" step="09" total="08" />}
    >
      <div style={{ flex: 1, display: "flex", gap: 48, alignItems: "stretch" }}>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            opacity: leftIn,
            transform: `translateX(${interpolate(leftIn, [0, 1], [-30, 0])}px)`,
          }}
        >
          <Kicker>TikTok Shop Extension</Kicker>
          <GradientHeadline size={46}>{EXTENSION.title}</GradientHeadline>
          <p style={{ margin: "20px 0 28px", fontSize: 20, lineHeight: 1.65, color: "#94a3b8" }}>{EXTENSION.desc}</p>
          <div style={{ display: "grid", gap: 14 }}>
            {EXTENSION.bullets.map((b, i) => {
              const bIn = spring({ frame: frame - 14 - i * 8, fps, config: { damping: 200 } });
              return (
                <div
                  key={b}
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    fontSize: 17,
                    fontWeight: 700,
                    color: "#e2e8f0",
                    opacity: bIn,
                  }}
                >
                  <span style={{ color: BRAND.colors.purple, fontSize: 20 }}>✓</span>
                  {b}
                </div>
              );
            })}
          </div>
          <GlassCard accent={BRAND.colors.purple} style={{ marginTop: 24 }}>
            <div style={{ fontSize: 16, color: "#cbd5e1", lineHeight: 1.55 }}>
              与网站 <strong style={{ color: "#fff" }}>同一账号、同一套餐</strong> · 成长版起 FAQ 自动发送 · 专业版含 CSV 诊断
            </div>
          </GlassCard>
        </div>

        <div
          style={{
            flex: 1,
            opacity: chatIn,
            transform: `scale(${interpolate(chatIn, [0, 1], [0.92, 1])})`,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              flex: 1,
              borderRadius: 24,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.15)",
              boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                padding: "16px 22px",
                background: "rgba(0,0,0,0.5)",
                display: "flex",
                justifyContent: "space-between",
                fontSize: 14,
                fontWeight: 800,
                color: "#94a3b8",
              }}
            >
              <span>TikTok Seller Center · Messages</span>
              <span style={{ color: BRAND.colors.blue }}>凡梦AI 面板</span>
            </div>
            <div style={{ flex: 1, padding: 28, background: "rgba(255,255,255,0.04)", display: "flex", flexDirection: "column", justifyContent: "center", gap: 16 }}>
              <div
                style={{
                  alignSelf: "flex-start",
                  maxWidth: "82%",
                  padding: "16px 20px",
                  borderRadius: "18px 18px 18px 4px",
                  background: "rgba(255,255,255,0.12)",
                  fontSize: 16,
                  color: "#e2e8f0",
                  lineHeight: 1.5,
                }}
              >
                {buyer.slice(0, buyerLen)}
              </div>
              {replyLen > 0 ? (
                <div
                  style={{
                    alignSelf: "flex-end",
                    maxWidth: "88%",
                    padding: "16px 20px",
                    borderRadius: "18px 18px 4px 18px",
                    background: `linear-gradient(135deg, ${BRAND.colors.blue}, ${BRAND.colors.purple})`,
                    fontSize: 16,
                    color: "#fff",
                    lineHeight: 1.55,
                    boxShadow: `0 12px 32px ${BRAND.colors.purple}44`,
                  }}
                >
                  {reply.slice(0, replyLen)}
                </div>
              ) : null}
              {replyLen === reply.length ? (
                <div style={{ alignSelf: "flex-end", fontSize: 14, fontWeight: 900, color: "#34d399" }}>
                  ✓ AI 话术已自动填入并发送
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </PremiumShell>
  );
};
