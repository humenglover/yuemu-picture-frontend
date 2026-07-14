<template>
  <div class="yuemu-global-header-container">

    <div class="yuemu-header-left">
      <router-link to="/" class="yuemu-logo-link">
        <img src="../assets/nuv.png" alt="Logo" class="yuemu-logo-image" />
      </router-link>
    </div>

    <div class="yuemu-header-center yuemu-pc-only">
      <nav class="yuemu-pill-nav-container">
        <router-link to="/" class="yuemu-nav-item" :class="{ 'yuemu-active': route.path === '/' || route.path === '/home' }">
          <span>{{ $t('nav.home') }}</span>
        </router-link>
        <router-link to="/forum" class="yuemu-nav-item" :class="{ 'yuemu-active': route.path === '/forum' }">
          <span>{{ $t('nav.forum') }}</span>
        </router-link>
        <router-link to="/pc-chat" class="yuemu-nav-item" :class="{ 'yuemu-active': route.path === '/pc-chat' }">
          <span>{{ $t('nav.chat') }}</span>
          <span v-if="loginUserStore.loginUser.id && unreadCounts.totalUnread > 0" class="yuemu-badge-dot"></span>
        </router-link>
        <router-link to="/discovery" v-if="loginUserStore.loginUser.id" class="yuemu-nav-item" :class="{ 'yuemu-active': route.path === '/discovery' }">
          <span>{{ $t('nav.discovery') }}</span>
        </router-link>
        <router-link v-if="loginUserStore.loginUser?.userRole === 'admin'" to="/admin/manage" class="yuemu-nav-item" :class="{ 'yuemu-active': route.path.startsWith('/admin/') }">
          <span>{{ $t('nav.admin') }}</span>
        </router-link>
      </nav>
    </div>

    <div class="yuemu-header-right">
      <div v-if="!loginUserStore.loginUser.id" class="yuemu-icon-btn yuemu-pc-only" @click="toggleLanguage" :title="$t('components.globalHeader.switchLang')">
        <i class="fa-solid fa-language"></i>
      </div>

      <div class="yuemu-icon-btn" :class="{ 'yuemu-active': route.path === '/search' }" @click="handleSearchClick" :title="$t('nav.search')">
        <i class="fa-solid fa-magnifying-glass"></i>
      </div>

      <router-link to="/chat/ai" v-if="loginUserStore.loginUser.id" class="yuemu-icon-btn yuemu-ai-icon-btn" :class="{ 'yuemu-active': route.path === '/chat/ai' }" :title="$t('nav.aiAssistant')">
        <img :src="aiIcon" class="yuemu-ai-icon-img" alt="AI" />
      </router-link>

      <router-link to="/message-center" v-if="loginUserStore.loginUser.id" class="yuemu-icon-btn yuemu-notification-btn" :class="{ 'yuemu-active': route.path === '/message-center' }" :title="$t('nav.messages')">
        <i class="fa-regular fa-bell"></i>
        <div v-if="messageCenterUnreadCount > 0" class="yuemu-capsule-badge">
          {{ messageCenterUnreadCount > 99 ? '99+' : messageCenterUnreadCount }}
        </div>
      </router-link>

      <button v-if="loginUserStore.loginUser.id" class="yuemu-publish-btn yuemu-pc-only" @click="handleAddClick">
        <i class="fa-solid fa-plus"></i>
        <span>{{ $t('nav.publish') }}</span>
      </button>

      <div class="yuemu-user-dropdown-trigger yuemu-pc-only" v-if="loginUserStore.loginUser.id">
        <div class="yuemu-avatar-wrapper" @click.stop="toggleUserMenu">
          <img :src="loginUserStore.loginUser?.userAvatar || getDefaultAvatar(loginUserStore.loginUser?.userName)" alt="User" class="yuemu-avatar-img" />
        </div>

        <Transition name="yuemu-dropdown">
          <div v-if="showUserMenu" class="yuemu-modern-dropdown-menu" @click.stop>
            <div class="yuemu-dropdown-header">
              <span class="yuemu-user-name">{{ loginUserStore.loginUser.userName || $t('user.unnamed') }}</span>
              <span class="yuemu-user-role">{{ loginUserStore.loginUser.userRole === 'admin' ? $t('user.adminRole') : $t('user.userRole') }}</span>
            </div>
            <div class="yuemu-dropdown-divider"></div>
            <router-link to="/my" class="yuemu-dropdown-item" @click="showUserMenu = false">
              <i class="fa-regular fa-user"></i> {{ $t('user.profile') }}
            </router-link>
            <router-link to="/user/setting" class="yuemu-dropdown-item" @click="showUserMenu = false">
              <i class="fa-solid fa-gear"></i> {{ $t('user.setting') }}
            </router-link>
            <div class="yuemu-dropdown-item" @click="toggleTheme">
              <i :class="themeStore.isDarkTheme ? 'fa-solid fa-sun' : 'fa-solid fa-moon'"></i>
              {{ themeStore.isDarkTheme ? $t('user.lightMode') : $t('user.darkMode') }}
            </div>
            <div class="yuemu-dropdown-item" @click="toggleLanguage">
              <i class="fa-solid fa-language"></i>
              {{ $t('components.globalHeader.switchLang') }}
            </div>
            <div class="yuemu-dropdown-divider"></div>
            <div class="yuemu-dropdown-item yuemu-text-danger" @click="logoutConfirmVisible = true; showUserMenu = false">
              <i class="fa-solid fa-arrow-right-from-bracket"></i> {{ $t('user.logout') }}
            </div>
          </div>
        </Transition>
      </div>

      <router-link v-else to="/user/login" class="yuemu-login-btn yuemu-pc-only">{{ $t('user.loginOrRegister') }}</router-link>

      <div class="yuemu-icon-btn yuemu-mobile-only" @click="showMobileMenu = true">
        <i class="fa-solid fa-bars"></i>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="yuemu-drawer">
        <div v-if="showMobileMenu" class="yuemu-mobile-drawer-overlay" @click.self="showMobileMenu = false">
          <div class="yuemu-mobile-drawer-content">

            <div class="yuemu-drawer-header">
              <img src="../assets/nuv.png" alt="Logo" class="yuemu-logo-image-drawer" />
              <div class="yuemu-icon-btn yuemu-close-btn" @click="showMobileMenu = false">
                <i class="fa-solid fa-xmark"></i>
              </div>
            </div>

            <div class="yuemu-drawer-nav-list">
              <router-link to="/" class="yuemu-d-nav-item" :class="{ 'yuemu-active': route.path === '/' || route.path === '/home' }" @click="showMobileMenu = false">
                <i class="fa-solid fa-house"></i> {{ $t('nav.home') }}
              </router-link>
              <router-link to="/forum" class="yuemu-d-nav-item" :class="{ 'yuemu-active': route.path === '/forum' }" @click="showMobileMenu = false">
                <i class="fa-solid fa-compass"></i> {{ $t('nav.forum') }}
              </router-link>
              <router-link to="/chat-redirect" class="yuemu-d-nav-item" :class="{ 'yuemu-active': route.path === '/pc-chat' }" @click="showMobileMenu = false">
                <i class="fa-solid fa-comments"></i> {{ $t('nav.chat') }}
                <span v-if="loginUserStore.loginUser.id && unreadCounts.totalUnread > 0" class="yuemu-d-badge">{{ unreadCounts.totalUnread }}</span>
              </router-link>
              <router-link v-if="loginUserStore.loginUser.id" to="/discovery" class="yuemu-d-nav-item" :class="{ 'yuemu-active': route.path === '/discovery' }" @click="showMobileMenu = false">
                <i class="fa-solid fa-fire"></i> {{ $t('nav.discovery') }}
              </router-link>

              <router-link v-if="loginUserStore.loginUser.id" to="/chat/ai" class="yuemu-d-nav-item yuemu-d-ai-nav-item" :class="{ 'yuemu-active': route.path === '/chat/ai' }" @click="showMobileMenu = false">
                <img :src="aiIcon" class="yuemu-d-ai-icon-img" alt="AI" /> {{ $t('nav.aiAssistant') }}
              </router-link>

              <router-link v-if="loginUserStore.loginUser?.userRole === 'admin'" to="/admin/manage" class="yuemu-d-nav-item" :class="{ 'yuemu-active': route.path.startsWith('/admin/') }" @click="showMobileMenu = false">
                <i class="fa-solid fa-shield-halved"></i> {{ $t('nav.admin') }}
              </router-link>
            </div>

            <div class="yuemu-drawer-footer">
              <template v-if="loginUserStore.loginUser.id">
                <div class="yuemu-d-user-profile" @click="router.push('/my'); showMobileMenu = false">
                  <img :src="loginUserStore.loginUser?.userAvatar || getDefaultAvatar(loginUserStore.loginUser?.userName)" alt="User" />
                  <div class="yuemu-d-user-info">
                    <span class="yuemu-d-name">{{ loginUserStore.loginUser.userName || $t('user.unnamed') }}</span>
                    <span class="yuemu-d-role">{{ $t('user.viewProfile') }}</span>
                  </div>
                </div>
                <div class="yuemu-d-actions-row">
                  <button class="yuemu-d-action-btn" @click="toggleTheme">
                    <i :class="themeStore.isDarkTheme ? 'fa-solid fa-sun' : 'fa-solid fa-moon'"></i>
                    {{ themeStore.isDarkTheme ? $t('user.lightMode') : $t('user.darkMode') }}
                  </button>
                  <button class="yuemu-d-action-btn" @click="toggleLanguage">
                    <i class="fa-solid fa-language"></i>
                    {{ $t('components.globalHeader.switchLangShort') }}
                  </button>
                  <button class="yuemu-d-action-btn yuemu-danger-text" @click="logoutConfirmVisible = true; showMobileMenu = false">
                    <i class="fa-solid fa-arrow-right-from-bracket"></i> {{ $t('user.logout') }}
                  </button>
                </div>
                <button class="yuemu-publish-btn yuemu-d-add-btn" @click="handleAddClick(); showMobileMenu = false">
                  <i class="fa-solid fa-plus"></i> {{ $t('components.globalHeader.publishNew') }}
                </button>
              </template>
              <router-link v-else to="/user/login" class="yuemu-d-login-btn" @click="showMobileMenu = false">{{ $t('user.loginOrRegister') }}</router-link>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="yuemu-pop">
        <div v-if="logoutConfirmVisible" class="yuemu-native-modal-overlay" @click.self="logoutConfirmVisible = false">
          <div class="yuemu-native-confirm-dialog">
            <div class="yuemu-dialog-icon yuemu-text-danger">
              <i class="fa-solid fa-arrow-right-from-bracket"></i>
            </div>
            <h3>{{ $t('user.logoutConfirmTitle') }}</h3>
            <p>{{ $t('user.logoutConfirmDesc') }}</p>
            <div class="yuemu-dialog-actions">
              <button class="yuemu-dialog-btn yuemu-cancel" @click="logoutConfirmVisible = false">{{ $t('common.cancel') }}</button>
              <button class="yuemu-dialog-btn yuemu-danger" @click="confirmLogout">{{ $t('common.confirm') }}</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <UploadActionSheet v-model="showActionSheet" />
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted, onUnmounted, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import { useThemeStore } from '@/stores/useThemeStore'
import { userLogoutUsingPost } from '@/api/userController'
import { message } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import UploadActionSheet from '@/components/UploadActionSheet.vue'
import aiIcon from '@/assets/icons/ai.svg'

