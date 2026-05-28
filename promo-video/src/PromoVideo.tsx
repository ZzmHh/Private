import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { PromoAudio } from "./components/PromoAudio";
import { PAIN_SOLUTIONS } from "./data/agents";
import { AgentScene } from "./scenes/AgentScene";
import { BridgeScene } from "./scenes/BridgeScene";
import { CTAScene } from "./scenes/CTAScene";
import { ExtensionScene } from "./scenes/ExtensionScene";
import { IntroScene } from "./scenes/IntroScene";
import { PainScene } from "./scenes/PainScene";
import { PricingScene } from "./scenes/PricingScene";
import { WorkflowScene } from "./scenes/WorkflowScene";
import {
  AGENT,
  AGENTS_START,
  BRIDGE,
  CTA,
  CTA_START,
  EXTENSION,
  EXTENSION_START,
  INTRO,
  PAIN,
  PRICING,
  PRICING_START,
  PROMO_DURATION,
  WORKFLOW,
  WORKFLOW_START,
} from "./timing";

export { PROMO_DURATION };

export const PromoVideo: React.FC = () => {
  const sceneStarts = [0, INTRO, INTRO + PAIN, AGENTS_START, EXTENSION_START, PRICING_START, CTA_START];

  return (
    <AbsoluteFill style={{ backgroundColor: "#060912" }}>
      <PromoAudio sceneStarts={sceneStarts} />
      <Sequence from={0} durationInFrames={INTRO} premountFor={20}>
        <IntroScene />
      </Sequence>
      <Sequence from={INTRO} durationInFrames={PAIN} premountFor={15}>
        <PainScene />
      </Sequence>
      <Sequence from={INTRO + PAIN} durationInFrames={BRIDGE} premountFor={15}>
        <BridgeScene />
      </Sequence>
      {PAIN_SOLUTIONS.map((agent, i) => (
        <Sequence key={agent.id} from={AGENTS_START + i * AGENT} durationInFrames={AGENT} premountFor={15}>
          <AgentScene agentIndex={i} />
        </Sequence>
      ))}
      <Sequence from={EXTENSION_START} durationInFrames={EXTENSION} premountFor={15}>
        <ExtensionScene />
      </Sequence>
      <Sequence from={WORKFLOW_START} durationInFrames={WORKFLOW} premountFor={15}>
        <WorkflowScene />
      </Sequence>
      <Sequence from={PRICING_START} durationInFrames={PRICING} premountFor={15}>
        <PricingScene />
      </Sequence>
      <Sequence from={CTA_START} durationInFrames={CTA} premountFor={15}>
        <CTAScene />
      </Sequence>
    </AbsoluteFill>
  );
};
