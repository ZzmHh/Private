import React from "react";
import { Globe, Download, ExternalLink, ShieldCheck, X } from "lucide-react";
import { extensionInstallConfig } from "./extensionInstallConfig.js";
import { trackEvent } from "./lib/analytics.js";

function trackExtensionInstall(source) {
  trackEvent("extension_install_click", { source }, { token: localStorage.getItem("fanmeng_token") || "" });
}

const STEPS = [
  {
    title: "安装浏览器插件",
    body: "优先使用 Chrome 网上应用店一键安装；若无法访问商店，可下载 ZIP 后「加载已解压的扩展程序」。",
  },
  {
    title: "登录凡梦账号",
    body: "点击插件图标，API 地址已预填（生产包无需改）。用与本网站相同的邮箱密码登录。",
  },
  {
    title: "打开 TikTok 卖家中心",
    body: "登录你的店铺后台，刷新页面后右侧出现「凡梦AI」面板，点「绑定本页店铺」。",
  },
  {
    title: "试用客服 / 诊断",
    body: "聊天页选中买家文字 →「手动生成话术」；或依次打开数据/订单/广告/库存页同步诊断包。",
  },
];

function apiHint() {
  return extensionInstallConfig.defaultApiBase || "与凡梦网站 API 相同（部署后由运营配置）";
}

export function ExtensionInstallPanel({ compact = false, onDismiss }) {
  const { chromeStoreUrl, zipDownloadUrl, privacyUrl } = extensionInstallConfig;
  const hasStore = Boolean(chromeStoreUrl);

  return (
    <section className={`extension-install ${compact ? "is-compact" : ""}`} aria-labelledby="ext-install-h">
      <div className="extension-install-head">
        <div>
          <h3 id="ext-install-h">安装 TikTok Shop 浏览器助手</h3>
          <p className="extension-install-sub">
            标准版 / 试用含此功能。在卖家中心内生成客服话术、同步页面做业绩诊断，<strong>不会自动发送消息</strong>。
          </p>
        </div>
        {onDismiss ? (
          <button type="button" className="extension-install-dismiss" aria-label="关闭提示" onClick={onDismiss}>
            <X size={18} />
          </button>
        ) : null}
      </div>

      <div className="extension-install-actions">
        {hasStore ? (
          <a
            className="continue-checkout slim extension-install-primary"
            href={chromeStoreUrl}
            target="_blank"
            rel="noreferrer"
            onClick={() => trackExtensionInstall("chrome_store")}
          >
            <Globe size={16} />
            从 Chrome 应用商店安装
          </a>
        ) : (
          <span className="extension-install-note">Chrome 商店链接未配置，请先用下方 ZIP 安装（运营可在 .env 填 VITE_EXTENSION_CWS_URL）。</span>
        )}
        <a className="header-ghost slim" href={zipDownloadUrl} download="fanmeng-tiktok-extension.zip" onClick={() => trackExtensionInstall("zip_download")}>
          <Download size={16} />
          下载 ZIP（离线 / 开发者模式）
        </a>
        <a className="header-ghost slim" href={privacyUrl} target="_blank" rel="noreferrer">
          <ShieldCheck size={16} />
          隐私说明
        </a>
      </div>

      <ol className="extension-install-steps">
        {STEPS.map((step, i) => (
          <li key={step.title}>
            <strong>
              {i + 1}. {step.title}
            </strong>
            <span>{step.body}</span>
          </li>
        ))}
      </ol>

      {!compact ? (
        <details className="extension-install-zip-detail">
          <summary>无法访问 Chrome 商店？ZIP 安装步骤</summary>
          <ol>
            <li>下载上方 ZIP 并解压到文件夹。</li>
            <li>Chrome 打开 <code>chrome://extensions/</code>，开启「开发者模式」。</li>
            <li>点击「加载已解压的扩展程序」，选择解压后的文件夹。</li>
            <li>插件弹窗 API 填：<code>{apiHint()}</code>，登录凡梦账号。</li>
            <li>指纹浏览器 / Edge 大多同样支持加载解压扩展。</li>
          </ol>
        </details>
      ) : null}

      <p className="extension-install-footer">
        安装后请<strong>刷新 TikTok 卖家中心</strong>。更新插件：商店会自动更新；ZIP 用户需重新下载并覆盖加载。
      </p>
    </section>
  );
}

export function ExtensionInstallModal({ onClose }) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="extension-install-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ext-install-modal-h"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="extension-install-modal-bar">
          <h2 id="ext-install-modal-h">TikTok 插件安装向导</h2>
          <button type="button" className="header-ghost slim" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </div>
        <ExtensionInstallPanel />
      </section>
    </div>
  );
}

export function ExtensionInstallBanner({ onOpenGuide, onDismiss }) {
  return (
    <div className="extension-install-banner" role="status">
      <div>
        <strong>下一步：安装 TikTok 卖家中心插件</strong>
        <span>在浏览器里用 AI 写买家回复、同步店铺页面做诊断（需标准版或试用）。</span>
      </div>
      <div className="extension-install-banner-actions">
        <button type="button" className="continue-checkout slim" onClick={onOpenGuide}>
          <ExternalLink size={14} />
          查看安装步骤
        </button>
        <button type="button" className="header-ghost slim" onClick={onDismiss}>
          稍后
        </button>
      </div>
    </div>
  );
}
