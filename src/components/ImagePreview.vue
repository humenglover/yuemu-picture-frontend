<template>
  <Teleport to="body">
    <Transition name="yuemu-preview-fade">
      <div
        v-if="visible"
        class="yuemu-image-preview-overlay"
        :style="overlayStyle"
        @click.self="handleOverlayClick"
      >
        <!-- 顶部信息栏 -->
        <div class="yuemu-preview-header" :class="{ 'yuemu-hidden': hideUI }">
          <div class="yuemu-preview-info" v-if="currentNaturalWidth && !isMobile">
            <span class="yuemu-info-item">{{ currentNaturalWidth }} &times; {{ currentNaturalHeight }}</span>
            <span class="yuemu-info-item" v-if="currentFileType">{{ currentFileType }}</span>
            <span class="yuemu-info-item" v-if="currentFileSize">{{ currentFileSize }}</span>
          </div>
          <div class="yuemu-preview-index" v-if="images.length > 1">
            {{ currentIndex + 1 }} / {{ images.length }}
          </div>
          <button class="yuemu-preview-btn yuemu-preview-close" @click="close">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <!-- 图片容器轨道 -->
        <div
          class="yuemu-preview-track"
          :style="trackStyle"
          @touchstart="handleTouchStart"
          @touchmove="handleTouchMove"
          @touchend="handleTouchEnd"
          @touchcancel="handleTouchEnd"
          @mousedown="handleMouseDown"
          @mousemove="handleMouseMove"
          @mouseup="handleMouseUp"
          @mouseleave="handleMouseUp"
          @wheel.prevent="handleWheel"
        >
          <div
            v-for="(img, index) in images"
            :key="index"
            class="yuemu-preview-item"
          >
            <div class="yuemu-preview-img-wrapper" :style="getWrapperStyle(index)">
              <!-- 加载状态 -->
              <div v-if="loading[index]" class="yuemu-preview-loading">
                <i class="fas fa-circle-notch fa-spin"></i>
              </div>
              <img
                :src="img"
                class="yuemu-preview-img"
                :style="index === currentIndex ? imageTransformStyle : ''"
                @load="handleImageLoad(index)"
                draggable="false"
              />
            </div>
          </div>
        </div>

        <!-- PC端左右切换按钮 -->
        <button v-if="images.length > 1 && currentIndex > 0 && !isMobile" class="yuemu-preview-nav yuemu-prev" :class="{ 'yuemu-hidden': hideUI }" @click.stop="prev">
          <i class="fas fa-chevron-left"></i>
        </button>
        <button v-if="images.length > 1 && currentIndex < images.length - 1 && !isMobile" class="yuemu-preview-nav yuemu-next" :class="{ 'yuemu-hidden': hideUI }" @click.stop="next">
          <i class="fas fa-chevron-right"></i>
        </button>

        <!-- 底部工具栏与指示器 -->
        <div class="yuemu-preview-footer" :class="{ 'yuemu-hidden': hideUI }">
          <!-- 缩略图导航 -->
          <div class="yuemu-preview-thumbnails" v-if="images.length > 1" ref="thumbnailsRef">
            <div
              v-for="(img, index) in images"
              :key="'thumb-'+index"
              class="yuemu-thumbnail-item"
              :class="{ 'yuemu-active': currentIndex === index }"
              @click.stop="goTo(index)"
            >
              <img :src="img" />
            </div>
          </div>

          <!-- 操作栏 -->
          <div class="yuemu-preview-toolbar" @click.stop>
            <!-- 缩放控制 -->
            <div class="yuemu-zoom-controls" v-if="!isMobile">
              <button class="yuemu-preview-btn yuemu-text-btn" :class="{ 'yuemu-active': currentZoomMode === 'fit' }" @click="setZoomMode('fit')" title="适应">FIT</button>
              <button class="yuemu-preview-btn yuemu-text-btn" :class="{ 'yuemu-active': currentZoomMode === '100%' }" @click="setZoomMode('100%')" title="实际大小 100%">100%</button>
              <button class="yuemu-preview-btn yuemu-text-btn" :class="{ 'yuemu-active': currentZoomMode === '200%' }" @click="setZoomMode('200%')" title="放大 200%">200%</button>
              <button class="yuemu-preview-btn yuemu-text-btn" :class="{ 'yuemu-active': currentZoomMode === '400%' }" @click="setZoomMode('400%')" title="放大 400%">400%</button>
            </div>

            <!-- 镜像 -->
            <button class="yuemu-preview-btn" @click="toggleMirror" title="水平镜像">
              <i class="fas fa-arrows-alt-h"></i>
            </button>
            <button class="yuemu-preview-btn" @click="rotateImage" :title="t('components.imagePreview.rotateImage')">
              <i class="fas fa-redo"></i>
            </button>
            <button class="yuemu-preview-btn" @click="downloadImage" :title="t('components.imagePreview.downloadImage')">
              <i class="fas fa-download"></i>
            </button>
            <button class="yuemu-preview-btn" @click="detectQRCode" :title="t('components.imagePreview.detectQRCode', '识别二维码')">
              <i class="fas fa-qrcode"></i>
            </button>
          </div>
        </div>

        <!-- 独立的 Toast 提示（因为 z-index 问题绕过 UI 库） -->
        <Transition name="yuemu-preview-fade">
          <div v-if="toastMsg" class="yuemu-preview-toast">
            <i :class="toastIcon"></i>
            <span>{{ toastMsg }}</span>
          </div>
        </Transition>

        <!-- 扫码成功时的识别涟漪点 -->
        <div v-if="qrDot.show" class="pro-qr-dot" :style="{ left: qrDot.x + 'px', top: qrDot.y + 'px' }">
          <div class="dot-core"></div>
          <div class="dot-ripple"></div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted, nextTick } from 'vue'
