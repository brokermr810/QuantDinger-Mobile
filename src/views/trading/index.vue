<template>
  <div class="trading-page">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <van-search
        v-model="searchText"
        placeholder="搜索策略名称或标的"
        shape="round"
        background="transparent"
      />
    </div>

    <!-- 状态筛选 -->
    <div class="filter-tabs">
      <div
        v-for="tab in statusTabs"
        :key="tab.value"
        :class="['tab-item', { active: currentStatus === tab.value }]"
        @click="currentStatus = tab.value"
      >
        <span class="label">{{ tab.label }}</span>
        <span class="count">{{ tab.count }}</span>
      </div>
    </div>

    <!-- 分组切换 -->
    <div class="group-toggle">
      <span :class="{ active: groupBy === 'strategy' }" @click="groupBy = 'strategy'">
        按策略
      </span>
      <span :class="{ active: groupBy === 'symbol' }" @click="groupBy = 'symbol'">
        按标的
      </span>
    </div>

    <!-- 策略列表 -->
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <div class="strategy-list">
        <!-- 按策略分组 -->
        <template v-if="groupBy === 'strategy'">
          <div
            v-for="strategy in filteredStrategies"
            :key="strategy.id"
            class="strategy-card"
            @click="goToDetail(strategy)"
          >
            <div class="card-header">
              <div class="name-row">
                <span class="name">{{ strategy.name }}</span>
                <span :class="['status-badge', strategy.status]">
                  {{ getStatusText(strategy.status) }}
                </span>
              </div>
              <span class="symbol">{{ strategy.trading_config?.symbol || '-' }}</span>
            </div>
            <div class="card-body">
              <div class="info-row">
                <span class="label">周期</span>
                <span class="value">{{ strategy.trading_config?.timeframe || '-' }}</span>
              </div>
              <div class="info-row">
                <span class="label">指标</span>
                <span class="value">{{ strategy.indicator?.name || '-' }}</span>
              </div>
              <div class="info-row">
                <span class="label">盈亏</span>
                <span :class="['value', getPnlClass(strategy)]">
                  {{ formatPnl(strategy) }}
                </span>
              </div>
            </div>
            <div class="card-footer">
              <van-button
                v-if="strategy.status === 'stopped'"
                type="success"
                size="small"
                plain
                :loading="strategy._loading"
                @click.stop="startStrategy(strategy)"
              >
                启动
              </van-button>
              <van-button
                v-if="strategy.status === 'running'"
                type="danger"
                size="small"
                plain
                :loading="strategy._loading"
                @click.stop="stopStrategy(strategy)"
              >
                停止
              </van-button>
            </div>
          </div>
        </template>

        <!-- 按标的分组 -->
        <template v-else>
          <div
            v-for="(strategies, symbol) in groupedBySymbol"
            :key="symbol"
            class="symbol-group"
          >
            <div class="group-header" @click="toggleSymbolGroup(symbol)">
              <span class="symbol-name">{{ symbol }}</span>
              <span class="count">{{ strategies.length }} 个策略</span>
              <van-icon :name="expandedSymbols[symbol] ? 'arrow-up' : 'arrow-down'" />
            </div>
            <div v-show="expandedSymbols[symbol]" class="group-content">
              <div
                v-for="strategy in strategies"
                :key="strategy.id"
                class="mini-strategy-card"
                @click="goToDetail(strategy)"
              >
                <div class="mini-header">
                  <span class="name">{{ strategy.name }}</span>
                  <span :class="['status-dot', strategy.status]"></span>
                </div>
                <div class="mini-info">
                  <span>{{ strategy.trading_config?.timeframe || '-' }}</span>
                  <span class="divider">|</span>
                  <span>{{ strategy.indicator?.name || '-' }}</span>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- 空状态 -->
        <van-empty
          v-if="filteredStrategies.length === 0 && !loading"
          image="search"
          description="暂无策略"
        />
      </div>
    </van-pull-refresh>

    <!-- 加载状态 -->
    <van-loading v-if="loading" class="page-loading" vertical>加载中...</van-loading>
  </div>
</template>

<script>
import { showToast, showConfirmDialog } from 'vant'
import { strategyApi } from '@/api'
import { useStrategyStore } from '@/stores'

