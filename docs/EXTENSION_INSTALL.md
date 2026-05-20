# TikTok 插件 · 卖家安装与分发

## 卖家从哪里装？

| 渠道 | 说明 |
|------|------|
| **凡梦网站工作台** | 登录 → 顶部横幅 / 侧栏「安装 TikTok 插件」→ 图文向导 |
| **Chrome 网上应用店** | 上架后一键安装（配置 `VITE_EXTENSION_CWS_URL`） |
| **ZIP 离线包** | `/downloads/fanmeng-tiktok-extension.zip`（开发者模式加载） |

## 运营侧发布流程

### 1. 配置环境变量

**前端（`.env.production` 或构建机）：**

```env
VITE_PUBLIC_API_URL=https://api.你的域名
VITE_PUBLIC_APP_URL=https://你的域名
VITE_EXTENSION_CWS_URL=https://chrome.google.com/webstore/detail/xxxx
VITE_EXTENSION_ZIP_URL=/downloads/fanmeng-tiktok-extension.zip
VITE_EXTENSION_PRIVACY_URL=https://你的域名/privacy-extension.html
```

**插件打包（`extension/build.env`）：**

```env
EXTENSION_DEFAULT_API_BASE=https://api.你的域名
EXTENSION_WEBSITE_URL=https://你的域名
EXTENSION_PRIVACY_URL=https://你的域名/privacy-extension.html
VITE_EXTENSION_CWS_URL=https://chrome.google.com/webstore/detail/xxxx
```

### 2. 打包 ZIP

```bash
npm install
npm run build:extension
npm run build
```

将 `public/downloads/fanmeng-tiktok-extension.zip` 随网站一起部署。

### 3. GitHub Release（可选）

```bash
git tag extension-v0.3.0
git push origin extension-v0.3.0
```

Actions 工作流 `.github/workflows/extension-release.yml` 会自动构建并附 ZIP。

### 4. Chrome 网上应用店

详见 [CHROME_WEB_STORE.md](./CHROME_WEB_STORE.md)。

## 相关文件

- 网站安装 UI：`src/extensionInstallUi.jsx`
- 插件打包：`extension/scripts/build.mjs`
- 隐私页：`public/privacy-extension.html`
