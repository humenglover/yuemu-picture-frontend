<template>
  <div class="yuemu-big-picture-list" ref="containerRef">
    <div v-if="loading && (!props.dataList || props.dataList.length === 0)" class="yuemu-skeleton-wrap">
      <div class="yuemu-skeleton-row" style="height: 200px">
        <div class="yuemu-skeleton-cell" style="flex: 1.5"></div>
        <div class="yuemu-skeleton-cell" style="flex: 1"></div>
        <div class="yuemu-skeleton-cell" style="flex: 1.2"></div>
      </div>
      <div class="yuemu-skeleton-row" style="height: 240px">
        <div class="yuemu-skeleton-cell" style="flex: 1"></div>
        <div class="yuemu-skeleton-cell" style="flex: 1.8"></div>
      </div>
      <div class="yuemu-skeleton-row" style="height: 180px">
        <div class="yuemu-skeleton-cell" style="flex: 1.2"></div>
        <div class="yuemu-skeleton-cell" style="flex: 1.3"></div>
        <div class="yuemu-skeleton-cell" style="flex: 0.8"></div>
      </div>
    </div>

    <div v-else-if="!loading && (!props.dataList || props.dataList.length === 0)" class="yuemu-empty-state">
      <div class="yuemu-custom-empty-state">
        <img :src="emptyImage" :alt="$t('components.bigPicture.emptyAlt')" class="yuemu-empty-illustration" />
        <h3 class="yuemu-empty-title">{{ t('components.bigPicture.noDataTitle') }}</h3>
        <p class="yuemu-empty-desc">{{ t('components.bigPicture.noDataDesc') }}</p>
      </div>
    </div>

    <div v-else class="yuemu-justified-feed">
      <template v-for="(row, rowIndex) in justifiedRows" :key="rowIndex">
        <div
          class="yuemu-justified-row"
        :style="{ height: (row.height + 64) + 'px' }"
      >
        <div
          v-for="picture in row.pictures"
          :key="picture.id"
          class="yuemu-justified-item"
          :class="{ 'is-ad-item': (picture as any).isAd }"
          :data-pic-id="picture.id"
          :style="{ width: picture.rowWidth + 'px' }"
          @click.stop.prevent="!(picture as any).isAd && doClickPicture(picture)"
        >
          <div class="yuemu-j-image-box" :style="{ height: row.height + 'px' }">
            <template v-if="(picture as any).isAd">
              <div class="yuemu-inline-ad-wrapper" style="position: absolute; inset: 0; width: 100%; height: 100%;">
                <GlobalAdBanner class="yuemu-inline-ad" format="rectangle" margin="0" :fillHeight="true" />
              </div>
            </template>
            <template v-else>
              <div class="yuemu-j-placeholder" v-if="!imageLoadedMap[picture.id]"></div>

            <img
              :src="picture.thumbnailUrl || picture.url || '/default-image.png'"
              :alt="picture.name || $t('components.bigPicture.emptyAlt')"
              class="yuemu-j-image"
              :class="{ 'yuemu-is-loaded': imageLoadedMap[picture.id] }"
              referrerpolicy="no-referrer-when-downgrade"
              @load="handleImageLoad(picture.id)"
              @error="handleImageLoad(picture.id)"
            />

            <!-- 常驻显示的徽标区（如审核状态、精选等） -->
            <div class="yuemu-always-visible-badges">
              <div class="yuemu-item-badges">
                <div
                  v-if="isMyPosts && picture.isDraft !== 1 && picture.reviewStatus !== 1"
                  class="yuemu-review-status-dot-wrap"
                  :title="getStatusText(picture.reviewStatus)"
                  @click.stop="showReviewModal(picture)"
                >
                  <span class="yuemu-status-dot" :class="'yuemu-status-' + picture.reviewStatus"></span>
                </div>
                <div v-if="picture.isFeature === 1" class="yuemu-badge-tag yuemu-feature">{{ t('components.bigPicture.featured') }}</div>
                <div v-else-if="picture.isDraft === 1" class="yuemu-badge-tag yuemu-draft">{{ t('components.bigPicture.draft') }}</div>
              </div>
            </div>

            </template>
          </div>
          
          <div class="yuemu-bottom-info">
            <template v-if="!(picture as any).isAd">
              <div class="yuemu-bottom-title">{{ picture.name || t('components.bigPicture.unnamed') }}</div>
              <div class="yuemu-bottom-meta" v-if="picture.isDraft !== 1 && picture.user">
                <div class="yuemu-user-meta">
                  <img
                    :src="picture.user.userAvatar || getDefaultAvatar(picture.user.userName)"
                    class="yuemu-u-avatar"
                    :class="{ 'yuemu-loaded': avatarLoadedMap[picture.id] }"
                    @load="handleAvatarLoad(picture.id)"
                  />
                  <span class="yuemu-u-name">{{ picture.user.userName }}</span>
                </div>
                <span class="yuemu-view-count"><i class="fas fa-eye"></i> {{ formatNumber(picture.viewCount) }}</span>
              </div>
            </template>
            <template v-else>
              <div class="yuemu-bottom-title" style="color: var(--text-secondary);">
                {{ t('components.bigPicture.sponsoredTitle') }}
              </div>
              <div class="yuemu-bottom-meta">
                <div class="yuemu-user-meta">
                  <div class="yuemu-u-avatar yuemu-loaded" style="background: #52c41a; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 10px;">
                    <i class="fas fa-ad"></i>
                  </div>
                  <span class="yuemu-u-name" style="color: var(--text-secondary); font-size: 12px;">{{ t('components.bigPicture.sponsored') }}</span>
                </div>
                <span class="yuemu-view-count" style="font-size: 12px; color: var(--text-secondary);">{{ t('components.globalAd.adsense') || 'AdSense' }}</span>
              </div>
            </template>
          </div>
          </div>
        </div>
      </template>
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
      :centered="true"
    >
      <div class="yuemu-review-detail-box">
        <div class="yuemu-status-icon-box">
          <i class="fas fa-clock" v-if="currentPicture?.reviewStatus === 0"></i>
          <i class="fas fa-check-circle" v-else-if="currentPicture?.reviewStatus === 1"></i>
          <i class="fas fa-times-circle" v-else-if="currentPicture?.reviewStatus === 2"></i>
        </div>
        <p class="yuemu-status-msg"> 
          <template v-if="currentPicture?.reviewStatus === 0">{{ t('components.bigPicture.reviewProcessing') }}</template>
          <template v-else-if="currentPicture?.reviewStatus === 1">{{ t('components.bigPicture.reviewPassed') }}</template>
          <template v-else-if="currentPicture?.reviewStatus === 2">{{ currentPicture?.reviewMessage || t('components.bigPicture.reviewRejected') }}</template>
        </p>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, reactive, nextTick, inject } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Modal as AModal } from 'ant-design-vue'