import { downloadImage as utilDownloadImage } from '@/utils'
import { useI18n } from 'vue-i18n'
import jsQR from 'jsqr'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import scanSoundUrl from '@/assets/sounds/scan_QR.mp3'

const props = defineProps<{
  visible: boolean
  images: string[]
  initialIndex?: number
  closableOnMask?: boolean
}>()

const emit = defineEmits(['update:visible', 'change', 'close'])

const { t } = useI18n()
const router = useRouter()

const isMobile = ref(false)

const currentIndex = ref(0)
const loading = ref<boolean[]>([])
const hideUI = ref(false) // 拖拽时隐藏UI增强沉浸感

// 图像状态
const scale = ref(1)
const rotate = ref(0)
const translateX = ref(0)
const translateY = ref(0)
const trackTranslateX = ref(0)

const qrDot = ref({ show: false, x: 0, y: 0 })

const playScanSuccessSound = () => {
  try {
    const audio = new Audio(scanSoundUrl)
    audio.play()
  } catch (e) {
    console.warn('Audio play failed', e)
  }
}

// 内部 Toast 状态
const toastMsg = ref('')
const toastIcon = ref('fas fa-info-circle')
let toastTimer: any = null

const showToast = (msg: string, type: 'info' | 'success' | 'warning' | 'error' | 'loading' = 'info', duration = 3000) => {
  if (toastTimer) clearTimeout(toastTimer)
  toastMsg.value = msg
  if (type === 'success') toastIcon.value = 'fas fa-check-circle'
  else if (type === 'error') toastIcon.value = 'fas fa-times-circle'
  else if (type === 'warning') toastIcon.value = 'fas fa-exclamation-triangle'
  else if (type === 'loading') toastIcon.value = 'fas fa-spinner fa-spin'
  else toastIcon.value = 'fas fa-info-circle'

  if (duration > 0) {
    toastTimer = setTimeout(() => { toastMsg.value = '' }, duration)
  }
}
const hideToast = () => { toastMsg.value = ''; if (toastTimer) clearTimeout(toastTimer); }

// 下拉关闭专属状态
const pullDownOffset = ref(0)
const bgOpacity = ref(1)

// 交互状态标记
const isDragging = ref(false) // 放大时的平移
const isPinching = ref(false) // 双指缩放
const isSwiping = ref(false)  // 左右切换
const isPullingDown = ref(false) // 下拉关闭中

// 手势缓存
let lastDistance = 0
let lastCenter = { x: 0, y: 0 }
let startX = 0
let startY = 0
let startTrackX = 0
let lastTapTime = 0
let touchStartTime = 0

// PC端鼠标拖拽
const isMouseDown = ref(false)
let mouseStartX = 0
let mouseStartY = 0

// 旋转自适应长图所需的原始尺寸追踪
const currentNaturalWidth = ref(0)
const currentNaturalHeight = ref(0)


const updateNaturalSize = () => {
  nextTick(() => {
    const activeImg = document.querySelector('.yuemu-image-preview-overlay .yuemu-preview-item:nth-child(' + (currentIndex.value + 1) + ') .yuemu-preview-img') as HTMLImageElement
    if (activeImg) {
      currentNaturalWidth.value = activeImg.naturalWidth || 0
      currentNaturalHeight.value = activeImg.naturalHeight || 0
    }
  })
}

