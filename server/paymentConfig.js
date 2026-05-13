/**
 * 支付展示配置（不含密钥）。个人收款阶段：展示收款码 URL + 文案；
 * 后续可改 PAYMENT_PROVIDER 并接入微信/支付宝商户或 Stripe 等。
 */

export function buildPaymentPublicConfig(req) {
  const provider = process.env.PAYMENT_PROVIDER || "personal_qr";

  const forwardedProto = req.get("x-forwarded-proto");
  const proto = forwardedProto?.split(",")[0]?.trim() || (req.protocol || "http");
  const port = Number(process.env.PORT || 8787);
  const fallbackHost = port === 80 || port === 443 ? "127.0.0.1" : `127.0.0.1:${port}`;
  const host = process.env.PUBLIC_PAYMENT_HOST || req.get("host") || fallbackHost;
  const base =
    process.env.PUBLIC_APP_BASE_URL?.replace(/\/$/, "") ||
    `${proto}://${host}`;

  const wechatPath = process.env.PERSONAL_PAYMENT_WECHAT_QR_URL || "/payment/wechat-receive.svg";
  const alipayPath = process.env.PERSONAL_PAYMENT_ALIPAY_QR_URL || "/payment/alipay-receive.svg";

  function abs(u) {
    if (!u) return "";
    if (/^https?:\/\//i.test(u)) return u;
    const path = u.startsWith("/") ? u : `/${u}`;
    return `${base}${path}`;
  }

  const isProduction = process.env.NODE_ENV === "production";

  return {
    provider,
    personalQr: {
      wechatQrUrl: abs(wechatPath),
      alipayQrUrl: abs(alipayPath),
      transferNoteHint:
        process.env.PERSONAL_PAYMENT_TRANSFER_HINT ||
        "转账时请务必备注「订单号」或订单号后四位，否则无法自动关联。",
      contactHint: process.env.PERSONAL_PAYMENT_CONTACT || "",
      legalNote:
        process.env.PERSONAL_PAYMENT_LEGAL_NOTE ||
        "当前为个人收款码，非持牌商户收单；无法在线自动开票。取得经营主体后可切换对公或持牌支付通道。",
    },
    simulateEnabled: !isProduction,
  };
}
