/** TikTok 卖家中心 · 上架包填表（半自动，需人工确认后发布） */
const EnterpriseListingFill = {
  fieldGroups: {
    title: ["product name", "product title", "title", "商品名称", "商品标题", "产品名称", "name"],
    description: ["description", "desc", "描述", "详情", "product description", "商品描述", "产品描述"],
    price: ["price", "售价", "sale price", "retail", "价格", "sku price"],
    stock: ["stock", "inventory", "quantity", "库存", "数量", "available stock"],
  },

  setNativeValue(el, value) {
    if (!el) return;
    const str = String(value || "");
    if (el.isContentEditable) {
      el.focus();
      el.textContent = str;
      el.dispatchEvent(new InputEvent("input", { bubbles: true }));
      return;
    }
    const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    if (setter) setter.call(el, str);
    else el.value = str;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  },

  normalizeText(text) {
    return String(text || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  },

  visible(el) {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && getComputedStyle(el).visibility !== "hidden";
  },

  contextText(el) {
    const labelFor = el.id ? document.querySelector(`label[for="${CSS.escape(el.id)}"]`) : null;
    const container = el.closest('[class*="form"], [class*="Form"], [class*="field"], [class*="Field"], label, div');
    return this.normalizeText(
      [
        el.placeholder,
        el.getAttribute("aria-label"),
        el.getAttribute("data-testid"),
        el.name,
        el.id,
        el.labels?.[0]?.innerText,
        labelFor?.innerText,
        el.closest("label")?.innerText,
        container?.querySelector("label")?.innerText,
        container?.innerText?.slice(0, 300),
      ]
        .filter(Boolean)
        .join(" "),
    );
  },

  /** @param {string[]} keywords */
  findField(keywords) {
    const els = [...document.querySelectorAll('input:not([type="hidden"]), textarea, [contenteditable="true"], [role="textbox"]')];
    const lowered = keywords.map((k) => this.normalizeText(k)).filter(Boolean);
    const scored = [];
    for (const el of els) {
      if (!this.visible(el)) continue;
      const ctx = this.contextText(el);
      const score = lowered.reduce((sum, k) => sum + (ctx.includes(k) ? k.length : 0), 0);
      if (score > 0) scored.push({ el, score });
    }
    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.el || null;
  },

  fillOne(name, keywords, value) {
    if (value == null || value === "") return { name, status: "skipped", reason: "empty-value" };
    const el = this.findField(keywords);
    if (!el) return { name, status: "missing", reason: "field-not-found" };
    try {
      this.setNativeValue(el, value);
      return { name, status: "filled" };
    } catch (error) {
      return { name, status: "failed", reason: error?.message || String(error) };
    }
  },

  /** @param {object} pack */
  async fill(pack) {
    const descText = pack.description || (Array.isArray(pack.bullets) ? pack.bullets.join("\n") : "");
    const fields = [
      this.fillOne("title", this.fieldGroups.title, pack.title),
      this.fillOne("description", this.fieldGroups.description, descText),
      this.fillOne("price", this.fieldGroups.price, pack.salePrice),
      this.fillOne("stock", this.fieldGroups.stock, pack.stock),
    ];
    const filled = fields.filter((f) => f.status === "filled").length;
    const missing = fields.filter((f) => f.status === "missing").map((f) => f.name);
    return {
      filled,
      ok: filled > 0,
      fields,
      missing,
      filledAt: new Date().toISOString(),
      message: filled ? `已填入 ${filled} 个字段，请核对后手动发布` : "未找到可填写的表单字段",
    };
  },
};

if (typeof globalThis !== "undefined") {
  globalThis.EnterpriseListingFill = EnterpriseListingFill;
}
