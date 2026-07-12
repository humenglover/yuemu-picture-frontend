<template>
  <div id="LoginRecordManagePage">
    <div class="page-header">
      <div class="header-content">
        <button class="back-btn" @click="$router.back()">
          <i class="fas fa-chevron-left"></i>
        </button>
        <h1 class="page-title">{{ $t('pages.loginRecordManagePage.title') }}</h1>
        <div class="header-right">
        </div>
      </div>
    </div>

    <div class="page-container">
      <div class="compact-stats">
        <div class="stat-item">
          <span class="stat-num">{{ totalRecords }}</span>
          <span class="stat-desc">{{ $t('pages.loginRecordManagePage.totalRecords') }}</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item safe">
          <span class="stat-num">{{ successRecords }}</span>
          <span class="stat-desc">{{ $t('pages.loginRecordManagePage.secureLogin') }}</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item risk">
          <span class="stat-num">{{ riskRecords }}</span>
          <span class="stat-desc">{{ $t('pages.loginRecordManagePage.riskBlock') }}</span>
        </div>
      </div>

      <div class="filter-tabs">
        <div
          class="filter-tab"
          :class="{ active: currentTab === 'all' }"
          @click="switchTab('all')"
        >
                {{ $t('pages.loginRecordManagePage.allRecords') }}
        </div>
        <div
          class="filter-tab"
          :class="{ active: currentTab === 'risk' }"
          @click="switchTab('risk')"
        >
                {{ $t('pages.loginRecordManagePage.riskOnly') }}
        </div>
        <div
          class="filter-tab"
          :class="{ active: currentTab === 'mobile' }"
          @click="switchTab('mobile')"
        >
                {{ $t('pages.loginRecordManagePage.mobileDevice') }}
        </div>
      </div>

      <div class="records-list" v-if="!loading && records.length > 0">
        <div
          class="record-item-row"
          v-for="record in records"
          :key="record.id"
        >
          <div class="device-icon-wrap" :class="getDeviceTypeClass(record.deviceType)">
            <i :class="getDeviceIcon(record.deviceType)"></i>
          </div>

          <div class="record-main-info">
            <div class="primary-row">
              <span class="device-name">{{ record.osType || $t('pages.loginRecordManagePage.unknownOS') }} · {{ record.browserType || $t('pages.loginRecordManagePage.unknownApp') }}</span>
              <span class="status-dot" :class="getStatusClass(record.loginStatus, record.riskLevel)">
                {{ getStatusText(record.loginStatus, record.riskLevel) }}
              </span>
            </div>
            <div class="secondary-row">
              <span>{{ formatTime(record.loginTime) }}</span>
              <span class="dot-separator">·</span>
              <span>{{ record.loginLocation || $t('pages.loginRecordManagePage.unknownLocation') }}</span>
              <span class="dot-separator">·</span>
              <span class="ip-text">{{ record.loginIp }}</span>
            </div>
            <div class="risk-row" v-if="record.riskReason && record.riskLevel > 0">
              <i class="fas fa-exclamation-triangle"></i> {{ record.riskReason }}
            </div>
          </div>

          <div class="record-action">
            <span class="current-badge" v-if="record.isCurrentDevice">{{ $t('pages.loginRecordManagePage.currentDevice') }}</span>
          </div>
        </div>
      </div>

      <div class="empty-state" v-if="!loading && records.length === 0">
        <div class="empty-icon-wrap">
          <i class="fas fa-shield-alt"></i>
        </div>
        <p>{{ $t('pages.loginRecordManagePage.emptyDesc') }}</p>
      </div>

      <div class="loading-state" v-if="loading">
        <a-spin size="large" />
      </div>

      <div class="load-more-wrapper" v-if="!loading && records.length > 0">
        <div class="load-more-indicator" v-if="loadingMore">
          <a-spin size="small" />
          <span>{{ $t('pages.loginRecordManagePage.syncing') }}</span>
        </div>
        <div class="no-more-data" v-else-if="!hasMore">
          <span>{{ $t('pages.loginRecordManagePage.endOfList') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

import { ref, onMounted, computed, onBeforeUnmount } from 'vue'
import { message } from 'ant-design-vue'
import { listMyLoginRecordByPageUsingPost } from '@/api/userLoginRecordController'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import type { UserLoginRecordVO } from '@/api/API'

const loginUserStore = useLoginUserStore()

const records = ref<UserLoginRecordVO[]>([])
const loading = ref(false)
const loadingMore = ref(false)
const currentPage = ref(1)
const pageSize = ref(15) // 列表变紧凑了，一页可以多请求一点
const total = ref(0)
const hasMore = ref(true)

// 标签页筛选逻辑
const currentTab = ref('all') // 'all', 'risk', 'mobile'

const totalRecords = computed(() => total.value)
const successRecords = computed(() => records.value.filter(r => r.loginStatus === 1).length)
const riskRecords = computed(() => records.value.filter(r => r.riskLevel && r.riskLevel > 0).length)

const switchTab = (tab: string) => {
  if (currentTab.value === tab) return
  currentTab.value = tab
  currentPage.value = 1
  loadRecords(false)
}

const loadRecords = async (isLoadMore = false) => {
  if (!loginUserStore.loginUser.id) return

  if (isLoadMore) {
    if (!hasMore.value) return
    loadingMore.value = true
  } else {
    loading.value = true
    currentPage.value = 1
    records.value = []
    hasMore.value = true
  }

  try {
    const params: any = {
      userId: loginUserStore.loginUser.id,
      current: currentPage.value,
      pageSize: pageSize.value,
      sortField: 'loginTime',
      sortOrder: 'descend'
    }

    // 根据 Tab 转换参数
    if (currentTab.value === 'risk') {
      params.riskLevel = 1 // 假设后端支持 >= 1 的查询，或者你需要和后端对齐
    } else if (currentTab.value === 'mobile') {
      params.deviceType = 'Mobile'
    }

    const res = await listMyLoginRecordByPageUsingPost(params)
    if (res.data.code === 0 && res.data.data) {
      const newRecords = res.data.data.records || []
      if (isLoadMore) {
        records.value = [...records.value, ...newRecords]
      } else {
        records.value = newRecords
      }
      total.value = Number(res.data.data.total) || 0

      if (newRecords.length === 0 || records.value.length >= total.value) {
        hasMore.value = false
      }
    } else {
      message.error(t('pages.loginRecordManagePage.errLoad') + res.data.message)
    }
  } catch (error) {
    message.error(t('pages.loginRecordManagePage.errNetwork'))
  } finally {
    loading.value = false
    setTimeout(() => {
      loadingMore.value = false
    }, 100)
  }
}

const handleScroll = () => {
  if (loading.value || loadingMore.value || !hasMore.value) return
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const windowHeight = window.innerHeight
  const documentHeight = document.documentElement.scrollHeight

  if (scrollTop + windowHeight >= documentHeight - 150) {
    loadingMore.value = true
    currentPage.value++
    loadRecords(true)
  }
}

const formatTime = (time: string) => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60000) return t('pages.loginRecordManagePage.justNow')
  if (diff < 3600000) return t('pages.loginRecordManagePage.minsAgo').replace('{num}', String(Math.floor(diff / 60000)))
  if (diff < 86400000) return t('pages.loginRecordManagePage.hoursAgo').replace('{num}', String(Math.floor(diff / 3600000)))
  if (diff < 604800000) return t('pages.loginRecordManagePage.daysAgo').replace('{num}', String(Math.floor(diff / 86400000)))

  // 今年的只显示月日
  if (date.getFullYear() === now.getFullYear()) {
    return `${date.getMonth() + 1}-${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}

// 提取设备图标
const getDeviceIcon = (deviceType: string) => {
  const dt = (deviceType || '').toLowerCase()
  if (dt.includes('mobile') || dt.includes('phone')) return 'fas fa-mobile-alt'
  if (dt.includes('tablet') || dt.includes('pad')) return 'fas fa-tablet-alt'
  return 'fas fa-laptop'
}

const getDeviceTypeClass = (deviceType: string) => {
  const dt = (deviceType || '').toLowerCase()
  if (dt.includes('mobile') || dt.includes('phone')) return 'bg-mobile'
  return 'bg-pc'
}

// 状态文字与颜色映射
const getStatusClass = (status: number, riskLevel: number) => {
  if (status === 0) return 'status-fail'
  if (riskLevel >= 2) return 'status-danger'
  if (riskLevel === 1) return 'status-warning'
  return 'status-success'
}

const getStatusText = (status: number, riskLevel: number) => {
  if (status === 0) return t('pages.loginRecordManagePage.statusFailed')
  if (riskLevel >= 2) return t('pages.loginRecordManagePage.riskHigh')
  if (riskLevel === 1) return t('pages.loginRecordManagePage.riskSuspicious')
  return t('pages.loginRecordManagePage.statusNormal')
}

onMounted(() => {
  loadRecords()
  window.addEventListener('scroll', handleScroll)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
/* 基础变量与容器 */
#LoginRecordManagePage {
  min-height: 92vh;
  background-color: var(--post-background, #f5f5f7); /* 偏苹果的灰底 */
  padding-bottom: env(safe-area-inset-bottom);
}

.page-container {
  max-width: 768px; /* PC端保持核心区域居中，限制宽度 */
  margin: 0 auto;
  padding: 16px;
}

/* 导航栏：Apple 毛玻璃风格 */
.page-header {
  position: sticky;
  top: 0;
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.05);
}

@media (prefers-color-scheme: dark) { .page-header {
  background: rgba(30, 30, 30, 0.7);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.05);
} }

.header-content {
  max-width: 768px;
  margin: 0 auto;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
}

.back-btn {
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  font-size: 18px;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: flex-start;
  cursor: pointer;
}

.page-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  flex: 1;
  text-align: center;
  transform: translateX(-16px); /* 抵消左侧按钮宽度实现绝对居中 */
}

/* 紧凑状态栏 */
.compact-stats {
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: var(--card-background, #ffffff);
  border-radius: 16px;
  padding: 16px 0;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.stat-num {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.stat-item.safe .stat-num { color: #34c759; }
.stat-item.risk .stat-num { color: #ff3b30; }

.stat-desc {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.stat-divider {
  width: 1px;
  height: 24px;
  background: var(--border-color, #ebebeb);
}

/* 药丸型标签切换 */
.filter-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  overflow-x: auto;
  scrollbar-width: none; /* Firefox */
  -webkit-overflow-scrolling: touch;
}
.filter-tabs::-webkit-scrollbar {
  display: none; /* Chrome Safari */
}

.filter-tab {
  padding: 6px 16px;
  background: var(--card-background, #ffffff);
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  white-space: nowrap;
  border: 1px solid transparent;
  transition: all 0.25s ease;
}

.filter-tab.active {
  background: var(--text-primary);
  color: var(--post-background);
}

/* QQ/微信流式列表 */
.records-list {
  background: var(--card-background, #ffffff);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

.record-item-row {
  display: flex;
  padding: 16px;
  position: relative;
  transition: background-color 0.2s;
  cursor: pointer;
}

.record-item-row:active {
  background-color: var(--hover-background, #f9f9f9);
}

/* iOS 分割线样式（左侧留白） */
.record-item-row:not(:last-child)::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 64px; /* 图标区域宽度 + padding */
  right: 0;
  height: 1px;
  background: var(--border-color, #f0f0f0);
}

.device-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
  margin-right: 12px;
}

.bg-pc { background: rgba(0, 122, 255, 0.1); color: #007aff; }
.bg-mobile { background: rgba(52, 199, 89, 0.1); color: #34c759; }

.record-main-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.primary-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.device-name {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-dot {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
  line-height: 1;
}

.status-success { color: #8e8e93; background: rgba(142,142,147,0.1); }
.status-warning { color: #ff9500; background: rgba(255,149,0,0.1); }
.status-danger  { color: #ff3b30; background: rgba(255,59,48,0.1); }
.status-fail    { color: #ff3b30; background: rgba(255,59,48,0.1); text-decoration: line-through; }

.secondary-row {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dot-separator {
  margin: 0 4px;
  opacity: 0.5;
}

.ip-text {
  font-family: monospace;
}

.risk-row {
  margin-top: 6px;
  font-size: 12px;
  color: #ff3b30;
  display: flex;
  align-items: center;
  gap: 4px;
}

.record-action {
  margin-left: 12px;
  display: flex;
  align-items: center;
}

.current-badge {
  font-size: 12px;
  color: #34c759;
  font-weight: 500;
}

/* 空状态与加载 */
.empty-state {
  padding: 60px 0;
  text-align: center;
  color: var(--text-secondary);
}

.empty-icon-wrap {
  width: 64px;
  height: 64px;
  background: var(--card-background);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  font-size: 24px;
  color: #c7c7cc;
}

.loading-state {
  padding: 40px 0;
  text-align: center;
}

.load-more-wrapper {
  padding: 24px 0;
  text-align: center;
  font-size: 13px;
  color: var(--text-secondary);
}

.load-more-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

/* 适配暗黑模式 */
@media (prefers-color-scheme: dark) { .records-list,
@media (prefers-color-scheme: dark) { .compact-stats,
@media (prefers-color-scheme: dark) { .filter-tab {
 background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: none; 
} } } }

@media (prefers-color-scheme: dark) { .filter-tab.active {
  background: var(--text-primary);
  color: var(--bg-primary, #000);
} }

@media (prefers-color-scheme: dark) { .record-item-row:not(:last-child)::after {
  background: rgba(255, 255, 255, 0.08);
} }

@media (prefers-color-scheme: dark) { .record-item-row:active {
  background: rgba(255, 255, 255, 0.08);
} }
</style>
