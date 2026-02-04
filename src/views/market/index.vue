<template>
  <div class="market-page">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <van-search
        v-model="searchText"
        placeholder="搜索指标"
        shape="round"
        background="transparent"
      />
    </div>

    <!-- 分类标签 -->
    <div class="category-tabs">
      <span
        v-for="cat in categories"
        :key="cat.value"
        :class="{ active: currentCategory === cat.value }"
        @click="currentCategory = cat.value"
      >
        {{ cat.label }}
      </span>
    </div>

    <!-- 指标列表 -->
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <div class="indicator-list">
        <div
          v-for="indicator in filteredIndicators"
          :key="indicator.id"
          class="indicator-card"
          @click="goToDetail(indicator)"
        >
          <div class="card-header">
            <span class="name">{{ indicator.name }}</span>
            <van-tag v-if="indicator.is_free" type="success" size="small">免费</van-tag>
            <span v-else class="price">¥{{ indicator.price }}</span>
          </div>
          <p class="description">{{ indicator.description || '暂无描述' }}</p>
          <div class="card-footer">
            <div class="stats">
              <span>⭐ {{ indicator.rating?.toFixed(1) || '-' }}</span>
              <span>📥 {{ indicator.downloads || 0 }}</span>
            </div>
            <span class="author">{{ indicator.author }}</span>
          </div>
        </div>

        <van-empty v-if="filteredIndicators.length === 0 && !loading" description="暂无指标" />
      </div>
    </van-pull-refresh>

    <van-loading v-if="loading" class="page-loading" vertical>加载中...</van-loading>
  </div>
</template>

<script>
import { communityApi } from '@/api'

export default {
  name: 'IndicatorMarket',
  
  data() {
    return {
      searchText: '',
      currentCategory: 'all',
      loading: false,
      refreshing: false,
      indicators: [],
      categories: [
        { label: '全部', value: 'all' },
        { label: '趋势', value: 'trend' },
        { label: '震荡', value: 'oscillator' },
        { label: '成交量', value: 'volume' },
        { label: '自定义', value: 'custom' }
      ]
    }
  },
  
  computed: {
    filteredIndicators() {
      let list = this.indicators
      
      if (this.currentCategory !== 'all') {
        list = list.filter(i => i.category === this.currentCategory)
      }
      
      if (this.searchText.trim()) {
        const keyword = this.searchText.trim().toLowerCase()
        list = list.filter(i => 
          i.name?.toLowerCase().includes(keyword) ||
          i.description?.toLowerCase().includes(keyword)
        )
      }
      
      return list
    }
  },
  
  mounted() {
    this.loadIndicators()
  },
  
  methods: {
    async loadIndicators() {
      this.loading = true
      try {
        const res = await communityApi.getIndicators({})
        if (res.code === 1 && res.data) {
          this.indicators = res.data.items || res.data || []
        }
      } catch (err) {
        console.error('Load indicators error:', err)
      } finally {
        this.loading = false
      }
    },
    
    async onRefresh() {
      await this.loadIndicators()
      this.refreshing = false
    },
    
    goToDetail(indicator) {
      this.$router.push(`/market/indicator/${indicator.id}`)
    }
  }
}
</script>

<style scoped>
.market-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  padding-bottom: 100px;
}

.search-bar {
  padding: 8px 16px;
}

.search-bar :deep(.van-search__content) {
  background: rgba(255, 255, 255, 0.08);
}

.search-bar :deep(.van-field__control) {
  color: #fff;
}

.category-tabs {
  display: flex;
  gap: 8px;
  padding: 0 16px 12px;
  overflow-x: auto;
}

.category-tabs span {
  padding: 6px 14px;
  border-radius: 16px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.05);
  white-space: nowrap;
  transition: all 0.3s;
}

.category-tabs span.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.indicator-list {
  padding: 0 16px;
}

.indicator-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 12px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.card-header .name {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  flex: 1;
}

.card-header .price {
  font-size: 14px;
  color: #ffd43b;
  font-weight: 600;
}

.description {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.5;
  margin: 0 0 12px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.author {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

.page-loading {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #fff;
}
</style>
