<template>
  <div class="yuemu-post-list">
    <div class="yuemu-masonry-wrapper" ref="masonryRef">
      <div v-if="props.showEmptyState && !loading && (!props.dataList || props.dataList.length === 0)" class="yuemu-empty-state">
        <img :src="emptyImage" :alt="t('components.postList.noContent')" class="yuemu-empty-img">
        <div class="yuemu-empty-text">
          <h3>{{ t('components.postList.noPosts') }}</h3>
          <p>{{ t('components.postList.text1') }}</p>
        </div>
      </div>
      <div v-else class="yuemu-masonry-grid" ref="gridRef" :class="{
          'yuemu-single-column': streamLayout.value === 'single',
          'yuemu-grid-column': streamLayout.value === 'grid'
        }">
        <div v-for="(column, columnIndex) in columns" :key="columnIndex" class="yuemu-masonry-column">
          <div v-if="loading" class="yuemu-column-skeleton">
            <div v-for="(_, index) in 3" :key="index" class="yuemu-skeleton-item">
              <div class="yuemu-skeleton-image" :style="{ paddingTop: `${getSkeletonImagePadding()}%` }"></div>
              <div class="yuemu-skeleton-title"></div>
            </div>
          </div>
          <div v-else>
            <div
              v-for="post in column"
              :key="post.id"
              class="yuemu-masonry-item"
              @click="handlePostClick(post)"
            >
              <div class="yuemu-note-card">
                <div v-if="props.showStatus && post.status !== 1" class="yuemu-status-dot-wrap" @click.stop="handleStatusClick(post)">
                  <div class="yuemu-status-dot" :class="['yuemu-status-' + post.status]"></div>
                </div>
                <div class="yuemu-note-image-wrapper">
                  <div
                    class="yuemu-aspect-ratio-box"
                    :style="{ paddingTop: `${getPaddingTop(post)}%` }"
                  >
                    <div v-if="!post.imageLoaded" class="yuemu-skeleton-wrapper">
                      <div class="yuemu-skeleton-image"></div>
                    </div>
                    <div v-if="post.coverUrl && !post.hdImageLoaded" class="yuemu-blur-image-wrapper">
                      <img
                        :src="getThumbnailUrl(post.coverUrl)"
                        :alt="post.title || ''"
                        class="yuemu-blur-image"
                        @load="handleBlurImageLoad(post)"
                      >
                    </div>
                    <img
                      v-show="!loading"
                      v-if="post.coverUrl"
                      :src="post.coverUrl"
                      :alt="post.title || ''"
                      class="yuemu-note-image"
                      :class="{ 'yuemu-loaded': post.hdImageLoaded }"
                      @load="handleImageLoad(post, $event)"
                      @error="handleImageError(post)"
                    />
                    <img
                      v-show="!loading"
                      v-else
                      :src="getPostCover(post)"
                      :alt="post.title || ''"
                      class="yuemu-note-image yuemu-text-cover"
                      :class="{ 'yuemu-loaded': post.imageLoaded }"
                      @load="handleImageLoad(post, $event)"
                      @error="handleImageError(post)"
                    />
                  </div>
                </div>
                <div class="yuemu-note-info">
                  <div class="yuemu-author-section">
                    <img
                      class="yuemu-author-avatar"
                      :src="post.user?.userAvatar || getDefaultAvatar(post.user?.userName || '')"
                      :alt="post.user?.userName || ''"
                      :class="{ 'yuemu-loaded': post.avatarLoaded }"
                      @load="() => { post.avatarLoaded = true }"
                    >
                    <span class="yuemu-author-name">{{ post.user?.userName || t('components.postList.unknownUser') }}</span>
                    <span class="yuemu-view-count">
                      <EyeOutlined class="yuemu-view-icon" />
                      {{ formatNumber(Number(post.viewCount) || 0) }}
                    </span>
                  </div>
                  <div class="yuemu-note-title">{{ post.title || t('components.postList.untitled') }}</div>
                  <div class="yuemu-post-meta">
                    <span v-if="post.category" class="yuemu-category-tag">#{{ post.category }}</span>
                    <span class="yuemu-post-time">{{ formatTime(post.createTime) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <a-modal
      v-model:open="showReviewModal"
      :title="getReviewModalTitle(currentPost?.status)"
      :footer="null"
      :closable="true"
      class="yuemu-review-modal"
      width="340px"
    >
      <div class="yuemu-review-content">
        <component
          :is="getReviewIcon(currentPost?.status)"
          :class="['yuemu-review-icon', getReviewStatusClass(currentPost?.status)]"
        />
        <h3 class="yuemu-review-title">{{ getReviewModalTitle(currentPost?.status) }}</h3>
        <p class="yuemu-review-message">{{ getReviewMessage(currentPost?.status, currentPost?.reviewMessage) }}</p>
        <a-button type="primary" class="yuemu-confirm-btn" @click="showReviewModal = false">{{ t('components.postList.iGotIt') }}</a-button>
      </div>
    </a-modal>
    <a-modal
      v-model:open="showRejectModal"
      :title="null"
      :footer="null"
      :closable="false"
      class="yuemu-reject-modal"
      width="340px"
    >
      <div class="yuemu-reject-content">
        <CloseCircleOutlined class="yuemu-reject-icon" />
        <h3 class="yuemu-reject-title">{{ t('components.postList.reviewFailed') }}</h3>
        <p class="yuemu-reject-message">{{ currentPost?.reviewMessage || t('components.postList.violationMessage') }}</p>
        <a-button type="primary" class="yuemu-confirm-btn" @click="showRejectModal = false">{{ t('components.postList.iGotIt') }}</a-button>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();


import { EyeOutlined, CloseCircleOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import { getDefaultAvatar } from '@/utils/userUtils'
import { formatTime } from '@/utils/dateUtils'
import { likePostUsingPost } from '@/api/postController'
import { getTextCover } from '@/utils/textCoverGenerator'
import { computed, onMounted, onUnmounted, ref, nextTick, watch } from 'vue'
import { throttle } from 'lodash'
import emptyImage from '@/assets/illustrations/empty.png'
const router = useRouter()
interface PostWithLoadState extends API.Post {
  imageLoaded?: boolean
  hdImageLoaded?: boolean
  avatarLoaded?: boolean
  imageAspectRatio?: number
}
interface Props {
  dataList?: PostWithLoadState[]
  loading?: boolean
  showStatus?: boolean
  isEndOfData?: boolean
  onLoadMore?: () => void
  showEmptyState?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  dataList: () => [],
  loading: false,
  showStatus: false,
  isEndOfData: false,
  onLoadMore: () => {},
  showEmptyState: true
})
const masonryRef = ref(null)
const gridRef = ref(null)
const showRejectModal = ref(false)
const showReviewModal = ref(false)
const currentPost = ref(null)
const isScrollLoading = ref(false)
const triggerUpdate = ref(0)
const streamLayout = ref('waterfall')
const gridAspectRatio = ref('4:3')
const loadStreamLayout = () => {
  const savedLayout = localStorage.getItem('streamLayout')
  if (savedLayout) streamLayout.value = savedLayout
  const savedAspectRatio = localStorage.getItem('gridAspectRatio')
  if (savedAspectRatio) gridAspectRatio.value = savedAspectRatio
}
const handleStreamLayoutChange = (event) => {
  if (event && event.detail) {
    streamLayout.value = event.detail.layout || streamLayout.value
    if (event.detail.aspectRatio && streamLayout.value === 'grid') {
      gridAspectRatio.value = event.detail.aspectRatio
      localStorage.setItem('gridAspectRatio', event.detail.aspectRatio)
    }
    localStorage.setItem('streamLayout', streamLayout.value)
  }
  recalculateLayout()
}
const formatNumber = (num) => {
  if (!num) return '0'
  if (num >= 10000) return (num / 10000).toFixed(1) + 'w'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
  return num.toString()
}
const getLimitedAspectRatio = (post) => {
  switch(streamLayout.value) {
    case 'waterfall':
      return Math.max(0.7, Math.min(post.imageAspectRatio || 1, 1.2));
    case 'grid':
      switch(gridAspectRatio.value) {
        case '4:3': return 4/3;
        case '3:4': return 3/4;
        case '1:1': return 1;
        default: return 4/3;
      }
    case 'single':
      return Math.max(0.5, Math.min(post.imageAspectRatio || 1, 2.0));
    default:
      return Math.max(0.7, Math.min(post.imageAspectRatio || 1, 1.2));
  }
}
const getPaddingTop = (post) => {
  return (1 / getLimitedAspectRatio(post)) * 100;
}
const getSkeletonImagePadding = () => {
  switch(gridAspectRatio.value) {
    case '4:3': return 75;
    case '3:4': return 133.33;
    case '1:1': return 100;
    default: return 75;
  }
}
const getThumbnailUrl = (url) => {
  if (!url) return ''
  const ext = url.split('.').pop()
  const baseUrl = url.replace(`.${ext}`, '')
  return `${baseUrl}_thumbnail.${ext}`
}
const handlePostClick = (post) => {
  if (!post?.id) {
    message.error(t('components.postList.invalidPost'))
    return
  }
  router.push({ name: 'PostDetail', params: { id: post.id } })
}
const handleBlurImageLoad = (post) => {
  post.imageLoaded = true
}
const handleImageLoad = (post, event) => {
  post.hdImageLoaded = true
  post.imageLoaded = true
  const img = event.target
  if (img.naturalWidth && img.naturalHeight) {
    post.imageAspectRatio = img.naturalWidth / img.naturalHeight
  }
  requestAnimationFrame(() => {
    setTimeout(() => recalculateLayout(), 50)
  })
}
const handleImageError = (post) => {
  post.imageLoaded = true
  post.hdImageLoaded = true
  requestAnimationFrame(() => {
    setTimeout(() => recalculateLayout(), 50)
  })
}
const getColumnCount = () => {
  const width = window.innerWidth || document.documentElement.clientWidth
  if (streamLayout.value === 'single') return 1
  if (width >= 1200) return 4
  if (width >= 768) return 3
  return 2
}
const columns = computed<PostWithLoadState[][]>(() => {
  const columnCount = getColumnCount()
  const cols: PostWithLoadState[][] = Array.from({ length: columnCount }, () => [])
  if (props.loading || !props.dataList || props.dataList.length === 0) return cols
  if (streamLayout.value === 'grid') {
    props.dataList.forEach((item, index) => {
      cols[index % columnCount].push(item)
    })
  } else {
    const columnHeights = new Array(columnCount).fill(0)
    props.dataList.forEach((item) => {
      let minHeightIndex = 0
      for (let i = 1; i < columnCount; i++) {
        if (columnHeights[i] < columnHeights[minHeightIndex]) minHeightIndex = i
      }
      cols[minHeightIndex].push(item)
      const containerWidth = gridRef.value?.clientWidth || document.documentElement.clientWidth
      const imageWidth = (containerWidth / columnCount) - 16
      const imageHeight = imageWidth / getLimitedAspectRatio(item)
      columnHeights[minHeightIndex] += imageHeight + 120
    })
  }
  return cols
})
const recalculateLayout = () => {
  requestAnimationFrame(() => {
    nextTick(() => { triggerUpdate.value++ })
  })
}
const handleContainerResize = throttle(() => {
  if (gridRef.value) recalculateLayout()
}, 200)
const checkShouldLoadMore = () => {
  if (props.loading || props.isEndOfData || isScrollLoading.value) return false
  const container = document.querySelector('.yuemu-post-list')
  if (!container) return false
  const rect = container.getBoundingClientRect()
  return rect.bottom - window.innerHeight < 100
}
const handleScroll = throttle(async () =>{
  if (checkShouldLoadMore()) {
    isScrollLoading.value = true
    try {
      await props.onLoadMore?.()
    } finally {
      isScrollLoading.value = false
    }
  }
}, 200)
onMounted(() => {
  loadStreamLayout()
  const resizeObserver = new ResizeObserver(handleContainerResize)
  if (gridRef.value) resizeObserver.observe(gridRef.value)
  window.addEventListener('resize', handleContainerResize)
  window.addEventListener('streamLayoutChanged', handleStreamLayoutChange)
  const container = document.querySelector('.yuemu-post-list')
  if (container) container.addEventListener('scroll', handleScroll)
  onUnmounted(() => {
    resizeObserver.disconnect()
    window.removeEventListener('resize', handleContainerResize)
    window.removeEventListener('streamLayoutChanged', handleStreamLayoutChange)
    if (container) container.removeEventListener('scroll', handleScroll)
  })
})
watch(() => props.dataList, () => {
  nextTick(() => { if (checkShouldLoadMore()) handleScroll() })
}, { deep: true })
const handleStatusClick = (post) => {
  if (post.status !== undefined && post.status !== null) {
    currentPost.value = post
    showReviewModal.value = true
  }
}
const getReviewModalTitle = (status) => {
  if (status === 0) return t('components.postList.reviewing')
  if (status === 1) return t('components.postList.reviewPassed')
  if (status === 2) return t('components.postList.reviewFailed')
  return t('components.postList.reviewStatus')
}
const getReviewIcon = (status) => {
  if (status === 0) return ClockCircleOutlined
  if (status === 1) return CheckCircleOutlined
  return CloseCircleOutlined
}
const getReviewStatusClass = (status) => {
  if (status === 0) return 'yuemu-pending'
  if (status === 1) return 'yuemu-approved'
  return 'yuemu-rejected'
}
const getReviewMessage = (status, reviewMessage) => {
  if (status === 0) return t('components.postList.reviewingDesc')
  if (status === 1) return t('components.postList.reviewPassedDesc')
  if (status === 2) return reviewMessage || t('components.postList.reviewFailedDesc')
  return t('components.postList.reviewStatusUnknown')
}
const textCoverCache = ref({})
const loadingCovers = ref(new Set())
const generateTextCoverForPost = async (post, cacheKey) => {
  if (!post.title || loadingCovers.value.has(cacheKey)) return
  try {
    loadingCovers.value.add(cacheKey)
    const cover = await getTextCover(post.title, 300, 400)
    textCoverCache.value[cacheKey] = cover
    nextTick(() => {
      const imgs = document.querySelectorAll(`img[alt="${post.title}"].yuemu-text-cover`)
      imgs.forEach((img: any) => {
        if (img.src !== cover) img.src = cover
      })
    })
  } catch (error) {
    console.error(t('components.postList.generateCoverFailed'), error)
  } finally {
    loadingCovers.value.delete(cacheKey)
  }
}
const getPostCover = (post) => {
  const cacheKey = `text_cover_${post.title || 'untitled'}`
  if (textCoverCache.value[cacheKey]) return textCoverCache.value[cacheKey]
  if (!loadingCovers.value.has(cacheKey) && post.title) generateTextCoverForPost(post, cacheKey)
  return getDefaultAvatar(post.title || 'Post')
}
watch(() => props.dataList, (newDataList) => {
  if (newDataList && newDataList.length > 0) {
    newDataList.forEach(post => {
      if (!post.coverUrl && post.title) {
        const cacheKey = `text_cover_${post.title}`
        if (!textCoverCache.value[cacheKey] && !loadingCovers.value.has(cacheKey)) {
          generateTextCoverForPost(post, cacheKey)
        }
      }
      if (post.imageLoaded === undefined) post.imageLoaded = false
      if (post.hdImageLoaded === undefined) post.hdImageLoaded = false
      if (post.avatarLoaded === undefined) post.avatarLoaded = false
    })
  }
}, { deep: true, immediate: true })</script>
<style scoped>.yuemu-post-list {
  width: 100%;
}
.yuemu-masonry-wrapper {
  width: 100%;
  margin: 0 auto;
  padding: 0;
  position: relative;
}
@keyframes yuemu-skeleton-pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}
.yuemu-masonry-grid {
  display: flex;
  gap: 8px;
  width: 100%;
  box-sizing: border-box;
}
.yuemu-masonry-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}
.yuemu-column-skeleton {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.yuemu-skeleton-item {
  border-radius: 6px;
  overflow: hidden;
  background: var(--card-background);
  border: 1px solid var(--border-color);
}
.yuemu-skeleton-image {
  width: 100%;
  height: 264px;
  background: var(--hover-background);
  animation: yuemu-skeleton-pulse 1.5s infinite ease-in-out;
  position: relative;
}
.yuemu-skeleton-title {
  height: 24px;
  margin: 8px 12px;
  background: var(--hover-background);
  border-radius: 4px;
  animation: yuemu-skeleton-pulse 1.5s infinite ease-in-out;
}
.yuemu-masonry-item {
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  background: var(--card-background);
  border: none;
  box-sizing: border-box;
  margin-bottom: 6px;
  position: relative;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
}
@media (hover: hover) and (pointer: fine) {
  .yuemu-masonry-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
  }
  .yuemu-masonry-item:hover .yuemu-note-image {
    transform: scale(1.06);
  }
}
/* 移动端强制禁用动画和悬停变换，防止长按卡死 */
@media (max-width: 768px) {
  .yuemu-masonry-item:active, .yuemu-masonry-item:hover {
    transform: none !important;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02) !important;
  }
  .yuemu-masonry-item:active .yuemu-note-image, .yuemu-masonry-item:hover .yuemu-note-image {
    transform: none !important;
  }
}
.yuemu-note-card {
  background: var(--card-background);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.yuemu-status-dot-wrap {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1;
  padding: 4px;
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(4px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.2);
}
.yuemu-status-dot-wrap:hover {
  transform: scale(1.1);
  background: rgba(0, 0, 0, 0.4);
}
.yuemu-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.2);
  position: relative;
}
.yuemu-status-0 { background-color: #ff9d00; box-shadow: 0 0 8px rgba(255, 157, 0, 0.5); }
.yuemu-status-1 { background-color: #00b96b; box-shadow: 0 0 8px rgba(0, 185, 107, 0.5); }
.yuemu-status-2 { background-color: #ff4d4f; box-shadow: 0 0 8px rgba(255, 77, 79, 0.5); }
.yuemu-status-dot::after {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border-radius: 50%;
  border: 1px solid currentColor;
  opacity: 0.3;
  animation: yuemu-dot-pulse 2s infinite;
}
@keyframes yuemu-dot-pulse {
  0% { transform: scale(1); opacity: 0.5; }
  100% { transform: scale(1.8); opacity: 0; }
}
.yuemu-note-image-wrapper {
  width: 100%;
  position: relative;
  background: var(--hover-background);
  overflow: hidden;
}
.yuemu-aspect-ratio-box {
  position: relative;
  width: 100%;
  height: 0;
  overflow: hidden;
}
.yuemu-blur-image-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
.yuemu-blur-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: blur(8px);
  transform: scale(1.05);
}
.yuemu-note-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s cubic-bezier(0.33, 1, 0.68, 1), opacity 0.5s ease;
  opacity: 0;
}
.yuemu-note-image.yuemu-loaded {
  opacity: 1;
}
@media (hover: hover) and (pointer: fine) {
  .yuemu-masonry-item:hover .yuemu-note-image {
    transform: scale(1.06);
  }
}
.yuemu-note-info {
  padding: 12px;
}
.yuemu-author-section {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  font-size: 12px;
}
.yuemu-author-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--border-color);
  transition: opacity 0.3s ease;
  opacity: 0;
}
.yuemu-author-avatar.yuemu-loaded {
  opacity: 1;
}
.yuemu-author-name {
  color: var(--text-primary);
  flex: 1;
}
.yuemu-view-count {
  display: flex;
  align-items: center;
  gap: 2px;
  color: var(--text-secondary);
  font-size: 11px;
}
.yuemu-view-icon {
  font-size: 10px;
}
.yuemu-note-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.5;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  letter-spacing: 0.01em;
}
.yuemu-post-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: var(--text-secondary);
}
.yuemu-category-tag {
  color: #0066B3;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
  transition: all 0.2s ease;
}
.yuemu-category-tag:hover {
  background: rgba(0, 102, 179, 0.15);
}
.yuemu-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  height: 310px;
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  margin: 16px 8px;
}
.yuemu-empty-img {
  width: 120px;
  height: 220px;
}
.yuemu-empty-text h3 {
  font-size: 16px;
  color: var(--text-primary);
  margin-bottom: 4px;
}
.yuemu-empty-text p {
  font-size: 13px;
  color: var(--text-secondary);
}
.yuemu-review-modal, .yuemu-reject-modal {
  :deep(.ant-modal-content) {
    border-radius: 8px;
    border: 1px solid var(--border-color);
    background: var(--card-background);
  }
  :deep(.ant-modal-body) { padding: 0; }
}
.yuemu-review-content, .yuemu-reject-content {
  padding: 20px;
  text-align: center;
}
.yuemu-review-icon, .yuemu-reject-icon {
  font-size: 36px;
  margin-bottom: 12px;
}
.yuemu-review-title, .yuemu-reject-title {
  font-size: 16px;
  color: var(--text-primary);
  margin-bottom: 8px;
}
.yuemu-review-message, .yuemu-reject-message {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 16px;
}
.yuemu-confirm-btn {
  width: 100%;
  height: 36px;
  border-radius: 18px !important;
  font-size: 14px !important;
}
.yuemu-masonry-grid.yuemu-single-column .yuemu-masonry-column {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}
@media screen and (max-width: 768px) {
  .yuemu-masonry-grid { gap: 2px; padding: 0; }
  .yuemu-masonry-column { gap: 4px; }
  .yuemu-note-info { padding: 6px 8px; }
  .yuemu-author-avatar { width: 20px; height: 20px; }
  .yuemu-note-title { font-size: 12px; }
  .yuemu-post-meta { font-size: 10px; }
  .yuemu-empty-img { width: 100px; height: 220px; }
  .yuemu-blur-image { filter: blur(4px); }
}
@media (prefers-color-scheme: dark) { .yuemu-note-card { background: #1e1e1e;
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.4); } }
@media (prefers-color-scheme: dark) { .yuemu-masonry-item { border-color: rgba(255, 255, 255, 0.05);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3); } }
@media (prefers-color-scheme: dark) { .yuemu-masonry-item:hover { box-shadow: 0 20px 30px rgba(0, 0, 0, 0.5);
  border-color: rgba(255, 255, 255, 0.12); } }
