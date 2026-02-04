<template>
  <div class="detail-page">
    <van-nav-bar
      :title="strategy?.name || '策略详情'"
      left-arrow
      @click-left="$router.back()"
      :border="false"
    />

    <div v-if="strategy" class="content">
      <!-- 状态卡片 -->
      <div class="status-card">
        <div class="status-main">
          <span :class="['status-badge', strategy.status]">
            {{ getStatusText(strategy.status) }}
          </span>
          <span class="symbol">{{ strategy.trading_config?.symbol }}</span>
        </div>
        <div class="status-actions">
          <van-button
            v-if="strategy.status === 'stopped'"
            type="success"
            size="small"
            :loading="actionLoading"
            @click="startStrategy"
          >
            启动策略
          </van-button>
          <van-button
            v-if="strategy.status === 'running'"
            type="danger"
            size="small"
            :loading="actionLoading"
            @click="stopStrategy"
          >
            停止策略
          </van-button>
        </div>
      </div>

      <van-tabs v-model:active="activeTab" shrink animated swipeable>
        <van-tab title="概览">
          <div class="tab-content">
            <div class="info-section">
              <div class="section-title">策略配置</div>
              <div class="info-grid">
                <div class="info-item">
                  <span class="label">周期</span>
                  <span class="value">{{ strategy.trading_config?.timeframe || '-' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">指标</span>
                  <span class="value">{{ strategy.indicator?.name || '-' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">券商</span>
                  <span class="value">{{ strategy.trading_config?.broker || '-' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">账户</span>
                  <span class="value">{{ strategy.trading_config?.account_id || '-' }}</span>
                </div>
              </div>
            </div>

            <div class="info-section">
              <div class="section-title">绩效统计</div>
              <div class="info-grid">
                <div class="info-item">
                  <span class="label">总盈亏</span>
                  <span :class="['value', (strategy.performance?.total_pnl || 0) >= 0 ? 'profit' : 'loss']">
                    {{ formatMoney(strategy.performance?.total_pnl) }}
                  </span>
                </div>
                <div class="info-item">
                  <span class="label">胜率</span>
                  <span class="value">{{ formatPercent(strategy.performance?.win_rate) }}</span>
                </div>
                <div class="info-item">
                  <span class="label">总交易</span>
                  <span class="value">{{ strategy.performance?.total_trades || 0 }}</span>
                </div>
                <div class="info-item">
                  <span class="label">盈亏比</span>
                  <span class="value">{{ strategy.performance?.profit_factor?.toFixed(2) || '-' }}</span>
                </div>
              </div>
            </div>

            <div class="info-section">
              <div class="section-title">通知渠道</div>
              <div class="notify-tags">
                <van-tag
                  v-for="channel in (strategy.notify_channels || [])"
                  :key="channel"
                  type="primary"
                  plain
                  size="medium"
                >
                  {{ getChannelName(channel) }}
                </van-tag>
                <van-tag v-if="!strategy.notify_channels?.length" type="default">
                  未配置
                </van-tag>
              </div>
            </div>
          </div>
        </van-tab>

        <van-tab title="持仓">
          <div class="tab-content">
            <div v-if="positions.length > 0" class="position-list">
              <div v-for="pos in positions" :key="pos.ticket" class="position-item">
                <div class="pos-header">
                  <span class="symbol">{{ pos.symbol }}</span>
                  <span :class="['direction', pos.type?.toLowerCase()]">
                    {{ pos.type }}
                  </span>
                </div>
                <div class="pos-body">
                  <div class="pos-info">
                    <span class="label">手数</span>
                    <span class="value">{{ pos.volume }}</span>
                  </div>
                  <div class="pos-info">
                    <span class="label">开仓价</span>
                    <span class="value">{{ pos.price_open }}</span>
                  </div>
                  <div class="pos-info">
                    <span class="label">当前价</span>
                    <span class="value">{{ pos.price_current }}</span>
                  </div>
                  <div class="pos-info">
                    <span class="label">浮盈</span>
                    <span :class="['value', pos.profit >= 0 ? 'profit' : 'loss']">
                      {{ formatMoney(pos.profit) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <van-empty v-else image="search" description="暂无持仓" />
          </div>
        </van-tab>

        <van-tab title="记录">
          <div class="tab-content">
            <div v-if="trades.length > 0" class="trade-list">
              <div v-for="trade in trades" :key="trade.id" class="trade-item">
                <div class="trade-header">
                  <span class="symbol">{{ trade.symbol }}</span>
                  <span :class="['direction', trade.type?.toLowerCase()]">
                    {{ trade.type }}
                  </span>
                  <span class="time">{{ formatTime(trade.time) }}</span>
                </div>
                <div class="trade-body">
                  <div class="trade-info">
                    <span class="label">手数</span>
                    <span class="value">{{ trade.volume }}</span>
                  </div>
                  <div class="trade-info">
                    <span class="label">价格</span>
                    <span class="value">{{ trade.price }}</span>
                  </div>
                  <div class="trade-info">
                    <span class="label">盈亏</span>
                    <span :class="['value', (trade.profit || 0) >= 0 ? 'profit' : 'loss']">
                      {{ formatMoney(trade.profit) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <van-empty v-else image="search" description="暂无交易记录" />
          </div>
        </van-tab>
      </van-tabs>
    </div>

    <van-loading v-if="loading" class="page-loading" vertical>加载中...</van-loading>
  </div>
</template>

<script>
import { showToast, showConfirmDialog } from 'vant'
import { strategyApi } from '@/api'

export default {
  name: 'StrategyDetail',
  
  data() {
    return {
      strategyId: null,
      strategy: null,
      positions: [],
      trades: [],
      activeTab: 0,
      loading: false,
      actionLoading: false
    }
  },
  
  mounted() {
    this.strategyId = this.$route.params.id
    this.loadData()
  },
  
  methods: {
    async loadData() {
      this.loading = true
      
      try {
        const [detailRes, posRes, tradesRes] = await Promise.all([
          strategyApi.getDetail(this.strategyId),
          strategyApi.getPositions(this.strategyId),
          strategyApi.getTrades(this.strategyId, 50)
        ])
        
        if (detailRes.code === 1) {
          this.strategy = detailRes.data
        }
        
        if (posRes.code === 1) {
          this.positions = posRes.data || []
        }
        
        if (tradesRes.code === 1) {
          this.trades = tradesRes.data || []
        }
      } catch (err) {
        console.error('Load detail error:', err)
        showToast({ message: '加载失败', type: 'fail' })
      } finally {
        this.loading = false
      }
    },
    
    getStatusText(status) {
      const map = { running: '运行中', stopped: '已停止', error: '异常' }
      return map[status] || status
    },
    
    getChannelName(channel) {
      const map = {
        email: '邮件',
        telegram: 'Telegram',
        wechat: '企业微信',
        webhook: 'Webhook',
        bark: 'Bark'
      }
      return map[channel] || channel
    },
    
    formatMoney(val) {
      if (val === undefined || val === null) return '-'
      const sign = val >= 0 ? '+' : ''
      return `${sign}${val.toFixed(2)}`
    },
    
    formatPercent(val) {
      if (val === undefined || val === null) return '-'
      return `${(val * 100).toFixed(1)}%`
    },
    
    formatTime(time) {
      if (!time) return '-'
      const d = new Date(time)
      return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
    },
    
    async startStrategy() {
      this.actionLoading = true
      try {
        const res = await strategyApi.start(this.strategyId)
        if (res.code === 1) {
          showToast({ message: '启动成功', type: 'success' })
          await this.loadData()
        } else {
          showToast({ message: res.msg || '启动失败', type: 'fail' })
        }
      } catch (err) {
        showToast({ message: '启动失败', type: 'fail' })
      } finally {
        this.actionLoading = false
      }
    },
    
    async stopStrategy() {
      try {
        await showConfirmDialog({ title: '确认停止', message: '确定要停止该策略吗？' })
        
        this.actionLoading = true
        const res = await strategyApi.stop(this.strategyId)
        if (res.code === 1) {
          showToast({ message: '已停止', type: 'success' })
          await this.loadData()
        } else {
          showToast({ message: res.msg || '停止失败', type: 'fail' })
        }
      } catch (err) {
        if (err !== 'cancel') {
          showToast({ message: '停止失败', type: 'fail' })
        }
      } finally {
        this.actionLoading = false
      }
    }
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

.status-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 16px;
}

.status-main {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-badge {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 10px;
  background: rgba(134, 142, 150, 0.3);
  color: #adb5bd;
}

.status-badge.running {
  background: rgba(81, 207, 102, 0.2);
  color: #51cf66;
}

.status-badge.error {
  background: rgba(255, 107, 107, 0.2);
  color: #ff6b6b;
}

.status-main .symbol {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

.detail-page :deep(.van-tabs__nav) {
  background: transparent;
}

.detail-page :deep(.van-tab) {
  color: rgba(255, 255, 255, 0.6);
}

.detail-page :deep(.van-tab--active) {
  color: #fff;
}

.detail-page :deep(.van-tabs__line) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.tab-content {
  padding: 16px 0;
}

.info-section {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 12px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item .label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.info-item .value {
  font-size: 15px;
  color: #fff;
}

.info-item .value.profit {
  color: #51cf66;
}

.info-item .value.loss {
  color: #ff6b6b;
}

.notify-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.position-list,
.trade-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.position-item,
.trade-item {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 14px;
}

.pos-header,
.trade-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.pos-header .symbol,
.trade-header .symbol {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
}

.direction {
  font-size: 12px;
  padding: 3px 8px;
  border-radius: 6px;
}

.direction.buy {
  background: rgba(81, 207, 102, 0.2);
  color: #51cf66;
}

.direction.sell {
  background: rgba(255, 107, 107, 0.2);
  color: #ff6b6b;
}

.trade-header .time {
  margin-left: auto;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
}

.pos-body {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.trade-body {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.pos-info,
.trade-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pos-info .label,
.trade-info .label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}

.pos-info .value,
.trade-info .value {
  font-size: 14px;
  color: #fff;
}

.pos-info .value.profit,
.trade-info .value.profit {
  color: #51cf66;
}

.pos-info .value.loss,
.trade-info .value.loss {
  color: #ff6b6b;
}

.page-loading {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #fff;
}
</style>
