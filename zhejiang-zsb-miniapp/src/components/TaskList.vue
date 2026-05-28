<template>
  <view class="card">
    <view class="card-title">今日学习任务</view>
    <view class="butler text-muted">{{ plan.butlerMessage }}</view>
    <view class="task-list">
      <view v-for="task in plan.tasks" :key="task.taskId" class="task-item">
        <view class="task-check" :class="{ done: task.status === 'done' }">
          <text v-if="task.status === 'done'" class="check-icon">✓</text>
        </view>
        <view class="task-body">
          <view class="task-title">
            <text class="tag">{{ task.subjectLabel }}</text>
            {{ task.title }}
          </view>
          <view class="task-meta text-muted">
            {{ task.typeLabel }} · 约 {{ task.estimatedMinutes }} 分钟
            · {{ task.questionDone }}/{{ task.questionTarget }} 题
          </view>
        </view>
      </view>
    </view>
    <view v-if="!plan.canCheckInToday" class="missing text-muted">
      <text v-if="!plan.checkInMissing.taskProgressOk">
        任务完成度 {{ plan.checkInMissing.taskProgressCurrent }}%，需 ≥80%
      </text>
      <text v-else-if="!plan.checkInMissing.questionsOk">
        已练 {{ plan.checkInMissing.questionsCurrent }} 题，需 ≥5 题
      </text>
    </view>
  </view>
</template>

<script setup>
defineProps({
  plan: { type: Object, required: true },
})
</script>

<style scoped lang="scss">
.butler {
  margin-bottom: 20rpx;
  line-height: 1.6;
}
.task-body {
  flex: 1;
}
.task-title {
  font-size: 28rpx;
  font-weight: 500;
  margin-bottom: 6rpx;
}
.task-meta {
  font-size: 22rpx;
}
.check-icon {
  color: #fff;
  font-size: 22rpx;
  display: block;
  text-align: center;
  line-height: 34rpx;
}
.missing {
  margin-top: 16rpx;
  padding: 16rpx;
  background: #fff7ed;
  border-radius: 12rpx;
  font-size: 24rpx;
}
</style>
