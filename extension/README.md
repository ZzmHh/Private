# 凡梦AI · TikTok Shop Chrome 助手

在 **卖家已登录的 TikTok 卖家中心** 内运行，无需 TikTok Open API / Partner 应用。  
数据通过浏览器读取当前页面，发送到凡梦 SaaS 生成 **客服话术、业绩诊断、广告库存利润** 分析。

## 功能（v0.1）

| 功能 | 说明 |
|------|------|
| **同步本页** | 抓取当前后台页指标/表格/文本样本，上传到凡梦 |
| **AI 客服话术** | 识别聊天页消息 → 生成回复草稿 → 一键填入输入框（**需人工发送**） |
| **业绩诊断** | 同步 + 调用 `growth` Agent |
| **广告库存利润** | 同步 + 调用 `profit` Agent |
| **定时同步** | 弹窗可开启，按间隔自动同步（卖家中心需保持打开） |

## 安装（开发者模式）

1. 启动凡梦后端：`npm run dev:server`（默认 `http://127.0.0.1:8787`）  
2. Chrome 打开 `chrome://extensions/`  
3. 开启 **开发者模式** → **加载已解压的扩展程序**  
4. 选择本仓库 **`extension`** 文件夹  
5. 点击扩展图标 → 配置 API 地址 → **用凡梦网站同一账号登录**  
6. 打开 [TikTok 卖家中心](https://seller.tiktok.com/) 并 **刷新页面** → 右侧出现「凡梦AI」面板  

生产环境请将 API 地址改为 `https://你的域名`（需 HTTPS，且服务端已部署）。

## 后端 API（已实现）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/extension/status` | 登录与快照状态 |
| POST | `/api/extension/snapshot` | 上传页面抓取 JSON |
| POST | `/api/extension/cs/suggest` | 买家话术（短回复） |
| POST | `/api/extension/analyze` | `growth` / `profit` / `service` 分析 |

网站工作台调用 Agent 时也可传 `useExtensionSnapshot: true` 使用最近插件同步的数据。

## 限制与合规

- 依赖 TikTok **网页 DOM**，改版后可能需要更新选择器。  
- **不会自动点击发送**，避免误回复与平台自动化风险。  
- 页面数据为 **样本/不完整**，利润分析仍可能需要卖家在凡梦内补充 SKU 成本。  
- 请在使用说明中告知卖家：辅助工具，非 TikTok 官方应用。

## 目录结构

```text
extension/
├── manifest.json
├── popup/           # 登录与设置
├── src/
│   ├── background.js
│   ├── content/     # 卖家中心浮动面板
│   └── lib/         # API、存储、页面抓取
└── README.md
```

更完整的架构说明见仓库根目录 `docs/CHROME_EXTENSION.md`。
