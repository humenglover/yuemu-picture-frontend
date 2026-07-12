<template>
  <div class="message-center" :class="{ 'pc-message-center': !isMobile }">
    <div class="message-header">
      <div class="header-left">
        <h2 class="page-title">{{ $t('pages.messageCenterPage.title') }}</h2>
        <div class="total-unread" v-if="messageData.totalUnread > 0">
          {{ $t('pages.messageCenterPage.unreadCount').split('{count}')[0] }}<span class="highlight">{{ messageData.totalUnread }}</span>{{ $t('pages.messageCenterPage.unreadCount').split('{count}')[1] }}
        </div>
        <div class="total-unread empty" v-else>
            {{ $t('pages.messageCenterPage.noNewMsg') }}
        </div>
      </div>
      <div class="header-right">
        <button
          class="mark-read-btn"
          :disabled="messageData.totalUnread <= 0 || markingRead"
          @click="handleMarkAllRead"
        >
          <i v-if="markingRead" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-check-double"></i>
          <span>{{ $t('pages.messageCenterPage.markAllRead') }}</span>
        </button>
      </div>
    </div>

    <div class="stats-cards-wrapper">
      <div class="stats-cards">
        <div
          class="stat-card"
          :class="{ active: activeTab === 'comments' }"
          @click="handleTabChange('comments')"
        >
          <div class="stat-icon-wrapper comments">
            <i class="fas fa-comment"></i>
            <div class="unread-badge" v-if="messageData.unreadComments > 0">{{ messageData.unreadComments }}</div>
          </div>
          <span class="stat-label">{{ $t('pages.messageCenterPage.filterComments') }}</span>
        </div>

        <div
          class="stat-card"
          :class="{ active: activeTab === 'likes' }"
          @click="handleTabChange('likes')"
        >
          <div class="stat-icon-wrapper likes">
            <i class="fas fa-heart"></i>
            <div class="unread-badge" v-if="messageData.unreadLikes > 0">{{ messageData.unreadLikes }}</div>
          </div>
          <span class="stat-label">{{ $t('pages.messageCenterPage.filterLikes') }}</span>
        </div>

        <div
          class="stat-card"
          :class="{ active: activeTab === 'shares' }"
          @click="handleTabChange('shares')"
        >
          <div class="stat-icon-wrapper shares">
            <i class="fas fa-share-alt"></i>
            <div class="unread-badge" v-if="messageData.unreadShares > 0">{{ messageData.unreadShares }}</div>
          </div>
          <span class="stat-label">{{ $t('pages.messageCenterPage.filterShares') }}</span>
        </div>

        <div
          class="stat-card"
          :class="{ active: activeTab === 'system' }"
          @click="handleTabChange('system')"
        >
          <div class="stat-icon-wrapper system">
            <i class="fas fa-bell"></i>
            <div class="unread-badge" v-if="messageData.unreadSystemNotifies > 0">{{ messageData.unreadSystemNotifies }}</div>
          </div>
          <span class="stat-label">{{ $t('pages.messageCenterPage.filterSystem') }}</span>
        </div>
      </div>
    </div>

    <div class="message-list-container">
      <div class="list-content" ref="messageListRef">
        <div v-if="loading && getCurrentData().length === 0" class="state-container loading-state">
          <i class="fas fa-spinner fa-spin"></i>
          <p>{{ $t('pages.messageCenterPage.loading') }}</p>
        </div>

        <transition name="fade" mode="out-in">
          <UnifiedMessageCard
            v-if="activeTab === 'comments' && !(loading && getCurrentData().length === 0)"
            messageType="comment"
            :all-messages="allCommentsData"
            :unread-count="unreadCommentsCount"
            @refresh="handleTabChange(activeTab)"
            :key="'comments'"
          />

          <UnifiedMessageCard
            v-else-if="activeTab === 'likes' && !(loading && getCurrentData().length === 0)"
            messageType="like"
            :all-messages="allLikesData"
            :unread-count="unreadLikesCount"
            @refresh="handleTabChange(activeTab)"
            :key="'likes'"
          />

          <UnifiedMessageCard
            v-else-if="activeTab === 'shares' && !(loading && getCurrentData().length === 0)"
            messageType="share"
            :all-messages="allSharesData"
            :unread-count="unreadSharesCount"
            @refresh="handleTabChange(activeTab)"
            :key="'shares'"
          />

          <UnifiedMessageCard
            v-else-if="activeTab === 'system' && !(loading && getCurrentData().length === 0)"
            messageType="system"
            :all-messages="allSystemNotifiesData"
            :unread-count="unreadSystemNotifiesCount"
            @refresh="handleTabChange(activeTab)"
            :key="'system'"
          />
        </transition>

        <div v-if="isLoadingMore" class="state-container load-more">
          <i class="fas fa-spinner fa-spin"></i>
          <span>{{ $t('pages.messageCenterPage.loadMore') }}</span>
        </div>
        <div v-else-if="!hasMore() && getCurrentData().length > 0" class="state-container no-more">
          <div class="divider"></div>
          <span>{{ $t('pages.messageCenterPage.noMore') }}</span>
          <div class="divider"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// @ts-nocheck
