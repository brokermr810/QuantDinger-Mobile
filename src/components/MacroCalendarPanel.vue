<template>
  <div class="ios-section macro-calendar-section">
    <div class="macro-block qd-card">
      <div class="macro-head">
        <span class="macro-title">{{ $t('ai_hub.macro_title') }}</span>
        <van-loading v-if="loadingMacro" size="16" />
      </div>
      <div v-if="indices.length" class="index-scroll">
        <div v-for="ix in indices" :key="ix.symbol || ix.name" class="index-chip">
          <span class="ix-name">{{ ix.name || ix.symbol }}</span>
          <span class="ix-price">{{ formatIndexPrice(ix.price) }}</span>
          <span
            v-if="ix.change_percent != null"
            :class="['ix-chg', Number(ix.change_percent) >= 0 ? 'up' : 'down']"
          >
            {{ Number(ix.change_percent) >= 0 ? '+' : '' }}{{ Number(ix.change_percent).toFixed(2) }}%
          </span>
        </div>
      </div>
      <div v-else-if="!loadingMacro" class="macro-empty">{{ $t('ai_hub.macro_empty') }}</div>

      <div v-if="sentiment && sentiment.fear_greed != null" class="fg-block">
        <div class="fg-label">{{ $t('ai_hub.fear_greed_title') }}</div>
        <div class="fg-gauge">
          <div class="fg-marker" :style="{ left: `${Math.min(100, Math.max(0, Number(sentiment.fear_greed)))}%` }" />
        </div>
        <div class="fg-scale">
          <span>{{ $t('ai_hub.fear_greed_extreme_fear') }}</span>
          <div class="fg-mid">
            <strong>{{ sentiment.fear_greed }}</strong>
            <span v-if="formatFgClassification(sentiment.classification)" class="fg-class">{{
              formatFgClassification(sentiment.classification)
            }}</span>
          </div>
          <span>{{ $t('ai_hub.fear_greed_extreme_greed') }}</span>
        </div>
      </div>

      <button type="button" class="cal-head-row" @click="calendarExpanded = !calendarExpanded">
        <div class="cal-head-left">
          <span class="cal-head-title">{{ $t('ai_hub.calendar_title') }}</span>
          <span v-if="calendarEvents.length" class="cal-head-meta">{{
            $t('ai_hub.calendar_count', { n: calendarEvents.length })
          }}</span>
        </div>
        <van-icon :name="calendarExpanded ? 'arrow-up' : 'arrow-down'" class="cal-head-chev" />
      </button>
      <div v-show="calendarExpanded">
        <div v-if="calendarEvents.length" class="cal-list">
          <div v-for="ev in calendarEvents" :key="ev.id || ev.time + ev.title" class="cal-row">
            <span class="cal-time">{{ ev.time }}</span>
            <div class="cal-main">
              <div class="cal-head-line">
                <span v-if="ev.country" class="cal-country">{{ ev.country }}</span>
                <span class="cal-title">{{ displayEventTitle(ev) }}</span>
              </div>
              <div v-if="hasCalendarMetrics(ev)" class="cal-metrics">
                <span class="cm-item">
                  <span class="cm-lab">{{ $t('ai_hub.calendar_metric_actual') }}</span>
                  <span :class="['cm-val', surpriseColor(ev.surprise)]">{{ ev.actual || '--' }}</span>
                </span>
                <span class="cm-item">
                  <span class="cm-lab">{{ $t('ai_hub.calendar_metric_forecast') }}</span>
                  <span class="cm-val">{{ ev.forecast || '--' }}</span>
                </span>
                <span class="cm-item">
                  <span class="cm-lab">{{ $t('ai_hub.calendar_metric_previous') }}</span>
                  <span class="cm-val">{{ ev.previous || '--' }}</span>
                </span>
              </div>
              <div v-if="ev.surprise && ev.surprise !== 'inline'" class="cal-tags">
                <span :class="['cal-tag', 'surprise-' + ev.surprise]">
                  {{ surpriseLabel(ev.surprise) }}
                </span>
                <span v-if="ev.goldImpact" :class="['cal-tag', 'gold-' + ev.goldImpact]">
                  {{ goldImpactLabel(ev.goldImpact) }}
                </span>
              </div>
            </div>
            <span v-if="ev.impact" :class="['cal-impact', ev.impact]">{{ impactLabel(ev.impact) }}</span>
          </div>
        </div>
        <div v-else-if="!loadingMacro" class="macro-empty soft">{{ $t('ai_hub.calendar_empty') }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { globalMarketApi } from '@/api'

const CALENDAR_ZH_TO_EN_FALLBACK = {
  美国非农就业数据: 'US Non-Farm Payrolls',
  美联储利率决议: 'Fed Interest Rate Decision',
  美国CPI月率: 'US CPI m/m',
  欧洲央行利率决议: 'ECB Interest Rate Decision',
  日本央行利率决议: 'BoJ Interest Rate Decision',
  美国初请失业金人数: 'US Initial Jobless Claims',
  英国央行利率决议: 'BoE Interest Rate Decision',
  美国零售销售月率: 'US Retail Sales m/m',
  OPEC月度报告: 'OPEC Monthly Report',
  美国PPI月率: 'US PPI m/m',
  美国GDP季率: 'US GDP q/q',
  美国ISM制造业PMI: 'US ISM Manufacturing PMI',
  美国消费者信心指数: 'US Consumer Confidence',
  美国耐用品订单: 'US Durable Goods Orders',
  美国工业产出: 'US Industrial Production',
  美国贸易差额: 'US Trade Balance',
  美元指数: 'US Dollar Index'
}

export default {
  name: 'MacroCalendarPanel',
  data() {
    return {
      loadingMacro: false,
      indices: [],
      sentiment: null,
      calendarEvents: [],
      calendarExpanded: true
    }
  },
  mounted() {
    this.loadMacro()
  },
  activated() {
    this.loadMacro()
  },
  methods: {
    async loadMacro() {
      this.loadingMacro = true
      try {
        const [overviewRes, calendarRes, sentimentRes] = await Promise.allSettled([
          globalMarketApi.getOverview(),
          globalMarketApi.getCalendar({ limit: 8 }),
          globalMarketApi.getSentiment()
        ])
        if (overviewRes.status === 'fulfilled') {
          const r = overviewRes.value
          const ok = r?.code === 1 || r?.code === 200 || r?.success
          if (ok && r?.data) {
            this.indices = Array.isArray(r.data.indices) ? r.data.indices.slice(0, 12) : []
          } else {
            this.indices = []
          }
        } else {
          this.indices = []
        }
        if (calendarRes.status === 'fulfilled') {
          const r = calendarRes.value
          const raw = Array.isArray(r?.data) ? r.data : []
          this.calendarEvents = raw.slice(0, 8)
        } else {
          this.calendarEvents = []
        }
        if (sentimentRes.status === 'fulfilled') {
          const r = sentimentRes.value
          const s = r?.data
          this.sentiment =
            s && typeof s === 'object' && s.fear_greed != null && Number.isFinite(Number(s.fear_greed))
              ? s
              : null
        } else {
          this.sentiment = null
        }
      } catch {
        this.indices = []
        this.calendarEvents = []
        this.sentiment = null
      } finally {
        this.loadingMacro = false
      }
    },
    formatFgClassification(raw) {
      const c = String(raw || '').trim().toLowerCase().replace(/\s+/g, '_')
      if (!c) return ''
      const map = {
        extreme_fear: 'ai_hub.fear_greed_class_extreme_fear',
        fear: 'ai_hub.fear_greed_class_fear',
        neutral: 'ai_hub.fear_greed_class_neutral',
        greed: 'ai_hub.fear_greed_class_greed',
        extreme_greed: 'ai_hub.fear_greed_class_extreme_greed'
      }
      const key = map[c] || map[c.replace(/-/g, '_')]
      return key ? this.$t(key) : raw
    },
    formatIndexPrice(val) {
      if (val == null || val === '') return '--'
      const n = Number(val)
      if (Number.isNaN(n)) return String(val)
      if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + 'M'
      if (Math.abs(n) >= 1e4) return n.toLocaleString('en-US', { maximumFractionDigits: 0 })
      return n.toLocaleString('en-US', { maximumFractionDigits: 2 })
    },
    impactLabel(impact) {
      const k = String(impact || '').toLowerCase()
      if (k === 'high') return this.$t('ai_hub.calendar_impact_high')
      if (k === 'medium') return this.$t('ai_hub.calendar_impact_medium')
      if (k === 'low') return this.$t('ai_hub.calendar_impact_low')
      return impact || ''
    },
    hasCalendarMetrics(ev) {
      return !!(ev && (ev.actual || ev.forecast || ev.previous))
    },
    displayEventTitle(ev) {
      if (!ev) return ''
      const locale = String(this.$i18n?.locale || 'zh-CN')
      const cn = ev.title_zh || ev.title || ''
      const en = ev.title_en || ''
      const src = (cn && /[\u4e00-\u9fa5]/.test(cn)) ? cn : ''
      if (locale.startsWith('zh')) {
        return cn || en || '--'
      }
      if (en) return en
      if (src && CALENDAR_ZH_TO_EN_FALLBACK[src]) return CALENDAR_ZH_TO_EN_FALLBACK[src]
      return cn || '--'
    },
    surpriseColor(surprise) {
      if (surprise === 'higher') return 'surprise-up'
      if (surprise === 'lower') return 'surprise-down'
      return ''
    },
    surpriseLabel(surprise) {
      if (surprise === 'higher') return this.$t('ai_hub.calendar_surprise_higher')
      if (surprise === 'lower') return this.$t('ai_hub.calendar_surprise_lower')
      return ''
    },
    goldImpactLabel(kind) {
      if (kind === 'bullish') return this.$t('ai_hub.calendar_gold_bullish')
      if (kind === 'bearish') return this.$t('ai_hub.calendar_gold_bearish')
      return ''
    }
  }
}
</script>

<style scoped>
.macro-calendar-section {
  margin-bottom: 24px;
}

.macro-block {
  padding: 14px 14px 12px;
}

.macro-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.macro-title {
  font-size: 15px;
  font-weight: 800;
  color: var(--text);
  letter-spacing: -0.02em;
}

.macro-empty {
  font-size: 12px;
  color: var(--text-3);
  padding: 8px 0;
}

.macro-empty.soft { padding-top: 0; }

.index-scroll {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  margin-bottom: 12px;
  scrollbar-width: none;
}

.index-scroll::-webkit-scrollbar { display: none; }

.index-chip {
  flex: 0 0 auto;
  min-width: 108px;
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--surface-raised);
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ix-name { font-size: 11px; color: var(--text-3); font-weight: 600; }
.ix-price { font-size: 15px; font-weight: 800; color: var(--text); font-variant-numeric: tabular-nums; }
.ix-chg { font-size: 11px; font-weight: 700; font-variant-numeric: tabular-nums; }
.ix-chg.up { color: var(--up); }
.ix-chg.down { color: var(--down); }

.fg-block {
  margin-bottom: 12px;
  padding: 12px;
  border-radius: 12px;
  background: var(--surface-deep);
  border: 1px solid var(--hairline);
}

.fg-label { font-size: 12px; font-weight: 700; color: var(--text-2); margin-bottom: 8px; }

.fg-gauge {
  height: 8px;
  border-radius: 4px;
  background: linear-gradient(90deg, var(--down) 0%, var(--warn) 50%, var(--up) 100%);
  position: relative;
  overflow: visible;
}

.fg-marker {
  position: absolute;
  top: -4px;
  width: 4px;
  height: 16px;
  margin-left: -2px;
  border-radius: 2px;
  background: var(--text);
  box-shadow: 0 0 0 2px var(--bg-elevated);
}

.fg-scale {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  font-size: 11px;
  color: var(--text-3);
}

.fg-scale strong { color: var(--text); font-size: 13px; }

.fg-mid {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 56px;
}

.fg-class {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-2);
}

