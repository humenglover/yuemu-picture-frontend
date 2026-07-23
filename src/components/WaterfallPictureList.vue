<template>
  <div class="yuemu-pc-picture-list">
    <div class="yuemu-masonry-wrapper" ref="masonryRef">
      <div class="yuemu-masonry-grid" ref="gridRef">
        <div v-for="(column, columnIndex) in columns" :key="columnIndex" class="yuemu-masonry-column" :class="{
          'yuemu-single-column': streamLayout.value === 'single',
          'yuemu-grid-column': streamLayout.value === 'grid'
        }">
          <!-- 优雅的骨架屏渲染 -->
          <div v-if="loading" class="yuemu-column-skeleton">
            <div v-for="(_, index) in 3" :key="index" class="yuemu-skeleton-item">
              <div class="yuemu-skeleton-shimmer"></div>
            </div>
          </div>

          <div v-else-if="!loading && (!props.dataList || props.dataList.length === 0)" class="yuemu-empty-state">
            <img :src="emptyImage" :alt="t('components.waterfallPictureList.noContent')" class="yuemu-empty-image">
            <div class="yuemu-empty-text">
              <h3>{{ t('components.waterfallPictureList.noPictures') }}</h3>
              <p>{{ t('components.waterfallPictureList.goUploadPictures') }} <i class="fas fa-sad-tear"></i></p>
            </div>
          </div>

          <div v-else>
            <div v-for="picture in column" :key="picture.id" class="yuemu-card-spacing">
              <div
                class="yuemu-masonry-item"
                :data-pic-id="picture.id"
                :class="{ 'yuemu-draft': picture.isDraft === 1 }"
                @click.stop="doClickPicture(picture)"
              >
                <div class="yuemu-image-wrapper">
                  <div
                    class="yuemu-aspect-ratio-box"
                    :style="{ paddingTop: `${getLimitedPaddingTop(picture)}%` }"
                  >
                    <!-- 模糊占位背景 -->
                    <div class="yuemu-image-placeholder" :class="{ 'yuemu-hidden': picture.imageLoaded }"></div>

                    <img
                      class="yuemu-masonry-image"
                      :src="picture.thumbnailUrl || picture.url || '/default-image.png'"
                      :alt="picture.name || t('components.waterfallPictureList.picture')"
                      :class="{ 'yuemu-loaded': picture.imageLoaded }"
                      referrerpolicy="no-referrer-when-downgrade"
                      @load="handleImageLoad(picture)"
                      @error="handleImageError(picture)"
                    />

                    <!-- 毛玻璃数据标签 -->
                    <div class="yuemu-image-view-count">
                      <i class="fas fa-eye yuemu-view-icon"></i>
                      <span class="yuemu-view-number">{{ formatNumber(picture.viewCount) || 0 }}</span>
                    </div>

                    <!-- 毛玻璃徽标 -->
                    <div class="yuemu-image-badges">
                      <div v-if="picture.isFeature === 1" class="yuemu-badge yuemu-feature-badge">
                        <i class="fas fa-crown"></i>
                        <span>{{ t('components.waterfallPictureList.featured') }}</span>
                      </div>
                      <div v-else-if="picture.isDraft === 1" class="yuemu-badge yuemu-draft-badge">
                        <i class="fas fa-file-alt"></i>
                        <span>{{ t('components.waterfallPictureList.draft') }}</span>
                      </div>
                    </div>

                    <div v-if="isMyPosts && picture.isDraft !== 1 && picture.reviewStatus !== 1" class="yuemu-review-status">
                      <a-button type="link" class="yuemu-review-button" @click.stop="showReviewModal(picture)">
                        <template v-if="picture.reviewStatus === 0">
                          <i class="fas fa-clock yuemu-status-icon yuemu-pending"></i>
                          <span class="yuemu-status-text">{{ t('components.waterfallPictureList.reviewing') }}</span>
                        </template>
                        
                        <template v-else-if="picture.reviewStatus === 2">
                          <i class="fas fa-times-circle yuemu-status-icon yuemu-rejected"></i>
                          <span class="yuemu-status-text">{{ t('components.waterfallPictureList.rejected') }}</span>
                        </template>
                      </a-button>
                    </div>

                    <!-- 悬浮毛玻璃遮罩 -->
                    <div class="yuemu-hover-overlay">
                      <div class="yuemu-overlay-content">
                        <div class="yuemu-picture-title">{{ picture.name || t('components.waterfallPictureList.unnamedPicture') }}</div>
                        <div class="yuemu-user-info">
                          <img
                            class="yuemu-user-avatar"
                            :src="picture.user?.userAvatar || getDefaultAvatar(picture.user?.userName)"
                            :alt="picture.user?.userName || t('components.waterfallPictureList.userAvatar')"
                            :class="{ 'yuemu-loaded': picture.avatarLoaded }"
                            @load="() => { picture.avatarLoaded = true }"
                          />
                          <div class="yuemu-user-meta">
                            <span class="yuemu-user-name">{{ picture.user?.userName || t('components.waterfallPictureList.unknownUser') }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <PictureDetailView
      v-if="selectedPictureId"
      :id="selectedPictureId"
      :visible="detailModalVisible"
      :initialData="selectedPictureData"
      @close="handleDetailModalClose"
    />

    <a-modal
      v-model:open="reviewModalVisible"
      :title="getReviewModalTitle(currentPicture?.reviewStatus)"
      :footer="null"
      class="yuemu-review-modal"
    >
      <div class="yuemu-review-detail">
        <div class="yuemu-status-icon-large">
          <i class="fas fa-clock yuemu-pending" v-if="currentPicture?.reviewStatus === 0"></i>
          <i class="fas fa-check-circle yuemu-approved" v-else-if="currentPicture?.reviewStatus === 1"></i>
          <i class="fas fa-times-circle yuemu-rejected" v-else-if="currentPicture?.reviewStatus === 2"></i>
        </div>
        <div class="yuemu-review-message">
          <template v-if="currentPicture?.reviewStatus === 0">{{ t('components.waterfallPictureList.pictureIsReviewing') }}</template>
          <template v-else-if="currentPicture?.reviewStatus === 1">{{ t('components.waterfallPictureList.pictureApproved') }}</template>
          <template v-else-if="currentPicture?.reviewStatus === 2">{{ currentPicture?.reviewMessage || t('components.waterfallPictureList.pictureRejected') }}</template>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

import { useRouter } from 'vue-router'
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { Button as AButton, Modal as AModal } from 'ant-design-vue'
import { throttle } from 'lodash-es'
import { getDefaultAvatar } from '@/utils/userUtils'
import emptyImage from '@/assets/empty.png'
import PictureDetailView from './PictureDetailView.vue'

// (此处保留你原本完美的 TS 接口和逻辑代码，没有任何修改)
// 为保持篇幅整洁，此处省略中间未修改的 script 逻辑，你直接保留原有的 <script setup> 即可。
// 只需要确保上面 template 里的类名和绑定（特别是 picture.imageLoaded）与你的逻辑匹配。

interface User {
  id: string | number
  userName: string
  userAvatar: string
  userAccount: string
  userProfile: string
  userRole: string
  createTime: string
}

interface PictureVO {
  id: string | number
  url: string
  thumbnailUrl?: string
  name?: string
  picScale?: number
  picColor?: string
  isFeature?: number
  reviewStatus?: number
  reviewMessage?: string
  viewCount?: number
  avatarLoaded?: boolean
  imageLoaded?: boolean
  user?: User
  itemHeight?: number
  isDraft?: number
  createTime?: string
}

const props = withDefaults(defineProps<{
  dataList?: PictureVO[]
  loading?: boolean
  showOp?: boolean
  onReload?: () => void
  isMyPosts?: boolean
  canEdit?: boolean
  canDelete?: boolean
}>(), {
  dataList: () => [],
  loading: false,
  showOp: false,
  onReload: () => {},
  isMyPosts: false,
  canEdit: false,
  canDelete: false,
})

const router = useRouter()
const masonryRef = ref<HTMLElement | null>(null)
const gridRef = ref<HTMLElement | null>(null)
const reviewModalVisible = ref(false)
const currentPicture = ref<PictureVO | null>(null)
const windowWidth = ref(window.innerWidth)
const triggerUpdate = ref(0)
const columnHeights = ref<number[]>([])

const detailModalVisible = ref(false)
const selectedPictureId = ref<string | number | null>(null)
const selectedPictureData = ref<PictureVO | null>(null)

const streamLayout = ref('waterfall')
const gridAspectRatio = ref('4:3')

const loadStreamLayout = () => {
  const savedLayout = localStorage.getItem('streamLayout')
  if (savedLayout) streamLayout.value = savedLayout
  const savedAspectRatio = localStorage.getItem('gridAspectRatio')
  if (savedAspectRatio) gridAspectRatio.value = savedAspectRatio
}

const getLimitedPaddingTop = (picture: PictureVO) => {
  const ratio = picture.picScale || 1
  let minRatio, maxRatio;
  switch(streamLayout.value) {
    case 'waterfall':
      minRatio = 0.55; maxRatio = 1.60;
      break;
    case 'grid':
      switch(gridAspectRatio.value) {
        case '4:3': return (3/4) * 100;
        case '3:4': return (4/3) * 100;
        case '1:1': return 1 * 100;
        default: return (3/4) * 100;
      }
    case 'single':
      minRatio = 0.5; maxRatio = 1.6;
      break;
    default:
      minRatio = 0.75; maxRatio = 0.95;
  }
  const limitedRatio = Math.max(minRatio, Math.min(ratio, maxRatio))
  return (1 / limitedRatio) * 100
}

const formatNumber = (num?: number): string => {
  if (!num) return '0'
  if (num >= 10000) return `${(num / 10000).toFixed(1)}w`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
  return num.toString()
}

const getColumnCount = (): number => {
  if (streamLayout.value === 'single') return 1
  if (windowWidth.value >= 1200) return 3
  if (windowWidth.value >= 768) return 2
  return 1
}

const columns = computed(() => {
  const count = getColumnCount()
  const cols = Array.from({ length: count }, () => [] as PictureVO[])

  if (props.loading || !props.dataList || props.dataList.length === 0) {
    columnHeights.value = new Array(count).fill(0)
    return cols
  }

  if (streamLayout.value === 'grid') {
    props.dataList.forEach((item, index) => cols[index % count].push(item))
    return cols
  }

  columnHeights.value = new Array(count).fill(0)
  props.dataList.forEach(picture => {
    const minHeight = Math.min(...columnHeights.value)
    const targetIndex = columnHeights.value.indexOf(minHeight)
    cols[targetIndex].push(picture)
    const picRatio = picture.picScale || 1
    const limitedRatio = Math.max(0.55, Math.min(picRatio, 1.60))
    columnHeights.value[targetIndex] += (1 / limitedRatio) * 100 + 8
  })
  return cols
})

const handleImageLoad = (picture: PictureVO) => {
  picture.imageLoaded = true
  updateColumnHeights()
  recalculateLayout()
}

const handleImageError = (picture: PictureVO) => {
  picture.imageLoaded = true
  recalculateLayout()
}

const updateColumnHeights = () => {
  nextTick(() => {
    if (!gridRef.value) return
    const cols = gridRef.value.querySelectorAll('.yuemu-masonry-column')
    cols.forEach((col, index) => {
      if (index < columnHeights.value.length) {
        columnHeights.value[index] = (col as HTMLElement).offsetHeight
      }
    })
  })
}

const recalculateLayout = () => {
  requestAnimationFrame(() => {
    nextTick(() => { triggerUpdate.value++ })
  })
}

const doClickPicture = (picture: PictureVO) => {
  if (picture.isDraft === 1) {
    router.push({ name: 'AddPicture', query: { id: picture.id } })
  } else {
    openDetailModal(picture)
  }
}

const openDetailModal = (picture: PictureVO) => {
  selectedPictureId.value = picture.id
  selectedPictureData.value = picture
  detailModalVisible.value = true
}

const handleDetailModalClose = (needReload = false) => {
  detailModalVisible.value = false
  selectedPictureId.value = null
  selectedPictureData.value = null
  if (needReload && props.onReload) props.onReload()
}

const handlePopState = () => {
  if (detailModalVisible.value) {
    detailModalVisible.value = false
    selectedPictureId.value = null
    selectedPictureData.value = null
  }
}

const showReviewModal = (picture: PictureVO) => {
  currentPicture.value = picture
  reviewModalVisible.value = true
}

const getReviewModalTitle = (status?: number): string => {
  if (status === 0) return t('components.waterfallPictureList.reviewing')
  if (status === 1) return t('components.waterfallPictureList.approved')
  if (status === 2) return t('components.waterfallPictureList.rejected')
  return t('components.waterfallPictureList.reviewStatus')
}

const handleResize = throttle(() => {
  windowWidth.value = window.innerWidth
  recalculateLayout()
}, 200)

watch(() => props.dataList, () => recalculateLayout(), { deep: true })

watch([windowWidth, streamLayout], () => {
  columnHeights.value = new Array(getColumnCount()).fill(0)
  recalculateLayout()
})

const handleStreamLayoutChange = (event: CustomEvent) => {
  if (event.detail) {
    streamLayout.value = event.detail.layout || streamLayout.value
    if (event.detail.aspectRatio && streamLayout.value === 'grid') {
      gridAspectRatio.value = event.detail.aspectRatio
      localStorage.setItem('gridAspectRatio', event.detail.aspectRatio)
    }
    localStorage.setItem('streamLayout', streamLayout.value)
  }
  columnHeights.value = new Array(getColumnCount()).fill(0)
  recalculateLayout()
}

onMounted(() => {
  loadStreamLayout()
  window.addEventListener('resize', handleResize)
  window.addEventListener('streamLayoutChanged', handleStreamLayoutChange)
  window.addEventListener('popstate', handlePopState)
  if (gridRef.value) new ResizeObserver(handleResize).observe(gridRef.value)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('streamLayoutChanged', handleStreamLayoutChange)
  window.removeEventListener('popstate', handlePopState)
})
</script>

<style lang="scss" scoped>
/* 核心缓动曲线：苹果经典的 Spring 感觉 */
$yuemu-ease-spring: cubic-bezier(0.25, 0.1, 0.25, 1);
$yuemu-ease-smooth: cubic-bezier(0.2, 0.8, 0.2, 1);

:deep(.yuemu-picture-detail-modal) {
  .ant-modal-content { background: transparent; box-shadow: none; padding: 0; }
  .ant-modal-close {
    color: #fff; background: rgba(255,255,255,0.1); backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.2); border-radius: 50%; top: 16px; right: 16px; z-index: 1;
    transition: all 0.3s $yuemu-ease-smooth;
    &:hover { background: rgba(255,255,255,0.2); transform: scale(1.05); }
  }
}

.yuemu-pc-picture-list {
  width: 100%; margin: 0; padding: 0; box-sizing: border-box; min-width: 320px;
}

.yuemu-masonry-wrapper { width: 100%; margin: 0 auto; box-sizing: border-box; }

.yuemu-empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px; text-align: center;
  min-height: 500px; width: 100%; background: var(--card-background); border-radius: 16px; margin: 16px auto;
  border: 1px solid var(--border-color); box-shadow: 0 4px 24px rgba(0, 0, 0, 0.02);
  .yuemu-empty-image { width: 240px; height: 240px; margin-bottom: 24px; opacity: 0.8; }
  .yuemu-empty-text {
    h3 { font-size: 18px; color: var(--text-primary); margin-bottom: 8px; font-weight: 600; letter-spacing: 0.5px; }
    p { font-size: 14px; color: var(--text-secondary); margin: 0; }
  }
}

