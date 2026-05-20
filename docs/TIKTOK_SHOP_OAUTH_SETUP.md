# TikTok Shop OAuth 接入教程（凡梦 AI 本项目）

我无法代替你登录 TikTok、也无法帮你通过平台审核；下面是从零到能点「OAuth 连接」的**自操作清单**。菜单名称可能随 Partner 后台改版略有不同，以你页面上实际文案为准。

---

## 你需要先搞清楚的三件事

1. **谁的身份**：使用的是 **TikTok Shop 合作伙伴（Partner / 开发者）** 账号，不是普通买家号。没有在 Partner Center 完成入驻/认证前，往往看不到「创建应用」或拿不到有效 `app_key`。
2. **回调 URL 是写在你自己的应用里的**：`TIKTOK_SHOP_OAUTH_REDIRECT_URI` 不是向抖音「单独申请」来的，而是在 **Partner Center → 你的应用** 里配置「授权回调 / Redirect URL」，再抄到本项目的 `.env`。
3. **卖家授权**：OAuth 是 **每个卖家在浏览器里点同意**，你的服务器用返回的 `code` 换 `access_token`，再调 Open API。没有卖家点授权，就不会有有效店铺令牌。

---

## 本项目里 OAuth 走哪条路

| 步骤 | 地址 | 说明 |
|------|------|------|
| 卖家点「使用 TikTok Shop OAuth 连接」 | 前端 → `POST /api/store/tiktok/oauth/url` | 需已登录凡梦账号 |
| 跳转到 TikTok 授权页 | TikTok 官方域名 | 由 `TIKTOK_SHOP_OAUTH_FLOW` 决定具体入口 |
| 卖家同意后浏览器回跳 | **`GET /api/store/tiktok/oauth/callback`** | 必须与 Partner 里登记的 URL **逐字符一致** |
| 换票 + 拉店铺列表 | 服务端调 `auth.tiktok-shops.com` + `open-api.tiktokglobalshop.com` | 已实现 |

**固定路径（不要改）**：回调必须是：

```text
https://你的域名/api/store/tiktok/oauth/callback
```

若 API 不带路径前缀，也是「你的公网域名 + 上面这条路径」。

---

## A. 在 TikTok Shop Partner Center 里要做什么

