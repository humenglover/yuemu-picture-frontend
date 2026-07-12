<template>
  <div class="search-picture-page journal-style">
    <!-- 沉浸式手账风头部 -->
    <header class="hero-header">
      <div class="header-content">
        <div class="header-top-row">
          <h1 class="hero-title">
            <i class="fas fa-arrow-left" @click="goBack" style="cursor: pointer; margin-right: 16px; font-size: 20px; color: var(--text-secondary); opacity: 0.8;"></i>
            <i class="fas fa-search" style="font-size: 24px; margin-right: 12px; color: var(--text-secondary); opacity: 0.8;"></i>
            {{ $t('pages.searchPicturePage.title') }}
</h1>
          <div class="header-actions">
            <button class="journal-btn" @click="fetchResultData(false)" :disabled="loading">
              <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
              <span>{{ $t('pages.searchPicturePage.retry') }}</span>
            </button>
          </div>
        </div>

        <div class="source-preview-card" v-if="picture.url">
          <img :src="picture.thumbnailUrl || picture.url" :alt="$t('pages.searchPicturePage.source.alt')" class="source-img" />
          <div class="source-meta">
            <div class="source-desc">{{ $t('pages.searchPicturePage.source.label') }}</div>
            <div class="source-status" v-if="loading"><i class="fas fa-spinner fa-spin"></i> {{ $t('pages.searchPicturePage.source.searching') }}</div>
            <div class="source-status" v-else-if="errorMsg"><i class="fas fa-exclamation-circle"></i> {{ errorMsg }}</div>
            <div class="source-status" v-else>{{ $t('pages.searchPicturePage.source.found', { count: totalCount }) }}</div>
          </div>
        </div>
      </div>
    </header>

    <!-- 主体内容 -->
    <main class="page-main-content">
      <div class="section-header">
        <h2 class="section-title">{{ $t('pages.searchPicturePage.results.title') }}</h2>
      </div>

      <BigPictureList
        :dataList="dataList"
        :loading="loading && dataList.length === 0"
        :showOp="false"
      />

      <!-- 触底加载探测器 -->
      <div class="bottom-detector" ref="bottomDetectorRef">
        <div v-if="loadingMore" class="loading-more-text">
          <i class="fas fa-spinner fa-spin"></i> <span>{{ $t('pages.searchPicturePage.results.loading') }}</span>
        </div>
        <div v-else-if="!hasMore && dataList.length > 0" class="no-more-text">
          <span>{{ $t('pages.searchPicturePage.results.end') }}</span>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import BigPictureList from '@/components/BigPictureList.vue'
import { getPictureVoByIdUsingGet, searchPictureByPictureUsingPost } from '@/api/pictureController'

const { t } = useI18n();

const router = useRouter()
const route = useRouter().currentRoute

// 获取参数
const pictureId = computed(() => route.value.query?.pictureId as string)
const imageUrlFromQuery = computed(() => route.value.query?.imageUrl as string)

// 状态
const picture = ref<any>({})
const dataList = ref<API.PictureVO[]>([])
const totalCount = ref<number>(0)
const loading = ref(true)
const errorMsg = ref('')
const loadingMore = ref(false)
const hasMore = ref(true)

const searchParams = reactive({
  current: 1,
  pageSize: 30, 
})

const goBack = () => {
  router.back()
}

// 获取图片详情
const fetchPictureDetail = async () => {
  if (pictureId.value) {
    try {
      const res = await getPictureVoByIdUsingGet({ id: pictureId.value })
      if (res.data.code === 0 && res.data.data) {
        picture.value = res.data.data
      } else {
        message.error(t('pages.searchPicturePage.msgs.getPicFail') + res.data.message)
      }
    } catch (e: any) {
      message.error(t('pages.searchPicturePage.msgs.getPicFail') + e.message)
    }
  } else if (imageUrlFromQuery.value) {
    picture.value = {
      url: imageUrlFromQuery.value,
      thumbnailUrl: imageUrlFromQuery.value,
      name: t('pages.searchPicturePage.source.uploadedName')
    }
  }
}

