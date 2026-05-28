<template>
  <view class="container">
    <view v-if="loading" class="loading">加载中...</view>

    <template v-else-if="data">
      <!-- 未注册引导 -->
      <view v-if="!data.user.isProfileComplete" class="card welcome">
        <view class="welcome-title">浙江专升本 · 坚持奖学池</view>
        <view class="text-muted">每天 AI 规划学什么，坚持 25 天参与真实奖学池瓜分</view>
      </view>

      <!-- 顶部信息 -->
      <view v-else class="header-meta text-muted">
        <text>{{ data.period.periodName }}</text>
        <text v-if="data.examCountdown.daysToExam"> · 距考试 {{ data.examCountdown.daysToExam }} 天</text>
        <text> · {{ data.examCountdown.studyPhaseLabel }}</text>
      </view>

      <PoolBanner
        :summary="data.poolSummary"
        :period-days-left="data.period.periodDaysLeft"
      />

      <view v-if="data.user.isEnrolled" class="card butler-card">
        <view class="card-title">🤖 学习管家</view>
        <view>{{ data.todayPlan.butlerMessage }}</view>
      </view>

      <CheckinProgress v-if="data.user.isEnrolled" :progress="data.checkinProgress" />

      <TaskList v-if="data.user.isProfileComplete" :plan="data.todayPlan" />

      <!-- 演示操作（MVP） -->
      <view v-if="data.user.isEnrolled && !data.checkinProgress.todayCheckedIn" class="card demo-card">
        <view class="card-title">演示操作</view>
        <view class="text-muted demo-tip">模拟完成学习进度，体验打卡流程</view>
        <button class="btn-secondary demo-btn" @tap="onSimulate">模拟完成学习（85% + 8题）</button>
      </view>

      <view class="bottom-space" />
    </template>

    <!-- 底部操作栏 -->
    <view v-if="data && !loading" class="sticky-bottom">
      <button v-if="data.ui.primaryAction === 'onboarding'" class="btn-primary" @tap="goOnboarding">
        {{ data.ui.primaryActionLabel }}
      </button>
      <button v-else-if="data.ui.primaryAction === 'enroll'" class="btn-primary" @tap="goEnroll">
        {{ data.ui.primaryActionLabel }}
      </button>
      <button v-else-if="data.ui.primaryAction === 'checkin'" class="btn-primary" @tap="onCheckin">
        {{ data.ui.primaryActionLabel }}
      </button>
      <button v-else-if="data.ui.primaryAction === 'view_tomorrow'" class="btn-primary" @tap="goCheckinComplete">
        查看打卡成果
      </button>
      <button v-else class="btn-primary" @tap="onSimulate">
        {{ data.ui.primaryActionLabel }}
      </button>
      <view v-if="data.ui.showEnrollBar" class="enroll-hint text-muted">
        不入营也可体验基础学习 · 入营后可参与奖学池瓜分
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { fetchHome, simulateLearning, submitCheckin } from '@/services/api'
import PoolBanner from '@/components/PoolBanner.vue'
import CheckinProgress from '@/components/CheckinProgress.vue'
import TaskList from '@/components/TaskList.vue'

const loading = ref(true)
const data = ref(null)

async function loadHome() {
  loading.value = true
  try {
    data.value = await fetchHome()
  } finally {
    loading.value = false
  }
}

function goOnboarding() {
  uni.navigateTo({ url: '/pages/onboarding/index' })
}

function goEnroll() {
  uni.navigateTo({ url: '/pages/enroll/index' })
}

async function onSimulate() {
  uni.showLoading({ title: '学习中...' })
  try {
    data.value = await simulateLearning()
    uni.showToast({ title: '学习进度已更新', icon: 'success' })
  } finally {
    uni.hideLoading()
  }
}

async function onCheckin() {
  uni.showLoading({ title: '提交打卡...' })
  try {
    await submitCheckin()
    uni.hideLoading()
    uni.navigateTo({ url: '/pages/checkin-complete/index' })
  } catch (e) {
    uni.hideLoading()
    uni.showToast({ title: '打卡失败', icon: 'none' })
  }
}

function goCheckinComplete() {
  uni.navigateTo({ url: '/pages/checkin-complete/index' })
}

onShow(() => {
  loadHome()
})
</script>

<style scoped lang="scss">
.loading {
  text-align: center;
  padding: 80rpx;
  color: #94a3b8;
}
.welcome-title {
  font-size: 36rpx;
  font-weight: 700;
  margin-bottom: 12rpx;
}
.header-meta {
  margin-bottom: 16rpx;
  font-size: 24rpx;
}
.butler-card {
  font-size: 28rpx;
  line-height: 1.6;
}
.demo-card .demo-tip {
  margin-bottom: 16rpx;
}
.demo-btn {
  margin-top: 8rpx;
}
.bottom-space {
  height: 200rpx;
}
.enroll-hint {
  text-align: center;
  margin-top: 16rpx;
  font-size: 22rpx;
}
</style>
