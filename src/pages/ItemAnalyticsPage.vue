<template>
  <div class="yuemu-analytics-container">
    <!-- 极简毛玻璃导航头 -->
    <div class="yuemu-analytics-header">
      <button class="yuemu-icon-btn" @click="$router.back()">
        <i class="fas fa-chevron-left"></i>
      </button>
      <div class="yuemu-header-title">
        <span class="yuemu-title-main">{{ $t('pages.itemAnalyticsPage.title') }}</span>
        <span class="yuemu-title-sub">{{ typeName }} · {{ itemName }}</span>
      </div>
      <button class="yuemu-icon-btn" @click="loadData" :disabled="loading">
        <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
      </button>
    </div>

    <!-- 内容区域 -->
    <div class="yuemu-analytics-content">

      <!-- 顶置操作入口：iOS 风格列表项 -->
      <div class="yuemu-ios-cell-group" @click="openOverlay">
        <div class="yuemu-ios-cell">
          <div class="yuemu-cell-left">
            <div class="yuemu-cell-icon yuemu-bg-blue">
              <i class="fas fa-list-ul"></i>
            </div>
            <span class="yuemu-cell-text">{{ $t('pages.itemAnalyticsPage.detailedRecord') }}</span>
          </div>
          <div class="yuemu-cell-right">
            <span class="yuemu-cell-hint">{{ $t('pages.itemAnalyticsPage.viewAll') }}</span>
            <i class="fas fa-chevron-right yuemu-chevron"></i>
          </div>
        </div>
      </div>

      <!-- 数据概览 -->
      <div class="yuemu-section">
        <div class="yuemu-section-title">{{ $t('pages.itemAnalyticsPage.coreData') }}</div>
        <div class="yuemu-stats-grid">
          <div
            v-for="(stat, index) in overviewStats"
            :key="stat.key"
            class="yuemu-stat-card"
            :class="{ 'yuemu-card-large': index === 0 }"
          >
            <div class="yuemu-stat-header">
              <span class="yuemu-stat-label" :style="{ color: stat.color }">
                <i :class="stat.icon"></i> {{ stat.label }}
              </span>
            </div>
            <div class="yuemu-stat-body">
              <div class="yuemu-stat-value">{{ stat.value }}</div>
            </div>
            <div class="yuemu-stat-footer" :class="stat.change >= 0 ? 'yuemu-plus' : 'yuemu-minus'">
              <i :class="stat.change >= 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down'"></i>
              <span>{{ Math.abs(stat.change) }}{{ $t('pages.itemAnalyticsPage.compYesterday') }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 图表区域 -->
      <div class="yuemu-section">
        <div class="yuemu-section-title yuemu-flex-between">
          <span>{{ $t('pages.itemAnalyticsPage.trendAnalysis') }}</span>
          <!-- iOS 风格分段选择器 -->
          <div class="yuemu-ios-segmented">
            <a-radio-group v-model:value="trendType" size="small" class="yuemu-radio-group">
              <a-radio-button value="views">{{ $t('pages.itemAnalyticsPage.views') }}</a-radio-button>
              <a-radio-button value="likes">{{ $t('pages.itemAnalyticsPage.likes') }}</a-radio-button>
              <a-radio-button value="comments">{{ $t('pages.itemAnalyticsPage.comments') }}</a-radio-button>
            </a-radio-group>
          </div>
        </div>

        <div class="yuemu-charts-layout">
          <div class="yuemu-chart-card yuemu-chart-card-main">
            <v-chart class="yuemu-chart" :option="trendOption" autoresize />
          </div>
          <div class="yuemu-chart-card yuemu-chart-card-side">
            <div class="yuemu-chart-inner-title">{{ $t('pages.itemAnalyticsPage.evaluationRadar') }}</div>
            <v-chart class="yuemu-chart" :option="radarOption" autoresize />
          </div>
        </div>
      </div>

    </div>

    <!-- 互动记录：PC端弹框 / 移动端抽屉 -->
    <component
      :is="isMobile ? 'a-drawer' : 'a-modal'"
      v-model:open="overlayVisible"
      :placement="isMobile ? 'bottom' : undefined"
      :height="isMobile ? '85vh' : undefined"
      :width="isMobile ? '100%' : '500px'"
      :centered="!isMobile"
      :title="$t('pages.itemAnalyticsPage.interactionRecord')"
      :footer="null"
      :destroyOnClose="true"
      :bodyStyle="{ padding: '0' }"
      class="yuemu-dynamic-overlay"
      :class="{ 'yuemu-is-mobile': isMobile }"
    >
      <!-- 统一内部容器，通过此类名控制内部 Padding，取代 Drawer 默认边距 -->
      <div class="yuemu-overlay-container">
        <!-- 弹窗内的分类 Tabs -->
        <div class="yuemu-ios-tabs">
          <div
            v-for="tab in interactionTabs"
            :key="tab.key"
            class="yuemu-tab-item"
            :class="{ active: currentTab === tab.key }"
            @click="handleTabChange(tab.key)"
          >
            {{ tab.label }}
          </div>
        </div>

        <div class="yuemu-interaction-list">
          <div v-for="item in interactionList" :key="item.id || Math.random()" class="yuemu-list-item">
            <a-avatar :src="item.user?.userAvatar" :size="isMobile ? 36 : 40" class="yuemu-avatar" />
            <div class="yuemu-item-main">
              <div class="yuemu-item-top">
                <span class="yuemu-username">{{ item.user?.userName }}</span>
                <span class="yuemu-time">{{ formatTime(item.interactionTime) }}</span>
              </div>
              <div class="yuemu-item-bottom">
                <span v-if="item.type === 'comment'" class="yuemu-comment">{{ $t('pages.itemAnalyticsPage.replyPrefix') }}{{ item.extra }}</span>
                <span v-else class="yuemu-action-text">{{ getActionText(item.type) }}{{ $t('pages.itemAnalyticsPage.actionSuffix') }}</span>
              </div>
            </div>
          </div>

          <div class="yuemu-load-more">
            <button
              v-if="interactionList.length < total && total > 0"
              class="yuemu-more-btn"
              @click="loadMore"
              :disabled="listLoading"
            >
              <i v-if="listLoading" class="fas fa-spinner fa-spin"></i>
              {{ listLoading ? $t('pages.itemAnalyticsPage.loading') : $t('pages.itemAnalyticsPage.loadMore') }}
            </button>
            <span v-else-if="interactionList.length >= total && total > 0" class="yuemu-hint-text">
              {{ $t('pages.itemAnalyticsPage.noMore') }}
            </span>
            <span v-if="interactionList.length === 0 && !listLoading" class="yuemu-hint-text yuemu-empty">
              {{ $t('pages.itemAnalyticsPage.noData') }}
            </span>
          </div>
        </div>
      </div>
    </component>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, RadarChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, GridComponent, PolarComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { getPictureAnalyticsUsingGet, getPostAnalyticsUsingGet, getInteractionListUsingGet } from '@/api/itemAnalyticsController'
import dayjs from 'dayjs'

const { t } = useI18n();

use([CanvasRenderer, LineChart, RadarChart, TitleComponent, TooltipComponent, GridComponent, PolarComponent])

const route = useRoute()
const router = useRouter()
const targetId = route.params.id as string
const targetType = route.params.type === 'picture' ? 1 : 2
const typeName = computed(() => targetType === 1 ? t('pages.itemAnalyticsPage.picture') : t('pages.itemAnalyticsPage.post'))

const loading = ref(false)
const analyticsData = ref<any>(null)
const itemName = ref(t('pages.itemAnalyticsPage.loading'))

const PRIMARY_BLUE = '#007AFF'
const isMobile = ref(window.innerWidth <= 768)
const overlayVisible = ref(false)

const trendType = ref('views')
const currentTab = ref('like')
const listLoading = ref(false)
const interactionList = ref<any[]>([])
const total = ref(0)
const current = ref(1)
const pageSize = ref(15)

const interactionTabs = [
  { key: 'like', label: t('pages.itemAnalyticsPage.filterLabels.like') },
  { key: 'comment', label: t('pages.itemAnalyticsPage.filterLabels.comment') },
  { key: 'favorite', label: t('pages.itemAnalyticsPage.filterLabels.favorite') },
  { key: 'share', label: t('pages.itemAnalyticsPage.filterLabels.share') },
  { key: 'view', label: t('pages.itemAnalyticsPage.filterLabels.view') },
]

const handleResize = () => { isMobile.value = window.innerWidth <= 768 }

// 数据处理
const overviewStats = computed(() => {
  if (!analyticsData.value?.overview) return []
  const o = analyticsData.value.overview
  return [
    { key: 'views', label: t('pages.itemAnalyticsPage.dataLabels.views'), value: o.views, change: o.viewsChange, icon: 'fas fa-eye', color: '#007AFF' },
    { key: 'likes', label: t('pages.itemAnalyticsPage.dataLabels.likes'), value: o.likes, change: o.likesChange, icon: 'fas fa-heart', color: '#FF3B30' },
    { key: 'comments', label: t('pages.itemAnalyticsPage.dataLabels.comments'), value: o.comments, change: o.commentsChange, icon: 'fas fa-comment', color: '#5856D6' },
    { key: 'favorites', label: t('pages.itemAnalyticsPage.dataLabels.favorites'), value: o.favorites, change: o.favoritesChange, icon: 'fas fa-star', color: '#FF9500' },
    { key: 'shares', label: t('pages.itemAnalyticsPage.dataLabels.shares'), value: o.shares, change: o.sharesChange, icon: 'fas fa-share-alt', color: '#34C759' }
  ]
})

const gridLineColor = 'rgba(150, 150, 150, 0.1)'
const textColor = '#8E8E93'

const trendOption = computed(() => {
  if (!analyticsData.value?.trend) return {}
  const t = analyticsData.value.trend
  const dataMap: any = { views: t.views, likes: t.likes, shares: t.shares, comments: t.comments, favorites: t.favorites }

  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      borderColor: 'transparent',
      textStyle: { color: '#fff', fontSize: 13 },
      padding: [8, 12],
      axisPointer: { type: 'line', lineStyle: { color: PRIMARY_BLUE, width: 1, type: 'dashed' } }
    },
    grid: { top: '5%', left: '2%', right: '4%', bottom: '0%', containLabel: true },
    xAxis: {
      type: 'category', boundaryGap: false, data: t.dates,
      axisLabel: { color: textColor, fontSize: 11, margin: 12 },
      axisLine: { show: false }, axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: textColor, fontSize: 11 },
      splitLine: { lineStyle: { color: gridLineColor, type: 'solid' } }
    },
    series: [{
      type: 'line', smooth: 0.4, data: dataMap[trendType.value],
      itemStyle: { color: PRIMARY_BLUE }, showSymbol: false,
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: 'rgba(0, 122, 255, 0.15)' }, { offset: 1, color: 'rgba(0, 122, 255, 0)' }]
        }
      },
      lineStyle: { width: 3 }
    }]
  }
})

