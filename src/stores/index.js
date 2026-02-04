import { createPinia, defineStore } from 'pinia'

export const pinia = createPinia()

// 用户状态
export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userInfo: null,
    isLoggedIn: !!localStorage.getItem('token')
  }),
  
  actions: {
    setToken(token) {
      this.token = token
      this.isLoggedIn = !!token
      if (token) {
        localStorage.setItem('token', token)
      } else {
        localStorage.removeItem('token')
      }
    },
    
    setUserInfo(info) {
      this.userInfo = info
    },
    
    logout() {
      this.token = ''
      this.userInfo = null
      this.isLoggedIn = false
      localStorage.removeItem('token')
    }
  }
})

// 策略状态
export const useStrategyStore = defineStore('strategy', {
  state: () => ({
    strategies: [],
    loading: false
  }),
  
  getters: {
    // 按状态统计
    statusCounts: (state) => {
      const counts = { running: 0, stopped: 0, error: 0, total: state.strategies.length }
      state.strategies.forEach(s => {
        if (s.status === 'running') counts.running++
        else if (s.status === 'stopped') counts.stopped++
        else if (s.status === 'error') counts.error++
      })
      return counts
    },
    
    // 按标的分组
    groupedBySymbol: (state) => {
      const groups = {}
      state.strategies.forEach(strategy => {
        const symbol = strategy.trading_config?.symbol || 'Unknown'
        if (!groups[symbol]) {
          groups[symbol] = []
        }
        groups[symbol].push(strategy)
      })
      return groups
    }
  },
  
  actions: {
    setStrategies(list) {
      this.strategies = list
    },
    
    setLoading(val) {
      this.loading = val
    }
  }
})

// 市场/自选状态
export const useMarketStore = defineStore('market', {
  state: () => ({
    watchlist: [],
    prices: {},
    loading: false
  }),
  
  actions: {
    setWatchlist(list) {
      this.watchlist = list
    },
    
    setPrices(priceMap) {
      this.prices = { ...this.prices, ...priceMap }
    },
    
    setLoading(val) {
      this.loading = val
    }
  }
})

// 仪表盘/资产状态
export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    summary: null,
    loading: false
  }),
  
  getters: {
    // 总资产
    totalAssets: (state) => {
      if (!state.summary?.brokers) return 0
      return state.summary.brokers.reduce((sum, b) => sum + (b.total_value || 0), 0)
    }
  },
  
  actions: {
    setSummary(data) {
      this.summary = data
    },
    
    setLoading(val) {
      this.loading = val
    }
  }
})

// 设置状态
export const useSettingsStore = defineStore('settings', {
  state: () => ({
    serverUrl: localStorage.getItem('serverUrl') || '',
    theme: localStorage.getItem('theme') || 'light'
  }),
  
  actions: {
    setServerUrl(url) {
      this.serverUrl = url
      if (url) {
        localStorage.setItem('serverUrl', url)
      } else {
        localStorage.removeItem('serverUrl')
      }
    },
    
    setTheme(theme) {
      this.theme = theme
      localStorage.setItem('theme', theme)
      document.documentElement.setAttribute('data-theme', theme)
    }
  }
})

// 通知状态
export const useNotificationStore = defineStore('notification', {
  state: () => ({
    notifications: [],
    unreadCount: 0
  }),
  
  actions: {
    setNotifications(list) {
      this.notifications = list
      this.unreadCount = list.filter(n => !n.read).length
    },
    
    markAsRead(id) {
      const notification = this.notifications.find(n => n.id === id)
      if (notification && !notification.read) {
        notification.read = true
        this.unreadCount = Math.max(0, this.unreadCount - 1)
      }
    },
    
    markAllAsRead() {
      this.notifications.forEach(n => n.read = true)
      this.unreadCount = 0
    }
  }
})

export default pinia
