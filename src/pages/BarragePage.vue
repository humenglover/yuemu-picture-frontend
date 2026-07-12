<template>
  <div class="yuemu-barrage-page">
    <div
      class="yuemu-bg-image"
      :class="{ 'is-loaded': isImageLoaded }"
      :style="{
        backgroundImage: randomBackgroundImage ? `url(${randomBackgroundImage})` : 'none'
      }"
    ></div>

    <div class="yuemu-barrage-wrapper">
      <Barrage
        ref="barrageRef"
        :speed="barrageSpeed"
        :showInput="showInput"
      />
    </div>

    <transition name="yuemu-fade">
      <div
        class="yuemu-overlay"
        v-if="showControls && isMobileView"
        @click="showControls = false"
      ></div>
    </transition>

    <div class="yuemu-control-panel" :class="{ 'is-show': showControls }">
      <div class="yuemu-drag-indicator" v-if="isMobileView"></div>

      <div class="yuemu-panel-header">
        <h3>{{ $t('pages.barragePage.console') }}</h3>
        <a-switch
          v-model:checked="showInput"
          :checked-children="$t('pages.barragePage.showInput')"
          :un-checked-children="$t('pages.barragePage.hideInput')"
          class="yuemu-custom-switch"
        />
      </div>

      <div class="yuemu-panel-body">
        <div class="yuemu-control-item">
          <div class="yuemu-label-wrap">
            <span class="yuemu-label">{{ $t('pages.barragePage.speed') }}</span>
            <span class="yuemu-value">{{ $t('pages.barragePage.seconds', { sec: barrageSpeed / 1000 }) }}</span>
          </div>
          <a-slider
            v-model:value="barrageSpeed"
            :min="8000"
            :max="15000"
            :step="1000"
            :tooltipOpen="false"
            class="yuemu-custom-slider"
          />
        </div>
      </div>
    </div>

    <button class="yuemu-fab-btn" :class="{ 'is-active': showControls }" @click="showControls = !showControls">
      <SettingOutlined class="yuemu-fab-icon" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

import { ref, onMounted, watch, onUnmounted } from 'vue'
import { SettingOutlined } from '@ant-design/icons-vue'
import Barrage from '@/components/Barrage.vue'
import { BARRAGE_BACKGROUND_URLS, MOBILE_BARRAGE_BACKGROUND_URLS } from '@/constants/background'

const isMobile = () => window.innerWidth <= 768

const isMobileView = ref(isMobile())
const randomBackgroundImage = ref<string>('')
const isImageLoaded = ref(false)
let lastIsMobile = isMobile()

// 封装背景加载函数
const loadBackground = () => {
  const isMob = isMobile()
  const urls = isMob ? MOBILE_BARRAGE_BACKGROUND_URLS : BARRAGE_BACKGROUND_URLS
  const url = urls[Math.floor(Math.random() * urls.length)]

  // 预加载图片
  const img = new Image()
  img.src = url
  img.onload = () => {
    randomBackgroundImage.value = url
    isImageLoaded.value = true
  }
}

const handleResize = () => {
  isMobileView.value = isMobile()
  const currentIsMobile = isMobile()
  if (currentIsMobile !== lastIsMobile) {
    lastIsMobile = currentIsMobile
    isImageLoaded.value = false
    loadBackground()
  }
}

onMounted(() => {
  loadBackground()
  window.addEventListener('resize', handleResize)

  // 强制锁定视口，防止滚动条导致的错位
  document.body.style.overflow = 'hidden'
  document.body.style.margin = '0'
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  document.body.style.overflow = ''
  document.body.style.margin = ''
})

// 控制状态
const showControls = ref(false)
const showInput = ref(true)
const barrageSpeed = ref(8000)
const barrageRef = ref()

// 监听设置变化同步给组件
watch([barrageSpeed, showInput], ([newSpeed, newShowInput]) => {
  if (barrageRef.value) {
    barrageRef.value.updateSpeed(newSpeed)
    barrageRef.value.updateShowInput(newShowInput)
  }
}, { immediate: true })
</script>