import { getDefaultAvatar } from '@/utils/userUtils'
import emptyImage from '@/assets/illustrations/empty.png'
import { throttle } from 'lodash-es'
import PictureDetailView from './PictureDetailView.vue'
import GlobalAdBanner from './GlobalAdBanner.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface PictureVO {
  id: string | number
  url: string
  thumbnailUrl?: string
  name?: string
  picScale?: number
  isFeature?: number
  reviewStatus?: number
  reviewMessage?: string
  viewCount?: number
  isDraft?: number
  user?: {
    id: string | number
    userName: string
    userAvatar: string
  }
}

interface JustifiedRow {
  pictures: (PictureVO & { rowWidth: number })[]
  height: number
  isLastRow?: boolean
}

const props = withDefaults(defineProps<{
  dataList?: PictureVO[]
  loading?: boolean
  showOp?: boolean
  onReload?: () => void
  isMyPosts?: boolean
}>(), {
  dataList: () => [],
  loading: false,
  showOp: false,
  onReload: () => {},
  isMyPosts: false,
})

const router = useRouter()
const route = useRoute()
const containerRef = ref<HTMLElement | null>(null)
const containerWidth = ref(0)
const windowWidth = ref(window.innerWidth)

const detailModalVisible = ref(false)
const selectedPictureId = ref<string | number | null>(null)
const selectedPictureData = ref<PictureVO | null>(null)

