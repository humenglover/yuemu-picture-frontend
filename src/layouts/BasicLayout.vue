<template>
  <div class="yuemu-basic-layout">
    <a-layout style="min-height: 100vh">
      <div
        class="yuemu-header-wrapper"
        v-if="device === DEVICE_TYPE_ENUM.PC && !shouldHideHeader"
      >
        <a-layout-header
          class="yuemu-header"
          :class="{ 'is-header-hidden': !showHeader }"
        >
          <GlobalHeader :unread-counts="unreadCounts" :message-center-unread-count="messageCenterStore.unreadMessageData.totalUnread" />
        </a-layout-header>
      </div>

      <a-layout>
        <div
          class="yuemu-sider-trigger-area"
          :class="[layoutStore.siderSide === 'left' ? 'is-left' : 'is-right']"
          v-show="device === DEVICE_TYPE_ENUM.PC"
          @mouseenter="handleSiderEnter"
          @mouseleave="handleSiderLeave"
        >
          <GlobalSider
            class="yuemu-sider"
            :class="[layoutStore.siderSide === 'left' ? 'is-left' : 'is-right']"
          />
        </div>

        <div
          v-if="showBackButton && !(device === DEVICE_TYPE_ENUM.MOBILE && shouldHideMobileFooterRoute(route.path))"
          class="yuemu-back-button"
          @click="handleBack"
        >
          <img src="@/assets/icons/icon-back.svg" alt="back" />
        </div>

        <a-layout-content
          class="yuemu-content"
          :class="{ 'has-pc-header-padding': device === DEVICE_TYPE_ENUM.PC && !shouldHideHeader }"
        >
          <router-view v-slot="{ Component, route }">
            <keep-alive>
              <component
                :is="Component"
                v-if="route.meta.keepAlive"
                :key="route.meta.name"
                :message-center-unread-count="messageCenterStore.unreadMessageData.totalUnread"
              />
            </keep-alive>
            <component
              :is="Component"
              v-if="!route.meta.keepAlive"
              :key="route.meta.name"
              :message-center-unread-count="messageCenterStore.unreadMessageData.totalUnread"
            />
          </router-view>
        </a-layout-content>
      </a-layout>

      <a-layout-footer
        v-if="device === DEVICE_TYPE_ENUM.PC && isAtBottom && !shouldHideFooter"
        class="yuemu-footer"
      >
        <GlobalFooter :unread-counts="unreadCounts" :message-center-unread-count="messageCenterStore.unreadMessageData.totalUnread" />
      </a-layout-footer>

      <a-layout-footer
        v-else-if="device === DEVICE_TYPE_ENUM.MOBILE && !shouldHideMobileFooter"
        class="yuemu-footer"
      >
        <GlobalFooter :key="`footer-${unreadCounts.totalUnread}`" :unread-counts="unreadCounts" :message-center-unread-count="messageCenterStore.unreadMessageData.totalUnread" />
      </a-layout-footer>
    </a-layout>

    <div v-if="isLoginOrRegisterPage" class="yuemu-tool-buttons">
      <div
        class="yuemu-tool-btn yuemu-home-btn"
        @click="router.push('/home')"
        :title="t('layouts.basicLayout.backToHome')"
      >
        <svg class="yuemu-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"/>
          <path d="M9 22V12h6v10"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"/>
        </svg>
      </div>
    </div>
    <div v-else class="yuemu-tool-buttons" v-show="showBackButton || device === DEVICE_TYPE_ENUM.PC">
      <div
        class="yuemu-tool-btn yuemu-theme-btn"
        v-if="device === DEVICE_TYPE_ENUM.PC"
        @click="themeStore.toggleTheme"
        :title="themeStore.isDarkTheme ? t('layouts.basicLayout.switchToLight') : t('layouts.basicLayout.switchToDark')"
      >
        <svg v-if="themeStore.isDarkTheme" class="yuemu-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <svg v-else class="yuemu-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 3v1m0 16v1m-8-9H3m3.314-5.686L5.5 5.5m12.186.814L18.5 5.5m-12.186 12.186L5.5 18.5m12.186-.814L18.5 18.5M21 12h-1m-4 0a4 4 0 11-8 0 4 4 0 018 0z"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>

      <div
        class="yuemu-tool-btn yuemu-top-btn"
        v-show="isScrolled && device === DEVICE_TYPE_ENUM.PC"
        @click="scrollToTop"
        :title="t('layouts.basicLayout.backToTop')"
      >
        <svg class="yuemu-icon-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 20V4M5 11l7-7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>

    </div>

    <!-- 外部链接提醒弹窗 -->
    <ExternalLinkModal ref="externalLinkModalRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, onBeforeUnmount, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { DEVICE_TYPE_ENUM } from '@/constants/device'
