<template>
  <div class="guess-like-page journal-style">
    <!-- 沉浸式手账风头部 -->
    <header class="hero-header">
      <div class="header-content">
        <div class="header-top-row">
          <h1 class="hero-title">
            <i class="fas fa-heart" style="font-size: 24px; margin-right: 12px; color: var(--text-secondary); opacity: 0.8;"></i>
            {{ $t('pages.guessYouLikePage.title') }}
          </h1>
          <div class="header-actions">
            <button class="journal-btn" @click="handleRefresh" :disabled="loading">
              <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
              <span>{{ $t('pages.guessYouLikePage.change') }}</span>
            </button>
          </div>
        </div>
        <p class="hero-subtitle">{{ $t('pages.guessYouLikePage.subtitle') }}</p>
      </div>
    </header>

    <!-- 主体内容 -->
    <main class="page-main-content">
      <!-- 虚线装饰头 -->
      <div class="section-header">
        <h2 class="section-title">{{ $t('pages.guessYouLikePage.recommendForYou') }}</h2>
      </div>

      <BigPictureList
        :dataList="dataList"
        :loading="loading"
        :showOp="false"
      />

      <!-- 触底加载探测器 -->
      <div class="bottom-detector" ref="bottomDetectorRef">
        <div v-if="loading && dataList.length > 0" class="loading-more-text">
          <i class="fas fa-spinner fa-spin"></i> <span>{{ $t('pages.guessYouLikePage.loadingMore') }}</span>
        </div>
        <div v-else-if="!hasMore && dataList.length > 0" class="no-more-text">
          <span>{{ $t('pages.guessYouLikePage.endOfUniverse') }}</span>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import { ref, onMounted, onUnmounted, onActivated, onDeactivated, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import BigPictureList from '@/components/BigPictureList.vue'
import { searchPictureByPictureUsingPost } from '@/api/pictureController'

const { t } = useI18n();

const router = useRouter()
const route = useRoute()

const dataList = ref<any[]>([])
const loading = ref(false)
const currentPage = ref(1)
const hasMore = ref(true)
const bottomDetectorRef = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

// ================== 缓存与滚动恢复相关状态 ==================
const currentPictureId = ref<string | null>(null)
const currentImageUrl = ref<string | null>(null)
const savedScrollPosition = ref(0)
const isPageActive = ref(true)

const fetchData = async (isRefresh = false) => {
  const url = route.query.url as string
  const id = route.query.id as string

  if (isRefresh) {
    currentPage.value = 1
    hasMore.value = true
    currentPictureId.value = id || null
    currentImageUrl.value = url || null
  }

  if (!hasMore.value) return

  loading.value = true
  try {
    const res = await searchPictureByPictureUsingPost({
      imageUrl: url || undefined,
      pictureId: id ? Number(id) : undefined,
      spaceId: 0,
      current: currentPage.value,
      pageSize: 30
    } as any)

    if (res.data.code === 0 && res.data.data) {
      const records = res.data.data.records || []
      if (records.length < 30) {
        hasMore.value = false
      }
      setTimeout(() => {
        if (isRefresh) {
          dataList.value = records
        } else {
          dataList.value = [...dataList.value, ...records]
        }
        loading.value = false
      }, 500)
    } else {
      message.error(t('pages.guessYouLikePage.errGetRecommend') + (res.data.message || t('pages.guessYouLikePage.unknownErr')))
      loading.value = false
    }
  } catch (error: any) {
    message.error(t('pages.guessYouLikePage.networkErr') + error.message)
    loading.value = false
  }
}

const handleRefresh = () => {
  fetchData(true)
}

const handleLoadMore = () => {
  if (loading.value || !hasMore.value) return
  currentPage.value++
  fetchData(false)
}

const setupIntersectionObserver = () => {
  if (observer) {
    observer.disconnect()
  }
  observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !loading.value && hasMore.value) {
      handleLoadMore()
    }
  }, {
    rootMargin: '0px 0px 400px 0px' // 提前400px触发加载
  })

  if (bottomDetectorRef.value) {
    observer.observe(bottomDetectorRef.value)
  }
}

onMounted(() => {
  // 核心修复 1：首次挂载时，强制将浏览器滚动条置顶，消除从其他页面带来的滚动惯性
  window.scrollTo({ top: 0, behavior: 'instant' })
  fetchData(true)
  setTimeout(() => {
    setupIntersectionObserver()
  }, 100)
})

