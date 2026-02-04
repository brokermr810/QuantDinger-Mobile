<template>
  <div class="assets-page">
    <!-- 总资产卡片 -->
    <div class="total-card">
      <div class="card-header">
        <span class="label">总资产 (USD)</span>
        <van-icon :name="showAsset ? 'eye-o' : 'closed-eye'" @click="showAsset = !showAsset" />
      </div>
      <div class="total-value">
        <span v-if="showAsset">{{ formatMoney(totalAssets) }}</span>
        <span v-else>******</span>
      </div>
      <div class="pnl-row">
        <div class="pnl-item">
          <span class="label">今日盈亏</span>
          <span :class="['value', todayPnl >= 0 ? 'profit' : 'loss']" v-if="showAsset">
            {{ formatPnl(todayPnl) }}
          </span>
          <span v-else>****</span>
        </div>
        <div class="pnl-item">
          <span class="label">持仓盈亏</span>
          <span :class="['value', floatingPnl >= 0 ? 'profit' : 'loss']" v-if="showAsset">
            {{ formatPnl(floatingPnl) }}
          </span>
          <span v-else>****</span>
        </div>
      </div>
    </div>

    <!-- 账户列表 -->
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <div class="section-title">账户列表</div>
      <div class="broker-list">
        <div
          v-for="broker in brokers"
          :key="broker.broker"
          class="broker-card"
          @click="goToDetail(broker)"
        >
          <div class="broker-header">
            <span class="icon">{{ getBrokerIcon(broker.broker) }}</span>
            <span class="name">{{ broker.broker }}</span>
            <van-tag v-if="broker.connected" type="success" size="small">已连接</van-tag>
            <van-tag v-else type="danger" size="small">断开</van-tag>
          </div>
          <div class="broker-body">
            <div class="info">
              <span class="label">净值</span>
              <span class="value" v-if="showAsset">{{ formatMoney(broker.total_value) }}</span>
              <span v-else>****</span>
            </div>
            <div class="info">
              <span class="label">可用</span>
              <span class="value" v-if="showAsset">{{ formatMoney(broker.free_margin) }}</span>
              <span v-else>****</span>
            </div>
            <div class="info">
              <span class="label">持仓</span>
              <span class="value">{{ broker.positions_count || 0 }}</span>
            </div>
          </div>
        </div>

        <van-empty v-if="brokers.length === 0 && !loading" description="暂无账户" />
      </div>
    </van-pull-refresh>

    <van-loading v-if="loading" class="page-loading" vertical>加载中...</van-loading>
  </div>
</template>

<script>
import { dashboardApi } from '@/api'
import { useDashboardStore } from '@/stores'

export default {
  name: 'Assets',
  
  data() {
    return {
      showAsset: true,
      loading: false,
      refreshing: false
    }
  },
  
  computed: {
    dashboardStore() {
      return useDashboardStore()
    },
    
    brokers() {
      return this.dashboardStore.summary?.brokers || []
    },
    
    totalAssets() {
      return this.dashboardStore.totalAssets
    },
    
    todayPnl() {
      return this.brokers.reduce((sum, b) => sum + (b.today_pnl || 0), 0)
    },
    
    floatingPnl() {
      return this.brokers.reduce((sum, b) => sum + (b.floating_pnl || 0), 0)
    }
  },
  
  mounted() {
    this.loadData()
  },
  
  methods: {
    async loadData() {
      this.loading = true
      try {
        const res = await dashboardApi.getSummary()
        if (res.code === 1 && res.data) {
          this.dashboardStore.setSummary(res.data)
        }
      } catch (err) {
        console.error('Load assets error:', err)
      } finally {
        this.loading = false
      }
    },
    
    async onRefresh() {
      await this.loadData()
      this.refreshing = false
    },
    
    getBrokerIcon(broker) {
      const icons = { 'MT5': '📊', 'IBKR': '🏦', 'Binance': '₿', 'OKX': '🔶' }
      return icons[broker] || '💹'
    },
    
    formatMoney(val) {
      if (val === undefined || val === null) return '0.00'
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(val)
    },
    
    formatPnl(val) {
      if (val === undefined || val === null) return '-'
      const sign = val >= 0 ? '+' : ''
      return `${sign}${val.toFixed(2)}`
    },
    
    goToDetail(broker) {
      this.$router.push(`/assets/detail/${broker.broker}`)
    }
  }
}
</script>

<style scoped>
.assets-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  padding: 16px;
  padding-bottom: 100px;
}

.total-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.card-header .label {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

.card-header .van-icon {
  color: rgba(255, 255, 255, 0.8);
}

.total-value {
  font-size: 32px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 16px;
}

.pnl-row {
  display: flex;
  gap: 24px;
}

.pnl-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pnl-item .label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.pnl-item .value {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

.pnl-item .value.profit {
  color: #51cf66;
}

.pnl-item .value.loss {
  color: #ff6b6b;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 12px;
}

.broker-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.broker-card {
  background: rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  padding: 16px;
}

.broker-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.broker-header .icon {
  font-size: 24px;
}

.broker-header .name {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  flex: 1;
}

.broker-body {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.broker-body .info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.broker-body .label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.broker-body .value {
  font-size: 15px;
  color: #fff;
}

.page-loading {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #fff;
}
</style>
