import { getUserState } from '@/store/user'
import { fenToYuan } from '@/utils/format'

const PERIOD = {
  periodId: '2026-05-p1',
  periodName: '2026年5月·第1期',
  periodStatus: 'active',
  periodStartDate: '2026-05-01',
  periodEndDate: '2026-05-30',
  periodDaysTotal: 30,
  periodDaysLeft: 18,
}

export function buildPoolSummary(joinedCount = 826) {
  const entryFee = 990
  const poolAmount = Math.round(joinedCount * entryFee * 0.9) + 50000
  const estimatedWinners = 300
  const estimatedPerUser = Math.round(poolAmount / estimatedWinners)

  return {
    joinedCount,
    poolAmount,
    poolAmountYuan: fenToYuan(poolAmount, 1),
    poolRate: 0.9,
    entryFee,
    entryFeeYuan: '9.9',
    bonusAmount: 50000,
    estimatedWinners,
    estimatedPerUser,
    estimatedPerUserYuan: fenToYuan(estimatedPerUser, 1),
    isEstimate: true,
  }
}

export function buildCheckinProgress(user) {
  const validCheckinDays = user.validCheckinDays || 0
  const checkinTarget = 25
  return {
    validCheckinDays,
    checkinTarget,
    daysNeeded: Math.max(0, checkinTarget - validCheckinDays),
    isQualified: validCheckinDays >= checkinTarget,
    todayCheckedIn: user.todayCheckedIn || false,
    makeupCardsLeft: 1,
    makeupCardsUsed: 0,
    currentStreak: validCheckinDays,
    longestStreak: validCheckinDays,
  }
}

export function buildTodayTasks(user) {
  const isScience = user.trackType === 'science'
  const secondaryLabel = isScience ? '高等数学' : '大学语文'
  const secondarySubject = isScience ? 'math' : 'chinese'
  const secondaryTopic = isScience ? '导数应用' : '文言文阅读'
  const progress = user.taskProgress || 0
  const questionCountToday = user.questionCountToday || 0

  return {
    planDate: new Date().toISOString().slice(0, 10),
    butlerMessage: `今天英语复习定语从句，${secondaryLabel}练${secondaryTopic}，大约50分钟，完成即可计入打卡。`,
    estimatedMinutes: 50,
    taskProgress: progress,
    questionCountToday,
    questionCountRequired: 5,
    canCheckInToday: progress >= 80 && questionCountToday >= 5,
    checkInMissing: {
      taskProgressOk: progress >= 80,
      taskProgressCurrent: progress,
      taskProgressRequired: 80,
      questionsOk: questionCountToday >= 5,
      questionsCurrent: questionCountToday,
      questionsRequired: 5,
    },
    tasks: [
      {
        taskId: 't1',
        subject: 'english',
        subjectLabel: '英语',
        type: 'review',
        typeLabel: '复习',
        title: '定语从句复习',
        topicId: 'eng-clause',
        topicName: '定语从句',
        estimatedMinutes: 20,
        questionTarget: 5,
        questionDone: Math.min(5, Math.round((progress / 100) * 5)),
        progress: Math.min(100, progress),
        status: progress >= 40 ? 'done' : progress > 0 ? 'in_progress' : 'pending',
        isRequiredForCheckin: true,
      },
      {
        taskId: 't2',
        subject: 'english',
        subjectLabel: '英语',
        type: 'learn',
        typeLabel: '新学',
        title: '非谓语动词入门',
        topicId: 'eng-nonfinite',
        topicName: '非谓语动词',
        estimatedMinutes: 15,
        questionTarget: 5,
        questionDone: 0,
        progress: 0,
        status: 'pending',
        isRequiredForCheckin: true,
      },
      {
        taskId: 't3',
        subject: secondarySubject,
        subjectLabel: secondaryLabel,
        type: 'practice',
        typeLabel: '练习',
        title: `${secondaryTopic}专项`,
        topicId: 'sec-practice',
        topicName: secondaryTopic,
        estimatedMinutes: 15,
        questionTarget: 8,
        questionDone: Math.min(8, questionCountToday),
        progress: Math.min(100, Math.round((questionCountToday / 8) * 100)),
        status: questionCountToday >= 5 ? 'done' : questionCountToday > 0 ? 'in_progress' : 'pending',
        isRequiredForCheckin: true,
      },
    ],
  }
}