const props = defineProps<{
  unreadCounts: { totalUnread: number; privateUnread: number; friendUnread: number },
  messageCenterUnreadCount: number
}>()

const emit = defineEmits<{
  (e: 'logout'): void
  (e: 'navigate', path: string): void
}>()

const loginUserStore = useLoginUserStore()
const themeStore = useThemeStore()
const route = useRoute()
const router = useRouter()

const showUserMenu = ref(false)
const logoutConfirmVisible = ref(false)
const showActionSheet = ref(false)
const showMobileMenu = ref(false)

const { locale, t } = useI18n()

const toggleLanguage = () => {
  const newLang = locale.value === 'zh-CN' ? 'en-US' : 'zh-CN'
  locale.value = newLang
  localStorage.setItem('locale', newLang)
}

const currentUnreadCounts = shallowRef(props.unreadCounts)
const currentMessageCenterUnreadCount = ref(props.messageCenterUnreadCount || 0)

watch(() => props.unreadCounts, (newVal) => { currentUnreadCounts.value = newVal }, { deep: true, immediate: true })
watch(() => props.messageCenterUnreadCount, (newVal) => { currentMessageCenterUnreadCount.value = newVal || 0 }, { immediate: true })

watch(() => loginUserStore.loginUser.id, (newId, oldId) => {
  if (newId && !oldId) {
    showUserMenu.value = false
    showMobileMenu.value = false
  } else if (!newId && oldId) {
    showUserMenu.value = false
    showMobileMenu.value = false
  }
}, { immediate: false })

