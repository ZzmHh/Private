const STORAGE_KEY = 'zsb_user_state'

const defaultState = {
  isProfileComplete: false,
  trackType: 'science',
  trackLabel: '理工类',
  subjectSecondary: 'math',
  subjectSecondaryLabel: '高等数学',
  examYear: 2026,
  province: 'zhejiang',
  isEnrolled: false,
  enrollmentId: null,
  nickname: '备考同学',
  dailyMinutes: 60,
  validCheckinDays: 0,
  todayCheckedIn: false,
  taskProgress: 0,
  questionCountToday: 0,
}

let state = { ...defaultState }

export function initUserStore() {
  try {
    const saved = uni.getStorageSync(STORAGE_KEY)
    if (saved) {
      state = { ...defaultState, ...saved }
    }
  } catch (e) {
    console.warn('initUserStore failed', e)
  }
}

export function getUserState() {
  return { ...state }
}

export function updateUserState(partial) {
  state = { ...state, ...partial }
  uni.setStorageSync(STORAGE_KEY, state)
  return state
}

export function completeOnboarding({ trackType, examYear, dailyMinutes }) {
  const isScience = trackType === 'science'
  return updateUserState({
    isProfileComplete: true,
    trackType,
    trackLabel: isScience ? '理工类' : '文史类',
    subjectSecondary: isScience ? 'math' : 'chinese',
    subjectSecondaryLabel: isScience ? '高等数学' : '大学语文',
    examYear,
    dailyMinutes,
  })
}

export function enrollUser() {
  return updateUserState({
    isEnrolled: true,
    enrollmentId: `enroll_${Date.now()}`,
    enrollmentPaidAt: new Date().toISOString(),
  })
}

export function simulateTaskProgress(progress, questionCount) {
  return updateUserState({
    taskProgress: progress,
    questionCountToday: questionCount,
  })
}

export function completeTodayCheckin() {
  const days = state.validCheckinDays + 1
  return updateUserState({
    validCheckinDays: days,
    todayCheckedIn: true,
    taskProgress: 100,
  })
}

export function resetDemoState() {
  state = { ...defaultState }
  uni.removeStorageSync(STORAGE_KEY)
}