watch(() => props.visible, (newVal) => {
  if (newVal) {
    checkMobile()
    currentIndex.value = props.initialIndex >= 0 && props.initialIndex < props.images.length ? props.initialIndex : 0
    loading.value = new Array(props.images.length).fill(true)
    resetZoomAndRotation()
    trackTranslateX.value = -currentIndex.value * window.innerWidth
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('resize', handleResize)
    updateNaturalSize()
  } else {
    document.body.style.overflow = ''
    window.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener('resize', handleResize)
  }
})

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768 || 'ontouchstart' in window
}

const handleResize = () => {
  checkMobile()
  resetZoomAndRotation()
  trackTranslateX.value = -currentIndex.value * window.innerWidth
}

const handleImageLoad = (index: number) => {
  loading.value[index] = false
  if (index === currentIndex.value) {
    updateNaturalSize()
  }
}

const handleOverlayClick = () => {
  // 单击背景区域关闭
  if (props.closableOnMask && scale.value === 1 && !isSwiping.value) close()
}

const close = () => {
  emit('update:visible', false)
  emit('close')
  // 延迟重置，等待过渡动画完成
  setTimeout(() => {
    resetZoomAndRotation()
    pullDownOffset.value = 0
    bgOpacity.value = 1
  }, 300)
}

const next = () => {
  if (currentIndex.value < props.images.length - 1) {
    currentIndex.value++
    finishSwitch()
  }
}

const prev = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
    finishSwitch()
  }
}

const finishSwitch = () => {
  resetZoomAndRotation()
  animateTrackTo(-currentIndex.value * window.innerWidth)
  emit('change', currentIndex.value)
  updateNaturalSize()
}

const resetZoomAndRotation = () => {
  scale.value = 1
  rotate.value = 0
  translateX.value = 0
  translateY.value = 0
}

const rotateImage = () => {
  rotate.value += 90
}

const downloadImage = () => {
  const url = props.images[currentIndex.value]
  if (!url) return

  const isLocal = url.startsWith('blob:') || url.startsWith('data:');
  const finalUrl = isLocal ? url : `${url}${url.includes('?') ? '&' : '?'}referer=${encodeURIComponent(window.location.origin)}`;

  utilDownloadImage(finalUrl, `image-${Date.now()}`)
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') close()
  if (e.key === 'ArrowLeft') prev()
  if (e.key === 'ArrowRight') next()
}

// ============== 核心手势引擎 ==============
const getDistance = (p1: Touch, p2: Touch) => {
  const dx = p1.clientX - p2.clientX
  const dy = p1.clientY - p2.clientY
  return Math.sqrt(dx * dx + dy * dy)
}

const getCenter = (p1: Touch, p2: Touch) => {
  return {
    x: (p1.clientX + p2.clientX) / 2,
    y: (p1.clientY + p2.clientY) / 2
  }
}

// 阻尼函数：使得超出边界时的拖拽变得吃力
const applyDamping = (value: number, max: number) => {
  return max * Math.sin((value / max) * (Math.PI / 2))
}

const handleTouchStart = (e: TouchEvent) => {
  touchStartTime = Date.now()
  if (e.touches.length === 1) {
    const touch = e.touches[0]
    startX = touch.clientX
    startY = touch.clientY
    startTrackX = trackTranslateX.value

    // 双击检测 (带坐标追踪)
    const now = Date.now()
    if (now - lastTapTime < 300) {
      handleDoubleTap(touch.clientX, touch.clientY)
      lastTapTime = 0
      e.preventDefault()
      return
    }
    lastTapTime = now

    // 决定当前单指的意图
    if (scale.value === 1) {
      isSwiping.value = true // 可能是左右滑动或下拉关闭，在 move 中具体判定
    } else {
      isDragging.value = true
    }

  } else if (e.touches.length === 2) {
    // 多指操作介入，重置其他状态
    isPinching.value = true
    isSwiping.value = false
    isDragging.value = false
    isPullingDown.value = false
    lastDistance = getDistance(e.touches[0], e.touches[1])
    lastCenter = getCenter(e.touches[0], e.touches[1])
  }
}

const handleDoubleTap = (clientX: number, clientY: number) => {
  if (scale.value > 1) {
    resetZoomAndRotation()
  } else {
    // 根据点击位置计算放大原点偏移
    const centerX = window.innerWidth / 2
    const centerY = window.innerHeight / 2
    scale.value = 2.5
    // 抵消中心点距离差，让点击位置居中
    const targetX = (centerX - clientX) * (scale.value - 1)
    const targetY = (centerY - clientY) * (scale.value - 1)

    // 双击放大后进行边界约束，防止图片飞出屏幕外
    const bounded = limitTranslation(targetX, targetY)
    translateX.value = bounded.x
    translateY.value = bounded.y
  }
}