const radarOption = computed(() => {
  if (!analyticsData.value?.radar) return {}
  const r = analyticsData.value.radar
  return {
    tooltip: { backgroundColor: 'rgba(0, 0, 0, 0.75)', borderColor: 'transparent', textStyle: { color: '#fff', fontSize: 12 } },
    radar: {
      indicator: r.items.map((i: any) => ({ name: i.name, max: i.max })),
      axisName: { color: textColor, fontSize: 11 },
      splitArea: { show: false },
      splitLine: { lineStyle: { color: gridLineColor } },
      axisLine: { lineStyle: { color: gridLineColor } },
      center: ['50%', '55%'], // 避开内部标题
      radius: '70%'
    },
    series: [{
      type: 'radar',
      data: [{
        value: r.items.map((i: any) => i.value), name: t('pages.itemAnalyticsPage.compositeDimension'),
        itemStyle: { color: PRIMARY_BLUE }, areaStyle: { color: 'rgba(0, 122, 255, 0.15)' }, lineStyle: { width: 2 }
      }]
    }]
  }
})

const loadData = async () => {
  if (!targetId || targetId === 'undefined') return
  loading.value = true
  try {
    const res = targetType === 1 ? await getPictureAnalyticsUsingGet({ id: targetId as any }) : await getPostAnalyticsUsingGet({ id: targetId as any })
    if (res.data.code === 0) {
      analyticsData.value = res.data.data
      itemName.value = targetType === 1 ? t('pages.itemAnalyticsPage.picDetail') : t('pages.itemAnalyticsPage.postDetail')
    } else if (res.data.code === 40101) {
      message.error(t('pages.itemAnalyticsPage.noAuth'))
      router.back()
    }
  } finally { loading.value = false }
}

