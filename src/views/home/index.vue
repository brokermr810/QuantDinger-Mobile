<template>
  <div class="home-page">
    <!-- 顶部问候 -->
    <div class="header">
      <div class="greeting">
        <span class="time-icon">{{ timeIcon }}</span>
        <span class="text">{{ greetingText }}</span>
      </div>
      <div class="user" @click="$router.push('/profile')">
        <van-icon name="setting-o" size="24" />
      </div>
    </div>

    <!-- 资产概览卡片 -->
    <div class="asset-card" @click="refreshData">
      <div class="asset-header">
        <span class="label">总资产 (USD)</span>
        <van-icon :name="showAsset ? 'eye-o' : 'closed-eye'" @click.stop="showAsset = !showAsset" />
      </div>
      <div class="asset-value">
        <span v-if="showAsset">{{ formatMoney(totalAssets) }}</span>
        <span v-else>******</span>
      </div>
      <div class="asset-change" :class="{ profit: todayProfit >= 0 }">
        <span>今日盈亏：</span>
        <span v-if="showAsset">{{ todayProfit >= 0 ? '+' : '' }}{{ formatMoney(todayProfit) }}</span>
        <span v-else>****</span>
      </div>
    </div>

    <!-- 策略统计 -->
    <div class="section">
      <div class="section-header">
        <span class="title">策略概览</span>
        <span class="more" @click="$router.push('/trading')">查看全部 ›</span>
      </div>
      <div class="strategy-stats">
        <div class="stat-item" @click="goToTrading('all')">
          <span class="value">{{ strategyCounts.total }}</span>
          <span class="label">总策略</span>
        </div>
        <div class="stat-item running" @click="goToTrading('running')">
          <span class="value">{{ strategyCounts.running }}</span>
          <span class="label">运行中</span>
        </div>
        <div class="stat-item stopped" @click="goToTrading('stopped')">
          <span class="value">{{ strategyCounts.stopped }}</span>
          <span class="label">已停止</span>
        </div>
        <div class="stat-item error" @click="goToTrading('error')">
          <span class="value">{{ strategyCounts.error }}</span>
          <span class="label">异常</span>
        </div>
      </div>
    </div>

    <!-- 账户列表 -->
    <div class="section" v-if="brokers.length > 0">
      <div class="section-header">
        <span class="title">账户</span>
        <span class="more" @click="$router.push('/assets')">详情 ›</span>
      </div>
      <div class="broker-list">
        <div class="broker-item" v-for="broker in brokers" :key="broker.broker">
          <div class="broker-info">
            <span class="broker-icon">{{ getBrokerIcon(broker.broker) }}</span>
            <span class="broker-name">{{ broker.broker }}</span>
          </div>
          <div class="broker-value">
            <span v-if="showAsset">{{ formatMoney(broker.total_value) }}</span>
            <span v-else>****</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 快捷入口 -->
    <div class="section">
      <div class="section-header">
        <span class="title">快捷入口</span>
      </div>
      <div class="quick-actions">
        <div class="action-item" @click="$router.push('/market')">
          <div class="icon market">📈</div>
          <span>指标市场</span>
        </div>
        <div class="action-item" @click="$router.push('/trading')">
          <div class="icon strategy">🤖</div>
          <span>交易助手</span>
        </div>
        <div class="action-item" @click="$router.push('/profile/notifications')">
          <div class="icon notify">🔔</div>
          <span>消息</span>
        </div>
        <div class="action-item" @click="$router.push('/home/macro')">
          <div class="icon macro">🌍</div>
          <span>宏观数据</span>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <van-loading v-if="loading" class="page-loading" vertical>加载中...</van-loading>
  </div>
</template>

<script>
import { dashboardApi, strategyApi } from '@/api'
import { useDashboardStore, useStrategyStore } from '@/stores'

