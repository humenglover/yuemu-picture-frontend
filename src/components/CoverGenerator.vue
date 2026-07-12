<template>
  <div class="yuemu-cover-generator-overlay" @click.self="$emit('close')">
    <div class="yuemu-generator-container">

      <header class="yuemu-generator-header">
        <h2><i class="fas fa-wand-magic-sparkles"></i> {{ t('components.coverGen.title') }}</h2>
        <button class="yuemu-close-btn" @click="$emit('close')" :disabled="isGenerating">
          <i class="fas fa-times"></i>
        </button>
      </header>

      <div class="yuemu-generator-body">

        <main class="yuemu-canvas-area">
          <div class="yuemu-canvas-wrapper">
            <canvas
              ref="canvasRef"
              @mousedown="onPointerDown"
              @mousemove="onPointerMove"
              @mouseup="onPointerUp"
              @mouseleave="onPointerUp"
              @touchstart.prevent="onPointerDown"
              @touchmove.prevent="onPointerMove"
              @touchend.prevent="onPointerUp"
              :style="{ cursor: draggingNode ? 'grabbing' : (hoverNode ? 'grab' : 'default') }"
            ></canvas>
          </div>

          <div class="yuemu-drag-hint">
            <i class="fas fa-hand-pointer"></i> {{ t('components.coverGen.dragHint') }}
          </div>

          <div class="yuemu-generating-overlay" v-if="isGenerating">
            <div class="yuemu-generating-content">
              <i class="fas fa-cloud-upload-alt fa-bounce"></i>
              <span>{{ t('components.coverGen.syncing') }}</span>
            </div>
          </div>

          <div class="yuemu-canvas-actions yuemu-pc-actions">
            <button class="yuemu-action-btn yuemu-outline" @click="downloadCover" :disabled="isGenerating">
              <i class="fas fa-download"></i> {{ t('components.coverGen.saveLocal') }}
            </button>
            <button class="yuemu-action-btn yuemu-primary" @click="useCover" :disabled="isGenerating">
              <template v-if="isGenerating">
                <i class="fas fa-circle-notch fa-spin"></i> {{ t('components.coverGen.uploading') }}
              </template>
              <template v-else>
                <i class="fas fa-check"></i> {{ t('components.coverGen.doneUse') }}
              </template>
            </button>
          </div>
        </main>

        <aside class="yuemu-sidebar yuemu-left-sidebar">
          <div class="yuemu-config-section">
            <h3><i class="fas fa-crop-alt"></i> {{ t('components.coverGen.ratio') }}</h3>
            <div class="yuemu-ratio-group yuemu-scroll-x">
              <button
                v-for="ratio in aspectRatios"
                :key="ratio.value"
                class="yuemu-ratio-btn"
                :class="{ 'is-active': selectedRatio.value === ratio.value }"
                @click="changeRatio(ratio)"
              >
                <div class="yuemu-ratio-icon" :style="{ aspectRatio: ratio.value.replace(':', '/') }"></div>
                <span>{{ ratio.label }}</span>
              </button>
            </div>
          </div>

          <div class="yuemu-config-section">
            <h3><i class="fas fa-layer-group"></i> {{ t('components.coverGen.layout') }}</h3>
            <div class="yuemu-layout-group yuemu-scroll-x">
              <button
                v-for="layout in layouts"
                :key="layout.value"
                class="yuemu-layout-btn"
                :class="{ 'is-active': selectedLayout.value === layout.value }"
                @click="changeLayout(layout)"
              >
                <i :class="layout.icon"></i>
                <span>{{ layout.label }}</span>
              </button>
            </div>
          </div>

          <div class="yuemu-config-section">
            <h3><i class="fas fa-swatchbook"></i> {{ t('components.coverGen.presetTheme') }}</h3>
            <div class="yuemu-themes-grid yuemu-scroll-x">
              <div
                v-for="(theme, index) in themes"
                :key="index"
                class="yuemu-theme-item"
                :class="{ 'is-active': selectedThemeIndex === index }"
                :style="{ background: theme.bg }"
                @click="selectTheme(index)"
              >
                <span class="yuemu-theme-name" :style="{ color: theme.text }">{{ theme.name }}</span>
              </div>
            </div>
          </div>
        </aside>

        <aside class="yuemu-sidebar yuemu-right-sidebar">
          <div class="yuemu-config-section">
            <h3><i class="fas fa-heading"></i> {{ t('components.coverGen.textContent') }}</h3>
            <div class="yuemu-input-group">
              <textarea v-model="coverText" :placeholder="t('components.coverGen.mainTitlePlaceholder')" maxlength="40" class="yuemu-clean-textarea" @input="renderCanvas"></textarea>
            </div>
            <div class="yuemu-input-group yuemu-mt-3">
              <input type="text" v-model="subText" :placeholder="t('components.coverGen.subTitlePlaceholder')" maxlength="30" class="yuemu-clean-input" @input="renderCanvas" />
            </div>
          </div>

          <div class="yuemu-config-section">
            <h3><i class="fas fa-text-height"></i> {{ t('components.coverGen.textStyle') }}</h3>
            <div class="yuemu-control-row">
              <span class="yuemu-label">{{ t('components.coverGen.fontSize') }}</span>
              <input type="range" v-model="fontSize" min="40" max="180" class="yuemu-range-slider" @input="renderCanvas" />
              <span class="yuemu-value">{{ fontSize }}</span>
            </div>
            <div class="yuemu-control-row yuemu-mt-3">
              <span class="yuemu-label">{{ t('components.coverGen.fontColor') }}</span>
              <div class="yuemu-color-picker-mini">
                <input type="color" v-model="customTextColor" @input="applyCustomColor" />
              </div>
            </div>
          </div>

          <div class="yuemu-config-section">
            <h3><i class="far fa-image"></i> {{ t('components.coverGen.bgSetting') }}</h3>
            <div class="yuemu-bg-options">
              <button class="yuemu-img-btn" @click="triggerImageUpload" :disabled="isGenerating">
                <i class="fas fa-upload"></i> {{ t('components.coverGen.localUpload') }}
              </button>
              <button class="yuemu-img-btn" @click="togglePresetSelector" v-if="presetTemplates.length > 0">
                <i class="fas fa-images"></i> {{ t('components.coverGen.presetGallery') }}
              </button>
              <button class="yuemu-img-btn" @click="toggleContentImageSelector" v-if="contentImages.length > 0">
                <i class="far fa-file-image"></i> {{ t('components.coverGen.extractContent') }}
              </button>
              <button class="yuemu-img-btn yuemu-danger yuemu-full-row" @click="clearBackgroundImage" v-if="backgroundImage">
                <i class="fas fa-trash-alt"></i> {{ t('components.coverGen.clearBg') }}
              </button>
            </div>
            <input type="file" ref="imageInputRef" accept="image/*" @change="handleImageUpload" hidden />

            <div class="yuemu-image-adjustments" v-if="backgroundImage">
              <div class="yuemu-control-row yuemu-mt-4">
                <span class="yuemu-label">{{ t('components.coverGen.bgBlur') }}</span>
                <input type="range" v-model="bgBlur" min="0" max="40" class="yuemu-range-slider" @input="renderCanvas" />
                <span class="yuemu-value">{{ bgBlur }}px</span>
              </div>
              <div class="yuemu-control-row yuemu-mt-3">
                <span class="yuemu-label">{{ t('components.coverGen.bgOverlay') }}</span>
                <input type="range" v-model="bgOverlay" min="0" max="90" class="yuemu-range-slider" @input="renderCanvas" />
                <span class="yuemu-value">{{ bgOverlay }}%</span>
              </div>
            </div>
          </div>

          <div class="yuemu-config-section" v-if="showPresetSelector">
            <h3>{{ t('components.coverGen.clickPreset') }}</h3>
            <div class="yuemu-content-images-grid yuemu-scroll-x">
              <div v-for="tpl in presetTemplates" :key="tpl.id"
                   class="yuemu-content-image-item"
                   @click="useImageSource(tpl.src)">
                <img :src="tpl.src" :alt="tpl.name" loading="lazy" />
              </div>
            </div>
          </div>

          <div class="yuemu-config-section" v-if="showImageSelector">
            <h3>{{ t('components.coverGen.clickArticleImage') }}</h3>
            <div class="yuemu-content-images-grid yuemu-scroll-x">
              <div v-for="(img, idx) in contentImages" :key="idx"
                   class="yuemu-content-image-item"
                   @click="useImageSource(img)">
                <img :src="img" :alt="t('components.coverGenerator.contentPicture')" loading="lazy" />
              </div>
            </div>
          </div>
        </aside>

      </div>

      <div class="yuemu-mobile-actions">
        <button class="yuemu-action-btn yuemu-outline" @click="downloadCover" :disabled="isGenerating">
          {{ t('components.coverGen.saveLocal') }}
        </button>
        <button class="yuemu-action-btn yuemu-primary" @click="useCover" :disabled="isGenerating">
          <template v-if="isGenerating">
            <i class="fas fa-circle-notch fa-spin"></i> {{ t('components.coverGen.processing') }}
          </template>
          <template v-else>
            {{ t('components.coverGen.doneUse') }}
          </template>
        </button>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { downloadImage as utilDownloadImage } from '@/utils'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
  contentImages?: string[]
  initialText?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', coverUrl: string): void
}>()

