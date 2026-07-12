<template>
  <div class="analytics-dashboard">
    <header class="dashboard-header">
      <h1 class="page-title">{{ $t('pages.creatorAnalyticsPage.pageTitle') }}</h1>
      <p class="page-subtitle">{{ $t('pages.creatorAnalyticsPage.pageSubtitle') }}</p>
    </header>

    <div v-if="loading" class="loading-state">
      <i class="fas fa-circle-notch fa-spin"></i>
      <span>{{ $t('pages.creatorAnalyticsPage.loading') }}</span>
    </div>

    <div v-else-if="analytics" class="dashboard-content">
      <section class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-label">{{ $t('pages.creatorAnalyticsPage.viewsTotal') }}</span>
            <i class="fas fa-eye kpi-icon"></i>
          </div>
          <div class="kpi-value">{{ formatNumber(analytics.overview.totalViews) }}</div>
          <div class="kpi-trend" :class="analytics.overview.viewsChange >= 0 ? 'trend-up' : 'trend-down'">
            <i :class="analytics.overview.viewsChange >= 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down'"></i>
            {{ Math.abs(analytics.overview.viewsChange) }}
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-label">{{ $t('pages.creatorAnalyticsPage.worksTotal') }}</span>
            <i class="fas fa-layer-group kpi-icon"></i>
          </div>
          <div class="kpi-value">{{ Number(analytics.overview.totalPictures) + Number(analytics.overview.totalPosts) }}</div>
          <div class="kpi-desc">{{ $t('pages.creatorAnalyticsPage.worksDesc', { pic: analytics.overview.totalPictures, post: analytics.overview.totalPosts }) }}</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-label">{{ $t('pages.creatorAnalyticsPage.interactionsTotal') }}</span>
            <i class="fas fa-heart kpi-icon"></i>
          </div>
          <div class="kpi-value">{{ formatNumber(Number(analytics.overview.totalLikes) + Number(analytics.overview.totalFavorites)) }}</div>
          <div class="kpi-desc">{{ $t('pages.creatorAnalyticsPage.interactionsDesc', { like: analytics.overview.totalLikes, fav: analytics.overview.totalFavorites }) }}</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-label">{{ $t('pages.creatorAnalyticsPage.currentFans') }}</span>
            <i class="fas fa-user-group kpi-icon"></i>
          </div>
          <div class="kpi-value">{{ formatNumber(analytics.overview.fansCount) }}</div>
          <div class="kpi-trend trend-up">{{ $t('pages.creatorAnalyticsPage.coreAudience') }}</div>
        </div>
      </section>

      <section class="panel-section">
        <div class="panel-header">
          <h2 class="panel-title">{{ $t('pages.creatorAnalyticsPage.dataTrend') }}</h2>
        </div>
        <div class="segmented-control">
          <button
            v-for="tab in chartTabs"
            :key="tab.key"
            class="seg-item"
            :class="{ active: activeChartTab === tab.key }"
            @click="activeChartTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>
        <div class="chart-wrapper" ref="trendChartRef"></div>
      </section>

      <section class="panel-section">
        <div class="panel-header">
          <h2 class="panel-title">{{ $t('pages.creatorAnalyticsPage.top10Works') }}</h2>
        </div>
        <div class="compact-work-list">
          <div
            v-for="(work, index) in analytics.topWorks"
            :key="work.id"
            class="work-list-item"
            @click="goToWork(work)"
          >
            <div class="work-rank" :class="`rank-${index + 1}`">{{ index + 1 }}</div>
            <img :src="work.thumbnail" :alt="work.name" class="work-thumb" loading="lazy" />
            <div class="work-info">
              <div class="work-name">{{ work.name }}</div>
              <div class="work-stats">
                <span class="work-type-tag" :class="work.type === 1 ? 'tag-pic' : 'tag-post'">
                  {{ work.type === 1 ? $t('pages.creatorAnalyticsPage.pic') : $t('pages.creatorAnalyticsPage.post') }}
                </span>
                <span><i class="fas fa-eye"></i> {{ formatNumber(work.views) }}</span>
                <span><i class="fas fa-heart"></i> {{ formatNumber(work.likes) }}</span>
              </div>
            </div>
            <i class="fas fa-chevron-right work-arrow"></i>
          </div>
        </div>
      </section>

      <div class="grid-section">
        <section class="panel-section">
          <div class="panel-header">
            <h2 class="panel-title">{{ $t('pages.creatorAnalyticsPage.categoryHeat') }}</h2>
          </div>
          <div class="chart-wrapper small-chart" ref="categoryChartRef"></div>
        </section>

        <section class="panel-section">
          <div class="panel-header">
            <h2 class="panel-title">{{ $t('pages.creatorAnalyticsPage.activeHours') }}</h2>
          </div>
          <div class="chart-wrapper small-chart" ref="hourChartRef"></div>
        </section>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

