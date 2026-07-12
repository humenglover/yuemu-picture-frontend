<template>
  <div class="yuemu-markdown-content" :class="{ 'yuemu-mobile-view': isMobile }">
    <div class="yuemu-content-wrapper">
      <div v-for="(block, index) in blocks" :key="index">
        <div v-if="block.type === 'text'" class="yuemu-text-block" v-html="block.content"></div>
        <div v-else-if="block.type === 'image-group'" class="yuemu-image-wrapper">
          <div class="yuemu-image-grid" :class="getGridClass(block.images?.length || 0)">
            <div
              v-if="!isMobile && block.images?.length === 1"
              class="yuemu-single-image-container"
              @click="handleImageClick(index, 0)"
            >
              <img
                :src="block.images[0].src"
                class="yuemu-single-image"
                :alt="block.images[0].alt"
                @load="handleSingleImageLoad(block.images[0].src)"
              />
              <div class="yuemu-pc-image-overlay yuemu-single-overlay">
                <div class="yuemu-image-count">
                  <span>1/1</span>
                </div>
              </div>
            </div>

            <div
              v-else
              v-for="(img, imgIndex) in block.images"
              :key="imgIndex"
              :class="['yuemu-grid-item', { 'yuemu-use-img': isMobile && (block.images?.length || 0) === 1 }]"
              :style="(isMobile && (block.images?.length || 0) === 1) ? undefined : { backgroundImage: `url(${img.src})` }"
              @click="handleImageClick(index, imgIndex)"
            >
              <img
                v-if="isMobile && (block.images?.length || 0) === 1"
                :src="img.src"
                class="yuemu-grid-img"
                @click.stop="handleImageClick(index, imgIndex)"
              />
              <div v-if="!isMobile" class="yuemu-pc-image-overlay">
                <div class="yuemu-image-count">
                  <span>{{ imgIndex + 1 }}/{{ block.images?.length || 0 }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template v-if="!isMobile">
      <AImage
        v-show="previewVisible && !isMobile"
        :src="previewImageUrl"
        :preview="{
          visible: previewVisible,
          onVisibleChange: handlePreviewChange,
          maskClassName: 'yuemu-preview-mask'
        }"
        alt=""
        style="display: none;"
      />
      <Teleport to="body">
        <div v-if="previewVisible && !isMobile" class="yuemu-pc-preview-container">
          <div class="yuemu-pc-preview-info">
            <div class="yuemu-pc-preview-content">
              <h3>{{ currentImageAlt }}</h3>
              <p>{{ currentImageIndex + 1 }} / {{ allImages.length }}</p>
            </div>
          </div>
          <button
            v-if="currentImageIndex > 0"
            class="yuemu-pc-nav-button yuemu-prev"
            @click="showPreviousImage"
          >
            <i class="fas fa-chevron-left"></i>
          </button>
          <button
            v-if="currentImageIndex < allImages.length - 1"
            class="yuemu-pc-nav-button yuemu-next"
            @click="showNextImage"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </Teleport>
    </template>

    <ImagePreview
      v-if="isMobile"
      v-model:visible="previewVisible"
      :images="allImages"
      :initialIndex="currentImageIndex"
    />
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, onMounted, watch, onUnmounted } from 'vue'
import { Image as AImage } from 'ant-design-vue'
import ImagePreview from '@/components/ImagePreview.vue'
import { getDeviceType } from '@/utils/device'
import { DEVICE_TYPE_ENUM } from '@/constants/device'

const props = defineProps<{
  content: string
}>()

const isMobile = ref(false)
const singleImageRatio = ref<number>(1)

onMounted(async () => {
  const deviceType = await getDeviceType()
  isMobile.value = deviceType === DEVICE_TYPE_ENUM.MOBILE
})

const handleSingleImageLoad = (src: string) => {
  const img = new Image()
  img.onload = () => {
    singleImageRatio.value = img.width / img.height
  }
  img.src = src
}

interface ImageItem {
  src: string
  alt: string
}

interface ContentBlock {
  type: 'text' | 'image-group'
  content?: string
  images?: ImageItem[]
}

const blocks = ref<ContentBlock[]>([])
const previewVisible = ref(false)
const previewImageUrl = ref('')
const currentImageAlt = ref('')
const allImages = ref<string[]>([])
const currentImageIndex = ref(0)

const parseContent = (content: string) => {
  const result: ContentBlock[] = []
  const lines = content.split('\n')
  let currentText = ''
  let currentImages: ImageItem[] = []

  lines.forEach(line => {
    const imgMatch = line.match(/!\[(.*?)\]\((.*?)\)/)
    if (imgMatch) {
      if (currentText) {
        result.push({ type: 'text', content: currentText.trim() })
        currentText = ''
      }
      currentImages.push({ alt: imgMatch[1], src: imgMatch[2] })
    } else {
      if (line.trim()) {
        if (currentImages.length > 0) {
          result.push({ type: 'image-group', images: [...currentImages] })
          currentImages = []
        }
        currentText += line + '\n'
      }
    }
  })

  if (currentImages.length > 0) {
    result.push({ type: 'image-group', images: currentImages })
  }
  if (currentText.trim()) {
    result.push({ type: 'text', content: currentText.trim() })
  }

  const mergedResult: ContentBlock[] = []
  let currentGroup: ImageItem[] = []

  result.forEach((block) => {
    if (block.type === 'image-group') {
      currentGroup.push(...(block.images || []))
    } else {
      if (currentGroup.length > 0) {
        mergedResult.push({ type: 'image-group', images: currentGroup })
        currentGroup = []
      }
      mergedResult.push(block)
    }
  })

  if (currentGroup.length > 0) {
    mergedResult.push({ type: 'image-group', images: currentGroup })
  }
  blocks.value = mergedResult
}