import { ref, onMounted, computed, onUnmounted, nextTick } from 'vue'
import { getAllUnreadCountUsingGet, markAllAsReadUsingPost, getMessageListUsingGet, markSingleAsReadUsingPost } from '@/api/messageCenterController'
import { CommentOutlined, LikeOutlined, ShareAltOutlined, HistoryOutlined, BellOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import UnifiedMessageCard from '@/components/UnifiedMessageCard.vue'
import { Grid } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import { useMessageStore } from '@/stores/useMessageStore'
import { useMessageCenterStore } from '@/stores/useMessageCenterStore'

const { useBreakpoint } = Grid
const screens = useBreakpoint()
const isMobile = computed(() => !screens.md)

const activeTab = ref('comments')
const messageData = ref({
  totalUnread: 0,
  unreadComments: 0,
  unreadLikes: 0,
  unreadShares: 0,
  unreadSystemNotifies: 0
})

// 响应式变量
const allCommentsData = ref([])
const allLikesData = ref([])
const allSharesData = ref([])
const allSystemNotifiesData = ref([])

const unreadCommentsCount = ref(0)
const unreadLikesCount = ref(0)
const unreadSharesCount = ref(0)
const unreadSystemNotifiesCount = ref(0)

const pagination = ref({
  current: 1,
  pageSize: 20,
  total: 0
})

const loading = ref(false)
const isLoadingMore = ref(false)
const loadError = ref(false)
const scrollTimer = ref<number | null>(null)
const messageListRef = ref<HTMLDivElement | null>(null)
const device = ref('pc')

const markingRead = ref(false)
const messageStore = useMessageStore()
const messageCenterStore = useMessageCenterStore()
const router = useRouter()

const hasMore = () => {
  return pagination.value.current * pagination.value.pageSize < pagination.value.total
}

const getCurrentData = () => {
  switch (activeTab.value) {
    case 'comments': return allCommentsData.value
    case 'likes': return allLikesData.value
    case 'shares': return allSharesData.value
    case 'system': return allSystemNotifiesData.value
    default: return []
  }
}

const fetchCommentsData = async (isLoadMore = false) => {
  try {
    if (!isLoadMore) loading.value = true
    const res = await getMessageListUsingGet({
      type: 'comment', current: pagination.value.current, pageSize: pagination.value.pageSize
    })
    if (res.data?.code === 0) {
      const newComments = res.data.data?.records || []
      if (isLoadMore) allCommentsData.value = [...allCommentsData.value, ...newComments]
      else allCommentsData.value = newComments
      pagination.value.total = Number(res.data.data?.total || 0)
      unreadCommentsCount.value = newComments.filter(comment => comment.isRead === 0).length
    }
  } catch (error) {
    if (!isLoadMore) { allCommentsData.value = []; pagination.value.total = 0 }
  } finally {
    if (!isLoadMore) loading.value = false
  }
}

const fetchLikesData = async (isLoadMore = false) => {
  try {
    if (!isLoadMore) loading.value = true
    const res = await getMessageListUsingGet({
      type: 'like', current: pagination.value.current, pageSize: pagination.value.pageSize
    })
    if (res.data?.code === 0) {
      const newLikes = res.data.data?.records || []
      if (isLoadMore) allLikesData.value = [...allLikesData.value, ...newLikes]
      else allLikesData.value = newLikes
      pagination.value.total = Number(res.data.data?.total || 0)
      unreadLikesCount.value = newLikes.filter(like => like.isRead === 0).length
    }
  } catch (error) {
    if (!isLoadMore) { allLikesData.value = []; pagination.value.total = 0 }
  } finally {
    if (!isLoadMore) loading.value = false
  }
}

const fetchSharesData = async (isLoadMore = false) => {
  try {
    if (!isLoadMore) loading.value = true
    const res = await getMessageListUsingGet({
      type: 'share', current: pagination.value.current, pageSize: pagination.value.pageSize
    })
    if (res.data?.code === 0) {
      const newShares = res.data.data?.records || []
      if (isLoadMore) allSharesData.value = [...allSharesData.value, ...newShares]
      else allSharesData.value = newShares
      pagination.value.total = Number(res.data.data?.total || 0)
      unreadSharesCount.value = newShares.filter(share => share.isRead === 0).length
    }
  } catch (error) {
    if (!isLoadMore) { allSharesData.value = []; pagination.value.total = 0 }
  } finally {
    if (!isLoadMore) loading.value = false
  }
}

const fetchSystemNotifiesData = async (isLoadMore = false) => {
  try {
    if (!isLoadMore) loading.value = true
    const res = await getMessageListUsingGet({
      type: 'system', current: pagination.value.current, pageSize: pagination.value.pageSize
    })
    if (res.data?.code === 0) {
      const newNotifies = res.data.data?.records || []
      if (isLoadMore) allSystemNotifiesData.value = [...allSystemNotifiesData.value, ...newNotifies]
      else allSystemNotifiesData.value = newNotifies
      pagination.value.total = Number(res.data.data?.total || 0)
      unreadSystemNotifiesCount.value = newNotifies.filter(notify => notify.readStatus === 0).length
    }
  } catch (error) {
    if (!isLoadMore) { allSystemNotifiesData.value = []; pagination.value.total = 0 }
  } finally {
    if (!isLoadMore) loading.value = false
  }
}

const handleTabChange = async (tab: string) => {
  activeTab.value = tab
  pagination.value.current = 1
  pagination.value.total = 0

  if (tab === 'comments') await fetchCommentsData()
  else if (tab === 'likes') await fetchLikesData()
  else if (tab === 'shares') await fetchSharesData()
  else if (tab === 'system') await fetchSystemNotifiesData()
}

const loadMore = async () => {
  if (isLoadingMore.value || !hasMore()) return
  isLoadingMore.value = true
  try {
    pagination.value.current += 1
    if (activeTab.value === 'comments') await fetchCommentsData(true)
    else if (activeTab.value === 'likes') await fetchLikesData(true)
    else if (activeTab.value === 'shares') await fetchSharesData(true)
    else if (activeTab.value === 'system') await fetchSystemNotifiesData(true)
  } catch (error: any) {
    pagination.value.current -= 1
    message.error(t('pages.messageCenterPage.errLoadMore') + error.message)
  } finally {
    isLoadingMore.value = false
  }
}

const onPageChange = async (page: number, pageSize: number) => {
  pagination.value.current = page
  pagination.value.pageSize = pageSize
  if (activeTab.value === 'comments') await fetchCommentsData()
  else if (activeTab.value === 'likes') await fetchLikesData()
  else if (activeTab.value === 'shares') await fetchSharesData()
  else if (activeTab.value === 'system') await fetchSystemNotifiesData()
}

const handleScroll = () => {
  if (scrollTimer.value !== null) return
  scrollTimer.value = window.setTimeout(() => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const scrollHeight = document.documentElement.scrollHeight
    const clientHeight = window.innerHeight || document.documentElement.clientHeight

    if (scrollHeight - scrollTop - clientHeight < 30 && !loading.value && !isLoadingMore.value && hasMore()) {
      loadMore()
    }
    if (scrollTimer.value !== null) {
      clearTimeout(scrollTimer.value)
      scrollTimer.value = null
    }
  }, 150)
}

