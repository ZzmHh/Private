# 浙江专升本 · 坚持奖学池 小程序

uni-app (Vue 3 + Vite) MVP，当前使用 **本地 Mock 数据**，后续接数据库/API 只需改 `src/services/api.js`。

## 功能（P0）

- 首页：今日任务、奖学池、打卡进度
- 入营页：9.9 元入营（MVP 模拟支付）
- 打卡完成页
- 开奖公示页
- 注册引导：理工/文史二选一
- 我的：演示数据重置

## 演示流程

1. 打开小程序 → 完成 onboarding（选理工/文史）
2. 首页 → **9.9 元立即入营**（模拟支付）
3. 首页 → **模拟完成学习** → **完成今日打卡**
4. 我的 → **开奖公示（演示）**

## 开发

```bash
cd zhejiang-zsb-miniapp
npm install
node scripts/create-tab-icons.mjs   # 生成 tab 占位图标
npm run dev:mp-weixin               # 编译到微信小程序
```

用 **微信开发者工具** 打开目录：`zhejiang-zsb-miniapp/dist/dev/mp-weixin`

### H5 预览（可选）

```bash
npm run dev:h5
```

## 接真实后端

1. `src/services/api.js` 设 `USE_MOCK = false`
2. 配置 `API_BASE` 为你的后端地址
3. 后端响应字段对齐 `docs/zhejiang-zsb-miniapp/PAGE_FIELDS.md`

Mock 数据结构已与该文档一致，**换接口通常不用改页面**。

## 微信小程序 AppID

在 `src/manifest.json` → `mp-weixin.appid` 填入你的 AppID。

## 目录

```
src/
  pages/          # 页面
  components/     # 公共组件
  mock/           # Mock 数据（与 API 字段对齐）
  services/api.js # API 层（Mock / 真实切换）
  store/user.js   # 本地用户状态
docs/             # 产品字段文档（仓库根目录）
```