const getGridClass = (count: number) => {
  const baseClass = count === 1 ? 'yuemu-single' : ''
  const countClass = {
    1: 'yuemu-one',
    2: 'yuemu-two',
    3: 'yuemu-three',
    4: 'yuemu-four',
    6: 'yuemu-six',
    9: 'yuemu-nine'
  }[count] || 'yuemu-default'

  return `${baseClass} ${countClass}`
}

const getAllImagesWithAlt = () => {
  const imagesWithAlt: ImageItem[] = []
  blocks.value.forEach(block => {
    if (block.type === 'image-group' && block.images) {
      block.images.forEach(img => {
        imagesWithAlt.push({
          src: img.src.replace('_thumbnail', ''),
          alt: img.alt || ''
        })
      })
    }
  })
  return imagesWithAlt
}

const handleImageClick = async (blockIndex: number, imgIndex: number) => {
  const allImagesWithAlt = getAllImagesWithAlt()
  allImages.value = allImagesWithAlt.map(img => img.src)

  let globalIndex = 0
  for (let i = 0; i < blockIndex; i++) {
    if (blocks.value[i].type === 'image-group' && blocks.value[i].images) {
      globalIndex += blocks.value[i].images!.length
    }
  }
  globalIndex += imgIndex

  currentImageIndex.value = globalIndex
  previewImageUrl.value = allImages.value[globalIndex]
  currentImageAlt.value = allImagesWithAlt[globalIndex]?.alt || ''
  previewVisible.value = true

  if (!isMobile.value) {
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
  }
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (!previewVisible.value || isMobile.value) return
  if (e.key === 'ArrowLeft') { e.preventDefault(); showPreviousImage(); }
  else if (e.key === 'ArrowRight') { e.preventDefault(); showNextImage(); }
  else if (e.key === 'Escape') { e.preventDefault(); closePreview(); }
}

const handlePreviewChange = (visible: boolean) => {
  previewVisible.value = visible
  if (!visible) {
    document.body.style.overflow = ''
    document.removeEventListener('keydown', handleKeyDown)
  }
}

const closePreview = () => {
  previewVisible.value = false
  document.body.style.overflow = ''
  document.removeEventListener('keydown', handleKeyDown)
}

const showPreviousImage = async (e?: Event) => {
  if (e) e.stopPropagation()
  if (currentImageIndex.value > 0) {
    currentImageIndex.value--
    previewImageUrl.value = allImages.value[currentImageIndex.value]
    updateCurrentImageAlt()
  }
}

const showNextImage = async (e?: Event) => {
  if (e) e.stopPropagation()
  if (currentImageIndex.value < allImages.value.length - 1) {
    currentImageIndex.value++
    previewImageUrl.value = allImages.value[currentImageIndex.value]
    updateCurrentImageAlt()
  }
}

const updateCurrentImageAlt = () => {
  const allImagesWithAlt = getAllImagesWithAlt()
  currentImageAlt.value = allImagesWithAlt[currentImageIndex.value]?.alt || ''
}

const onPreviewChange = (index: number) => {
  currentImageIndex.value = index
  updateCurrentImageAlt()
}

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})

watch(() => props.content, (newContent) => {
  if (newContent) parseContent(newContent)
}, { immediate: true })
</script>

<style scoped>
.yuemu-markdown-content, .yuemu-markdown-content * {
  color: var(--text-primary) !important;
  font-family: var(--font-family-base) !important;
  transition: var(--theme-transition);
}

.yuemu-content-wrapper {
  max-width: 850px;
  margin: 0 auto;
  padding: 6px 2px;
}

.yuemu-content-wrapper :deep(p),
.yuemu-content-wrapper :deep(div) {
  font-size: 18px !important;
  line-height: 2.0 !important;
  letter-spacing: 0.5px !important;
  color: var(--text-primary) !important;
}

.yuemu-content-wrapper :deep(h2),
.yuemu-content-wrapper :deep(h3),
.yuemu-content-wrapper :deep(h4) {
  font-weight: 700 !important;
  line-height: 2 !important;
  border: none !important;
  background: none !important;
  color: var(--markdown-heading-text) !important;
}

.yuemu-content-wrapper :deep(h2) { font-size: 42px !important; }
.yuemu-content-wrapper :deep(h3) { font-size: 18px !important; margin: 30px 0 16px !important; }
.yuemu-content-wrapper :deep(h4) { font-size: 38px !important; margin: 28px 0 14px !important; }