const loadInteractions = async (append = false) => {
  if (!targetId || targetId === 'undefined') return
  listLoading.value = true
  try {
    const res = await getInteractionListUsingGet({ targetId: targetId as any, targetType, type: currentTab.value, current: current.value, size: pageSize.value })
    if (res.data.code === 0) {
      const newRecords = res.data.data.records || []
      interactionList.value = append ? [...interactionList.value, ...newRecords] : newRecords
      total.value = res.data.data.total || 0
    }
  } finally { listLoading.value = false }
}

const loadMore = () => {
  if (interactionList.value.length >= total.value) return
  current.value++
  loadInteractions(true)
}

const handleTabChange = (key: string) => {
  currentTab.value = key; current.value = 1; interactionList.value = []; loadInteractions(false)
}

const openOverlay = () => {
  overlayVisible.value = true
  if (interactionList.value.length === 0) loadInteractions()
}

const getActionText = (type: string) => {
  const map: any = { like: t('pages.itemAnalyticsPage.filterLabels.like'), share: t('pages.itemAnalyticsPage.filterLabels.share'), comment: t('pages.itemAnalyticsPage.filterLabels.comment'), view: t('pages.itemAnalyticsPage.filterLabels.view'), favorite: t('pages.itemAnalyticsPage.filterLabels.favorite') }
  return map[type] || ''
}
const formatTime = (time: string) => dayjs(time).format('MM-DD HH:mm')

