<template>
  <div
    id="yuemu-globalSider"
    class="yuemu-sider-container"
    :class="{
      'yuemu-minimized': isMinimized,
      'yuemu-is-dragging': isDragging,
      'yuemu-is-left': layoutStore.siderSide === 'left',
      'yuemu-is-right': layoutStore.siderSide === 'right'
    }"
    :style="{
      left: isDragging ? `${dragLeft}px` : undefined,
      top: isDragging ? `${dragTop}px` : undefined,
      right: isDragging ? 'auto' : undefined,
      transform: isDragging ? 'none' : 'translateY(-50%)'
    }"
  >
    <div v-if="!isMinimized" class="yuemu-sider-wrapper" @mousedown="handleMouseDown">
      <div class="yuemu-fixed-header">
        <a-tooltip :placement="tooltipPlacement" :title="t('user.profile')">
          <router-link :to="{ name: 'MyPage' }" class="yuemu-avatar-link">
            <div class="yuemu-avatar-wrapper">
              <a-avatar :src="loginUserStore.loginUser?.userAvatar || defaultAvatarImg" :size="32" />
              <div class="yuemu-status-indicator"></div>
            </div>
          </router-link>
        </a-tooltip>
      </div>

      <div class="yuemu-scrollable-content">
        <div class="yuemu-item-list">
          <a-tooltip :placement="tooltipPlacement" :title="t('nav.home')">
            <router-link :to="{ name: 'Home' }" class="yuemu-nav-item" :class="{ 'yuemu-active': cleanPath === '/' }">
              <div class="yuemu-icon-box"><i class="fa-solid fa-house"></i></div>
            </router-link>
          </a-tooltip>

          <a-tooltip :placement="tooltipPlacement" :title="t('nav.forum')">
            <router-link :to="{ name: 'Forum' }" class="yuemu-nav-item" :class="{ 'yuemu-active': cleanPath === '/forum' }">
              <div class="yuemu-icon-box"><i class="fa-solid fa-file-lines"></i></div>
            </router-link>
          </a-tooltip>

          <a-tooltip :placement="tooltipPlacement" :title="t('components.globalSider.chat')">
            <router-link :to="chatRoute" class="yuemu-nav-item" :class="{ 'yuemu-active': cleanPath === chatRoute }">
              <div class="yuemu-icon-box"><i class="fa-solid fa-comments"></i></div>
            </router-link>
          </a-tooltip>

          <a-tooltip :placement="tooltipPlacement" :title="t('nav.messages')">
            <router-link :to="{ name: 'MessageCenter' }" class="yuemu-nav-item" :class="{ 'yuemu-active': cleanPath === '/message-center' }">
              <div class="yuemu-icon-box">
                <i class="fa-solid fa-bell"></i>
                <div v-if="unreadCount > 0" class="yuemu-mini-badge"></div>
              </div>
            </router-link>
          </a-tooltip>

          <a-tooltip :placement="tooltipPlacement" :title="t('components.globalSider.games')">
            <router-link :to="{ name: 'Games' }" class="yuemu-nav-item" :class="{ 'yuemu-active': cleanPath === '/games' }">
              <div class="yuemu-icon-box"><i class="fa-solid fa-rocket"></i></div>
            </router-link>
          </a-tooltip>

          <a-tooltip :placement="tooltipPlacement" :title="t('components.globalSider.tools')">
            <router-link :to="{ name: 'Tools' }" class="yuemu-nav-item" :class="{ 'yuemu-active': cleanPath === '/tools' }">
              <div class="yuemu-icon-box"><i class="fa-solid fa-cubes"></i></div>
            </router-link>
          </a-tooltip>
        </div>
      </div>

      <div class="yuemu-fixed-footer">
        <a-tooltip :placement="tooltipPlacement" :title="themeText + t('components.globalSider.themeSuffix')">
          <button class="yuemu-nav-item yuemu-control-btn yuemu-theme-btn" @click.stop="toggleTheme">
            <div class="yuemu-icon-box">
              <i :class="themeIconClass"></i>
            </div>
          </button>
        </a-tooltip>

        <a-tooltip :placement="tooltipPlacement" :title="t('components.globalSider.collapse')">
          <button class="yuemu-nav-item yuemu-control-btn" @click.stop="toggleMinimize">
            <div class="yuemu-icon-box">
              <i class="fa-solid" :class="layoutStore.siderSide === 'left' ? 'fa-chevron-left' : 'fa-chevron-right'"></i>
            </div>
          </button>
        </a-tooltip>
      </div>
    </div>

    <a-tooltip :placement="tooltipPlacement" :title="t('components.globalSider.expandSider')">
      <div v-show="isMinimized" class="yuemu-sticky-edge-trigger" @click="toggleMinimize">
        <i class="fa-solid yuemu-sticky-icon" :class="layoutStore.siderSide === 'left' ? 'fa-angle-double-right' : 'fa-angle-double-left'"></i>
      </div>
    </a-tooltip>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { stripLocalePrefix } from '@/router/localeRouter'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import { useMessageCenterStore } from '@/stores/useMessageCenterStore'