const canvasRef = ref<HTMLCanvasElement>()
const imageInputRef = ref<HTMLInputElement>()
const route = useRoute()

const textNodes = ref({ main: { x: -1, y: -1, w: 0, h: 0 }, sub: { x: -1, y: -1, w: 0, h: 0 } })
const draggingNode = ref<'main' | 'sub' | null>(null)
const hoverNode = ref<'main' | 'sub' | null>(null)
const dragOffset = { x: 0, y: 0 }

const aspectRatios = [
  { label: '3:4', value: '3:4', width: 900, height: 1200 },
  { label: '4:3', value: '4:3', width: 1200, height: 900 },
  { label: '1:1', value: '1:1', width: 1080, height: 1080 },
  { label: '16:9', value: '16:9', width: 1920, height: 1080 }
]
const selectedRatio = ref(aspectRatios[0])

const layouts = computed(() => [
  { label: t('components.coverGen.layoutMinimal'), value: 'minimal', icon: 'fas fa-align-center' },
  { label: t('components.coverGen.layoutMagazine'), value: 'magazine', icon: 'fas fa-border-style' },
  { label: t('components.coverGen.layoutCinematic'), value: 'cinematic', icon: 'fas fa-film' },
  { label: t('components.coverGen.layoutQuote'), value: 'quote', icon: 'fas fa-quote-left' },
  { label: t('components.coverGen.layoutNews'), value: 'news', icon: 'fas fa-newspaper' },
  { label: t('components.coverGen.layoutPolaroid'), value: 'polaroid', icon: 'far fa-image' }
])
const selectedLayout = ref(layouts.value[0])