onActivated(() => {
  isPageActive.value = true
  const newUrl = route.query.url as string || null
  const newId = route.query.id as string || null

  // 核心修复 2：判断如果带来的 route 参数和当前记录的不一致（说明换了一张图找相似）
  if (newId !== currentPictureId.value || newUrl !== currentImageUrl.value) {
    savedScrollPosition.value = 0 // 废弃之前的滚动记录
    window.scrollTo({ top: 0, behavior: 'instant' }) // 强行置顶
  } else {
    // 是同一个推荐源，正常恢复滚动位置
    nextTick(() => { window.scrollTo({ top: savedScrollPosition.value, behavior: 'instant' }) })
  }

  setupIntersectionObserver()
})

onDeactivated(() => {
  isPageActive.value = false
  // 记录离开时的滚动位置
  savedScrollPosition.value = Math.max(window.pageYOffset, document.documentElement.scrollTop, document.body.scrollTop)
  if (observer) {
    observer.disconnect()
  }
})

// 监听路由参数变化（如果用户停留在该页面时从侧边栏等地方跳转新的相似图片）
watch(() => [route.query.id, route.query.url], async ([newId, newUrl]) => {
  if ((newId !== currentPictureId.value || newUrl !== currentImageUrl.value) && route.name === 'GuessYouLike') {
    currentPictureId.value = (newId as string) || null
    currentImageUrl.value = (newUrl as string) || null
    dataList.value = []
    currentPage.value = 1
    hasMore.value = true

    // 核心修复 3：新内容加载前，同步清零并置顶
    savedScrollPosition.value = 0
    window.scrollTo({ top: 0, behavior: 'instant' })

    fetchData(true)
  }
})
</script>

<style scoped>
/* ================= 基础容器 ================= */
.guess-like-page {
  min-height: 100vh;
  background-color: var(--background);
  color: var(--text-primary);
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  padding-bottom: env(safe-area-inset-bottom, 20px);
  font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  transition: var(--theme-transition);
}

/* ================= 沉浸式手账风头部 ================= */
.hero-header {
  position: relative;
  padding: 40px 24px 20px;
  background: transparent;
}

.header-content {
  max-width: 1248px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
}

.header-top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.hero-title {
  font-size: 28px;
  font-weight: 300;
  margin: 0;
  color: var(--text-primary);
  letter-spacing: 2px;
  display: flex;
  align-items: center;
}

.hero-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
  font-weight: 300;
  letter-spacing: 1px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 24px;
}

/* 手账风按钮 - 类似 MyTeamsPage */
.journal-btn {
  background: transparent;
  color: var(--text-primary);
  border: 1px dashed var(--border-color);
  border-radius: 4px;
  padding: 0 20px;
  height: 40px;
  font-size: 14px;
  font-weight: 400;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;
  box-shadow: none;
}

.journal-btn:hover:not(:disabled) {
  border-color: var(--text-primary);
  color: var(--text-primary);
}

.journal-btn:active:not(:disabled) {
  opacity: 0.7;
}

.journal-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ================= 页面主体 ================= */
.page-main-content {
  flex: 1;
  max-width: 1248px;
  margin: 0 auto;
  padding: 10px 24px 64px;
  width: 100%;
  box-sizing: border-box;
}

/* 虚线装饰头 */
.section-header {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 24px;
}
.section-header::before,
.section-header::after {
  content: '';
  flex: 1;
  border-top: 2px dotted var(--text-secondary);
  opacity: 0.4;
}
.section-header::before {
  margin-right: 16px;
}
.section-header::after {
  margin-left: 16px;
}

.section-title {
  font-size: 14px;
  font-weight: 300;
  color: var(--text-secondary);
  margin: 0;
  letter-spacing: 2px;
}

/* ================= 触底加载状态 ================= */
.bottom-detector {
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 24px 0 40px;
}

.loading-more-text,
.no-more-text {
  font-size: 13px;
  color: var(--text-secondary);
  letter-spacing: 1px;
  font-weight: 300;
  display: flex;
  align-items: center;
  gap: 8px;
}

.no-more-text {
  opacity: 0.6;
}

/* ================= 移动端极致适配 ================= */
@media (max-width: 768px) {
  .hero-header {
    padding: 32px 8px 16px;
  }

  .hero-title {
    font-size: 24px;
  }

  .journal-btn {
    padding: 0 12px;
    font-size: 13px;
  }

  .page-main-content {
    padding: 4px 8px 48px;
  }
}
</style>
