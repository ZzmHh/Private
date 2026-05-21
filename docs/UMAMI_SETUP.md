# Umami 访问分析（可选）

凡梦官网支持 [Umami](https://umami.is/) 自托管统计，**只看官网/落地页**，看不到 TikTok 卖家中心或插件内部。

## 1. 启动 Umami

```bash
docker compose -f docker-compose.umami.yml up -d
```

浏览器打开 `http://服务器IP:3000`，默认账号 `admin` / `umami`，**登录后立即改密码**。

编辑 `docker-compose.umami.yml` 里的 `POSTGRES_PASSWORD` 与 `APP_SECRET` 后再启动。

## 2. 添加网站

Umami 后台 → Settings → Websites → Add website  
域名填你的凡梦官网，例如 `https://你的域名`

复制 **Website ID**。

## 3. 配置凡梦前端

`.env` 或生产环境变量：

```env
APP_PUBLIC_URL=https://你的域名
VITE_UMAMI_WEBSITE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VITE_UMAMI_SCRIPT_URL=https://你的umami域名/script.js
```

重新构建前端：

```bash
npm run build
```

本地开发时 Vite 也会注入上述变量（需重启 `npm run dev`）。

## 4. 与后端漏斗的关系

| 来源 | 看什么 |
|------|--------|
| **Umami** | 页面 PV、来源、设备、实时在线 |
| **凡梦 `/api/track`** | 注册/订阅/插件安装等业务漏斗（运营后台可见） |

两者互补，建议都开。