const isMobile = computed(() => windowWidth.value <= 768)
const GAP = computed(() => isMobile.value ? 4 : 12)
const TARGET_HEIGHT = computed(() => isMobile.value ? 300 : 340)
const MOBILE_MAX_ITEMS = 2
const PC_MAX_ITEMS = 5

const imageLoadedMap = reactive<Record<string | number, boolean>>({})
const avatarLoadedMap = reactive<Record<string | number, boolean>>({})

const reviewModalVisible = ref(false)
const currentPicture = ref<PictureVO | null>(null)
const enableAds = inject('enableAds', false)

const justifiedRows = computed(() => {
  const originalList = props.dataList
  if (!originalList || originalList.length === 0) return []

  // 核心：像拼积木一样将广告对象作为真实数据插入瀑布流数组
  const list = []
  let adCounter = 0
  for (let i = 0; i < originalList.length; i++) {
    list.push(originalList[i])
    // 在第 4 张图片后插入一张广告，之后每隔 10 张插入
    if (enableAds && (i === 3 || (i > 3 && (i - 3) % 10 === 0))) {
      adCounter++
      list.push({
        id: 'ad-slot-' + adCounter,
        isAd: true,
        picScale: 1.0, // 宽/高比 = 1，完美矩形广告
        url: '',
      } as any)
    }
  }

  const availableWidth = Math.floor(containerWidth.value > 0 ? containerWidth.value : window.innerWidth)

  const rows: JustifiedRow[] = []
  let currentRow: any[] = []
  let rowNaturalWidth = 0

  const buildRow = (items: any[], isLast: boolean): JustifiedRow => {
    const totalGaps = GAP.value * (items.length - 1)
    const usableWidth = Math.max(0, availableWidth - totalGaps)
    const totalScale = items.reduce((sum, item) => sum + (item.picScale || 1.1), 0)

    let rowHeight: number
    const naturalRowWidth = totalScale * TARGET_HEIGHT.value
    const isFullRow = !isLast || naturalRowWidth >= availableWidth * 0.45

    if (!isFullRow) {
      rowHeight = TARGET_HEIGHT.value
    } else {
      rowHeight = totalScale > 0 ? usableWidth / totalScale : TARGET_HEIGHT.value
      const maxH = TARGET_HEIGHT.value * 2.2
      const minH = TARGET_HEIGHT.value * 0.5
      if (rowHeight > maxH) rowHeight = maxH
      if (rowHeight < minH) rowHeight = minH
    }

    const rowPictures = []
    let currentUsedWidth = 0

    for (let i = 0; i < items.length; i++) {
      const item = items[i]

      if (i < items.length - 1) {
        const itemWidth = Math.floor((item.picScale || 1.1) * rowHeight)
        rowPictures.push({ ...item, rowWidth: itemWidth })
        currentUsedWidth += itemWidth
      } else {
        if (!isFullRow) {
          const itemWidth = Math.floor((item.picScale || 1.1) * rowHeight)
          rowPictures.push({ ...item, rowWidth: itemWidth })
        } else {
          const remainingWidth = usableWidth - currentUsedWidth
          rowPictures.push({ ...item, rowWidth: Math.max(remainingWidth, 0) })
        }
      }
    }

    return { height: rowHeight, pictures: rowPictures, isLastRow: isLast }
  }

  for (let i = 0; i < list.length; i++) {
    const item = list[i]
    currentRow.push(item)
    rowNaturalWidth += (item.picScale || 1.1) * TARGET_HEIGHT.value

    const gaps = GAP.value * (currentRow.length - 1)
    const projectedWidth = rowNaturalWidth + gaps

    const hitMobileLimit = isMobile.value && currentRow.length >= MOBILE_MAX_ITEMS
    const hitPCLimit = !isMobile.value && currentRow.length >= PC_MAX_ITEMS

    if (projectedWidth >= availableWidth * 0.82 || hitMobileLimit || hitPCLimit) {
      rows.push(buildRow(currentRow, false))
      currentRow = []
      rowNaturalWidth = 0
    } else if (i === list.length - 1) {
      rows.push(buildRow(currentRow, true))
    }
  }
  return rows
})

