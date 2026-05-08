# 凡梦AI

为跨境电商卖家设计的多 Agent 智能体网站原型，白色高级视觉风格，包含首页、6 个业务 Agent、Agent 工作台、订阅定价和登录入口。

上线部署请看 [DEPLOY.md](DEPLOY.md)。

## 6 个 Agent

- 爆款选品监控 Agent：抓取和分析爆款商品趋势、竞争强度、价格带和机会评分。
- 爆款内容生成 Agent：生成短视频脚本、分镜、口播、封面文案和达人 Brief。
- Listing 转化优化 Agent：生成高质量标题、五点描述、A+ 页面结构、FAQ 和多语言文案。
- 店铺业绩诊断 Agent：分析 GMV、转化率、广告 ROI、退款、库存并给出优化建议。
- AI 客服售后 Agent：处理多语言售前咨询、物流、退换货、差评安抚和知识库。
- 广告库存利润 Agent：联动广告、库存和成本，输出补货、停投、清仓和利润预警。

## 订阅价格

- 尝鲜版：99 元/月
- 标准版：299 元/月
- 全托版：899 元/月
- 企业版：定制报价，需要联系定价

## 商用基础能力

当前已经包含可用于原型验证的商用基础设施：

- 后端注册/登录接口：`/api/auth/register`、`/api/auth/login`
- Token 鉴权：Agent、全自动运行、爬虫接口都需要登录后调用
- 3 天免费试用：注册后自动生成试用开始和结束时间
- 调用额度：按套餐记录每日调用次数
- 任务历史：每个账号保留最近生成的任务结果
- 本地数据文件：`data/app-db.json`

正式上线前建议替换为生产数据库，例如 PostgreSQL/MySQL，并接入真实支付和平台 OAuth 授权。

## 本地运行

```bash
npm install
npm run dev
```

## 接入 OpenClaw / 大模型

不要把大模型 Key 写在前端代码里。请复制 `.env.example` 为 `.env`，然后填写你的 OpenClaw 配置：

```bash
OPENCLAW_PROVIDER_NAME=OpenClaw
OPENCLAW_BASE_URL=你的_OpenClaw_v1_接口地址
OPENCLAW_MODEL=openclaw
OPENCLAW_API_KEY=你的密钥
```

当前 OpenClaw 兼容接口要求模型名使用 `openclaw` 或 `openclaw/`，具体底层模型在 OpenClaw 内部选择。

如果 OpenClaw 提供的是 OpenAI 兼容接口，后端会调用：

```text
POST {OPENCLAW_BASE_URL}/chat/completions
```

后端也会自动兼容尝试：

```text
POST {OPENCLAW_BASE_URL}/v1/chat/completions
```

如果返回 `404 Not Found`，通常说明 OpenClaw 本地服务还没有启用 OpenAI 兼容的 `chatCompletions` Gateway Endpoint，或者 `OPENCLAW_BASE_URL` 不是 API Gateway 地址。

启动完整 AI 后端：

```bash
npm run build
npm start
```

然后访问：

```text
http://127.0.0.1:8787/
```

开发时也可以开两个终端：

```bash
npm run dev
npm run dev:server
```

生产构建：

```bash
npm run build
```

## Python / Playwright 实时抓取

全自动运行模块可以先调用 Python 爬虫抓取公开页面数据，再交给 OpenClaw 分析。

安装 Python 依赖：

```bash
pip install -r requirements.txt
python -m playwright install chromium
```

单独测试爬虫：

```bash
python server/scraper.py --platform "TikTok Shop" --market "美国" --category "宠物用品" --url "https://www.tiktokshuju.com/goods/hot-sale"
```

后端 API：

```text
POST /api/scrape/run
POST /api/autopilot/run
```

注意：公开网页可能需要登录、验证码或有反爬策略。当前爬虫是可扩展骨架，真实商用时建议优先接官方 API 或合规数据源；若必须抓取网页，需要为每个平台单独维护登录态、选择器、限速和异常处理。
