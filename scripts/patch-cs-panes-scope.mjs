import fs from "node:fs";
import path from "node:path";

const files = [
  "CsFaqPane.jsx",
  "CsFaqAiPane.jsx",
  "CsRulesPane.jsx",
  "CsSessionFeedPane.jsx",
  "CsAlertsPane.jsx",
  "CsAnalyticsPane.jsx",
];

const dir = path.join(process.cwd(), "src", "enterprise", "csStudio");

for (const name of files) {
  const p = path.join(dir, name);
  let t = fs.readFileSync(p, "utf8");
  const o = t;

  if (!t.includes("csFetch")) {
    t = t.replace(
      /from "\.\/csStudioApi\.js";/,
      'from "./csStudioApi.js";',
    );
    if (t.includes('authHeaders') && !t.includes("csFetch")) {
      t = t.replace(
        /import \{([^}]*authHeaders[^}]*)\} from "\.\/csStudioApi\.js";/,
        (m, inner) => {
          const parts = inner.split(",").map((s) => s.trim());
          if (!parts.includes("csFetch")) parts.push("csFetch");
          if (!parts.includes("csFaqQuery") && name !== "CsAlertsPane.jsx" && name !== "CsAnalyticsPane.jsx") {
            parts.push("csFaqQuery");
          }
          return `import { ${parts.join(", ")} } from "./csStudioApi.js";`;
        },
      );
    }
  }

  if (!t.includes("scopeShopId")) {
    t = t.replace(/export function (\w+)\(\{([^}]*)\}\)/, (m, fn, props) => {
      if (props.includes("scopeShopId")) return m;
      const trimmed = props.trim();
      return `export function ${fn}({ ${trimmed ? `${trimmed}, ` : ""}scopeShopId = "" })`;
    });
  }

  fs.writeFileSync(p, t);
  if (t !== o) console.log("prepared", name);
}

console.log("Run manual csFetch migration for remaining fetch calls");