.cal-head-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin: 4px 0 8px;
  padding: 8px 2px;
  border: none;
  background: transparent;
  font: inherit;
  text-align: left;
  cursor: pointer;
  color: var(--text-2);
  border-radius: 8px;
  -webkit-tap-highlight-color: transparent;
}

.cal-head-row:active { background: var(--surface-raised); }

.cal-head-left {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  min-width: 0;
}

.cal-head-title {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-2);
}

.cal-head-meta {
  font-size: 11px;
  color: var(--text-3);
  font-weight: 600;
}

.cal-head-chev {
  flex-shrink: 0;
  font-size: 16px;
  color: var(--text-3);
}

.cal-list { display: flex; flex-direction: column; gap: 8px; }

.cal-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px;
  border-radius: 12px;
  background: var(--surface-raised);
  border: 1px solid var(--border);
}

.cal-time {
  flex-shrink: 0;
  width: 44px;
  font-size: 11px;
  color: var(--text-3);
  font-weight: 600;
}

.cal-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }

.cal-country {
  align-self: flex-start;
  font-size: 10px;
  font-weight: 700;
  color: var(--c-indigo);
  background: var(--c-indigo-soft);
  padding: 2px 6px;
  border-radius: 4px;
}

.cal-title { font-size: 13px; color: var(--text); line-height: 1.35; }

.cal-head-line {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.cal-metrics {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  font-variant-numeric: tabular-nums;
}

.cm-item { display: inline-flex; align-items: baseline; gap: 4px; }
.cm-lab { font-size: 10px; color: var(--text-3); font-weight: 600; }
.cm-val { font-size: 12px; color: var(--text); font-weight: 700; }
.cm-val.surprise-up { color: var(--up); }
.cm-val.surprise-down { color: var(--down); }

.cal-tags { display: flex; gap: 6px; flex-wrap: wrap; }

.cal-tag {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 6px;
}

.cal-tag.surprise-higher { background: var(--up-soft); color: var(--up); }
.cal-tag.surprise-lower { background: var(--down-soft); color: var(--down); }
.cal-tag.gold-bullish {
  background: rgba(250, 180, 50, 0.16);
  color: var(--accent-gold, #d49a2a);
}
.cal-tag.gold-bearish {
  background: rgba(148, 120, 60, 0.14);
  color: var(--text-2);
}

.cal-impact {
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 6px;
}

.cal-impact.high { background: var(--down-soft); color: var(--down); }
.cal-impact.medium { background: var(--warn-soft); color: var(--warn); }
.cal-impact.low { background: var(--c-slate-soft); color: var(--c-slate); }
</style>
