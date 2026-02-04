import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores'

const routes = [
  {
    path: '/',
    redirect: '/home'
  },
  // ========== 登录 ==========
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', showTabbar: false, public: true }
  },
  
  // ========== 首页 - 自选股 + 宏观数据 ==========
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/views/home/index.vue'),
    meta: { title: '首页', showTabbar: true }
  },
  {
    path: '/home/stock/:market/:symbol',
    name: 'StockDetail',
    component: () => import('@/views/home/StockDetail.vue'),
    meta: { title: '股票详情', showTabbar: false }
  },
  {
    path: '/home/macro',
    name: 'MacroData',
    component: () => import('@/views/home/MacroData.vue'),
    meta: { title: '宏观数据', showTabbar: false }
  },
  
  // ========== 交易助手 - 策略管理 ==========
  {
    path: '/trading',
    name: 'Trading',
    component: () => import('@/views/trading/index.vue'),
    meta: { title: '交易助手', showTabbar: true }
  },
  {
    path: '/trading/create',
    name: 'CreateStrategy',
    component: () => import('@/views/trading/CreateStrategy.vue'),
    meta: { title: '创建策略', showTabbar: false }
  },
  {
    path: '/trading/strategy/:id',
    name: 'StrategyDetail',
    component: () => import('@/views/trading/StrategyDetail.vue'),
    meta: { title: '策略详情', showTabbar: false }
  },
  {
    path: '/trading/records/:id',
    name: 'TradeRecords',
    component: () => import('@/views/trading/TradeRecords.vue'),
    meta: { title: '交易记录', showTabbar: false }
  },
  
  // ========== 资产监测 ==========
  {
    path: '/assets',
    name: 'Assets',
    component: () => import('@/views/assets/index.vue'),
    meta: { title: '资产监测', showTabbar: true }
  },
  {
    path: '/assets/detail/:account',
    name: 'AssetDetail',
    component: () => import('@/views/assets/AssetDetail.vue'),
    meta: { title: '账户详情', showTabbar: false }
  },
  
  // ========== 指标市场 ==========
  {
    path: '/market',
    name: 'IndicatorMarket',
    component: () => import('@/views/market/index.vue'),
    meta: { title: '指标市场', showTabbar: true }
  },
  {
    path: '/market/indicator/:id',
    name: 'IndicatorDetail',
    component: () => import('@/views/market/IndicatorDetail.vue'),
    meta: { title: '指标详情', showTabbar: false }
  },
  
  // ========== 个人中心 ==========
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/profile/index.vue'),
    meta: { title: '我的', showTabbar: true }
  },
  {
    path: '/profile/notifications',
    name: 'Notifications',
    component: () => import('@/views/profile/Notifications.vue'),
    meta: { title: '消息通知', showTabbar: false }
  },
  {
    path: '/profile/server',
    name: 'ServerConfig',
    component: () => import('@/views/profile/ServerConfig.vue'),
    meta: { title: '服务器配置', showTabbar: false }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - QuantDinger` : 'QuantDinger'
  
  // 登录校验
  const userStore = useUserStore()
  if (!to.meta.public && !userStore.isLoggedIn) {
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }
  
  next()
})

export default router