1. 打开 **[TikTok Shop Partner Center](https://partner.tiktokshop.com/)** 并登录合作伙伴账号。  
2. 找到 **应用 / Open API / 开发者** 相关入口（常见名：「我的应用」「创建应用」）。  
3. **创建应用**（或打开已有应用），记下：
   - **App Key**（有时与文档里的 `service_id` 对应，以你控制台显示为准）
   - **App Secret**（仅保存在服务端，不要提交到 git、不要给前端）
4. 在应用的 **OAuth / 授权 / 安全 / 回调地址** 类设置中，新增 **Redirect URI / Callback URL**：
   ```text
   https://你的正式域名/api/store/tiktok/oauth/callback
   ```
5. 保存后，在文档中确认你需要的 **授权范围（scopes）** 是否已勾选（至少需要能读订单/店铺等，否则后续快照接口会失败）。  
6. 若后台区分 **美区 / 全球** 等，请按你店铺所在区域选择对应应用或文档说明（本代码可通过环境变量切换授权入口，见下文）。

> **菜单找不到？** 以 Partner 当前 **[文档](https://partner.tiktokshop.com/doc)** 里「Authorization / OAuth」章节为准，或联系 TikTok 运营/AM。

---

## B. 在本项目 `.env` 里怎么配

在项目根目录 `.env`（可对照 `.env.example`）至少填写：

```env
# 来自 Partner Center 应用详情
TIKTOK_SHOP_APP_KEY=你的_app_key
TIKTOK_SHOP_APP_SECRET=你的_app_secret

# 与 Partner 里登记的回调完全一致（建议直接复制粘贴）
TIKTOK_SHOP_OAUTH_REDIRECT_URI=https://你的域名/api/store/tiktok/oauth/callback

# 授权结束后浏览器回到的前端（生产是你的网站首页；本地见下一节）
APP_PUBLIC_URL=https://你的前端域名
# 本地开发示例：APP_PUBLIC_URL=http://127.0.0.1:5173

# 生产建议单独设一条随机长串，多机部署要相同
TIKTOK_OAUTH_STATE_SECRET=随机长字符串与JWT_SECRET不同
```

可选（**授权页打不开或报错时再接**）：

```env
# 默认 authv2；若官方要求旧入口可改为 open
# TIKTOK_SHOP_OAUTH_FLOW=open

# open 流美区示例
# TIKTOK_SHOP_AUTH_HOST=https://services.us.tiktokshop.com

# 若 service_id 与 app_key 不一致（少数应用）
# TIKTOK_SHOP_SERVICE_ID=xxxx
```

改完 **重启** `node server/index.js`（或 Docker 容器）。

---

## C. 本地电脑调试（重要）

TikTok **通常要求**回调 URL 是 **HTTPS 公网可访问** 地址，`http://127.0.0.1:8787/...` 往往**不能**在 Partner 里通过校验。

**推荐做法**：

1. 在你电脑上跑：后端 `8787`、前端 `5173`（Vite 已把 `/api` 代理到 8787）。  
2. 用 **内网穿透** 暴露 8787，例如：
   - [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)
   - [ngrok](https://ngrok.com/) 等  
3. 假设穿透得到：`https://abc.example.com` → 本机 `8787`，则在 Partner 里填：
   ```text
   https://abc.example.com/api/store/tiktok/oauth/callback
   ```
   `.env` 里 **`TIKTOK_SHOP_OAUTH_REDIRECT_URI` 填同一串**。  
4. `APP_PUBLIC_URL` 仍可用 `http://127.0.0.1:5173`（授权完成后跳回本地前端）；若 TikTok 对 return 也有限制，再可把前端同样穿透成 HTTPS。

---

## D. 线上部署检查清单

- [ ] Partner 里回调与 `TIKTOK_SHOP_OAUTH_REDIRECT_URI` **完全一致**（含 `https`、无多余 `/`）。  
- [ ] 防火墙 / 反代把 `/api/store/tiktok/oauth/callback` **转到 Node 服务**（不要只做静态站）。  
- [ ] `APP_PUBLIC_URL` 为用户实际打开的网站根地址。  
- [ ] `TIKTOK_OAUTH_STATE_SECRET` 生产已设置且多实例一致。  
- [ ] 浏览器实测：`/api/health` 能访问后再测 OAuth。

---

## E. 用户侧操作顺序（验收入门）

1. 打开凡梦前台，**注册/登录**。  
2. 打开 **配置店铺 API** → **TikTok Shop** → **使用 TikTok Shop OAuth 连接**。  
3. 在 TikTok 页登录卖家账号并同意授权。  
4. 应跳转回 `APP_PUBLIC_URL`，并提示已连接；再点 **测试本台快照** 验证。

---

## F. 常见报错与处理

| 现象 | 可能原因 | 处理 |
|------|----------|------|
| Partner 保存不了回调 | 非 HTTPS、域名未备案策略、格式错误 | 换合法 HTTPS 公网地址 |
| 换票失败 / redirect 不匹配 | 回调与授权时不一致 | 两边改成**同一** URL |
| 授权页 404 或参数错误 | `authv2` 与区域不符 | 试 `TIKTOK_SHOP_OAUTH_FLOW=open` 或美区 HOST |
| 连接成功但快照失败 | 缺权限、shop_cipher、或 app 未开通订单接口 | 检查应用 scopes 与卖家授权范围 |
| 回本地后未提示成功 | `APP_PUBLIC_URL` 错或未带 query 处理 | 检查 `.env` 与浏览器地址栏 |

---

## G. 代替「我帮你弄」的界限

- **能代劳的**：帮你改代码、看日志、写文档（已完成 OAuth 路由与换票逻辑）。  
- **不能代劳的**：登录你的 Partner、创建应用、通过 TikTok 审核、替你点卖家授权。

若你把 **具体报错原文**（页面提示或 `tiktok_msg`）或 ** Partner 截图里「应用类型 + 回调配置页」**（打码密钥）发出来，可以在现有代码和配置范围内继续帮你对齐。

---

## 相关代码（便于开发自查）

- 授权链接：`POST /api/store/tiktok/oauth/url` → `server/index.js`  
- 回调与存库：`GET /api/store/tiktok/oauth/callback` → `server/index.js`  
- 换票与店铺列表：`server/integrations/storeApi/tiktok/tiktokShopOAuth.js`