@media (prefers-color-scheme: dark) { .yuemu-note-title { color: rgba(255, 255, 255, 0.95); } }
@media (prefers-color-scheme: dark) { .yuemu-author-name { color: rgba(255, 255, 255, 0.65); } }
@media (prefers-color-scheme: dark) { .yuemu-view-count { color: rgba(255, 255, 255, 0.45); } }
@media (prefers-color-scheme: dark) { .yuemu-category-tag { background: rgba(56, 189, 248, 0.1); color: #38bdf8; } }
@media (prefers-color-scheme: dark) { .yuemu-status-dot-wrap { background: rgba(0, 0, 0, 0.5); border-color: rgba(255, 255, 255, 0.1); } }
@media (prefers-color-scheme: dark) { .yuemu-skeleton-item { background: #1a1a1a; border-color: rgba(255, 255, 255, 0.05); } }
@media (prefers-color-scheme: dark) { .yuemu-skeleton-image, @media (prefers-color-scheme: dark) { .yuemu-skeleton-title {
 background: #262626; 
} } }
@media (prefers-color-scheme: dark) { .yuemu-empty-state { background: #111; border-color: rgba(255, 255, 255, 0.05); } }
@media (prefers-color-scheme: dark) { .yuemu-empty-text h3 { color: #e2e8f0; } }
@media (prefers-color-scheme: dark) { .yuemu-empty-text p { color: #64748b; } }
/* 移动端强制移除点击时的悬停缩放，防止底层长按死锁 */
@media (max-width: 768px) {
  .ant-card-hoverable:active, .ant-card-hoverable:hover,
  .ant-card-hoverable:active *, .ant-card-hoverable:hover *,
  .yuemu-status-dot-wrap:active, .yuemu-status-dot-wrap:hover,
  .yuemu-status-dot-wrap:active *, .yuemu-status-dot-wrap:hover *,
  .yuemu-masonry-item:active, .yuemu-masonry-item:hover,
  .yuemu-masonry-item:active *, .yuemu-masonry-item:hover *,
  .yuemu-category-tag:active, .yuemu-category-tag:hover,
  .yuemu-category-tag:active *, .yuemu-category-tag:hover * {
    transform: none !important;
  }
}</style>