export default {
  name: 'Home',
  
  data() {
    return {
      showAsset: true,
      loading: false
    }
  },
  
  computed: {
    dashboardStore() {
      return useDashboardStore()
    },
    strategyStore() {
      return useStrategyStore()
    },
    
    greetingText() {
      const hour = new Date().getHours()
      if (hour < 6) return '夜深了'
      if (hour < 9) return '早上好'
      if (hour < 12) return '上午好'
      if (hour < 14) return '中午好'
      if (hour < 18) return '下午好'
      if (hour < 22) return '晚上好'
      return '夜深了'
    },
    
    timeIcon() {
      const hour = new Date().getHours()
      if (hour < 6 || hour >= 22) return '🌙'
      if (hour < 12) return '🌅'
      if (hour < 18) return '☀️'
      return '🌆'
    },
    
    totalAssets() {
      return this.dashboardStore.totalAssets
    },
    
    todayProfit() {
      const summary = this.dashboardStore.summary
      if (!summary?.brokers) return 0
      return summary.brokers.reduce((sum, b) => sum + (b.today_pnl || 0), 0)
    },
    
    brokers() {
      return this.dashboardStore.summary?.brokers || []
    },
    
    strategyCounts() {
      return this.strategyStore.statusCounts
    }
  },
  
  mounted() {
    this.loadData()
  },
  
  methods: {
    async loadData() {
      this.loading = true
      
      try {
        const [dashRes, strategyRes] = await Promise.all([
          dashboardApi.getSummary(),
          strategyApi.getList()
        ])
        
        if (dashRes.code === 1 && dashRes.data) {
          this.dashboardStore.setSummary(dashRes.data)
        }
        
        if (strategyRes.code === 1 && strategyRes.data) {
          this.strategyStore.setStrategies(strategyRes.data)
        }
      } catch (err) {
        console.error('Load data error:', err)
      } finally {
        this.loading = false
      }
    },
    
    async refreshData() {
      await this.loadData()
    },
    
    formatMoney(value) {
      if (value === undefined || value === null) return '0.00'
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value)
    },
    
    getBrokerIcon(broker) {
      const icons = {
        'MT5': '📊',
        'IBKR': '🏦',
        'Binance': '₿',
        'OKX': '🔶'
      }
      return icons[broker] || '💹'
    },
    
    goToTrading(status) {
      this.$router.push({ path: '/trading', query: { status } })
    }
  }
}
</script>

<style scoped>
.home-page {
  padding: 16px;
  padding-bottom: 100px;
  min-height: 100vh;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.greeting {
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-icon {
  font-size: 24px;
}

.greeting .text {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
}

.user {
  color: rgba(255, 255, 255, 0.7);
}

/* 资产卡片 */
.asset-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
}

.asset-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.asset-header .label {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

.asset-header .van-icon {
  color: rgba(255, 255, 255, 0.8);
}

.asset-value {
  font-size: 32px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 12px;
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
}

.asset-change {
  font-size: 14px;
  color: #ff6b6b;
}

.asset-change.profit {
  color: #51cf66;
}

/* 板块 */
.section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-header .title {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

.section-header .more {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

/* 策略统计 */
.strategy-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.stat-item {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 16px 8px;
  text-align: center;
  backdrop-filter: blur(10px);
}

.stat-item .value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 4px;
}

.stat-item .label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.stat-item.running .value {
  color: #51cf66;
}

.stat-item.stopped .value {
  color: #868e96;
}

.stat-item.error .value {
  color: #ff6b6b;
}

/* 账户列表 */
.broker-list {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  overflow: hidden;
}

.broker-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.broker-item:last-child {
  border-bottom: none;
}

.broker-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.broker-icon {
  font-size: 20px;
}

.broker-name {
  color: #fff;
  font-size: 15px;
}

.broker-value {
  color: #51cf66;
  font-weight: 600;
  font-size: 15px;
}

/* 快捷入口 */
.quick-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
}

.action-item .icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.action-item span {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}

/* 加载状态 */
.page-loading {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #fff;
}
</style>
