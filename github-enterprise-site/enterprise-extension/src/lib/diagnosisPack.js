const EnterpriseDiagnosisPack = {
  pageTypeToPackKey(pageType) {
    const t = String(pageType || "").toLowerCase();
    if (["analytics", "orders", "ads", "inventory"].includes(t)) return t;
    if (t === "general") return "analytics";
    return null;
  },
};

if (typeof globalThis !== "undefined") {
  globalThis.EnterpriseDiagnosisPack = EnterpriseDiagnosisPack;
}