.yuemu-content-wrapper :deep(ul),
.yuemu-content-wrapper :deep(ol) {
  font-size: 18px !important;
  line-height: 2.2 !important;
  margin: 24px 0 24px 18px !important;
  color: var(--text-primary) !important;
}

.yuemu-content-wrapper :deep(li) { margin: 16px 0 !important; }
.yuemu-content-wrapper :deep(a) { color: var(--link-color) !important; text-decoration: none !important; }
.yuemu-content-wrapper :deep(a:hover) { text-decoration: underline !important; color: var(--link-hover-color) !important; }

.yuemu-image-wrapper { margin: 32px 0; }

/* PC端单张图片 */
.yuemu-single-image-container {
  position: relative;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  cursor: zoom-in;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  background: transparent !important;
}

.yuemu-single-image {
  display: block;
  width: 100%;
  height: auto;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 8px;
}

.yuemu-single-image-container:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
}

.yuemu-single-overlay { border-radius: 8px; }

/* 图片网格 */
.yuemu-image-grid { display: grid; gap: 2px; width: 100%; }
.yuemu-image-grid.yuemu-one { grid-template-columns: 1fr; margin: 0 auto; }
.yuemu-image-grid.yuemu-two { grid-template-columns: repeat(2, 1fr); gap: 4px; }
.yuemu-image-grid.yuemu-three { grid-template-columns: repeat(3, 1fr); }
.yuemu-image-grid.yuemu-four { grid-template-columns: repeat(2, 1fr); gap: 4px; }
.yuemu-image-grid.yuemu-six, .yuemu-image-grid.yuemu-nine, .yuemu-image-grid.yuemu-default { grid-template-columns: repeat(3, 1fr); }

.yuemu-grid-item {
  position: relative;
  width: 100%;
  height: 320px;
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
  border-radius: 12px;
  cursor: zoom-in;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  background-color: transparent !important;
  border: 1px solid rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.yuemu-grid-item:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
}

.yuemu-pc-image-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent 40%);
  opacity: 0;
  transition: opacity 0.3s ease;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding: 16px;
  pointer-events: none;
}

.yuemu-grid-item:hover .yuemu-pc-image-overlay,
.yuemu-single-image-container:hover .yuemu-pc-image-overlay {
  opacity: 1;
}

.yuemu-image-count {
  background: rgba(0, 0, 0, 0.7);
  color: white !important;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 14px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .yuemu-content-wrapper { padding: 4px; }
  .yuemu-image-grid.yuemu-four .yuemu-grid-item,
  .yuemu-image-grid.yuemu-six .yuemu-grid-item,
  .yuemu-image-grid.yuemu-nine .yuemu-grid-item {
    padding-top: 100%;
    height: 0;
  }
}

.yuemu-grid-item.yuemu-use-img { height: auto !important; padding-top: 0 !important; background: none; border: none; }
.yuemu-grid-img { display: block; width: 100%; height: auto; border-radius: 8px; border: 1px solid var(--border-color); }

/* PC预览样式 */
.yuemu-pc-preview-container, .yuemu-pc-preview-info {
  position: fixed; inset: 0; z-index: 1000;
}

.yuemu-pc-preview-content {
  position: absolute; bottom: 0; inset-inline: 0;
  padding: 24px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.9), transparent);
  color: white !important;
  text-align: center;
}

.yuemu-pc-preview-content h3 { font-size: 20px; margin-bottom: 8px; color: white !important; }
.yuemu-pc-preview-content p { font-size: 16px; color: white !important; }

.yuemu-pc-nav-button {
  position: fixed; top: 50%; transform: translateY(-50%);
  width: 56px; height: 56px; border: none; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  color: white !important; background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px); cursor: pointer; transition: all 0.3s ease;
  z-index: 1002; font-size: 20px;
}

.yuemu-pc-nav-button.yuemu-prev { left: 32px; }
.yuemu-pc-nav-button.yuemu-next { right: 32px; }
.yuemu-pc-nav-button:hover { transform: translateY(-50%) scale(1.1); background: rgba(0, 0, 0, 0.7); }

:deep(.yuemu-preview-mask) { z-index: 1000 !important; background: rgba(0, 0, 0, 0.9) !important; }

/* 移动端强制移除点击时的悬停缩放，防止底层长按死锁 */
@media (max-width: 768px) {
  .yuemu-grid-item:active, .yuemu-grid-item:hover,
  .yuemu-grid-item:active *, .yuemu-grid-item:hover *,
  .yuemu-pc-nav-button:active, .yuemu-pc-nav-button:hover,
  .yuemu-pc-nav-button:active *, .yuemu-pc-nav-button:hover *,
  .ant-card-hoverable:active, .ant-card-hoverable:hover,
  .ant-card-hoverable:active *, .ant-card-hoverable:hover *,
  .yuemu-single-image-container:active, .yuemu-single-image-container:hover,
  .yuemu-single-image-container:active *, .yuemu-single-image-container:hover * {
    transform: none !important;
  }
}
</style>
