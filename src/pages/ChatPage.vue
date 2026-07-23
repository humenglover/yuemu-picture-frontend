<template>
  <div class="yuemu-chat-page">
    <div class="yuemu-chat-container">

      <div class="yuemu-chat-main">
        <header class="yuemu-header">
          <div class="yuemu-header-left">
            <button class="yuemu-back-btn" @click="goBack" :title="$t('pages.chatPage.back')">
              <i class="fas fa-chevron-left"></i>
            </button>
            <div class="yuemu-user-info" @click="handleAvatarClick">
              <div class="yuemu-avatar-wrap">
                <img :src="targetUser.userAvatar || getDefaultAvatar(targetUser.userName)" alt="avatar" />
                <span v-if="!isGroupChat" class="yuemu-status-dot" :class="{ 'is-online': isOnline }"></span>
              </div>
              <div class="yuemu-user-meta">
                <span class="yuemu-user-name">{{ targetUser.userName }}</span>
                <span v-if="isGroupChat" class="yuemu-group-tag">{{ $t('pages.chatPage.allGroup') }}</span>
                <span v-else class="yuemu-status-text">{{ isOnline ? $t('pages.chatPage.onlineNow') : $t('pages.chatPage.offline') }}</span>
              </div>
            </div>
          </div>

          <div class="yuemu-header-right" v-if="isGroupChat && spaceId === -2">
            <button class="yuemu-action-btn" @click="showAnnouncement = true" :title="$t('pages.chatPage.groupNotice')">
              <i class="fas fa-bullhorn"></i>
            </button>
            <button class="yuemu-action-btn with-count" @click="toggleUserModal" :title="$t('pages.chatPage.onlineUsers')">
              <i class="fas fa-users"></i>
              <span class="yuemu-count-badge">{{ onlineUsers.length }}</span>
            </button>
          </div>
        </header>

        <transition name="yuemu-fade-slide">
          <div v-if="loadingHistory" class="yuemu-top-loading-indicator">
            <i class="fas fa-circle-notch fa-spin"></i>
            <span>{{ $t('pages.chatPage.loadingHistory') }}</span>
          </div>
        </transition>

        <PictureChatRoom
          ref="chatRoomRef"
          :type="isGroupChat ? 'group' : 'private'"
          :privateChatId="privateChatId"
          :spaceId="spaceId"
          class="yuemu-chat-room-wrapper"
          @message="handleChatMessage"
          @mounted="handleChatMounted"
          @update:onlineUsers="updateOnlineUsers"
        />
      </div>
    </div>
  </div>

  <teleport to="body">
    <transition name="yuemu-modal-fade">
      <div v-if="showUserModal" class="yuemu-modal-overlay" @click.self="toggleUserModal">
        <div class="yuemu-modal-card">
          <div class="yuemu-drag-indicator" v-if="isMobile"></div>
          <div class="yuemu-modal-header">
            <h3><i class="fas fa-users" style="color: #1677ff; margin-right: 8px;"></i>{{ $t('pages.chatPage.onlineNow') }} ({{ onlineUsers.length }})</h3>
            <button class="yuemu-close-btn" @click="toggleUserModal"><i class="fas fa-times"></i></button>
          </div>
          <div class="yuemu-modal-body">
            <div v-if="!onlineUsers.length" class="yuemu-empty-state">
              <i class="fas fa-user-slash"></i>
              <p>{{ $t('pages.chatPage.noOtherOnline') }}</p>
            </div>
            <div v-else class="yuemu-users-list">
              <div v-for="user in onlineUsers" :key="user.id" class="yuemu-user-item" @click="handleUserClick(user)">
                <div class="yuemu-item-avatar">
                  <img :src="user.userAvatar || getDefaultAvatar(user.userName)" alt="avatar" />
                  <div class="yuemu-online-ring"></div>
                </div>
                <div class="yuemu-item-meta">
                  <div class="yuemu-item-name">{{ user.userName }}</div>
                  <div class="yuemu-item-role" :class="{ 'is-admin': user.userRole === 'admin' }">{{ getRoleLabel(user.userRole) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </teleport>

  <teleport to="body">
    <transition name="yuemu-modal-fade">
      <div v-if="showAnnouncement" class="yuemu-modal-overlay" @click.self="showAnnouncement = false">
        <div class="yuemu-modal-card yuemu-announcement-card">
          <div class="yuemu-drag-indicator" v-if="isMobile"></div>
          <div class="yuemu-modal-header">
            <h3><i class="fas fa-bullhorn" style="color: #f59e0b; margin-right: 8px;"></i>{{ $t('pages.chatPage.noticeTitle') }}</h3>
            <button class="yuemu-close-btn" @click="showAnnouncement = false"><i class="fas fa-times"></i></button>
          </div>
          <div class="yuemu-modal-body">
            <div class="yuemu-announcement-content">
              <p class="greeting">{{ $t('pages.chatPage.noticeSubtitle') }}{{ $t('pages.chatPage.noticeContent1') }}</p>
              <ul class="rules-list">
                <li><i class="fas fa-star"></i> {{ $t('pages.chatPage.noticeContent2') }}</li>
                <li><i class="fas fa-image"></i> {{ $t('pages.chatPage.noticeContent3') }}</li>
                <li><i class="fas fa-ban"></i> {{ $t('pages.chatPage.noticeContent4') }}</li>
                <li><i class="fas fa-shield-alt"></i> {{ $t('pages.chatPage.noticeContent5') }}</li>
              </ul>
            </div>
            <button class="yuemu-btn-primary full-width mt-16" @click="showAnnouncement = false">{{ $t('pages.chatPage.understood') }}</button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>

</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

import { ref, onMounted as vueOnMounted, onBeforeUnmount, nextTick, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PictureChatRoom from '@/components/PictureChatRoom.vue'
import { getDefaultAvatar } from '@/utils/userUtils'
import { useLoginUserStore } from '@/stores/useLoginUserStore'

const route = useRoute()
const router = useRouter()
const loginUserStore = useLoginUserStore()
const mounted = ref(false)
const isOnline = ref(false)
const chatRoomRef = ref()

const onlineUsers = ref<any[]>([])
const showUserModal = ref(false)
const showAnnouncement = ref(false)
const loadingHistory = ref(false)

const targetUser = ref({
  id: route.params.userId.toString(),
  userName: route.query.userName as string,
  userAvatar: route.query.userAvatar as string,
  userAccount: route.query.userAccount as string,
  createTime: route.query.createTime as string
})

const privateChatId = ref(route.query.privateChatId as string)
const spaceId = ref(route.query.spaceId ? Number(route.query.spaceId) : undefined)

const isGroupChat = computed(() => route.query.type === 'group')
const isMobile = computed(() => window.innerWidth <= 768)

const updateOnlineUsers = (users: any[]) => { onlineUsers.value = users }
const toggleUserModal = () => { showUserModal.value = !showUserModal.value }

const handleUserClick = (user: any) => {
  if (!user.id) return
  showUserModal.value = false 
  router.push({ name: 'UserDetail', params: { id: user.id } })
}

const getRoleLabel = (role: string) => {
  const roleMap: Record<string, string> = { 'admin': t('pages.chatPage.admin'), 'user': t('pages.chatPage.member') }
  return roleMap[role] || t('pages.chatPage.member')
}

const handleChatMounted = async () => {
  await nextTick()
  const messageContainer = chatRoomRef.value?.$el.querySelector('.yuemu-chat-messages') || chatRoomRef.value?.$el.querySelector('.chat-messages')
  if (messageContainer) messageContainer.scrollTop = messageContainer.scrollHeight
}

const handleChatMessage = (msg: any) => {
  if (msg.type === 'error') { console.error(t('pages.chatPage.chatError', { msg: msg.message })); return }
  if (msg.type === 'history' || msg.type === 'moreHistory') loadingHistory.value = false

  if (msg.type === 'onlineUsers') {
    isOnline.value = msg.onlineUsers?.some((user: any) => user.id === targetUser.value?.id)
  } else if (msg.type === 'history' || msg.type === 'message') {
    nextTick(() => {
      const messageContainer = chatRoomRef.value?.$el.querySelector('.yuemu-chat-messages') || chatRoomRef.value?.$el.querySelector('.chat-messages')
      if (messageContainer) messageContainer.scrollTop = messageContainer.scrollHeight
    })
  }
}

const handleAvatarClick = () => {
  if (isGroupChat.value) return
  router.push({
    name: 'UserDetail',
    params: { id: targetUser.value.id },
    query: { userName: targetUser.value.userName, userAvatar: targetUser.value.userAvatar, userAccount: targetUser.value.userAccount, createTime: targetUser.value.createTime }
  })
}

const goBack = () => {
  mounted.value = false
  setTimeout(() => { router.back() }, 150)
}

vueOnMounted(() => {
  setTimeout(() => { mounted.value = true }, 100)
  nextTick(() => {
    const messageContainer = chatRoomRef.value?.$el.querySelector('.yuemu-chat-messages') || chatRoomRef.value?.$el.querySelector('.chat-messages')
    if (messageContainer) messageContainer.scrollTop = messageContainer.scrollHeight
  })
})

onBeforeUnmount(() => {
  if (chatRoomRef.value) chatRoomRef.value.disconnect()
})
</script>

<style scoped lang="scss">
/* ================= 全局与基础重置 ================= */
.yuemu-chat-page {
  height: 92vh; width: 100%;
  background: var(--background, #f5f5f5);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: var(--text-primary);
  display: flex; flex-direction: column; overflow: hidden;
  margin: 0 auto; max-width: 1400px;

  @media (max-width: 768px) {
    height: 100vh; height: 100dvh;
    position: fixed; inset: 0; z-index: 100;
  }
}

.yuemu-chat-container {
  flex: 1; display: flex; position: relative;
  width: 100%; max-width: 860px; margin: 0 auto;
}

.yuemu-chat-main {
  flex: 1; display: flex; flex-direction: column; position: relative;
  background: var(--background); overflow: hidden;

  @media (min-width: 769px) {
    background: var(--card-background, #fff);
    border-radius: 20px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.05);
    border: 1px solid var(--border-color);
    margin: 10px 0;
  }
}

/* ================= 现代化顶部导航栏 ================= */
.yuemu-header {
  height: 60px; padding: 0 6px;
  display: flex; justify-content: space-between; align-items: center;
  background: var(--card-background, rgba(255,255,255,0.85));
  backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-color);
  z-index: 50; flex-shrink: 0;
}

.yuemu-header-left { display: flex; align-items: center; gap: 4px; }

.yuemu-back-btn {
  background: transparent; border: none; font-size: 18px; color: var(--text-primary);
  width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: 0.2s;
  &:hover { background: var(--hover-background); }
  &:active { transform: scale(0.9); }
}

.yuemu-user-info {
  display: flex; align-items: center; gap: 10px; cursor: pointer; padding: 4px 2px; border-radius: 12px; transition: 0.2s;
  &:hover { background: var(--hover-background); }
}

.yuemu-avatar-wrap {
  position: relative; width: 40px; height: 40px; border-radius: 50%;
  img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 1px solid var(--border-color); }

  .yuemu-status-dot {
    position: absolute; bottom: 0; right: 0; width: 12px; height: 12px; border-radius: 50%;
    background: #d9d9d9; border: 2px solid var(--card-background, #fff); transition: 0.3s;
    &.is-online { background: #52c41a; box-shadow: 0 0 0 2px rgba(82, 196, 26, 0.2); }
  }
}

.yuemu-user-meta { display: flex; flex-direction: column; justify-content: center; }
.yuemu-user-name { font-size: 15px; font-weight: 600; color: var(--text-primary); max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.yuemu-status-text { font-size: 11px; color: var(--text-secondary); }
.yuemu-group-tag { font-size: 10px; font-weight: 600; background: rgba(22, 119, 255, 0.1); color: #1677ff; padding: 2px 6px; border-radius: 4px; display: inline-block; width: fit-content; margin-top: 2px;}

.yuemu-header-right { display: flex; gap: 8px; }
.yuemu-action-btn {
  background: var(--hover-background); border: none; color: var(--text-secondary);
  height: 36px; border-radius: 18px; padding: 0 12px; font-size: 14px;
  display: flex; align-items: center; justify-content: center; gap: 6px;
  cursor: pointer; transition: 0.2s;
  &:hover { background: var(--border-color); color: var(--text-primary); }

  &.with-count {
    padding-right: 6px;
    .yuemu-count-badge { background: #1677ff; color: #fff; font-size: 11px; font-weight: 600; padding: 2px 6px; border-radius: 10px; line-height: 1; }
  }
}

/* 顶部加载状态 */
.yuemu-top-loading-indicator {
  position: absolute; top: 70px; left: 50%; transform: translateX(-50%);
  background: var(--card-background); border: 1px solid var(--border-color); box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 500; color: #1677ff;
  display: flex; align-items: center; gap: 8px; z-index: 40;
}

/* 核心聊天组件包装器，确保占满剩余空间 */
.yuemu-chat-room-wrapper { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

/* ================= 弹窗/模态框组件 (自适应) ================= */
.yuemu-modal-overlay {
  position: fixed; inset: 0; z-index: 2000;
  background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; padding: 20px;
}

.yuemu-modal-card {
  position: relative; width: 100%; max-width: 400px;
  background: var(--card-background, #fff); border-radius: 24px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.15); overflow: hidden;
  display: flex; flex-direction: column; max-height: 80vh;
}

.yuemu-modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20px 24px 16px; border-bottom: 1px solid var(--hover-background);
  h3 { margin: 0; font-size: 18px; font-weight: 600; color: var(--text-primary); display: flex; align-items: center;}
}

.yuemu-close-btn { background: var(--hover-background); border: none; width: 32px; height: 32px; border-radius: 50%; color: var(--text-secondary); cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; }
.yuemu-close-btn:hover { background: var(--border-color); color: var(--text-primary); }

.yuemu-modal-body { flex: 1; overflow-y: auto; padding: 16px 24px 24px; }
.yuemu-modal-body::-webkit-scrollbar { display: none; } /* 隐藏弹窗内滚动条 */

/* 用户列表样式 */
.yuemu-empty-state { text-align: center; padding: 40px 0; color: var(--text-secondary); i { font-size: 40px; opacity: 0.3; margin-bottom: 12px; } p { font-size: 14px; margin: 0; } }

.yuemu-users-list { display: flex; flex-direction: column; gap: 8px; }
.yuemu-user-item {
  display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 12px;
  background: var(--hover-background, transparent); cursor: pointer; transition: 0.2s; border: 1px solid transparent;
  &:hover { background: var(--hover-background); border-color: var(--border-color); transform: translateX(4px); }
}

.yuemu-item-avatar {
  position: relative; width: 44px; height: 44px; border-radius: 50%;
  img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
  .yuemu-online-ring { position: absolute; inset: -3px; border-radius: 50%; border: 2px solid #52c41a; border-top-color: transparent; animation: spin 2s linear infinite; opacity: 0.5; }
}

.yuemu-item-meta { flex: 1; min-width: 0; }
.yuemu-item-name { font-size: 15px; font-weight: 600; color: var(--text-primary); margin-bottom: 2px; }
.yuemu-item-role { font-size: 12px; color: var(--text-secondary); }
.yuemu-item-role.is-admin { color: #f59e0b; font-weight: 500; }

/* 公告内容样式 */
.yuemu-announcement-card { max-width: 360px; }
.yuemu-announcement-content {
  .greeting { font-size: 15px; color: var(--text-primary); line-height: 1.6; margin: 0 0 16px; font-weight: 500; }
  .rules-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; }
  .rules-list li { display: flex; gap: 10px; font-size: 14px; color: var(--text-secondary); line-height: 1.5; i { color: #1677ff; font-size: 14px; margin-top: 3px; } }
}

/* 按钮与辅助类 */
.yuemu-btn-primary { background: #1677ff; color: #fff; border: none; padding: 12px; border-radius: 12px; font-size: 15px; font-weight: 600; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 12px rgba(22, 119, 255, 0.2); }
.yuemu-btn-primary:active { transform: scale(0.96); }
.full-width { width: 100%; }
.mt-16 { margin-top: 16px; }

/* ================= 移动端适配 (Bottom Sheet) ================= */
@media screen and (max-width: 768px) {
  .yuemu-modal-overlay { align-items: flex-end; padding: 0; }
  .yuemu-modal-card {
    max-width: 100%; max-height: 85vh; border-radius: 24px 24px 0 0;
    padding-bottom: env(safe-area-inset-bottom);
  }
  .yuemu-drag-indicator { width: 40px; height: 4px; background: var(--border-color); border-radius: 2px; position: absolute; top: 10px; left: 50%; transform: translateX(-50%); }

  /* 修改移动端动画方向 */
  .yuemu-modal-fade-enter-from .yuemu-modal-card, .yuemu-modal-fade-leave-to .yuemu-modal-card { transform: translateY(100%); }
}

/* ================= 动画特效 ================= */
.yuemu-fade-slide-enter-active, .yuemu-fade-slide-leave-active { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.yuemu-fade-slide-enter-from, .yuemu-fade-slide-leave-to { opacity: 0; transform: translate(-50%, -20px); }

.yuemu-modal-fade-enter-active, .yuemu-modal-fade-leave-active { transition: opacity 0.3s; }
.yuemu-modal-fade-enter-active .yuemu-modal-card { animation: modalPopUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.yuemu-modal-fade-leave-active .yuemu-modal-card { transition: transform 0.3s; transform: translateY(100%); }

.yuemu-modal-fade-enter-from, .yuemu-modal-fade-leave-to { opacity: 0; }

@keyframes modalPopUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
@keyframes spin { 100% { transform: rotate(360deg); } }

/* 深色模式修正 */
@media (prefers-color-scheme: dark) { .yuemu-chat-page {
  .yuemu-status-dot.is-online { border-color: var(--card-background); } }
  .yuemu-group-tag { background: rgba(22, 119, 255, 0.2); }
}
</style>
