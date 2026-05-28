import React from "react";
import { Audio, Sequence, staticFile, useVideoConfig } from "remotion";
import { AGENTS_START, CTA_START, EXTENSION_START, INTRO, PAIN, PRICING_START } from "../timing";

type Props = { sceneStarts?: number[] };

export const PromoAudio: React.FC<Props> = ({ sceneStarts }) => {
  const { fps } = useVideoConfig();

  const starts = sceneStarts ?? [0, INTRO, INTRO + PAIN, AGENTS_START, EXTENSION_START, PRICING_START, CTA_START];

  return (
    <>
      <Audio src={staticFile("audio/bgm.wav")} volume={0.72} loop />
      {starts.slice(1, -1).map((from) => (
        <Sequence key={`sw-${from}`} from={from} durationInFrames={Math.round(0.65 * fps)} layout="none">
          <Audio src={staticFile("audio/swoosh.wav")} volume={0.22} />
        </Sequence>
      ))}
      <Sequence from={AGENTS_START} durationInFrames={Math.round(0.35 * fps)} layout="none">
        <Audio src={staticFile("audio/impact.wav")} volume={0.18} />
      </Sequence>
      <Sequence from={CTA_START} durationInFrames={Math.round(1.1 * fps)} layout="none">
        <Audio src={staticFile("audio/reveal.wav")} volume={0.24} />
      </Sequence>
    </>
  );
};
