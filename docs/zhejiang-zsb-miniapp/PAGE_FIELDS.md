# 浙江专升本小程序 · 页面字段清单

> 版本：V1.0 · 定价 9.9 元/期 · 25/30 天打卡 · 90% 入池  
> 用途：前端页面绑定 + 后端 API 字段对齐

---

## 一、用户状态枚举（全局）

前端路由、文案、按钮显隐均依赖以下状态组合。

### 1.1 用户基础


| 字段                  | 类型      | 说明              |
| ------------------- | ------- | --------------- |
| `userId`            | string  | 用户唯一 ID         |
| `openid`            | string  | 微信 OpenID       |
| `nickname`          | string  | 微信昵称（展示用，可脱敏）   |
| `avatarUrl`         | string  | 头像 URL          |
| `isProfileComplete` | boolean | 是否完成 onboarding |
| `createdAt`         | ISO8601 | 注册时间            |


### 1.2 考试类别（注册时选定，当期内不可改）


| 字段                      | 类型     | 枚举                 | 说明               |
| ----------------------- | ------ | ------------------ | ---------------- |
| `trackType`             | string | `science` | `arts` | 理工类 / 文史类        |
| `trackLabel`            | string | —                  | 展示：「理工类」/「文史类」   |
| `subjectSecondary`      | string | `math` | `chinese` | 第二专业课标识          |
| `subjectSecondaryLabel` | string | —                  | 展示：「高等数学」/「大学语文」 |
| `examYear`              | number | —                  | 目标考试年份，如 2026    |
| `province`              | string | 固定 `zhejiang`      | 省份               |


### 1.3 奖学池 / 入营状态


| 字段                 | 类型             | 说明              |
| ------------------ | -------------- | --------------- |
| `isEnrolled`       | boolean        | 当期是否已入营         |
| `enrollmentId`     | string | null  | 入营订单 ID         |
| `enrollmentPaidAt` | ISO8601 | null | 支付时间            |
| `enrollmentAmount` | number         | 入营费，单位分，默认 990  |
| `canEnroll`        | boolean        | 是否可购买（每期限购 1 次） |


### 1.4 当期活动


| 字段                | 类型     | 说明                                             |
| ----------------- | ------ | ---------------------------------------------- |
| `periodId`        | string | 当期 ID，如 `2026-05-p1`                           |
| `periodName`      | string | 展示：「2026 年 5 月 · 第 1 期」                        |
| `periodStatus`    | string | `upcoming` | `active` | `settling` | `settled` |
| `periodStartDate` | date   | 活动开始日                                          |
| `periodEndDate`   | date   | 活动结束日                                          |
| `periodDaysTotal` | number | 固定 30                                          |
| `periodDaysLeft`  | number | 剩余天数（含当天）                                      |


---

## 二、全局共享数据块

以下数据块被多个页面复用，建议独立 API 或 Redux/store 缓存。

### 2.1 奖学池摘要 `poolSummary`


| 字段                     | 类型      | 说明            | 示例         |
| ---------------------- | ------- | ------------- | ---------- |
| `joinedCount`          | number  | 入营人数          | 826        |
| `poolAmount`           | number  | 奖学池总额，**单位分** | 734340     |
| `poolAmountYuan`       | string  | 展示用元，保留 1 位   | `"7343.4"` |
| `poolRate`             | number  | 入池比例，固定 0.9   | 0.9        |
| `entryFee`             | number  | 入营费，单位分       | 990        |
| `bonusAmount`          | number  | 官方加码，单位分      | 50000      |
| `estimatedWinners`     | number  | 预估达标人数（可选）    | 300        |
| `estimatedPerUser`     | number  | 预估人均，单位分      | 2970       |
| `estimatedPerUserYuan` | string  | 展示            | `"29.7"`   |
| `isEstimate`           | boolean | 是否为估算         | true       |


### 2.2 打卡进度 `checkinProgress`


