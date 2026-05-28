<template>
  <view class="container">
    <view class="card profile-header">
      <view class="avatar">{{ avatarText }}</view>
      <view>
        <view class="name">{{ user.nickname || '备考同学' }}</view>
        <view class="text-muted">{{ user.trackLabel }} · {{ user.examYear }} 年考试</view>
      </view>
    </view>

    <view v-if="user.isEnrolled" class="card">
      <CheckinProgress :progress="checkinProgress" />
    </view>

    <view class="card menu">
      <view class="menu-item" @tap="goEnroll">
        <text>{{ user.isEnrolled ? '本期已入营' : '加入坚持奖学池' }}</text>
        <text class="arrow">›</text>
      </view>
      <view class="menu-item" @tap="goLottery">
        <text>开奖公示（演示）</text>
        <text class="arrow">›</text>
      </view>
      <view class="menu-item" @tap="goRules">
        <text>活动规则</text>
        <text class="arrow">›</text>
      </view>
      <view class="menu-item" @tap="resetDemo">
        <text class="danger">重置演示数据</text>
        <text class="arrow">›</text>
      </view>
    </view>

    <view class="card text-muted dev-note">
      当前为 MVP 演示版，数据保存在本地。接后端后此处展示掌握度、错题本、通行证等。
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getUserState, resetDemoState } from '@/store/user'
import { buildCheckinProgress } from '@/mock/index'
import CheckinProgress from '@/components/CheckinProgress.vue'

const user = ref({})
const checkinProgress = ref({})

const avatarText = computed(() => (user.value.nickname || '备').slice(0, 1))

function refresh() {
  user.value = getUserState()
  checkinProgress.value = buildCheckinProgress(user.value)
}

function goEnroll() {
  uni.navigateTo({ url: '/pages/enroll/index' })
}

function goLottery() {
  uni.navigateTo({ url: '/pages/lottery-result/index' })
}

function goRules() {
  uni.navigateTo({ url: '/pages/rules/index' })
}

function resetDemo() {
  uni.showModal({
    title: '重置演示',
    content: '将清除本地注册、入营、打卡数据',
    success(res) {
      if (res.confirm) {
        resetDemoState()
        refresh()
        uni.showToast({ title: '已重置', icon: 'success' })
      }
    },
  })
}

onShow(refresh)
</script>

<style scoped lang="scss">
.profile-header {
  display: flex;
  align-items: center;
  gap: 24rpx;
}
.avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #fb923c, #e85d04);
  color: #fff;
  font-size: 40rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}
.name {
  font-size: 32rpx;
  font-weight: 600;
}
.menu-item {
  display: flex;
  justify-content: space-between;
  padding: 28rpx 0;
  border-bottom: 1rpx solid #f1f5f9;
  font-size: 28rpx;
}
.menu-item:last-child {
  border-bottom: none;
}
.arrow {
  color: #cbd5e1;
}
.danger {
  color: #ef4444;
}
.dev-note {
  font-size: 24rpx;
  line-height: 1.6;
}
</style>