const themes = computed(() => [
  { name: t('components.coverGen.themeCreamWood'), bg: '#FCFCFB', aura1: '#F4EFE6', aura2: '#FFFFFF', text: '#4A423A', sub: '#B3ACA3' },
  { name: t('components.coverGen.themeMatchaLatte'), bg: '#F6F8F4', aura1: '#EBF2E8', aura2: '#FFFFFF', text: '#3E4F42', sub: '#9CAAA0' },
  { name: t('components.coverGen.themeMinimalDark'), bg: '#232323', aura1: '#2E2E2E', aura2: '#1A1A1A', text: '#F5F5F5', sub: '#888888' },
  { name: t('components.coverGen.themeAshPinkRose'), bg: '#FFF7F8', aura1: '#FCEBEB', aura2: '#FFFFFF', text: '#665255', sub: '#C2AEB1' },
  { name: t('components.coverGen.themeTechDeepBlue'), bg: '#141E30', aura1: '#243B55', aura2: '#0B1320', text: '#E0F2FE', sub: '#7DD3FC' },
  { name: t('components.coverGen.themeCaramelSunset'), bg: '#F9F1EA', aura1: '#EAD5C5', aura2: '#FFFFFF', text: '#5C3E29', sub: '#B59D8A' },
  { name: t('components.coverGen.themeOatMilkWhite'), bg: '#FAF8F5', aura1: '#EAE6DF', aura2: '#FFFFFF', text: '#59534E', sub: '#B0A8A0' },
  { name: t('components.coverGen.themeLavenderGray'), bg: '#F7F6F9', aura1: '#E9E5F0', aura2: '#FFFFFF', text: '#4C4656', sub: '#A29BAA' },
  { name: t('components.coverGen.themeMintGlacier'), bg: '#F3FAFA', aura1: '#E2F0EF', aura2: '#FFFFFF', text: '#35544E', sub: '#98B3AD' },
  { name: t('components.coverGen.themeCharcoalSpar'), bg: '#3A3C3E', aura1: '#484A4D', aura2: '#2D2E30', text: '#EBECEE', sub: '#92969A' },
  { name: t('components.coverGen.themeWarmSandYellow'), bg: '#FCF9F2', aura1: '#F2E8D5', aura2: '#FFFFFF', text: '#615441', sub: '#B8AD9C' },
  { name: t('components.coverGen.themeAuroraPurple'), bg: '#292533', aura1: '#3D344D', aura2: '#1F1A26', text: '#F2E8FF', sub: '#9F92B2' },
  { name: t('components.coverGen.themeKleinBlue'), bg: '#002FA7', aura1: '#003ECC', aura2: '#001A66', text: '#FFFFFF', sub: '#80A8FF' },
  { name: t('components.coverGen.themeCyberNeon'), bg: '#0D0914', aura1: '#2A0845', aura2: '#000000', text: '#00FFFF', sub: '#FF00FF' }
])
const selectedThemeIndex = ref(0)
const activeTheme = computed(() => themes.value[selectedThemeIndex.value])

const coverText = ref(props.initialText || t('components.coverGen.defaultCoverText'))
const subText = ref(t('components.coverGen.defaultSubText'))
const fontSize = ref(72)
const customTextColor = ref(themes.value[0].text)

const backgroundImage = ref<HTMLImageElement | null>(null)
const showImageSelector = ref(false)
const showPresetSelector = ref(false)
const bgBlur = ref(0)
const bgOverlay = ref(30)
const contentImages = ref<string[]>(props.contentImages || [])
const presetTemplates = ref<{id: number, name: string, src: string}[]>([])

const isGenerating = ref(false)

// --- 逻辑函数 ---
const resetTextPositions = () => { textNodes.value.main.x = -1; textNodes.value.sub.x = -1 }

const changeRatio = (ratio: any) => {
  selectedRatio.value = ratio; fontSize.value = ratio.value.includes('16:9') ? 110 : 90;
  resetTextPositions(); nextTick(renderCanvas);
}

const changeLayout = (layout: any) => {
  selectedLayout.value = layout; resetTextPositions(); nextTick(renderCanvas);
}

const selectTheme = (index: number) => {
  selectedThemeIndex.value = index; customTextColor.value = themes[index].text; renderCanvas();
}

const applyCustomColor = () => renderCanvas()

const togglePresetSelector = () => { showPresetSelector.value = !showPresetSelector.value; if (showPresetSelector.value) showImageSelector.value = false; }
const toggleContentImageSelector = () => { showImageSelector.value = !showImageSelector.value; if (showImageSelector.value) showPresetSelector.value = false; }

function hashString(str: string) { let hash = 0; for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash) + str.charCodeAt(i); return Math.abs(hash); }
function seededRandom(seed: number) { let x = Math.sin(seed++) * 10000; return x - Math.floor(x); }

// 【重要】事件坐标计算：使用 rect 精准匹配视觉大小
const getLogicalPos = (e: MouseEvent | TouchEvent) => {
  const canvas = canvasRef.value; if (!canvas) return { x: 0, y: 0 }
  const rect = canvas.getBoundingClientRect()
  let clientX = window.TouchEvent && e instanceof TouchEvent ? e.touches[0].clientX : (e as MouseEvent).clientX
  let clientY = window.TouchEvent && e instanceof TouchEvent ? e.touches[0].clientY : (e as MouseEvent).clientY
  const scaleX = selectedRatio.value.width / rect.width, scaleY = selectedRatio.value.height / rect.height
  return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY }
}

