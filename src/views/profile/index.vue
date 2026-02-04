<template>
  <div class="profile-page">
    <!-- 用户卡片 -->
    <div class="user-card">
      <div class="avatar">
        <span>{{ userInfo?.username?.[0]?.toUpperCase() || 'U' }}</span>
      </div>
      <div class="info">
        <span class="name">{{ userInfo?.username || '未登录' }}</span>
        <span class="email">{{ userInfo?.email || '点击登录' }}</span>
      </div>
      <van-icon name="arrow" />
    </div>

    <!-- 功能列表 -->
    <div class="menu-group">
      <div class="menu-item" @click="$router.push('/profile/notifications')">
        <van-icon name="bell" class="icon" />
        <span class="label">消息通知</span>
        <van-badge v-if="unreadCount" :content="unreadCount" />
        <van-icon name="arrow" class="arrow" />
      </div>
      <div class="menu-item" @click="$router.push('/profile/server')">
        <van-icon name="cluster-o" class="icon" />
        <span class="label">服务器配置</span>
        <van-icon name="arrow" class="arrow" />
      </div>
    </div>

    <div class="menu-group">
      <div class="menu-item">
        <van-icon name="shield-o" class="icon" />
        <span class="label">隐私设置</span>
        <van-icon name="arrow" class="arrow" />
      </div>
      <div class="menu-item">
        <van-icon name="question-o" class="icon" />
        <span class="label">帮助与反馈</span>
        <van-icon name="arrow" class="arrow" />
      </div>
      <div class="menu-item">
        <van-icon name="info-o" class="icon" />
        <span class="label">关于</span>
        <span class="value">v1.0.0</span>
        <van-icon name="arrow" class="arrow" />
      </div>
    </div>

    <!-- 退出登录 -->
    <div class="logout-section">
      <van-button block plain type="danger" @click="handleLogout">
        退出登录
      </van-button>
    </div>
  </div>
</template>

<script>
import { showConfirmDialog, showToast } from 'vant'
import { authApi } from '@/api'
import { useUserStore } from '@/stores'

export default {
  name: 'Profile',
  
  data() {
    return {
      unreadCount: 0
    }
  },
  
  computed: {
    userStore() {
      return useUserStore()
    },
    userInfo() {
      return this.userStore.userInfo
    }
  },
  
  mounted() {
    this.loadUserInfo()
  },
  
  methods: {
    async loadUserInfo() {
      if (!this.userStore.isLoggedIn) return
      
      if (!this.userInfo) {
        try {
          const res = await authApi.getInfo()
          if (res.code === 1 && res.data) {
            this.userStore.setUserInfo(res.data)
          }
        } catch (err) {
          console.error('Load user info error:', err)
        }
      }
    },
    
    async handleLogout() {
      try {
        await showConfirmDialog({
          title: '确认退出',
          message: '确定要退出登录吗？'
        })
        
        try {
          await authApi.logout()
        } catch (e) {
          // ignore
        }
        
        this.userStore.logout()
        this.$router.replace('/login')
        
      } catch (err) {
        // user cancelled
      }
    }
  }
}
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  padding: 16px;
  padding-bottom: 100px;
}

/* 用户卡片 */
.user-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
}

.avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar span {
  font-size: 26px;
  font-weight: 700;
  color: #fff;
}

.info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info .name {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
}

.info .email {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
}

.user-card > .van-icon {
  color: rgba(255, 255, 255, 0.4);
}

/* 菜单组 */
.menu-group {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 14px;
  overflow: hidden;
  margin-bottom: 16px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item .icon {
  font-size: 20px;
  color: #667eea;
}

.menu-item .label {
  flex: 1;
  font-size: 15px;
  color: #fff;
}

.menu-item .value {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  margin-right: 4px;
}

.menu-item .arrow {
  color: rgba(255, 255, 255, 0.3);
}

/* 退出登录 */
.logout-section {
  margin-top: 32px;
}

.logout-section :deep(.van-button) {
  border-radius: 12px;
  height: 48px;
}
</style>
