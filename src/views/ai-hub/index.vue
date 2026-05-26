<template>
  <div class="ai-hub-page">
    <!-- Nav: title + history drawer trigger -->
    <div class="nav-header">
      <div class="nav-top-row">
        <div class="nav-top-left">
          <span class="nav-eyebrow">
            <span class="sparkle">✦</span>
            {{ $t('ai_hub.title') }}
          </span>
        </div>
        <button type="button" class="history-tab" @click="openHistoryDrawer">
          <van-icon name="clock-o" />
          <span>{{ $t('ai_hub.open_history') }}</span>
        </button>
      </div>
      <h1 class="nav-title">{{ $t('ai_hub.hero_title') }}</h1>
      <p class="nav-desc">{{ $t('ai_hub.hero_desc') }}</p>
    </div>

    <!-- AI analysis entry cards -->
    <div class="feature-cards">
      <div class="feat-card analysis" @click="$router.push('/ai-analysis')">
        <div class="feat-body">
          <div class="feat-icon">
            <van-icon name="fire-o" />
          </div>
          <div class="feat-copy">
            <span class="feat-title">{{ $t('ai_hub.card_analysis_title') }}</span>
            <p class="feat-desc">{{ $t('ai_hub.card_analysis_desc') }}</p>
          </div>
        </div>
        <div class="feat-cta">
          <span>{{ $t('ai_hub.go_analysis') }}</span>
          <van-icon name="arrow" />
        </div>
      </div>
    </div>

    <!-- Chat-style bot generator -->
    <div class="chat-card qd-card">
      <div class="chat-head">
        <van-icon name="chat-o" class="chat-head-icon" />
        <div>
          <div class="chat-title">{{ $t('ai_hub.chat_title') }}</div>
          <p class="chat-desc">{{ $t('ai_hub.chat_desc') }}</p>
        </div>
      </div>
      <van-field
        v-model="chatPrompt"
        type="textarea"
        rows="3"
        autosize
        maxlength="800"
        show-word-limit
        :placeholder="$t('ai_hub.chat_placeholder')"
        :disabled="creating"
        class="chat-field"
      />
      <div class="quick-row">
        <span class="quick-lab">{{ $t('ai_hub.chat_quick_title') }}</span>
        <div class="quick-chips">
          <span class="qc" @click="chatPrompt = $t('ai_hub.chat_quick_1')">{{ $t('ai_hub.chat_quick_1') }}</span>
          <span class="qc" @click="chatPrompt = $t('ai_hub.chat_quick_2')">{{ $t('ai_hub.chat_quick_2') }}</span>
          <span class="qc" @click="chatPrompt = $t('ai_hub.chat_quick_3')">{{ $t('ai_hub.chat_quick_3') }}</span>
        </div>
      </div>
      <van-button
        type="primary"
        block
        round
        class="chat-send"
        :loading="creating"
        :loading-text="$t('ai_hub.chat_sending')"
        @click="generateRecommend"
      >
        <van-icon name="cluster-o" style="margin-right: 6px;" />
        {{ $t('ai_hub.chat_send') }}
      </van-button>
      <p class="chat-hint">{{ $t('ai_hub.chat_hint') }}</p>
    </div>

    <!-- Tips -->
    <div class="ios-section">
      <div class="ios-section-head">
        <span class="ios-section-title">{{ $t('ai_hub.tips_title') }}</span>
      </div>
      <div class="tips-card">
        <div class="tip-row"><div class="bulb">1</div><span>{{ $t('ai_hub.tip_1') }}</span></div>
        <div class="tip-row"><div class="bulb">2</div><span>{{ $t('ai_hub.tip_2') }}</span></div>
        <div class="tip-row"><div class="bulb">3</div><span>{{ $t('ai_hub.tip_3') }}</span></div>
      </div>
    </div>

    <!-- History: right drawer -->
    <van-popup
      v-model:show="showHistoryDrawer"
      position="right"
      class="history-popup"
      :style="{ width: 'min(360px, 88vw)', height: '100%' }"
      teleport="body"
      round
    >
      <div class="drawer-page">
        <div class="drawer-head">
          <span class="drawer-title">{{ $t('ai_hub.drawer_history') }}</span>
          <van-icon name="cross" class="drawer-close" @click="showHistoryDrawer = false" />
        </div>
        <div v-if="loadingHistory" class="drawer-loading">
          <van-loading vertical>{{ $t('common.loading') }}</van-loading>
        </div>
        <div v-else class="drawer-body">
          <div v-if="!drawerHistory.length" class="drawer-empty">
            <van-icon name="records" />
            <span>{{ $t('ai_hub.no_recent') }}</span>
          </div>
          <div v-else class="drawer-list">
            <div
              v-for="item in drawerHistory"
              :key="item.memory_id || item.id || item.created_at"
              class="drawer-row"
              @click="openHistoryRecord(item)"
            >
              <div :class="['dr-icon', decisionClass(item.decision)]">
                <van-icon :name="decisionIcon(item.decision)" />
              </div>
              <div class="dr-main">
                <span class="dr-title">{{ item.symbol || item.input_data?.symbol || '--' }}</span>
                <span class="dr-sub">{{ formatTime(item.created_at) }}</span>
              </div>
              <span :class="['dr-badge', decisionClass(item.decision)]">{{ decisionLabel(item.decision) }}</span>
            </div>
          </div>
          <van-button block round plain class="drawer-more" @click="goFullHistory">
            {{ $t('ai_hub.history') }}
            <van-icon name="arrow" />
          </van-button>
        </div>
      </div>
    </van-popup>

    <!-- AI 推荐参数预览弹窗 -->
    <van-popup
      v-model:show="showRecommend"
      position="bottom"
      round
      teleport="body"
      :style="{ maxHeight: '82vh' }"
      class="recommend-popup"
    >
      <div v-if="recommendation" class="recommend-sheet">
        <div class="recommend-head">
          <div class="recommend-title">
            <van-icon name="star-o" />
            <span>{{ $t('bot_create.ai_recommendation') }}</span>
          </div>
          <van-icon name="cross" class="recommend-close" @click="showRecommend = false" />
        </div>
        <div class="recommend-body">
          <div class="recommend-name">
            {{ recommendation.botName || recommendation.strategyName || typeLabel(recommendation.botType) }}
          </div>
          <div class="recommend-badges">
            <span class="badge type">{{ typeLabel(recommendation.botType) }}</span>
            <span v-if="recommendation.baseConfig?.symbol" class="badge">{{ recommendation.baseConfig.symbol }}</span>
            <span v-if="recommendation.baseConfig?.timeframe" class="badge">{{ recommendation.baseConfig.timeframe }}</span>
            <span v-if="recommendation.mode === 'script'" class="badge script">{{ $t('bot_create.ai_script_title') }}</span>
          </div>
          <div v-if="recommendation.reason || recommendation.analysis" class="recommend-reason">
            <div class="rec-label">{{ $t('bot_create.ai_reason') }}</div>
            <p>{{ recommendation.reason || recommendation.analysis }}</p>
          </div>

          <div v-if="recommendation.strategyParams && Object.keys(recommendation.strategyParams).length" class="rec-block">
            <div class="rec-label">{{ $t('bot_create.strategy_params') }}</div>
            <div class="param-grid">
              <div v-for="(val, key) in recommendation.strategyParams" :key="'sp_' + key" class="param-item">
                <div class="param-key">{{ key }}</div>
                <div class="param-val">{{ val }}</div>
              </div>
            </div>
          </div>

          <div v-if="recommendation.riskConfig && Object.keys(recommendation.riskConfig).length" class="rec-block">
            <div class="rec-label">{{ $t('bot_create.risk_params') }}</div>
            <div class="param-grid">
              <div v-for="(val, key) in recommendation.riskConfig" :key="'rk_' + key" class="param-item">
                <div class="param-key">{{ key }}</div>
                <div class="param-val">{{ val }}</div>
              </div>
            </div>
          </div>

          <div v-if="recommendation.mode === 'script' && recommendation.strategy_code" class="rec-block">
            <div class="rec-label">{{ $t('bot_create.ai_script_preview') }}</div>
            <pre class="code-pre">{{ recommendation.strategy_code }}</pre>
          </div>
        </div>
        <div class="recommend-actions">
          <van-button plain round block @click="regenerateRecommend">{{ $t('bot_create.regenerate') }}</van-button>
          <van-button type="primary" round block @click="applyRecommendAndEdit">
            {{ $t('bot_create.apply_and_edit') }}
          </van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script>