onMounted(() => { window.addEventListener('resize', handleResize); loadData() })
onUnmounted(() => { window.removeEventListener('resize', handleResize) })
</script>

<style scoped lang="less">
/* ================= 全局与容器 ================= */
.yuemu-analytics-container {
  min-height: 100vh;
  background: var(--background);
  color: var(--text-primary);
  padding-bottom: 60px;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
}

/* ================= 极简导航栏 ================= */
.yuemu-analytics-header {
  position: sticky;
  top: 0;
  height: 50px; /* 移动端更紧凑的头部 */
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  background: var(--ios-bg-blur, rgba(255, 255, 255, 0.8));
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-bottom: 0.5px solid var(--border-color);

  .yuemu-icon-btn {
    width: 36px; height: 36px;
    display: flex; align-items: center; justify-content: center;
    border: none; background: transparent;
    color: #007AFF; font-size: 20px;
    cursor: pointer; transition: opacity 0.2s;
    &:active { opacity: 0.5; }
    &:disabled { color: var(--text-secondary); opacity: 0.3; }
  }

  .yuemu-header-title {
    text-align: center;
    .yuemu-title-main { font-size: 16px; font-weight: 600; display: block; }
    .yuemu-title-sub { font-size: 11px; color: var(--text-secondary); font-weight: 400; margin-top: 2px; }
  }
}

.yuemu-analytics-content {
  max-width: 1000px;
  margin: 0 auto;
  padding: 16px 12px; /* 移动端紧凑外边距 */
}

