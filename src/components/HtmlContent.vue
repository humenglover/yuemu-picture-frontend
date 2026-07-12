<template>
  <div class="yuemu-html-content" :class="{ 'yuemu-mobile-view': isMobile, 'yuemu-pc-view': !isMobile }">
    <div class="yuemu-content-wrapper">
      <div
        v-for="(item, index) in contentItems"
        :key="index"
        :class="item.type === 'text' ? 'yuemu-text-block' : 'yuemu-image-block'"
      >
        <div v-if="item.type === 'text'" class="yuemu-text-content" v-html="item.content"></div>

        <div v-else class="yuemu-image-wrapper">
          <div class="yuemu-image-grid" :class="getGridClass(item.images?.length || 0)">
            <div
              v-for="(img, imgIdx) in (item.images || [])"
              :key="`img-${index}-${imgIdx}`"
              class="yuemu-grid-item"
              @click="handleImageClick(index, imgIdx)"
            >
              <div class="yuemu-image-loader">
                <div v-show="!getImageLoaded(img.src)" class="yuemu-image-placeholder"></div>
                <img
                  :src="img.src"
                  :alt="img.alt"
                  class="yuemu-grid-img"
                  loading="lazy"
                  @load="setImageLoaded(img.src, true)"
                  :class="{ 'yuemu-img-loaded': getImageLoaded(img.src) }"
                />
              </div>

              <div v-if="!isMobile && (item.images?.length || 0) > 1" class="yuemu-pc-image-overlay">
                <span class="yuemu-image-count">{{ imgIdx + 1 }}/{{ item.images?.length }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ImagePreview
      v-model:visible="previewVisible"
      :images="previewImages"
      :initialIndex="previewStartIndex"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue'
import ImagePreview from '@/components/ImagePreview.vue'
import { useI18n } from 'vue-i18n'

const getDeviceType = () => {
  return new Promise<string>((resolve) => {
    if (typeof window === 'undefined') return resolve('pc')
    resolve(window.innerWidth < 768 ? 'mobile' : 'pc')
  })
}

const props = defineProps<{
  content: string
}>()

const { t } = useI18n()

// 核心状态
const isMounted = ref(false)
const isMobile = ref(false)
const contentItems = ref<Array<{
  type: 'text' | 'image'
  content?: string
  images?: Array<{ src: string; alt: string }>
}>>([])
const imageLoadedStates = ref<Record<string, boolean>>({})

// 预览核心状态
const previewVisible = ref(false)
const previewImages = ref<string[]>([])
const previewStartIndex = ref(0)
let savedScrollY = 0

const onPreviewChange = (index: number) => {
  previewStartIndex.value = index
}

onMounted(async () => {
  isMounted.value = true
  const deviceType = await getDeviceType()
  isMobile.value = deviceType === 'mobile'

  if (typeof document !== 'undefined') {
    document.addEventListener('keydown', handleKeyDown)
  }
})

const handleKeyDown = (e: KeyboardEvent) => {
  if (!previewVisible.value) return
  if (e.key === 'ArrowLeft') {
    e.preventDefault()
    showPreviousImage()
  } else if (e.key === 'ArrowRight') {
    e.preventDefault()
    showNextImage()
  } else if (e.key === 'Escape') {
    e.preventDefault()
    onPreviewClose()
  }
}

const showPreviousImage = () => {
  if (previewImages.value.length <= 1) return
  previewStartIndex.value = previewStartIndex.value > 0 ? previewStartIndex.value - 1 : previewImages.value.length - 1
}

const showNextImage = () => {
  if (previewImages.value.length <= 1) return
  previewStartIndex.value = previewStartIndex.value < previewImages.value.length - 1 ? previewStartIndex.value + 1 : 0
}



const parseHtmlContent = (htmlContent: string) => {
  // 防御性保护：确保在 SSR 环境或空数据下不崩溃
  if (!htmlContent || typeof document === 'undefined') {
    contentItems.value = []
    previewImages.value = []
    return
  }

  let repairedHtml = htmlContent
    .replace(/<(\*+)> /g, '<p>')
    .replace(/<(\*+)>/g, '<p>')
    .replace(/<\/(\*+)>/g, '</p>')
    .replace(/\n/g, '<br/>')

  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = repairedHtml

  const result: Array<{ type: 'text' | 'image'; content?: string; images?: Array<{ src: string; alt: string }> }> = []
  const flatImages: Array<{ src: string; alt: string }> = []
  const imageSrcSet = new Set<string>()

  let currentTextBuffer = ''

  const flushTextBuffer = () => {
    const cleaned = currentTextBuffer.replace(/^(<br\s*\/?>)+|(<br\s*\/?>)+$/gi, '')
    if (cleaned.trim().length > 0) {
      result.push({ type: 'text', content: cleaned })
    }
    currentTextBuffer = ''
  }

  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      currentTextBuffer += node.textContent || ''
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement
      const tagName = element.tagName.toLowerCase()

      if (tagName === 'img') {
        flushTextBuffer()
        let src = element.getAttribute('src') || ''
        if (src) {
          src = src.replace('_thumbnail', '')
          if (!imageSrcSet.has(src)) {
            imageSrcSet.add(src)
            const alt = element.getAttribute('alt') || t('components.htmlContent.imageAlt', { index: flatImages.length + 1 })
            const imgObj = { src, alt }

            const lastItem = result[result.length - 1]
            if (lastItem && lastItem.type === 'image' && lastItem.images) {
              lastItem.images.push(imgObj)
            } else {
              result.push({ type: 'image', images: [imgObj] })
            }
            flatImages.push(imgObj)
          }
        }
      } else if (['br', 'span', 'a', 'strong', 'em', 'u', 'b', 'i', 'font'].indexOf(tagName) !== -1) {
        currentTextBuffer += element.outerHTML
      } else {
        const hasImg = element.querySelector('img')
        if (!hasImg) {
          flushTextBuffer()
          const content = element.outerHTML
          if (content.trim()) {
            result.push({ type: 'text', content: content })
          }
        } else {
          flushTextBuffer()
          Array.from(element.childNodes).forEach(walk)
          flushTextBuffer()
        }
      }
    }
  }

  Array.from(tempDiv.childNodes).forEach(walk)
  flushTextBuffer()

  contentItems.value = result
  previewImages.value = flatImages.map(img => img.src)
}

