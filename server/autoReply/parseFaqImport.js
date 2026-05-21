/**
 * 解析商家导入的 FAQ 模板（CSV / JSON）
 */
import { normalizeFaqLang } from "../../shared/tiktokShopLanguages.js";

const CSV_HEADERS = {
  name: ["模板名称", "名称", "name", "title"],
  triggers: ["触发关键词", "关键词", "triggers", "trigger"],
  text: ["回复内容", "回复", "内容", "text", "answer", "reply"],
  category: ["分类", "category", "类型"],
  lang: ["语言", "lang", "language"],
};

const VALID_CATEGORIES = new Set(["greeting", "price", "shipping", "stock", "product", ""]);

function pickField(row, keys) {
  for (const key of keys) {
    const val = row[key];
    if (val != null && String(val).trim()) return String(val).trim();
  }
  return "";
}

function parseTriggers(raw) {
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean).slice(0, 20);
  return String(raw || "")
    .split(/[,，|/;；]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function normalizeImportedRow(raw, index) {
  const name = pickField(raw, CSV_HEADERS.name) || `FAQ-${index + 1}`;
  const text = pickField(raw, CSV_HEADERS.text);
  if (!text) return null;

  const category = pickField(raw, CSV_HEADERS.category).toLowerCase();
  const langRaw = pickField(raw, CSV_HEADERS.lang).toLowerCase();

  return {
    name: name.slice(0, 80),
    text: text.slice(0, 4000),
    triggers: parseTriggers(pickField(raw, CSV_HEADERS.triggers) || raw.triggers),
    category: VALID_CATEGORIES.has(category) ? category : "",
    lang: normalizeFaqLang(langRaw),
  };
}

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

function mapCsvRows(text) {
  const lines = String(text || "")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const headerCells = parseCsvLine(lines[0]);
  const headerMap = headerCells.map((h) => h.trim());

  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    const row = {};
    headerMap.forEach((header, idx) => {
      row[header] = cells[idx] ?? "";
    });
    return row;
  });
}

export function parseFaqImportPayload(payload) {
  if (Array.isArray(payload)) {
    return payload.map((row, i) => normalizeImportedRow(row, i)).filter(Boolean);
  }

  if (typeof payload === "string") {
    const trimmed = payload.trim();
    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      try {
        const parsed = JSON.parse(trimmed);
        const list = Array.isArray(parsed) ? parsed : parsed.templates || parsed.items || [];
        return parseFaqImportPayload(list);
      } catch {
        /* fall through to CSV */
      }
    }
    return mapCsvRows(trimmed)
      .map((row, i) => normalizeImportedRow(row, i))
      .filter(Boolean);
  }

  if (payload && typeof payload === "object") {
    if (Array.isArray(payload.templates)) return parseFaqImportPayload(payload.templates);
    if (typeof payload.csv === "string") return parseFaqImportPayload(payload.csv);
  }

  return [];
}

export const FAQ_IMPORT_SAMPLE_CSV = `模板名称,触发关键词,回复内容,分类,语言
物流时效 EN,shipping|delivery|when arrive,"Hi! We ship within 1-2 business days. Tracking will be shared once dispatched.",shipping,en
物流时效 TH,ส่ง|จัดส่ง|shipping,"สวัสดีค่ะ เราจัดส่งภายใน 1-2 วันทำการ แจ้งเลขพัสดุให้ทันทีที่ออกจากคลังค่ะ",shipping,th
物流时效 VN,giao hàng|vận chuyển|shipping,"Xin chào! Shop giao hàng trong 1-2 ngày làm việc. Mã vận đơn sẽ được cập nhật ngay khi xuất kho.",shipping,vi
价格咨询 ID,harga|berapa|price,"Halo! Harga sudah tertera di halaman produk. Silakan checkout — kami siap bantu jika ada pertanyaan ukuran/warna.",price,id
价格咨询 ES,precio|cuánto|cuanto,"¡Hola! El precio publicado es el vigente antes de cupones de la plataforma. ¿Te ayudo con talla o envío?",price,es
`;