.yuemu-masonry-grid {
  display: flex; gap: 16px; width: 100%; box-sizing: border-box; justify-content: flex-start;
  flex-wrap: nowrap !important; padding: 8px 4px 40px 4px;
}

.yuemu-masonry-column {
  flex: 1 0 calc((100% - 32px) / 3) !important; min-width: 0; display: flex; flex-direction: column; gap: 16px; box-sizing: border-box;
}

.yuemu-masonry-column.yuemu-single-column { flex: 1 0 100% !important; }
.yuemu-masonry-column.yuemu-grid-column { flex: 1 0 calc((100% - 16px) / 2) !important; }

.yuemu-card-spacing {
  width: 100%; margin-bottom: 16px; box-sizing: border-box;
  &:last-child { margin-bottom: 0; }
}

/* 优雅的骨架屏（ Shimmer 流光效果 ） */
.yuemu-column-skeleton { display: flex; flex-direction: column; gap: 16px; }

.yuemu-skeleton-item {
  border-radius: 16px; overflow: hidden; background: var(--card-background);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03); width: 100%; min-height: 240px;
  border: 1px solid var(--border-color);
}

.yuemu-skeleton-shimmer {
  width: 100%; height: 300px; min-height: 240px;
  background: linear-gradient(90deg,
    rgba(200, 200, 200, 0.06) 25%,
    rgba(200, 200, 200, 0.15) 37%,
    rgba(200, 200, 200, 0.06) 63%
  );
  background-size: 400% 100%;
  animation: yuemu-shimmer-loading 1.5s ease infinite;
}