| 字段                 | 类型      | 说明                                      |
| ------------------ | ------- | --------------------------------------- |
| `validCheckinDays` | number  | 有效打卡天数                                  |
| `checkinTarget`    | number  | 固定 25                                   |
| `daysNeeded`       | number  | 距达标还差几天，`max(0, 25 - validCheckinDays)` |
| `isQualified`      | boolean | 是否已锁定瓜分资格（≥25 天）                        |
| `todayCheckedIn`   | boolean | 今日是否已有效打卡                               |
| `makeupCardsLeft`  | number  | 剩余补签卡，0～2                               |
| `makeupCardsUsed`  | number  | 已用补签次数                                  |
| `currentStreak`    | number  | 当前连续打卡天数                                |
| `longestStreak`    | number  | 最长连续                                    |


### 2.3 今日任务 `todayPlan`


| 字段                      | 类型               | 说明                 |
| ----------------------- | ---------------- | ------------------ |
| `planDate`              | date             | 计划日期               |
| `butlerMessage`         | string           | 管家话术（后端按 track 生成） |
| `estimatedMinutes`      | number           | 预计总时长              |
| `taskProgress`          | number           | 完成度 0～100          |
| `questionCountToday`    | number           | 今日已练题数             |
| `questionCountRequired` | number           | 打卡所需最少题数，固定 5      |
| `tasks`                 | `Task[]`         | 任务列表，见 2.4         |
| `canCheckInToday`       | boolean          | 是否已满足打卡条件          |
| `checkInMissing`        | `CheckInMissing` | 未达标时缺什么，见 2.5      |


### 2.4 任务项 `Task`


| 字段                     | 类型      | 说明                                          |
| ---------------------- | ------- | ------------------------------------------- |
| `taskId`               | string  | 任务 ID                                       |
| `subject`              | string  | `english` | `math` | `chinese`              |
| `subjectLabel`         | string  | 「英语」/「高等数学」/「大学语文」                          |
| `type`                 | string  | `learn` | `review` | `practice` | `mistake` |
| `typeLabel`            | string  | 「新学」/「复习」/「练习」/「错题」                         |
| `title`                | string  | 如「定语从句复习」                                   |
| `topicId`              | string  | 关联考点 ID                                     |
| `topicName`            | string  | 考点名称                                        |
| `estimatedMinutes`     | number  | 预计分钟                                        |
| `questionTarget`       | number  | 目标题数                                        |
| `questionDone`         | number  | 已完成题数                                       |
| `progress`             | number  | 0～100                                       |
| `status`               | string  | `pending` | `in_progress` | `done`          |
| `isRequiredForCheckin` | boolean | 是否计入打卡权重                                    |


### 2.5 打卡缺口 `CheckInMissing`


| 字段                     | 类型      | 说明      |
| ---------------------- | ------- | ------- |
| `taskProgressOk`       | boolean | 任务 ≥80% |
| `taskProgressCurrent`  | number  | 当前任务完成度 |
| `taskProgressRequired` | number  | 固定 80   |
| `questionsOk`          | boolean | 练题 ≥5   |
| `questionsCurrent`     | number  | 当前题数    |
| `questionsRequired`    | number  | 固定 5    |


### 2.6 明日计划 `tomorrowPlan`


| 字段                 | 类型       | 说明        |
| ------------------ | -------- | --------- |
| `planDate`         | date     | 明日日期      |
| `estimatedMinutes` | number   | 预计时长      |
| `englishTopic`     | string   | 明日英语主题    |
| `secondaryTopic`   | string   | 明日数学/语文主题 |
| `tasks`            | `Task[]` | 可编辑的任务预览  |
| `isEditable`       | boolean  | 是否可修改     |
| `userAdjusted`     | boolean  | 用户是否已手动调整 |


### 2.7 考试倒计时


| 字段                | 类型            | 说明                                    |
| ----------------- | ------------- | ------------------------------------- |
| `examDate`        | date | null   | 考试日期（配置）                              |
| `daysToExam`      | number | null | 距考试天数                                 |
| `studyPhase`      | string        | `foundation` | `intensive` | `sprint` |
| `studyPhaseLabel` | string        | 「基础期」/「强化期」/「冲刺期」                     |


---

## 三、分页面字段清单

---

### 3.1 首页（今日驾驶舱）`pages/home`

**API 建议：** `GET /api/v1/home`


