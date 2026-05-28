<template>
  <view class="container rules-page">
    <view class="version text-muted">版本 V1.0 · 入营费 ¥9.9 · 90% 入池</view>

    <view class="section">
      <view class="section-title">一、活动简介</view>
      <view class="p">「坚持奖学池」为浙江省专升本考生提供的 30 天学习打卡挑战。支付 9.9 元入营费后，30 天内完成至少 25 天有效打卡，即可参与当期奖学池奖金瓜分。</view>
    </view>

    <view class="section">
      <view class="section-title">二、科目说明</view>
      <view class="p">理工类：英语 + 高等数学；文史类：英语 + 大学语文。注册时二选一，当期内不可更改。</view>
    </view>

    <view class="section">
      <view class="section-title">三、有效打卡标准</view>
      <view class="p">① 当日任务完成度 ≥ 80%；② 至少练习 5 道题；③ 23:59 前完成。每期最多 2 次补签。</view>
    </view>

    <view class="section">
      <view class="section-title">四、奖金瓜分</view>
      <view class="p">入营费 90% 进入奖学池。仅达标用户按人数平分。未达标不退费。48 小时内发放至微信。</view>
    </view>

    <view class="section">
      <view class="section-title">五、重要提示</view>
      <view class="p warn">入营费 9.9 元不退还。未满 25 天有效打卡不参与瓜分。奖池金额为估算值，以最终结算为准。</view>
    </view>

    <view class="footer text-muted">活动解释权归平台所有</view>
  </view>
</template>

<style scoped lang="scss">
.rules-page {
  padding-bottom: 60rpx;
}
.version {
  margin-bottom: 24rpx;
}
.section {
  margin-bottom: 32rpx;
}
.section-title {
  font-size: 30rpx;
  font-weight: 600;
  margin-bottom: 12rpx;
}
.p {
  font-size: 28rpx;
  line-height: 1.7;
  color: #475569;
}
.warn {
  color: #c2410c;
  background: #fff7ed;
  padding: 16rpx;
  border-radius: 12rpx;
}
.footer {
  text-align: center;
  font-size: 24rpx;
  margin-top: 40rpx;
}
</style>