const isInsideNode = (pos: {x: number, y: number}, node: {x: number, y: number, w: number, h: number}) => {
  if (node.x === -1) return false
  return pos.x >= node.x - node.w / 2 && pos.x <= node.x + node.w / 2 && pos.y >= node.y - node.h / 2 && pos.y <= node.y + node.h / 2
}

const onPointerDown = (e: MouseEvent | TouchEvent) => {
  const pos = getLogicalPos(e)
  if (subText.value && isInsideNode(pos, textNodes.value.sub)) { draggingNode.value = 'sub'; dragOffset.x = pos.x - textNodes.value.sub.x; dragOffset.y = pos.y - textNodes.value.sub.y }
  else if (coverText.value && isInsideNode(pos, textNodes.value.main)) { draggingNode.value = 'main'; dragOffset.x = pos.x - textNodes.value.main.x; dragOffset.y = pos.y - textNodes.value.main.y }
}

const onPointerMove = (e: MouseEvent | TouchEvent) => {
  const pos = getLogicalPos(e)
  if (draggingNode.value) { textNodes.value[draggingNode.value].x = pos.x - dragOffset.x; textNodes.value[draggingNode.value].y = pos.y - dragOffset.y; renderCanvas() }
  else { hoverNode.value = (subText.value && isInsideNode(pos, textNodes.value.sub)) ? 'sub' : (coverText.value && isInsideNode(pos, textNodes.value.main)) ? 'main' : null }
}

const onPointerUp = () => { draggingNode.value = null }

