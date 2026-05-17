# 凡梦AI Agent知识库

> 所有Agent的知识库文件，用于跨境电商多Agent协作系统。

## 文件结构

```
knowledge/
├── README.md              # 本文件
├── AGENT_PROMPT.md        # 完整知识库（含所有Agent）
├── 00_MULTI_AGENT.md     # 多Agent总控
├── 01_SELECTOR.md         # 爆款选品监控
├── 02_CONTENT.md          # 爆款内容生成
├── 03_LISTING.md          # Listing转化优化
├── 04_STORE.md            # 店铺业绩诊断
├── 05_SERVICE.md          # AI客服售后
└── 06_ADS.md              # 广告库存利润
```

## Agent ID 对照

| Agent ID | 名称 | 知识库文件 |
|----------|------|----------|
| selector | 爆款选品监控 | 01_SELECTOR.md |
| content | 爆款内容生成 | 02_CONTENT.md |
| listing | Listing转化优化 | 03_LISTING.md |
| store | 店铺业绩诊断 | 04_STORE.md |
| service | AI客服售后 | 05_SERVICE.md |
| ads | 广告库存利润 | 06_ADS.md |

## 使用方式

在 `agentSkills.js` 中引用知识库内容：

```javascript
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const knowledgeBase = {
  selector: readFileSync(path.join(__dirname, 'knowledge', '01_SELECTOR.md'), 'utf-8'),
  content: readFileSync(path.join(__dirname, 'knowledge', '02_CONTENT.md'), 'utf-8'),
  // ...
};
```

## 更新日志

- 2026-05-11 **v2** 各 Agent 知识库专业版：补充框架表、诊断/连接双模式、合规与数据边界、行动清单与自省项（`01`–`06` 全文对齐该规格）。
- 2026-05-08 v1.0 初始版本