const handleWheel = (e: WheelEvent) => {
  // e.preventDefault() is handled by @wheel.prevent in template
  let zoomFactor = -e.deltaY * 0.002
  // Touchpad pinch-to-zoom often triggers wheel with ctrlKey on standard browsers
  if (e.ctrlKey) zoomFactor = -e.deltaY * 0.01

  let newScale = scale.value * (1 + zoomFactor)

  if (newScale < 0.5) newScale = 0.5
  if (newScale > 5) newScale = 5

  const currentRatio = newScale / scale.value

  const clientX = e.clientX
  const clientY = e.clientY

  const deltaX = clientX - window.innerWidth / 2 - translateX.value
  const deltaY = clientY - window.innerHeight / 2 - translateY.value

  translateX.value -= deltaX * (currentRatio - 1)
  translateY.value -= deltaY * (currentRatio - 1)

  scale.value = newScale

  const bounded = limitTranslation(translateX.value, translateY.value)
  translateX.value = bounded.x
  translateY.value = bounded.y
}

const handleTouchMove = (e: TouchEvent) => {
  if (isPinching.value && e.touches.length === 2) {
    e.preventDefault()
    hideUI.value = true
    const distance = getDistance(e.touches[0], e.touches[1])
    const center = getCenter(e.touches[0], e.touches[1])

    // 缩放比例
    const scaleFactor = distance / lastDistance
    let newScale = scale.value * scaleFactor

    // 限制最大最小缩放 (带微小回弹余量)
    if (newScale < 0.5) newScale = 0.5
    if (newScale > 5) newScale = 5

    // 计算中心点偏移，保证双手捏合原点不跑偏
    const currentRatio = newScale / scale.value
    const deltaX = center.x - window.innerWidth / 2 - translateX.value
    const deltaY = center.y - window.innerHeight / 2 - translateY.value

    translateX.value += (center.x - lastCenter.x) - deltaX * (currentRatio - 1)
    translateY.value += (center.y - lastCenter.y) - deltaY * (currentRatio - 1)

    scale.value = newScale
    lastDistance = distance
    lastCenter = center

  } else if (isDragging.value && e.touches.length === 1) {
    // 放大状态下的平移
    e.preventDefault()
    hideUI.value = true
    const touch = e.touches[0]
    const deltaX = touch.clientX - startX
    const deltaY = touch.clientY - startY

    // 拖动平移时加上边界约束限制，避免图被拖出屏幕外
    const bounded = limitTranslation(translateX.value + deltaX, translateY.value + deltaY)
    translateX.value = bounded.x
    translateY.value = bounded.y

    startX = touch.clientX
    startY = touch.clientY

  } else if (isSwiping.value && e.touches.length === 1) {
    const touch = e.touches[0]
    const deltaX = touch.clientX - startX
    const deltaY = touch.clientY - startY

    // 判断是否为下拉关闭 (垂直滑动为主，且向下)
    if (!isPullingDown.value && Math.abs(deltaY) > Math.abs(deltaX) * 1.5 && deltaY > 10 && trackTranslateX.value === startTrackX) {
      isPullingDown.value = true
      hideUI.value = true
    }

    if (isPullingDown.value) {
      e.preventDefault()
      // 下拉阻尼
      pullDownOffset.value = deltaY > 0 ? applyDamping(deltaY, 300) : 0
      bgOpacity.value = Math.max(0, 1 - pullDownOffset.value / 300)
    } else {
      // 左右滑动轨道
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        e.preventDefault()
        hideUI.value = true

        // 增加首尾橡皮筋边界阻尼效果
        let targetX = startTrackX + deltaX
        const maxScroll = -(props.images.length - 1) * window.innerWidth
        if (targetX > 0) {
          targetX = applyDamping(targetX, 100)
        } else if (targetX < maxScroll) {
          targetX = maxScroll - applyDamping(maxScroll - targetX, 100)
        }
        trackTranslateX.value = targetX
      }
    }
  }
}

