#!/usr/bin/env node
/**
 * 校验 extension 标签版本与 manifest.json 一致
 * 用法: node scripts/verify-extension-tag.mjs extension-v0.4.0
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const tag = process.argv[2] || "";
const m = tag.match(/^extension-v(\d+\.\d+\.\d+)$/);
if (!m) {
  console.error(`[verify] 标签须为 extension-vX.Y.Z，当前: ${tag || "(空)"}`);
  process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(readFileSync(join(__dirname, "../extension/manifest.json"), "utf8"));
const expected = m[1];

if (manifest.version !== expected) {
  console.error(`[verify] manifest.json 版本 ${manifest.version} ≠ 标签 ${expected}`);
  process.exit(1);
}

console.log(`[verify] OK · extension v${expected}`);
