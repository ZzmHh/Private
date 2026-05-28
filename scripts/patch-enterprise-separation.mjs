import fs from "node:fs";
import path from "node:path";

const root = path.join(process.cwd(), "src", "enterprise");

function walk(dir) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, name.name);
    if (name.isDirectory()) walk(p);
    else if (/\.(jsx|js)$/.test(name.name)) {
      let t = fs.readFileSync(p, "utf8");
      const o = t;
      t = t.replaceAll("/api/extension", "/api/enterprise/extension");
      t = t.replaceAll("/api/store-metrics", "/api/enterprise/metrics");
      t = t.replaceAll("fanmeng_token", "enterprise_token");
      t = t.replaceAll("凡梦 Chrome 插件", "企业浏览器助手");
      t = t.replaceAll("凡梦插件", "企业浏览器助手");
      t = t.replaceAll("凡梦账号", "企业账号");
      t = t.replaceAll("fanmengParity", "legacyParity");
      if (t !== o) {
        fs.writeFileSync(p, t);
        console.log("patched", p);
      }
    }
  }
}

walk(root);
