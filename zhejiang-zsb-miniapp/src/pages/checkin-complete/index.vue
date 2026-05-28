<template>
  <view class="page">
    <view class="nav-bar" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="nav-back" @tap="goHome">← 返回</view>
    </view>

    <view class="container" v-if="data">
      <view class="hero">
        <view class="hero-icon">{{ data.resultType === 'qualified' ? '🏆' : '✅' }}</view>
        <view class="hero-title">{{ data.title }}</view>
        <view class="hero-sub text-muted">{{ data.subtitle }}</view>
      </view>

      <view class="card">
        <view class="stats-grid">
          <view class="stat">
            <text class="num">{{ data.checkinProgress.validCheckinDays }}</text>
            <text class="lbl">有效打卡天</text>
          </view>
          <view class="stat">
            <text class="num">{{ data.todaySummary.minutes }}</text>
            <text class="lbl">今日分钟</text>
          </view>
          <view class="stat">
            <text class="num">{{ data.todaySummary.questionCount }}</text>
            <text class="lbl">练题数</text>
          </view>
          <view class="stat">
            <text class="num">{{ data.todaySummary.accuracy }}%</text>
            <text class="lbl">正确率</text>
          </view>
        </view>
      </view>

      <view class="card">
        <view class="card-title">今日小结</view>
        <view>英语：{{ data.todaySummary.englishSummary }}</view>
        <view>{{ secondaryLabel }}：{{ data.todaySummary.secondarySummary }}</view>
      </view>

      <view class="card pool-card">
        <view class="text-muted">本期奖学池约</view>
        <view class="pool-amount">¥{{ data.poolSummary.poolAmountYuan }}</view>
        <view v-if="!data.checkinProgress.isQualified" class="text-muted">
          再坚持 {{ data.checkinProgress.daysNeeded }} 天即可参与瓜分
        </view>
        <view v-else class="text-success">🎉 瓜分资格已锁定</view>
      </view>

      <view class="card">
        <view class="card-title">📅 明日预告</view>
        <view>英语 · {{ data.tomorrowPlan.englishTopic }}</view>
        <view>{{ secondaryLabel }} · {{ data.tomorrowPlan.secondaryTopic }}</view>
        <view class="text-muted">约 {{ data.tomorrowPlan.estimatedMinutes }} 分钟</view>
      </view>

      <view class="butler text-muted">{{ data.butlerClosingMessage }}</view>

      <button class="btn-primary" @tap="goHome">返回首页</button>
      <button class="btn-secondary share-btn" open-type="share">分享今日打卡</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShareAppMessage } from '@dcloudio/uni-app'
import { fetchCheckinResult } from '@/services/api'
import { getUserState } from '@/store/user'

const statusBarHeight = ref(20)
const data = ref(null)

const secondaryLabel = computed(() => {
  const user = getUserState()
  return user.subjectSecondaryLabel || '高等数学'
})

onMounted(async () => {
  const sys = uni.getSystemInfoSync()
  statusBarHeight.value = sys.statusBarHeight || 20
  data.value = await fetchCheckinResult()
})

function goHome() {
  uni.switchTab({ url: '/pages/home/index' })
}

onShareAppMessage(() => ({
  title: data.value?.shareConfig?.shareTitle || '浙江专升本打卡挑战',
  path: '/pages/home/index',
}))
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #f5f7fa;
}
.nav-bar {
  background: #fff;
  padding-bottom: 16rpx;
  padding-left: 32rpx;
}
.nav-back {
  font-size: 28rpx;
  color: #64748b;
}
.hero {
  text-align: center;
  padding: 32rpx 0 24rpx;
}
.hero-icon {
  font-size: 72rpx;
}
.hero-title {
  font-size: 40rpx;
  font-weight: 700;
  margin: 16rpx 0 8rpx;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16rpx;
  text-align: center;
}
.num {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  color: #e85d04;
}
.lbl {
  font-size: 22rpx;
  color: #94a3b8;
}
.pool-card {
  text-align: center;
}
.butler {
  text-align: center;
  margin: 24rpx 0;
  font-size: 26rpx;
}
.share-btn {
  margin-top: 20rpx;
}
</style>
