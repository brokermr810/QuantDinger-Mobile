/**
 * Build analysis result payload for the AI analysis result page from a history list item.
 * Mirrors PC viewHistoryResult: prefer raw_result (full_result), merge list metadata, fallback SL/TP.
 */

function normalizeConfidence(value) {
  const num = Number(value)
  if (!Number.isFinite(num)) return 0
  if (num > 0 && num <= 1) return Math.round(num * 100)
  return num
}

export function parseFullResult(raw) {
  if (raw == null) return null
  let obj = raw
  if (typeof obj === 'string') {
    try {
      obj = JSON.parse(obj)
    } catch {
      return null
    }
  }
  if (!obj || typeof obj !== 'object') return null
  if (
    obj.data &&
    typeof obj.data === 'object' &&
    !obj.decision &&
    (obj.data.decision || obj.data.summary || obj.data.consensus)
  ) {
    obj = obj.data
  }
  return obj
}

function isMeaningfulFullResult(full) {
  if (!full || typeof full !== 'object') return false
  if (String(full.task_status || '').toLowerCase() === 'processing') {
    return !!(full.consensus || full.detailed_analysis || (full.summary && full.summary.length > 40))
  }
  return !!(
    full.decision ||
    full.summary ||
    full.consensus ||
    full.detailed_analysis ||
    full.trading_plan ||
    full.trend_outlook
  )
}

function buildTradingPlanFallback(item, price, decision) {
  const dec = String(decision || 'HOLD').toUpperCase()
  let stopLoss = null
  let takeProfit = null
  if (price > 0) {
    if (dec === 'SELL') {
      stopLoss = price * 1.05
      takeProfit = price * 0.95
    } else if (dec === 'BUY') {
      stopLoss = price * 0.95
      takeProfit = price * 1.05
    }
  }
  const entry = price || item?.price || item?.current_price
  return {
    entry_price: entry,
    stop_loss: stopLoss ?? item?.stop_loss,
    take_profit: takeProfit ?? item?.take_profit
  }
}

/**
 * @param {object} item History row from GET /api/fast-analysis/history/all
 * @returns {object|null} Payload for useAiAnalysisStore().setLastResult()
 */
export function buildHistoryResultPayload(item) {
  if (!item || typeof item !== 'object') return null

  const full = parseFullResult(item.full_result)
  const useFull = isMeaningfulFullResult(full)
  const price =
    Number(item.price) ||
    Number(item.current_price) ||
    Number(full?.market_data?.current_price) ||
    0
  const decision = (useFull ? full.decision : item.decision) || 'HOLD'
  const tradingPlanFallback = buildTradingPlanFallback(item, price, decision)

  const fallback = {
    decision: item.decision,
    confidence: normalizeConfidence(item.confidence),
    summary: item.summary,
    market: item.market,
    symbol: item.symbol,
    timeframe: item.timeframe,
    market_data: {
      current_price: item.price || item.current_price,
      change_24h: 0
    },
    trading_plan: tradingPlanFallback,
    scores: item.scores || {},
    reasons: item.reasons || [],
    risks: item.risks || [],
    indicators: item.indicators || {},
    memory_id: item.id
  }

  if (!useFull) {
    return fallback
  }

  const risks =
    (Array.isArray(full.risks) && full.risks.length ? full.risks : null) ||
    (Array.isArray(full.risk_factors) && full.risk_factors.length ? full.risk_factors : null) ||
    fallback.risks

  const reasons =
    (Array.isArray(full.reasons) && full.reasons.length ? full.reasons : null) || fallback.reasons

  const scores =
    full.scores && Object.keys(full.scores).length ? full.scores : fallback.scores

  const indicators =
    full.indicators && Object.keys(full.indicators).length
      ? full.indicators
      : fallback.indicators

  return {
    ...full,
    memory_id: item.id ?? full.memory_id,
    market: full.market || item.market,
    symbol: full.symbol || item.symbol,
    timeframe: full.timeframe || item.timeframe,
    decision: full.decision ?? item.decision,
    confidence: normalizeConfidence(
      full.confidence != null ? full.confidence : item.confidence
    ),
    summary: full.summary ?? item.summary,
    reasons,
    scores,
    risks,
    indicators,
    market_data: full.market_data || fallback.market_data,
    trading_plan:
      full.trading_plan && Object.keys(full.trading_plan).length
        ? full.trading_plan
        : fallback.trading_plan
  }
}
