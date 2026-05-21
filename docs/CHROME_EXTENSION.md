# 浏览器插件方案（绕过 TikTok Open API）

凡梦 AI 在 **不过 Partner / 不配置 OAuth** 的前提下，通过 Chrome 插件让卖家在 **已登录的 TikTok 卖家中心** 内完成：

- 店铺页面数据同步 → **业绩诊断、广告库存利润** Agent（连接版）
- 聊天页消息 → **AI 客服** 话术草稿（半自动）

## 架构

```text
卖家 Chrome（TikTok 卖家中心已登录）
        │
        ▼
  extension/  Content Script
  · 抓取 DOM 快照
  · 客服页生成/填入草稿
        │
        ▼
  凡梦 server（/api/extension/*）
  · 存 extensionSnapshots
  · 调 LLM / Agent
        │
        ▼
  工作台 / 插件面板展示结果
```

与 **官方 API 路线** 可并存：以后 Partner 批下来，同一套 Agent 可改为 `useStoreSnapshot`；插件数据走 `useExtensionSnapshot`。

## 卖家侧步骤

1. 安装插件（见 `extension/README.md`）  
2. 登录凡梦账号（与网站相同）  
3. 打开 TikTok 卖家中心 → 使用右侧浮动面板  

## 平台方（你）步骤

1. 部署凡梦后端（含 `/api/extension/*` 路由）  
2. 配置 `extension/build.env` 后执行 `npm run build:extension` 生成 ZIP  
3. 网站 `.env` 配置 `VITE_EXTENSION_CWS_URL` 等（见 `docs/EXTENSION_INSTALL.md`）  
4. 工作台内已内置 **安装向导** 与 `/downloads/*.zip` 下载  

## 自动化程度

| 能力 | 插件可实现 | 说明 |
|------|------------|------|
| 客服话术 | 高 | FAQ/问候/夜间 AI 自动填入并发送；复杂问题白天为草稿 |
| 业绩诊断 | 中 | 依赖卖家打开数据页 + 同步 |
| 广告/利润 | 中 | 缺成本表时需卖家补充 CSV |
| 7×24 无人 | 低（高级） | 需 Partner Webhook + Open API，非主流程 |

## 相关代码

- 插件：`extension/`  
- 服务端路由：`server/extensionRoutes.js`  
- 快照存储：`server/extensionSync.js`  
- Agent 注入：`POST /api/agents/run` 参数 `useExtensionSnapshot: true`
