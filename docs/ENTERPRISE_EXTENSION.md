# 企业浏览器助手（与凡梦 C 端插件隔离）

独立 Chrome 扩展，面向**企业站**（`enterprise.html`）：

| 项 | 凡梦 C 端 `extension/` | 企业站 `enterprise-extension/` |
|----|------------------------|--------------------------------|
| 品牌 / manifest | 凡梦AI | 企业 AI |
| 登录 | `/api/auth/login` · `fanmeng_token` | `/api/enterprise/auth/login` · `enterprise_token` |
| 插件 API | `/api/extension/*` | `/api/enterprise/extension/*` |
| 数据隔离 | userId | orgId + shopId（`scopeKey = ent:{orgId}:{shopId}`） |
| 存储键 | `fanmeng_settings` | `enterprise_settings` |

## 本地开发

1. 启动后端 `npm run dev:server`（:8787）与前端 `npm run dev`（:5173）
2. Chrome → `chrome://extensions` → 开发者模式 → **加载已解压的扩展程序** → 选择 `enterprise-extension/`
3. 弹窗填写 API `http://127.0.0.1:8787`，用企业账号登录（如 `admin` / `admin123`）
4. 选择已绑定的 **shopId**，在 TikTok 卖家中心点「同步本页到企业站」

## 打包

```bash
cp enterprise-extension/build.env.example enterprise-extension/build.env
npm run build:enterprise-extension
```

产物：`public/downloads/enterprise-tiktok-extension.zip`

## 说明

- 当前 content script 为**精简版**（页面快照同步）；完整客服监听可从 `extension/` 逐步迁移，但须全部改用 `EnterpriseApi` 与企业路径。
- 企业工作台前端已改走 `/api/enterprise/extension/*`，并在顶部店铺栏传入 `shopId`。

## 创意 API（ChatGPT 图片 + Seedance 视频）

密钥仅配置在服务器 `.env`，前端通过 `enterprise_token` 调用：

| 能力 | 环境变量 | 接口 |
|------|----------|------|
| 文本 Agent（选品/Listing/内容等） | `OPENCLAW_API_KEY` | `POST /api/enterprise/agents/run` |
| 图片（图文美化工具） | 同上 + `OPENAI_IMAGE_MODEL` | `POST /api/enterprise/creative/image/generate` |
| Seedance 2.0 视频 | `VOLC_ARK_API_KEY` | `POST /api/enterprise/creative/video/tasks` |

查询配置：`GET /api/enterprise/creative/status`
