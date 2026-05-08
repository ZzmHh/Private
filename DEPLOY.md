# 凡梦AI VPS 上线部署指南

## 1. 服务器准备

推荐 Ubuntu 22.04/24.04，至少 2C4G。安装：

```bash
sudo apt update
sudo apt install -y git nginx docker.io docker-compose-plugin
sudo systemctl enable --now docker nginx
```

## 2. 上传代码

在服务器上进入你的项目目录，放置本项目代码。

## 3. 配置生产环境变量

```bash
cp .env.production.example .env.production
```

编辑 `.env.production`：

```bash
nano .env.production
```

必须修改：

```text
JWT_SECRET=一个很长的随机字符串
OPENCLAW_API_KEY=你的 OpenClaw API Key
```

如果 OpenClaw 跑在同一台 VPS 主机上，保持：

```text
OPENCLAW_BASE_URL=http://host.docker.internal:18789
OPENCLAW_MODEL=openclaw
```

## 4. 启动 OpenClaw

确保 OpenClaw 在 VPS 上监听：

```text
http://127.0.0.1:18789/v1/chat/completions
```

如果 OpenClaw 只监听 localhost，Docker Compose 已配置 `host.docker.internal` 访问主机。

## 5. 启动凡梦AI

```bash
docker compose up -d --build
docker compose logs -f fanmeng-ai
```

健康检查：

```bash
curl http://127.0.0.1:8787/api/health
```

## 6. 配置 Nginx 域名

复制配置：

```bash
sudo cp deploy/nginx-fanmeng-ai.conf /etc/nginx/sites-available/fanmeng-ai
sudo ln -s /etc/nginx/sites-available/fanmeng-ai /etc/nginx/sites-enabled/fanmeng-ai
```

编辑域名：

```bash
sudo nano /etc/nginx/sites-available/fanmeng-ai
```

把：

```text
server_name your-domain.com;
```

改成你的真实域名。

检查并重载：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 7. 配置 HTTPS

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 8. 数据持久化

当前原型数据保存在：

```text
data/app-db.json
```

Docker Compose 已把 `./data` 挂载到容器里。正式商用建议迁移到 PostgreSQL/MySQL。

## 9. 更新上线

```bash
git pull
docker compose up -d --build
```

## 上线前安全提醒

- 生产环境必须换新的 `OPENCLAW_API_KEY`。
- 生产环境必须设置强随机 `JWT_SECRET`。
- 真实收款前需要接支付回调、订单状态、发票和套餐到期逻辑。
- 店铺 API Token 正式保存前需要加密存储，不能长期明文放在 JSON 文件中。