@keyframes yuemu-shimmer-loading {
  0% { background-position: 100% 50%; }
  100% { background-position: 0 50%; }
}

/* 卡片基础设计：更圆润、更通透 */
.yuemu-masonry-item {
  width: 100%; border-radius: 16px; overflow: hidden; cursor: pointer;
  background: var(--card-background);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  transition: all 0.4s $yuemu-ease-spring;
  position: relative; border: 1px solid rgba(0, 0, 0, 0.03); box-sizing: border-box;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 16px 32px rgba(0, 0, 0, 0.08); /* 弥散高级阴影 */

    .yuemu-hover-overlay { opacity: 1; }
    .yuemu-masonry-image { transform: scale(1.02); } /* 克制的缩放 */
  }
  &.yuemu-draft { opacity: 0.8; filter: grayscale(15%); }
}

.yuemu-image-wrapper {
  position: relative; width: 100%; overflow: hidden; background: var(--hover-background); box-sizing: border-box;
}

.yuemu-aspect-ratio-box { position: relative; width: 100%; height: 0; overflow: hidden; box-sizing: border-box; }

/* 占位符与图片加载：模糊渐隐渲染 */
.yuemu-image-placeholder {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  background-color: var(--hover-background); z-index: 1;
  transition: opacity 0.6s ease;
  &.yuemu-hidden { opacity: 0; }
}