import { getDeviceType } from '@/utils/device'
import GlobalHeader from '@/components/GlobalHeader.vue'
import GlobalFooter from '@/components/GlobalFooter.vue'
import GlobalSider from '@/components/GlobalSider.vue'
import { useThemeStore } from '@/stores/useThemeStore'
import { useLayoutStore } from '@/stores/useLayoutStore'
import { shouldHidePCFooter, shouldHidePCHeader, shouldHideMobileFooter as shouldHideMobileFooterRoute } from '@/constants/route'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import { chatListWebSocket } from '@/utils/chatListWebSocket'
import { messageWebSocketService } from '@/utils/messageWebSocketService'
import { useMessageStore } from '@/stores/useMessageStore'
import { useMessageCenterStore } from '@/stores/useMessageCenterStore'
import ExternalLinkModal from '@/components/ExternalLinkModal.vue'

const externalLinkModalRef = ref()

const route = useRoute()
const router = useRouter()
const themeStore = useThemeStore()
const loginUserStore = useLoginUserStore()
const layoutStore = useLayoutStore()
const { t } = useI18n()

const device = ref<string>('')
const showSider = ref(false)
const showHeader = ref(true)
let lastScrollTop = 0

const isAtBottom = ref(false)
const isRouteLoading = ref(false)
const isScrolled = ref(false)
let loadingTimeout: number | null = null


const showBackButton = ref(false)

const unreadCounts = ref({
  totalUnread: 0,
  privateUnread: 0,
  friendUnread: 0
})

const messageStore = useMessageStore()
const messageCenterStore = useMessageCenterStore()

const handleUnreadCountsUpdate = (event: CustomEvent) => {
  unreadCounts.value = {
    totalUnread: event.detail.totalUnread || 0,
    privateUnread: event.detail.privateUnread || 0,
    friendUnread: event.detail.friendUnread || 0
  }
}

const handleMessageCenterUnreadCountsUpdate = (event: CustomEvent) => {
  const data = event.detail
  if (data) {
    messageCenterStore.updateUnreadMessageData({
      totalUnread: Number(data.totalUnread) || 0,
      unreadComments: Number(data.unreadComments) || 0,
      unreadLikes: Number(data.unreadLikes) || 0,
      unreadShares: Number(data.unreadShares) || 0,
      unreadSystemNotifies: Number(data.unreadSystemNotifies) || 0
    })
  }
}

const initWebSocket = async () => {
  if (loginUserStore.loginUser?.id) {
    console.log('[BasicLayout] 初始化WebSocket连接...')
    try {
      await chatListWebSocket.connect(loginUserStore.loginUser.id)
      console.log('[BasicLayout] 聊天列表WebSocket连接完成')

      await messageWebSocketService.connect(loginUserStore.loginUser.id)
      console.log('[BasicLayout] 信息中心WebSocket连接完成')

      window.removeEventListener('unreadCountsUpdated', handleUnreadCountsUpdate as EventListener)
      window.removeEventListener('messageUnreadCountsUpdated', handleMessageCenterUnreadCountsUpdate as EventListener)

      window.addEventListener('unreadCountsUpdated', handleUnreadCountsUpdate as EventListener)
      window.addEventListener('messageUnreadCountsUpdated', handleMessageCenterUnreadCountsUpdate as EventListener)

      chatListWebSocket.on('message', (data: any) => {
        if (data?.type === 'UNREAD_COUNTS') {
          unreadCounts.value = {
            totalUnread: data.totalUnread || 0,
            privateUnread: data.privateUnread || 0,
            friendUnread: data.friendUnread || 0
          }
          window.dispatchEvent(new CustomEvent('unreadCountsUpdated', {
            detail: { ...unreadCounts.value }
          }))
        }
      })

      chatListWebSocket.sendMessage({
        type: 'REQUEST_UNREAD_COUNTS'
      })

      messageWebSocketService.requestUnreadCounts()
    } catch (error) {
      console.error('[BasicLayout] WebSocket连接失败:', error)
    }
  }
}

