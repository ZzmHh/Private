import {
  TIKTOK_SHOP_LANGUAGE_GROUPS,
  TIKTOK_SHOP_LANGUAGES,
  TIKTOK_SHOP_MARKETS,
  buildLanguageSelectOptions,
  getLanguageLabel,
  normalizeFaqLang,
} from "../../shared/tiktokShopLanguages.js";

export {
  TIKTOK_SHOP_LANGUAGES,
  TIKTOK_SHOP_LANGUAGE_GROUPS,
  TIKTOK_SHOP_MARKETS,
  buildLanguageSelectOptions,
  getLanguageLabel,
  normalizeFaqLang,
};

export const FAQ_CATEGORY_OPTIONS = [
  { value: "", label: "自动识别" },
  { value: "greeting", label: "问候" },
  { value: "price", label: "价格" },
  { value: "shipping", label: "物流" },
  { value: "stock", label: "库存" },
  { value: "product", label: "产品规格" },
];

export const FAQ_IMPORT_SAMPLE_CSV = `模板名称,触发关键词,回复内容,分类,语言
物流时效 EN,shipping|delivery|when arrive,"Hi! We ship within 1-2 business days. Tracking will be shared once dispatched.",shipping,en
物流时效 TH,ส่ง|จัดส่ง|shipping,"สวัสดีค่ะ เราจัดส่งภายใน 1-2 วันทำการ แจ้งเลขพัสดุให้ทันทีที่ออกจากคลังค่ะ",shipping,th
物流时效 VN,giao hàng|vận chuyển|shipping,"Xin chào! Shop giao hàng trong 1-2 ngày làm việc. Mã vận đơn sẽ được cập nhật ngay khi xuất kho.",shipping,vi
价格咨询 ID,harga|berapa|price,"Halo! Harga sudah tertera di halaman produk. Silakan checkout — kami siap bantu jika ada pertanyaan ukuran/warna.",price,id
价格咨询 ES,precio|cuánto|cuanto,"¡Hola! El precio publicado es el vigente antes de cupones de la plataforma. ¿Te ayudo con talla o envío?",price,es
`;

function parseCsvLine(line) {
  const cells = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      cells.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  cells.push(cur.trim());
  return cells;
}

function pickField(row, keys) {
  for (const key of keys) {
    const val = row[key];
    if (val != null && String(val).trim()) return String(val).trim();
  }
  return "";
}

function normalizeRow(row, index) {
  const name = pickField(row, ["模板名称", "名称", "name", "title"]) || `FAQ-${index + 1}`;
  const text = pickField(row, ["回复内容", "回复", "内容", "text", "answer", "reply"]);
  if (!text) return null;
  const triggersRaw = pickField(row, ["触发关键词", "关键词", "triggers", "trigger"]) || row.triggers;
  const triggers = Array.isArray(triggersRaw)
    ? triggersRaw
    : String(triggersRaw || "")
        .split(/[,，|/;；]+/)
        .map((s) => s.trim())
        .filter(Boolean);
  const category = pickField(row, ["分类", "category", "类型"]).toLowerCase();
  const langRaw = pickField(row, ["语言", "lang", "language"]);

  return {
    name,
    text,
    triggers,
    category,
    lang: normalizeFaqLang(langRaw),
  };
}

export function parseFaqCsvText(text) {
  const lines = String(text || "")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]);
  return lines
    .slice(1)
    .map((line) => {
      const cells = parseCsvLine(line);
      const row = {};
      headers.forEach((header, idx) => {
        row[header.trim()] = cells[idx] ?? "";
      });
      return row;
    })
    .map(normalizeRow)
    .filter(Boolean);
}

export function downloadFaqTemplateCsv() {
  const blob = new Blob([`\uFEFF${FAQ_IMPORT_SAMPLE_CSV}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "fanmeng-faq-template.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export function emptyFaqDraft() {
  return {
    id: "",
    name: "",
    triggers: "",
    text: "",
    category: "",
    lang: "en",
  };
}