const getDefaultAvatar = (userName = 'Guest') => {
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(userName)}&backgroundColor=ffd5dc,ffdfbf,ffd5dc`
}

const toggleUserMenu = () => showUserMenu.value = !showUserMenu.value
const toggleTheme = () => {
  themeStore.toggleTheme()
  window.dispatchEvent(new Event('themeChange'))
}

const handleSearchClick = () => {
  emit('navigate', '/search')
  router.push('/search')
}

const handleAddClick = () => {
  if (!loginUserStore.loginUser?.id) {
    message.warning(t('components.globalHeader.pleaseLogin'))
    router.push('/user/login')
    return
  }
  showActionSheet.value = true
}

const confirmLogout = async () => {
  try {
    const res = await userLogoutUsingPost()
    if (res.data.code === 0) {
      logoutConfirmVisible.value = false
      loginUserStore.setLoginUser({ userName: t('components.globalHeader.notLoggedIn') })
      emit('logout')
      router.push('/user/login')
    }
  } catch (error) {
    message.error(t('components.globalHeader.logoutFailed'))
  }
}

const closeMenus = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('.yuemu-user-dropdown-trigger')) {
    showUserMenu.value = false
  }
}

onMounted(() => document.addEventListener('click', closeMenus))
onUnmounted(() => document.removeEventListener('click', closeMenus))
</script>

<style scoped>
/* ==================== 核心重置 ==================== */
* { box-sizing: border-box; }

.yuemu-global-header-container {
  display: flex; align-items: center; justify-content: space-between;
  width: 100%; height: 64px; line-height: 1 !important;
  max-width: 1400px; margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

/* 左侧 Logo */
.yuemu-logo-link { display: flex; align-items: center; }
.yuemu-logo-image { height: 36px; width: auto; transition: transform 0.2s; }
.yuemu-logo-link:hover .yuemu-logo-image { transform: scale(1.05); }

/* ==================== 中央胶囊导航 ==================== */
.yuemu-header-center { position: absolute; left: 50%; transform: translateX(-50%); }

.yuemu-pill-nav-container {
  display: flex; align-items: center; background: var(--hover-background, #f4f5f7);
  padding: 4px; border-radius: 99px; gap: 4px; height: 44px;
}

.yuemu-nav-item {
  position: relative; display: flex; align-items: center; justify-content: center;
  height: 36px; padding: 0 20px; border-radius: 99px;
  color: var(--text-secondary, #666); font-size: 15px; font-weight: 500;
  text-decoration: none; transition: all 0.2s ease;
}
.yuemu-nav-item:hover { color: var(--text-primary, #111); }
.yuemu-nav-item.yuemu-active { background: var(--link-color, #2563eb); color: #ffffff; box-shadow: 0 2px 8px rgba(37, 99, 235, 0.2); }
.yuemu-badge-dot { position: absolute; top: 6px; right: 10px; width: 6px; height: 6px; background-color: #ef4444; border-radius: 50%; }

/* ==================== 右侧操作区 ==================== */
.yuemu-header-right { display: flex; align-items: center; gap: 16px; }

/* 基础 Icon 按钮 */
.yuemu-icon-btn {
  display: flex; justify-content: center; align-items: center;
  width: 38px; height: 38px; border-radius: 50%; border: none; background: transparent;
  color: var(--text-primary, #333); font-size: 18px; cursor: pointer;
  transition: all 0.2s; text-decoration: none;
}
.yuemu-icon-btn:hover { background: var(--hover-background, rgba(0,0,0,0.05)); }
.yuemu-icon-btn.yuemu-active { background: var(--link-color, #2563eb); color: #ffffff; }

/* AI 按钮高级质感 */
.yuemu-ai-icon-btn {
  background: rgba(168, 85, 247, 0.04) !important;
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.yuemu-ai-icon-img { width: 28px; height: 28px; object-fit: contain; transition: transform 0.3s ease; }
.yuemu-ai-icon-btn:hover {
  background: rgba(168, 85, 247, 0.12) !important;
  border-color: transparent !important;
  box-shadow: 0 0 12px rgba(168, 85, 247, 0.2);
  transform: translateY(-1px);
}
.yuemu-ai-icon-btn:hover .yuemu-ai-icon-img { transform: scale(1.1); }
.yuemu-ai-icon-btn.yuemu-active {
  background: rgba(168, 85, 247, 0.15) !important;
  border: none !important;
  box-shadow: 0 0 16px rgba(168, 85, 247, 0.35) !important;
}

.yuemu-notification-btn { position: relative; }
.yuemu-capsule-badge {
  position: absolute; top: -2px; right: -4px; background-color: #ef4444; color: #fff;
  font-size: 11px; font-weight: bold; display: flex; align-items: center; justify-content: center;
  min-width: 18px; height: 18px; padding: 0 5px; border-radius: 10px; border: 2px solid var(--header-background, #fff);
}

.yuemu-publish-btn {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  height: 38px; padding: 0 18px; border-radius: 19px; border: none;
  background: var(--link-color, #2563eb); color: #fff; font-size: 15px; font-weight: 500; cursor: pointer; transition: background 0.2s;
}
.yuemu-publish-btn:hover { background: var(--link-hover-color, #1d4ed8); }
.yuemu-publish-btn i { font-size: 14px; }

/* 头像及下拉菜单 */
.yuemu-user-dropdown-trigger { position: relative; }
.yuemu-avatar-wrapper { cursor: pointer; display: flex; align-items: center; padding: 2px; }
.yuemu-avatar-img { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 1px solid rgba(0,0,0,0.05); }

.yuemu-modern-dropdown-menu {
  position: absolute; top: calc(100% + 12px); right: 0; width: 180px;
  background: var(--card-background, #fff); border: 1px solid var(--border-color, rgba(0,0,0,0.05));
  border-radius: 16px; padding: 8px; box-shadow: 0 10px 40px rgba(0,0,0,0.08);
  transform-origin: top right; z-index: 2000;
}
.yuemu-dropdown-header { padding: 12px 12px 8px; display: flex; flex-direction: column; }
.yuemu-dropdown-header .yuemu-user-name { font-size: 15px; font-weight: 600; color: var(--text-primary, #111); margin-bottom: 4px; }
.yuemu-dropdown-header .yuemu-user-role { font-size: 12px; color: var(--text-secondary, #888); }
.yuemu-dropdown-divider { height: 1px; background: var(--border-color, #f0f0f0); margin: 4px 0; }
.yuemu-dropdown-item {
  display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 10px;
  font-size: 14px; font-weight: 500; color: var(--text-primary, #333);
  text-decoration: none; cursor: pointer; transition: background 0.2s;
}
.yuemu-dropdown-item i { font-size: 15px; width: 16px; text-align: center; color: var(--text-secondary, #888); }
.yuemu-dropdown-item:hover { background: var(--hover-background, #f9f9f9); }

.yuemu-login-btn {
  display: flex; align-items: center; height: 36px; padding: 0 20px;
  border-radius: 18px; background: var(--link-color, #2563eb); color: #fff;
  font-size: 14px; font-weight: 500; text-decoration: none;
}

/* ==================== 抽屉式移动端菜单 ==================== */
.yuemu-mobile-drawer-overlay {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(4px);
}

.yuemu-mobile-drawer-content {
  position: absolute; top: 0; right: 0; bottom: 0;
  width: 85vw; max-width: 360px;
  background: var(--card-background, #ffffff);
  box-shadow: -10px 0 30px rgba(0,0,0,0.1);
  display: flex; flex-direction: column;
}

:deep(.dark-theme) .yuemu-mobile-drawer-content { background: var(--card-background, #111); }

.yuemu-drawer-header {
  height: 64px; padding: 0 20px; display: flex; align-items: center; justify-content: space-between;
  border-bottom: 1px solid var(--border-color, #f4f5f7); flex-shrink: 0;
}
.yuemu-logo-image-drawer { height: 28px; }
.yuemu-close-btn { background: var(--hover-background, rgba(0,0,0,0.05)); }

.yuemu-drawer-nav-list {
  flex: 1; padding: 24px 20px; display: flex; flex-direction: column; gap: 16px;
  overflow-y: auto; -webkit-overflow-scrolling: touch;
}
.yuemu-d-nav-item {
  flex-shrink: 0; min-height: 56px;
  font-size: 16px; font-weight: 600; color: var(--text-primary, #333);
  text-decoration: none; display: flex; align-items: center; gap: 16px;
  padding: 0 20px; border-radius: 16px; transition: 0.2s ease;
  background: var(--hover-background, #f9f9f9);
}
.yuemu-d-nav-item i { font-size: 18px; width: 24px; text-align: center; color: var(--text-secondary, #888); }
.yuemu-d-nav-item:active { transform: scale(0.98); }
.yuemu-d-nav-item.yuemu-active { background: rgba(37, 99, 235, 0.1); color: var(--link-color, #2563eb); }
.yuemu-d-nav-item.yuemu-active i { color: var(--link-color, #2563eb); }
.yuemu-d-badge { margin-left: auto; background: #ef4444; color: #fff; font-size: 13px; padding: 2px 10px; border-radius: 12px; }

.yuemu-d-ai-nav-item { background: linear-gradient(135deg, rgba(168, 85, 247, 0.05), rgba(126, 34, 206, 0.02)); color: #9333ea; border: 1px solid rgba(168, 85, 247, 0.1); }
.yuemu-d-ai-nav-item.yuemu-active { background: linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(126, 34, 206, 0.1)); border-color: rgba(168, 85, 247, 0.3); }
.yuemu-d-ai-icon-img { width: 22px; height: 22px; object-fit: contain; }

.yuemu-drawer-footer {
  padding: 24px 20px calc(24px + env(safe-area-inset-bottom));
  border-top: 1px solid var(--border-color, #f0f0f0); flex-shrink: 0;
  background: var(--card-background, #fff);
}
.yuemu-d-user-profile { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
.yuemu-d-user-profile img { width: 44px; height: 44px; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.yuemu-d-user-info { display: flex; flex-direction: column; gap: 4px; }
.yuemu-d-name { font-size: 16px; font-weight: 600; color: var(--text-primary); }
.yuemu-d-role { font-size: 12px; color: var(--text-secondary); }

.yuemu-d-actions-row { display: flex; gap: 12px; margin-bottom: 16px; }
.yuemu-d-action-btn { flex: 1; padding: 12px; border-radius: 12px; border: none; background: var(--hover-background, #f4f5f7); color: var(--text-primary); font-size: 14px; font-weight: 500; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 8px; }
.yuemu-danger-text { color: #ef4444 !important; background: rgba(239, 68, 68, 0.1) !important; }

.yuemu-d-add-btn { width: 100%; height: 50px; font-size: 16px; justify-content: center; border-radius: 14px; }
.yuemu-d-login-btn { display: flex; align-items: center; justify-content: center; height: 50px; background: var(--link-color, #2563eb); color: #fff; border-radius: 14px; font-size: 16px; font-weight: 600; text-decoration: none; }

/* ==================== 原生退出确认弹窗 ==================== */
.yuemu-native-modal-overlay {
  position: fixed; inset: 0; z-index: 10000;
  background: rgba(0,0,0,0.4); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; padding: 24px; line-height: 1.5;
}
.yuemu-native-confirm-dialog {
  background: var(--card-background, #fff); border-radius: 20px; width: 100%; max-width: 320px;
  padding: 32px 24px 24px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  display: flex; flex-direction: column; align-items: center;
}
.yuemu-dialog-icon {
  display: inline-flex; width: 56px; height: 56px; background: rgba(239, 68, 68, 0.1); border-radius: 50%;
  align-items: center; justify-content: center; margin-bottom: 16px; font-size: 24px;
}
.yuemu-native-confirm-dialog h3 { font-size: 18px; font-weight: 600; color: var(--text-primary); margin: 0 0 8px; }
.yuemu-native-confirm-dialog p { font-size: 14px; color: var(--text-secondary); margin: 0 0 24px; }
.yuemu-dialog-actions { display: flex; gap: 12px; width: 100%; }
.yuemu-dialog-btn { flex: 1; height: 44px; border-radius: 12px; font-size: 15px; font-weight: 600; cursor: pointer; border: none; display: flex; align-items: center; justify-content: center; }
.yuemu-dialog-btn.yuemu-cancel { background: var(--hover-background, #f5f5f5); color: var(--text-primary); }
.yuemu-dialog-btn.yuemu-danger { background: #ef4444; color: #fff; }

/* 动画系统 */
.yuemu-dropdown-enter-active, .yuemu-dropdown-leave-active { transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1); }
.yuemu-dropdown-enter-from, .yuemu-dropdown-leave-to { opacity: 0; transform: scale(0.95) translateY(-10px); }
.yuemu-pop-enter-active, .yuemu-pop-leave-active { transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1); }
.yuemu-pop-enter-from, .yuemu-pop-leave-to { opacity: 0; transform: scale(0.9); }

.yuemu-drawer-enter-active, .yuemu-drawer-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
}
.yuemu-drawer-enter-active .yuemu-mobile-drawer-content,
.yuemu-drawer-leave-active .yuemu-mobile-drawer-content {
  transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);
}
.yuemu-drawer-enter-from, .yuemu-drawer-leave-to {
  background: rgba(0, 0, 0, 0);
  backdrop-filter: blur(0);
}
.yuemu-drawer-enter-from .yuemu-mobile-drawer-content,
.yuemu-drawer-leave-to .yuemu-mobile-drawer-content {
  transform: translateX(100%);
}

/* 响应式 */
.yuemu-pc-only { display: flex; }
.yuemu-mobile-only { display: none; }
@media (max-width: 1024px) {
  .yuemu-pc-only { display: none !important; }
  .yuemu-mobile-only { display: flex !important; }
}

/* 移动端强制移除点击时的悬停缩放，防止底层长按死锁 */
@media (max-width: 1024px) {
  .yuemu-publish-btn:active, .yuemu-publish-btn:hover,
  .yuemu-publish-btn:active *, .yuemu-publish-btn:hover *,
  .ant-card-hoverable:active, .ant-card-hoverable:hover,
  .ant-card-hoverable:active *, .ant-card-hoverable:hover *,
  .yuemu-nav-item:active, .yuemu-nav-item:hover,
  .yuemu-nav-item:active *, .yuemu-nav-item:hover *,
  .yuemu-dropdown-item:active, .yuemu-dropdown-item:hover,
  .yuemu-dropdown-item:active *, .yuemu-dropdown-item:hover *,
  .yuemu-logo-link:active, .yuemu-logo-link:hover,
  .yuemu-logo-link:active *, .yuemu-logo-link:hover *,
  .yuemu-icon-btn:active, .yuemu-icon-btn:hover,
  .yuemu-icon-btn:active *, .yuemu-icon-btn:hover *,
  .yuemu-ai-icon-btn:active, .yuemu-ai-icon-btn:hover,
  .yuemu-ai-icon-btn:active *, .yuemu-ai-icon-btn:hover * {
    transform: none !important;
  }
}
</style>
