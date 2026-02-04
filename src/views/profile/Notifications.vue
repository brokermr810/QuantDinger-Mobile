<template>
  <div class="notifications-page">
    <van-nav-bar
      title="消息通知"
      left-arrow
      @click-left="$router.back()"
      :border="false"
    />

    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <div class="notification-list">
        <div
          v-for="item in notifications"
          :key="item.id"
          :class="['notification-item', { unread: !item.read }]"
          @click="markAsRead(item)"
        >
          <div class="icon-wrapper" :class="item.type">
            <van-icon :name="getIcon(item.type)" />
          </div>
          <div class="content">
            <div class="header">
              <span class="title">{{ item.title }}</span>
              <span class="time">{{ formatTime(item.time) }}</span>
            </div>
            <p class="message">{{ item.message }}</p>
            <div v-if="item.strategy" class="meta">
              <van-tag type="primary" size="small" plain>{{ item.strategy }}</van-tag>
            </div>
          </div>
        </div>

        <van-empty v-if="notifications.length === 0 && !loading" description="暂无消息" />
      </div>
    </van-pull-refresh>

    <van-loading v-if="loading" class="page-loading" vertical>加载中...</van-loading>
  </div>
</template>

<script>
export default {
  name: 'Notifications',
  
  data() {
    return {
      loading: false,
      refreshing: false,
      notifications: []
    }
  },
  
  mounted() {
    this.loadNotifications()
  },
  
  methods: {
    async loadNotifications() {
      this.loading = true
      
      // 模拟数据
      setTimeout(() => {
        this.notifications = [
          {
            id: 1,
            type: 'signal',
            title: '交易信号',
            message: 'EURUSD 触发买入信号，建议价格: 1.0850',
            strategy: 'MA Cross Strategy',
            time: new Date(Date.now() - 1000 * 60 * 5),
            read: false
          },
          {
            id: 2,
            type: 'trade',
            title: '订单成交',
            message: 'BTCUSDT 买入订单已成交，成交价: 42350.50',
            strategy: 'RSI Strategy',
            time: new Date(Date.now() - 1000 * 60 * 30),
            read: false
          },
          {
            id: 3,
            type: 'alert',
            title: '策略异常',
            message: 'Gold Scalper 策略连接中断，请检查账户状态',
            strategy: 'Gold Scalper',
            time: new Date(Date.now() - 1000 * 60 * 60 * 2),
            read: true
          },
          {
            id: 4,
            type: 'info',
            title: '系统通知',
            message: '新版本 v2.1.0 已发布，包含多项功能优化',
            time: new Date(Date.now() - 1000 * 60 * 60 * 24),
            read: true
          }
        ]
        this.loading = false
      }, 500)
    },
    
    async onRefresh() {
      await this.loadNotifications()
      this.refreshing = false
    },
    
    getIcon(type) {
      const icons = {
        signal: 'bell',
        trade: 'exchange',
        alert: 'warning-o',
        info: 'info-o'
      }
      return icons[type] || 'info-o'
    },
    
    formatTime(time) {
      if (!time) return ''
      const d = new Date(time)
      const now = new Date()
      const diff = now - d
      
      if (diff < 1000 * 60) return '刚刚'
      if (diff < 1000 * 60 * 60) return `${Math.floor(diff / 1000 / 60)} 分钟前`
      if (diff < 1000 * 60 * 60 * 24) return `${Math.floor(diff / 1000 / 60 / 60)} 小时前`
      
      return `${d.getMonth() + 1}/${d.getDate()}`
    },
    
    markAsRead(item) {
      item.read = true
    }
  }
}
</script>

<style scoped>
.notifications-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
}

.notifications-page :deep(.van-nav-bar) {
  background: transparent;
}

.notifications-page :deep(.van-nav-bar__title),
.notifications-page :deep(.van-nav-bar__arrow) {
  color: #fff;
}

.notification-list {
  padding: 16px;
}

.notification-item {
  display: flex;
  gap: 12px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 10px;
  transition: all 0.3s;
}

.notification-item.unread {
  background: rgba(102, 126, 234, 0.1);
  border-left: 3px solid #667eea;
}

.icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.1);
}

.icon-wrapper .van-icon {
  font-size: 20px;
  color: #fff;
}

.icon-wrapper.signal {
  background: rgba(81, 207, 102, 0.2);
}

.icon-wrapper.signal .van-icon {
  color: #51cf66;
}

.icon-wrapper.trade {
  background: rgba(102, 126, 234, 0.2);
}

.icon-wrapper.trade .van-icon {
  color: #667eea;
}

.icon-wrapper.alert {
  background: rgba(255, 107, 107, 0.2);
}

.icon-wrapper.alert .van-icon {
  color: #ff6b6b;
}

.content {
  flex: 1;
  min-width: 0;
}

.content .header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.content .title {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
}

.content .time {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
}

.content .message {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.5;
  margin: 0 0 8px 0;
}

.content .meta {
  display: flex;
  gap: 8px;
}

.page-loading {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #fff;
}
</style>