// 搜索
const fetchResultData = async (append = false) => {
  if (!picture.value.url) return

  if (append) {
    loadingMore.value = true
  } else {
    loading.value = true
    searchParams.current = 1
    hasMore.value = true
    dataList.value = []
  }
  errorMsg.value = ''

  try {
    const res = await searchPictureByPictureUsingPost({
      imageUrl: picture.value.thumbnailUrl || picture.value.url,
      spaceId: 0,
      current: searchParams.current,
      pageSize: searchParams.pageSize,
    })

    if (res.data.code === 0 && res.data.data) {
      const newRecords = res.data.data.records ?? []
      totalCount.value = Number(res.data.data.total) || 0
      if (append) {
        dataList.value = [...dataList.value, ...newRecords]
      } else {
        dataList.value = newRecords
      }
      if (newRecords.length < searchParams.pageSize) {
        hasMore.value = false
      }
    } else {
      if (!append) errorMsg.value = res.data.message || t('pages.searchPicturePage.msgs.fetchFail')
      message.error(t('pages.searchPicturePage.msgs.searchFail') + res.data.message)
    }
  } catch (e: any) {
    if (!append) errorMsg.value = e.message || t('pages.searchPicturePage.msgs.fetchFail')
    message.error(t('pages.searchPicturePage.msgs.searchFail') + e.message)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// 触底加载
const handleLoadMore = () => {
  if (loading.value || loadingMore.value || !hasMore.value) return
  searchParams.current++
  fetchResultData(true)
}

// 滚动监听
const handleScroll = () => {
  const { scrollTop, scrollHeight, clientHeight } = document.documentElement
  if (scrollHeight - scrollTop - clientHeight < 400) {
    handleLoadMore()
  }
}

onMounted(async () => {
  window.scrollTo(0, 0)
  await fetchPictureDetail()
  if (picture.value.url) {
    fetchResultData(false)
  }
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
/* =========== 引入通用手账风样式体系 =========== */
.journal-style {
  min-height: 100vh;
  background-color: var(--background);
  color: var(--text-primary);
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  transition: var(--theme-transition);
}

/* 顶部 Hero 区域 */
.hero-header {
  padding: 24px 24px;
  background: var(--card-background);
  border-bottom: 1px dashed var(--border-color);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
  margin-bottom: 24px;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
}

.header-top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.hero-title {
  margin: 0;
  font-size: 24px;
  font-weight: 800;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  letter-spacing: 1px;
}

/* 手账风按钮 */
.journal-btn {
  background: var(--hover-background);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
  box-shadow: 2px 2px 0 var(--border-color);
}
.journal-btn:active {
  transform: translate(2px, 2px);
  box-shadow: 0 0 0 transparent;
}
.journal-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: 2px 2px 0 var(--border-color);
}

/* 原图预览卡片 */
.source-preview-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  background: var(--hover-background);
  border-radius: 12px;
  border: 1px dashed var(--border-color);
  max-width: 400px;
}

.source-img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
  border: 2px solid var(--card-background);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.source-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.source-desc {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

.source-status {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

/* 主体内容区 */
.page-main-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 16px 40px;
}

.section-header {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  position: relative;
  display: inline-block;
}
.section-title::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 100%;
  height: 6px;
  background: var(--link-color);
  opacity: 0.2;
  border-radius: 3px;
}

/* 触底加载区域 */
.bottom-detector {
  margin-top: 40px;
  text-align: center;
  padding: 20px 0;
  color: var(--text-secondary);
  font-size: 14px;
}
.loading-more-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.no-more-text {
  font-style: italic;
  opacity: 0.8;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .hero-header {
    padding: 0 16px;
  }
  .hero-title {
    font-size: 20px;
  }
  .journal-btn {
    padding: 6px 12px;
    font-size: 13px;
  }
  .source-preview-card {
    max-width: 100%;
  }
}
</style>