watch(() => loginUserStore.loginUser?.id, (newId) => {
  if (newId) {
    console.log('[BasicLayout] 检测到用户登录，初始化WebSocket连接...')
    initWebSocket()
  } else {
    console.log('[BasicLayout] 用户登出，断开WebSocket连接')
    chatListWebSocket.disconnect()
    messageWebSocketService.disconnect()
    window.removeEventListener('unreadCountsUpdated', handleUnreadCountsUpdate as EventListener)
    window.removeEventListener('messageUnreadCountsUpdated', handleMessageCenterUnreadCountsUpdate as EventListener)
  }
}, { immediate: true })

watch(() => route.path, () => {
  if (loginUserStore.loginUser?.id) {
    chatListWebSocket.requestUnreadCounts()
    messageWebSocketService.requestUnreadCounts()
  }
})

const shouldHideFooter = computed(() => {
  return shouldHidePCFooter(route.path)
})

const shouldHideHeader = computed(() => {
  return shouldHidePCHeader(route.path)
})

const shouldHideMobileFooter = computed(() => {
  return shouldHideMobileFooterRoute(route.path)
})

onBeforeUnmount(() => {
  if (loadingTimeout) {
    clearTimeout(loadingTimeout)
  }
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', checkIfAtBottom)
  document.removeEventListener('click', handleGlobalLinkClick, true)
})

const checkIfAtBottom = () => {
  if (device.value !== DEVICE_TYPE_ENUM.PC) return;

  const scrollHeight = document.documentElement.scrollHeight;
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const clientHeight = document.documentElement.clientHeight;
  const distanceToBottom = scrollHeight - scrollTop - clientHeight;

  if (scrollHeight <= clientHeight) {
    isAtBottom.value = true;
    return;
  }

  isAtBottom.value = distanceToBottom <= 1;
};

const handleSiderEnter = () => {
  showSider.value = true;
  showHeader.value = true;
};

const handleSiderLeave = () => {
  showSider.value = false;
  if (lastScrollTop > 100) {
    showHeader.value = false;
  }
};

const handleScroll = () => {
  const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;

  isScrolled.value = currentScrollTop > window.innerHeight / 2;

  if (!showSider.value) {
    if (currentScrollTop > lastScrollTop && currentScrollTop > 100) {
      showHeader.value = false;
    }
    else if (currentScrollTop < lastScrollTop) {
      showHeader.value = true;
    }
  }

  lastScrollTop = currentScrollTop;

  checkIfAtBottom();


};



const handleBack = () => {
  router.back()
}

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

watch(() => route.path, (newPath) => {
  showBackButton.value = newPath !== '/'
})

const handleGlobalLinkClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  const aTag = target.closest('a')
  if (aTag) {
    const href = aTag.getAttribute('href')
    if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
      try {
        const url = new URL(href, window.location.origin)
        if (url.hostname !== window.location.hostname) {
          e.preventDefault()
          e.stopPropagation()
          externalLinkModalRef.value?.openModal(href)
        }
      } catch (e) {
        // 忽略无效的 URL
      }
    }
  }
}

onMounted(async () => {
  device.value = await getDeviceType()
  window.addEventListener('scroll', handleScroll)
  checkIfAtBottom()
  window.addEventListener('resize', checkIfAtBottom)
  setTimeout(checkIfAtBottom, 100)
  themeStore.initTheme()
  document.addEventListener('click', handleGlobalLinkClick, true)

  // 路由守卫已经在首次加载时获取了用户信息，这里只需要初始化 WebSocket
  if (loginUserStore.loginUser?.id) {
    await initWebSocket()
  }
})

onUnmounted(() => {
  window.removeEventListener('unreadCountsUpdated', handleUnreadCountsUpdate as EventListener)
  window.removeEventListener('messageUnreadCountsUpdated', handleMessageCenterUnreadCountsUpdate as EventListener)
  chatListWebSocket.disconnect()
  messageWebSocketService.disconnect()
})

const isLoginOrRegisterPage = computed(() => {
  return route.path === '/user/login' || route.path === '/user/register'
})

const toggleSider = () => {
  showSider.value = !showSider.value;
  showHeader.value = true;
};
</script>

<style scoped>
:deep(.ant-layout) {
  background: transparent !important;
}
/* ================= 丝滑导航栏动画优化 ================= */
.yuemu-header-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  pointer-events: none;
}

