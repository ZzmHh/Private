# 分层 TikTok 客服（FAQ / 夜间 AI / 售后）

## 策略

| 优先级 | 条件 | 动作 |
|--------|------|------|
| 1 | 售后关键词（退款、损坏…） | 发**安抚模板**（含 SLA）+ **通知卖家** |
| 2 | 命中 **FAQ 模板**（插件存模板并同步服务端） | **自动发送** |
| 3 | 非售后 + FAQ 未命中 + **北京时间 23:00–09:00** | **夜间 AI** 自动发（带页面上下文） |
| 4 | 白天其他 | 生成草稿，**不自动发** |

## 插件

- 自动监听 / 手动生成 → `POST /api/extension/cs/route`
- FAQ 模板保存时同步 → `POST /api/extension/cs/faq/sync`
- 售后告警面板 → `GET /api/extension/cs/alerts`
- 自动发送：填入聊天框并尝试点击「发送/Send」

## Webhook（7×24）

- 路径：`POST /webhooks/tiktok`
- 需店铺配置 `autoBuyerReply` + TikTok 凭据
- 同样走 `routeBuyerMessage`，有 `conversation_id` 时 API 出站

## 配置

- 默认设置：`server/autoReply/csStore.js` → `defaultCsAutomationSettings()`
- 按用户覆盖：`POST /api/extension/cs/settings`

## 模板变量

- `{sla}` — 处理时限（夜间/白天、中英文）
- `{shopName}` — 店铺名

## 注意

- 价格类 FAQ 请用固定模板，勿让 AI 编价
- 插件自动点发送依赖 TikTok 页面 DOM，失败时会保留填入草稿
- 生产 Webhook 建议先 `TIKTOK_CS_SEND_DRY_RUN=1` 试跑
