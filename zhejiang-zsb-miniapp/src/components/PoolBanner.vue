<template>
  <view class="pool-banner">
    <view class="pool-row">
      <text class="pool-label">🔥 本期奖学池约</text>
      <text class="pool-amount">¥{{ summary.poolAmountYuan }}</text>
    </view>
    <view class="pool-meta text-muted">
      已有 {{ summary.joinedCount }} 人入营 · 剩余 {{ periodDaysLeft }} 天
      <text v-if="summary.isEstimate"> · 估算</text>
    </view>
    <view v-if="showRate" class="pool-tip text-muted">
      入营费 90% 进入奖学池 · 25 天达标即可瓜分
    </view>
  </view>
</template>

<script setup>
defineProps({
  summary: { type: Object, required: true },
  periodDaysLeft: { type: Number, default: 0 },
  showRate: { type: Boolean, default: true },
})
</script>

<style scoped lang="scss">
.pool-row {
  display: flex;
  align-items: baseline;
  gap: 12rpx;
  margin-bottom: 8rpx;
}
.pool-label {
  font-size: 26rpx;
  color: #9a3412;
}
.pool-meta,
.pool-tip {
  font-size: 24rpx;
  line-height: 1.6;
}
</style>
