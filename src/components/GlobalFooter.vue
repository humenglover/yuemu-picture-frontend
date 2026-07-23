<template>
  <div id="yuemu-globalFooter">
    <!-- PC端：单行极简居中 i18n 水平底栏 (Single-Row Centered Bar) -->
    <footer v-if="device === DEVICE_TYPE_ENUM.PC" class="single-row-pc-footer">
      <div class="footer-single-bar">
        <span class="copyright-item">© {{ currentYear }} {{ t('components.globalFooter.brandName') }}</span>
        <span class="divider-dot">•</span>

        <router-link to="/guides" class="footer-nav-link">{{ t('components.globalFooter.guides') }}</router-link>
        <span class="divider-dot">•</span>

        <router-link to="/privacy" class="footer-nav-link">{{ t('components.globalFooter.privacy') }}</router-link>
        <span class="divider-dot">•</span>

        <router-link to="/about" class="footer-nav-link">{{ t('components.globalFooter.about') }}</router-link>
        <span class="divider-dot">•</span>

        <router-link to="/contact" class="footer-nav-link">{{ t('components.globalFooter.contact') }}</router-link>
        <span class="divider-dot">•</span>

        <a class="beian-nav-link" href="https://beian.miit.gov.cn/" target="_blank">
          <i class="fas fa-shield-halved shield-icon"></i>
          {{ getBeianNumber() }}
        </a>
      </div>
    </footer>

    <!-- 移动端：全宽底部导航栏 -->
    <div v-else class="yuemu-mobile-bottom-bar" :class="{ 'is-hidden': isHidden }">
      <svg width="0" height="0" style="position: absolute; pointer-events: none;">
        <filter id="yuemu-gooey" x="-50%" y="-50%" width="200%" height="200%" color-interpolation-filters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 25 -10" result="goo" />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </svg>

      <div class="yuemu-navbar-wrapper">
        <div class="yuemu-shadow-layer">
          <div class="yuemu-bg-layer">
            <div class="yuemu-navbar-base"></div>
            <div class="yuemu-center-base-circle"></div>
            <div class="yuemu-indicator-circle" :style="{ transform: `translateX(${indicatorX}px)` }"></div>
          </div>
        </div>

        <ul class="yuemu-nav">
          <li class="yuemu-item" :class="{ 'yuemu-active': indicatorIndex === 0 }" @click="handleTabChange(0, '/')">
            <span class="yuemu-icon">
              <i class="fas fa-home"></i>
            </span>
            <span class="yuemu-text">{{ t('nav.home') }}</span>
          </li>

          <li class="yuemu-item" :class="{ 'yuemu-active': indicatorIndex === 1 }" @click="handleTabChange(1, '/forum')">
            <span class="yuemu-icon">
              <i class="fas fa-compass"></i>
            </span>
            <span class="yuemu-text">{{ t('nav.forum') }}</span>
          </li>

          <li class="yuemu-item yuemu-center-action" @click="handleAddClick">
            <div class="yuemu-m-publish-btn">
              <i class="fas fa-plus"></i>
            </div>
          </li>

          <li class="yuemu-item" :class="{ 'yuemu-active': indicatorIndex === 3 }" @click="handleTabChange(3, '/chat-list')">
            <span class="yuemu-icon">
              <i class="fas fa-comment-dots"></i>
              <span v-if="unreadCounts.totalUnread > 0" class="yuemu-m-badge">
                {{ unreadCounts.totalUnread > 99 ? '99+' : unreadCounts.totalUnread }}
              </span>
            </span>
            <span class="yuemu-text">{{ t('nav.chat') }}</span>
          </li>

          <li class="yuemu-item" :class="{ 'yuemu-active': indicatorIndex === 4 }" @click="handleTabChange(4, '/my')">
            <span class="yuemu-icon">
              <i class="fas fa-user"></i>
              <span v-if="messageCenterUnreadCount > 0" class="yuemu-m-badge">
                {{ messageCenterUnreadCount > 99 ? '99+' : messageCenterUnreadCount }}
              </span>
            </span>
            <span class="yuemu-text">{{ t('user.profile') }}</span>
          </li>
        </ul>
      </div>
    </div>

    <UploadActionSheet v-model="showActionSheet" />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, nextTick } from 'vue'
import { DEVICE_TYPE_ENUM } from '@/constants/device'
import { getDeviceType } from '@/utils/device'
import router from '@/router'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import '@lottiefiles/lottie-player'
import UploadActionSheet from './UploadActionSheet.vue'
import { getCurrentYear } from '@/utils/date'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
  unreadCounts: {
    totalUnread: number
    privateUnread: number
    friendUnread: number
  },
  messageCenterUnreadCount: {
    type: Number,
    default: 0
  }
}>()

const device = ref<string>('')
const active = ref(0)
const showActionSheet = ref(false)
const loginUserStore = useLoginUserStore()

const isHidden = ref(false)
let lastScrollTop = 0
const scrollThreshold = 50