import { showToast } from 'vant'
import { aiAnalysisApi, strategyApi } from '@/api'
import { useAiAnalysisStore } from '@/stores'
import { buildHistoryResultPayload } from '@/utils/aiAnalysisHistory'
import { normalizeAiBotRecommendation } from '@/views/trading/botScriptTemplates'

export default {
  name: 'AiHub',
  data() {
    return {
      drawerHistory: [],
      loadingHistory: false,
      showHistoryDrawer: false,
      chatPrompt: '',
      creating: false,
      recommendation: null,
      showRecommend: false
    }
  },
  watch: {
    showHistoryDrawer(val) {
      if (val) this.loadDrawerHistory()
    }
  },
  methods: {
    async loadDrawerHistory() {
      this.loadingHistory = true
      try {
        const res = await aiAnalysisApi.getAllHistory({ page: 1, pagesize: 30 })
        const list = res?.data?.list || res?.data?.items || []
        this.drawerHistory = Array.isArray(list) ? list : []
      } catch {
        this.drawerHistory = []
      } finally {
        this.loadingHistory = false
      }
    },
    openHistoryDrawer() {
      this.showHistoryDrawer = true
    },
    goFullHistory() {
      this.showHistoryDrawer = false
      this.$router.push('/ai-analysis/history')
    },
    openHistoryRecord(item) {
      const payload = buildHistoryResultPayload(item)
      if (!payload) return
      useAiAnalysisStore().setLastResult(payload)
      this.showHistoryDrawer = false
      this.$router.push('/ai-analysis')
    },
    async generateRecommend() {
      if (this.creating) return
      const prompt = (this.chatPrompt || '').trim()
      if (!prompt) {
        showToast({ message: this.$t('ai_hub.chat_placeholder'), type: 'fail' })
        return
      }

      this.creating = true
      this.recommendation = null
      try {
        const res = await strategyApi.aiGenerate({
          intent: 'bot_recommend',
          prompt,
          user_prompt: prompt,
          language: this.$i18n?.locale || 'zh-CN'
        })
        const body = res?.data || res
        const rec = normalizeAiBotRecommendation(body)
        if (!rec) {
          const msg = res?.msg || body?.msg
          throw new Error(msg && String(msg).toLowerCase() !== 'success' ? String(msg) : this.$t('bot_create.ai_parse_fail'))
        }
        if (!rec.baseConfig) rec.baseConfig = {}
        if (!rec.baseConfig.symbol) rec.baseConfig.symbol = 'BTC/USDT:USDT'
        this.recommendation = rec
        this.showRecommend = true
      } catch (err) {
        showToast({ message: err?.message || this.$t('bot_create.ai_fail'), type: 'fail' })
      } finally {
        this.creating = false
      }
    },
    applyRecommendAndEdit() {
      const rec = this.recommendation
      if (!rec) return
      try {
        const preset = {
          botType: rec.botType || 'grid',
          botName: rec.botName || rec.strategyName || '',
          reason: rec.reason || rec.analysis || '',
          baseConfig: rec.baseConfig || {},
          strategyParams: rec.strategyParams || {},
          riskConfig: rec.riskConfig || {}
        }
        sessionStorage.setItem('qd_ai_strategy_preset', JSON.stringify(preset))
        if (rec.mode === 'script' && rec.strategy_code) {
          sessionStorage.setItem('qd_ai_strategy_code', rec.strategy_code)
        } else {
          sessionStorage.removeItem('qd_ai_strategy_code')
        }
      } catch {
        showToast({ message: this.$t('bot_create.ai_script_storage_fail'), type: 'fail' })
        return
      }
      this.showRecommend = false
      this.$router.push({
        path: '/trading/create/manual',
        query: { fromAi: '1' }
      })
    },
    regenerateRecommend() {
      this.showRecommend = false
      this.recommendation = null
    },
    typeLabel(type) {
      const keyMap = {
        grid: 'trading.type_grid',
        martingale: 'trading.type_martingale',
        dca: 'trading.type_dca'
      }
      if (keyMap[type]) return this.$t(keyMap[type])
      if (type === 'script') return 'Script Strategy'
      return String(type || '--')
    },
    decisionLabel(decision) {
      const d = String(decision || '').toUpperCase()
      if (d === 'BUY' || d === 'LONG') return 'BUY'
      if (d === 'SELL' || d === 'SHORT') return 'SELL'
      if (d === 'HOLD') return 'HOLD'
      return d || '-'
    },
    decisionClass(decision) {
      const d = String(decision || '').toUpperCase()
      if (['BUY', 'LONG'].includes(d)) return 'up'
      if (['SELL', 'SHORT'].includes(d)) return 'down'
      return 'neutral'
    },
    decisionIcon(decision) {
      const d = String(decision || '').toUpperCase()
      if (['BUY', 'LONG'].includes(d)) return 'arrow-up'
      if (['SELL', 'SHORT'].includes(d)) return 'arrow-down'
      return 'pause-circle-o'
    },
    formatTime(val) {
      if (!val) return ''
      const d = typeof val === 'number' ? new Date(val > 1e12 ? val : val * 1000) : new Date(val)
      if (Number.isNaN(d.getTime())) return ''
      return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    }
  }
}
</script>