const getGridClass = (count: number) => {
  if (count === 1) return 'yuemu-grid-1'
  if (count === 2 || count === 4) return 'yuemu-grid-2-col'
  return 'yuemu-grid-3-col'
}

const setImageLoaded = (src: string, loaded: boolean) => {
  imageLoadedStates.value[src] = loaded
}

const getImageLoaded = (src: string) => {
  return imageLoadedStates.value[src] || false
}

const handleImageClick = (itemIndex: number, imgIdx: number) => {
  let globalIndex = 0
  for (let i = 0; i < itemIndex; i++) {
    const item = contentItems.value[i]
    if (item.type === 'image' && item.images) {
      globalIndex += item.images.length
    }
  }
  globalIndex += imgIdx
  previewStartIndex.value = globalIndex
  previewVisible.value = true

  // 记录滚动条并锁定背景
  if (typeof window !== 'undefined') {
    savedScrollY = window.scrollY
    document.body.style.overflow = 'hidden'
  }
}

const onPreviewClose = () => {
  previewVisible.value = false
  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
    window.scrollTo(0, savedScrollY)
  }
}

watch(() => props.content, (newContent) => {
  parseHtmlContent(newContent)
}, { immediate: true })

onUnmounted(() => {
  previewVisible.value = false
  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
    document.removeEventListener('keydown', handleKeyDown)
  }
})
</script>

