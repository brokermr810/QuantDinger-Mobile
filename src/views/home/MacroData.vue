<template>
  <div class="macro-page">
    <van-nav-bar
      title="宏观数据"
      left-arrow
      @click-left="$router.back()"
      :border="false"
    />
    
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <div class="content">
        <!-- 市场概览 -->
        <div class="section">
          <div class="section-title">市场指数</div>
          <div class="index-grid">
            <div class="index-card" v-for="index in indices" :key="index.symbol">
              <span class="name">{{ index.name }}</span>
              <span class="value">{{ index.price }}</span>
              <span :class="['change', index.change >= 0 ? 'up' : 'down']">
                {{ index.change >= 0 ? '+' : '' }}{{ index.change_percent?.toFixed(2) }}%
              </span>
            </div>
          </div>
        </div>
        
        <!-- 市场情绪 -->
        <div class="section" v-if="sentiment">
          <div class="section-title">市场情绪</div>
          <div class="sentiment-card">
            <div class="fear-greed">
              <div class="gauge">
                <div class="gauge-value" :style="{ width: sentiment.fear_greed + '%' }"></div>
              </div>
              <div class="labels">
                <span>极度恐惧</span>
                <span class="value">{{ sentiment.fear_greed }}</span>
                <span>极度贪婪</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 经济日历 -->
        <div class="section">
          <div class="section-title">今日财经事件</div>
          <div class="calendar-list">
            <div class="calendar-item" v-for="event in calendar" :key="event.id">
              <div class="event-time">{{ event.time }}</div>
              <div class="event-content">
                <span class="country">{{ event.country }}</span>
                <span class="title">{{ event.title }}</span>
                <div class="values" v-if="event.actual !== undefined">
                  <span>实际: {{ event.actual }}</span>
                  <span>预期: {{ event.forecast }}</span>
                  <span>前值: {{ event.previous }}</span>
                </div>
              </div>
              <div :class="['impact', event.impact]">{{ getImpactText(event.impact) }}</div>
            </div>
            
            <van-empty v-if="calendar.length === 0 && !loading" description="暂无事件" />
          </div>
        </div>
      </div>
    </van-pull-refresh>
    
    <van-loading v-if="loading" class="page-loading" vertical>加载中...</van-loading>
  </div>
</template>

<script>
import { globalMarketApi } from '@/api'

export default {
  name: 'MacroData',
  
  data() {
    return {
      loading: false,
      refreshing: false,
      indices: [],
      sentiment: null,
      calendar: []
    }
  },
  
  mounted() {
    this.loadData()
  },
  
  methods: {
    async loadData() {
      this.loading = true
      
      try {
        const [overviewRes, calendarRes, sentimentRes] = await Promise.all([
          globalMarketApi.getOverview(),
          globalMarketApi.getCalendar({ limit: 10 }),
          globalMarketApi.getSentiment()
        ])
        
        if (overviewRes.code === 1 && overviewRes.data) {
          this.indices = overviewRes.data.indices || []
        }
        
        if (calendarRes.code === 1 && calendarRes.data) {
          this.calendar = calendarRes.data || []
        }
        
        if (sentimentRes.code === 1 && sentimentRes.data) {
          this.sentiment = sentimentRes.data
        }
      } catch (err) {
        console.error('Load macro data error:', err)
      } finally {
        this.loading = false
      }
    },
    
    async onRefresh() {
      await this.loadData()
      this.refreshing = false
    },
    
    getImpactText(impact) {
      const map = { high: '高', medium: '中', low: '低' }
      return map[impact] || impact
    }
  }
}
</script>

<style scoped>
.macro-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
}

.macro-page :deep(.van-nav-bar) {
  background: transparent;
}

.macro-page :deep(.van-nav-bar__title),
.macro-page :deep(.van-nav-bar__arrow) {
  color: #fff;
}

.content {
  padding: 16px;
  padding-bottom: 80px;
}

.section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 12px;
}

/* 指数网格 */
.index-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.index-card {
  background: rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.index-card .name {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

.index-card .value {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
}

.index-card .change {
  font-size: 13px;
}

.index-card .change.up {
  color: #51cf66;
}

.index-card .change.down {
  color: #ff6b6b;
}

/* 情绪卡片 */
.sentiment-card {
  background: rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 16px;
}

.fear-greed .gauge {
  height: 8px;
  background: linear-gradient(90deg, #ff6b6b 0%, #ffd43b 50%, #51cf66 100%);
  border-radius: 4px;
  position: relative;
  margin-bottom: 8px;
}

.fear-greed .gauge-value {
  position: absolute;
  top: -4px;
  width: 4px;
  height: 16px;
  background: #fff;
  border-radius: 2px;
}

.fear-greed .labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.fear-greed .labels .value {
  font-weight: 600;
  color: #fff;
}

/* 日历列表 */
.calendar-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.calendar-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 10px;
  padding: 12px;
}

.event-time {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  min-width: 50px;
}

.event-content {
  flex: 1;
}

.event-content .country {
  display: inline-block;
  font-size: 11px;
  color: #667eea;
  background: rgba(102, 126, 234, 0.2);
  padding: 2px 6px;
  border-radius: 4px;
  margin-bottom: 4px;
}

.event-content .title {
  display: block;
  font-size: 14px;
  color: #fff;
  margin-bottom: 4px;
}

.event-content .values {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}

.impact {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
}

.impact.high {
  background: rgba(255, 107, 107, 0.2);
  color: #ff6b6b;
}

.impact.medium {
  background: rgba(255, 212, 59, 0.2);
  color: #ffd43b;
}

.impact.low {
  background: rgba(134, 142, 150, 0.2);
  color: #868e96;
}

.page-loading {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #fff;
}
</style>
