# Chrome 网上应用店 · 上架清单

## 一次性准备

1. [Chrome 开发者控制台](https://chrome.google.com/webstore/devconsole) 注册（约 $5）
2. 域名 HTTPS 部署凡梦 API + 网站
3. 执行 `npm run build:extension`，用 **生产 config** 测一遍插件
4. 隐私政策 URL：`https://你的域名/privacy-extension.html`（仓库 `public/privacy-extension.html`）

## 商店素材

| 项 | 建议 |
|----|------|
| **名称** | 凡梦AI · TikTok Shop 助手 |
| **简短说明** | TikTok 卖家中心 AI 客服话术与业绩诊断，需凡梦账号订阅。 |
| **详细说明** | 强调：不自动发消息、需登录凡梦、标准版功能、支持 US/SEA 卖家中心 |
| **类别** | 生产力工具 |
| **图标** | 128×128 PNG（可从凡梦 logo 导出） |
| **截图** | 3–5 张：卖家中心面板、话术生成、诊断包进度、插件弹窗登录 |
| **权限说明** | 仅 TikTok 卖家域名 + 凡梦 API；见下方「审核用语」 |

## 审核用语（permissions justification）

**host_permissions – seller.tiktok.com 等**

> 扩展仅在 TikTok Shop 卖家中心注入浮动面板，读取用户当前页面的店铺数据与聊天文本，用于 AI 话术与诊断。不访问其他网站。

**host_permissions – 凡梦 API**

> 用户登录凡梦 SaaS 账号后，将页面摘要发送至用户自己的凡梦服务器以生成 AI 回复与分析。无账号无法使用核心功能。

**storage**

> 保存登录令牌、店铺绑定、回复模板与用户设置。

**contextMenus / commands**

> 卖家选中买家聊天文字后，右键或快捷键触发「生成回复草稿」，不自动发送。

## 提交包

方式 A：上传 `public/downloads/fanmeng-tiktok-extension.zip` 解压后的文件夹（勿含 `scripts/`）

方式 B：在 Chrome 开发者控制台「打包扩展程序」

提交前检查：

- [ ] `FanmengExtensionConfig.BUILD === "production"`
- [ ] `DEFAULT_API_BASE` 为生产 HTTPS 地址
- [ ] manifest 版本号已递增
- [ ] 无 `127.0.0.1` 硬编码（生产包）

## 上架后

1. 复制商店链接到 `.env`：`VITE_EXTENSION_CWS_URL=...`
2. 重新 `npm run build` 部署网站
3. 更新 `extension/build.env` 中 CWS URL 并重新打 ZIP（可选，用于官网展示）

## 国内卖家补充

商店无法访问时，官网继续提供 ZIP + 图文「加载已解压的扩展程序」。指纹浏览器 / Edge 同理。

## 合规提示

- 说明 **非 TikTok 官方应用**
- 说明 **AI 草稿需人工发送**
- 订阅与计费在凡梦网站，插件为客户端