| 区块  | 字段                   | 类型      | 必填  | 说明                                                        |
| --- | -------------------- | ------- | --- | --------------------------------------------------------- |
| 顶部  | `poolSummary`        | object  | ✓   | §2.1                                                      |
| 顶部  | `checkinProgress`    | object  | ✓   | §2.2                                                      |
| 顶部  | `periodName`         | string  | ✓   | 当期名称                                                      |
| 顶部  | `periodDaysLeft`     | number  | ✓   | 剩余天数                                                      |
| 顶部  | `daysToExam`         | number  | —   | 距考试                                                       |
| 顶部  | `studyPhaseLabel`    | string  | —   | 阶段标签                                                      |
| 管家  | `butlerMessage`      | string  | ✓   | 今日管家话术                                                    |
| 任务  | `todayPlan`          | object  | ✓   | §2.3                                                      |
| 底部条 | `showEnrollBar`      | boolean | ✓   | 未入营时 true                                                 |
| 底部条 | `enrollBarText`      | string  | —   | 可后端拼或前端模板                                                 |
| 按钮  | `primaryAction`      | string  | ✓   | `enroll` | `start_task` | `continue_task` | `view_result` |
| 按钮  | `primaryActionLabel` | string  | ✓   | 按钮文案                                                      |


**前端显隐逻辑：**

```
!isProfileComplete        → 跳转 onboarding
!isEnrolled               → 显示奖学池条 + 入营按钮 + 免费体验任务
isEnrolled && !todayCheckedIn → 显示打卡进度 + 去做任务
isEnrolled && todayCheckedIn  → 显示已完成 + 查看明日/分享
checkinProgress.isQualified   → 进度条变「已锁定瓜分资格」
periodStatus === 'settled'    → 跳转开奖公示
```

---

### 3.2 入营页 `pages/enroll`

**API 建议：**  

- `GET /api/v1/pool/current` — 奖学池与规则摘要  
- `POST /api/v1/pool/enroll` — 创建支付订单  
- 支付回调后 `GET /api/v1/pool/enrollment/status`


| 区块  | 字段                 | 类型      | 必填  | 说明         |
| --- | ------------------ | ------- | --- | ---------- |
| 头部  | `periodName`       | string  | ✓   |            |
| 头部  | `entryFee`         | number  | ✓   | 分，990      |
| 头部  | `entryFeeYuan`     | string  | ✓   | 「9.9」      |
| 头部  | `poolRate`         | number  | ✓   | 0.9        |
| 头部  | `poolRatePercent`  | string  | ✓   | 「90%」      |
| 奖池  | `poolSummary`      | object  | ✓   | §2.1       |
| 奖池  | `poolExampleText`  | string  | —   | 示例说明，可静态   |
| 达标  | `checkinTarget`    | number  | ✓   | 25         |
| 达标  | `periodDaysTotal`  | number  | ✓   | 30         |
| 达标  | `dailyRules`       | object  | ✓   | 见下         |
| 类别  | `trackType`        | string  | ✓   | 展示已选类别     |
| 类别  | `trackLabel`       | string  | ✓   |            |
| 支付  | `agreementUrl`     | string  | ✓   | 活动规则页路径    |
| 支付  | `agreementVersion` | string  | ✓   | 如 V1.0     |
| 支付  | `orderId`          | string  | —   | 下单后返回      |
| 支付  | `payParams`        | object  | —   | 微信支付参数     |
| 状态  | `canEnroll`        | boolean | ✓   |            |
| 状态  | `alreadyEnrolled`  | boolean | ✓   | true 则跳成功页 |


**dailyRules 对象：**


| 字段                     | 类型     | 说明      |
| ---------------------- | ------ | ------- |
| `taskProgressRequired` | number | 80      |
| `questionsRequired`    | number | 5       |
| `deadlineTime`         | string | 「23:59」 |
| `makeupMax`            | number | 2       |
| `makeupLookbackDays`   | number | 7       |


---

### 3.3 入营成功页 `pages/enroll-success`

**触发：** 支付成功回调或轮询后


| 字段                                 | 类型     | 说明      |
| ---------------------------------- | ------ | ------- |
| `periodName`                       | string |         |
| `poolSummary.poolAmountYuan`       | string |         |
| `checkinProgress.validCheckinDays` | number | 通常为 0   |
| `checkinProgress.checkinTarget`    | number | 25      |
| `shareConfig`                      | object | §7 分享配置 |


