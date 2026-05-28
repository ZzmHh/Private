/** TikTok 卖家中心 · 上架包填表（半自动，需人工确认后发布） */
const EnterpriseListingFill = {
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

  /** @param {string[]} keywords */
  findField(keywords) {
    const els = [...document.querySelectorAll('input:not([type="hidden"]), textarea, [contenteditable="true"]')];
    for (const el of els) {
      if (el.offsetParent === null && el.type !== "hidden") continue;
      const labelText =
        el.labels?.[0]?.innerText ||
        el.closest("label")?.innerText ||
        el.parentElement?.querySelector("label")?.innerText ||
        "";
      const ctx = [
        el.placeholder,
        el.getAttribute("aria-label"),
        el.name,
        el.id,
        labelText,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (keywords.some((k) => ctx.includes(k.toLowerCase()))) return el;
    }
    return null;
  },

  /** @param {object} pack */
  async fill(pack) {
    let filled = 0;
    const titleEl = this.findField(["product name", "product title", "title", "商品名称", "商品标题", "name"]);
    if (titleEl && pack.title) {
      this.setNativeValue(titleEl, pack.title);
      filled += 1;
    }

    const descEl = this.findField(["description", "desc", "描述", "详情", "product description"]);
    const descText = pack.description || (Array.isArray(pack.bullets) ? pack.bullets.join("\n") : "");
    if (descEl && descText) {
      this.setNativeValue(descEl, descText);
      filled += 1;
    }

    const priceEl = this.findField(["price", "售价", "sale price", "retail"]);
    if (priceEl && pack.salePrice) {
      this.setNativeValue(priceEl, pack.salePrice);
      filled += 1;
    }

    const stockEl = this.findField(["stock", "inventory", "quantity", "库存", "数量"]);
    if (stockEl && pack.stock) {
      this.setNativeValue(stockEl, pack.stock);
      filled += 1;
    }

    return { filled, ok: filled > 0, message: filled ? `已填入 ${filled} 个字段，请核对后手动发布` : "未找到可填写的表单字段" };
  },
};

if (typeof globalThis !== "undefined") {
  globalThis.EnterpriseListingFill = EnterpriseListingFill;
}