export function buildHomeResponse() {
  const user = getUserState()
  const poolSummary = buildPoolSummary()
  const checkinProgress = buildCheckinProgress(user)
  const todayPlan = buildTodayTasks(user)

  let primaryAction = 'start_task'
  let primaryActionLabel = '开始今日学习'
  let showEnrollBar = !user.isEnrolled

  if (!user.isProfileComplete) {
    primaryAction = 'onboarding'
    primaryActionLabel = '开始 3 分钟设置'
  } else if (!user.isEnrolled) {
    primaryAction = 'enroll'
    primaryActionLabel = '9.9 元立即入营'
  } else if (checkinProgress.todayCheckedIn) {
    primaryAction = 'view_tomorrow'
    primaryActionLabel = '查看明日计划'
  } else if (todayPlan.canCheckInToday) {
    primaryAction = 'checkin'
    primaryActionLabel = '完成今日打卡'
  } else if (todayPlan.taskProgress > 0) {
    primaryAction = 'continue_task'
    primaryActionLabel = '继续完成今日任务'
  }

  return {
    user: {
      isProfileComplete: user.isProfileComplete,
      trackType: user.trackType,
      trackLabel: user.trackLabel,
      subjectSecondary: user.subjectSecondary,
      subjectSecondaryLabel: user.subjectSecondaryLabel,
      examYear: user.examYear,
      isEnrolled: user.isEnrolled,
      nickname: user.nickname,
    },
    period: PERIOD,
    poolSummary,
    checkinProgress,
    todayPlan,
    examCountdown: {
      daysToExam: 120,
      studyPhase: 'intensive',
      studyPhaseLabel: '强化期',
    },
    ui: {
      primaryAction,
      primaryActionLabel,
      showEnrollBar,
    },
  }
}

export function buildEnrollPageData() {
  const user = getUserState()
  return {
    periodName: PERIOD.periodName,
    entryFee: 990,
    entryFeeYuan: '9.9',
    poolRate: 0.9,
    poolRatePercent: '90%',
    poolSummary: buildPoolSummary(),
    trackType: user.trackType,
    trackLabel: user.trackLabel,
    checkinTarget: 25,
    periodDaysTotal: 30,
    canEnroll: !user.isEnrolled,
    alreadyEnrolled: user.isEnrolled,
    dailyRules: {
      taskProgressRequired: 80,
      questionsRequired: 5,
      deadlineTime: '23:59',
      makeupMax: 2,
      makeupLookbackDays: 7,
    },
    agreementVersion: 'V1.0',
  }
}

