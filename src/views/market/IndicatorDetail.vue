<template>
  <div class="detail-page">
    <van-nav-bar
      :title="indicator?.name || '指标详情'"
      left-arrow
      @click-left="$router.back()"
      :border="false"
    />
    
    <div v-if="indicator" class="content">
      <!-- 基本信息 -->
      <div class="info-card">
        <div class="header">
          <span class="name">{{ indicator.name }}</span>
          <van-tag v-if="indicator.is_free" type="success">免费</van-tag>
          <span v-else class="price">¥{{ indicator.price }}</span>
        </div>
        <p class="description">{{ indicator.description || '暂无描述' }}</p>
        <div class="meta">
          <span>作者: {{ indicator.author }}</span>
          <span>版本: {{ indicator.version || '1.0.0' }}</span>
        </div>
      </div>
      
      <!-- 统计数据 -->
      <div class="stats-card">
        <div class="stat-item">
          <span class="value">⭐ {{ indicator.rating?.toFixed(1) || '-' }}</span>
          <span class="label">评分</span>
        </div>
        <div class="stat-item">
          <span class="value">{{ indicator.downloads || 0 }}</span>
          <span class="label">下载</span>
        </div>
        <div class="stat-item">
          <span class="value">{{ indicator.reviews_count || 0 }}</span>
          <span class="label">评价</span>
        </div>
      </div>
      
      <!-- 操作按钮 -->
      <div class="actions">
        <van-button
          v-if="indicator.is_purchased || indicator.is_free"
          type="success"
          block
          @click="useIndicator"
        >
          使用指标
        </van-button>
        <van-button
          v-else
          type="primary"
          block
          :loading="purchasing"
          @click="purchaseIndicator"
        >
          购买 ¥{{ indicator.price }}
        </van-button>
      </div>
    </div>
    
    <van-loading v-if="loading" class="page-loading" vertical>加载中...</van-loading>
  </div>
</template>

<script>
import { showToast } from 'vant'
import { communityApi } from '@/api'

export default {
  name: 'IndicatorDetail',
  
  data() {
    return {
      indicatorId: null,
      indicator: null,
      loading: false,
      purchasing: false
    }
  },
  
  mounted() {
    this.indicatorId = this.$route.params.id
    this.loadDetail()
  },
  
  methods: {
    async loadDetail() {
      this.loading = true
      try {
        const res = await communityApi.getDetail(this.indicatorId)
        if (res.code === 1 && res.data) {
          this.indicator = res.data
        }
      } catch (err) {
        console.error('Load detail error:', err)
      } finally {
        this.loading = false
      }
    },
    
    async purchaseIndicator() {
      this.purchasing = true
      try {
        const res = await communityApi.purchase(this.indicatorId)
        if (res.code === 1) {
          showToast({ message: '购买成功', type: 'success' })
          this.indicator.is_purchased = true
        } else {
          showToast({ message: res.msg || '购买失败', type: 'fail' })
        }
      } catch (err) {
        showToast({ message: '购买失败', type: 'fail' })
      } finally {
        this.purchasing = false
      }
    },
    
    useIndicator() {
      this.$router.push('/trading/create')
    }
  }
}
</script>

<style scoped>
.detail-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
}

.detail-page :deep(.van-nav-bar) {
  background: transparent;
}

.detail-page :deep(.van-nav-bar__title),
.detail-page :deep(.van-nav-bar__arrow) {
  color: #fff;
}

.content {
  padding: 16px;
}

.info-card {
  background: rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 16px;
}

.info-card .header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.info-card .name {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  flex: 1;
}

.info-card .price {
  font-size: 16px;
  color: #ffd43b;
  font-weight: 600;
}

.description {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
  margin: 0 0 12px 0;
}

.meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.stats-card {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.stat-item .value {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
}

.stat-item .label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.actions :deep(.van-button) {
  height: 48px;
  border-radius: 12px;
}

.actions :deep(.van-button--primary) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.page-loading {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #fff;
}
</style>