const updateWidth = () => {
  if (containerRef.value) {
    const newWidth = Math.floor(containerRef.value.clientWidth)
    if (containerWidth.value === 0 || Math.abs(containerWidth.value - newWidth) > 25) {
      containerWidth.value = newWidth
    }
  }
  windowWidth.value = window.innerWidth
}

const handleImageLoad = (id: string | number) => {
  imageLoadedMap[id] = true
}
const handleAvatarLoad = (id: string | number) => {
  avatarLoadedMap[id] = true
}

const doClickPicture = (picture: PictureVO) => {
  if (picture.isDraft === 1) {
    router.push({ path: '/add_picture', query: { id: picture.id } })
  } else {
    if (!isMobile.value) {
      openDetailModal(picture)
    } else {
      router.push({
        path: `/picture-redirect/${picture.id}`,
        state: { pictureData: JSON.parse(JSON.stringify(picture)) }
      })
    }
  }
}

const openDetailModal = (picture: any) => {
  selectedPictureId.value = picture.id
  selectedPictureData.value = picture
  detailModalVisible.value = true
}

const handleDetailModalClose = (needReload = false) => {
  detailModalVisible.value = false
  selectedPictureId.value = null
  selectedPictureData.value = null
  if (needReload && props.onReload) {
    props.onReload()
  }
}

const handlePopState = (event: PopStateEvent) => {
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

const getStatusText = (status?: number) => {
  if (status === 0) return t('components.bigPicture.statusReviewing')
  if (status === 1) return t('components.bigPicture.statusPassed')
  if (status === 2) return t('components.bigPicture.statusRejected')
  return ''
}

const getReviewModalTitle = (status?: number) => {
  if (status === 0) return t('components.bigPicture.modalTitleReviewing')
  if (status === 1) return t('components.bigPicture.modalTitlePassed')
  if (status === 2) return t('components.bigPicture.modalTitleRejected')
  return t('components.bigPicture.modalTitleStatus')
}

const formatNumber = (num?: number) => {
  if (!num) return '0'
  return num > 10000 ? (num / 10000).toFixed(1) + 'w' : num
}

let resizeObserver: ResizeObserver | null = null

onMounted(async () => {
  await nextTick()
  updateWidth()
  window.addEventListener('resize', throttle(updateWidth, 200))
  window.addEventListener('popstate', handlePopState)
  resizeObserver = new ResizeObserver(throttle(updateWidth, 100))
  if (containerRef.value) resizeObserver.observe(containerRef.value)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateWidth)
  window.removeEventListener('popstate', handlePopState)
  if (resizeObserver) resizeObserver.disconnect()
})
</script>

<style lang="scss" scoped>
.yuemu-big-picture-list {
  width: 100%;
  box-sizing: border-box;
}

:deep(.yuemu-picture-detail-modal) {
  .ant-modal-content {
    background: transparent;
    box-shadow: none;
    padding: 0;
  }
  .ant-modal-close {
    color: #fff;
    background: rgba(0,0,0,0.3);
    border-radius: 50%;
    top: 16px;
    right: 16px;
    z-index: 1;
    &:hover { background: rgba(0,0,0,0.5); }
  }
}

.yuemu-empty-state {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  text-align: center;
}

.yuemu-custom-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.yuemu-empty-illustration {
  width: 100%;
  max-width: 300px;
  height: auto;
  opacity: 0.85;
  filter: drop-shadow(0 15px 30px rgba(0, 0, 0, 0.05));
}

.yuemu-empty-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.yuemu-empty-desc {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.yuemu-justified-feed {
  width: 100%;
  transition: opacity 0.3s ease;
}

.yuemu-justified-row {
  display: flex;
  width: 100%;
  box-sizing: border-box;
  justify-content: flex-start;
  gap: 4px;
  margin-bottom: 4px;
  @media (min-width: 769px) {
    gap: 12px;
    margin-bottom: 12px;
  }
}

.yuemu-justified-item {
  position: relative;
  cursor: pointer;
  background: transparent;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}

/* 移动端彻底干掉所有点击时的 transform */
@media (max-width: 768px) {
  .yuemu-justified-item:active, .yuemu-justified-item:hover {
    transform: none !important;
  }
}

.yuemu-j-image-box {
  width: 100%;
  height: 100%;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
}

.yuemu-j-placeholder {
  position: absolute;
  inset: 0;
  background: linear-gradient(110deg, var(--hover-background) 8%, var(--border-color) 18%, var(--hover-background) 33%);
  background-size: 200% 100%;
  animation: yuemu-shine 1.5s linear infinite;
}

@keyframes yuemu-shine {
  to { background-position-x: -200%; }
}

.yuemu-j-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.4s ease, transform 0.5s ease;
  &.yuemu-is-loaded { opacity: 1; }
}


