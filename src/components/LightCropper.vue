<template>
  <div class="lc-root" ref="rootRef">
    <img
      :src="img"
      ref="imgRef"
      class="lc-img"
      @load="onImgLoad"
      draggable="false"
    />

    <!-- 四块遮罩：裁剪框外区域变暗 -->
    <div class="lc-mask" :style="{ top: 0, left: 0, right: 0, height: box.y + 'px' }" />
    <div class="lc-mask" :style="{ top: box.y + 'px', left: 0, width: box.x + 'px', height: box.h + 'px' }" />
    <div class="lc-mask" :style="{ top: box.y + 'px', left: (box.x + box.w) + 'px', right: 0, height: box.h + 'px' }" />
    <div class="lc-mask" :style="{ top: (box.y + box.h) + 'px', left: 0, right: 0, bottom: 0 }" />

    <!-- 裁剪框 -->
    <div
      class="lc-box"
      :style="{ left: box.x + 'px', top: box.y + 'px', width: box.w + 'px', height: box.h + 'px' }"
      @mousedown.stop="onMoveStart"
      @touchstart.stop.passive="onMoveStart"
    >
      <!-- 三等分辅助线 -->
      <div class="lc-grid-line lc-gl-h" style="top: 33.33%" />
      <div class="lc-grid-line lc-gl-h" style="top: 66.66%" />
      <div class="lc-grid-line lc-gl-v" style="left: 33.33%" />
      <div class="lc-grid-line lc-gl-v" style="left: 66.66%" />

      <!-- 四角加粗装饰 -->
      <span class="lc-corner lc-tl" /><span class="lc-corner lc-tr" />
      <span class="lc-corner lc-bl" /><span class="lc-corner lc-br" />

      <!-- 8 个拖拽点 -->
      <div v-for="d in DIRS" :key="d" :class="['lc-handle', `lc-h-${d}`]"
           @mousedown.stop="e => onResizeStart(e, d)"
           @touchstart.stop.passive="e => onResizeStart(e, d)" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onUnmounted } from 'vue'

interface Props {
  img: string
  fixed?: boolean
  fixedNumber?: [number, number]
  autoCrop?: boolean
  autoCropArea?: number // 0~1
}

const props = withDefaults(defineProps<Props>(), {
  fixed: false,
  fixedNumber: () => [1, 1],
  autoCrop: true,
  autoCropArea: 1,
})

const emit = defineEmits<{ (e: 'imgLoad'): void }>()

const rootRef = ref<HTMLElement | null>(null)
const imgRef = ref<HTMLImageElement | null>(null)

const DIRS = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as const

// 裁剪框坐标（容器像素坐标）
const box = reactive({ x: 0, y: 0, w: 0, h: 0 })

// 计算图片在容器内的实际渲染位置（object-fit: contain 导致的 letterbox）
const getImgRect = () => {
  const root = rootRef.value
  const img = imgRef.value
  if (!root || !img || !img.naturalWidth) return null
  const cW = root.clientWidth, cH = root.clientHeight
  const nW = img.naturalWidth, nH = img.naturalHeight
  const imgAspect = nW / nH, containerAspect = cW / cH
  let w: number, h: number, x: number, y: number
  if (imgAspect > containerAspect) {
    w = cW; h = cW / imgAspect; x = 0; y = (cH - h) / 2
  } else {
    h = cH; w = cH * imgAspect; x = (cW - w) / 2; y = 0
  }
  return { x, y, w, h }
}

const goAutoCrop = () => {
  const rect = getImgRect()
  if (!rect) return
  const area = props.autoCropArea ?? 1
  if (props.fixed && props.fixedNumber) {
    const [rW, rH] = props.fixedNumber
    const maxW = rect.w * area
    const maxH = rect.h * area
    let w = maxW, h = w * rH / rW
    if (h > maxH) { h = maxH; w = h * rW / rH }
    box.w = w; box.h = h
    box.x = rect.x + (rect.w - w) / 2
    box.y = rect.y + (rect.h - h) / 2
  } else {
    box.w = rect.w * area; box.h = rect.h * area
    box.x = rect.x + (rect.w - box.w) / 2
    box.y = rect.y + (rect.h - box.h) / 2
  }
}

const onImgLoad = () => {
  goAutoCrop()
  emit('imgLoad')
}

// ─── 拖拽逻辑 ────────────────────────────────────────────────────
interface DragState {
  type: 'move' | 'resize'
  dir?: string
  startX: number; startY: number
  startBox: typeof box
}
let drag: DragState | null = null

const getXY = (e: MouseEvent | TouchEvent) =>
  e instanceof MouseEvent
    ? { x: e.clientX, y: e.clientY }
    : { x: e.touches[0].clientX, y: e.touches[0].clientY }

const onMoveStart = (e: MouseEvent | TouchEvent) => {
  const { x, y } = getXY(e)
  drag = { type: 'move', startX: x, startY: y, startBox: { ...box } }
  bindDrag()
}
const onResizeStart = (e: MouseEvent | TouchEvent, dir: string) => {
  const { x, y } = getXY(e)
  drag = { type: 'resize', dir, startX: x, startY: y, startBox: { ...box } }
  bindDrag()
}

const MIN = 30
const onDrag = (e: MouseEvent | TouchEvent) => {
  if (!drag || !rootRef.value) return
  if (e.cancelable) e.preventDefault()
  const { x, y } = getXY(e)
  const dx = x - drag.startX, dy = y - drag.startY
  const rect = getImgRect()
  if (!rect) return
  const sb = drag.startBox

  if (drag.type === 'move') {
    box.x = Math.max(rect.x, Math.min(rect.x + rect.w - box.w, sb.x + dx))
    box.y = Math.max(rect.y, Math.min(rect.y + rect.h - box.h, sb.y + dy))
  } else {
    applyResize(drag.dir!, dx, dy, sb, rect)
  }
}