const handleTouchEnd = () => {
  hideUI.value = false
  const now = Date.now()
  const velocity = now - touchStartTime < 300 // 判断是否是快速滑动

  if (isPinching.value) {
    isPinching.value = false
    if (scale.value < 1) {
      resetZoomAndRotation()
    } else {
      const bounded = limitTranslation(translateX.value, translateY.value)
      translateX.value = bounded.x
      translateY.value = bounded.y
    }
  }

  if (isDragging.value) {
    isDragging.value = false
    // 此时可以判断如果严重出界，自动吸附回弹 (根据需要拓展)
  }

  if (isPullingDown.value) {
    isPullingDown.value = false
    if (pullDownOffset.value > 100 || (pullDownOffset.value > 50 && velocity)) {
      close() // 触发关闭
    } else {
      // 回弹复位
      pullDownOffset.value = 0
      bgOpacity.value = 1
    }
    return
  }

  if (isSwiping.value) {
    isSwiping.value = false
    const windowWidth = window.innerWidth
    const threshold = windowWidth * 0.15
    const deltaX = trackTranslateX.value - startTrackX

    // 结合滑动距离和速度进行翻页判定
    if ((deltaX < -threshold || (deltaX < -30 && velocity)) && currentIndex.value < props.images.length - 1) {
      next()
    } else if ((deltaX > threshold || (deltaX > 30 && velocity)) && currentIndex.value > 0) {
      prev()
    } else {
      animateTrackTo(-currentIndex.value * windowWidth) // 翻页失败，回弹
    }
  }
}

// ============== PC 端兼容 ==============
const handleMouseDown = (e: MouseEvent) => {
  if (isMobile.value) return
  isMouseDown.value = true
  mouseStartX = e.clientX
  mouseStartY = e.clientY
  startTrackX = trackTranslateX.value

  if (scale.value === 1) {
    isSwiping.value = true
  } else {
    isDragging.value = true
  }
}

const handleMouseMove = (e: MouseEvent) => {
  if (!isMouseDown.value || isMobile.value) return
  e.preventDefault()
  const deltaX = e.clientX - mouseStartX
  const deltaY = e.clientY - mouseStartY

  if (isDragging.value) {
    const bounded = limitTranslation(translateX.value + deltaX, translateY.value + deltaY)
    translateX.value = bounded.x
    translateY.value = bounded.y
    mouseStartX = e.clientX
    mouseStartY = e.clientY
  } else if (isSwiping.value) {
    trackTranslateX.value = startTrackX + deltaX
  }
}

const handleMouseUp = () => {
  if (!isMouseDown.value || isMobile.value) return
  isMouseDown.value = false
  handleTouchEnd() // 复用收尾逻辑
}

// 核心动画函数
const animateTrackTo = (targetX: number) => {
  trackTranslateX.value = targetX
}

// ============== 动态样式 ==============
const overlayStyle = computed(() => ({
  backgroundColor: `rgba(0, 0, 0, ${bgOpacity.value})`,
  transition: isSwiping.value || isPullingDown.value ? 'none' : 'background-color 0.3s ease'
}))

const trackStyle = computed(() => ({
  transform: `translate3d(${trackTranslateX.value}px, 0, 0)`,
  transition: isSwiping.value ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
  width: `${props.images.length * 100}vw`
}))

const getWrapperStyle = (index: number) => {
  if (index !== currentIndex.value) return {}
  if (pullDownOffset.value > 0) {
    // 下拉关闭时的形变：下移 + 缩小
    const pullScale = Math.max(0.7, 1 - pullDownOffset.value / 800)
    return {
      transform: `translate3d(0, ${pullDownOffset.value}px, 0) scale(${pullScale})`,
      transition: isPullingDown.value ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
    }
  }
  return {
    transition: 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
  }
}

const adaptiveScale = computed(() => {
  if (rotate.value % 180 === 0) return 1
  if (!currentNaturalWidth.value || !currentNaturalHeight.value) return 1

  const winW = window.innerWidth
  const winH = window.innerHeight
  const natW = currentNaturalWidth.value
  const natH = currentNaturalHeight.value

  const natRatio = natW / natH
  const winRatio = winW / winH

  let visualW = 0
  let visualH = 0

  if (natRatio > winRatio) {
    visualW = winW
    visualH = winW / natRatio
  } else {
    visualW = winH * natRatio
    visualH = winH
  }

  const scaleW = winW / visualH
  const scaleH = winH / visualW

  return Math.min(scaleW, scaleH)
})

const limitTranslation = (x: number, y: number) => {
  if (!currentNaturalWidth.value || !currentNaturalHeight.value) {
    return { x: 0, y: 0 }
  }

  const winW = window.innerWidth
  const winH = window.innerHeight
  const natW = currentNaturalWidth.value
  const natH = currentNaturalHeight.value

  const natRatio = natW / natH
  const winRatio = winW / winH

  let visualW = 0
  let visualH = 0

  if (natRatio > winRatio) {
    visualW = winW
    visualH = winW / natRatio
  } else {
    visualW = winH * natRatio
    visualH = winH
  }

  const isRotated = rotate.value % 180 !== 0
  const baseW = isRotated ? visualH : visualW
  const baseH = isRotated ? visualW : visualH

  const totalScale = scale.value * adaptiveScale.value

  const actualW = baseW * totalScale
  const actualH = baseH * totalScale

  // 水平边界计算
  let minX = 0
  let maxX = 0
  if (actualW > winW) {
    maxX = (actualW - winW) / 2
    minX = -maxX
  }

  // 垂直边界计算
  let minY = 0
  let maxY = 0
  if (actualH > winH) {
    maxY = (actualH - winH) / 2
    minY = -maxY
  }

  const boundedX = Math.max(minX, Math.min(maxX, x))
  const boundedY = Math.max(minY, Math.min(maxY, y))

  return { x: boundedX, y: boundedY }
}