<style scoped>
.ai-hub-page {
  min-height: 100%;
  padding: calc(14px + var(--safe-area-top, 0px)) 16px calc(120px + var(--safe-area-bottom, 0px));
  color: var(--text);
  background: var(--bg);
}

.nav-header {
  padding: 4px 4px 12px;
}
.nav-top-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}
.nav-top-left { min-width: 0; }
.history-tab {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid var(--border-strong);
  background: var(--surface-raised);
  color: var(--text-2);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.history-tab .van-icon { font-size: 16px; color: var(--accent); }

.nav-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 11px;
  border-radius: 999px;
  background: transparent;
  border: 1px solid var(--border-strong);
  color: var(--text-2);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.sparkle {
  color: var(--accent-gold);
  font-size: 13px;
}
.nav-title {
  font-size: 30px;
  font-weight: 800;
  color: var(--text);
  letter-spacing: -0.035em;
  line-height: 1.05;
  margin: 0 0 8px;
}
.nav-desc {
  margin: 0;
  font-size: 14px;
  color: var(--text-2);
  line-height: 1.5;
  max-width: 100%;
}

/* Feature card */
.feature-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 14px;
}
.feat-card {
  position: relative;
  padding: 18px 16px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-card);
  transition: transform 0.15s;
}
.feat-card:active { transform: scale(0.98); }
.feat-card.analysis::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(280px 200px at 0% 0%, var(--accent-crimson-soft), transparent 62%);
}
.feat-body {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 12px;
}
.feat-icon {
  width: 48px; height: 48px;
  flex-shrink: 0;
  border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  font-size: 24px;
  background: var(--c-red);
  color: #ffffff;
  border: 1px solid transparent;
}
.feat-copy { flex: 1; min-width: 0; }
.feat-title {
  display: block;
  font-size: 17px;
  font-weight: 800;
  color: var(--text);
  letter-spacing: -0.01em;
  margin-bottom: 5px;
}
.feat-desc {
  margin: 0;
  font-size: 12px;
  color: var(--text-2);
  line-height: 1.5;
}
.feat-cta {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 999px;
  background: var(--c-red);
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
}

