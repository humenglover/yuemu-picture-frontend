<template>
  <div class="yuemu-immersive-ranking-list" ref="containerRef">
    <div v-if="loading && (!dataList || dataList.length === 0)" class="yuemu-justified-feed yuemu-skeleton-wrap">
      <div v-for="(row, rowIndex) in skeletonRows" :key="`skeleton-row-${rowIndex}`" class="yuemu-justified-row" :style="{ height: row.height + 'px' }">
        <div v-for="(item, itemIndex) in row.items" :key="`skeleton-item-${itemIndex}`" class="yuemu-justified-item yuemu-skeleton-anim" :style="{ width: item.rowWidth + 'px' }"></div>
      </div>
    </div>

    <div v-else-if="!loading && (!dataList || dataList.length === 0)" class="yuemu-empty-state">
      <a-empty :description="t('components.pictureRankingList.emptyList')" />
    </div>

    <div v-else class="yuemu-justified-feed">
      <div v-for="(row, rowIndex) in justifiedRows" :key="rowIndex" class="yuemu-justified-row" :style="{ height: (row.height + 64) + 'px' }">
        <div
          v-for="picture in row.pictures"
          :key="picture.id"
          class="yuemu-justified-item"
          :data-pic-id="picture.id"
          :style="{ width: picture.rowWidth + 'px' }"
          @click.stop.prevent="doClickPicture(picture)"
        >
          <div class="yuemu-j-image-box" :style="{ height: row.height + 'px' }">
            <div class="yuemu-thumb-placeholder yuemu-skeleton-anim" v-show="!loadedImages[picture.id]"></div>

            <img
              :src="picture.thumbnailUrl || picture.url"
              :alt="picture.name || t('components.pictureRankingList.collectionPicture')"
              class="yuemu-j-image yuemu-real-img"
              :class="{ 'yuemu-is-loaded': loadedImages[picture.id] }"
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
              @load="onImageLoad(picture.id)"
              @error="onImageLoad(picture.id)"
            />

            <div class="yuemu-rank-badge" :class="picture._rankIndex < 3 ? `yuemu-top-${picture._rankIndex + 1}` : 'yuemu-top-other'">
              <i class="fas fa-crown" v-if="picture._rankIndex < 3"></i>
              <span class="rank-num">{{ picture._rankIndex + 1 }}</span>
            </div>
          </div>

          <div class="yuemu-bottom-info">
            <h3 class="yuemu-bottom-title">{{ picture.name || t('components.pictureRankingList.unnamedCollection') }}</h3>
            <div class="yuemu-bottom-meta">
              <div class="yuemu-author" @click.stop="goToUserPage(picture.userId || picture.user?.id)">
                <img :src="picture.user?.userAvatar || getDefaultAvatar(picture.user?.userName)" class="yuemu-avatar" />
                <span class="yuemu-name">{{ picture.user?.userName || t('components.pictureRankingList.mysteryVisitor') }}</span>
              </div>
              <div class="yuemu-stats-row">
                <span class="yuemu-view-count"><i class="fas fa-eye"></i> {{ formatNumber(picture.viewCount) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <PictureDetailView v-if="selectedPictureId" :id="selectedPictureId" :visible="detailModalVisible" :initialData="selectedPictureData" @close="handleDetailModalClose" />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();


import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { throttle } from 'lodash-es'
import { getDefaultAvatar } from '@/utils/userUtils'
import PictureDetailView from './PictureDetailView.vue'

interface PictureVO { id: string | number; url: string; thumbnailUrl?: string; name?: string; picScale?: number; likeCount?: number; viewCount?: number; userId?: string | number; user?: { id: string | number; userName: string; userAvatar: string } }
interface JustifiedRow { pictures: (PictureVO & { rowWidth: number; _rankIndex: number })[]; height: number; isLastRow?: boolean }

const props = withDefaults(defineProps<{ dataList: PictureVO[]; loading?: boolean; onReload?: () => void }>(), { dataList: () => [], loading: false, onReload: () => {} })

const router = useRouter()
const containerRef = ref<HTMLElement | null>(null)
const containerWidth = ref(0)
const windowWidth = ref(window.innerWidth)
const detailModalVisible = ref(false)
const selectedPictureId = ref<string | number | null>(null)
const selectedPictureData = ref<PictureVO | null>(null)

const isMobile = computed(() => windowWidth.value <= 768)
const GAP = computed(() => isMobile.value ? 4 : 12)
const TARGET_HEIGHT = computed(() => isMobile.value ? 250 : 320)
const CONTAINER_PADDING = computed(() => isMobile.value ? 2 : 8)
const MOBILE_MAX_ITEMS = 2
const PC_MAX_ITEMS = 5

const loadedImages = ref<Record<string, boolean>>({});
const onImageLoad = (id: string | number) => { loadedImages.value[String(id)] = true; };

const computeJustifiedRows = (list: any[], availableWidth: number) => {
  const rows: any[] = []; let currentRow: any[] = []; let rowNaturalWidth = 0
  const buildRow = (items: any[], isLast: boolean) => {
    const totalGaps = GAP.value * (items.length - 1)
    const usableWidth = Math.max(0, availableWidth - totalGaps)
    const totalScale = items.reduce((sum, item) => sum + (item.picScale || 1.1), 0)
    let rowHeight: number
    const naturalRowWidth = totalScale * TARGET_HEIGHT.value
    if (isLast && naturalRowWidth < availableWidth * 0.45) {
      rowHeight = TARGET_HEIGHT.value
    } else {
      rowHeight = totalScale > 0 ? usableWidth / totalScale : TARGET_HEIGHT.value
      const maxH = TARGET_HEIGHT.value * 2.2
      const minH = TARGET_HEIGHT.value * 0.5
      if (rowHeight > maxH) rowHeight = maxH
      if (rowHeight < minH) rowHeight = minH
    }
    return { height: rowHeight, items: items.map(item => ({ ...item, rowWidth: (item.picScale || 1.1) * rowHeight })), isLastRow: isLast }
  }
  for (let i = 0; i < list.length; i++) {
    const item = { ...list[i], _rankIndex: i }; currentRow.push(item); rowNaturalWidth += (item.picScale || 1.1) * TARGET_HEIGHT.value
    const gaps = GAP.value * (currentRow.length - 1); const projectedWidth = rowNaturalWidth + gaps
    const hitMobileLimit = isMobile.value && currentRow.length >= MOBILE_MAX_ITEMS
    const hitPCLimit = !isMobile.value && currentRow.length >= PC_MAX_ITEMS

    if (projectedWidth >= availableWidth * 0.82 || hitMobileLimit || hitPCLimit) {
      rows.push(buildRow(currentRow, false)); currentRow = []; rowNaturalWidth = 0
    } else if (i === list.length - 1) {
      rows.push(buildRow(currentRow, true))
    }
  }
  return rows
}

const justifiedRows = computed(() => {
  if (!props.dataList || props.dataList.length === 0) return []
  const availableWidth = Math.max(300, (containerWidth.value || window.innerWidth) - CONTAINER_PADDING.value)
  const rows = computeJustifiedRows(props.dataList, availableWidth)
  return rows.map(r => ({ ...r, pictures: r.items })) as JustifiedRow[]
})

const skeletonRows = computed(() => {
  const availableWidth = Math.max(300, (containerWidth.value || window.innerWidth) - CONTAINER_PADDING.value)
  const fakeItems = Array.from({ length: 6 }).map(() => ({ picScale: Math.random() * (1.6 - 0.7) + 0.7 }))
  return computeJustifiedRows(fakeItems, availableWidth)
})

const updateWidth = () => { if (containerRef.value) { containerWidth.value = Math.floor(containerRef.value.clientWidth) }; windowWidth.value = window.innerWidth }
const formatNumber = (num: number | string | undefined | null) => { if (num === undefined || num === null || num === '') return '0'; const n = typeof num === "string" ? parseInt(num, 10) : num; if (isNaN(n)) return '0'; return n >= 10000 ? (n / 10000).toFixed(1) + "w" : n.toString() }
const doClickPicture = (picture: any) => { if (!isMobile.value) { selectedPictureId.value = picture.id; selectedPictureData.value = picture; detailModalVisible.value = true } else { router.push({ path: `/picture-redirect/${picture.id}`, state: { pictureData: JSON.parse(JSON.stringify(picture)) } }) } }
const goToUserPage = (userId: string | number | undefined) => { if (userId) router.push(`/user/${userId}`) }
const handleDetailModalClose = (needReload = false) => { detailModalVisible.value = false; selectedPictureId.value = null; selectedPictureData.value = null; if (needReload && props.onReload) { props.onReload() } }
const handlePopState = () => { if (detailModalVisible.value) { detailModalVisible.value = false; selectedPictureId.value = null; selectedPictureData.value = null } }

let resizeObserver: ResizeObserver | null = null
onMounted(async () => { await nextTick(); updateWidth(); window.addEventListener('resize', throttle(updateWidth, 200)); window.addEventListener('popstate', handlePopState); if (containerRef.value) { resizeObserver = new ResizeObserver(throttle(updateWidth, 100)); resizeObserver.observe(containerRef.value) } })
onUnmounted(() => { window.removeEventListener('resize', updateWidth); window.removeEventListener('popstate', handlePopState); if (resizeObserver) resizeObserver.disconnect() })
</script>

<style scoped lang="scss">:deep(.yuemu-picture-detail-modal) { .ant-modal-content { background: transparent; box-shadow: none; padding: 0; } .ant-modal-close { color: #fff; background: rgba(0,0,0,0.3); border-radius: 50%; top: 16px; right: 16px; z-index: 10; &:hover { background: rgba(0,0,0,0.5); } } }

.yuemu-immersive-ranking-list {
  width: 100%;
  .yuemu-empty-state { padding: 80px 0; display: flex; justify-content: center; }
  .yuemu-justified-feed { width: 100%; }
  .yuemu-justified-row { display: flex; justify-content: center; width: 100%; box-sizing: border-box; gap: 4px; margin-bottom: 4px; @media (min-width: 769px) { gap: 12px; margin-bottom: 12px; } }
  .yuemu-justified-item { position: relative; cursor: pointer; background: transparent; flex-shrink: 0; display: flex; flex-direction: column; }
  .yuemu-j-image-box { width: 100%; height: 100%; position: relative; border-radius: 12px; overflow: hidden; @media (max-width: 768px) { border-radius: 8px; } }
  .yuemu-j-image { width: 100%; height: 100%; object-fit: cover; display: block; }

  .yuemu-rank-badge {
    position: absolute;
    top: -1px;
    left: -1px;
    width: 54px;
    height: 58px;
    padding: 4px 14px 14px 0; /* right=14, bottom=14 for the transparent curve area */
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    z-index: 10;
    color: #fff;
    @media (max-width: 768px) {
      width: 44px;
      height: 48px;
      padding: 3px 12px 12px 0;
    }

    .fas {
      font-size: 14px;
      @media (max-width: 768px) { font-size: 11px; }
    }
    .rank-num {
      font-size: 18px;
      font-weight: 900;
      font-family: 'Arial Black', Impact, sans-serif;
      line-height: 1;
      @media (max-width: 768px) { font-size: 15px; }
    }

    &::before {
      content: '';
      position: absolute;
      inset: 0;
      z-index: -1;
      background: rgba(0, 0, 0, 0.4);
      mask-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 54 58' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 0 0 L 54 0 A 14 14 0 0 0 40 14 L 40 32 A 12 12 0 0 1 28 44 L 14 44 A 14 14 0 0 0 0 58 Z'/%3E%3C/svg%3E");
      mask-size: 100% 100%;
      -webkit-mask-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 54 58' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 0 0 L 54 0 A 14 14 0 0 0 40 14 L 40 32 A 12 12 0 0 1 28 44 L 14 44 A 14 14 0 0 0 0 58 Z'/%3E%3C/svg%3E");
      -webkit-mask-size: 100% 100%;
    }

    &.yuemu-top-1::before {
      background: linear-gradient(135deg, #FFD000 0%, #FF8A00 100%);
    }
    &.yuemu-top-2 {
      color: #2563eb;
    }
    &.yuemu-top-2::before {
      background: linear-gradient(135deg, #e2ebff 0%, #c1d5ff 100%);
    }
    &.yuemu-top-3::before {
      background: linear-gradient(135deg, #eab07f 0%, #c8864f 100%);
    }
    &.yuemu-top-other::before {
      background: rgba(0, 0, 0, 0.5);
    }
  }
  .yuemu-bottom-info { display: flex; flex-direction: column; justify-content: center; height: 64px; padding: 8px 4px; background: transparent; box-sizing: border-box; .yuemu-bottom-title { font-size: 13px; font-weight: 600; color: var(--text-primary); margin: 0 0 6px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .yuemu-bottom-meta { display: flex; justify-content: space-between; align-items: center; .yuemu-author { display: flex; align-items: center; gap: 6px; cursor: pointer; overflow: hidden; flex: 1; .yuemu-avatar { width: 18px; height: 18px; border-radius: 50%; object-fit: cover; } .yuemu-name { font-size: 11px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } } .yuemu-stats-row { display: flex; align-items: center; gap: 8px; font-size: 11px; color: var(--text-secondary); flex-shrink: 0; span { display: flex; align-items: center; gap: 4px; } } } }

  @keyframes yuemu-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
  .yuemu-skeleton-anim { background: linear-gradient(90deg, rgba(150, 150, 150, 0.05) 25%, rgba(150, 150, 150, 0.12) 50%, rgba(150, 150, 150, 0.05) 75%); background-size: 400% 100%; animation: yuemu-shimmer 3s infinite linear; border-radius: inherit; }
  .yuemu-thumb-placeholder { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 1; }
  .yuemu-real-img { opacity: 0; transition: opacity 0.4s ease-in-out; position: relative; z-index: 2; &.yuemu-is-loaded { opacity: 1; } }
  .yuemu-skeleton-wrap { display: flex; flex-direction: column; width: 100%; }
}

@media (prefers-color-scheme: dark) { .yuemu-immersive-ranking-list .yuemu-skeleton-anim { background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%); background-size: 400% 100%; animation: yuemu-shimmer 3s infinite linear; } }

/* 移动端强制移除点击时的悬停缩放，防止底层长按死锁 */
@media (max-width: 768px) {
  .ant-card-hoverable:active, .ant-card-hoverable:hover,
  .ant-card-hoverable:active *, .ant-card-hoverable:hover *,
  .ant-modal-close:active, .ant-modal-close:hover,
  .ant-modal-close:active *, .ant-modal-close:hover * {
    transform: none !important;
  }
}</style>