.yuemu-basic-layout .yuemu-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding-inline: 20px;
  /* 修复 HBuilderX 打包 App 时 Android WebView 的 backdrop-filter GPU 渲染异常导致全局灰蒙蒙 Bug */
  background-color: var(--header-background);
  /* Hack: 防止 Android Force Dark 算法添加遮罩 */
  background-image: linear-gradient(to bottom, var(--header-background), var(--header-background));
  /* 使用极细底边框代替微弱阴影，更加高级扁平 */
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.05);
  border-bottom: none;
  color: var(--text-primary);
  height: 64px;
  line-height: 64px;
  pointer-events: auto;

  /* 纯物理滑动，剔除透明度变化，使用苹果级弹簧缓冲曲线 */
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.3s ease;
  will-change: transform;
  transform: translateY(0);
}

/* 页面滚动导致隐藏时的样式 */
.is-header-hidden {
  transform: translateY(-100%) !important;
  pointer-events: none !important;
}



.is-sider-hidden {
  transform: translateX(-200px);
  box-shadow: none;
  opacity: 0;
}

.yuemu-basic-layout .yuemu-content {
  background: transparent;
  transition: background 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: visible !important;
  min-height: 100vh;
}

/* 使用内边距 (padding) 替代 margin，确保背景色能延伸到顶部，同时内容不被 Header 遮挡 */
.yuemu-basic-layout .yuemu-content.has-pc-header-padding {
  padding-top: 64px;
}



.yuemu-basic-layout .yuemu-content.yuemu-pc-content {
  margin-left: 0;
}

/* ================= 解决 PC 底部过高问题 ================= */
.yuemu-basic-layout .yuemu-footer {
  padding: 0 !important; /* 全局清除多余的 padding */
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  text-align: center;
  user-select: none;
  animation: yuemu-slide-up 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: transparent; /* 去除原本 a-layout-footer 的默认背景色 */
  z-index: 999;
}

