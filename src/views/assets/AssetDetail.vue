<template>
  <div class="detail-page">
    <van-nav-bar
      :title="account"
      left-arrow
      @click-left="$router.back()"
      :border="false"
    />
    
    <div class="content">
      <div class="placeholder">
        <p>账户详情开发中...</p>
        <p class="sub">可查看持仓、订单等详细信息</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AssetDetail',
  
  data() {
    return {
      account: ''
    }
  },
  
  mounted() {
    this.account = this.$route.params.account
  }
}
</script>

<style scoped>
.detail-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
}

.detail-page :deep(.van-nav-bar) {
  background: transparent;
}

.detail-page :deep(.van-nav-bar__title),
.detail-page :deep(.van-nav-bar__arrow) {
  color: #fff;
}

.content {
  padding: 16px;
}

.placeholder {
  height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.6);
}

.placeholder .sub {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 8px;
}
</style>
