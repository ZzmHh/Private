# 凡梦 AI 后端运维

## 环境变量

| 变量 | 默认 | 说明 |
|------|------|------|
| `DB_BACKEND` | `json` | `json` 或 `sqlite` |
| `DB_BACKUP_INTERVAL_MS` | `3600000` | JSON 库每小时备份间隔 |
| `API_IP_RATE_MAX` | `200` | 每 IP 每分钟 `/api` 请求上限 |
| `EXTENSION_RATE_MAX` | `30` | 插件 API 每分钟上限 |
| `AGENT_RUN_RATE_MAX` | `20` | Agent 调用每分钟上限 |

## 健康检查

```bash
curl http://127.0.0.1:8787/api/health
```

返回 `uptimeSec`、`db.backend`、`db.lastJsonBackup` 等。

## JSON 备份

- 路径：`data/backups/app-db-*.json`
- 启动时立即备份一次，之后按间隔定时备份
- 主库 JSON 解析失败时自动尝试最新备份恢复
- 写入使用 `.tmp` + 原子 `rename`，避免写一半损坏

## 迁移到 SQLite

```bash
npm run migrate:db
# .env 增加
DB_BACKEND=sqlite
```

首次 SQLite 启动也会自动从 `app-db.json` 导入（若尚未导入）。

**注意**：JSON 后端不要开 PM2 多实例；SQLite 阶段同样建议 `instances: 1`。

## PM2 生产部署

```bash
npm install -g pm2
npm run build:all
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup
pm2 logs fanmeng-api
```

## 请求日志格式

```
[2026-05-21T01:30:00.000Z] POST /api/agents/run → 200 (3200ms) reqId=a1b2c3d4 user=abc12345
```

静态资源、`/downloads` 等不会打日志。

## 错误响应

```json
{
  "error": "错误说明",
  "code": "VALIDATION_ERROR",
  "requestId": "a1b2c3d4"
}
```

## 恢复 JSON 备份

```bash
cp data/backups/app-db-YYYY-MM-DD-HH-mm-ss.json data/app-db.json
# 重启服务
```
