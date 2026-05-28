<template>
  <view class="container">
    <view v-if="loading" class="loading">加载中...</view>

    <template v-else-if="data">
      <view class="hero card">
        <view class="price-row">
          <text class="price">¥{{ data.entryFeeYuan }}</text>
          <text class="price-unit">/ 期</text>
        </view>
        <view class="hero-title">加入坚持奖学池</view>
        <view class="text-muted">30 天学习挑战 · 25 天有效打卡 · 真实奖金瓜分</view>
        <view class="trust-row">
          <text>✓ {{ data.poolRatePercent }} 入池</text>
          <text>✓ 48h 到账</text>
          <text>✓ 规则透明</text>
        </view>
      </view>

      <PoolBanner :summary="data.poolSummary" :period-days-left="30" />

      <view class="card">
        <view class="card-title">入营后你将获得</view>
        <view class="benefit-item">① 当期奖学池瓜分资格</view>
        <view class="benefit-item">② 英语 + {{ secondaryLabel }} 每日 AI 计划</view>
        <view class="benefit-item">③ 完整备考通行证奖励</view>
        <view class="benefit-item">④ 打卡进度实时可见</view>
      </view>

      <view class="card">
        <view class="card-title">本期奖池怎么算？</view>
        <view class="text-muted">
          每 1 位用户入营，8.91 元进入奖学池（9.9 × 90%）。
          当前 {{ data.poolSummary.joinedCount }} 人，奖池约 ¥{{ data.poolSummary.poolAmountYuan }}。
        </view>
        <view class="example text-muted">
          示例：1000 人入营、300 人达标 → 人均约 29.7 元（估算）
        </view>
      </view>

      <view class="card">
        <view class="card-title">怎样才能参与分钱？</view>
        <view class="rule-step">① 30 天内有效打卡 ≥ {{ data.checkinTarget }} 天</view>
        <view class="rule-step">② 每日任务 ≥80% + 练题 ≥5 道</view>
        <view class="rule-step">③ 23:59 前完成 · 每期最多 2 次补签</view>
      </view>

      <view class="card warn-card">
        <view class="card-title">⚠️ 请仔细阅读</view>
        <view class="warn-text">
          入营费 9.9 元不退还。未满 25 天有效打卡不参与瓜分，也不退费。
          你选择的类别：{{ data.trackLabel }}（当期不可更改）。
        </view>
        <view class="agree-row" @tap="toggleAgree">
          <checkbox :checked="agreed" />
          <text>我已阅读并同意</text>
          <text class="link" @tap.stop="goRules">《坚持奖学池活动规则》</text>
        </view>
      </view>

      <view class="bottom-space" />
    </template>

    <view class="sticky-bottom">
      <button
        class="btn-primary"
        :disabled="!agreed || paying"
        @tap="onPay"
      >
        {{ payButtonText }}
      </button>
      <view class="pay-tip text-muted">微信支付 · 每期每账号限购 1 次</view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { fetchEnrollPage, submitEnroll } from '@/services/api'
import PoolBanner from '@/components/PoolBanner.vue'

const loading = ref(true)
const data = ref(null)
const agreed = ref(false)
const paying = ref(false)

const secondaryLabel = computed(() =>
  data.value?.trackType === 'arts' ? '大学语文' : '高等数学'
)

const payButtonText = computed(() => {
  if (paying.value) return '支付中...'
  if (!agreed.value) return '请先阅读并同意活动规则'
  if (data.value?.alreadyEnrolled) return '你已入营'
  return '支付 9.9 元，立即入营'
})

async function loadData() {
  loading.value = true
  data.value = await fetchEnrollPage()
  loading.value = false
}

function toggleAgree() {
  agreed.value = !agreed.value
}

function goRules() {
  uni.navigateTo({ url: '/pages/rules/index' })
}

async function onPay() {
  if (!agreed.value || data.value?.alreadyEnrolled) return
  paying.value = true
  try {
    // MVP：模拟支付；接后端后换 wx.requestPayment
    await submitEnroll()
    uni.redirectTo({ url: '/pages/enroll-success/index' })
  } catch (e) {
    uni.showToast({ title: '支付失败', icon: 'none' })
  } finally {
    paying.value = false
  }
}

onMounted(loadData)
</script>

<style scoped lang="scss">
.hero {
  text-align: center;
}
.price-row {
  margin-bottom: 8rpx;
}
.price {
  font-size: 64rpx;
  font-weight: 700;
  color: #e85d04;
}
.price-unit {
  font-size: 28rpx;
  color: #64748b;
}
.hero-title {
  font-size: 36rpx;
  font-weight: 600;
  margin-bottom: 8rpx;
}
.trust-row {
  display: flex;
  justify-content: center;
  gap: 24rpx;
  margin-top: 20rpx;
  font-size: 24rpx;
  color: #047857;
}
.benefit-item,
.rule-step {
  padding: 10rpx 0;
  font-size: 28rpx;
  line-height: 1.5;
}
.example {
  margin-top: 12rpx;
  padding: 16rpx;
  background: #f8fafc;
  border-radius: 12rpx;
}
.warn-card {
  border: 2rpx solid #fed7aa;
  background: #fffbeb;
}
.warn-text {
  font-size: 26rpx;
  line-height: 1.6;
  margin-bottom: 20rpx;
}
.agree-row {
  display: flex;
  align-items: center;
  font-size: 26rpx;
  gap: 8rpx;
}
.link {
  color: #e85d04;
}
.bottom-space {
  height: 180rpx;
}
.pay-tip {
  text-align: center;
  margin-top: 12rpx;
  font-size: 22rpx;
}
</style>