/* ================= 顶置 iOS Cell ================= */
.yuemu-ios-cell-group {
  background: var(--card-background);
  border-radius: 12px;
  margin-bottom: 24px; /* 移动端间距缩小 */
  box-shadow: 0 1px 4px var(--shadow-color);
  overflow: hidden;
  cursor: pointer;
  transition: background-color 0.2s;

  &:active { background: var(--hover-background); }

  .yuemu-ios-cell {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px; /* 移动端紧凑内边距 */

    .yuemu-cell-left {
      display: flex;
      align-items: center;
      gap: 12px;
      .yuemu-cell-icon {
        width: 30px; height: 30px;
        border-radius: 8px;
        color: #fff;
        display: flex; align-items: center; justify-content: center;
        font-size: 14px;
        &.yuemu-bg-blue { background: #007AFF; }
      }
      .yuemu-cell-text { font-size: 15px; font-weight: 500; color: var(--text-primary); }
    }

    .yuemu-cell-right {
      display: flex;
      align-items: center;
      gap: 6px;
      .yuemu-cell-hint { font-size: 13px; color: var(--text-secondary); }
      .yuemu-chevron { color: #C7C7CC; font-size: 14px; }
    }
  }
}

/* ================= 标题区块 ================= */
.yuemu-section { margin-bottom: 24px; }
.yuemu-section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
  padding-left: 2px;

  &.yuemu-flex-between {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

/* ================= 数据网格 ================= */
.yuemu-stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px; /* 移动端极度紧凑的网格间隙 */

  .yuemu-stat-card {
    background: var(--card-background);
    border-radius: 16px; /* 移动端稍小一点的圆角 */
    padding: 14px 12px; /* 移动端紧凑内边距 */
    box-shadow: 0 2px 8px var(--shadow-color);
    border: 0.5px solid var(--border-color);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 8px;
    min-width: 0;

    /* 移动端第一张卡片横跨 2 列 */
    &.yuemu-card-large {
      grid-column: span 2;
      .yuemu-stat-value { font-size: 32px; } /* 防止移动端字号过大折行 */
    }

    .yuemu-stat-header {
      .yuemu-stat-label { font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 6px; white-space: nowrap; }
    }

    .yuemu-stat-body {
      .yuemu-stat-value { font-size: 24px; font-weight: 700; color: var(--text-primary); line-height: 1; }
    }

    .yuemu-stat-footer {
      font-size: 11px; font-weight: 500;
      display: flex; align-items: center; gap: 4px;
      white-space: nowrap;
      &.yuemu-plus { color: #34C759; }
      &.yuemu-minus { color: #FF3B30; }
      span { color: var(--text-secondary); font-weight: 400; }
    }
  }
}

/* ================= 图表布局 ================= */
.yuemu-charts-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px; /* 移动端紧凑间距 */

  .yuemu-chart-card {
    background: var(--card-background);
    border-radius: 16px;
    padding: 16px 12px 12px; /* 紧凑内边距 */
    box-shadow: 0 2px 8px var(--shadow-color);
    border: 0.5px solid var(--border-color);
    height: 250px; /* 移动端图表高度压低，一屏容纳更多 */
    position: relative;
    min-width: 0;
    overflow: hidden;

    .yuemu-chart { width: 100%; height: 100%; }

    .yuemu-chart-inner-title {
      position: absolute;
      top: 16px; left: 16px;
      font-size: 14px; font-weight: 600; color: var(--text-primary);
      z-index: 10;
    }
  }
}

/* ================= 抽屉 / 弹框内容 ================= */
.yuemu-overlay-container {
  display: flex; flex-direction: column; height: 100%;
  background: var(--background);

  .yuemu-ios-tabs {
    display: flex;
    background: var(--hover-background);
    padding: 4px; border-radius: 10px;
    margin: 12px; /* 移动端紧凑外边距 */

    .yuemu-tab-item {
      flex: 1; text-align: center; padding: 6px 0; /* 紧凑高度 */
      font-size: 13px; font-weight: 500; color: var(--text-primary);
      border-radius: 8px; cursor: pointer; transition: all 0.2s;

      &.active { background: var(--card-background); box-shadow: 0 2px 6px rgba(0,0,0,0.08); font-weight: 600; }
    }
  }

  .yuemu-interaction-list {
    flex: 1; overflow-y: auto;
    padding: 0 12px 16px; /* 移动端极致紧凑：左右仅保留 12px */

    .yuemu-list-item {
      display: flex; gap: 12px; padding: 12px 0; /* 紧凑列表项 */
      border-bottom: 0.5px solid var(--border-color);

      &:last-child { border-bottom: none; }

      .yuemu-item-main {
        flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 4px;

        .yuemu-item-top {
          display: flex; justify-content: space-between; align-items: center;
          .yuemu-username { font-size: 14px; font-weight: 600; color: var(--text-primary); }
          .yuemu-time { font-size: 11px; color: var(--text-secondary); }
        }
        .yuemu-item-bottom {
          font-size: 13px;
          .yuemu-action-text { color: var(--text-secondary); }
          .yuemu-comment { color: var(--text-primary); display: block; background: var(--hover-background); padding: 6px 10px; border-radius: 6px; margin-top: 4px; font-size: 12px; }
        }
      }
    }

    .yuemu-load-more {
      text-align: center; padding: 20px 0;
      .yuemu-more-btn { background: var(--hover-background); color: #007AFF; padding: 10px 24px; border-radius: 20px; border: none; font-size: 13px; font-weight: 500; cursor: pointer; }
      .yuemu-hint-text { font-size: 12px; color: var(--text-secondary); &.yuemu-empty { display: block; padding: 40px 0; font-size: 14px; } }
    }
  }
}

/* ================= 响应式覆盖 (针对 PC 端恢复宽松布局) ================= */
@media screen and (min-width: 768px) {
  .yuemu-analytics-content { padding: 20px; }
  .yuemu-section-title { font-size: 18px; margin-bottom: 16px; }
  .yuemu-ios-cell-group { margin-bottom: 32px; .yuemu-ios-cell { padding: 16px 20px; } }

  /* PC 端：一行排布 5 个数据卡片，恢复大间距 */
  .yuemu-stats-grid {
    grid-template-columns: repeat(5, 1fr);
    gap: 16px;

    .yuemu-stat-card {
      padding: 20px 16px; border-radius: 20px; gap: 12px;
    }

    /* 强制第一张卡片不再跨列，保持全尺寸均分 */
    .yuemu-stat-card.yuemu-card-large {
      grid-column: span 1;
      .yuemu-stat-value { font-size: 28px; }
    }
  }

  /* PC 端：图表 2:1 比例，恢复高度 */
  .yuemu-charts-layout {
    grid-template-columns: 2fr 1fr; gap: 20px;
    .yuemu-chart-card { height: 300px; padding: 24px 20px 20px; border-radius: 20px;}
  }

  /* PC弹窗：恢复舒适边距 */
  .yuemu-overlay-container {
    .yuemu-ios-tabs { margin: 16px; padding: 6px; }
    .yuemu-interaction-list { padding: 0 20px 20px; }
    .yuemu-list-item { padding: 16px 0; gap: 16px;}
  }
}

/* ================= 组件库深度覆盖 ================= */
:deep(.yuemu-dynamic-overlay .ant-modal-content),
:deep(.yuemu-dynamic-overlay .ant-drawer-content) { background: var(--background); border-radius: 20px; overflow: hidden; }
:deep(.yuemu-dynamic-overlay .ant-modal-header),
:deep(.yuemu-dynamic-overlay .ant-drawer-header) { background: var(--background); border-bottom: 0.5px solid var(--border-color); padding: 16px; }
:deep(.yuemu-dynamic-overlay .ant-modal-title),
:deep(.yuemu-dynamic-overlay .ant-drawer-title) { color: var(--text-primary); font-weight: 600; font-size: 16px; text-align: center; }
:deep(.yuemu-dynamic-overlay .ant-modal-close),
:deep(.yuemu-dynamic-overlay .ant-drawer-close) { color: var(--text-secondary); top: 16px; }

/* 必须确保 body 没有内边距，完全由 yuemu-overlay-container 控制 */
:deep(.yuemu-dynamic-overlay .ant-modal-body),
:deep(.yuemu-dynamic-overlay .ant-drawer-body) { padding: 0 !important; }

:deep(.yuemu-dynamic-overlay.yuemu-is-mobile .ant-drawer-content) { border-radius: 20px 20px 0 0 !important; }

:deep(.yuemu-ios-segmented .ant-radio-button-wrapper) {
  background: transparent; border: none !important; box-shadow: none !important;
  color: var(--text-secondary); border-radius: 6px; padding: 0 12px; height: 26px; line-height: 26px; font-size: 12px;
  &::before { display: none !important; }
}
:deep(.yuemu-ios-segmented .ant-radio-button-wrapper-checked) {
  background: var(--card-background) !important; color: var(--text-primary) !important;
  font-weight: 600; box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
}
:deep(.yuemu-ios-segmented .ant-radio-group) {
  background: var(--hover-background); padding: 3px; border-radius: 8px; display: flex;
}
</style>
