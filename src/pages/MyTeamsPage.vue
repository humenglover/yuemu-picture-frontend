<template>
  <div id="MyTeamsPage" class="modern-team-page" ref="pageRef">
        <header class="apple-hero-header">
      <div class="header-content">
        <div class="header-text-area">
          <h1 class="hero-title">{{ $t('pages.myTeamsPage.myTribes') }} <span class="count-badge" v-if="teamSpaceList.length">({{ teamSpaceList.length }})</span></h1>
          <p class="hero-subtitle">{{ $t('pages.myTeamsPage.subtitle') }}</p>
        </div>
        <div class="header-actions">
          <div class="apple-circle-btn" @click.stop.prevent="handleAddTeam" style="position: relative; z-index: 999; cursor: pointer;">
            <i class="fas fa-plus" style="pointer-events: none;"></i>
          </div>
        </div>
      </div>
    </header>

    <main class="page-main-content">
      <div class="custom-pull-refresh"
           :style="[
             { transform: `translateY(${refreshDistance}px)`, transition: refreshDistance ? 'none' : 'transform 0.3s' }
           ]"
           @touchstart="handleTouchStart"
           @touchmove="handleTouchMove"
           @touchend="handleTouchEnd"
           @touchcancel="handleTouchEnd">

        <div class="refresh-indicator" :class="{ 'refreshing': isRefreshing, 'pulled': refreshDistance >= refreshThreshold }"
             :style="{ opacity: Math.min(refreshDistance / refreshThreshold, 1) }">
          <div class="refresh-icon">
            <i v-if="isRefreshing" class="fas fa-spinner fa-spin loading-icon"></i>
            <div v-else class="pull-arrow" :style="{ transform: `rotate(${Math.min(180, (refreshDistance / refreshThreshold) * 180)}deg)` }">
              ↓
            </div>
          </div>
          <span class="refresh-text">{{ isRefreshing ? $t('pages.myTeamsPage.refreshing') : refreshDistance >= refreshThreshold ? $t('pages.myTeamsPage.releaseRefresh') : $t('pages.myTeamsPage.pullRefresh') }}</span>
        </div>

        <div class="pull-refresh-container">
          <div v-if="loading && teamSpaceList.length === 0" class="state-container">
            <div class="modern-spinner"></div>
            <p class="state-text">{{ $t('pages.myTeamsPage.syncing') }}</p>
          </div>

          <div v-else-if="teamSpaceList.length === 0" class="state-container">
            <div class="premium-empty-card fade-in-up">
              <div class="empty-icon-wrapper">
                <div class="icon-center">
                  <i class="fas fa-users empty-icon"></i>
                </div>
              </div>
              <h3 class="empty-title">{{ $t('pages.myTeamsPage.emptyTitle') }}</h3>
              <p class="empty-desc">{{ $t('pages.myTeamsPage.emptyDesc') }}</p>
              <div class="apple-primary-btn large-btn" @click.stop.prevent="handleAddTeam" style="display: flex; align-items: center; justify-content: center; cursor: pointer; position: relative; z-index: 999;">
          {{ $t('pages.myTeamsPage.createNowBtn') }}
              </div>
            </div>
          </div>

          <div v-else class="team-grid-section">
            

            <div class="team-cards-grid">
              <div class="yuemu-masonry-column" v-for="(col, colIndex) in masonryColumns" :key="`col-${colIndex}`">
                <div
                  v-for="(teamSpace, index) in col"
                  :key="teamSpace.id"
                  class="card-anim-wrapper fade-in-up"
                  :style="{ animationDelay: `${(colIndex + index) * 0.05}s` }"
                >
                  <TeamSpaceCard :space="teamSpace" class="premium-team-card" />
                </div>
              </div>
            </div>
          </div>
        <div class="space-list-no-more" v-if="teamSpaceList.length > 0">
              {{ $t('pages.myTeamsPage.noMore') }}
            </div>
          </div>

      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import { ref, onMounted, onActivated, onDeactivated, nextTick, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import { SPACE_TYPE_ENUM } from '@/constants/space'
import { listMyTeamSpaceUsingPost } from '@/api/spaceUserController'
import TeamSpaceCard from '@/components/TeamSpaceCard.vue'

const { t } = useI18n();

defineOptions({
  name: 'MyTeamsPage'
})

const router = useRouter()
const loginUserStore = useLoginUserStore()
const teamSpaceList = ref<API.SpaceVO[]>([])
const loading = ref(false)
const isRefreshing = ref(false)

// 缓存与滚动条相关
const scrollPosition = ref(0)
const isPageActive = ref(true)
const pageRef = ref<HTMLElement | null>(null)

// 下拉刷新相关状态
const startY = ref(0)
const currentY = ref(0)
const refreshDistance = ref(0)
const maxPullDistance = 100
const refreshThreshold = 80

// 瀑布流列数动态计算
const numCols = ref(3)

const updateNumCols = () => {
  const width = window.innerWidth
  if (width <= 640) {
    numCols.value = 1
  } else if (width <= 960) {
    numCols.value = 2
  } else if (width <= 1280) {
    numCols.value = 3
  } else {
    numCols.value = 4
  }
}

// 将数据分发到各个列中，实现从左到右、从上到下的瀑布流顺序
const masonryColumns = computed(() => {
  const cols: API.SpaceVO[][] = Array.from({ length: numCols.value }, () => [])
  teamSpaceList.value.forEach((space, index) => {
    cols[index % numCols.value].push(space)
  })
  return cols
})

onMounted(async () => {
  // 首次挂载时，强制将浏览器滚动条置顶，消除从其他页面带来的滚动惯性
  window.scrollTo({ top: 0, behavior: 'instant' })
  updateNumCols()
  window.addEventListener('resize', updateNumCols)
  await fetchTeamList()
})

onActivated(() => {
  isPageActive.value = true
  // 恢复之前的滚动位置
  nextTick(() => {
    window.scrollTo({ top: scrollPosition.value, behavior: 'instant' })
  })
})

onDeactivated(() => {
  isPageActive.value = false
  // 记录离开时的滚动位置，兼容不同浏览器的获取方式
  scrollPosition.value = Math.max(window.pageYOffset, document.documentElement.scrollTop, document.body.scrollTop)
  window.removeEventListener('resize', updateNumCols)
})

const fetchTeamList = async () => {
  if (!isRefreshing.value) {
    loading.value = true
  }
  try {
    const res = await listMyTeamSpaceUsingPost({})
    if (res.data.code === 0) {
      teamSpaceList.value = res.data.data ?? []
    }
  } catch (error) {
    console.error(t('pages.myTeamsPage.errGetList'), error)
  } finally {
    loading.value = false
  }
}

const onRefresh = async () => {
  isRefreshing.value = true
  await fetchTeamList()
  isRefreshing.value = false
}

// 下拉刷新触摸事件处理
const handleTouchStart = (e: TouchEvent) => {
  startY.value = e.touches[0].clientY
  currentY.value = e.touches[0].clientY
}

const handleTouchMove = (e: TouchEvent) => {
  if (isRefreshing.value) return

  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop
  if (scrollTop > 0) return

  currentY.value = e.touches[0].clientY
  const distance = currentY.value - startY.value

  if (distance > 15) {
    // 阻止浏览器原生下拉刷新行为，增加 15px 手势死区以防误杀原生 click
    if(e.cancelable) e.preventDefault()
    refreshDistance.value = Math.min((distance - 15) * 0.5, maxPullDistance)
  }
}

const handleTouchEnd = async () => {
  if (refreshDistance.value >= refreshThreshold && !isRefreshing.value) {
    isRefreshing.value = true
    await onRefresh()
    isRefreshing.value = false
  }
  refreshDistance.value = 0
}

const handleAddTeam = () => {
  router.push({ name: 'AddSpace', query: { type: String(SPACE_TYPE_ENUM.TEAM) } })
}
</script>

<style scoped>

/* ================= 基础容器 ================= */
.modern-team-page {
  min-height: auto;
  background-color: var(--background);
  color: var(--text-primary);
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  padding-bottom: env(safe-area-inset-bottom, 20px);
  font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  transition: var(--theme-transition);
}

/* ================= 沉浸式头部 (Hero Header) ================= */
.apple-hero-header {
  padding: 32px 24px 16px;
  background: transparent;
}
.header-content {
  max-width: 1200px; margin: 0 auto;
  display: flex; justify-content: space-between; align-items: flex-end;
}
.hero-title {
  font-size: 28px; font-weight: 700; margin: 0 0 8px; color: var(--text-primary); letter-spacing: 0.5px;
  display: flex; align-items: baseline; gap: 8px;
}
.count-badge { font-size: 18px; color: var(--text-secondary); font-weight: 500; }
.hero-subtitle {
  font-size: 15px; color: var(--text-secondary); margin: 0; font-weight: 400;
}
.header-actions {
  display: flex; align-items: center;
}

/* 苹果风圆形按钮 */
.apple-circle-btn {
  width: 44px; height: 44px; border-radius: 22px;
  background: var(--link-color, #1677ff); color: #fff;
  border: none; font-size: 18px; display: flex; align-items: center; justify-content: center;
  cursor: pointer; box-shadow: 0 8px 16px rgba(22,119,255,0.2); transition: 0.2s;
}
.apple-circle-btn:active { transform: scale(0.92); }
.apple-circle-btn *, .large-btn * { pointer-events: none; }
.large-btn { height: 52px; border-radius: 14px; font-size: 16px; padding: 0 32px; width: 100%; max-width: 280px; margin: 0 auto; background: var(--link-color, #1677ff); color:#fff; border:none; }
/* ================= 页面主体 ================= */
.page-main-content {
  flex: 1; max-width: 1248px; margin: 0 auto; padding: 8px 24px 64px;
  width: 100%;
  box-sizing: border-box;
}

.pull-refresh-container {
  min-height: auto;
}

/* 自定义下拉刷新容器 */
.custom-pull-refresh {
  position: relative;
  width: 100%;
  will-change: transform;
  touch-action: pan-y;
}

/* 刷新指示器 */
.refresh-indicator {
  position: absolute;
  left: 0;
  right: 0;
  top: -50px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  font-size: 14px;
  gap: 8px;
}

.refresh-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.pull-arrow {
  font-size: 20px;
  transition: transform 0.3s;
  color: var(--link-color, #2563eb);
}

.loading-icon {
  color: var(--link-color, #2563eb);
  font-size: 18px;
}

.refresh-text {
  font-weight: 500;
  color: var(--text-secondary);
}

.refresh-indicator.refreshing .refresh-text {
  color: var(--link-color, #2563eb);
}

.refresh-indicator.pulled .pull-arrow {
  color: var(--link-color, #2563eb);
}

/* 状态容器 (加载/空) */
.state-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
}

.state-text {
  margin-top: 16px;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
}

.modern-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-color);
  border-top-color: var(--link-color, #2563eb);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ================= 高级空状态卡片 ================= */
.premium-empty-card {
  max-width: 480px;
  width: 100%;
  background: var(--card-background);
  border-radius: 24px;
  padding: 56px 40px;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.04);
  border: 1px solid var(--border-color);
}

.empty-icon-wrapper {
  position: relative;
  width: 100px;
  height: 100px;
  margin: 0 auto 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-center {
  position: relative;
  width: 64px;
  height: 64px;
  background: transparent;
  border: 1px dashed var(--border-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  box-shadow: none;
}

.empty-icon {
  font-size: 24px;
  color: var(--text-secondary);
}

.empty-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 12px;
  color: var(--text-primary);
}

.empty-desc {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0 0 32px;
}

/* ================= 团队网格列表 ================= */
.team-grid-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-header {
  display: flex;
  justify-content: center;
  align-items: center;

  &::before,
  &::after {
    content: '';
    flex: 1;
    border-top: 2px dotted var(--text-secondary);
    opacity: 0.4;
  }

  &::before {
    margin-right: 16px;
  }

  &::after {
    margin-left: 16px;
  }
}

.section-title {
  font-size: 18px;
  font-weight: 400;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: 1px;
}

.team-cards-grid {
  display: flex;
  gap: 24px;
  align-items: flex-start; /* 防止列被拉伸等高 */
  margin-bottom: 24px;
}

.yuemu-masonry-column {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

/* 卡片容器：无需强制 height: 100% 否则会破坏瀑布流 */
.card-anim-wrapper {
  opacity: 0;
  width: 100%;
}

/* ================= 动画 ================= */
.fade-in-up {
  animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ================= 移动端极致适配 ================= */
@media (max-width: 768px) {
  .apple-hero-header { padding: 16px 16px 8px; }
  .header-content { flex-direction: row; align-items: center; gap: 0; }
  .hero-title {
    font-size: 26px;
  }

  .header-actions { width: auto; }

  

  .page-main-content {
    padding: 4px 8px 48px;
  }

  .team-cards-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .premium-empty-card {
    padding: 40px 24px;
    box-shadow: none; /* 移动端减弱阴影 */
  }
}

.space-list-no-more {
  text-align: center;
  padding: 16px 0 48px;
  color: var(--text-secondary);
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
