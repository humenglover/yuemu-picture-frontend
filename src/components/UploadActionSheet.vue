<template>
  <Teleport to="body" :disabled="!modelValue">
    <Transition name="yuemu-fade">
      <div v-show="modelValue" class="yuemu-action-portal" @touchmove.prevent @wheel.prevent>
        <div class="yuemu-portal-backdrop" @click="closePortal"></div>

        <div class="yuemu-portal-content">
          <div class="yuemu-mobile-handle yuemu-mobile-only"></div>
          <div class="yuemu-mobile-close yuemu-mobile-only" @click="closePortal">
            <van-icon name="cross" />
          </div>

          <div class="yuemu-bg-watermark yuemu-pc-only">{{ t('components.uploadActionSheet.createWatermark') }}<br>{{ t('components.uploadActionSheet.shareWatermark') }}</div>

          <div class="yuemu-portal-header">
            <h2 class="yuemu-portal-title">{{ t('components.uploadActionSheet.creationCenter') }}</h2>
            <p class="yuemu-portal-subtitle">{{ t('components.uploadActionSheet.recordAndShareInspiration') }}</p>
          </div>

          <div class="yuemu-action-grid">
            <div
              v-for="(action, index) in actions"
              :key="action.name"
              class="yuemu-action-wrapper"
              :class="[`yuemu-item-${index}`, `yuemu-theme-${action.theme}`]"
              :ref="el => { if (el) cardRefs[index] = el as HTMLElement }"
              @click="onSelect(action)"
              @mousemove="handleMouseMove($event, index)"
              @mouseleave="handleMouseLeave(index)"
            >
              <div class="yuemu-ambient-glow"></div>

              <div class="yuemu-action-card">
                <div class="yuemu-bg-number">0{{ index + 1 }}</div>

                <div class="yuemu-visual-section">
                  <img :src="action.image" :alt="action.name" class="yuemu-action-img" />
                </div>

                <div class="yuemu-info-section">
                  <span class="yuemu-category-tag">{{ action.tag }}</span>
                  <h3 class="yuemu-action-label">{{ action.name }}</h3>
                  <p class="yuemu-action-info">{{ action.subname }}</p>
                </div>

                <div class="yuemu-go-arrow">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </div>
              </div>
            </div>
          </div>

          <button class="yuemu-portal-close-btn yuemu-pc-only" @click="closePortal">
            <van-icon name="cross" />
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

import { ref, watch, computed, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message } from 'ant-design-vue'

import uploadIllustration from '@/assets/illustrations/upload-illustration.png'
import postIllustration from '@/assets/illustrations/post.png'

const props = defineProps({
  modelValue: { type: Boolean, required: true }
})

const emit = defineEmits(['update:modelValue'])
const router = useRouter()
const route = useRoute()

const cardRefs = ref<HTMLElement[]>([])

const actions = computed(() => [
  {
    name: t('components.uploadActionSheet.publishGalleryWork'),
    subname: t('components.uploadActionSheet.enterGallerySquareAfterReview'),
    tag: t('components.uploadActionSheet.featuredGallery'),
    theme: 'azure',
    path: '/add_picture',
    image: uploadIllustration
  },
  {
    name: t('components.uploadActionSheet.writeLifeDynamics'),
    subname: t('components.uploadActionSheet.multiImageTypesettingRecordDaily'),
    tag: t('components.uploadActionSheet.lifeDynamics'),
    theme: 'indigo',
    path: '/post/edit',
    image: postIllustration
  },
])

watch(() => route.path, () => {
  if (props.modelValue) {
    emit('update:modelValue', false)
  }
})



const closePortal = () => {
  emit('update:modelValue', false)
}