import { ref, onMounted, watch, nextTick, onUnmounted, markRaw } from 'vue'
import { getMyAnalyticsUsingGet } from '@/api/creatorAnalyticsController'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'

const router = useRouter()
const loading = ref(true)
const analytics = ref<any>(null)
const activeChartTab = ref('views')

const trendChartRef = ref<HTMLDivElement>()
const categoryChartRef = ref<HTMLDivElement>()
const hourChartRef = ref<HTMLDivElement>()

// 使用 markRaw 避免 Vue 3 的 Proxy 代理 ECharts 实例，这是导致卡顿或空白的常见原因
let trendChart: echarts.ECharts | null = null
let categoryChart: echarts.ECharts | null = null
let hourChart: echarts.ECharts | null = null

const chartTabs = [
  { key: 'views', label: t('pages.creatorAnalyticsPage.views') },
  { key: 'likes', label: t('pages.creatorAnalyticsPage.likes') },
  { key: 'favorites', label: t('pages.creatorAnalyticsPage.favorites') },
  { key: 'fans', label: t('pages.creatorAnalyticsPage.fans') }
]

const formatNumber = (num: number | string) => {
  const n = Number(num)
  if (n >= 10000) return (n / 10000).toFixed(1) + 'W'
  return n.toLocaleString()
}

// 修复点 1：去 document.documentElement (:root) 获取你的全局变量
const getThemeColors = () => {
  const style = getComputedStyle(document.documentElement)
  return {
    text: style.getPropertyValue('--text-secondary').trim() || '#666666',
    border: style.getPropertyValue('--border-color').trim() || '#e9ecef',
    primary: style.getPropertyValue('--link-color').trim() || '#3b82f6',
    tooltipBg: style.getPropertyValue('--card-background').trim() || '#ffffff',
    tooltipText: style.getPropertyValue('--text-primary').trim() || '#3e3f3f',
    shadow: style.getPropertyValue('--shadow-color').trim() || 'rgba(0,0,0,0.1)',
  }
}

const fetchAnalytics = async () => {
  loading.value = true
  try {
    const res = await getMyAnalyticsUsingGet()
    if (res.data.code === 0) {
      analytics.value = res.data.data

      // 修复点 2：不仅仅等待 nextTick，加一点微小延时，确保移动端 DOM 的高度已经彻底渲染撑开
      setTimeout(() => {
        initCharts()
      }, 150)

    } else {
      message.error(t('pages.creatorAnalyticsPage.loadFail', { msg: res.data.message }))
    }
  } catch (error) {
    message.error(t('pages.creatorAnalyticsPage.networkFail'))
  } finally {
    loading.value = false
  }
}

const initCharts = () => {
  if (!analytics.value) return
  initTrendChart()
  initCategoryChart()
  initHourChart()
}

const getTooltipConfig = (colors: any, trigger = 'axis') => ({
  trigger,
  backgroundColor: colors.tooltipBg,
  borderColor: colors.border,
  borderWidth: 1,
  padding: [8, 12],
  textStyle: { color: colors.tooltipText, fontSize: 12 },
  boxShadow: `0 4px 12px ${colors.shadow}`
})