const handleMarkAllRead = async () => {
  if (messageData.value.totalUnread <= 0) return
  try {
    markingRead.value = true
    const res = await markAllAsReadUsingPost()
    if (res.data.code === 0) {
      message.success(t('pages.messageCenterPage.msgAllRead'))
      messageData.value.totalUnread = 0
      messageData.value.unreadComments = 0
      messageData.value.unreadLikes = 0
      messageData.value.unreadShares = 0
      messageData.value.unreadSystemNotifies = 0

      unreadCommentsCount.value = 0
      unreadLikesCount.value = 0
      unreadSharesCount.value = 0
      unreadSystemNotifiesCount.value = 0

      messageCenterStore.updateUnreadMessageData({
        totalUnread: 0, unreadComments: 0, unreadLikes: 0, unreadShares: 0, unreadSystemNotifies: 0
      })
      await handleTabChange(activeTab.value)
      await new Promise(resolve => setTimeout(resolve, 100))
    } else {
      message.error(t('pages.messageCenterPage.errOp'))
    }
  } catch (error) {
    message.error(t('pages.messageCenterPage.errOp'))
  } finally {
    markingRead.value = false
  }
}

const goToHistory = () => router.push('/message/history')

const handleMessageUnreadCountsUpdate = (event: CustomEvent) => {
  const data = event.detail
  if (data) {
    messageData.value.totalUnread = Number(data.totalUnread) || 0
    messageData.value.unreadComments = Number(data.unreadComments) || 0
    messageData.value.unreadLikes = Number(data.unreadLikes) || 0
    messageData.value.unreadShares = Number(data.unreadShares) || 0
    messageData.value.unreadSystemNotifies = Number(data.unreadSystemNotifies) || 0

    unreadCommentsCount.value = Number(data.unreadComments) || 0
    unreadLikesCount.value = Number(data.unreadLikes) || 0
    unreadSharesCount.value = Number(data.unreadShares) || 0
    unreadSystemNotifiesCount.value = Number(data.unreadSystemNotifies) || 0

    messageCenterStore.updateUnreadMessageData({
      totalUnread: Number(data.totalUnread) || 0,
      unreadComments: Number(data.unreadComments) || 0,
      unreadLikes: Number(data.unreadLikes) || 0,
      unreadShares: Number(data.unreadShares) || 0,
      unreadSystemNotifies: Number(data.unreadSystemNotifies) || 0
    })
  }
}