---

### 3.4 打卡完成页 `pages/checkin-complete`

**API 建议：** `GET /api/v1/checkin/today-result`  
**触发：** 系统判定 `canCheckInToday === true` 后跳转


| 字段                     | 类型            | 说明      |
| ---------------------- | ------------- | ------- |
| `resultType`           | string        | 见下表     |
| `checkinProgress`      | object        | §2.2    |
| `poolSummary`          | object        | §2.1    |
| `todaySummary`         | object        | 今日学习摘要  |
| `tomorrowPlan`         | object        | §2.6    |
| `butlerClosingMessage` | string        | 收尾话术    |
| `passportUnlock`       | object | null | 通行证解锁提示 |
| `shareConfig`          | object        | 分享配置    |


**resultType 枚举：**


| 值                | 场景               |
| ---------------- | ---------------- |
| `first_checkin`  | 当期首次打卡           |
| `normal`         | 常规 2～24 天        |
| `qualified`      | 第 25 天刚达标        |
| `post_qualified` | 已达标后的 26～30 天    |
| `incomplete`     | 任务未完（不应进完成页，仅兜底） |


**todaySummary 对象：**


| 字段                 | 类型     | 说明                     |
| ------------------ | ------ | ---------------------- |
| `minutes`          | number | 今日学习分钟                 |
| `questionCount`    | number | 练题数                    |
| `accuracy`         | number | 正确率 0～100              |
| `completedTasks`   | number | 完成任务数                  |
| `englishSummary`   | string | 如「定语从句复习，正确率 80%」      |
| `secondarySummary` | string | 数学/语文摘要                |
| `weakTopic`        | string | 薄弱考点（post_qualified 用） |


**passportUnlock 对象：**


| 字段              | 类型      | 说明                                                                   |
| --------------- | ------- | -------------------------------------------------------------------- |
| `unlocked`      | boolean | 是否触发解锁                                                               |
| `milestoneDays` | number  | 3/7/14/21/30                                                         |
| `rewardType`    | string  | `makeup_card` | `ai_unlimited` | `mock_exam` | `senior_qa` | `badge` |
| `rewardLabel`   | string  | 展示文案                                                                 |
| `claimStatus`   | string  | `auto` | `manual_claim`                                              |


---

### 3.5 计划页 / 明日预览 `pages/plan`

**API 建议：**  

- `GET /api/v1/plan/today`  
- `GET /api/v1/plan/tomorrow`  
- `PUT /api/v1/plan/tomorrow` — 用户调整明日计划


| 字段                    | 类型          | 说明                            |
| --------------------- | ----------- | ----------------------------- |
| `activeTab`           | string      | `today` | `tomorrow` | `week` |
| `todayPlan`           | object      | §2.3                          |
| `tomorrowPlan`        | object      | §2.6                          |
| `weekPlan`            | `DayPlan[]` | 本周 7 天概览                      |
| `butlerAdjustMessage` | string      | 用户改计划后管家确认语                   |
| `quickModes`          | array       | 快捷模式                          |


**DayPlan（周视图单项）：**


| 字段                 | 类型      | 说明                                    |
| ------------------ | ------- | ------------------------------------- |
| `date`             | date    |                                       |
| `dayLabel`         | string  | 「周一」                                  |
| `estimatedMinutes` | number  |                                       |
| `englishTopic`     | string  |                                       |
| `secondaryTopic`   | string  |                                       |
| `isToday`          | boolean |                                       |
| `checkinStatus`    | string  | `none` | `done` | `missed` | `future` |


**quickModes 快捷模式：**


| 字段                 | 类型     | 说明                                  |
| ------------------ | ------ | ----------------------------------- |
| `modeId`           | string | `light` | `normal` | `english_only` |
| `label`            | string | 「保打卡 20 分钟」                         |
| `estimatedMinutes` | number |                                     |


**PUT tomorrow 请求体：**


| 字段            | 类型       | 说明                                                       |
| ------------- | -------- | -------------------------------------------------------- |
| `adjustType`  | string   | `reduce` | `defer_secondary` | `english_only` | `custom` |
| `taskIds`     | string[] | 自定义时                                                     |
| `deferToDate` | date     | 顺延日期                                                     |