const handleAddClick = () => {
  if (!loginUserStore.loginUser.id) {
    router.push('/user/login')
    return
  }
  showActionSheet.value = true
}

const route = useRoute()

watch(() => route.path, (newPath) => {
  switch (newPath) {
    case '/':
    case '/home':
      active.value = 0
      break
    case '/forum':
      active.value = 1
      break
    case '/chat-list':
      active.value = 3
      break
    case '/my':
      active.value = 4
      break
    default:
      if (newPath.startsWith('/forum')) {
        active.value = 1
      } else if (newPath.startsWith('/chat-list')) {
        active.value = 3
      } else if (newPath.startsWith('/my')) {
        active.value = 4
      }
      break
  }
}, { immediate: true })

watch(() => route.path, (newPath) => {
  nextTick(() => {
    const savedPosition = sessionStorage.getItem(`${newPath}_scrollPosition`)
    if (savedPosition) {
      window.scrollTo({
        top: parseInt(savedPosition),
        behavior: 'auto'
      })
    }
  })
})

const handleScroll = () => {
  if (device.value === DEVICE_TYPE_ENUM.PC) return

  const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop

  if (Math.abs(currentScrollTop - lastScrollTop) > scrollThreshold) {
    isHidden.value = currentScrollTop > lastScrollTop
    lastScrollTop = currentScrollTop
  }
}

const indicatorIndex = ref(0)
const indicatorX = ref(0)

const updateIndicator = () => {
  if (device.value === DEVICE_TYPE_ENUM.PC) return
  const container = document.querySelector('.yuemu-nav')
  const items = document.querySelectorAll('.yuemu-nav .yuemu-item')
  if (!container || !items.length) return

  const activeEl = items[indicatorIndex.value] as HTMLElement
  if (!activeEl) return

  const navRect = container.getBoundingClientRect()
  const elRect = activeEl.getBoundingClientRect()

  const offsetLeft = elRect.left - navRect.left
  const centerX = offsetLeft + (elRect.width / 2)

  indicatorX.value = centerX - 34 // 68px width / 2
}

watch(indicatorIndex, () => {
  nextTick(updateIndicator)
})

watch(active, (val) => {
  indicatorIndex.value = val
}, { immediate: true })

onMounted(async () => {
  device.value = await getDeviceType()
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('resize', updateIndicator)
  setTimeout(updateIndicator, 100)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', updateIndicator)
  showActionSheet.value = false
})

const currentYear = computed(() => getCurrentYear())

const handleTabChange = (index: number, path: string) => {
  if (active.value === index && route.path === path) {
    return
  }
  const currentScrollPosition = window.pageYOffset || document.documentElement.scrollTop
  sessionStorage.setItem(`${route.path}_scrollPosition`, currentScrollPosition.toString())

  active.value = index
  router.replace(path)
}

const getBeianNumber = () => {
  const env = import.meta.env.VITE_APP_ENV || 'development'
  if (env === 'production') {
    return '陇ICP备2024012699号-3'
  } else {
    return '陇ICP备2024012699号-1'
  }
}
</script>

<style scoped>
#yuemu-globalFooter {
  z-index: 100;
  position: relative;
  line-height: 1;
}

