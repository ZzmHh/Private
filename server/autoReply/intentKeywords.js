/**
 * 15 国站点 · 本地语意图关键词（售前 FAQ / 售后）
 * 与 shared/tiktokShopLanguages 语言策略对齐
 */

export const AFTERSALES_PATTERNS = [
  /退款|退货|换货|补发|少发|错发|漏发|损坏|破损|质量问题|差评|投诉|纠纷|赔偿|改价|取消订单|没收到|未收到/i,
  /refund|return|exchange|damaged|broken|wrong item|missing|not received|chargeback|dispute|complaint|bad review|where is my order/i,
  /reembolso|devolución|devolucion|devolver|reclamo|queja|no llegó|no llego|pedido perdido/i,
  /reembolso|devolução|devolucao|troca|reclamação|reclamacao|não recebi|nao recebi|pedido errado/i,
  /hoàn tiền|đổi trả|doi tra|khiếu nại|khieu nai|hàng lỗi|hang loi|chưa nhận|chua nhan|giao sai/i,
  /คืนเงิน|คืนสินค้|ของเสีย|ของชำรุด|ยังไม่ได้รับ|ส่งผิด/i,
  /refund|pabalik|sira|depekto|hindi dumating|maling order|reklamo/i,
  /bayaran balik|pulangan|rosak|salah barang|tak terima|komplen/i,
  /pengembalian|refund|rusak|cacat|belum terima|salah kirim|komplain/i,
  /返金|返品|交換|破損|届かない|届いてない|クレーム/i,
  /erstattung|rückerstattung|rueckerstattung|retoure|beschädigt|beschadigt|nicht erhalten|reklamation/i,
  /rimborso|reso|difettoso|non arrivato|reclamo/i,
  /remboursement|retour|endommagé|endommage|pas reçu|pas recu|réclamation|reclamation/i,
];

export const GREETING_PATTERNS = [
  /^(hi|hello|hey|yo|good morning|good evening|greetings)[\s!?.,。！？]*$/i,
  /^(hola|buenos días|buenas tardes|buenas noches)[\s!?.,。！？]*$/i,
  /^(olá|ola|bom dia|boa tarde|boa noite)[\s!?.,。！？]*$/i,
  /^(xin chào|chao ban|chào shop)[\s!?.,。！？]*$/i,
  /^(สวัสดี|หวัดดี)[\s!?.,。！？]*$/i,
  /^(kamusta|magandang|hello po)[\s!?.,。！？]*$/i,
  /^(hai|helo|selamat)[\s!?.,。！？]*$/i,
  /^(在吗|你好|您好|哈喽|有人吗|嗨)[\s!?。！？]*$/i,
  /^(halo|selamat)[\s!?.,。！？]*$/i,
  /^(こんにちは|こんばんは|はじめまして)[\s!?。！？]*$/i,
  /^(hallo|guten tag|guten morgen)[\s!?.,。！？]*$/i,
  /^(ciao|buongiorno|buonasera)[\s!?.,。！？]*$/i,
  /^(bonjour|bonsoir|salut)[\s!?.,。！？]*$/i,
];

export const FAQ_PRICE_PATTERNS = [
  /多少钱|什么价|价格|售价|几元|优惠|打折|coupon|promo|\$\s*\d|usd|discount|how much|price|cost/i,
  /precio|cuánto|cuanto|cuanto cuesta|magkano|presyo|harga|berapa|giá|gia bao nhieu|ราคา|เท่าไห|prezzo|prix|preis/i,
];

export const FAQ_SHIPPING_PATTERNS = [
  /运费|物流|几天到|多久到|发货|快递|tracking|ship|shipping|delivery|when will i receive|arrive|where is my/i,
  /envío|envio|entrega|cuándo llega|cuando llega|kailan darating|padala|pengiriman|kapan sampai|ongkir|giao hàng|giao hang|vận chuyển|van chuyen|จัดส่ง|ส่งของ|penghantaran|配送|届く|versand|lieferung|spedizione|livraison/i,
];

export const FAQ_STOCK_PATTERNS = [
  /有货|库存|还有吗|in stock|available|out of stock|缺货|pre order|preorder/i,
  /stok|stock|masih ada|còn hàng|con hang|het hang|hết hàng|มีของ|หมด|sold out|disponible|disponível|disponivel|verfügbar|verfugbar|disponibile/i,
];

export const FAQ_PRODUCT_PATTERNS = [
  /尺码|size|颜色|color|材质|material|规格|怎么用|how to use|是什么|what is|dimension|measurement/i,
  /talla|talle|color|material|tamanho|cor|ukuran|warna|kích thước|kich thuoc|ขนาด|สี|ukuran|saiz|サイズ|色|größe|groesse|farbe|taglia|colore|taille|couleur/i,
];

export function matchesAny(text, patterns) {
  return patterns.some((re) => re.test(text));
}
