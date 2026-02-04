<template>
  <div class="stock-detail-page">
    <van-nav-bar
      :title="symbol"
      left-arrow
      @click-left="$router.back()"
      :border="false"
    />
    
    <div class="content">
      <!-- 价格信息 -->
      <div class="price-card">
        <div class="price-main">
          <span class="price">{{ formatPrice(priceData.price) }}</span>
          <span :class="['change', priceData.change >= 0 ? 'up' : 'down']">
            {{ formatChange(priceData.change, priceData.change_percent) }}
          </span>
        </div>
        <div class="price-time">{{ priceData.time || '--' }}</div>
      </div>
      
      <!-- K线图占位 -->
      <div class="chart-placeholder">
        <p>K线图开发中...</p>
      </div>
      
      <!-- 详细信息 -->
      <div class="info-card">
        <div class="info-row">
          <span class="label">开盘价</span>
          <span class="value">{{ priceData.open || '--' }}</span>
        </div>
        <div class="info-row">
          <span class="label">最高价</span>
          <span class="value">{{ priceData.high || '--' }}</span>
        </div>
        <div class="info-row">
          <span class="label">最低价</span>
          <span class="value">{{ priceData.low || '--' }}</span>
        </div>
        <div class="info-row">
          <span class="label">成交量</span>
          <span class="value">{{ priceData.volume || '--' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { klineApi } from '@/api'

export default {
  name: 'StockDetail',
  
  data() {
    return {
      market: '',
      symbol: '',
      priceData: {}
    }
  },
  
  mounted() {
    this.market = this.$route.params.market
    this.symbol = this.$route.params.symbol
    this.loadData()
  },
  
  methods: {
    async loadData() {
      try {
        const res = await klineApi.getTicker(this.symbol, this.market)
        if (res.code === 1 && res.data) {
          this.priceData = res.data
        }
      } catch (err) {
        console.error('Load ticker error:', err)
      }
    },
    
    formatPrice(price) {
      if (!price) return '--'
      return price.toFixed(price >= 100 ? 2 : 4)
    },
    
    formatChange(change, percent) {
      if (change === undefined) return '--'
      const sign = change >= 0 ? '+' : ''
      return `${sign}${change.toFixed(4)} (${sign}${(percent || 0).toFixed(2)}%)`
    }
  }
}
</script>

<style scoped>
.stock-detail-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
}

.stock-detail-page :deep(.van-nav-bar) {
  background: transparent;
}

.stock-detail-page :deep(.van-nav-bar__title),
.stock-detail-page :deep(.van-nav-bar__arrow) {
  color: #fff;
}

.content {
  padding: 16px;
}

.price-card {
  background: rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  padding: 20px;
  margin-bottom: 16px;
}

.price-main {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 8px;
}

.price-main .price {
  font-size: 32px;
  font-weight: 700;
  color: #fff;
}

.price-main .change {
  font-size: 14px;
}

.price-main .change.up {
  color: #51cf66;
}

.price-main .change.down {
  color: #ff6b6b;
}

.price-time {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.chart-placeholder {
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.chart-placeholder p {
  color: rgba(255, 255, 255, 0.4);
}

.info-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.info-row:last-child {
  border-bottom: none;
}

.info-row .label {
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
}

.info-row .value {
  color: #fff;
  font-size: 14px;
}
</style>
