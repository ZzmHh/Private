<template>
  <view class="container">
    <view class="title">开始你的备考</view>
    <view class="text-muted subtitle">选择你的考试类别，我们将为你定制学习计划</view>

    <view class="card">
      <view class="card-title">目标考试年份</view>
      <picker :range="examYears" :value="yearIndex" @change="onYearChange">
        <view class="picker">{{ examYear }} 年</view>
      </picker>
    </view>

    <view class="card">
      <view class="card-title">考试类别（二选一）</view>
      <view
        class="track-option"
        :class="{ active: trackType === 'science' }"
        @tap="trackType = 'science'"
      >
        <view class="track-name">理工类（理科）</view>
        <view class="text-muted">大学英语 + 高等数学</view>
      </view>
      <view
        class="track-option"
        :class="{ active: trackType === 'arts' }"
        @tap="trackType = 'arts'"
      >
        <view class="track-name">文史类（文科）</view>
        <view class="text-muted">大学英语 + 大学语文</view>
      </view>
    </view>

    <view class="card">
      <view class="card-title">每日可用学习时间</view>
      <view class="minutes-row">
        <view
          v-for="m in minuteOptions"
          :key="m"
          class="minute-chip"
          :class="{ active: dailyMinutes === m }"
          @tap="dailyMinutes = m"
        >
          {{ m }} 分钟
        </view>
      </view>
    </view>

    <button class="btn-primary" @tap="onSubmit">生成我的学习计划</button>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { completeOnboarding } from '@/store/user'

const examYears = [2026, 2027]
const yearIndex = ref(0)
const examYear = ref(2026)
const trackType = ref('science')
const dailyMinutes = ref(60)
const minuteOptions = [30, 60, 90]

function onYearChange(e) {
  yearIndex.value = Number(e.detail.value)
  examYear.value = examYears[yearIndex.value]
}

function onSubmit() {
  completeOnboarding({ trackType: trackType.value, examYear: examYear.value, dailyMinutes: dailyMinutes.value })
  uni.showToast({ title: '设置完成', icon: 'success' })
  setTimeout(() => {
    uni.switchTab({ url: '/pages/home/index' })
  }, 500)
}
</script>

<style scoped lang="scss">
.title {
  font-size: 40rpx;
  font-weight: 700;
  margin-bottom: 8rpx;
}
.subtitle {
  margin-bottom: 32rpx;
}
.picker {
  padding: 20rpx;
  background: #f8fafc;
  border-radius: 12rpx;
}
.track-option {
  padding: 24rpx;
  border: 2rpx solid #e2e8f0;
  border-radius: 16rpx;
  margin-bottom: 16rpx;
}
.track-option.active {
  border-color: #fdba74;
  background: #fff7ed;
}
.track-name {
  font-weight: 600;
  margin-bottom: 4rpx;
}
.minutes-row {
  display: flex;
  gap: 16rpx;
}
.minute-chip {
  flex: 1;
  text-align: center;
  padding: 20rpx;
  border: 2rpx solid #e2e8f0;
  border-radius: 12rpx;
  font-size: 26rpx;
}
.minute-chip.active {
  border-color: #e85d04;
  background: #fff7ed;
  color: #e85d04;
  font-weight: 600;
}
</style>
