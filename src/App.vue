<template>
  <div class="app-container">
    <!-- 页面内容 -->
    <router-view v-slot="{ Component }">
      <keep-alive :include="['Home', 'Trading', 'Assets', 'IndicatorMarket', 'Profile']">
        <component :is="Component" />
      </keep-alive>
    </router-view>
    
    <!-- 底部导航栏 -->
    <van-tabbar 
      v-if="showTabbar" 
      v-model="activeTab" 
      @change="onTabChange"
      :safe-area-inset-bottom="true"
      :border="false"
    >
      <van-tabbar-item name="home" icon="wap-home-o">
        首页
      </van-tabbar-item>
      <van-tabbar-item name="trading" icon="apps-o">
        交易助手
      </van-tabbar-item>
      <van-tabbar-item name="assets" icon="balance-list-o">
        资产
      </van-tabbar-item>
      <van-tabbar-item name="market" icon="shop-o">
        指标市场
      </van-tabbar-item>
      <van-tabbar-item name="profile" icon="user-o" :badge="unreadCount > 0 ? unreadCount : ''">
        我的
      </van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useNotificationStore } from '@/stores'

const router = useRouter()
const route = useRoute()
const notificationStore = useNotificationStore()

// 当前激活的 Tab
const activeTab = ref('home')

// 未读通知数量
const unreadCount = computed(() => notificationStore.unreadCount)

// 是否显示底部导航
const showTabbar = computed(() => route.meta.showTabbar !== false)

// Tab 与路由的映射
const tabRouteMap = {
  home: '/home',
  trading: '/trading',
  assets: '/assets',
  market: '/market',
  profile: '/profile'
}

// Tab 切换
const onTabChange = (name) => {
  const path = tabRouteMap[name]
  if (path && route.path !== path) {
    router.push(path)
  }
}

// 监听路由变化，同步 Tab 状态
watch(
  () => route.path,
  (path) => {
    for (const [name, routePath] of Object.entries(tabRouteMap)) {
      if (path === routePath || path.startsWith(routePath + '/')) {
        activeTab.value = name
        break
      }
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.app-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-primary);
}

:deep(.van-tabbar) {
  background: var(--bg-secondary);
  border-top: 1px solid var(--bg-tertiary);
}

:deep(.van-tabbar-item) {
  color: var(--text-muted);
}

:deep(.van-tabbar-item--active) {
  color: var(--primary-color);
}

:deep(.van-tabbar-item__icon) {
  font-size: 22px;
}

:deep(.van-tabbar-item__text) {
  font-size: 10px;
  margin-top: 2px;
}
</style>