const imageTransformStyle = computed(() => {
  const currentScale = scale.value * adaptiveScale.value
  const scaleX = isMirrored.value ? -1 : 1
  return {
    transform: `translate3d(${translateX.value}px, ${translateY.value}px, 0) scale(${currentScale * scaleX}, ${currentScale}) rotate(${rotate.value}deg)`,
    transformOrigin: `${zoomOriginX.value}% ${zoomOriginY.value}%`,
    transition: (isPinching.value || isDragging.value || isHoverZooming.value) ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
  }
})

const detectQRCode = async () => {
  const url = props.images[currentIndex.value]
  if (!url) return
  
  showToast(t('components.imagePreview.detectingQRCode', '正在识别图中二维码...'), 'loading', 0)
  
  try {
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    // 加上时间戳避免使用不带跨域头的缓存导致 Canvas 污染抛错
    const isBlob = url.startsWith('blob:') || url.startsWith('data:')
    img.src = isBlob ? url : `${url}${url.includes('?') ? '&' : '?'}not-from-cache-please=${Date.now()}`
    
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
    })
    
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Cannot create canvas context')
    
    // 如果图片太小或太大都会影响识别，限制合理的最大尺寸来保证像素不会过度丢失
    const MAX_DIM = 1600;
    let width = img.width;
    let height = img.height;
    if (width > MAX_DIM || height > MAX_DIM) {
        const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
    }
    canvas.width = width
    canvas.height = height
    // 使用平滑缩放以提高二值化和识别率
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, 0, 0, width, height)
    
    const imageData = ctx.getImageData(0, 0, width, height)
    // 对于复杂的海报，增加反转颜色的尝试
    const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "attemptBoth" })
    
    if (code) {
      playScanSuccessSound()
      
      const activeImg = document.querySelector('.yuemu-image-preview-overlay .yuemu-preview-item:nth-child(' + (currentIndex.value + 1) + ') .yuemu-preview-img') as HTMLImageElement
      if (activeImg) {
        const centerX = (code.location.topLeftCorner.x + code.location.bottomRightCorner.x) / 2
        const centerY = (code.location.topLeftCorner.y + code.location.bottomRightCorner.y) / 2
        const percentX = centerX / width
        const percentY = centerY / height
        
        const rect = activeImg.getBoundingClientRect()
        const boxRatio = rect.width / rect.height
        const imgRatio = activeImg.naturalWidth / activeImg.naturalHeight
        
        let actualImgWidth = rect.width
        let actualImgHeight = rect.height
        let offsetX = 0
        let offsetY = 0
        
        if (imgRatio > boxRatio) {
          actualImgHeight = rect.width / imgRatio
          offsetY = (rect.height - actualImgHeight) / 2
        } else {
          actualImgWidth = rect.height * imgRatio
          offsetX = (rect.width - actualImgWidth) / 2
        }
        
        qrDot.value.x = rect.left + offsetX + actualImgWidth * percentX
        qrDot.value.y = rect.top + offsetY + actualImgHeight * percentY
        qrDot.value.show = true
        setTimeout(() => { qrDot.value.show = false }, 2000)
      }

      showToast(t('components.imagePreview.qrCodeFound', '识别成功！跳转中...'), 'success', 2000)
      const text = code.data
      
      if (text.startsWith(window.location.origin)) {
         const path = text.replace(window.location.origin, '')
         router.push(path)
         close()
      } else if (text.startsWith('http')) {
         window.open(text, '_blank')
      } else if (text.startsWith('{shareBase64:')) {
         const encoded = text.replace('{shareBase64:', '').replace('}', '')
         try {
           const path = atob(encoded)
           router.push(path)
           close()
         } catch(e) {
           showToast(`内容：${text}`, 'info', 5000)
         }
      } else {
         showToast(`内容：${text}`, 'info', 5000)
      }
    } else {
      showToast(t('components.imagePreview.noQRCode', '未发现可识别的二维码，海报中的二维码可能过小或太模糊。'), 'warning', 4000)
    }
  } catch (err) {
    showToast(t('components.imagePreview.qrCodeDetectFailed', '识别失败，该图片可能不支持分析或出现跨域限制。'), 'error', 4000)
    console.error('QR Detect Error:', err)
  }
}

