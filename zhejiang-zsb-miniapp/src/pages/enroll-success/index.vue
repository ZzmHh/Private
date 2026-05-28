<template>
  <view class="container success-page">
    <view class="icon">🎉</view>
    <view class="title">入营成功，挑战正式开始</view>
    <view class="text-muted">
      你已成功加入 {{ periodName }}
    </view>

    <view class="card stats">
      <view class="stat-row">
        <text class="label">挑战目标</text>
        <text class="value">30 天内有效打卡 25 天</text>
      </view>
      <view class="stat-row">
        <text class="label">当前奖学池</text>
        <text class="value accent">约 ¥{{ poolAmountYuan }}</text>
      </view>
      <view class="stat-row">
        <text class="label">今日进度</text>
        <text class="value">完成学习即可计入 1/25</text>
      </view>
    </view>

    <button class="btn-primary" @tap="goHome">去完成今日任务</button>
    <button class="btn-secondary share-btn" open-type="share">邀请同学一起挑战</button>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { fetchHome } from '@/services/api'
import { onShareAppMessage } from '@dcloudio/uni-app'

const periodName = ref('2026年5月·第1期')
const poolAmountYuan = ref('7343.4')

onMounted(async () => {
  const home = await fetchHome()
  periodName.value = home.period.periodName
  poolAmountYuan.value = home.poolSummary.poolAmountYuan
})

function goHome() {
  uni.switchTab({ url: '/pages/home/index' })
}

onShareAppMessage(() => ({
  title: '9.9 元挑战 30 天，坚持 25 天就能分钱',
  path: '/pages/home/index',
}))
</script>

<style scoped lang="scss">
.success-page {
  text-align: center;
  padding-top: 80rpx;
}
.icon {
  font-size: 80rpx;
  margin-bottom: 24rpx;
}
.title {
  font-size: 36rpx;
  font-weight: 700;
  margin-bottom: 12rpx;
}
.stats {
  text-align: left;
  margin: 40rpx 0;
}
.stat-row {
  display: flex;
  justify-content: space-between;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f1f5f9;
  font-size: 28rpx;
}
.stat-row:last-child {
  border-bottom: none;
}
.label {
  color: #64748b;
}
.accent {
  color: #e85d04;
  font-weight: 600;
}
.share-btn {
  margin-top: 20rpx;
}
</style>
