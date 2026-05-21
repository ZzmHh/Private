/** 13 种 TikTok Shop 客服语言默认话术（售后安抚 / 问候 / SLA） */
export const CS_TEMPLATE_LANGS = ["en", "es", "pt", "vi", "th", "fil", "ms", "zh", "id", "ja", "de", "it", "fr"];

export const DEFAULT_AFTER_SALES_TEMPLATES = {
  en: "Thank you for your message regarding your order. Our team has received your request and will follow up {sla}. Please keep your order details handy. We appreciate your patience.",
  es: "Gracias por contactarnos sobre su pedido. Hemos recibido su solicitud y le responderemos {sla}. Conserve los datos de su pedido. Agradecemos su paciencia.",
  pt: "Obrigado pela mensagem sobre seu pedido. Recebemos sua solicitação e retornaremos {sla}. Mantenha os dados do pedido em mãos. Agradecemos a paciência.",
  vi: "Cảm ơn bạn đã liên hệ về đơn hàng. Chúng tôi đã nhận yêu cầu và sẽ phản hồi {sla}. Vui lòng giữ thông tin đơn hàng. Xin cảm ơn sự kiên nhẫn.",
  th: "ขอบคุณที่ติดต่อเรื่องคำสั่งซื้อ เราได้รับเรื่องแล้วและจะติดต่อกลับ {sla} กรุณาเก็บข้อมูลออเดอร์ไว้ ขอบคุณที่อดทนรอค่ะ",
  fil: "Salamat sa mensahe tungkol sa order. Natanggap namin ang request at magfu-follow up {sla}. Pakihanda ang order details. Pinahahalagahan namin ang inyong pasensya.",
  ms: "Terima kasih atas mesej berkenaan pesanan. Kami telah menerima permintaan anda dan akan membalas {sla}. Sila sediakan butiran pesanan. Terima kasih atas kesabaran anda.",
  zh: "您好，已收到您关于订单/售后的问题，我们非常重视。人工同事将在 {sla} 为您处理，请保留订单号与问题描述，感谢耐心等候。",
  id: "Terima kasih atas pesan terkait pesanan. Tim kami telah menerima permintaan Anda dan akan menindaklanjuti {sla}. Mohon siapkan detail pesanan. Terima kasih atas kesabaran Anda.",
  ja: "ご注文に関するお問い合わせありがとうございます。内容を確認し、{sla} 以内にご連絡いたします。注文番号をお手元にご用意ください。",
  de: "Vielen Dank für Ihre Nachricht zu Ihrer Bestellung. Wir haben Ihre Anfrage erhalten und melden uns {sla}. Bitte halten Sie Ihre Bestelldaten bereit.",
  it: "Grazie per il messaggio relativo al tuo ordine. Abbiamo ricevuto la richiesta e ti risponderemo {sla}. Tieni a portata i dettagli dell'ordine.",
  fr: "Merci pour votre message concernant votre commande. Nous avons bien reçu votre demande et vous répondrons {sla}. Merci de garder les détails de commande.",
};

export const DEFAULT_GREETING_TEMPLATES = {
  en: "Hello! Thanks for reaching out. How can we help you today?",
  es: "¡Hola! Gracias por escribirnos. ¿En qué podemos ayudarte?",
  pt: "Olá! Obrigado por entrar em contato. Como podemos ajudar?",
  vi: "Xin chào! Cảm ơn bạn đã liên hệ. Shop có thể hỗ trợ gì cho bạn?",
  th: "สวัสดีค่ะ ขอบคุณที่ติดต่อร้าน มีอะไรให้ช่วยไหมคะ?",
  fil: "Hello po! Salamat sa pag-message. Paano po kami makakatulong?",
  ms: "Hai! Terima kasih kerana menghubungi kami. Apa yang boleh kami bantu?",
  zh: "您好！感谢联系本店，请问有什么可以帮您？",
  id: "Halo! Terima kasih telah menghubungi kami. Ada yang bisa kami bantu?",
  ja: "こんにちは。お問い合わせありがとうございます。どのようなご用件でしょうか？",
  de: "Hallo! Danke für Ihre Nachricht. Womit können wir Ihnen helfen?",
  it: "Ciao! Grazie per averci contattato. Come possiamo aiutarti?",
  fr: "Bonjour ! Merci de nous avoir contactés. Comment pouvons-nous vous aider ?",
};

export const DEFAULT_SLA_DAY_BY_LANG = {
  en: "within 2 hours",
  es: "en 2 horas",
  pt: "em 2 horas",
  vi: "trong 2 giờ",
  th: "ภายใน 2 ชั่วโมง",
  fil: "sa loob ng 2 oras",
  ms: "dalam 2 jam",
  zh: "2 小时内",
  id: "dalam 2 jam",
  ja: "2時間以内",
  de: "innerhalb von 2 Stunden",
  it: "entro 2 ore",
  fr: "sous 2 heures",
};

export const DEFAULT_SLA_NIGHT_BY_LANG = {
  en: "within 9 hours (next business window, Beijing time)",
  es: "en 9 horas (próximo horario laboral, hora de Pekín)",
  pt: "em 9 horas (próximo horário comercial, horário de Pequim)",
  vi: "trong 9 giờ (khung giờ làm việc tiếp theo, giờ Bắc Kinh)",
  th: "ภายใน 9 ชั่วโมง (รอบทำการถัดไป ตามเวลาปักกิ่ง)",
  fil: "sa loob ng 9 oras (susunod na business window, Beijing time)",
  ms: "dalam 9 jam (waktu perniagaan seterusnya, waktu Beijing)",
  zh: "9 小时内（北京时间下一工作时段）",
  id: "dalam 9 jam (jam kerja berikutnya, waktu Beijing)",
  ja: "9時間以内（北京時間の次の営業時間帯）",
  de: "innerhalb von 9 Stunden (nächstes Zeitfenster, Peking-Zeit)",
  it: "entro 9 ore (prossima finestra lavorativa, ora di Pechino)",
  fr: "sous 9 heures (prochaine plage ouvrée, heure de Pékin)",
};

export function pickLocalizedTemplate(map = {}, lang, fallbackLang = "en") {
  const key = String(lang || "").trim();
  if (key && map[key]) return map[key];
  if (map[fallbackLang]) return map[fallbackLang];
  if (map.en) return map.en;
  const first = Object.values(map).find(Boolean);
  return first || "";
}