onMounted(async () => {
  device.value = isMobile.value ? 'mobile' : 'pc'
  window.addEventListener('messageUnreadCountsUpdated', handleMessageUnreadCountsUpdate as EventListener)
  window.addEventListener('scroll', handleScroll)
  messageStore.refreshUnreadCount()

  try {
    const res = await getAllUnreadCountUsingGet()
    if (res.data?.code === 0 && res.data.data) {
      const data = res.data.data
      messageData.value = {
        totalUnread: Number(data.totalUnread) || 0,
        unreadComments: Number(data.unreadComments) || 0,
        unreadLikes: Number(data.unreadLikes) || 0,
        unreadShares: Number(data.unreadShares) || 0,
        unreadSystemNotifies: Number(data.unreadSystemNotifies) || 0
      }
      unreadCommentsCount.value = Number(data.unreadComments) || 0
      unreadLikesCount.value = Number(data.unreadLikes) || 0
      unreadSharesCount.value = Number(data.unreadShares) || 0
      unreadSystemNotifiesCount.value = Number(data.unreadSystemNotifies) || 0

      messageCenterStore.updateUnreadMessageData(messageData.value)
    }
  } catch (error) {}

  await new Promise(resolve => setTimeout(resolve, 100))

  if (messageData.value.unreadComments > 0) { activeTab.value = 'comments'; await fetchCommentsData() }
  else if (messageData.value.unreadLikes > 0) { activeTab.value = 'likes'; await fetchLikesData() }
  else if (messageData.value.unreadShares > 0) { activeTab.value = 'shares'; await fetchSharesData() }
  else if (messageData.value.unreadSystemNotifies > 0) { activeTab.value = 'system'; await fetchSystemNotifiesData() }
  else { activeTab.value = 'comments'; await fetchCommentsData() }
})

onUnmounted(() => {
  window.removeEventListener('messageUnreadCountsUpdated', handleMessageUnreadCountsUpdate as EventListener)
  window.removeEventListener('scroll', handleScroll)
  if (scrollTimer.value !== null) clearTimeout(scrollTimer.value)
})
</script>