export default {
  name: 'Trading',
  
  data() {
    return {
      searchText: '',
      currentStatus: 'all',
      groupBy: 'strategy',
      loading: false,
      refreshing: false,
      expandedSymbols: {}
    }
  },
  
  computed: {
    strategyStore() {
      return useStrategyStore()
    },
    
    strategies() {
      return this.strategyStore.strategies || []
    },
    
    statusTabs() {
      const counts = this.strategyStore.statusCounts
      return [
        { label: '全部', value: 'all', count: counts.total },
        { label: '运行中', value: 'running', count: counts.running },
        { label: '已停止', value: 'stopped', count: counts.stopped },
        { label: '异常', value: 'error', count: counts.error }
      ]
    },
    
    filteredStrategies() {
      let list = this.strategies
      
      if (this.currentStatus !== 'all') {
        list = list.filter(s => s.status === this.currentStatus)
      }
      
      if (this.searchText.trim()) {
        const keyword = this.searchText.trim().toLowerCase()
        list = list.filter(s => 
          s.name?.toLowerCase().includes(keyword) ||
          s.trading_config?.symbol?.toLowerCase().includes(keyword)
        )
      }
      
      return list
    },
    
    groupedBySymbol() {
      const groups = {}
      this.filteredStrategies.forEach(strategy => {
        const symbol = strategy.trading_config?.symbol || 'Unknown'
        if (!groups[symbol]) {
          groups[symbol] = []
        }
        groups[symbol].push(strategy)
      })
      return groups
    }
  },
  
  watch: {
    '$route.query.status': {
      handler(val) {
        if (val) {
          this.currentStatus = val
        }
      },
      immediate: true
    }
  },
  
  mounted() {
    this.loadStrategies()
  },
  
  methods: {
    async loadStrategies() {
      this.loading = true
      
      try {
        const res = await strategyApi.getList()
        if (res.code === 1 && res.data) {
          this.strategyStore.setStrategies(res.data)
          
          Object.keys(this.groupedBySymbol).forEach(symbol => {
            if (this.expandedSymbols[symbol] === undefined) {
              this.expandedSymbols[symbol] = true
            }
          })
        }
      } catch (err) {
        console.error('Load strategies error:', err)
      } finally {
        this.loading = false
      }
    },
    
    async onRefresh() {
      await this.loadStrategies()
      this.refreshing = false
    },
    
    toggleSymbolGroup(symbol) {
      this.expandedSymbols[symbol] = !this.expandedSymbols[symbol]
    },
    
    getStatusText(status) {
      const map = {
        running: '运行中',
        stopped: '已停止',
        error: '异常',
        starting: '启动中',
        stopping: '停止中'
      }
      return map[status] || status
    },
    
    getPnlClass(strategy) {
      const pnl = strategy.performance?.total_pnl || 0
      if (pnl > 0) return 'profit'
      if (pnl < 0) return 'loss'
      return ''
    },
    
    formatPnl(strategy) {
      const pnl = strategy.performance?.total_pnl
      if (pnl === undefined || pnl === null) return '-'
      const sign = pnl >= 0 ? '+' : ''
      return `${sign}${pnl.toFixed(2)}`
    },
    
    goToDetail(strategy) {
      this.$router.push(`/trading/strategy/${strategy.id}`)
    },
    
    async startStrategy(strategy) {
      try {
        strategy._loading = true
        const res = await strategyApi.start(strategy.id)
        if (res.code === 1) {
          showToast({ message: '启动成功', type: 'success' })
          await this.loadStrategies()
        } else {
          showToast({ message: res.msg || '启动失败', type: 'fail' })
        }
      } catch (err) {
        showToast({ message: '启动失败', type: 'fail' })
      } finally {
        strategy._loading = false
      }
    },
    
    async stopStrategy(strategy) {
      try {
        await showConfirmDialog({
          title: '确认停止',
          message: `确定要停止策略 "${strategy.name}" 吗？`
        })
        
        strategy._loading = true
        const res = await strategyApi.stop(strategy.id)
        if (res.code === 1) {
          showToast({ message: '已停止', type: 'success' })
          await this.loadStrategies()
        } else {
          showToast({ message: res.msg || '停止失败', type: 'fail' })
        }
      } catch (err) {
        if (err !== 'cancel') {
          showToast({ message: '停止失败', type: 'fail' })
        }
      } finally {
        strategy._loading = false
      }
    }
  }
}
</script>

<style scoped>
.trading-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  padding-bottom: 100px;
}

.search-bar {
  padding: 8px 16px;
}

.search-bar :deep(.van-search__content) {
  background: rgba(255, 255, 255, 0.08);
}

.search-bar :deep(.van-field__control) {
  color: #fff;
}

.filter-tabs {
  display: flex;
  padding: 0 16px;
  gap: 8px;
  margin-bottom: 12px;
  overflow-x: auto;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  white-space: nowrap;
  transition: all 0.3s;
}

.tab-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.tab-item .label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
}

.tab-item .count {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 6px;
  border-radius: 10px;
}

.tab-item.active .count {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.group-toggle {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 8px 16px;
  margin-bottom: 8px;
}

.group-toggle span {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  padding: 4px 0;
  border-bottom: 2px solid transparent;
  transition: all 0.3s;
}

.group-toggle span.active {
  color: #fff;
  border-bottom-color: #667eea;
}

.strategy-list {
  padding: 0 16px;
}

.strategy-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.card-header {
  margin-bottom: 12px;
}

.name-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.name-row .name {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

.status-badge {
  font-size: 11px;
  padding: 3px 8px;
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

.card-header .symbol {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

.card-body {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}

.info-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-row .label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}

.info-row .value {
  font-size: 14px;
  color: #fff;
}

.info-row .value.profit {
  color: #51cf66;
}

.info-row .value.loss {
  color: #ff6b6b;
}

.card-footer {
  display: flex;
  gap: 8px;
}

.card-footer :deep(.van-button--small) {
  height: 30px;
  padding: 0 16px;
  border-radius: 8px;
}

.symbol-group {
  margin-bottom: 12px;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
}

.group-header .symbol-name {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  flex: 1;
}

.group-header .count {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.group-header .van-icon {
  color: rgba(255, 255, 255, 0.5);
}

.group-content {
  padding: 8px 0 0 0;
}

.mini-strategy-card {
  background: rgba(255, 255, 255, 0.04);
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 8px;
  margin-left: 12px;
  border-left: 3px solid rgba(102, 126, 234, 0.5);
}

.mini-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.mini-header .name {
  font-size: 14px;
  color: #fff;
  flex: 1;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #868e96;
}

.status-dot.running {
  background: #51cf66;
}

.status-dot.error {
  background: #ff6b6b;
}

.mini-info {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.mini-info .divider {
  margin: 0 6px;
}

.page-loading {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #fff;
}
</style>