@keyframes yuemu-slide-up {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@media screen and (min-width: 769px) {
  .yuemu-basic-layout .yuemu-footer {
    /* PC端完全让 GlobalFooter 组件接管样式，外层不施加任何背景、边距或圆角 */
    border-radius: 0;
    background: transparent;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }

  /* 保留深层文本链接的配置，防止丢失部分文字样式 */
  :deep(.footer-content) {
    color: var(--text-secondary);
    font-size: 12px;
    padding: 8px 0;
    opacity: 1;
    transition: all 0.3s ease;
    letter-spacing: 0.01em;
    font-weight: 400;
  }

  :deep(.footer-content:hover) {
    color: var(--text-primary);
  }

  :deep(.footer-links) {
    margin-top: 6px;
    font-size: 12px;
  }

  :deep(.footer-links a) {
    color: var(--text-secondary);
    text-decoration: none;
    transition: all 0.3s ease;
    margin: 0 8px;
    letter-spacing: 0.01em;
    position: relative;
  }

  :deep(.footer-links a:hover) {
    color: var(--text-primary);
  }

  :deep(.footer-links a::after) {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 100%;
    height: 1px;
    background: var(--border-color);
    transform: scaleX(0);
    transform-origin: right;
    transition: transform 0.3s ease;
  }
}

/* ================= 移动端原样保持绝对不变 ================= */
@media screen and (max-width: 768px) {
  .yuemu-basic-layout .yuemu-footer {
    background: var(--post-background);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-top: 1px solid var(--border-color);
    box-shadow: 0 -1px 10px var(--shadow-color);
    padding: 0 !important;
    margin: 0;
    z-index: 1;
  }

  .yuemu-basic-layout .yuemu-sider {
    top: 48px;
    background: var(--post-background);
    border-radius: 0 6px 6px 0;
  }

  .yuemu-back-button {
    right: 0.5vh;
    bottom: calc(6vh + 100px);
    width: 32px;
    height: 32px;
  }

  .yuemu-back-button img {
    width: 20px;
    height: 20px;
  }
}

@keyframes yuemu-gradient-bg {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes yuemu-hide-to-show {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.yuemu-footer {
  animation: yuemu-hide-to-show 1s ease-out;
}

.yuemu-sider-trigger-area {
  position: fixed;
  max-width: 88px;
  top: 20%;
  bottom: 60px;
  width: 48px;
  z-index: 100000!important;
  background: transparent;
  transition: all 0.3s ease;
}

.yuemu-sider-trigger-area.is-left {
  left: 0;
  border-radius: 0 6px 6px 0;
}

.yuemu-sider-trigger-area.is-right {
  right: 0;
  border-radius: 6px 0 0 6px;
}

@keyframes yuemu-sider-enter {
  from {
    transform: translateX(-200px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.yuemu-basic-layout .yuemu-sider:not(.is-sider-hidden) {
  animation: yuemu-sider-enter 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes yuemu-slide-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.yuemu-tool-buttons {
  position: fixed;
  right: 3vh;
  bottom: 8vh;
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 1000;
  animation: yuemu-slide-in 0.5s ease-in-out both;
}

.yuemu-tool-btn {
  width: 48px;
  height: 48px;
  background: var(--toggle-background);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px var(--shadow-color);
  border: 1px solid var(--border-color);
}

.yuemu-tool-btn:hover {
  transform: translateY(-3px) scale(1.05);
  background: var(--toggle-hover-background);
  box-shadow: 0 4px 12px var(--shadow-color);
  border-color: var(--border-color-hover);
}

.yuemu-tool-btn:active {
  transform: scale(0.95);
}

.yuemu-emoji {
  font-size: 26px;
  transition: all 0.3s ease;
  line-height: 1;
  filter: none;
}

.yuemu-tool-btn:hover .yuemu-emoji {
  transform: scale(1.1);
}

.yuemu-icon,
.yuemu-icon-svg {
  width: 24px;
  height: 24px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.yuemu-tool-btn:hover .yuemu-icon,
.yuemu-tool-btn:hover .yuemu-icon-svg {
  transform: scale(1.1);
}

.yuemu-back-btn:hover .yuemu-icon {
  transform: rotate(-12deg) scale(1.1);
}

.yuemu-theme-btn {
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  display: none;
}

@media screen and (max-width: 768px) {
  .yuemu-theme-btn {
    display: flex;
  }
}

.yuemu-theme-btn .yuemu-icon {
  color: var(--text-primary);
}

.yuemu-theme-btn:hover .yuemu-icon {
  transform: rotate(15deg) scale(1.1);
  color: var(--text-primary);
}

.yuemu-theme-btn:active .yuemu-icon {
  transform: scale(0.95);
}

@media (prefers-color-scheme: dark) { .yuemu-theme-btn .yuemu-icon { color: var(--text-primary); } }

@media (prefers-color-scheme: dark) { .yuemu-theme-btn:hover .yuemu-icon { color: var(--text-primary); } }

@keyframes yuemu-float-up-down {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}

.yuemu-top-btn .yuemu-icon-svg {
  animation: yuemu-float-up-down 2s ease-in-out infinite;
}

.yuemu-top-btn:hover .yuemu-icon-svg {
  animation: none;
  transform: translateY(-2px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@media screen and (max-width: 768px) {
  .yuemu-tool-buttons {
    right: 16px;
    bottom: calc(70px + 6vh);
    gap: 8px;
  }

  .yuemu-tool-btn {
    width: 40px;
    height: 40px;
    border-radius: 14px;
  }

  .yuemu-icon,
  .yuemu-icon-svg {
    width: 20px;
    height: 20px;
  }
}

@media screen and (max-width: 375px) {
  .yuemu-tool-buttons {
    right: 12px;
    bottom: calc(70px + 4vh);
    gap: 6px;
  }

  .yuemu-tool-btn {
    width: 36px;
    height: 36px;
    border-radius: 12px;
  }

  .yuemu-icon,
  .yuemu-icon-svg {
    width: 18px;
    height: 18px;
  }
}

.yuemu-tool-button,
.yuemu-back-top,
.yuemu-back-button {
  display: none;
}

/* ==========================================
   🌙 全局滚动条暗黑/亮色自适应
   ========================================== */

/* Chrome / Safari / Edge */
:deep(::-webkit-scrollbar) {
  width: 8px;
  height: 8px;
  background-color: transparent;
}

:deep(::-webkit-scrollbar-track) {
  background-color: transparent;
  border-radius: 4px;
}

:deep(::-webkit-scrollbar-thumb) {
  background-color: var(--border-color, #ddd);
  border-radius: 4px;
  transition: background-color 0.3s ease;
}

:deep(::-webkit-scrollbar-thumb:hover) {
  background-color: var(--text-secondary, #999);
}

/* Firefox 的滚动条适配 */
:deep(*) {
  scrollbar-width: thin;
  scrollbar-color: var(--border-color, #ddd) transparent;
}
</style>
