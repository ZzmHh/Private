<template>
  <view class="card">
    <view class="card-header">
      <text class="card-title">打卡进度</text>
      <text v-if="progress.isQualified" class="tag qualified">已锁定瓜分资格</text>
      <text v-else class="tag">目标 25 天</text>
    </view>
    <view class="progress-numbers">
      <text class="big">{{ progress.validCheckinDays }}</text>
      <text class="slash">/</text>
      <text class="small">{{ progress.checkinTarget }}</text>
      <text class="unit">有效打卡天</text>
    </view>
    <view class="progress-bar">
      <view class="progress-fill" :style="{ width: percent + '%' }" />
    </view>
    <view class="progress-footer text-muted">
      <template v-if="progress.isQualified">🎉 你已达成瓜分资格，继续保持！</template>
      <template v-else-if="progress.todayCheckedIn">✅ 今日已打卡，明天继续</template>
      <template v-else>再坚持 {{ progress.daysNeeded }} 天即可参与瓜分</template>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { checkinPercent } from '@/utils/format'

const props = defineProps({
  progress: { type: Object, required: true },
})

const percent = computed(() =>
  checkinPercent(props.progress.validCheckinDays, props.progress.checkinTarget)
)
</script>

<style scoped lang="scss">
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}
.qualified {
  background: #d1fae5;
  color: #047857;
}
.progress-numbers {
  display: flex;
  align-items: baseline;
  margin-bottom: 16rpx;
}
.big {
  font-size: 56rpx;
  font-weight: 700;
  color: #e85d04;
}
.slash {
  font-size: 32rpx;
  color: #94a3b8;
  margin: 0 4rpx;
}
.small {
  font-size: 32rpx;
  color: #64748b;
}
.unit {
  font-size: 24rpx;
  color: #94a3b8;
  margin-left: 12rpx;
}
.progress-footer {
  margin-top: 16rpx;
  font-size: 24rpx;
}
</style>
