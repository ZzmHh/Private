<script setup>
import { onLaunch } from '@dcloudio/uni-app'
import { initUserStore } from '@/store/user'

onLaunch(() => {
  initUserStore()
})
</script>

<style lang="scss">
@import '@/styles/global.scss';
</style>