/* ==================== 单行极简居中 i18n 水平底栏 CSS ==================== */
.single-row-pc-footer {
  width: 100%;
  background: var(--header-background, rgba(255, 255, 255, 0.75));
  backdrop-filter: saturate(180%) blur(16px);
  -webkit-backdrop-filter: saturate(180%) blur(16px);
  border-top: 1px solid var(--border-color, rgba(0, 0, 0, 0.05));
  padding: 16px 0;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
  color: var(--text-secondary, #86868b);
  font-size: 13px;
  line-height: 1;
}

.footer-single-bar {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  flex-wrap: wrap;
}

.copyright-item {
  color: var(--text-secondary, #86868b);
  font-weight: 400;
}

.divider-dot {
  color: var(--border-color, rgba(0, 0, 0, 0.15));
  font-size: 11px;
}

.footer-nav-link {
  color: var(--text-secondary, #86868b);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}

.footer-nav-link:hover {
  color: var(--text-primary, #1d1d1f);
}

.beian-nav-link {
  color: var(--text-secondary, #86868b);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-weight: 400;
  transition: color 0.2s ease;
}

.beian-nav-link:hover {
  color: var(--text-primary, #1d1d1f);
}

.shield-icon {
  font-size: 11px;
}

.yuemu-footer-center {
  flex: 1;
  text-align: center;
  padding: 0 20px;
  opacity: 0.85;
}

.yuemu-mail-link, .yuemu-beian-link, .yuemu-privacy-link {
  color: #64748b;
  text-decoration: none;
  transition: all 0.3s ease;
}

@media (prefers-color-scheme: dark) { .yuemu-mail-link,
@media (prefers-color-scheme: dark) { .yuemu-beian-link,
@media (prefers-color-scheme: dark) { .yuemu-privacy-link {
 color: #94a3b8; 
} } } }

.yuemu-mail-link:hover, .yuemu-beian-link:hover, .yuemu-privacy-link:hover {
  color: #2563eb;
  opacity: 1;
}

@media (prefers-color-scheme: dark) { .yuemu-mail-link:hover,
@media (prefers-color-scheme: dark) { .yuemu-beian-link:hover,
@media (prefers-color-scheme: dark) { .yuemu-privacy-link:hover {
 color: #60a5fa; 
} } } }

.yuemu-footer-divider {
  margin: 0 8px;
  color: #cbd5e1;
}
@media (prefers-color-scheme: dark) {
  .yuemu-footer-divider {
    color: #475569;
  }
}

.yuemu-footer-right {
  display: flex;
  align-items: center;
  opacity: 0.85;
}

.yuemu-shield-icon {
  margin-right: 6px;
  opacity: 0.8;
}

/* ================== 移动端（果冻导航） ================== */
.yuemu-mobile-bottom-bar {
  position: fixed;
  bottom: 0; left: 0; width: 100%;
  z-index: 1999;
  transition: transform 0.3s ease;
  background: transparent;
  /* 移除原有的左右 padding，实现真正的通栏底部导航 */
  padding-bottom: env(safe-area-inset-bottom);
  box-sizing: border-box;
}
.yuemu-mobile-bottom-bar.is-hidden {
  transform: translateY(calc(100% + 40px));
}

.yuemu-navbar-wrapper {
  position: relative;
  width: 100%;
  height: 50px;
  margin-top: 10px;
}

.yuemu-shadow-layer {
  position: absolute;
  top: 0; left: 0; width: 100%;
  height: calc(100% + 30px); /* 向下延展，把滤镜产生的底部圆角藏在屏幕外 */
  filter: drop-shadow(0 -1px 4px rgba(0, 0, 0, 0.04));
  z-index: 1;
}

@media (prefers-color-scheme: dark) { .yuemu-shadow-layer { filter: drop-shadow(0 -1px 4px rgba(0, 0, 0, 0.2)); } }

.yuemu-bg-layer {
  position: absolute;
  top: 0; left: 0; width: 100%;
  height: calc(100% + 30px); /* 向下延展 */
  filter: url('#yuemu-gooey');
}

.yuemu-navbar-base {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background-color: var(--card-background, #ffffff);
  /* 顶部设置适中圆角（SVG滤镜会视觉放大），底部直角 */
  border-radius: 12px 12px 0 0;
}

.yuemu-center-base-circle {
  display: none;
}

.yuemu-indicator-circle {
  position: absolute;
  top: -12px;
  left: 0;
  width: 68px;
  height: 44px;
  background-color: var(--card-background, #ffffff);
  border-radius: 50%;
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform;
}

.yuemu-nav {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 50px;
  margin: 0; padding: 0 10px;
  display: flex;
  justify-content: space-around;
  list-style: none;
  box-sizing: border-box;
  z-index: 2;
}

.yuemu-item {
  position: relative;
  flex: 1;
  height: 100%;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  -webkit-tap-highlight-color: transparent;
}

.yuemu-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 22px;
  height: 22px;
  font-size: 18px;
  color: var(--text-secondary, #64748b);
  transition: transform 0.5s cubic-bezier(0.5, -0.3, 0.25, 1.3), color 0.5s;
  position: relative;
}

.yuemu-text {
  position: absolute;
  bottom: 6px;
  font-size: 10px;
  font-weight: 600;
  color: var(--link-color, #1677ff);
  opacity: 0;
  transform: translateY(12px);
  transition: transform 0.5s cubic-bezier(0.5, -0.3, 0.25, 1.3), opacity 0.5s;
}

/* 激活状态特效 */
.yuemu-item.yuemu-active .yuemu-icon {
  transform: translateY(-16px);
  color: var(--link-color, #1677ff);
}

.yuemu-item.yuemu-active .yuemu-text {
  opacity: 1;
  transform: translateY(0);
}

/* 独立发布的悬浮按钮 */
.yuemu-center-action {
  flex: 0 0 76px;
  position: relative;
  height: 100%;
}

.yuemu-m-publish-btn {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 64px;
  height: 36px;
  border-radius: 12px;
  background: linear-gradient(135deg, #4096ff 0%, #1677ff 100%);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(22, 119, 255, 0.3);
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease;
  font-size: 20px;
  z-index: 10;
}

.yuemu-center-action:active .yuemu-m-publish-btn {
  transform: translate(-50%, -50%) scale(0.92);
  box-shadow: 0 4px 6px rgba(22, 119, 255, 0.2);
}

/* 徽标 */
.yuemu-m-badge {
  position: absolute;
  top: -4px;
  right: -8px;
  background-color: #ef4444;
  color: #ffffff;
  font-size: 10px;
  font-weight: bold;
  height: 16px;
  min-width: 16px;
  padding: 0 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 2px solid var(--card-background, #ffffff);
  line-height: 1;
  z-index: 2;
}
</style>
