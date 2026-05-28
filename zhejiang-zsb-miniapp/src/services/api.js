/**
 * API 服务层
 * MVP 阶段走 mock；接数据库后只需改 USE_MOCK=false 并实现后端接口
 */
import { delay } from '@/utils/format'
import {
  buildHomeResponse,
  buildEnrollPageData,
  buildCheckinCompleteData,
  buildLotteryResultData,
} from '@/mock/index'
import { getUserState, enrollUser, simulateTaskProgress, completeTodayCheckin } from '@/store/user'

const USE_MOCK = true
const API_BASE = 'https://your-api.example.com/api/v1'

async function request(path, options = {}) {
  if (USE_MOCK) return null
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${API_BASE}${path}`,
      method: options.method || 'GET',
      data: options.data,
      header: options.header || {},
      success: (res) => resolve(res.data),
      fail: reject,
    })
  })
}

export async function fetchHome() {
  await delay(200)
  if (USE_MOCK) return buildHomeResponse()
  return request('/home')
}

export async function fetchEnrollPage() {
  await delay(150)
  if (USE_MOCK) return buildEnrollPageData()
  return request('/pool/current')
}

export async function submitEnroll() {
  await delay(500)
  if (USE_MOCK) {
    enrollUser()
    return { success: true, enrollmentId: getUserState().enrollmentId }
  }
  return request('/pool/enroll', { method: 'POST' })
}

export async function fetchCheckinResult() {
  await delay(150)
  if (USE_MOCK) return buildCheckinCompleteData()
  return request('/checkin/today-result')
}

export async function fetchLotteryResult(periodId) {
  await delay(200)
  if (USE_MOCK) return buildLotteryResultData(periodId)
  return request(`/pool/${periodId || 'current'}/result`)
}

/** 模拟学习进度（演示用） */
export async function simulateLearning() {
  await delay(300)
  simulateTaskProgress(85, 8)
  return buildHomeResponse()
}

/** 完成打卡 */
export async function submitCheckin() {
  await delay(400)
  completeTodayCheckin()
  return buildCheckinCompleteData()
}

export { USE_MOCK, API_BASE }
