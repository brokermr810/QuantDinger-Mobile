<template>
  <div class="login-page">
    <div class="login-header">
      <div class="logo">
        <span class="logo-icon">📊</span>
        <span class="logo-text">QuantDinger</span>
      </div>
      <p class="subtitle">量化交易助手</p>
    </div>

    <div class="login-form">
      <!-- 服务器地址 -->
      <div class="form-item">
        <div class="input-wrapper">
          <van-icon name="link-o" class="input-icon" />
          <input
            v-model="serverUrl"
            type="text"
            placeholder="服务器地址（如 http://192.168.1.100:5000）"
            class="input"
          />
        </div>
        <p class="hint">本地运行可留空（默认 localhost:5000）</p>
      </div>

      <!-- 用户名 -->
      <div class="form-item">
        <div class="input-wrapper">
          <van-icon name="user-o" class="input-icon" />
          <input
            v-model="form.username"
            type="text"
            placeholder="用户名"
            class="input"
          />
        </div>
      </div>

      <!-- 密码 -->
      <div class="form-item">
        <div class="input-wrapper">
          <van-icon name="lock" class="input-icon" />
          <input
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="密码"
            class="input"
            @keyup.enter="handleLogin"
          />
          <van-icon
            :name="showPassword ? 'eye-o' : 'closed-eye'"
            class="eye-icon"
            @click="showPassword = !showPassword"
          />
        </div>
      </div>

      <!-- 记住我 -->
      <div class="remember-row">
        <van-checkbox v-model="rememberMe" shape="square" icon-size="16">
          记住登录状态
        </van-checkbox>
      </div>

      <!-- 登录按钮 -->
      <van-button
        type="primary"
        block
        :loading="loading"
        :disabled="!canLogin"
        class="login-btn"
        @click="handleLogin"
      >
        登录
      </van-button>
    </div>

    <!-- 底部提示 -->
    <div class="footer">
      <p>确保后端服务已启动</p>
    </div>
  </div>
</template>

<script>
import { showToast } from 'vant'
import { authApi } from '@/api'
import { useUserStore, useSettingsStore } from '@/stores'

export default {
  name: 'Login',
  
  data() {
    return {
      serverUrl: localStorage.getItem('serverUrl') || '',
      form: {
        username: '',
        password: ''
      },
      showPassword: false,
      rememberMe: true,
      loading: false
    }
  },
  
  computed: {
    canLogin() {
      return this.form.username.trim() && this.form.password.trim()
    }
  },
  
  methods: {
    async handleLogin() {
      if (this.loading || !this.canLogin) return
      
      // 保存服务器地址
      const settingsStore = useSettingsStore()
      settingsStore.setServerUrl(this.serverUrl.trim())
      
      this.loading = true
      
      try {
        const res = await authApi.login({
          username: this.form.username.trim(),
          password: this.form.password
        })
        
        if (res.code === 1 && res.data?.token) {
          const userStore = useUserStore()
          userStore.setToken(res.data.token)
          
          // 获取用户信息
          try {
            const infoRes = await authApi.getInfo()
            if (infoRes.code === 1 && infoRes.data) {
              userStore.setUserInfo(infoRes.data)
            }
          } catch (e) {
            console.warn('Failed to get user info:', e)
          }
          
          showToast({ message: '登录成功', type: 'success' })
          
          // 跳转
          const redirect = this.$route.query.redirect || '/home'
          this.$router.replace(redirect)
        } else {
          showToast({ message: res.msg || '登录失败', type: 'fail' })
        }
      } catch (err) {
        console.error('Login error:', err)
        showToast({ message: err.message || '登录失败，请检查服务器地址', type: 'fail' })
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  padding: 60px 24px 40px;
  display: flex;
  flex-direction: column;
}

.login-header {
  text-align: center;
  margin-bottom: 48px;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 12px;
}

.logo-icon {
  font-size: 48px;
}

.logo-text {
  font-size: 32px;
  font-weight: 700;
  color: #fff;
  letter-spacing: -1px;
}

.subtitle {
  color: rgba(255, 255, 255, 0.6);
  font-size: 15px;
}

.login-form {
  flex: 1;
}

.form-item {
  margin-bottom: 20px;
}

.input-wrapper {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 0 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s;
}

.input-wrapper:focus-within {
  border-color: #667eea;
  background: rgba(255, 255, 255, 0.1);
}

.input-icon {
  color: rgba(255, 255, 255, 0.5);
  font-size: 20px;
  margin-right: 12px;
}

.input {
  flex: 1;
  height: 50px;
  border: none;
  background: transparent;
  color: #fff;
  font-size: 16px;
  outline: none;
}

.input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.eye-icon {
  color: rgba(255, 255, 255, 0.5);
  font-size: 20px;
  padding: 8px;
  margin-right: -8px;
}

.hint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 8px;
  padding-left: 4px;
}

.remember-row {
  margin-bottom: 24px;
}

.remember-row :deep(.van-checkbox__label) {
  color: rgba(255, 255, 255, 0.7);
}

.login-btn {
  height: 50px;
  border-radius: 12px;
  font-size: 17px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.login-btn:disabled {
  opacity: 0.5;
}

.footer {
  text-align: center;
  margin-top: 40px;
}

.footer p {
  color: rgba(255, 255, 255, 0.4);
  font-size: 13px;
}
</style>
