/**
 * 柔和氛围 BGM + 轻转场音效（无白噪声、无强高频）
 */
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dir, "../public/audio");
const SR = 44100;

mkdirSync(OUT, { recursive: true });

function writeWav(path, samples) {
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SR, 24);
  buffer.writeUInt32LE(SR * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < samples.length; i++) {
    buffer.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767), 44 + i * 2);
  }
  writeFileSync(path, buffer);
}

function normalize(samples, peak = 0.72) {
  let max = 0.001;
  for (const s of samples) max = Math.max(max, Math.abs(s));
  return samples.map((s) => (s / max) * peak);
}

/** 简易低通：减少刺耳高频 */
function lowPass(samples, cutoffHz = 2800) {
  const rc = 1 / (2 * Math.PI * cutoffHz);
  const dt = 1 / SR;
  const alpha = dt / (rc + dt);
  const out = new Array(samples.length);
  out[0] = samples[0];
  for (let i = 1; i < samples.length; i++) {
    out[i] = out[i - 1] + alpha * (samples[i] - out[i - 1]);
  }
  return out;
}

/** 温暖柔和的企业宣传片氛围音乐 */
function generateBgm(durationSec) {
  const n = Math.floor(SR * durationSec);
  const samples = new Array(n).fill(0);

  const chords = [
    [130.81, 164.81, 196], // C major pad
    [110, 138.59, 164.81], // A minor
    [146.83, 174.61, 220], // D
    [123.47, 155.56, 185], // B dim-ish soft
  ];

  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const fade = Math.min(1, t / 4) * Math.min(1, (durationSec - t) / 5);

    const chordIdx = Math.floor(t / 10) % chords.length;
    const freqs = chords[chordIdx];

    let s = 0;

    // 温暖垫音（仅基频 + 柔和二次谐波，不加 shimmer）
    for (const f of freqs) {
      const chordFade = 0.5 + 0.5 * Math.cos(((t % 10) / 10) * Math.PI * 0.5);
      s += Math.sin(2 * Math.PI * f * t) * 0.11 * chordFade;
      s += Math.sin(2 * Math.PI * f * 0.5 * t) * 0.06 * chordFade;
    }

    // 轻柔钢琴式单音（慢速）
    const notes = [freqs[1], freqs[2], freqs[1], freqs[0]];
    const noteDur = 2.8;
    const noteIdx = Math.floor(t / noteDur) % notes.length;
    const noteT = t % noteDur;
    const noteEnv = Math.exp(-noteT * 1.2) * (1 - Math.exp(-noteT * 6));
    s += Math.sin(2 * Math.PI * notes[noteIdx] * t) * noteEnv * 0.14;

    // 极轻的低频呼吸感（非鼓点）
    s += Math.sin(2 * Math.PI * 0.25 * t) * 0.04 * (0.6 + 0.4 * Math.sin(t * 0.5));

    samples[i] = s * fade;
  }

  return normalize(lowPass(samples, 2400), 0.68);
}

/** 柔和 whoosh：纯正弦扫频，无噪声 */
function generateSoftSwoosh(durationSec = 0.7) {
  const n = Math.floor(SR * durationSec);
  const samples = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    const p = i / n;
    const env = Math.sin(p * Math.PI) ** 2;
    const freq = 180 + p * p * 420;
    samples[i] = Math.sin(2 * Math.PI * freq * (i / SR)) * env * 0.18;
  }
  return normalize(lowPass(samples, 1800), 0.35);
}

/** 极轻「落地」音，替代刺耳 impact */
function generateSoftTap(durationSec = 0.35) {
  const n = Math.floor(SR * durationSec);
  const samples = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const env = Math.exp(-t * 14);
    samples[i] = Math.sin(2 * Math.PI * 120 * t) * env * 0.35;
  }
  return normalize(lowPass(samples, 900), 0.28);
}

/** 结尾柔和上升音 */
function generateSoftLift(durationSec = 1.2) {
  const n = Math.floor(SR * durationSec);
  const samples = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const p = t / durationSec;
    const env = Math.min(1, p * 2.5) * (1 - p * 0.15);
    const freq = 220 + p * 280;
    samples[i] = Math.sin(2 * Math.PI * freq * t) * env * 0.2;
  }
  return normalize(lowPass(samples, 2000), 0.32);
}

const BGM_DURATION = 115;

writeWav(join(OUT, "bgm.wav"), generateBgm(BGM_DURATION));
writeWav(join(OUT, "swoosh.wav"), generateSoftSwoosh());
writeWav(join(OUT, "impact.wav"), generateSoftTap());
writeWav(join(OUT, "reveal.wav"), generateSoftLift());

console.log("Soft audio mix generated.");
