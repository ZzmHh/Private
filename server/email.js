import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM || smtpUser;

function isSmtpConfigured() {
  return Boolean(smtpHost && smtpUser && smtpPass && smtpFrom);
}

export async function sendVerificationEmail({ to, code, name = "跨境卖家" }) {
  if (!isSmtpConfigured()) {
    return {
      delivered: false,
      reason: "SMTP_NOT_CONFIGURED",
      devCode: code,
    };
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  await transporter.sendMail({
    from: smtpFrom,
    to,
    subject: "凡梦AI 邮箱验证码",
    text: `你好，${name}。\n\n你的凡梦AI 邮箱验证码是：${code}\n\n验证码 10 分钟内有效。如果不是你本人操作，请忽略这封邮件。`,
    html: `
      <div style="font-family:Arial,'Microsoft YaHei',sans-serif;line-height:1.7;color:#172033;">
        <h2 style="margin:0 0 12px;">凡梦AI 邮箱验证</h2>
        <p>你好，${name}。</p>
        <p>你的邮箱验证码是：</p>
        <div style="font-size:28px;font-weight:800;letter-spacing:6px;color:#155eef;">${code}</div>
        <p>验证码 10 分钟内有效。如果不是你本人操作，请忽略这封邮件。</p>
      </div>
    `,
  });

  return { delivered: true };
}

export async function sendPasswordResetEmail({ to, code, name = "跨境卖家" }) {
  if (!isSmtpConfigured()) {
    return {
      delivered: false,
      reason: "SMTP_NOT_CONFIGURED",
      devCode: code,
    };
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  await transporter.sendMail({
    from: smtpFrom,
    to,
    subject: "凡梦AI 重置密码验证码",
    text: `你好，${name}。\n\n你的凡梦AI 重置密码验证码是：${code}\n\n验证码 10 分钟内有效。如果不是你本人操作，请忽略这封邮件。`,
    html: `
      <div style="font-family:Arial,'Microsoft YaHei',sans-serif;line-height:1.7;color:#172033;">
        <h2 style="margin:0 0 12px;">凡梦AI 重置密码</h2>
        <p>你好，${name}。</p>
        <p>你的重置密码验证码是：</p>
        <div style="font-size:28px;font-weight:800;letter-spacing:6px;color:#155eef;">${code}</div>
        <p>验证码 10 分钟内有效。如果不是你本人操作，请忽略这封邮件。</p>
      </div>
    `,
  });

  return { delivered: true };
}

function resolveAdminNotifyEmails() {
  const direct = String(process.env.ADMIN_NOTIFY_EMAIL || "").trim();
  if (direct) return [direct];
  const raw = String(process.env.ADMIN_EMAILS || "").trim();
  if (!raw) return [];
  return raw
    .split(/[,;]+/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function sendPaymentClaimAdminEmail({ order, user, confirmUrl }) {
  const recipients = resolveAdminNotifyEmails();
  if (!recipients.length) {
    return { delivered: false, reason: "ADMIN_NOTIFY_NOT_CONFIGURED", confirmUrl };
  }

  if (!isSmtpConfigured()) {
    return { delivered: false, reason: "SMTP_NOT_CONFIGURED", confirmUrl };
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  const planLabel = order.planId || "未知套餐";
  const subject = `【凡梦AI】待确认收款 · ${order.orderNo}`;
  const text = [
    "有新的个人收款订单待确认：",
    "",
    `订单号：${order.orderNo}`,
    `套餐：${planLabel}`,
    `金额：¥${order.amount}`,
    `用户：${user?.name || "跨境卖家"} (${user?.email || "-"})`,
    order.payerNote ? `用户备注：${order.payerNote}` : "",
    "",
    "手机端一键确认（7 天内有效）：",
    confirmUrl,
    "",
    "用户已自动获得 24 小时临时套餐权限，核实后可正式开通。",
  ]
    .filter(Boolean)
    .join("\n");

  await transporter.sendMail({
    from: smtpFrom,
    to: recipients.join(","),
    subject,
    text,
    html: `
      <div style="font-family:Arial,'Microsoft YaHei',sans-serif;line-height:1.7;color:#172033;max-width:560px;">
        <h2 style="margin:0 0 12px;">待确认收款</h2>
        <p>订单 <strong>${order.orderNo}</strong> · ${planLabel} · <strong>¥${order.amount}</strong></p>
        <p>用户：${user?.name || "跨境卖家"}（${user?.email || "-"}）</p>
        ${order.payerNote ? `<p>备注：${order.payerNote}</p>` : ""}
        <p style="margin:20px 0;">
          <a href="${confirmUrl}" style="display:inline-block;background:#155eef;color:#fff;text-decoration:none;padding:14px 22px;border-radius:12px;font-weight:800;">
            手机端确认开通
          </a>
        </p>
        <p style="font-size:13px;color:#667085;">用户已自动获得 24 小时临时权限；确认后将转为正式订阅。</p>
      </div>
    `,
  });

  return { delivered: true, confirmUrl };
}
