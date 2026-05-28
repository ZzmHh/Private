# 获客雷达 · 社媒 AI 拓客

**独立 Chrome 插件**，与凡梦AI 无关。在 TikTok / 小红书 / X 等平台浏览时，自动识别潜在客户并 AI 生成触达话术。

## 安装（本地开发）

1. Chrome 打开 `chrome://extensions`
2. 开启「开发者模式」
3. 「加载已解压的扩展程序」→ 选择本目录 `lead-radar-extension`

## 配置

1. 点击插件图标 → **选择大模型服务商**（支持 OpenAI、Claude、Gemini、DeepSeek、通义、智谱、Kimi、豆包、OpenRouter、硅基流动等）
2. 选模型 → 填 **API Key** → **测试连接**
3. 填写「你的产品/服务」→ 保存

### 推荐

| 场景 | 推荐 |
|------|------|
| 想用国外+国内很多模型 | **OpenRouter**（一个 Key 换模型） |
| 国内便宜推理 | **硅基流动** / **DeepSeek** |
| 原生 Claude | 选 **Anthropic** |
| 原生 Gemini | 选 **Google Gemini** |
| 自建/其他 | **自定义 OpenAI 兼容** |

## 使用

1. 打开 TikTok / 小红书 / X，搜索垂直内容（如「TikTok Shop 不出单」「跨境选品」）
2. 右下角 **🎯** 面板自动扫描
3. 高分客户进入队列 → **填入评论** / **复制话术** → 人工确认后发送

## 能力边界

| 已自动化 | 需人工 |
|---------|--------|
| 识别帖子/评论中的意向信号 | 最终点击发送 |
| AI 打分 + 画像 + 话术 | 平台登录/验证码 |
| 高亮原帖、复制/填入评论框 | 批量私信（不支持，防封号）|

## 目录结构

```
lead-radar-extension/
├── manifest.json
├── popup/           # 设置弹窗
└── src/
    ├── background.js # AI 调用
    ├── content/      # 页面扫描 + 面板
    └── lib/          # 信号规则、DOM 提取
```

## 自定义

- 意向关键词：`src/lib/signals.js`
- 平台 DOM 规则：`src/lib/dom.js`
- 话术 Prompt：`src/background.js` 内 `buildAnalyzePrompt`