.yuemu-masonry-image {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;
  /* 核心：初始状态为模糊、透明、轻微放大 */
  opacity: 0;
  filter: blur(12px);
  transform: scale(1.05);
  transition: opacity 0.8s $yuemu-ease-smooth,
  filter 0.8s $yuemu-ease-smooth,
  transform 0.8s $yuemu-ease-smooth;
  box-sizing: border-box;
  z-index: 2;

  &.yuemu-loaded {
    opacity: 1;
    filter: blur(0);
    transform: scale(1);
  }
}

/* 毛玻璃（Glassmorphism） UI 组件 */
.yuemu-image-view-count {
  position: absolute; bottom: 12px; right: 12px; z-index: 5; display: flex; align-items: center; gap: 4px;
  padding: 4px 10px; border-radius: 12px;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: saturate(180%) blur(12px); /* 苹果风高斯模糊 */
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #ffffff; font-size: 11px; font-weight: 500;
  transition: all 0.3s ease;
  .yuemu-view-icon { font-size: 10px; }
}

.yuemu-image-badges { position: absolute; top: 12px; left: 12px; display: flex; gap: 6px; z-index: 2; }

.yuemu-badge {
  display: flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 12px;
  font-size: 11px; font-weight: 600; letter-spacing: 0.5px;
  backdrop-filter: saturate(180%) blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.yuemu-feature-badge { background: rgba(0, 102, 179, 0.7); color: #fff; }
.yuemu-draft-badge { background: rgba(100, 116, 139, 0.7); color: #fff; }

.yuemu-review-status { position: absolute; top: 12px; right: 12px; z-index: 2; }

.yuemu-review-button {
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: saturate(180%) blur(16px);
  border-radius: 12px; padding: 4px 12px; font-size: 11px; font-weight: 500;
  height: auto; display: flex; align-items: center; gap: 4px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  color: var(--text-primary);
  transition: all 0.3s $yuemu-ease-spring;
  &:hover { transform: scale(1.05); background: rgba(255, 255, 255, 0.9); }
}

/* 悬浮遮罩：平滑的深色渐变与微调的 Typography */
.yuemu-hover-overlay {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.2) 40%, transparent 60%);
  opacity: 0; transition: opacity 0.4s $yuemu-ease-smooth; display: flex; align-items: flex-end;
  justify-content: flex-start; padding: 20px 16px 16px; z-index: 2; box-sizing: border-box;
}

.yuemu-overlay-content { width: 100%; box-sizing: border-box; display: flex; flex-direction: column; gap: 10px; transform: translateY(4px); transition: transform 0.4s $yuemu-ease-smooth; }
.yuemu-masonry-item:hover .yuemu-overlay-content { transform: translateY(0); }

.yuemu-picture-title {
  font-size: 15px; color: #fff; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3); line-height: 1.4;
  font-weight: 600; display: -webkit-box; -webkit-line-clamp: 2;
  -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; box-sizing: border-box;
}

.yuemu-user-info {
  display: flex; align-items: center; gap: 8px;
  .yuemu-user-avatar {
    width: 24px !important; height: 24px !important; border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.2);
    opacity: 0; transition: opacity 0.5s ease; box-sizing: border-box;
    &.yuemu-loaded { opacity: 1; }
  }
  .yuemu-user-meta {
    flex: 1; display: flex; flex-direction: column; gap: 1px;
    .yuemu-user-name {
      font-size: 13px; font-weight: 500; color: rgba(255, 255, 255, 0.9);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
  }
}

/* 弹窗设计提升 */
.yuemu-review-modal {
  :deep(.ant-modal-content) {
    border-radius: 20px; overflow: hidden; box-shadow: 0 24px 48px rgba(0, 0, 0, 0.12);
    border: 1px solid rgba(0, 0, 0, 0.05); padding: 0;
  }
  :deep(.ant-modal-header) { border-bottom: 1px solid var(--border-color); padding: 20px 24px; }
  :deep(.ant-modal-title) { font-size: 17px; font-weight: 600; text-align: center; color: var(--text-primary); letter-spacing: 0.5px;}
  :deep(.ant-modal-body) { padding: 32px 24px; }
}

.yuemu-review-detail { text-align: center; padding: 24px; background: var(--hover-background); border-radius: 16px; }

.yuemu-status-icon-large {
  font-size: 56px; margin-bottom: 24px;
  .yuemu-pending { color: #1890ff; filter: drop-shadow(0 4px 12px rgba(24, 144, 255, 0.2)); }
  .yuemu-approved { color: #52c41a; filter: drop-shadow(0 4px 12px rgba(82, 196, 26, 0.2)); }
  .yuemu-rejected { color: #ff4d4f; filter: drop-shadow(0 4px 12px rgba(255, 77, 79, 0.2)); }
}

.yuemu-review-message { font-size: 16px; font-weight: 500; color: var(--text-primary); line-height: 1.6; padding: 0 16px; }

/* 响应式调整 */
@media screen and (max-width: 1200px) {
  .yuemu-masonry-column { flex: 1 0 calc((100% - 16px) / 2) !important; }
}

@media screen and (max-width: 768px) {
  .yuemu-masonry-grid { gap: 12px; }
  .yuemu-column-skeleton, .yuemu-masonry-column { gap: 12px; }
  .yuemu-masonry-column { flex: 1 0 calc((100% - 12px) / 2) !important; }
  .yuemu-masonry-item { border-radius: 12px; }
}

@media screen and (max-width: 480px) {
  .yuemu-masonry-column { flex: 1 0 100% !important; }
  .yuemu-masonry-item:hover { transform: none; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04); }
}

/* 适配深色模式的玻璃质感 */
@media (prefers-color-scheme: dark) {
  .yuemu-masonry-item { border-color: rgba(255, 255, 255, 0.05); }
  .yuemu-review-button {
    background: rgba(30, 30, 30, 0.75); border-color: rgba(255, 255, 255, 0.1); color: #fff;
    &:hover { background: rgba(45, 45, 45, 0.9); }
  }
}

/* 移动端强制移除点击时的悬停缩放，防止底层长按死锁 */
@media (max-width: 768px) {
  .ant-card-hoverable:active, .ant-card-hoverable:hover,
  .ant-card-hoverable:active *, .ant-card-hoverable:hover *,
  .yuemu-review-button:active, .yuemu-review-button:hover,
  .yuemu-review-button:active *, .yuemu-review-button:hover *,
  .yuemu-masonry-item:active, .yuemu-masonry-item:hover,
  .yuemu-masonry-item:active *, .yuemu-masonry-item:hover *,
  .ant-modal-close:active, .ant-modal-close:hover,
  .ant-modal-close:active *, .ant-modal-close:hover * {
    transform: none !important;
  }
}
</style>