<style scoped>
/* ========== 全局容器 ========== */
.yuemu-html-content {
  width: 100%;
  box-sizing: border-box;
  color: var(--text-primary, #333);
  font-family: var(--font-family-base, system-ui, -apple-system, sans-serif);
}

.yuemu-content-wrapper {
  width: 100%;
  margin: 0 auto;
}

/* ========== 文本区块排版 ========== */
.yuemu-text-block {
  margin-bottom: 24px;
}

.yuemu-text-content {
  line-height: 1.8;
  font-size: 16px;
  color: var(--post-text-color, #2c3e50);
  word-wrap: break-word;
  word-break: break-word;
  text-align: justify;
}

.yuemu-text-content :deep(p) {
  margin: 0 0 16px 0;
}
.yuemu-text-content :deep(p:last-child) {
  margin-bottom: 0;
}

/* ========== 图片区域排版 ========== */
.yuemu-image-block {
  margin-bottom: 24px;
  width: 100%;
}

.yuemu-image-grid {
  display: grid;
  gap: 12px;
  width: 100%;
}

.yuemu-grid-item {
  position: relative;
  border-radius: 12px;
  cursor: zoom-in;
  overflow: hidden;
  z-index: 1;
  background: var(--bg-secondary, #f5f5f5);
}

/* --- 单图 --- */
.yuemu-grid-1 {
  grid-template-columns: 1fr;
}
.yuemu-grid-1 .yuemu-grid-item {
  width: 100%;
  aspect-ratio: auto !important;
  height: auto;
}
.yuemu-grid-1 .yuemu-image-loader {
  position: relative;
  width: 100%;
  height: 100%;
}
.yuemu-grid-1 .yuemu-grid-img {
  position: relative;
  width: 100%;
  height: auto;
  max-height: 70vh;
  object-fit: cover !important;
  display: block;
}

/* --- 多图 --- */
.yuemu-grid-2-col {
  grid-template-columns: repeat(2, 1fr);
  width: 100%;
}
.yuemu-grid-3-col {
  grid-template-columns: repeat(3, 1fr);
  width: 100%;
}

.yuemu-grid-2-col .yuemu-grid-item,
.yuemu-grid-3-col .yuemu-grid-item {
  aspect-ratio: 1 / 1 !important;
  width: 100%;
}

.yuemu-grid-2-col .yuemu-image-loader,
.yuemu-grid-3-col .yuemu-image-loader {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.yuemu-grid-2-col .yuemu-grid-img,
.yuemu-grid-3-col .yuemu-grid-img {
  position: absolute;
  inset: 0;
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
  display: block;
}

/* ========== 图片加载态与交互 ========== */
.yuemu-pc-view .yuemu-grid-item {
  transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.3s ease;
}
.yuemu-pc-view .yuemu-grid-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.1);
}

.yuemu-grid-img {
  opacity: 0;
  transition: opacity 0.5s ease-in-out;
  z-index: 2;
}
.yuemu-grid-img.yuemu-img-loaded {
  opacity: 1;
}

.yuemu-image-placeholder {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: yuemu-placeholderShimmer 1.5s infinite linear;
  z-index: 1;
}
@keyframes yuemu-placeholderShimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.yuemu-pc-image-overlay {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  color: #fff;
  font-size: 13px;
  padding: 4px 10px;
  border-radius: 20px;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 3;
}
.yuemu-pc-view .yuemu-grid-item:hover .yuemu-pc-image-overlay {
  opacity: 1;
}

/* ========== 移动端专属适配 ========== */
.yuemu-mobile-view .yuemu-content-wrapper {
  padding: 4px;
}
.yuemu-mobile-view .yuemu-text-content {
  font-size: 17px;
  line-height: 1.7;
}
.yuemu-mobile-view .yuemu-image-grid {
  gap: 6px;
}
.yuemu-mobile-view .yuemu-grid-item {
  border-radius: 8px;
}



/* 移动端强制移除点击时的悬停缩放，防止底层长按死锁 */
@media (max-width: 768px) {
  .yuemu-grid-item:active, .yuemu-grid-item:hover,
  .yuemu-grid-item:active *, .yuemu-grid-item:hover *,
  .ant-card-hoverable:active, .ant-card-hoverable:hover,
  .ant-card-hoverable:active *, .ant-card-hoverable:hover * {
    transform: none !important;
  }
}
</style>