// --- 渲染引擎 ---
const renderCanvas = () => {
  const canvas = canvasRef.value; if (!canvas) return
  const ctx = canvas.getContext('2d'); if (!ctx) return

  const scale = window.devicePixelRatio || 2
  const w = selectedRatio.value.width, h = selectedRatio.value.height

  canvas.width = w * scale; canvas.height = h * scale
  ctx.scale(scale, scale)

  const theme = activeTheme.value
  const tColor = customTextColor.value || theme.text
  const layoutStyle = selectedLayout.value.value

  // 1. 绘制背景
  if (backgroundImage.value) {
    const img = backgroundImage.value
    const imgRatio = img.width / img.height, canvasRatio = w / h
    let drawW = w, drawH = h, offsetX = 0, offsetY = 0

    if (imgRatio > canvasRatio) { drawW = h * imgRatio; offsetX = (w - drawW) / 2 }
    else { drawH = w / imgRatio; offsetY = (h - drawH) / 2 }

    if (bgBlur.value > 0) {
      ctx.filter = `blur(${bgBlur.value}px)`
      ctx.drawImage(img, offsetX - 20, offsetY - 20, drawW + 40, drawH + 40)
      ctx.filter = 'none'
    } else {
      ctx.drawImage(img, offsetX, offsetY, drawW, drawH)
    }

    if (bgOverlay.value > 0) {
      ctx.fillStyle = `rgba(0, 0, 0, ${bgOverlay.value / 100})`; ctx.fillRect(0, 0, w, h)
    }
  } else {
    ctx.fillStyle = theme.bg; ctx.fillRect(0, 0, w, h)
    const seed = hashString(coverText.value + theme.name)
    ctx.filter = `blur(${Math.floor(w * 0.25)}px)`; ctx.globalAlpha = 0.9
    ctx.beginPath(); ctx.arc(seededRandom(seed)*w, seededRandom(seed+1)*h*0.5, w*0.6, 0, Math.PI*2); ctx.fillStyle = theme.aura1; ctx.fill()
    ctx.beginPath(); ctx.arc(seededRandom(seed+2)*w, h*0.5 + seededRandom(seed+3)*h*0.5, w*0.5, 0, Math.PI*2); ctx.fillStyle = theme.aura2; ctx.fill()
    ctx.filter = 'none'; ctx.globalAlpha = 1.0
  }

  // 2. 特殊版式装饰
  const margin = Math.floor(Math.min(w, h) * 0.08)
  let polaroidOffset = 0

  if (layoutStyle === 'magazine') {
    ctx.strokeStyle = backgroundImage.value ? 'rgba(255,255,255,0.4)' : theme.sub
    ctx.lineWidth = 2
    ctx.strokeRect(margin, margin, w - margin * 2, h - margin * 2)

    const topStr = 'E X C L U S I V E   I S S U E'
    ctx.font = `600 ${Math.max(16, w * 0.02)}px sans-serif`
    ctx.fillStyle = backgroundImage.value ? 'rgba(255,255,255,0.9)' : theme.text
    ctx.textAlign = 'center'; ctx.textBaseline = 'top'
    ctx.fillText(topStr, w / 2, margin + 30)

  } else if (layoutStyle === 'news') {
    ctx.fillStyle = tColor === '#FFFFFF' ? '#E60000' : '#FFD700'
    ctx.fillRect(margin, margin, w * 0.35, h * 0.08)
    ctx.fillStyle = tColor === '#FFFFFF' ? '#FFFFFF' : '#000000'
    ctx.font = `900 ${h * 0.04}px sans-serif`
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText('BREAKING', margin + (w * 0.35) / 2, margin + (h * 0.08) / 2)

  } else if (layoutStyle === 'quote') {
    ctx.font = `900 ${w * 0.4}px serif`
    ctx.fillStyle = backgroundImage.value ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)'
    ctx.textAlign = 'left'; ctx.textBaseline = 'top'
    ctx.fillText('“', margin, margin)

  } else if (layoutStyle === 'cinematic') {
    const barHeight = Math.floor(h * 0.15)
    ctx.fillStyle = '#050505'
    ctx.fillRect(0, 0, w, barHeight); ctx.fillRect(0, h - barHeight, w, barHeight)
  } else if (layoutStyle === 'polaroid') {
    const mBot = Math.max(h * 0.25, 200)
    polaroidOffset = - (mBot / 2) + (margin / 2)
    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,0.15)'; ctx.shadowBlur = 20; ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, w, margin); ctx.fillRect(0, h - mBot, w, mBot)
    ctx.fillRect(0, margin, margin, h - margin - mBot); ctx.fillRect(w - margin, margin, margin, h - margin - mBot)
    ctx.restore()
  }

  // 3. 绘制文字文本
  const drawText = (text: string, defaultY: number, size: number, isSub: boolean) => {
    if (!text) return 0
    const type = isSub ? 'sub' : 'main'
    ctx.font = `${isSub ? '500' : '900'} ${size}px "PingFang SC", "Microsoft YaHei", sans-serif`
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'

    const paddingX = margin * 2
    const maxWidth = w - paddingX * 2
    const lineHeight = size * 1.3

    const chars = text.split(''); let line = ''; const lines = []; let maxLineWidth = 0
    for (let n = 0; n < chars.length; n++) {
      const testLine = line + chars[n]
      const metrics = ctx.measureText(testLine)
      if (metrics.width > maxWidth && n > 0) {
        lines.push(line)
        if (ctx.measureText(line).width > maxLineWidth) maxLineWidth = ctx.measureText(line).width
        line = chars[n]
      } else { line = testLine }
    }
    lines.push(line)
    if (ctx.measureText(line).width > maxLineWidth) maxLineWidth = ctx.measureText(line).width

    const totalHeight = lines.length * lineHeight

    if (textNodes.value[type].x === -1) {
      textNodes.value[type].x = layoutStyle === 'quote' ? w/2 + margin : w/2
      textNodes.value[type].y = defaultY
    }

    textNodes.value[type].w = Math.max(maxLineWidth, 100) + 40
    textNodes.value[type].h = totalHeight + 40

    const drawX = textNodes.value[type].x
    const drawY = textNodes.value[type].y

    if (backgroundImage.value && layoutStyle !== 'polaroid') {
      ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 4
    } else {
      ctx.shadowColor = 'transparent'
    }

    ctx.fillStyle = isSub ? (backgroundImage.value && layoutStyle !== 'polaroid' ? 'rgba(255,255,255,0.9)' : theme.sub) : (layoutStyle === 'polaroid' && tColor === '#FFFFFF' ? '#333' : tColor)

    if (layoutStyle === 'quote' || layoutStyle === 'news') {
      ctx.textAlign = 'left'
    }

    const startY = drawY - totalHeight / 2 + lineHeight / 2
    lines.forEach((l, i) => {
      let finalX = drawX
      if (ctx.textAlign === 'left') finalX = drawX - maxLineWidth/2
      ctx.fillText(l, finalX, startY + i * lineHeight)
    })
    ctx.shadowColor = 'transparent'
    return totalHeight
  }

  ctx.font = `900 ${fontSize.value}px sans-serif`
  let mainLinesCount = 1; let testLine = ''
  for (let c of coverText.value) { testLine += c; if (ctx.measureText(testLine).width > w * 0.7) { mainLinesCount++; testLine = c } }

  const mainTotalH = mainLinesCount * (fontSize.value * 1.3)
  const hideStandardSub = (layoutStyle === 'cinematic' || layoutStyle === 'polaroid')
  const subH = (subText.value && !hideStandardSub) ? (fontSize.value * 0.4 * 1.3 + 20) : 0
  const combinedH = mainTotalH + subH

  let currentY = (h - combinedH) / 2 + (mainTotalH / 2) + polaroidOffset

  drawText(coverText.value, currentY, fontSize.value, false)

  if (subText.value) {
    if (layoutStyle === 'polaroid') {
      const bottomM = Math.max(h * 0.25, 200)
      drawText(subText.value, h - bottomM/2, fontSize.value * 0.4, true)
    } else if (layoutStyle === 'cinematic') {
      drawText(subText.value, h - Math.floor(h * 0.15)/2, fontSize.value * 0.35, true)
    } else {
      drawText(subText.value, currentY + mainTotalH/2 + 30, fontSize.value * 0.4, true)
    }
  }
}

const handleImageUpload = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const objectUrl = URL.createObjectURL(file)
  const img = new Image()
  img.onload = () => {
    backgroundImage.value = img
    customTextColor.value = '#FFFFFF'
    bgOverlay.value = 30
    renderCanvas()
    const input = event.target as HTMLInputElement
    if (input) input.value = ''
  }
  img.onerror = () => alert(t('components.coverGen.errReadImg'))
  img.src = objectUrl
}

const useImageSource = (imgSrc: string) => {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    backgroundImage.value = img
    customTextColor.value = '#FFFFFF'
    showImageSelector.value = false
    showPresetSelector.value = false
    bgBlur.value = 0
    bgOverlay.value = 30
    renderCanvas()
  }
  img.onerror = () => alert(t('components.coverGen.errLoadImg'))
  img.src = imgSrc
}

const clearBackgroundImage = () => {
  backgroundImage.value = null; customTextColor.value = activeTheme.value.text; renderCanvas()
}

const downloadCover = () => {
  const canvas = canvasRef.value; if (!canvas) return
  const base64Data = canvas.toDataURL('image/jpeg', 0.95)
  utilDownloadImage(base64Data, `Cover-${Date.now()}.jpg`)
}