/* Chat card */
.chat-card {
  padding: 16px 14px 14px;
  margin-bottom: 20px;
}
.chat-head {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 12px;
}
.chat-head-icon {
  font-size: 28px;
  color: var(--c-indigo);
  background: var(--c-indigo-soft);
  padding: 10px;
  border-radius: 14px;
}
.chat-title {
  font-size: 16px;
  font-weight: 800;
  color: var(--text);
  letter-spacing: -0.02em;
}
.chat-desc {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--text-2);
  line-height: 1.5;
}
.chat-field {
  margin-bottom: 10px;
  border-radius: 12px;
  overflow: hidden;
  background: var(--surface-raised);
  border: 1px solid var(--border);
}
:deep(.chat-field .van-field__control) {
  min-height: 72px;
  font-size: 14px;
  line-height: 1.5;
}

.quick-row { margin-bottom: 12px; }
.quick-lab {
  display: block;
  font-size: 11px;
  color: var(--text-3);
  font-weight: 600;
  margin-bottom: 8px;
  letter-spacing: 0.04em;
}
.quick-chips { display: flex; flex-direction: column; gap: 6px; }
.qc {
  font-size: 12px;
  color: var(--text-2);
  padding: 8px 10px;
  border-radius: 10px;
  background: var(--surface-deep);
  border: 1px solid var(--hairline);
  line-height: 1.4;
  cursor: pointer;
}
.qc:active { border-color: var(--accent); }

.chat-send { height: 46px; font-weight: 700; font-size: 15px; }
.chat-hint {
  margin: 10px 0 0;
  text-align: center;
  font-size: 11px;
  color: var(--text-3);
  line-height: 1.45;
}