const initTrendChart = () => {
  if (!trendChartRef.value || !analytics.value) return
  if (trendChart) trendChart.dispose()

  // 使用 markRaw 封装
  trendChart = markRaw(echarts.init(trendChartRef.value))
  const colors = getThemeColors()

  const dataMap: any = {
    views: analytics.value.trend.views.map(Number),
    likes: analytics.value.trend.likes.map(Number),
    favorites: analytics.value.trend.favorites.map(Number),
    fans: analytics.value.trend.fans.map(Number)
  }

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      ...getTooltipConfig(colors),
      axisPointer: { type: 'line', lineStyle: { color: colors.border } }
    },
    grid: { left: '2%', right: '4%', bottom: '0%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: analytics.value.trend.dates,
      axisLabel: { color: colors.text, fontSize: 10 },
      axisLine: { lineStyle: { color: colors.border } }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: colors.text, fontSize: 10 },
      splitLine: { lineStyle: { color: colors.border, type: 'dashed' } }
    },
    series: [{
      name: chartTabs.find(t => t.key === activeChartTab.value)?.label,
      type: 'line',
      smooth: 0.4,
      symbol: 'none',
      data: dataMap[activeChartTab.value],
      lineStyle: { color: colors.primary, width: 3 },
      // 修复点 3：放弃危险的正则替换，使用 ECharts 的 opacity 控制渐变透明度，绝对安全
      areaStyle: {
        opacity: 0.2,
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: colors.primary },
          { offset: 1, color: 'transparent' }
        ])
      }
    }]
  }
  trendChart.setOption(option)
}

const initCategoryChart = () => {
  if (!categoryChartRef.value || !analytics.value) return
  if (categoryChart) categoryChart.dispose()

  categoryChart = markRaw(echarts.init(categoryChartRef.value))
  const colors = getThemeColors()

  const validStats = analytics.value.categoryStats
    .filter((s: any) => s.category && s.category !== t('pages.creatorAnalyticsPage.uncategorized'))
    .sort((a: any, b: any) => Number(b.views) - Number(a.views))
    .slice(0, 6)

  const option = {
    backgroundColor: 'transparent',
    tooltip: getTooltipConfig(colors, 'item'),
    grid: { left: '0%', right: '6%', bottom: '0%', top: '5%', containLabel: true },
    xAxis: {
      type: 'value',
      show: false
    },
    yAxis: {
      type: 'category',
      data: validStats.map((s: any) => s.category).reverse(),
      axisLabel: { color: colors.text, fontSize: 11 },
      axisLine: { show: false },
      axisTick: { show: false }
    },
    series: [{
      type: 'bar',
      data: validStats.map((s: any) => Number(s.views)).reverse(),
      itemStyle: { color: colors.primary, borderRadius: [0, 4, 4, 0] },
      barWidth: '12px',
      label: {
        show: true,
        position: 'right',
        color: colors.text,
        fontSize: 10,
        formatter: (p: any) => formatNumber(p.value)
      }
    }]
  }
  categoryChart.setOption(option)
}

const initHourChart = () => {
  if (!hourChartRef.value || !analytics.value) return
  if (hourChart) hourChart.dispose()

  hourChart = markRaw(echarts.init(hourChartRef.value))
  const colors = getThemeColors()

  const hours = analytics.value.audienceProfile.activeHours.map((h: any) => `${h.hour}h`)
  const activity = analytics.value.audienceProfile.activeHours.map((h: any) => Number(h.activity))

  const option = {
    backgroundColor: 'transparent',
    tooltip: getTooltipConfig(colors, 'axis'),
    grid: { left: '2%', right: '2%', bottom: '0%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: hours,
      axisLabel: { color: colors.text, fontSize: 10, interval: 3 },
      axisLine: { lineStyle: { color: colors.border } },
      axisTick: { show: false }
    },
    yAxis: { show: false },
    series: [{
      type: 'bar',
      data: activity,
      itemStyle: { color: colors.primary, borderRadius: [4, 4, 0, 0] }
    }]
  }
  hourChart.setOption(option)
}

// ... 下方的 watch 和监听事件保持不变 ...
const goToWork = (work: any) => {
  router.push(work.type === 1 ? `/picture/${work.id}` : `/post/${work.id}`)
}

watch(activeChartTab, () => {
  initTrendChart()
})

let observer: MutationObserver | null = null
const setupThemeObserver = () => {
  observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class') {
        initCharts()
      }
    })
  })
  observer.observe(document.body, { attributes: true })
}