<style scoped lang="scss">
.yuemu-barrage-page {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  width: 100vw; height: 100vh; height: 100dvh;
  margin: 0 !important; padding: 0;
  overflow: hidden;
  z-index: 1000;
  background-color: #000;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

/* ================== 背景层 ================== */
.yuemu-bg-image {
  position: absolute;
  inset: -20px; /* 稍微放大一点点以适应模糊边缘 */
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  filter: brightness(0.7) blur(4px); /* 加点暗化和轻微模糊，凸显弹幕 */
  z-index: 0;
  opacity: 0;
  transform: scale(1.05);
  transition: opacity 1.2s ease-in-out, transform 10s ease-out;
}
.yuemu-bg-image.is-loaded {
  opacity: 1;
  transform: scale(1);
}

/* ================== 弹幕层 ================== */
.yuemu-barrage-wrapper {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none; /* 让大部分区域事件穿透，确保不影响弹幕内部操作 */
}
/* 恢复子组件输入框的交互 */
.yuemu-barrage-wrapper :deep(*) {
  pointer-events: auto;
}

/* ================== 全局遮罩 (移动端用) ================== */
.yuemu-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 10;
}

/* ================== 悬浮控制按钮 (FAB) ================== */
.yuemu-fab-btn {
  position: absolute;
  right: 24px;
  bottom: 80px; /* 避开可能存在的输入框 */
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 20;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  outline: none;
}
.yuemu-fab-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.05);
}
.yuemu-fab-icon {
  font-size: 22px;
  transition: transform 0.4s ease;
}
.yuemu-fab-btn.is-active {
  background: #1677ff;
  border-color: #1677ff;
  box-shadow: 0 6px 20px rgba(22, 119, 255, 0.4);
}
.yuemu-fab-btn.is-active .yuemu-fab-icon {
  transform: rotate(180deg);
}

/* ================== 控制面板 ================== */
.yuemu-control-panel {
  position: absolute;
  z-index: 15;
  background: rgba(25, 25, 25, 0.75);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.yuemu-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.yuemu-panel-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 1px;
  color: #fff;
}

.yuemu-control-item {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.yuemu-label-wrap {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.yuemu-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
}
.yuemu-value {
  font-size: 13px;
  font-weight: 600;
  color: #1677ff;
  background: rgba(22, 119, 255, 0.15);
  padding: 2px 8px;
  border-radius: 12px;
}

/* ================== Ant Design 组件样式深度覆盖 ================== */
/* 覆盖 Switch */
:deep(.yuemu-custom-switch) {
  background-color: rgba(255, 255, 255, 0.2);
  &.ant-switch-checked { background-color: #1677ff; }
}

/* 覆盖 Slider */
:deep(.yuemu-custom-slider) {
  margin: 10px 6px;

  .ant-slider-rail { background-color: rgba(255, 255, 255, 0.2); height: 6px; }
  .ant-slider-track { background-color: #1677ff; height: 6px; }
  .ant-slider-handle {
    width: 20px; height: 20px; margin-top: -7px;
    border: 2px solid #1677ff;
    background-color: #fff;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    &::after { display: none; }
  }
}

/* ================== PC 端布局 (右侧抽屉) ================== */
@media screen and (min-width: 769px) {
  .yuemu-control-panel {
    top: 50%;
    right: 24px;
    transform: translate(calc(100% + 40px), -50%); /* 隐藏在屏幕外 */
    width: 320px;
    border-radius: 24px;
    padding: 28px 24px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  }
  .yuemu-control-panel.is-show {
    transform: translate(0, -50%);
  }
  .yuemu-drag-indicator { display: none; }
}

/* ================== 移动端布局 (Bottom Sheet) ================== */
@media screen and (max-width: 768px) {
  .yuemu-fab-btn {
    right: 20px;
    bottom: calc(20px + env(safe-area-inset-bottom));
  }

  .yuemu-control-panel {
    top: auto;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    border-radius: 24px 24px 0 0;
    padding: 20px 24px calc(24px + env(safe-area-inset-bottom));
    transform: translateY(100%);
    box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.3);
  }
  .yuemu-control-panel.is-show {
    transform: translateY(0);
  }

  /* 顶部拖拽指示条 */
  .yuemu-drag-indicator {
    width: 40px;
    height: 5px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
    margin: 0 auto 20px;
  }
}

/* 动画 */
.yuemu-fade-enter-active, .yuemu-fade-leave-active { transition: opacity 0.3s ease; }
.yuemu-fade-enter-from, .yuemu-fade-leave-to { opacity: 0; }
</style>
