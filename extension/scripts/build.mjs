/**
 * 打包 TikTok Shop Chrome 插件 → public/downloads/fanmeng-tiktok-extension.zip
 */
import archiver from "archiver";
import { createWriteStream, existsSync, mkdirSync, readFileSync, rmSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const extRoot = join(__dirname, "..");
const repoRoot = join(extRoot, "..");
const zipPath = join(repoRoot, "public", "downloads", "fanmeng-tiktok-extension.zip");
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
const apiBase = String(env.EXTENSION_DEFAULT_API_BASE || "https://你的域名").replace(/\/+$/, "");
const cwsUrl = String(env.VITE_EXTENSION_CWS_URL || env.EXTENSION_CWS_URL || "");
const websiteUrl = String(env.EXTENSION_WEBSITE_URL || apiBase).replace(/\/+$/, "");
const privacyUrl = String(env.EXTENSION_PRIVACY_URL || `${websiteUrl}/privacy-extension.html`);
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const version = manifest.version || "0.3.0";

try {
  const u = new URL(apiBase.includes("://") ? apiBase : `https://${apiBase}`);
  if (u.origin && !u.hostname.includes("127.0.0.1") && u.hostname !== "localhost") {
    const origins = [`${u.origin}/*`];
    const apex = u.hostname.startsWith("www.") ? u.hostname.slice(4) : u.hostname;
    const altOrigin = u.hostname.startsWith("www.")
      ? `${u.protocol}//${apex}`
      : `${u.protocol}//www.${u.hostname}`;
    const altPerm = `${altOrigin}/*`;
    origins.push(altPerm);
    for (const hostPerm of origins) {
      if (!manifest.host_permissions.includes(hostPerm)) {
        manifest.host_permissions.push(hostPerm);
      }
    }
    const csMatches = manifest.content_scripts?.[0]?.matches;
    if (Array.isArray(csMatches)) {
      for (const perm of origins) {
        if (!csMatches.includes(perm)) csMatches.push(perm);
      }
    }
  }
} catch {
  /* ignore */
}

const configJs = `/** 生产构建生成 · ${new Date().toISOString()} */
const FanmengExtensionConfig = {
  BUILD: "production",
  VERSION: ${JSON.stringify(version)},
  DEFAULT_API_BASE: ${JSON.stringify(apiBase)},
  CHROME_STORE_URL: ${JSON.stringify(cwsUrl)},
  PRIVACY_URL: ${JSON.stringify(privacyUrl)},
  WEBSITE_URL: ${JSON.stringify(websiteUrl)},
};
if (typeof globalThis !== "undefined") {
  globalThis.FanmengExtensionConfig = FanmengExtensionConfig;
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

  archive.glob(
    "**/*",
    {
      cwd: extRoot,
      ignore: ["scripts/**", "build.env", "build.env.example", ".pack-staging/**", "src/lib/config.js"],
      dot: false,
    },
    { prefix: "" },
  );

  archive.append(`${JSON.stringify(manifest, null, 2)}\n`, { name: "manifest.json" });
  archive.append(configJs, { name: "src/lib/config.js" });
  archive.finalize();
});

const hint = apiBase.includes("你的域名") ? "请先在 extension/build.env 配置真实域名" : "production";
console.log(`[凡梦] 插件已打包: ${zipPath}`);
console.log(`[凡梦] 默认 API: ${apiBase} · v${version} (${hint})`);