---

### 3.6 开奖公示页 `pages/lottery-result`

**API 建议：** `GET /api/v1/pool/{periodId}/result`


| 字段                  | 类型             | 说明                                            |
| ------------------- | -------------- | --------------------------------------------- |
| `periodId`          | string         |                                               |
| `periodName`        | string         |                                               |
| `periodStartDate`   | date           |                                               |
| `periodEndDate`     | date           |                                               |
| `settledAt`         | ISO8601        | 结算时间                                          |
| `payoutStatus`      | string         | `processing` | `completed` | `partial_failed` |
| `joinedCount`       | number         | 入营人数                                          |
| `entryFee`          | number         | 990                                           |
| `poolRate`          | number         | 0.9                                           |
| `basePool`          | number         | 基础池，分                                         |
| `bonusPool`         | number         | 官方加码，分                                        |
| `totalPool`         | number         | 可分配总额，分                                       |
| `winnersCount`      | number         | 达标人数                                          |
| `failedCount`       | number         | 未达标人数                                         |
| `perUserAmount`     | number         | 人均奖金，分                                        |
| `perUserAmountYuan` | string         |                                               |
| `myResult`          | object         | 当前用户结果                                        |
| `winnersList`       | `WinnerItem[]` | 脱敏名单                                          |
| `winnersListTotal`  | number         | 名单总数                                          |
| `winnersListShown`  | number         | 当前展示条数                                        |
| `nextPeriod`        | object         | 下一期预告                                         |
| `renewOffer`        | object | null  | 续营优惠                                          |


**myResult 对象：**


| 字段                 | 类型             | 说明                            |
| ------------------ | -------------- | ----------------------------- |
| `isEnrolled`       | boolean        |                               |
| `isQualified`      | boolean        | 是否达标                          |
| `validCheckinDays` | number         |                               |
| `checkinTarget`    | number         | 25                            |
| `rewardAmount`     | number         | 分得金额，分，未达标为 0                 |
| `rewardAmountYuan` | string         |                               |
| `payoutStatus`     | string         | `pending` | `paid` | `failed` |
| `paidAt`           | ISO8601 | null |                               |
| `failReason`       | string | null  | 未达标说明                         |
| `learningStats`    | object         | 未达标时展示学习回顾                    |


**learningStats（未达标回顾）：**


| 字段               | 类型     | 说明        |
| ---------------- | ------ | --------- |
| `totalHours`     | number |           |
| `totalQuestions` | number |           |
| `englishGain`    | number | 掌握度提升 %   |
| `secondaryGain`  | number | 数学/语文提升 % |


**WinnerItem：**


| 字段                 | 类型     | 说明    |
| ------------------ | ------ | ----- |
| `rank`             | number |       |
| `nicknameMasked`   | string | 「张*明」 |
| `validCheckinDays` | number |       |
| `rewardAmountYuan` | string |       |


**nextPeriod：**


| 字段             | 类型      | 说明      |
| -------------- | ------- | ------- |
| `periodId`     | string  |         |
| `periodName`   | string  |         |
| `startDate`    | date    |         |
| `entryFeeYuan` | string  |         |
| `canReserve`   | boolean | 是否可预约提醒 |


**renewOffer：**


| 字段              | 类型      | 说明  |
| --------------- | ------- | --- |
| `available`     | boolean |     |
| `originalPrice` | number  | 990 |
| `renewPrice`    | number  | 790 |
| `couponId`      | string  |     |
| `expiresAt`     | ISO8601 |     |


---

### 3.7 学习页 `pages/study`

**API 建议：**  

- `GET /api/v1/subjects/tree` — 考点树  
- `GET /api/v1/topics/{topicId}` — 考点详情  
- `GET /api/v1/practice/session` — 开始练题  
- `POST /api/v1/practice/submit` — 提交答案


| 字段                | 类型            | 说明                        |
| ----------------- | ------------- | ------------------------- |
| `subjects`        | array         | 仅 2 科：english + secondary |
| `topicTree`       | `TopicNode[]` | 按科目                       |
| `currentTopic`    | object        | 当前考点                      |
| `practiceSession` | object        | 练题会话                      |


**TopicNode：**