import { useLayoutStore } from '@/stores/useLayoutStore'
import { useThemeStore } from '@/stores/useThemeStore'
import { getDefaultAvatar } from '@/utils/userUtils.ts'
import { getDeviceType } from '@/utils/device'
import { DEVICE_TYPE_ENUM } from '@/constants/device'
import defaultAvatarImg from '@/assets/default.png'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const loginUserStore = useLoginUserStore()
const messageCenterStore = useMessageCenterStore()
const layoutStore = useLayoutStore()
const themeStore = useThemeStore()
const route = useRoute()

const cleanPath = computed(() => stripLocalePrefix(route.path))

const isMinimized = ref(getDeviceType() === DEVICE_TYPE_ENUM.MOBILE)
const isDragging = ref(false)
const dragLeft = ref(0)
const dragTop = ref(0)
const offsetX = ref(0)
const offsetY = ref(0)

const unreadCount = computed(() => messageCenterStore.unreadTotal)
const chatRoute = computed(() => getDeviceType() === DEVICE_TYPE_ENUM.MOBILE ? '/chat-list' : '/pc-chat')
const tooltipPlacement = computed(() => layoutStore.siderSide === 'left' ? 'right' : 'left')
const themeIconClass = computed(() => themeStore.isDarkTheme ? 'fa-solid fa-sun' : 'fa-solid fa-moon')
const themeText = computed(() => themeStore.isDarkTheme ? t('components.globalSider.lightTheme') : t('components.globalSider.darkTheme'))

const toggleTheme = () => {
  themeStore.toggleTheme()
  window.dispatchEvent(new Event('themeChange'))
}

const toggleMinimize = () => {
  isMinimized.value = !isMinimized.value
}

const handleMouseDown = (e: MouseEvent) => {
  if (getDeviceType() === DEVICE_TYPE_ENUM.MOBILE) return
  isDragging.value = true

  const rect = (e.currentTarget as HTMLElement).parentElement?.getBoundingClientRect()
  if (rect) {
    offsetX.value = e.clientX - rect.left
    offsetY.value = e.clientY - rect.top
    dragLeft.value = rect.left
    dragTop.value = rect.top
  }

  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', handleMouseUp)
  e.preventDefault()
}

const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging.value) return
  const currentX = e.clientX
  const currentY = e.clientY
  const screenWidth = window.innerWidth

  dragLeft.value = currentX - offsetX.value
  dragTop.value = currentY - offsetY.value

  if (currentX < screenWidth / 2) {
    if (layoutStore.siderSide !== 'left') layoutStore.setSiderSide('left')
  } else {
    if (layoutStore.siderSide !== 'right') layoutStore.setSiderSide('right')
  }
}

const handleMouseUp = () => {
  isDragging.value = false
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', handleMouseUp)
}
</script>

<style scoped>
* { box-sizing: border-box; }

.yuemu-sider-container {
  height: min(400px, 60vh);
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  width: 56px;
  z-index: 1000;
  background: transparent !important;
}

.yuemu-sider-container.yuemu-is-dragging {
  transition: none !important;
  z-index: 10001;
}

.yuemu-sider-container.yuemu-minimized { width: 0; }

.yuemu-sider-container.yuemu-is-left { left: 0; }
.yuemu-sider-container.yuemu-is-right { right: 0; left: auto; }

.yuemu-sider-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--header-background);
  backdrop-filter: blur(28px) saturate(190%);
  -webkit-backdrop-filter: blur(28px) saturate(190%);
  border: 1.5px solid var(--header-border);
  border-radius: 32px;
  box-shadow: 0 12px 48px var(--header-shadow);
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  overflow: hidden;
  padding: 12px 0;
  cursor: grab;
}

.yuemu-sider-wrapper:active { cursor: grabbing; }

.yuemu-sider-container.yuemu-minimized .yuemu-sider-wrapper {
  opacity: 0;
  visibility: hidden;
  transform: translateX(var(--minimized-x, -100%)) scale(0.9);
  pointer-events: none;
  display: none;
}

.yuemu-is-left .yuemu-sider-wrapper { --minimized-x: -100%; }
.yuemu-is-right .yuemu-sider-wrapper { --minimized-x: 100%; }

.yuemu-fixed-header {
  width: 100%;
  padding: 8px 0 16px 0;
  display: flex;
  justify-content: center;
  border-bottom: 1px solid var(--header-border);
  margin-bottom: 8px;
}

