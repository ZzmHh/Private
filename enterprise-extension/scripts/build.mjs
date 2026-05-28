/**
 * 打包企业站 Chrome 插件 → public/downloads/enterprise-tiktok-extension.zip
 */
import archiver from "archiver";
import { createWriteStream, existsSync, mkdirSync, readFileSync, rmSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const extRoot = join(__dirname, "..");
const repoRoot = join(extRoot, "..");
const zipPath = join(repoRoot, "public", "downloads", "enterprise-tiktok-extension.zip");
const manifestPath = join(extRoot, "manifest.json");

function loadBuildEnv() {
  const envPath = join(extRoot, "build.env");
  const out = { ...process.env };
  if (!existsSync(envPath)) return out;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 1) continue;
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return out;
}

const env = loadBuildEnv();
const apiBase = String(env.ENTERPRISE_EXTENSION_DEFAULT_API_BASE || "http://127.0.0.1:8787").replace(/\/+$/, "");
const websiteUrl = String(env.ENTERPRISE_EXTENSION_WEBSITE_URL || `${apiBase.replace(":8787", ":5173")}/enterprise.html`);
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const version = manifest.version || "0.1.0";

const configJs = `/** 生产构建生成 · ${new Date().toISOString()} */
const EnterpriseExtensionConfig = {
  BUILD: "production",
  VERSION: ${JSON.stringify(version)},
  DEFAULT_API_BASE: ${JSON.stringify(apiBase)},
  WEBSITE_URL: ${JSON.stringify(websiteUrl)},
  PRIVACY_URL: "",
};
if (typeof globalThis !== "undefined") {
  globalThis.EnterpriseExtensionConfig = EnterpriseExtensionConfig;
}
`;

mkdirSync(dirname(zipPath), { recursive: true });
if (existsSync(zipPath)) rmSync(zipPath, { force: true });

await new Promise((resolve, reject) => {
  const output = createWriteStream(zipPath);
  const archive = archiver("zip", { zlib: { level: 9 } });
  output.on("close", resolve);
  archive.on("error", reject);
  archive.pipe(output);

  archive.file(manifestPath, { name: "manifest.json" });
  archive.directory(join(extRoot, "popup"), "popup");
  archive.directory(join(extRoot, "src"), "src");
  archive.append(configJs, { name: "src/lib/config.js" });
  archive.finalize();
});

console.log(`Enterprise extension packed: ${zipPath}`);