/* Section + tips */
.ios-section { margin-bottom: 22px; }
.ios-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px;
  margin-bottom: 10px;
}
.ios-section-title {
  font-size: 18px;
  font-weight: 800;
  color: var(--text);
  letter-spacing: -0.02em;
}
.tips-card {
  background: var(--surface-glass);
  border-radius: 16px;
  border: 1px solid var(--border);
  overflow: hidden;
  backdrop-filter: blur(22px);
  -webkit-backdrop-filter: blur(22px);
}
.tip-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 13px 14px;
  font-size: 13px;
  color: var(--text-2);
  line-height: 1.5;
  position: relative;
}
.tip-row + .tip-row::before {
  content: '';
  position: absolute;
  left: 48px; right: 0; top: 0;
  height: 1px;
  background: var(--hairline);
}
.bulb {
  width: 22px; height: 22px;
  flex-shrink: 0;
  border-radius: 7px;
  display: flex; align-items: center; justify-content: center;
  background: var(--accent-grad);
  color: var(--on-accent);
  font-size: 11px;
  font-weight: 800;
}

/* History drawer */
.history-popup :deep(.van-popup) {
  display: flex;
  flex-direction: column;
}
.drawer-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-elevated);
  padding-top: var(--safe-area-top, 0px);
}
.drawer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--hairline);
}
.drawer-title { font-size: 17px; font-weight: 800; color: var(--text); }
.drawer-close { font-size: 20px; color: var(--text-2); padding: 4px; }
.drawer-loading { flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px; }
.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px 14px calc(16px + var(--safe-area-bottom, 0px));
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.drawer-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--text-3);
  font-size: 13px;
  padding: 40px 16px;
}
.drawer-empty .van-icon { font-size: 36px; color: var(--text-4); }
.drawer-list { display: flex; flex-direction: column; gap: 8px; }
.drawer-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 12px;
  border-radius: 14px;
  background: var(--surface-raised);
  border: 1px solid var(--border);
  transition: background 0.15s;
}
.drawer-row:active { background: var(--accent-soft); }
.dr-icon {
  width: 32px; height: 32px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px;
  background: var(--surface-deep);
  color: var(--text-2);
}
.dr-icon.up { background: var(--up-soft); color: var(--up); }
.dr-icon.down { background: var(--down-soft); color: var(--down); }
.dr-icon.neutral { background: var(--surface-raised); color: var(--text-2); }
.dr-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.dr-title { font-size: 14px; font-weight: 700; color: var(--text); }
.dr-sub { font-size: 11px; color: var(--text-3); }
.dr-badge {
  flex-shrink: 0;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 800;
}
.dr-badge.up { background: var(--up-soft); color: var(--up); }
.dr-badge.down { background: var(--down-soft); color: var(--down); }
.dr-badge.neutral { background: var(--surface-deep); color: var(--text-2); }
.drawer-more { margin-top: 4px; font-weight: 600; }

/* Recommend popup */
.recommend-popup :deep(.van-popup) {
  background: var(--bg-elevated);
  display: flex;
  flex-direction: column;
}
.recommend-sheet {
  display: flex;
  flex-direction: column;
  max-height: 82vh;
}
.recommend-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--hairline);
}
.recommend-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 800;
  color: var(--text);
}
.recommend-close {
  font-size: 18px;
  color: var(--text-2);
  padding: 4px;
}
.recommend-body {
  flex: 1;
  overflow-y: auto;
  padding: 14px 16px 6px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.recommend-name {
  font-size: 18px;
  font-weight: 800;
  color: var(--text);
  line-height: 1.3;
}
.recommend-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.recommend-badges .badge {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 6px;
  background: var(--surface-deep);
  color: var(--text-2);
  font-weight: 700;
}
.recommend-badges .badge.type {
  background: var(--accent-soft, rgba(99,102,241,.12));
  color: var(--accent, #6366f1);
}
.recommend-badges .badge.script {
  background: rgba(59,130,246,.12);
  color: #2563eb;
}
.rec-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-2);
  margin-bottom: 6px;
}
.recommend-reason p {
  margin: 0;
  font-size: 13px;
  color: var(--text);
  line-height: 1.55;
}
.rec-block {
  background: var(--surface-raised);
  border-radius: 10px;
  padding: 10px 12px;
}
.param-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.param-item {
  background: var(--bg-elevated);
  border-radius: 8px;
  padding: 8px 10px;
  min-width: 0;
}
.param-key {
  font-size: 11px;
  color: var(--text-3);
  margin-bottom: 2px;
  word-break: break-all;
}
.param-val {
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
  word-break: break-all;
}
.code-pre {
  margin: 0;
  padding: 10px;
  background: var(--bg-elevated);
  border-radius: 8px;
  font-size: 11px;
  color: var(--text);
  max-height: 200px;
  overflow: auto;
  white-space: pre;
}
.recommend-actions {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 10px;
  padding: 12px 16px calc(12px + var(--safe-area-bottom, 0px));
  border-top: 1px solid var(--hairline);
  background: var(--bg-elevated);
}
</style>