.yuemu-always-visible-badges {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 1;
  pointer-events: auto;
}
@media (min-width: 769px) {
  .yuemu-always-visible-badges {
    top: 12px;
    left: 12px;
  }
}

.yuemu-bottom-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 64px;
  padding: 8px 4px;
  background: transparent;
  box-sizing: border-box;
}

.yuemu-bottom-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 6px;
}

.yuemu-bottom-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.yuemu-user-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow: hidden;
  flex: 1;
}

.yuemu-u-avatar {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.3s ease;
  &.yuemu-loaded { opacity: 1; }
}

.yuemu-u-name {
  font-size: 11px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.yuemu-view-count {
  font-size: 11px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}



.yuemu-item-badges { display: flex; gap: 4px; }

.yuemu-badge-tag {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  color: #fff;
  backdrop-filter: blur(4px);
  &.yuemu-feature { background: #3b82f6; }
  &.yuemu-draft { background: #64748b; }
}

.yuemu-review-status-dot-wrap {
  background: rgba(0, 0, 0, 0.4);
  padding: 4px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  pointer-events: auto;
  backdrop-filter: blur(4px);
  .yuemu-status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    &.yuemu-status-0 { background: #1890ff; }
    &.yuemu-status-1 { background: #52c41a; }
    &.yuemu-status-2 { background: #ff4d4f; }
  }
}

.yuemu-skeleton-wrap { display: flex; flex-direction: column; gap: 4px; padding: 0 2px; }
.yuemu-skeleton-row { display: flex; gap: 4px; margin-bottom: 4px; }
.yuemu-skeleton-cell {
  background: linear-gradient(90deg, var(--hover-background) 25%, var(--border-color) 37%, var(--hover-background) 63%);
  background-size: 400% 100%;
  border-radius: 8px;
  animation: yuemu-skeleton-loading 1.4s ease infinite;
}

@keyframes yuemu-skeleton-loading {
  0% { background-position: 100% 50%; }
  100% { background-position: 0 50%; }
}

/* 内嵌式广告组件的满铺适配 */
.is-ad-item {
  box-shadow: none !important;
  background: transparent !important;
}
.yuemu-inline-ad {
  width: 100% !important;
  height: 100% !important;
  display: block;
}
:deep(.yuemu-inline-ad .yuemu-global-ad-container),
:deep(.yuemu-inline-ad .yuemu-ad-inner) {
  height: 100% !important;
  max-width: 100% !important;
  border-radius: 8px !important;
  margin: 0 !important;
}

.yuemu-review-detail-box { padding: 30px 20px; text-align: center; }


.yuemu-inline-ad-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 8px;
  overflow: hidden;
  background: var(--card-background);
}
.yuemu-status-icon-box {
  font-size: 40px;
  margin-bottom: 16px;
  .fa-clock { color: #1890ff; }
  .fa-check-circle { color: #52c41a; }
  .fa-times-circle { color: #ff4d4f; }
}
.yuemu-status-msg { font-size: 15px; color: var(--text-primary); line-height: 1.6; }

/* 移动端强制移除点击时的悬停缩放，防止底层长按死锁 */
@media (max-width: 768px) {
  .ant-card-hoverable:active, .ant-card-hoverable:hover,
  .ant-card-hoverable:active *, .ant-card-hoverable:hover *,
  .ant-modal-close:active, .ant-modal-close:hover,
  .ant-modal-close:active *, .ant-modal-close:hover *,
  .yuemu-justified-item:active, .yuemu-justified-item:hover,
  .yuemu-justified-item:active *, .yuemu-justified-item:hover * {
    transform: none !important;
  }
}
</style>