| 字段              | 类型            | 说明                        |
| --------------- | ------------- | ------------------------- |
| `topicId`       | string        |                           |
| `name`          | string        |                           |
| `parentId`      | string | null |                           |
| `mastery`       | number        | 0～100                     |
| `examWeight`    | string        | `high` | `medium` | `low` |
| `questionCount` | number        | 题库题数                      |
| `children`      | TopicNode[]   |                           |


---

### 3.8 管家页 `pages/butler`

**API 建议：**  

- `GET /api/v1/butler/weekly-report`  
- `POST /api/v1/butler/chat` — 限定场景对话


| 字段             | 类型     | 说明    |
| -------------- | ------ | ----- |
| `quickActions` | array  | 快捷入口  |
| `weeklyReport` | object | 周报    |
| `chatQuota`    | object | AI 次数 |


**quickActions：**


| 字段         | 类型      | 说明                                                                  |
| ---------- | ------- | ------------------------------------------------------------------- |
| `actionId` | string  | `why_today` | `explain_question` | `weekly_summary` | `adjust_plan` |
| `label`    | string  |                                                                     |
| `enabled`  | boolean |                                                                     |


**weeklyReport：**


| 字段                   | 类型       | 说明      |
| -------------------- | -------- | ------- |
| `weekLabel`          | string   | 「第 3 周」 |
| `studyMinutes`       | number   |         |
| `checkinDays`        | number   |         |
| `englishGain`        | number   |         |
| `secondaryGain`      | number   |         |
| `weakTopics`         | string[] |         |
| `nextWeekSuggestion` | string   |         |


**chatQuota：**


| 字段            | 类型      | 说明      |
| ------------- | ------- | ------- |
| `dailyLimit`  | number  | 免费用户限制  |
| `dailyUsed`   | number  |         |
| `isUnlimited` | boolean | 通行证讲题周卡 |


---

### 3.9 我的页 `pages/profile`

**API 建议：** `GET /api/v1/profile/summary`


| 字段                         | 类型              | 说明    |
| -------------------------- | --------------- | ----- |
| `user`                     | object          | 基础信息  |
| `trackType` / `trackLabel` | string          |       |
| `checkinProgress`          | object          | §2.2  |
| `poolSummary`              | object          | 入营时   |
| `masteryRadar`             | object          | 掌握度   |
| `passport`                 | object          | 备考通行证 |
| `mistakeCount`             | number          | 错题总数  |
| `calendar`                 | `CalendarDay[]` | 打卡日历  |


**masteryRadar：**


| 字段           | 类型     | 说明      |
| ------------ | ------ | ------- |
| `english`    | number | 0～100   |
| `secondary`  | number | 数学或语文   |
| `dimensions` | array  | 分维度雷达可选 |


**passport：**


| 字段           | 类型                    | 说明      |
| ------------ | --------------------- | ------- |
| `milestones` | `PassportMilestone[]` | 5 档     |
| `currentDay` | number                | 当期有效打卡天 |


**PassportMilestone：**


| 字段            | 类型     | 说明                                |
| ------------- | ------ | --------------------------------- |
| `days`        | number | 3/7/14/21/30                      |
| `rewardType`  | string |                                   |
| `rewardLabel` | string |                                   |
| `status`      | string | `locked` | `unlocked` | `claimed` |


**CalendarDay：**


| 字段       | 类型     | 说明                                    |
| -------- | ------ | ------------------------------------- |
| `date`   | date   |                                       |
| `status` | string | `done` | `missed` | `makeup` | `none` |


---

### 3.10 活动规则页 `pages/rules`

静态为主，少量动态：


| 字段                 | 类型     | 说明               |
| ------------------ | ------ | ---------------- |
| `agreementVersion` | string | V1.0             |
| `agreementContent` | string | Markdown/HTML 全文 |
| `entryFeeYuan`     | string | 9.9              |
| `poolRatePercent`  | string | 90%              |
| `checkinTarget`    | number | 25               |
| `periodDaysTotal`  | number | 30               |
| `companyName`      | string | 主体名称             |
| `supportContact`   | string | 客服               |


---

### 3.11 Onboarding 注册引导 `pages/onboarding`

**步骤 1 — 选类别**


