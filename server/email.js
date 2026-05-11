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