const resetState = () => {
  scale.value = 1
  rotate.value = 0
  translateX.value = 0
  translateY.value = 0
  trackTranslateX.value = 0
  pullDownOffset.value = 0
  bgOpacity.value = 1
  zoomOriginX.value = 50
  zoomOriginY.value = 50
  isMirrored.value = false
  currentZoomMode.value = 'fit'
}

// ====== 缩略图切换 ======
const goTo = (index: number) => {
  if (index === currentIndex.value || isSwiping.value) return
  currentIndex.value = index
  finishSwitch()
}

// ====== 新增交互状态 ======
const isMirrored = ref(false)
const currentZoomMode = ref<'fit' | '100%' | '200%' | '400%'>('fit')
const zoomOriginX = ref(50)
const zoomOriginY = ref(50)
const isHoverZooming = ref(false)

const toggleMirror = () => { isMirrored.value = !isMirrored.value }

const setZoomMode = (mode: 'fit' | '100%' | '200%' | '400%') => {
  currentZoomMode.value = mode
  if (mode === 'fit') {
    scale.value = 1
    translateX.value = 0
    translateY.value = 0
    zoomOriginX.value = 50
    zoomOriginY.value = 50
  } else {
    let targetMultiplier = 1
    if (mode === '200%') targetMultiplier = 2
    if (mode === '400%') targetMultiplier = 4
    scale.value = targetMultiplier / adaptiveScale.value
    translateX.value = 0
    translateY.value = 0
  }
}

// ====== 图片元数据 ======
const currentFileSize = ref<string>('')
const currentFileType = ref<string>('')

const fetchImageMetadata = async (url: string) => {
  currentFileSize.value = ''
  currentFileType.value = 'IMG'
  try {
    const extMatch = url.match(/\.([a-zA-Z0-9]+)(?:[\?#]|$)/)
    if (extMatch) currentFileType.value = extMatch[1].toUpperCase()

    const res = await fetch(url, { method: 'HEAD' })
    if (res.ok) {
      const type = res.headers.get('content-type')
      if (type) currentFileType.value = type.split('/').pop()?.toUpperCase() || currentFileType.value
      if (currentFileType.value === 'JPEG') currentFileType.value = 'JPG'
      
      const size = res.headers.get('content-length')
      if (size) {
        const bytes = parseInt(size, 10)
        if (bytes < 1024) currentFileSize.value = bytes + ' B'
        else if (bytes < 1024 * 1024) currentFileSize.value = (bytes / 1024).toFixed(1) + ' KB'
        else currentFileSize.value = (bytes / (1024 * 1024)).toFixed(1) + ' MB'
      }
    }
  } catch(e) {}
}

const thumbnailsRef = ref<HTMLElement | null>(null)

watch(currentIndex, (idx) => {
  if (props.images[idx]) fetchImageMetadata(props.images[idx])
  
  nextTick(() => {
    if (thumbnailsRef.value) {
      const activeThumb = thumbnailsRef.value.children[idx] as HTMLElement
      if (activeThumb) {
        const containerWidth = thumbnailsRef.value.clientWidth
        const thumbOffset = activeThumb.offsetLeft
        const thumbWidth = activeThumb.clientWidth
        
        const scrollTarget = thumbOffset - containerWidth / 2 + thumbWidth / 2
        thumbnailsRef.value.scrollTo({
          left: scrollTarget,
          behavior: 'smooth'
        })
      }
    }
  })
}, { immediate: true })

onUnmounted(() => {
  document.body.style.overflow = ''
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.yuemu-image-preview-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  user-select: none;
  touch-action: none; /* 彻底禁用原生滑动和缩放 */
}

/* UI 渐隐动画 */
.yuemu-preview-header, .yuemu-preview-footer, .yuemu-preview-nav {
  transition: opacity 0.3s ease, visibility 0.3s ease;
}
.yuemu-hidden {
  opacity: 0;
  visibility: hidden;
}

/* 顶部栏 */
.yuemu-preview-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100000;
  background: linear-gradient(to bottom, rgba(0,0,0,0.5), transparent);
}

.yuemu-preview-index {
  color: #fff;
  font-size: 16px;
  font-family: monospace;
  letter-spacing: 1px;
}

/* 通用按钮 */
.yuemu-preview-btn {
  background: rgba(0,0,0,0.4);
  backdrop-filter: blur(4px);
  border: none;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.3s, transform 0.1s;
}
.yuemu-preview-btn:active {
  transform: scale(0.9);
}

.yuemu-preview-close {
  position: absolute;
  right: 16px;
  top: 16px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
}

/* 轨道与图片 */
.yuemu-preview-track {
  display: flex;
  height: 100%;
  will-change: transform;
}

.yuemu-preview-item {
  width: 100vw;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.yuemu-preview-img-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  will-change: transform;
}

.yuemu-preview-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transform-origin: center center;
  will-change: transform;
  cursor: grab;
}

.yuemu-preview-img:active {
  cursor: grabbing;
}

/* 加载动画 */
.yuemu-preview-loading {
  position: absolute;
  color: rgba(255,255,255,0.6);
  font-size: 32px;
}

/* PC导航 */
.yuemu-preview-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(0,0,0,0.4);
  border: none;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.3s;
  z-index: 100000;
}
.yuemu-preview-nav:hover { background: rgba(0,0,0,0.7); }
.yuemu-prev { left: 48px; }
.yuemu-next { right: 48px; }

/* 底部区域 */
.yuemu-preview-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  background: linear-gradient(to top, rgba(0,0,0,0.6), transparent);
  z-index: 100000;
  pointer-events: none; /* 让事件透传给图片层 */
}