<style scoped>
/* ===================== 全局容器 ===================== */
.message-center {
  max-width: 1200px; /* 收紧最大宽度，让两边留白更舒适 */
  margin: 0 auto;
  padding: 24px;
  min-height: 100vh;
  background-color: var(--background, #f8fafc); /* 增加默认浅灰底色防错 */
  color: var(--text-primary, #1e293b);
}
.pc-message-center {
  padding-top: 40px;
}

/* ===================== 顶部标题区 ===================== */
.message-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 32px;
}
.header-left {
  display: flex;
  align-items: baseline;
  gap: 16px;
}
.page-title {
  font-size: 28px;
  font-weight: 800;
  margin: 0;
  letter-spacing: -0.5px;
  color: var(--text-primary);
}
.total-unread {
  font-size: 14px;
  color: var(--text-secondary, #64748b);
  background: var(--hover-background, #e2e8f0);
  padding: 4px 14px;
  border-radius: 20px;
  font-weight: 500;
  transition: all 0.3s ease;
}
.total-unread.empty {
  opacity: 0.7;
  background: transparent;
  border: 1px solid var(--border-color, #e2e8f0);
}
.highlight {
  color: var(--like-button-active-color, #ef4444);
  font-weight: 800;
  font-size: 16px;
  margin: 0 4px;
}

.mark-read-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 20px;
  border-radius: 20px;
  background: #ffffff;
  border: 1px solid var(--border-color, #e2e8f0);
  color: var(--text-secondary, #64748b);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
}
.mark-read-btn:hover:not(:disabled) {
  background: var(--hover-background, #f1f5f9);
  color: var(--text-primary, #0f172a);
  border-color: #cbd5e1;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(0,0,0,0.04);
}
.mark-read-btn:active:not(:disabled) {
  transform: translateY(0);
}
.mark-read-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  box-shadow: none;
}

/* ===================== 分类统计区 ===================== */
.stats-cards-wrapper {
  margin-bottom: 32px;
}

/* 核心修复：弃用 flex 和 min-width，改用 CSS Grid 等分 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.stat-card {
  background: var(--card-background, #ffffff);
  border: 2px solid transparent;
  border-radius: 16px;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 100%);
  opacity: 0;
  transition: opacity 0.3s;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.06);
}

.stat-card:active {
  transform: translateY(-1px);
}

.stat-card.active {
  border-color: var(--link-color, #3b82f6);
  background: rgba(59, 130, 246, 0.02);
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.08);
}
.stat-card.active::before {
  opacity: 1;
}

/* 图标与角标 */
.stat-icon-wrapper {
  position: relative;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  transition: transform 0.3s ease;
}

.stat-card:hover .stat-icon-wrapper {
  transform: scale(1.08);
}

.unread-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: var(--like-button-active-color, #ef4444);
  color: #fff;
  font-size: 12px;
  font-weight: 800;
  height: 22px;
  min-width: 22px;
  padding: 0 6px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid var(--card-background, #fff);
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
  z-index: 2;
  animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes popIn {
  0% { transform: scale(0); }
  100% { transform: scale(1); }
}

/* 各模块主题色 - 提高色彩饱和度和明度 */
.comments { background: #eff6ff; color: #3b82f6; }
.likes { background: #fef2f2; color: #ef4444; }
.shares { background: #ecfdf5; color: #10b981; }
.system { background: #f5f3ff; color: #8b5cf6; }

.stat-label {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  z-index: 1;
}

/* ===================== 消息列表区 ===================== */
.message-list-container {
  background: transparent;
  min-height: 400px;
}

/* 统一状态 UI */
.state-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 0;
  color: var(--text-secondary);
  font-size: 14px;
  gap: 12px;
}
.loading-state {
  flex-direction: column;
  padding: 80px 0;
  font-size: 16px;
  color: var(--text-secondary);
}
.loading-state i {
  font-size: 32px;
  margin-bottom: 16px;
  color: var(--link-color, #3b82f6);
}

.no-more {
  opacity: 0.5;
  padding: 40px 0;
}
.divider {
  height: 1px;
  width: 60px;
  background: var(--border-color, #cbd5e1);
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.fade-enter-from {
  opacity: 0;
  transform: translateY(16px);
}
.fade-leave-to {
  opacity: 0;
  transform: translateY(-16px);
}

/* ===================== 移动端极致适配 ===================== */
@media screen and (max-width: 768px) {
  .message-center {
    padding: 16px;
  }

  .message-header {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    width: 100%;
  }

  .header-left {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    width: auto;
  }

  .page-title {
    font-size: 20px;
  }

  .total-unread {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 12px;
  }

  .highlight {
    font-size: 12px;
  }

  .mark-read-btn {
    width: auto;
    justify-content: center;
    height: 30px;
    padding: 0 10px;
    font-size: 12px;
    border-radius: 15px;
    gap: 4px;
  }

  /* 核心修复：移动端依然使用 4等分 Grid，但压榨 padding 和 icon 尺寸确保一行塞下 */
  .stats-cards {
    gap: 8px; /* 减小间距 */
  }

  .stat-card {
    padding: 10px 4px; /* 减少左右内边距，给文字腾空间 */
    border-radius: 12px;
    gap: 6px;
  }

  .stat-icon-wrapper {
    width: 36px;
    height: 36px;
    font-size: 16px;
    border-radius: 10px;
  }

  .unread-badge {
    top: -4px;
    right: -4px;
    height: 18px;
    min-width: 18px;
    font-size: 10px;
    padding: 0 4px;
    border-width: 2px;
  }

  .stat-label {
    font-size: 12px; /* 缩小字号，防止 "评论与回复" 换行 */
    transform-origin: center top;
  }
}

/* 如果是极小屏幕 (比如 iPhone SE 的 320px 宽度) ，稍微缩放字体保证不溢出 */
@media screen and (max-width: 350px) {
  .stat-label {
    font-size: 11px;
    transform: scale(0.95);
  }
  .stat-icon-wrapper {
    width: 38px;
    height: 38px;
    font-size: 16px;
  }
}
</style>