const applyResize = (
  dir: string, dx: number, dy: number,
  sb: typeof box,
  rect: { x: number; y: number; w: number; h: number }
) => {
  let { x, y, w, h } = sb
  if (dir.includes('n')) { y = sb.y + dy; h = sb.h - dy }
  if (dir.includes('s')) { h = sb.h + dy }
  if (dir.includes('w')) { x = sb.x + dx; w = sb.w - dx }
  if (dir.includes('e')) { w = sb.w + dx }

  // 固定比例约束
  if (props.fixed && props.fixedNumber) {
    const [rW, rH] = props.fixedNumber
    if (dir === 'n' || dir === 's') { w = h * rW / rH }
    else if (dir === 'e' || dir === 'w') { h = w * rH / rW }
    else {
      // 对角线：以主方向为准
      if (dir.includes('e') || dir.includes('w')) h = w * rH / rW
      else w = h * rW / rH
    }
  }

  // 最小尺寸
  if (w < MIN) { w = MIN; if (dir.includes('w')) x = sb.x + sb.w - MIN }
  if (h < MIN) { h = MIN; if (dir.includes('n')) y = sb.y + sb.h - MIN }

  // 边界约束
  x = Math.max(rect.x, x); y = Math.max(rect.y, y)
  if (x + w > rect.x + rect.w) { w = rect.x + rect.w - x }
  if (y + h > rect.y + rect.h) { h = rect.y + rect.h - y }

  box.x = x; box.y = y; box.w = w; box.h = h
}

const onDragEnd = () => { drag = null; unbindDrag() }
const bindDrag = () => {
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', onDragEnd)
  document.addEventListener('touchmove', onDrag, { passive: false })
  document.addEventListener('touchend', onDragEnd)
}
const unbindDrag = () => {
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', onDragEnd)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('touchend', onDragEnd)
}
onUnmounted(unbindDrag)

// ─── getCropBlob：映射到原始图像坐标并输出 ────────────────────────
const getCropBlob = (callback: (b: Blob) => void, type = 'image/jpeg', quality = 0.9) => {
  const img = imgRef.value
  const rect = getImgRect()
  if (!img || !rect) return

  const relX = Math.max(0, (box.x - rect.x) / rect.w)
  const relY = Math.max(0, (box.y - rect.y) / rect.h)
  const relW = Math.min(1 - relX, box.w / rect.w)
  const relH = Math.min(1 - relY, box.h / rect.h)

  const nW = img.naturalWidth, nH = img.naturalHeight
  const sx = Math.round(relX * nW), sy = Math.round(relY * nH)
  const sw = Math.round(relW * nW), sh = Math.round(relH * nH)

  const canvas = document.createElement('canvas')
  canvas.width = sw; canvas.height = sh
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 直接用已加载的 img 元素绘制（无需重新 fetch）
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh)
  canvas.toBlob(b => b && callback(b), type, quality)
}

// ─── 对外暴露（兼容原来 cropperRef.value.xxx 调用）─────────────────
defineExpose({ getCropBlob, goAutoCrop })
</script>

<style scoped>
.lc-root {
  position: absolute; inset: 0;
  overflow: hidden;
  cursor: crosshair;
  user-select: none;
}
.lc-img {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  object-fit: contain;
  pointer-events: none;
  display: block;
}
.lc-mask {
  position: absolute;
  background: rgba(0, 0, 0, 0.5);
  pointer-events: none;
}
.lc-box {
  position: absolute;
  border: 1px solid rgba(255, 255, 255, 0.9);
  box-sizing: border-box;
  cursor: move;
}
/* 三等分线 */
.lc-grid-line {
  position: absolute;
  background: rgba(255, 255, 255, 0.25);
  pointer-events: none;
}
.lc-gl-h { left: 0; right: 0; height: 1px; transform: translateY(-50%); }
.lc-gl-v { top: 0; bottom: 0; width: 1px; transform: translateX(-50%); }

/* 四角加粗 */
.lc-corner {
  position: absolute;
  width: 14px; height: 14px;
  border-color: #fff; border-style: solid;
  pointer-events: none;
}
.lc-tl { top: -1px; left: -1px; border-width: 3px 0 0 3px; }
.lc-tr { top: -1px; right: -1px; border-width: 3px 3px 0 0; }
.lc-bl { bottom: -1px; left: -1px; border-width: 0 0 3px 3px; }
.lc-br { bottom: -1px; right: -1px; border-width: 0 3px 3px 0; }

/* 8 个拖拽点 */
.lc-handle {
  position: absolute;
  width: 14px; height: 14px;
  background: #fff;
  border-radius: 50%;
  border: 2px solid rgba(10, 132, 255, 0.9);
  box-shadow: 0 1px 4px rgba(0,0,0,0.4);
  transform: translate(-50%, -50%);
}
.lc-h-nw { top: 0; left: 0; cursor: nw-resize; }
.lc-h-n  { top: 0; left: 50%; cursor: n-resize; }
.lc-h-ne { top: 0; left: 100%; cursor: ne-resize; }
.lc-h-e  { top: 50%; left: 100%; cursor: e-resize; }
.lc-h-se { top: 100%; left: 100%; cursor: se-resize; }
.lc-h-s  { top: 100%; left: 50%; cursor: s-resize; }
.lc-h-sw { top: 100%; left: 0; cursor: sw-resize; }
.lc-h-w  { top: 50%; left: 0; cursor: w-resize; }
</style>