/* 指示器 */
.yuemu-preview-dots {
  display: flex;
  gap: 8px;
  pointer-events: auto;
}
.yuemu-preview-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255,255,255,0.4);
  transition: all 0.3s ease;
}
.yuemu-preview-dot.yuemu-active {
  background: #fff;
  transform: scale(1.3);
}

/* 底部操作栏 */
.yuemu-preview-toolbar {
  display: flex;
  gap: 24px;
  pointer-events: auto;
}
.yuemu-preview-toolbar .yuemu-preview-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
}

/* 进出场动画 */
.yuemu-preview-fade-enter-active,
.yuemu-preview-fade-leave-active {
  transition: opacity 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.yuemu-preview-fade-enter-from,
.yuemu-preview-fade-leave-to {
  opacity: 0;
}

/* 移动端强制移除点击时的悬停缩放，防止底层长按死锁 */
@media (max-width: 768px) {
  .ant-card-hoverable:active, .ant-card-hoverable:hover,
  .ant-card-hoverable:active *, .ant-card-hoverable:hover *,
  .yuemu-preview-nav:active, .yuemu-preview-nav:hover,
  .yuemu-preview-nav:active *, .yuemu-preview-nav:hover * {
    transform: none !important;
  }
}

/* 顶部元数据信息 */
.yuemu-preview-info {
  position: absolute;
  left: 16px;
  display: flex;
  gap: 12px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
  font-family: monospace;
  background: rgba(0,0,0,0.4);
  padding: 4px 12px;
  border-radius: 12px;
  backdrop-filter: blur(4px);
}
.yuemu-info-item {
  position: relative;
}
.yuemu-info-item:not(:last-child)::after {
  content: '';
  position: absolute;
  right: -7px;
  top: 50%;
  transform: translateY(-50%);
  height: 10px;
  width: 1px;
  background: rgba(255,255,255,0.3);
}

/* 缩略图导航 */
.yuemu-preview-thumbnails {
  display: flex;
  gap: 8px;
  pointer-events: auto;
  overflow-x: auto;
  max-width: 90vw;
  padding: 4px;
}
.yuemu-preview-thumbnails::-webkit-scrollbar {
  display: none;
}
.yuemu-thumbnail-item {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  overflow: hidden;
  opacity: 0.5;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
  flex-shrink: 0;
}
.yuemu-thumbnail-item.yuemu-active {
  opacity: 1;
  border-color: #fff;
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
}
.yuemu-thumbnail-item:hover {
  opacity: 0.8;
}
.yuemu-thumbnail-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 缩放按钮群 */
.yuemu-zoom-controls {
  display: flex;
  background: rgba(0,0,0,0.4);
  backdrop-filter: blur(4px);
  border-radius: 22px;
  overflow: hidden;
}
.yuemu-text-btn {
  font-size: 13px;
  font-weight: 600;
  padding: 0 12px;
  width: auto;
  border-radius: 0;
  background: transparent;
  color: rgba(255,255,255,0.7);
}
.yuemu-text-btn.yuemu-active {
  background: rgba(255,255,255,0.2);
  color: #fff;
}

</style>


<style scoped>
.yuemu-preview-toast {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  color: #fff;
  padding: 16px 24px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  z-index: 100001;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  pointer-events: none;
}
.yuemu-preview-toast i {
  font-size: 32px;
}
.yuemu-preview-toast span {
  font-size: 15px;
  text-align: center;
  line-height: 1.5;
  max-width: 80vw;
}
</style>