export function buildCheckinCompleteData(resultType = 'normal') {
  const user = getUserState()
  const checkinProgress = buildCheckinProgress(user)
  const poolSummary = buildPoolSummary()
  const isScience = user.trackType === 'science'

  let title = '今日打卡成功'
  let subtitle = `有效打卡 ${checkinProgress.validCheckinDays}/${checkinProgress.checkinTarget} 天`

  if (resultType === 'first_checkin' || checkinProgress.validCheckinDays === 1) {
    title = '今日打卡成功！'
    subtitle = '你已迈出第一步，1/25 已达成'
  } else if (checkinProgress.validCheckinDays === 25) {
    title = '恭喜！你已达成瓜分资格'
    subtitle = '有效打卡 25/25 · 本期可参与奖金分配'
  } else if (checkinProgress.isQualified) {
    title = '今日打卡完成'
    subtitle = '你已锁定本期瓜分资格'
  } else {
    subtitle = `再坚持 ${checkinProgress.daysNeeded} 天，即可参与本期瓜分`
  }

  return {
    resultType: checkinProgress.validCheckinDays === 1 ? 'first_checkin' : checkinProgress.validCheckinDays === 25 ? 'qualified' : checkinProgress.isQualified ? 'post_qualified' : 'normal',
    title,
    subtitle,
    checkinProgress,
    poolSummary,
    todaySummary: {
      minutes: 52,
      questionCount: user.questionCountToday || 12,
      accuracy: 75,
      completedTasks: 3,
      englishSummary: '定语从句复习，正确率 80%',
      secondarySummary: isScience ? '导数应用 8 题，正确率 70%' : '文言文阅读 8 题，正确率 70%',
    },
    tomorrowPlan: {
      planDate: '2026-05-25',
      estimatedMinutes: 45,
      englishTopic: '非谓语动词',
      secondaryTopic: isScience ? '积分基础' : '作文素材积累',
      isEditable: true,
    },
    butlerClosingMessage: '今天辛苦了。明天继续加油，记得 23:59 前完成打卡。',
    shareConfig: {
      shareType: 'daily_checkin',
      shareTitle: '浙江专升本打卡挑战',
      sharePath: '/pages/home/index',
      momentsText: `Day ${checkinProgress.validCheckinDays}/25 ✅ 浙江专升本打卡完成，本期奖池约 ¥${poolSummary.poolAmountYuan}。`,
    },
  }
}

export function buildLotteryResultData() {
  const user = getUserState()
  const isQualified = user.validCheckinDays >= 25
  const winnersCount = 312
  const totalPool = 734340
  const perUserAmount = Math.round(totalPool / winnersCount)

  return {
    periodId: PERIOD.periodId,
    periodName: PERIOD.periodName,
    periodStartDate: PERIOD.periodStartDate,
    periodEndDate: PERIOD.periodEndDate,
    settledAt: '2026-05-31T10:00:00+08:00',
    payoutStatus: 'completed',
    joinedCount: 826,
    entryFee: 990,
    poolRate: 0.9,
    basePool: 734340,
    bonusPool: 50000,
    totalPool,
    totalPoolYuan: fenToYuan(totalPool, 1),
    winnersCount,
    failedCount: 514,
    perUserAmount,
    perUserAmountYuan: fenToYuan(perUserAmount, 1),
    myResult: {
      isEnrolled: user.isEnrolled,
      isQualified,
      validCheckinDays: user.validCheckinDays,
      checkinTarget: 25,
      rewardAmount: isQualified ? perUserAmount : 0,
      rewardAmountYuan: isQualified ? fenToYuan(perUserAmount, 1) : '0',
      payoutStatus: isQualified ? 'paid' : 'none',
      paidAt: isQualified ? '2026-05-31T14:30:00+08:00' : null,
      learningStats: {
        totalHours: 38,
        totalQuestions: 486,
        englishGain: 18,
        secondaryGain: 15,
      },
    },
    winnersList: [
      { rank: 1, nicknameMasked: '微信用户*a3K', validCheckinDays: 27, rewardAmountYuan: fenToYuan(perUserAmount, 1) },
      { rank: 2, nicknameMasked: '张*明', validCheckinDays: 25, rewardAmountYuan: fenToYuan(perUserAmount, 1) },
      { rank: 3, nicknameMasked: '李**', validCheckinDays: 26, rewardAmountYuan: fenToYuan(perUserAmount, 1) },
    ],
    nextPeriod: {
      periodId: '2026-06-p1',
      periodName: '2026年6月·第2期',
      startDate: '2026-06-01',
      entryFeeYuan: '9.9',
      canReserve: true,
    },
    renewOffer: {
      available: true,
      originalPrice: 990,
      renewPrice: 790,
      renewPriceYuan: '7.9',
    },
  }
}