| 字段          | 类型          | 说明             |
| ----------- | ----------- | -------------- |
| `province`  | 固定 zhejiang |                |
| `examYear`  | number      | 可选列表           |
| `trackType` | string      | science / arts |


**步骤 2 — 摸底测（可选 MVP 简化）**


| 字段                 | 类型     | 说明  |
| ------------------ | ------ | --- |
| `diagnosisId`      | string |     |
| `questions`        | array  |     |
| `estimatedMinutes` | number | 15  |


**步骤 3 — 生成计划**


| 字段               | 类型     | 说明           |
| ---------------- | ------ | ------------ |
| `dailyMinutes`   | number | 用户选 30/60/90 |
| `masteryInitial` | object | 摸底结果         |


**POST 完成注册：** `POST /api/v1/user/onboarding`

```json
{
  "trackType": "science",
  "examYear": 2026,
  "dailyMinutes": 60,
  "diagnosisId": "xxx"
}
```

---

## 四、分享 / 海报字段 `shareConfig`

各页返回的 `shareConfig` 统一结构，供 `onShareAppMessage` 与海报 canvas 使用。


| 字段               | 类型     | 说明                               |
| ---------------- | ------ | -------------------------------- |
| `shareType`      | string | 见下表                              |
| `shareTitle`     | string | 小程序卡片标题                          |
| `sharePath`      | string | 如 `/pages/home?inviter={userId}` |
| `shareImageUrl`  | string | 卡片图 500×400                      |
| `posterTemplate` | string | 海报模板 ID                          |
| `posterData`     | object | 海报动态数据                           |
| `momentsText`    | string | 朋友圈预填文案                          |


**shareType 枚举：**


| 值                | 场景     |
| ---------------- | ------ |
| `enroll_invite`  | 入营拉新   |
| `daily_checkin`  | 每日打卡   |
| `qualified`      | 25 天达标 |
| `lottery_result` | 开奖晒奖   |
| `buddy_invite`   | 邀请搭子   |


**posterData 按类型：**

### enroll_invite


| 字段                | 说明  |
| ----------------- | --- |
| `poolAmountYuan`  |     |
| `joinedCount`     |     |
| `entryFeeYuan`    | 9.9 |
| `inviterNickname` |     |


### daily_checkin


| 字段                | 说明      |
| ----------------- | ------- |
| `checkinDays`     |         |
| `checkinTarget`   | 25      |
| `minutes`         |         |
| `questionCount`   |         |
| `poolAmountYuan`  |         |
| `periodName`      |         |
| `motivationQuote` | 按进度后端返回 |


### qualified


| 字段                 | 说明  |
| ------------------ | --- |
| `validCheckinDays` | 25  |
| `totalHours`       |     |
| `totalQuestions`   |     |
| `poolAmountYuan`   |     |


### lottery_result


| 字段                  | 说明  |
| ------------------- | --- |
| `myRewardYuan`      |     |
| `winnersCount`      |     |
| `perUserAmountYuan` |     |
| `periodName`        |     |
| `nextStartDate`     |     |


---

## 五、API 端点汇总


| 方法   | 路径                               | 页面/用途          |
| ---- | -------------------------------- | -------------- |
| GET  | `/api/v1/home`                   | 首页聚合           |
| GET  | `/api/v1/pool/current`           | 当期奖学池          |
| POST | `/api/v1/pool/enroll`            | 创建入营订单         |
| GET  | `/api/v1/pool/enrollment/status` | 支付轮询           |
| GET  | `/api/v1/checkin/today-result`   | 打卡完成页          |
| POST | `/api/v1/checkin/makeup`         | 使用补签           |
| GET  | `/api/v1/plan/today`             | 今日计划           |
| GET  | `/api/v1/plan/tomorrow`          | 明日计划           |
| PUT  | `/api/v1/plan/tomorrow`          | 调整明日           |
| GET  | `/api/v1/plan/week`              | 周计划            |
| GET  | `/api/v1/pool/{periodId}/result` | 开奖公示           |
| GET  | `/api/v1/profile/summary`        | 我的             |
| GET  | `/api/v1/butler/weekly-report`   | 管家周报           |
| POST | `/api/v1/butler/chat`            | 管家对话           |
| POST | `/api/v1/user/onboarding`        | 完成注册           |
| GET  | `/api/v1/subjects/tree`          | 考点树            |
| POST | `/api/v1/practice/submit`        | 提交练题（触发打卡进度更新） |