.yuemu-avatar-wrapper {
  position: relative;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.yuemu-avatar-link:hover .yuemu-avatar-wrapper { transform: scale(1.15) rotate(5deg); }

.yuemu-status-indicator {
  position: absolute;
  bottom: 0px;
  right: 0px;
  width: 8px;
  height: 8px;
  background: #27c93f;
  border: 1.5px solid white;
  border-radius: 50%;
}

.yuemu-scrollable-content {
  width: 100%;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.yuemu-scrollable-content::-webkit-scrollbar {
  display: none;
}

.yuemu-item-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  align-items: center;
}

.yuemu-nav-item {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 38px;
  width: 38px;
  border-radius: 19px;
  color: var(--header-text);
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  border: none;
  background: transparent;
  cursor: pointer;
  position: relative;
  padding: 0;
}

.yuemu-nav-item:hover {
  background: var(--nav-item-hover);
  color: var(--nav-item-active-text);
  transform: translateX(var(--hv-x, 2px));
}

.yuemu-is-left .yuemu-nav-item:hover { --hv-x: 2px; }
.yuemu-is-right .yuemu-nav-item:hover { --hv-x: -2px; }

.yuemu-nav-item.yuemu-active {
  background: #2563eb;
  color: white;
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.4);
}

.yuemu-icon-box {
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
}

.yuemu-fixed-footer {
  width: 100%;
  margin-top: 8px;
  padding: 10px 0;
  border-top: 1px solid rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  gap: 8px;
  justify-content: center;
  align-items: center;
}

.yuemu-control-btn { width: 38px; height: 38px; }

.yuemu-theme-btn {
  background: transparent;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.yuemu-theme-btn:hover {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: white;
  transform: translateX(var(--hv-x, 2px)) rotate(20deg);
}

.yuemu-mini-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 6px;
  height: 6px;
  background: #ef4444;
  border-radius: 50%;
  border: 1px solid white;
}

.yuemu-sticky-edge-trigger {
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  width: 22px;
  height: min(120px, 20vh);
  background: linear-gradient(135deg, #2563eb, #70a1ff);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 6px 0 20px rgba(37, 99, 235, 0.4);
  transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 1001;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.yuemu-is-left .yuemu-sticky-edge-trigger { left: 0; border-radius: 0 16px 16px 0; }
.yuemu-is-right .yuemu-sticky-edge-trigger {
  right: 0; left: auto;
  border-radius: 16px 0 0 16px;
  box-shadow: -6px 0 20px rgba(37, 99, 235, 0.4);
}

.yuemu-sticky-edge-trigger:hover { width: 38px; background: #2563eb; }
.yuemu-sticky-icon { color: white; font-size: 16px; transition: all 0.3s; }

.yuemu-sticky-edge-trigger:hover .yuemu-sticky-icon {
  transform: scale(1.3) translateX(var(--icon-x, 2px));
}

@media (max-width: 768px) {
  .yuemu-sider-container { height: min(360px, 60vh); width: 52px; }
  .yuemu-sider-wrapper { border-radius: 24px; padding: 8px 0; }
  .yuemu-sticky-edge-trigger { width: 4px; height: 80px; justify-content: flex-end; padding-right: 2px; }
  .yuemu-is-left .yuemu-sticky-edge-trigger { border-radius: 0 8px 8px 0; }
  .yuemu-is-right .yuemu-sticky-edge-trigger { border-radius: 8px 0 0 8px; justify-content: flex-start; padding-left: 2px; }
}

:deep(.dark-theme) .yuemu-sider-wrapper {
  background: rgba(30, 41, 59, 0.85);
  border-color: rgba(255, 255, 255, 0.15);
}

:deep(.dark-theme) .yuemu-nav-item { color: #94a3b8; }

/* 移动端强制移除点击时的悬停缩放，防止底层长按死锁 */
@media (max-width: 768px) {
  .ant-card-hoverable:active, .ant-card-hoverable:hover,
  .ant-card-hoverable:active *, .ant-card-hoverable:hover *,
  .yuemu-nav-item:active, .yuemu-nav-item:hover,
  .yuemu-nav-item:active *, .yuemu-nav-item:hover *,
  .yuemu-avatar-link:active, .yuemu-avatar-link:hover,
  .yuemu-avatar-link:active *, .yuemu-avatar-link:hover *,
  .yuemu-theme-btn:active, .yuemu-theme-btn:hover,
  .yuemu-theme-btn:active *, .yuemu-theme-btn:hover *,
  .yuemu-sticky-edge-trigger:active, .yuemu-sticky-edge-trigger:hover,
  .yuemu-sticky-edge-trigger:active *, .yuemu-sticky-edge-trigger:hover * {
    transform: none !important;
  }
}
</style>
