#!/usr/bin/env node
/**
 * 本地发版：构建 ZIP → 提交 → 打标签（需自行 git push --tags）
 * 用法: node scripts/release-extension.mjs [patch|minor|major]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const bump = process.argv[2] || "patch";
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const manifestPath = join(root, "extension/manifest.json");
const configPath = join(root, "extension/src/lib/config.js");

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const parts = (manifest.version || "0.1.0").split(".").map(Number);
if (bump === "major") {
  parts[0] += 1;
  parts[1] = 0;
  parts[2] = 0;
} else if (bump === "minor") {
  parts[1] += 1;
  parts[2] = 0;
} else {
  parts[2] += 1;
}
const version = parts.join(".");
manifest.version = version;
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

let configJs = readFileSync(configPath, "utf8");
configJs = configJs.replace(/VERSION:\s*"[^"]+"/, `VERSION: "${version}"`);
writeFileSync(configPath, configJs, "utf8");

execSync("npm run build:extension", { cwd: root, stdio: "inherit" });

const tag = `extension-v${version}`;
execSync(`git add extension/manifest.json extension/src/lib/config.js public/downloads/fanmeng-tiktok-extension.zip`, {
  cwd: root,
  stdio: "inherit",
});
execSync(`git commit -m "chore(extension): release v${version}"`, { cwd: root, stdio: "inherit" });
execSync(`git tag ${tag}`, { cwd: root, stdio: "inherit" });

console.log(`\n[release] 完成 v${version}`);
console.log(`  git push origin master && git push origin ${tag}`);