const triggerImageUpload = () => imageInputRef.value?.click()

const useCover = () => {
  const canvas = canvasRef.value
  if (!canvas) return

  isGenerating.value = true

  try {
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
    emit('confirm', dataUrl)
  } catch (error) {
    console.error('导出画布失败:', error)
    alert(t('components.coverGen.errExport'))
    isGenerating.value = false
  }
}

const loadTemplates = () => {
  try {
    const frameModules = import.meta.glob('/src/assets/frames/*.(jpg|jpeg|png|gif|webp)', { eager: true })
    const templateList = []
    let index = 1

    for (const path in frameModules) {
      const module: any = frameModules[path]
      templateList.push({ id: index, name: t('components.coverGen.preset', { index }), src: module.default || path })
      index++
    }

    if (templateList.length === 0) {
      presetTemplates.value = [
        { id: 1, name: t('components.coverGen.presetAurora'), src: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=600&q=80' },
        { id: 2, name: t('components.coverGen.presetDarkTone'), src: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=600&q=80' },
        { id: 3, name: t('components.coverGen.presetTexture'), src: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=600&q=80' }
      ]
    } else {
      presetTemplates.value = templateList
    }
  } catch (error) {
    console.error('加载本地模版失败:', error)
  }
}

onMounted(() => {
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth

  document.body.style.overflow = 'hidden'
  document.body.style.paddingRight = `${scrollbarWidth}px`

  loadTemplates()
  nextTick(() => { setTimeout(renderCanvas, 50) })
})

onUnmounted(() => {
  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
})

watch(() => route.path, () => {
  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
  emit('close')
})

watch(() => props.initialText, (newText) => {
  if (newText) { coverText.value = newText; renderCanvas() }
})
</script>

<style scoped>
/* ==========================================
   全局与 PC 布局规范
   ========================================== */
.yuemu-cover-generator-overlay {
  position: fixed; inset: 0; background: rgba(0, 0, 0, 0.75); backdrop-filter: blur(10px);
  z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.yuemu-generator-container {
  background: var(--card-background, #ffffff); border-radius: 20px; width: 100%; max-width: 1300px; height: 88vh;
  display: flex; flex-direction: column; box-shadow: 0 30px 80px rgba(0, 0, 0, 0.3); overflow: hidden;
  transition: var(--theme-transition);
}

.yuemu-generator-header {
  padding: 18px 24px; border-bottom: 1px solid var(--border-color, #eaeaea); flex-shrink: 0;
  display: flex; justify-content: space-between; align-items: center; background: var(--card-background, #fff);
}
.yuemu-generator-header h2 { margin: 0; font-size: 18px; font-weight: 700; display: flex; align-items: center; gap: 8px; color: var(--text-primary, #222); }
.yuemu-generator-header h2 i { color: #1677ff; }
.yuemu-close-btn { background: var(--hover-background, #f5f5f5); border: none; font-size: 16px; color: var(--text-secondary, #666); cursor: pointer; transition: 0.2s; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.yuemu-close-btn:hover:not(:disabled) { background: #ffeceb; color: #ff3b30; transform: rotate(90deg); }
.yuemu-close-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.yuemu-generator-body { flex: 1; display: flex; overflow: hidden; background: var(--background, #f7f8fa); }

/* 左侧栏与右侧栏 */
.yuemu-sidebar { width: 340px; background: var(--card-background, #fff); padding: 24px; overflow-y: auto; flex-shrink: 0; }
.yuemu-left-sidebar { border-right: 1px solid var(--border-color, #eaeaea); }
.yuemu-right-sidebar { border-left: 1px solid var(--border-color, #eaeaea); }
.yuemu-sidebar::-webkit-scrollbar { width: 4px; }
.yuemu-sidebar::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.2); border-radius: 4px; }

.yuemu-config-section { margin-bottom: 32px; }
.yuemu-config-section h3 { font-size: 14px; font-weight: 700; margin: 0 0 16px 0; color: var(--text-primary, #333); display: flex; align-items: center; gap: 8px; opacity: 0.85; }

/* 按钮组 */
.yuemu-ratio-group, .yuemu-layout-group { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.yuemu-ratio-btn, .yuemu-layout-btn {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  background: var(--hover-background, #f4f5f7); border: 1px solid var(--border-color, transparent);
  padding: 14px 10px; border-radius: 12px; cursor: pointer; transition: 0.2s; color: var(--text-secondary, #555); font-size: 14px; font-weight: 500;
}
.yuemu-ratio-btn:hover, .yuemu-layout-btn:hover { background: var(--border-color, #eef2f9); color: #1677ff; }
.yuemu-ratio-btn.is-active, .yuemu-layout-btn.is-active { background: rgba(22, 119, 255, 0.1); border-color: #1677ff; color: #1677ff; font-weight: 700; }
.yuemu-ratio-icon { width: 16px; border: 2px solid currentColor; border-radius: 3px; }

.yuemu-themes-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.yuemu-theme-item {
  height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center;
  cursor: pointer; border: 1px solid rgba(128,128,128,0.2); transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); font-size: 14px; font-weight: 600;
}
.yuemu-theme-item:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.08); }
.yuemu-theme-item.is-active { box-shadow: 0 0 0 2px var(--card-background, #fff), 0 0 0 4px #1677ff; transform: scale(0.98); }

/* ==========================================
   ★ 画布核心区 (自动利用剩余空间并保持比例)
   ========================================== */
.yuemu-canvas-area {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 40px; position: relative; min-height: 0;
}

.yuemu-canvas-wrapper {
  flex: 1; width: 100%; min-height: 0;
  display: flex; align-items: center; justify-content: center;
}

canvas {
  display: block; max-width: 100%; max-height: 100%; width: auto; height: auto;
  border-radius: 12px; box-shadow: 0 24px 60px rgba(0,0,0,0.2);
  touch-action: none; background: var(--card-background, #fff);
}

.yuemu-drag-hint { margin-top: 20px; font-size: 13px; color: var(--text-secondary, #888); display: flex; align-items: center; gap: 6px; background: var(--hover-background, rgba(0,0,0,0.04)); padding: 8px 16px; border-radius: 20px; flex-shrink: 0; border: 1px solid var(--border-color); }

.yuemu-generating-overlay { position: absolute; inset: 0; background: var(--card-background, rgba(255, 255, 255, 0.85)); opacity: 0.9; display: flex; align-items: center; justify-content: center; z-index: 10; }
.yuemu-generating-content { display: flex; flex-direction: column; align-items: center; gap: 16px; color: #1677ff; font-size: 16px; font-weight: 600; }
.yuemu-generating-content i { font-size: 36px; }

.yuemu-canvas-actions { margin-top: 24px; display: flex; gap: 16px; flex-shrink: 0; }
.yuemu-action-btn { padding: 14px 32px; border-radius: 30px; font-size: 15px; font-weight: 600; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 8px; border: none; }
.yuemu-outline { background: var(--card-background, #fff); color: var(--text-primary, #333); box-shadow: 0 4px 12px var(--shadow-color, rgba(0,0,0,0.05)); border: 1px solid var(--border-color, #e0e0e0); }
.yuemu-outline:hover:not(:disabled) { background: var(--hover-background, #f9f9f9); transform: translateY(-2px); }
.yuemu-primary { background: #1677ff; color: #fff; box-shadow: 0 6px 20px rgba(22, 119, 255, 0.25); }
.yuemu-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(22, 119, 255, 0.35); filter: brightness(1.05); }
.yuemu-action-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none !important; }

.yuemu-clean-textarea, .yuemu-clean-input { width: 100%; padding: 14px; border: 1px solid var(--border-color, #e0e0e0); border-radius: 12px; background: var(--background, #f9f9f9); color: var(--text-primary, #333); font-size: 15px; outline: none; transition: 0.2s; font-family: inherit; }
.yuemu-clean-textarea { resize: vertical; min-height: 100px; line-height: 1.6; }
.yuemu-clean-textarea:focus, .yuemu-clean-input:focus { border-color: #1677ff; background: var(--card-background, #fff); box-shadow: 0 0 0 3px rgba(22,119,255,0.1); }

.yuemu-control-row { display: flex; align-items: center; gap: 16px; }
.yuemu-control-row .yuemu-label { font-size: 14px; color: var(--text-secondary, #555); width: 64px; }
.yuemu-control-row .yuemu-value { font-size: 13px; color: var(--text-secondary, #888); min-width: 48px; text-align: right; }
.yuemu-range-slider { flex: 1; height: 6px; background: var(--border-color, #e0e0e0); border-radius: 3px; outline: none; -webkit-appearance: none; }
.yuemu-range-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; border-radius: 50%; background: #1677ff; cursor: pointer; border: 3px solid var(--card-background, #fff); box-shadow: 0 2px 6px rgba(0,0,0,0.2); }
.yuemu-color-picker-mini input[type="color"] { width: 40px; height: 40px; border: none; border-radius: 8px; cursor: pointer; padding: 0; background: transparent; overflow: hidden; }
.yuemu-color-picker-mini input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; }
.yuemu-color-picker-mini input[type="color"]::-webkit-color-swatch { border: 1px solid var(--border-color, #ddd); border-radius: 8px; }

.yuemu-bg-options { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.yuemu-img-btn { padding: 12px; border-radius: 10px; border: 1px solid var(--border-color, #e0e0e0); background: var(--card-background, #fff); color: var(--text-primary, #444); font-size: 14px; font-weight: 500; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; gap: 6px; }
.yuemu-img-btn:hover:not(:disabled) { background: var(--hover-background, #f0f2f5); border-color: var(--text-secondary, #ccc); }
.yuemu-img-btn.yuemu-danger { color: #ff3b30; background: rgba(255, 59, 48, 0.1); border-color: transparent; }
.yuemu-img-btn.yuemu-danger:hover:not(:disabled) { background: rgba(255, 59, 48, 0.2); }
.yuemu-img-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.yuemu-full-row { grid-column: 1 / -1; }

.yuemu-content-images-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 16px; }
.yuemu-content-image-item { aspect-ratio: 1; border-radius: 10px; overflow: hidden; cursor: pointer; border: 2px solid transparent; transition: 0.2s; }
.yuemu-content-image-item:hover { border-color: #1677ff; transform: scale(1.03); }
.yuemu-content-image-item img { width: 100%; height: 100%; object-fit: cover; }

.yuemu-mt-3 { margin-top: 16px; }
.yuemu-mt-4 { margin-top: 24px; }
.yuemu-mobile-actions { display: none; }

/* ==========================================
   ★ 移动端完美优化体验 (大尺寸画布)
   ========================================== */
@media (max-width: 900px) {
  .yuemu-cover-generator-overlay { padding: 0; align-items: flex-end; }
  .yuemu-generator-container { height: 100dvh; border-radius: 0; flex-direction: column; }
  .yuemu-generator-header { padding: 16px; border-bottom: none; background: var(--card-background, #111); }
  .yuemu-close-btn { background: var(--hover-background, rgba(255,255,255,0.1)); }

  .yuemu-generator-body { flex-direction: column; overflow-y: auto; -webkit-overflow-scrolling: touch; padding-bottom: calc(90px + env(safe-area-inset-bottom)); background: var(--background, #fff); }

  /* 移动端赋予 48vh 高度，占据近半屏 */
  .yuemu-canvas-area {
    position: sticky; top: 0; z-index: 50;
    height: 48vh; min-height: 380px;
    padding: 16px 12px 10px;
    background: var(--background, #111); border-bottom: 1px solid var(--border-color, #222);
    flex: none; display: flex; flex-direction: column;
  }

  .yuemu-canvas-wrapper { flex: 1; width: 100%; min-height: 0; display: flex; align-items: center; justify-content: center; }

  /* 完全释放 canvas，让其填满 wrapper 的可用区域并保持自身真实比例 */
  canvas { max-width: 100%; max-height: 100%; width: auto; height: auto; border-radius: 8px; box-shadow: 0 8px 30px rgba(0,0,0,0.3); background: #fff; }

  .yuemu-drag-hint { color: var(--text-secondary, rgba(255,255,255,0.6)); background: transparent; padding: 0; margin-top: 10px; font-size: 12px; flex-shrink: 0; border: none; }
  .yuemu-pc-actions { display: none; }
  .yuemu-generating-overlay { background: var(--card-background, rgba(17, 17, 17, 0.85)); border-radius: 0; }

  .yuemu-left-sidebar, .yuemu-right-sidebar { width: 100%; padding: 20px 16px 0; border: none; background: transparent; overflow: visible; }

  .yuemu-config-section h3 { font-size: 15px; margin-bottom: 12px; }
  .yuemu-clean-textarea { min-height: 80px; padding: 14px; font-size: 16px; }
  .yuemu-clean-input { padding: 14px; font-size: 16px; }
  .yuemu-range-slider { height: 8px; }
  .yuemu-range-slider::-webkit-slider-thumb { width: 24px; height: 24px; }

  .yuemu-scroll-x {
    display: flex !important; flex-wrap: nowrap !important; overflow-x: auto; overflow-y: hidden !important;
    scroll-snap-type: x mandatory; gap: 12px; padding: 4px 16px 16px !important; margin: -4px -16px -16px;
    -webkit-overflow-scrolling: touch; scrollbar-width: none;
  }
  .yuemu-scroll-x::-webkit-scrollbar { display: none; }

  .yuemu-ratio-btn, .yuemu-layout-btn { flex: 0 0 auto; min-width: 86px; scroll-snap-align: center; }

  .yuemu-theme-item {
    flex: 0 0 auto; width: 44px; height: 44px; min-width: unset; border-radius: 50%;
    scroll-snap-align: center; margin-top: 12px;
  }
  .yuemu-theme-name { display: none; }
  .yuemu-theme-item.is-active { box-shadow: 0 0 0 2px var(--card-background, #fff), 0 0 0 4px #1677ff; transform: scale(1.1); }

  .yuemu-content-image-item { flex: 0 0 auto; width: 90px; height: 90px; scroll-snap-align: center; }

  .yuemu-mobile-actions {
    display: flex; position: fixed; bottom: 0; left: 0; right: 0;
    background: var(--card-background, rgba(255, 255, 255, 0.95)); backdrop-filter: blur(10px);
    padding: 12px 16px calc(12px + env(safe-area-inset-bottom)); gap: 12px;
    border-top: 1px solid var(--border-color, rgba(0,0,0,0.05)); z-index: 100; box-shadow: 0 -10px 20px rgba(0,0,0,0.03);
  }
  .yuemu-mobile-actions .yuemu-action-btn { flex: 1; padding: 14px 0; font-size: 16px; margin: 0; justify-content: center; }
}

/* 移动端强制移除点击时的悬停缩放，防止底层长按死锁 */
@media (max-width: 768px) {
  .ant-card-hoverable:active, .ant-card-hoverable:hover,
  .ant-card-hoverable:active *, .ant-card-hoverable:hover *,
  .yuemu-theme-item:active, .yuemu-theme-item:hover,
  .yuemu-theme-item:active *, .yuemu-theme-item:hover *,
  .yuemu-layout-btn:active, .yuemu-layout-btn:hover,
  .yuemu-layout-btn:active *, .yuemu-layout-btn:hover *,
  .yuemu-close-btn:active, .yuemu-close-btn:hover,
  .yuemu-close-btn:active *, .yuemu-close-btn:hover *,
  .yuemu-outline:active, .yuemu-outline:hover,
  .yuemu-outline:active *, .yuemu-outline:hover *,
  .yuemu-img-btn:active, .yuemu-img-btn:hover,
  .yuemu-img-btn:active *, .yuemu-img-btn:hover *,
  .yuemu-danger:active, .yuemu-danger:hover,
  .yuemu-danger:active *, .yuemu-danger:hover *,
  .yuemu-ratio-btn:active, .yuemu-ratio-btn:hover,
  .yuemu-ratio-btn:active *, .yuemu-ratio-btn:hover *,
  .yuemu-content-image-item:active, .yuemu-content-image-item:hover,
  .yuemu-content-image-item:active *, .yuemu-content-image-item:hover *,
  .yuemu-primary:active, .yuemu-primary:hover,
  .yuemu-primary:active *, .yuemu-primary:hover * {
    transform: none !important;
  }
}
</style>
