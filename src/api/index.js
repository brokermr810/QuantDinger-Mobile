import axios from 'axios'
import { showToast, showLoadingToast, closeToast } from 'vant'

// 创建 axios 实例
const http = axios.create({
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 获取基础 URL
const getBaseUrl = () => {
  const serverUrl = localStorage.getItem('serverUrl')
  if (serverUrl) {
    return serverUrl
  }
  // 开发环境使用代理
  if (import.meta.env.DEV) {
    return ''
  }
  return window.location.origin
}

// 请求拦截器
http.interceptors.request.use(
  (config) => {
    config.baseURL = getBaseUrl()
    
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
http.interceptors.response.use(
  (response) => {
    const res = response.data
    // 兼容不同的返回格式
    if (res.code === 1 || res.code === 200 || res.success) {
      return res
    }
    // 有些接口直接返回数据
    if (response.status === 200 && !res.code) {
      return { code: 1, data: res }
    }
    showToast({
      message: res.msg || res.message || '请求失败',
      type: 'fail'
    })
    return Promise.reject(new Error(res.msg || res.message || '请求失败'))
  },
  (error) => {
    let message = '网络错误'
    if (error.response) {
      switch (error.response.status) {
        case 401:
          message = '未授权，请重新登录'
          localStorage.removeItem('token')
          break
        case 403:
          message = '拒绝访问'
          break
        case 404:
          message = '请求地址不存在'
          break
        case 500:
          message = '服务器错误'
          break
        default:
          message = error.response.data?.message || error.response.data?.msg || '请求失败'
      }
    } else if (error.message.includes('timeout')) {
      message = '请求超时'
    } else if (error.message.includes('Network Error')) {
      message = '网络连接失败，请检查服务器地址'
    }
    
    showToast({ message, type: 'fail' })
    return Promise.reject(error)
  }
)

// ============ 认证相关 API ============
export const authApi = {
  // 登录
  login: (data) => http.post('/api/auth/login', data),
  
  // 获取用户信息
  getInfo: () => http.get('/api/auth/info'),
  
  // 登出
  logout: () => http.post('/api/auth/logout')
}

// ============ 自选股/市场相关 API ============
export const marketApi = {
  // 获取自选列表
  getWatchlist: () => http.get('/api/market/watchlist/get'),
  
  // 获取自选股实时价格
  getWatchlistPrices: (symbols) => http.get('/api/market/watchlist/prices', {
    params: { symbols: symbols.join(',') }
  }),
  
  // 添加自选
  addWatchlist: (data) => http.post('/api/market/watchlist/add', data),
  
  // 移除自选
  removeWatchlist: (data) => http.post('/api/market/watchlist/remove', data),
  
  // 搜索股票
  searchSymbols: (keyword, market) => http.get('/api/market/symbols/search', {
    params: { keyword, market }
  }),
  
  // 获取热门股票
  getHotSymbols: (market) => http.get('/api/market/symbols/hot', {
    params: { market }
  }),
  
  // 获取单个价格
  getPrice: (symbol, market) => http.get('/api/market/price', {
    params: { symbol, market }
  }),
  
  // 获取股票名称
  getStockName: (symbols) => http.post('/api/market/stock/name', { symbols })
}

// ============ K线数据 API ============
export const klineApi = {
  // 获取 K 线数据
  getKline: (params) => http.get('/api/kline/kline', { params }),
  
  // 获取实时行情
  getTicker: (symbol, market) => http.get('/api/kline/ticker', {
    params: { symbol, market }
  })
}

// ============ 策略相关 API ============
export const strategyApi = {
  // 获取策略列表
  getList: () => http.get('/api/strategy/strategies'),
  
  // 获取策略详情
  getDetail: (id) => http.get('/api/strategy/strategies/detail', {
    params: { strategy_id: id }
  }),
  
  // 创建策略
  create: (data) => http.post('/api/strategy/strategies/create', data),
  
  // 更新策略
  update: (data) => http.put('/api/strategy/strategies/update', data),
  
  // 删除策略
  delete: (id) => http.delete('/api/strategy/strategies/delete', {
    params: { strategy_id: id }
  }),
  
  // 启动策略
  start: (id) => http.post('/api/strategy/strategies/start', { strategy_id: id }),
  
  // 停止策略
  stop: (id) => http.post('/api/strategy/strategies/stop', { strategy_id: id }),
  
  // 获取交易记录
  getTrades: (strategyId, limit = 50) => http.get('/api/strategy/strategies/trades', {
    params: { strategy_id: strategyId, limit }
  }),
  
  // 获取持仓
  getPositions: (strategyId) => http.get('/api/strategy/strategies/positions', {
    params: { strategy_id: strategyId }
  }),
  
  // 获取净值曲线
  getEquityCurve: (strategyId) => http.get('/api/strategy/strategies/equityCurve', {
    params: { strategy_id: strategyId }
  }),
  
  // 测试连接
  testConnection: (data) => http.post('/api/strategy/strategies/test-connection', data)
}

// ============ 指标相关 API ============
export const indicatorApi = {
  // 获取指标列表（我的指标）
  getIndicators: () => http.get('/api/indicator/getIndicators'),
  
  // 获取指标参数
  getParams: (indicatorId) => http.get('/api/indicator/getIndicatorParams', {
    params: { indicator_id: indicatorId }
  }),
  
  // 保存指标
  save: (data) => http.post('/api/indicator/saveIndicator', data),
  
  // 删除指标
  delete: (id) => http.post('/api/indicator/deleteIndicator', { indicator_id: id })
}

// ============ 指标市场/社区 API ============
export const communityApi = {
  // 获取市场指标列表
  getIndicators: (params) => http.get('/api/community/indicators', { params }),
  
  // 获取指标详情
  getDetail: (id) => http.get(`/api/community/indicators/${id}`),
  
  // 购买指标
  purchase: (id) => http.post(`/api/community/indicators/${id}/purchase`),
  
  // 获取我购买的指标
  getMyPurchases: () => http.get('/api/community/my-purchases'),
  
  // 获取评论
  getComments: (indicatorId) => http.get(`/api/community/indicators/${indicatorId}/comments`),
  
  // 添加评论
  addComment: (indicatorId, data) => http.post(`/api/community/indicators/${indicatorId}/comments`, data)
}

// ============ 仪表盘/资产 API ============
export const dashboardApi = {
  // 获取仪表盘摘要（包含资产信息）
  getSummary: () => http.get('/api/dashboard/summary'),
  
  // 获取挂单
  getPendingOrders: () => http.get('/api/dashboard/pendingOrders')
}

// ============ 全球市场 API ============
export const globalMarketApi = {
  // 获取市场概览
  getOverview: () => http.get('/api/global-market/overview'),
  
  // 获取市场新闻
  getNews: (params) => http.get('/api/global-market/news', { params }),
  
  // 获取经济日历
  getCalendar: (params) => http.get('/api/global-market/calendar', { params }),
  
  // 获取市场情绪
  getSentiment: () => http.get('/api/global-market/sentiment')
}

// ============ AI 分析 API ============
export const aiApi = {
  // 快速分析
  analyze: (data) => http.post('/api/fast-analysis/analyze', data),
  
  // 获取分析历史
  getHistory: (symbol, market) => http.get('/api/fast-analysis/history', {
    params: { symbol, market }
  })
}

// ============ 用户相关 API ============
export const userApi = {
  // 获取用户信息
  getInfo: () => http.get('/api/auth/info'),
  
  // 获取通知设置
  getNotificationSettings: () => http.get('/api/user/notification-settings'),
  
  // 更新通知设置
  updateNotificationSettings: (data) => http.post('/api/user/notification-settings', data)
}

export default http