const handleMouseMove = (e: MouseEvent, index: number) => {
  if (window.matchMedia('(hover: none)').matches) return

  const wrapper = cardRefs.value[index]
  if (!wrapper) return

  const card = wrapper.querySelector('.yuemu-action-card') as HTMLElement
  const img = wrapper.querySelector('.yuemu-action-img') as HTMLElement
  const arrow = wrapper.querySelector('.yuemu-go-arrow') as HTMLElement
  if (!card || !img) return

  const rect = wrapper.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const cx = rect.width / 2
  const cy = rect.height / 2

  const tiltX = ((y - cy) / cy) * -8
  const tiltY = ((x - cx) / cx) * 8

  card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`
  img.style.transform = `translateZ(50px) scale(1.08) translateX(${tiltY}px)`
  if(arrow) arrow.style.transform = `translateZ(25px) translateX(4px)`
}

const handleMouseLeave = (index: number) => {
  const wrapper = cardRefs.value[index]
  if (!wrapper) return

  const card = wrapper.querySelector('.yuemu-action-card') as HTMLElement
  const img = wrapper.querySelector('.yuemu-action-img') as HTMLElement
  const arrow = wrapper.querySelector('.yuemu-go-arrow') as HTMLElement
  if (!card || !img) return

  card.style.transition = 'all 0.5s cubic-bezier(0.23, 1, 0.32, 1)'
  card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)'
  img.style.transition = 'all 0.5s cubic-bezier(0.23, 1, 0.32, 1)'
  img.style.transform = 'translateZ(0) scale(1) translateX(0)'
  if(arrow) {
    arrow.style.transition = 'all 0.5s cubic-bezier(0.23, 1, 0.32, 1)'
    arrow.style.transform = 'translateZ(0) translateX(0)'
  }

  setTimeout(() => {
    card.style.transition = ''
    img.style.transition = ''
    if(arrow) arrow.style.transition = ''
  }, 500)
}

const onSelect = (action: any) => {
  closePortal()
  router.push(action.path).catch(() => message.error(t('components.uploadActionSheet.jumpFailed')))
}
</script>

<style scoped>
/* =========================================
   1. 全局动画设定
   ========================================= */
.yuemu-fade-enter-active, .yuemu-fade-leave-active { transition: opacity 0.3s ease; }
.yuemu-fade-enter-from, .yuemu-fade-leave-to { opacity: 0; }
.yuemu-fade-enter-active .yuemu-portal-content { animation: yuemu-slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.yuemu-fade-leave-active .yuemu-portal-content { animation: yuemu-slideDownFade 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

@keyframes yuemu-slideUpFade {
  from { opacity: 0; transform: translate3d(0, 40px, 0) scale(0.96); }
  to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
}
@keyframes yuemu-slideDownFade {
  from { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
  to { opacity: 0; transform: translate3d(0, 20px, 0) scale(0.96); }
}

.yuemu-pc-only { display: none; }
.yuemu-mobile-only { display: block; }

/* =========================================
   2. 底层遮罩与容器
   ========================================= */
.yuemu-action-portal {
  position: fixed; inset: 0; z-index: 9999;
  display: flex; align-items: flex-end; justify-content: center;
}

.yuemu-portal-backdrop {
  position: absolute; inset: 0;
  background: rgba(0, 0, 0, 0.6);
}

.yuemu-portal-content {
  position: relative; width: 100%;
  background: var(--background, #ffffff);
  border-radius: 28px 28px 0 0;
  padding: 20px 20px calc(24px + env(safe-area-inset-bottom));
  overflow: hidden;
  box-shadow: 0 -10px 40px var(--shadow-color, rgba(0,0,0,0.1));
  transition: background-color 0.3s ease;
  will-change: transform, opacity;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transform: translate3d(0, 0, 0);
}

.yuemu-mobile-handle {
  width: 36px; height: 4px;
  background: var(--border-color, #e5e7eb);
  border-radius: 10px; margin: 0 auto 20px;
}

.yuemu-mobile-close {
  position: absolute; top: 16px; right: 16px;
  width: 32px; height: 32px; border-radius: 50%;
  background: var(--hover-background, #f3f4f6);
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; color: var(--text-secondary, #6b7280);
  cursor: pointer;
}

.yuemu-portal-header { margin-bottom: 24px; position: relative; z-index: 2;}
.yuemu-portal-title { font-size: 24px; font-weight: 800; color: var(--text-primary, #111); margin-bottom: 4px; }
.yuemu-portal-subtitle { font-size: 13px; font-weight: 500; color: var(--text-secondary, #888); letter-spacing: 0.5px; }

/* =========================================
   3. 卡片交互与布局
   ========================================= */
.yuemu-action-grid {
  display: flex; flex-direction: column; gap: 20px;
  position: relative; z-index: 2;
}

.yuemu-action-wrapper {
  position: relative;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.yuemu-item-0 { margin-right: 12%; }
.yuemu-item-1 { margin-left: 12%; }

.yuemu-ambient-glow {
  position: absolute; inset: 0;
  border-radius: 24px;
  filter: blur(24px);
  opacity: 0.15;
  transition: opacity 0.4s ease;
  will-change: opacity;
  transform: translate3d(0, 0, 0);
}
.yuemu-theme-azure .yuemu-ambient-glow { background: #00f2fe; }
.yuemu-theme-indigo .yuemu-ambient-glow { background: #667eea; }
.yuemu-action-wrapper:hover .yuemu-ambient-glow { opacity: 0.35; }

.yuemu-action-card {
  position: relative;
  height: 120px;
  background: var(--card-background, #ffffff);
  border: 1px solid var(--border-color, rgba(0,0,0,0.05));
  box-shadow: 0 8px 24px var(--shadow-color, rgba(0,0,0,0.05));
  padding: 20px 20px 16px;
  display: flex; flex-direction: column; justify-content: flex-end;
  overflow: visible;
  transition: background-color 0.3s ease, border-color 0.3s ease;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.yuemu-item-0 .yuemu-action-card { border-radius: 32px 10px 32px 10px; }
.yuemu-item-1 .yuemu-action-card { border-radius: 10px 32px 10px 32px; }

.yuemu-bg-number {
  position: absolute;
  font-size: 64px;
  font-weight: 900; font-style: italic;
  color: var(--text-primary, #000);
  opacity: 0.05;
  z-index: 0; pointer-events: none;
  line-height: 1;
}

.yuemu-item-0 .yuemu-bg-number { top: -12px; left: 12px; }
.yuemu-item-1 .yuemu-bg-number { bottom: -4px; right: 12px; }

.yuemu-visual-section {
  position: absolute;
  top: -24px; right: -8px;
  width: 86px; height: 86px;
  pointer-events: none;
}

.yuemu-item-1 .yuemu-visual-section { right: auto; left: -12px; top: -30px; width: 96px; height: 96px; }

.yuemu-action-img {
  width: 100%; height: 100%; object-fit: contain;
  filter: drop-shadow(0 8px 12px rgba(0,0,0,0.1));
  transform: translate3d(0, 0, 0);
  will-change: transform;
}

.yuemu-info-section { position: relative; z-index: 2; }
.yuemu-item-1 .yuemu-info-section { text-align: right; }

.yuemu-category-tag {
  display: inline-block; font-size: 11px; font-weight: 700;
  padding: 3px 8px; border-radius: 6px; margin-bottom: 6px;
}
.yuemu-theme-azure .yuemu-category-tag { background: rgba(0, 123, 255, 0.1); color: #3b82f6; }
.yuemu-theme-indigo .yuemu-category-tag { background: rgba(101, 31, 255, 0.1); color: #8b5cf6; }

.yuemu-action-label { font-size: 18px; font-weight: 800; color: var(--text-primary, #111); margin-bottom: 2px;}
.yuemu-action-info { font-size: 12px; color: var(--text-secondary, #777); font-weight: 500;}

.yuemu-go-arrow {
  position: absolute; bottom: 16px; right: 20px;
  width: 28px; height: 28px; border-radius: 50%;
  background: var(--text-primary, #111);
  color: var(--background, #fff);
  display: flex; align-items: center; justify-content: center;
}
.yuemu-go-arrow svg { width: 14px; height: 14px; }
.yuemu-item-1 .yuemu-go-arrow { right: auto; left: 20px; transform: scaleX(-1); }

/* =========================================
   4. PC 端布局
   ========================================= */
@media (min-width: 768px) {
  .yuemu-pc-only { display: block; }
  .yuemu-mobile-only { display: none; }

  .yuemu-action-wrapper { perspective: 1000px; }
  .yuemu-action-card { transform-style: preserve-3d; }
  .yuemu-action-img { transform: translateZ(16px); }
  .yuemu-go-arrow { transform: translateZ(8px); }
  .yuemu-item-1 .yuemu-go-arrow { transform: scaleX(-1) translateZ(8px); }

  .yuemu-action-portal { align-items: center; }

  .yuemu-portal-content {
    width: 100vw; height: 100vh; border-radius: 0; padding: 0;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    background: transparent; box-shadow: none;
  }

  .yuemu-bg-watermark {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
    font-size: 16vw; font-weight: 900; line-height: 1; text-align: center; letter-spacing: 2vw;
    color: var(--text-primary, #fff); opacity: 0.03;
    white-space: nowrap; pointer-events: none; z-index: 1;
    text-indent: 2vw;
  }

  .yuemu-portal-header { text-align: center; margin-bottom: 60px; padding: 0; }
  .yuemu-portal-title { font-size: 42px; margin-bottom: 12px; color: #ffffff; }
  .yuemu-portal-subtitle { font-size: 16px; letter-spacing: 2px; color: rgba(255, 255, 255, 0.7); }

  .yuemu-action-grid {
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 60px;
  }

  .yuemu-item-0 {
    transform: translateY(-30px);
    margin: 0;
  }

  .yuemu-item-1 {
    transform: translateY(30px);
    margin: 0;
  }

  .yuemu-action-card {
    width: 320px; height: 380px; padding: 40px 30px;
    background: var(--card-background, rgba(24, 24, 28, 0.95));
    box-shadow: 0 20px 50px var(--shadow-color, rgba(0,0,0,0.1));
  }

  .yuemu-action-label { font-size: 26px; margin-bottom: 8px;}
  .yuemu-bg-number { font-size: 100px; }
  .yuemu-item-0 .yuemu-bg-number { top: -10px; left: 20px; }
  .yuemu-item-1 .yuemu-bg-number { bottom: -5px; right: 20px; }

  .yuemu-visual-section, .yuemu-item-1 .yuemu-visual-section {
    width: 200px; height: 200px; top: -70px; left: 50%; margin-left: -100px;
  }

  .yuemu-item-1 .yuemu-info-section { text-align: left; }
  .yuemu-go-arrow { width: 40px; height: 40px; bottom: 30px; right: 30px;}
  .yuemu-go-arrow svg { width: 20px; height: 20px; }
  .yuemu-item-1 .yuemu-go-arrow { left: auto; right: 30px; transform: none; }

  .yuemu-portal-close-btn {
    position: absolute; top: 40px; right: 40px;
    width: 54px; height: 54px; border-radius: 50%;
    background: var(--card-background, rgba(255,255,255,0.1));
    border: 1px solid var(--border-color, rgba(255,255,255,0.15));
    display: flex; align-items: center; justify-content: center;
    font-size: 22px; cursor: pointer; color: var(--text-secondary, #fff); z-index: 10;
    transition: all 0.3s ease;
  }
  .yuemu-portal-close-btn:hover {
    background: var(--hover-background, rgba(255,255,255,0.25));
    color: var(--text-primary, #fff);
    transform: rotate(90deg) scale(1.1);
  }
}

/* 移动端强制移除点击时的悬停缩放，防止底层长按死锁 */
@media (max-width: 768px) {
  .ant-card-hoverable:active, .ant-card-hoverable:hover,
  .ant-card-hoverable:active *, .ant-card-hoverable:hover *,
  .yuemu-action-wrapper:active, .yuemu-action-wrapper:hover,
  .yuemu-action-wrapper:active *, .yuemu-action-wrapper:hover *,
  .yuemu-portal-close-btn:active, .yuemu-portal-close-btn:hover,
  .yuemu-portal-close-btn:active *, .yuemu-portal-close-btn:hover * {
    transform: none !important;
  }
}
</style>
