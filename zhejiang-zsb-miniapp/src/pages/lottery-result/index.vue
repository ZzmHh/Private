<template>
  <view class="container">
    <view v-if="loading" class="loading">加载中...</view>

    <template v-else-if="data">
      <view class="header card">
        <view class="period-name">{{ data.periodName }} · 开奖公示</view>
        <view class="status-tag">✅ 已开奖 · 奖金发放完成</view>
      </view>

      <view class="card overview">
        <view class="overview-grid">
          <view class="item">
            <text class="val">¥{{ data.totalPoolYuan }}</text>
            <text class="lbl">可分配总额</text>
          </view>
          <view class="item">
            <text class="val">{{ data.winnersCount }}</text>
            <text class="lbl">达标人数</text>
          </view>
          <view class="item">
            <text class="val accent">¥{{ data.perUserAmountYuan }}</text>
            <text class="lbl">人均奖金</text>
          </view>
        </view>
        <view class="detail text-muted">
          入营 {{ data.joinedCount }} 人 · 未达标 {{ data.failedCount }} 人 · 90% 入池
        </view>
      </view>

      <!-- 我的结果 -->
      <view class="card my-result" :class="{ success: data.myResult.isQualified }">
        <template v-if="data.myResult.isQualified">
          <view class="card-title">🎉 恭喜你，本期挑战成功</view>
          <view class="reward-amount">¥{{ data.myResult.rewardAmountYuan }}</view>
          <view class="text-muted">有效打卡 {{ data.myResult.validCheckinDays }} 天 · 已到账</view>
          <button class="btn-secondary share-btn" open-type="share">分享我的成绩</button>
        </template>
        <template v-else>
          <view class="card-title">本期未达瓜分标准</view>
          <view class="text-muted">
            你本期有效打卡 {{ data.myResult.validCheckinDays }}/25 天，不参与奖金分配。
          </view>
          <view class="review">
            <view>累计学习 {{ data.myResult.learningStats.totalHours }} 小时</view>
            <view>累计练题 {{ data.myResult.learningStats.totalQuestions }} 道</view>
            <view>
              掌握度提升：英语 +{{ data.myResult.learningStats.englishGain }}%
              · {{ secondaryLabel }} +{{ data.myResult.learningStats.secondaryGain }}%
            </view>
          </view>
        </template>
      </view>

      <view class="card">
        <view class="card-title">达标用户公示</view>
        <view v-for="w in data.winnersList" :key="w.rank" class="winner-row">
          <text>{{ w.rank }}. {{ w.nicknameMasked }}</text>
          <text class="text-muted">{{ w.validCheckinDays }} 天</text>
          <text class="amount">¥{{ w.rewardAmountYuan }}</text>
        </view>
        <view class="text-muted more">仅展示部分名单</view>
      </view>

      <view class="card">
        <view class="card-title">下一期即将开启</view>
        <view>{{ data.nextPeriod.periodName }}</view>
        <view class="text-muted">入营费 ¥{{ data.nextPeriod.entryFeeYuan }} · {{ data.nextPeriod.startDate }} 开营</view>
        <button v-if="data.renewOffer?.available" class="btn-primary renew-btn" @tap="goEnroll">
          续营专享 ¥{{ data.renewOffer.renewPriceYuan }} 入营
        </button>
      </view>
    </template>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShareAppMessage } from '@dcloudio/uni-app'
import { fetchLotteryResult } from '@/services/api'
import { getUserState } from '@/store/user'

const loading = ref(true)
const data = ref(null)

const secondaryLabel = computed(() => getUserState().subjectSecondaryLabel || '高等数学')

onMounted(async () => {
  data.value = await fetchLotteryResult()
  loading.value = false
})

function goEnroll() {
  uni.navigateTo({ url: '/pages/enroll/index' })
}

onShareAppMessage(() => ({
  title: `我分了 ¥${data.value?.myResult?.rewardAmountYuan || '0'}，下一期 9.9 一起来`,
  path: '/pages/home/index',
}))
</script>

<style scoped lang="scss">
.period-name {
  font-size: 32rpx;
  font-weight: 600;
}
.status-tag {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #047857;
}
.overview-grid {
  display: flex;
  justify-content: space-around;
  text-align: center;
  margin-bottom: 16rpx;
}
.item .val {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
}
.item .val.accent {
  color: #e85d04;
}
.item .lbl {
  font-size: 22rpx;
  color: #94a3b8;
}
.my-result.success {
  border: 2rpx solid #6ee7b7;
  background: #ecfdf5;
  text-align: center;
}
.reward-amount {
  font-size: 64rpx;
  font-weight: 700;
  color: #e85d04;
  margin: 16rpx 0;
}
.review {
  margin-top: 16rpx;
  font-size: 26rpx;
  line-height: 1.8;
  color: #64748b;
}
.winner-row {
  display: flex;
  justify-content: space-between;
  padding: 12rpx 0;
  border-bottom: 1rpx solid #f1f5f9;
  font-size: 26rpx;
}
.amount {
  color: #e85d04;
  font-weight: 500;
}
.more {
  margin-top: 12rpx;
  font-size: 22rpx;
}
.share-btn,
.renew-btn {
  margin-top: 20rpx;
}
</style>