**首页聚合 `GET /home` 推荐 Response 示例：**

```json
{
  "user": {
    "isProfileComplete": true,
    "trackType": "science",
    "trackLabel": "理工类",
    "subjectSecondary": "math",
    "subjectSecondaryLabel": "高等数学",
    "examYear": 2026,
    "isEnrolled": true
  },
  "period": {
    "periodId": "2026-05-p1",
    "periodName": "2026年5月·第1期",
    "periodStatus": "active",
    "periodDaysLeft": 18
  },
  "poolSummary": {
    "joinedCount": 826,
    "poolAmount": 734340,
    "poolAmountYuan": "7343.4",
    "estimatedPerUserYuan": "29.7",
    "isEstimate": true
  },
  "checkinProgress": {
    "validCheckinDays": 18,
    "checkinTarget": 25,
    "daysNeeded": 7,
    "isQualified": false,
    "todayCheckedIn": false,
    "makeupCardsLeft": 1
  },
  "todayPlan": {
    "butlerMessage": "今天英语复习定语从句，数学练导数应用，约50分钟。",
    "taskProgress": 40,
    "questionCountToday": 3,
    "questionCountRequired": 5,
    "canCheckInToday": false,
    "tasks": []
  },
  "examCountdown": {
    "daysToExam": 120,
    "studyPhaseLabel": "强化期"
  },
  "ui": {
    "primaryAction": "continue_task",
    "primaryActionLabel": "继续完成今日任务",
    "showEnrollBar": false
  }
}
```

---

## 六、数据库核心表（后端参考）


| 表名                 | 主要字段                                                               |
| ------------------ | ------------------------------------------------------------------ |
| `users`            | id, openid, track_type, exam_year, daily_minutes                   |
| `periods`          | id, name, start_date, end_date, status, bonus_amount               |
| `enrollments`      | id, user_id, period_id, amount, paid_at, status                    |
| `checkin_records`  | id, user_id, period_id, date, valid, task_progress, question_count |
| `makeup_cards`     | id, user_id, period_id, used_at, target_date                       |
| `daily_plans`      | id, user_id, date, tasks_json, progress                            |
| `pool_settlements` | period_id, total_pool, winners_count, per_user_amount, settled_at  |
| `payouts`          | id, user_id, period_id, amount, status, paid_at                    |
| `passport_claims`  | user_id, period_id, milestone_days, reward_type                    |


---

## 七、前端本地缓存建议


| Key                     | 内容                  | TTL                    |
| ----------------------- | ------------------- | ---------------------- |
| `user_profile`          | trackType, examYear | 长期                     |
| `home_summary`          | 首页聚合                | 5 min 或 pull-down 刷新   |
| `today_plan`            | 今日任务                | 完成/Task 变更后 invalidate |
| `checkin_progress`      | 打卡进度                | 与 home 同步              |
| `agreement_accepted_v1` | 是否勾选规则              | 长期                     |


---

## 八、金额与时间约定


| 项    | 约定                      |
| ---- | ----------------------- |
| 金额存储 | **一律用分（integer）**，展示层转元 |
| 时区   | 北京时间 UTC+8              |
| 打卡截止 | 当日 23:59:59             |
| 入营费  | 990 分                   |
| 入池比例 | 0.9                     |
| 打卡目标 | 25 / 30 天               |
| 任务达标 | progress ≥ 80           |
| 练题达标 | count ≥ 5               |


---

## 九、MVP 页面优先级


| 优先级 | 页面                                       | 说明       |
| --- | ---------------------------------------- | -------- |
| P0  | onboarding, home, enroll, enroll-success | 主流程      |
| P0  | checkin-complete, study/practice         | 学习闭环     |
| P0  | rules                                    | 合规       |
| P1  | plan, profile                            | 计划与我的    |
| P1  | lottery-result                           | 第一期结束前完成 |
| P2  | butler chat, buddy, poster canvas        | 可简化      |


---

*文档维护：产品/后端变更入营费、打卡规则时，同步更新 §一 §八 及 rules 页版本号。*