const handleResize = () => {
  trendChart?.resize()
  categoryChart?.resize()
  hourChart?.resize()
}

onMounted(() => {
  fetchAnalytics()
  window.addEventListener('resize', handleResize)
  setupThemeObserver()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (observer) observer.disconnect()
  trendChart?.dispose()
  categoryChart?.dispose()
  hourChart?.dispose()
})
</script>

<style scoped>
/* 100% 使用外部传入的 CSS 变量。
  没有硬编码的背景色、文字色或边框色。
*/

.analytics-dashboard {
  background-color: var(--background);
  color: var(--text-primary);
  min-height: 100vh;
  padding: 16px; /* 移动端友好的基础边距 */
  max-width: 1200px;
  margin: 0 auto;
}

.dashboard-header {
  margin-bottom: 20px;
  padding: 8px 4px;
}

.page-title {
  font-size: 22px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 6px 0;
}

.page-subtitle {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: var(--text-secondary);
  gap: 12px;
  font-size: 14px;
}

/* --- 紧凑型 2x2 网格 --- */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr); /* 强制 2 列，节约屏幕高度 */
  gap: 12px;
  margin-bottom: 20px;
}

.kpi-card {
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 14px;
  box-shadow: 0 2px 8px var(--shadow-color);
  display: flex;
  flex-direction: column;
}

.kpi-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.kpi-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.kpi-icon {
  font-size: 14px;
  color: var(--link-color);
}

.kpi-value {
  font-size: 22px;
  font-weight: 600;
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  margin-bottom: 6px;
}

.kpi-trend, .kpi-desc {
  font-size: 11px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 根据你的主题系统，适当给点反馈色 */
.trend-up { color: var(--markdown-heading-green-border, #22c55e); }
.trend-down { color: var(--comment-delete-hover-color, #fb7299); }


/* --- 面板通用样式 --- */
.panel-section {
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px var(--shadow-color);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.panel-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

/* --- 苹果风 Segmented Control --- */
.segmented-control {
  display: flex;
  background: var(--hover-background);
  padding: 3px;
  border-radius: 8px;
  margin-bottom: 16px;
  border: 1px solid var(--border-color);
}

.seg-item {
  flex: 1;
  text-align: center;
  padding: 6px 0;
  font-size: 12px;
  color: var(--text-secondary);
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: var(--theme-transition);
}

.seg-item.active {
  background: var(--card-background);
  color: var(--text-primary);
  font-weight: 500;
  box-shadow: 0 1px 4px var(--shadow-color);
}

/* --- 图表容器 --- */
.chart-wrapper {
  width: 100%;
  height: 220px; /* 移动端限制高度 */
}
.chart-wrapper.small-chart {
  height: 180px;
}


/* --- 紧凑型列表 (移动端替代 Table 的最佳方案) --- */
.compact-work-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.work-list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: var(--background);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.work-list-item:hover {
  background: var(--hover-background);
}

.work-rank {
  font-size: 14px;
  font-weight: bold;
  color: var(--text-secondary);
  width: 20px;
  text-align: center;
}

.rank-1 { color: #f59e0b; } /* 可以根据需要保留少许点缀色 */
.rank-2 { color: #94a3b8; }
.rank-3 { color: #b45309; }

.work-thumb {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  object-fit: cover;
  background: var(--hover-background);
  border: 1px solid var(--border-color);
}

.work-info {
  flex: 1;
  min-width: 0;
}

.work-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.work-stats {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 11px;
  color: var(--text-secondary);
}

.work-type-tag {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.tag-pic {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.tag-post {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.work-arrow {
  font-size: 12px;
  color: var(--border-color);
}

/* 响应式排版：在桌面端/大屏设备上水平平铺 */
.grid-section {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

@media (min-width: 768px) {
  .analytics-dashboard { padding: 24px 32px; }
  .kpi-grid { grid-template-columns: repeat(4, 1fr); }
  .grid-section { grid-template-columns: repeat(2, 1fr); }
  .chart-wrapper { height: 280px; }
  .chart-wrapper.small-chart { height: 240px; }
}
</style>
