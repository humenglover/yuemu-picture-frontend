<template>
  <div class="yuemu-pc-picture-list">
    <div class="yuemu-masonry-wrapper" ref="masonryRef">
      <div class="yuemu-masonry-grid" ref="gridRef">
        <div v-for="(column, columnIndex) in columns" :key="columnIndex" class="yuemu-masonry-column yuemu-grid-column">
          <!-- 这里不需要骨架屏逻辑，因为父组件已经控制 loading 状态了 -->
          
          <div v-for="picture in column" :key="picture.id" class="yuemu-card-spacing">
            <div
              class="yuemu-masonry-item"
              :data-pic-id="picture.id"
              @click="handleClick(picture)"
            >
              <div class="yuemu-image-container">
                <div class="yuemu-j-placeholder" v-if="!imageLoadedMap[picture.id]"></div>
                <img
                  :src="getValidImageUrl(picture)"
                  :alt="picture.name || t('components.guessLike.picture')"
                  class="yuemu-masonry-image"
                  :class="{ 'yuemu-is-loaded': imageLoadedMap[picture.id] }"
                  referrerpolicy="no-referrer"
                  @load="handleImageLoad(picture.id)"
                  @error="handleImageLoad(picture.id)"
                />
                
                <div class="yuemu-guess-like-overlay">
                  <div class="yuemu-guess-user">
                    <img
                      :src="picture.user?.userAvatar || getDefaultAvatar(picture.user?.userName)"
                      class="yuemu-guess-avatar"
                      alt=""
                    />
                    <span class="yuemu-guess-username">{{ picture.user?.userName || t('components.guessLike.anonymous') }}</span>
                  </div>
                  <div class="yuemu-guess-likes">
                    <i class="fas fa-eye"></i>
                    <span>{{ formatNumber(picture.viewCount || 0) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, ref, onMounted, computed, nextTick, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getDeviceType } from '@/utils/device'
import { DEVICE_TYPE_ENUM } from '@/constants/device'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface Picture {
  id: string
  url: string
  thumbnailUrl?: string
  name: string
  viewCount?: number
  picScale?: number
  user?: {
    userName: string
    userAvatar: string
  }
}

const props = defineProps<{
  dataList: Picture[]
}>()

const emit = defineEmits(['click-picture'])
const router = useRouter()
const isMobile = ref(false)

const masonryRef = ref<HTMLElement | null>(null)
const gridRef = ref<HTMLElement | null>(null)
const containerWidth = ref(0)
const columnHeights = ref<number[]>([])

onMounted(async () => {
  const device = await getDeviceType()
  isMobile.value = device === DEVICE_TYPE_ENUM.MOBILE || window.innerWidth < 768
  
  updateContainerWidth()
  window.addEventListener('resize', updateContainerWidth)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateContainerWidth)
})

const updateContainerWidth = () => {
  if (masonryRef.value) {
    containerWidth.value = masonryRef.value.offsetWidth
  } else {
    containerWidth.value = window.innerWidth
  }
}

const getColumnCount = () => {
  const width = containerWidth.value
  if (width < 576) return 2
  if (width < 768) return 3
  if (width < 992) return 4
  if (width < 1200) return 4
  return 5
}

// 核心：JS 计算瀑布流
const columns = computed(() => {
  const count = getColumnCount()
  const cols = Array.from({ length: count }, () => [] as Picture[])

  if (!props.dataList || props.dataList.length === 0) {
    return cols
  }

  const localHeights = new Array(count).fill(0)

  props.dataList.forEach(picture => {
    // 寻找当前最短的列
    const minHeight = Math.min(...localHeights)
    const targetIndex = localHeights.indexOf(minHeight)
    cols[targetIndex].push(picture)
    
    // 如果有比例使用比例，没有默认 1
    const picRatio = picture.picScale || Math.random() * (1.5 - 0.7) + 0.7 // 若无比例，随机估算一个避免全堆在一列
    const limitedRatio = Math.max(0.55, Math.min(picRatio, 1.60))
    
    // 高度估算
    localHeights[targetIndex] += (1 / limitedRatio) * 100 + 8
  })
  
  return cols
})

const imageLoadedMap = ref<Record<string, boolean>>({})

const handleImageLoad = (id: string | number) => {
  imageLoadedMap.value[id] = true
  
}


const getValidImageUrl = (picture: any) => {
  const thumb = picture.thumbnailUrl
  if (thumb && !thumb.endsWith('.')) {
    return thumb
  }
  return picture.url || '/default-image.png'
}

const handleClick = (picture: Picture) => {
  if (isMobile.value) {
    router.push({
      path: `/picture-redirect/${picture.id}`,
      state: { pictureData: JSON.parse(JSON.stringify(picture)) }
    })
  } else {
    emit('click-picture', picture)
  }
}

const getDefaultAvatar = (name?: string) => {
  if (!name) return 'https://api.dicebear.com/7.x/adventurer/svg?seed=fallback'
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`
}

const formatNumber = (num: number) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  }
  return num.toString()
}
</script>

<style scoped>
.yuemu-pc-picture-list {
  width: 100%;
}

.yuemu-masonry-wrapper {
  width: 100%;
}

.yuemu-masonry-grid {
  display: flex;
  gap: 16px;
  width: 100%;
  align-items: flex-start;
}

.yuemu-masonry-column {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  gap: 16px;
}

@media (max-width: 768px) {
  .yuemu-masonry-grid {
    gap: 12px;
  }
  .yuemu-masonry-column {
    gap: 12px;
  }
}

.yuemu-masonry-item {
  position: relative;
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  background-color: var(--hover-background, #f5f5f5);
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.yuemu-masonry-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}

.yuemu-image-container {
  position: relative;
  width: 100%;
  /* 不再强制 1:1，由图片自身的高度撑开 */
  display: flex;
}

.yuemu-masonry-image {
  width: 100%;
  height: auto;
  display: block;
  opacity: 0;
  transition: opacity 0.5s ease;
}

.yuemu-masonry-image.yuemu-is-loaded {
  opacity: 1;
}

.yuemu-j-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, var(--hover-background) 25%, var(--border-color) 37%, var(--hover-background) 63%);
  background-size: 400% 100%;
  animation: yuemu-j-loading 1.4s ease infinite;
}

@keyframes yuemu-j-loading {
  0% { background-position: 100% 50%; }
  100% { background-position: 0 50%; }
}

.yuemu-guess-like-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 30px 12px 12px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0) 100%);
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  color: #fff;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.yuemu-masonry-item:hover .yuemu-guess-like-overlay {
  opacity: 1;
}

.yuemu-guess-user {
  display: flex;
  align-items: center;
  gap: 6px;
  max-width: 65%;
}

.yuemu-guess-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid rgba(255, 255, 255, 0.5);
  flex-shrink: 0;
}

.yuemu-guess-username {
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
}

.yuemu-guess-likes {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
}

.yuemu-guess-likes i {
  font-size: 12px;
}

/* 移动端强制移除点击时的悬停缩放，防止底层长按死锁 */
@media (max-width: 768px) {
  .yuemu-masonry-item:active, .yuemu-masonry-item:hover,
  .yuemu-masonry-item:active *, .yuemu-masonry-item:hover * {
    transform: none !important;
  }
}
</style>
