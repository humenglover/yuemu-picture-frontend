<template>
  <div id="yuemu-chatListPage" class="yuemu-chat-list-page">
    <div class="yuemu-main-content" :class="{ 'pc-mode': device === DEVICE_TYPE_ENUM.PC }">

      <div id="yuemu-chatListHeader" v-if="device !== DEVICE_TYPE_ENUM.PC">

        <div class="yuemu-tabs-container">
          <div class="yuemu-chat-tabs">
            <div class="yuemu-tab-item" :class="{ active: activeTab === 'all' }" @click="handleTabChange('all')">
              <div class="yuemu-icon-wrap">
                <i class="far fa-comment yuemu-icon"></i>
                <Badge v-if="unreadCounts.totalUnread > 0" :count="unreadCounts.totalUnread" :overflowCount="99" class="yuemu-tab-badge" />
              </div>
              <div class="yuemu-tab-text">{{ $t('pages.chatListPage.tabs.chat') }}</div>
            </div>
            <div class="yuemu-tab-item" :class="{ active: activeTab === 'tribe' }" @click="handleTabChange('tribe')">
              <div class="yuemu-icon-wrap"><i class="fas fa-users yuemu-icon"></i></div>
              <div class="yuemu-tab-text">{{ $t('pages.chatListPage.tabs.tribe') }}</div>
            </div>
            <div class="yuemu-tab-item" :class="{ active: activeTab === 'more' }" @click="handleTabChange('more')">
              <div class="yuemu-icon-wrap"><i class="fas fa-compass yuemu-icon"></i></div>
              <div class="yuemu-tab-text">{{ $t('pages.chatListPage.tabs.discover') }}</div>
            </div>
          </div>
        </div>

        <div class="yuemu-search-container" v-show="activeTab === 'all'">
          <div class="yuemu-search-box">
            <i class="fas fa-search yuemu-search-icon"></i>
            <input type="text" v-model="searchText" :placeholder="$t('pages.chatListPage.searchPlaceholder')" @keyup.enter="handleSearch" class="yuemu-search-input" />
          </div>
          <div v-if="unreadCounts.totalUnread > 0" class="yuemu-clear-all-btn" @click.stop="showClearUnreadModal" :title="$t('pages.chatListPage.clearUnread')">
            <i class="fas fa-broom"></i>
          </div>
        </div>
      </div>

      <div class="yuemu-list-wrapper">

        <div :class="['yuemu-tribe-content', 'yuemu-tab-panel', { 'yuemu-tab-panel-active': activeTab === 'tribe' }]" @scroll="handleTribeScroll" ref="tribeListRef">

          <div class="yuemu-section-header">
            <h3 class="yuemu-title">{{ $t('pages.chatListPage.tribe.recommendTitle') }}</h3>
          </div>

          <div v-if="recommendedSpaces.length > 0" class="yuemu-recommended-list">
            <TeamSpaceCard v-for="space in recommendedSpaces" :key="space.id" :space="space" class="yuemu-snap-card" />
          </div>

          <div v-else-if="loadingRecommended" class="yuemu-recommended-list">
            <TeamSpaceCard v-for="i in 3" :key="`rec-skel-${i}`" :is-loading="true" class="yuemu-snap-card" />
          </div>

          <div v-else class="yuemu-empty-state">
            <img src="@/assets/empty.png" class="yuemu-empty-img" alt="empty" />
            <p class="yuemu-empty-text">{{ $t('pages.chatListPage.tribe.noRecommendDesc') }}</p>
          </div>

          <div class="yuemu-section-header">
            <h3 class="yuemu-title">{{ $t('pages.chatListPage.tribe.allTitle') }}</h3>
          </div>

          <div v-if="publicSpacesWithAds.length > 0" class="yuemu-public-spaces-list">
            
            <TeamSpaceCard v-for="space in publicSpacesWithAds" :key="space.isAd ? space.id : `public-${space.id}`" :space="space" />

            <div v-if="publicHasMore" class="yuemu-load-more-container">
              <button class="yuemu-load-btn" @click="loadMorePublicSpaces" :disabled="loadingPublic">
                <i v-if="loadingPublic" class="fas fa-spinner fa-spin"></i>
                <span v-else>{{ $t('pages.chatListPage.status.loadMore') }}</span>
              </button>
            </div>
            <div v-else class="yuemu-list-bottom-tip">
              <div class="yuemu-tip-line"><span class="line"></span><span class="text">{{ $t('pages.chatListPage.status.noMore') }}</span><span class="line"></span></div>
            </div>
          </div>

          <div v-else-if="loadingPublic" class="yuemu-public-spaces-list">
            <TeamSpaceCard v-for="i in 4" :key="`loading-${i}`" :is-loading="true" />
          </div>

          <div v-else-if="isPublicSpacesLoaded && publicSpaces.length === 0" class="yuemu-empty-state">
            <img src="@/assets/empty.png" class="yuemu-empty-img" alt="empty" />
            <h3 class="yuemu-empty-title">{{ $t('pages.chatListPage.tribe.noPublicDesc') }}</h3>
            <p class="yuemu-empty-text">{{ $t('pages.chatListPage.tribe.noPublicSubDesc') }}</p>
          </div>
        </div>

        <div :class="['yuemu-more-content', 'yuemu-tab-panel', { 'yuemu-tab-panel-active': activeTab === 'more' }]" ref="moreListRef">
          <div class="yuemu-discovery-actions">
            <div class="yuemu-action-card bg-image-card" :style="{ backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.5)), url(${treeHoleImg})` }" @click="$router.push({ name: 'Barrage' })">
              <div class="yuemu-action-label">{{ $t('pages.chatListPage.discover.treeHole') }}</div>
              <div class="yuemu-action-desc">{{ $t('pages.chatListPage.discover.treeHoleDesc') }}</div>
            </div>
            <div class="yuemu-action-card bg-image-card" :style="{ backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.5)), url(${friendLinkImg})` }" @click="$router.push({ name: 'FriendLinks' })">
              <div class="yuemu-action-label">{{ $t('pages.chatListPage.discover.friendLink') }}</div>
              <div class="yuemu-action-desc">{{ $t('pages.chatListPage.discover.friendLinkDesc') }}</div>
            </div>
            <div class="yuemu-action-card bg-image-card" :style="{ backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.5)), url(${loveImg})` }" @click="$router.push({ name: 'LoveBoardList' })">
              <div class="yuemu-action-label">{{ $t('pages.chatListPage.discover.loveSquare') }}</div>
              <div class="yuemu-action-desc">{{ $t('pages.chatListPage.discover.loveSquareDesc') }}</div>
            </div>
            <div class="yuemu-action-card bg-image-card" :style="{ backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.5)), url(${toolsImg})` }" @click="$router.push({ name: 'Tools' })">
              <div class="yuemu-action-label">{{ $t('pages.chatListPage.discover.tools') }}</div>
              <div class="yuemu-action-desc">{{ $t('pages.chatListPage.discover.toolsDesc') }}</div>
            </div>
            <div class="yuemu-action-card bg-image-card" :style="{ backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.5)), url(${gamesImg})` }" @click="$router.push({ name: 'Games' })">
              <div class="yuemu-action-label">{{ $t('pages.chatListPage.discover.games') }}</div>
              <div class="yuemu-action-desc">{{ $t('pages.chatListPage.discover.gamesDesc') }}</div>
            </div>
            <div class="yuemu-action-card" style="position: relative; padding: 0; display: flex; align-items: center; justify-content: center; overflow: hidden; background: var(--card-background);" v-if="$enableAds">
              <GlobalAdBanner margin="0" :fillHeight="true" style="width: 100%; height: 100%;" />
            </div>
          </div>
        </div>

        <div :class="['yuemu-chat-tab-container', 'yuemu-tab-panel', { 'yuemu-tab-panel-active': activeTab === 'all' }]">

          <div v-if="!loading && filteredChatList.length === 0" class="yuemu-empty-state full-page">
            <img src="@/assets/empty.png" class="yuemu-empty-img" alt="empty" />
            <h3 class="yuemu-empty-title">{{ getEmptyText() }}</h3>
            <p class="yuemu-empty-text" v-if="searchText">{{ $t('pages.chatListPage.status.noResult') }}</p>
            <p class="yuemu-empty-text" v-if="!loginUserStore.loginUser?.id">{{ $t('pages.chatListPage.status.pleaseLogin') }}</p>
          </div>

          <div v-else class="yuemu-chat-list" @scroll="handleListScroll" ref="mobileListRef">

            <div v-if="loading && filteredChatList.length === 0" class="yuemu-skeleton-list">
              <div class="yuemu-skeleton-item" v-for="i in 8" :key="`skeleton-${i}`">
                <div class="yuemu-skeleton-avatar yuemu-skeleton-anim"></div>
                <div class="yuemu-skeleton-content">
                  <div class="yuemu-skeleton-line name yuemu-skeleton-anim"></div>
                  <div class="yuemu-skeleton-line message yuemu-skeleton-anim"></div>
                </div>
              </div>
            </div>

            <div class="yuemu-native-list-group" v-else>
              <div
                v-for="item in filteredChatList"
                :key="item.id"
                class="yuemu-chat-item-wrapper"
                :class="{ 'actions-visible': item.showActions }"
              >
                <div
                  class="yuemu-chat-item"
                  @click="handleChatClick(item)"
                  @touchstart="handleTouchStart($event, item)"
                  @touchmove="handleTouchMove($event, item)"
                  @touchend="handleTouchEnd(item)"
                >
                  <div class="yuemu-chat-avatar">
                    <div class="yuemu-thumb-placeholder yuemu-skeleton-anim" v-show="!loadedAvatars[item.id]"></div>
                    <img
                      :src="item.targetUser?.userAvatar || getDefaultAvatar(item.targetUser?.userName)"
                      class="yuemu-real-img"
                      :class="{ 'is-loaded': loadedAvatars[item.id] }"
                      @load="onAvatarLoad(item.id)"
                    />
                    <span v-if="getUnreadCount(item) > 0" class="yuemu-unread-badge">
                      {{ getUnreadCount(item) > 99 ? '99+' : getUnreadCount(item) }}
                    </span>
                  </div>

                  <div class="yuemu-chat-content">
                    <div class="yuemu-chat-header">
                      <div class="yuemu-chat-name">
                        <span class="yuemu-name-text">{{ item.isSender ? item.userChatName : item.targetUserChatName }}</span>
                        <div class="yuemu-chat-tags">
                          <span v-if="item.chatType === 3" class="yuemu-tag all-group-tag">{{ $t('pages.chatListPage.tags.allGroup') }}</span>
                          <span v-else-if="item.chatType === 2" class="yuemu-tag ai-tag">AI</span>
                          <span v-else-if="item.chatType === 1" class="yuemu-tag friend-tag">{{ $t('pages.chatListPage.tags.mutual') }}</span>
                          <span v-else class="yuemu-tag group-tag">{{ $t('pages.chatListPage.tags.private') }}</span>
                        </div>
                      </div>
                      <div class="yuemu-chat-time">{{ formatMessageTime(item.lastMessageTime) }}</div>
                    </div>
                    <div class="yuemu-chat-message-row">
                      <span v-if="item.isSender" class="yuemu-sender-prefix">[{{ $t('pages.chatListPage.tags.me') }}]</span>
                      <span class="yuemu-chat-message" :class="{ 'is-unread': getUnreadCount(item) > 0 }">
                        {{ item.lastMessage || $t('pages.chatListPage.status.noMessage') }}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="yuemu-slide-actions" v-if="String(item.id) !== '-1' && String(item.id) !== '-2'">
                  <button class="yuemu-action-btn edit" @click.stop="showEditNameModal(item)"><i class="fas fa-pen"></i></button>
                  <button class="yuemu-action-btn delete" @click.stop="showDeleteConfirm(item)"><i class="fas fa-trash-alt"></i></button>
                </div>
              </div>
            </div>

            <div v-if="isLoadingMore" class="yuemu-loading-more">
              <i class="fas fa-spinner fa-spin yuemu-loading-icon"></i>
              <span>{{ $t('pages.chatListPage.status.loading') }}</span>
            </div>

            <div v-if="!loading && !isLoadingMore && filteredChatList.length > 0" class="yuemu-list-bottom-tip">
              <div class="yuemu-tip-line"><span class="line"></span><span class="text">{{ $t('pages.chatListPage.status.noMore') }}</span><span class="line"></span></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Transition name="yuemu-modal-fade">
      <div v-if="deleteConfirmVisible" class="yuemu-modal-overlay" @click="deleteConfirmVisible = false">
        <div class="yuemu-modal" @click.stop>
          <div class="yuemu-modal-icon danger"><i class="fas fa-exclamation-triangle"></i></div>
          <h3 class="yuemu-modal-title">{{ $t('pages.chatListPage.modals.deleteTitle') }}</h3>
          <p class="yuemu-modal-desc">{{ $t('pages.chatListPage.modals.deleteConfirmPre') }} <strong>{{ selectedChat?.targetUser?.userName || t('pages.chatListPage.modals.notSet') }}</strong> {{ $t('pages.chatListPage.modals.deleteConfirmPost') }}</p>
          <div class="yuemu-modal-actions">
            <button class="yuemu-btn-cancel" @click="deleteConfirmVisible = false">{{ $t('pages.chatListPage.modals.cancel') }}</button>
            <button class="yuemu-btn-confirm danger" @click="confirmDelete">{{ $t('pages.chatListPage.modals.delete') }}</button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="yuemu-modal-fade">
      <div v-if="editNameVisible" class="yuemu-modal-overlay" @click="editNameVisible = false">
        <div class="yuemu-modal" @click.stop>
          <div class="yuemu-modal-icon primary"><i class="fas fa-pen"></i></div>
          <h3 class="yuemu-modal-title">{{ $t('pages.chatListPage.modals.editRemark') }}</h3>
          <div class="yuemu-input-wrap">
            <input v-model="newChatName" type="text" :placeholder="$t('pages.chatListPage.modals.remarkPlaceholder')" maxlength="50" class="yuemu-modal-input" />
            <span class="yuemu-char-count">{{ newChatName.length }}/50</span>
          </div>
          <div class="yuemu-modal-actions">
            <button class="yuemu-btn-cancel" @click="editNameVisible = false">{{ $t('pages.chatListPage.modals.cancel') }}</button>
            <button class="yuemu-btn-confirm" :disabled="editNameLoading" @click="handleEditNameConfirm">
              {{ editNameLoading ? $t('pages.chatListPage.modals.saving') : $t('pages.chatListPage.modals.save') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="yuemu-modal-fade">
      <div v-if="clearUnreadVisible" class="yuemu-modal-overlay" @click="clearUnreadVisible = false">
        <div class="yuemu-modal" @click.stop>
          <div class="yuemu-modal-icon primary"><i class="fas fa-broom"></i></div>
          <h3 class="yuemu-modal-title">{{ $t('pages.chatListPage.modals.clearTitle') }}</h3>
          <p class="yuemu-modal-desc">{{ $t('pages.chatListPage.modals.clearConfirmPre') }} <strong>{{ unreadCounts.totalUnread }}</strong> {{ $t('pages.chatListPage.modals.clearConfirmPost') }}</p>
          <div class="yuemu-modal-actions">
            <button class="yuemu-btn-cancel" @click="clearUnreadVisible = false">{{ $t('pages.chatListPage.modals.cancel') }}</button>
            <button class="yuemu-btn-confirm" :disabled="clearUnreadLoading" @click="confirmClearUnread">
              {{ clearUnreadLoading ? $t('pages.chatListPage.modals.clearing') : $t('pages.chatListPage.modals.confirmClear') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import loveImg from '@/assets/images/love.png';
import friendLinkImg from '@/assets/images/friend-link.png';
import treeHoleImg from '@/assets/images/tree-hole.png';
import toolsImg from '@/assets/images/tools.png';
import gamesImg from '@/assets/images/games.png';

const { t } = useI18n();

import { ref, onMounted, computed, watch, reactive, onBeforeUnmount, nextTick, onActivated, onDeactivated, inject } from 'vue'
import { useRouter } from 'vue-router'
import { message, notification, Badge } from 'ant-design-vue'
import { clearUnreadCountUsingPost, deletePrivateChatUsingPost, updateChatNameUsingPost } from '@/api/privateChatController'
import TeamSpaceCard from '@/components/TeamSpaceCard.vue'
import GlobalAdBanner from '@/components/GlobalAdBanner.vue'
import { listSpaceVoByPageUsingPost, listRecommendedSpacesUsingGet } from '@/api/spaceController'
import { formatMessageTime } from "@/utils/dateUtils"
import { getDefaultAvatar } from '@/utils/userUtils'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import { useChatListStore } from '@/stores/useChatListStore'
import { DEVICE_TYPE_ENUM } from '@/constants/device'
import { getDeviceType } from '@/utils/device'
import { chatListWebSocket } from '@/utils/chatListWebSocket'
import { debounce } from 'lodash-es'
import PrivateChat = API.PrivateChat

const device = ref<string>('')
const isMobile = computed(() => window.innerWidth <= 768)

const loading = ref(false)
const isTop = ref(true)
const searchText = ref('')
const activeTab = ref('all')
const chatList = ref<PrivateChat[]>([])
const selectedChat = ref<PrivateChat | null>(null)
const deleteConfirmVisible = ref(false)
const editNameVisible = ref(false)
const editNameLoading = ref(false)
const newChatName = ref('')
const hasMore = ref(true)
const total = ref(0)
const clearUnreadVisible = ref(false)
const clearUnreadLoading = ref(false)

const chatListStore = useChatListStore()

const loadedAvatars = computed(() => chatListStore.loadedAvatars);
const onAvatarLoad = (id: string | number) => { chatListStore.loadedAvatars[String(id)] = true; };

const unreadCounts = computed(() => chatListWebSocket.unreadCounts.value)

const mobileCurrentPage = ref(1)
const isLoadingMore = ref(false)

const touchStartX = ref(0)
const touchStartY = ref(0)
const minSwipeDistance = 50
const maxSwipeTime = 300
const touchStartTime = ref(0)

const handleTouchStart = (e: TouchEvent, item: any) => {
  touchStartX.value = e.touches[0].clientX
  touchStartY.value = e.touches[0].clientY
  touchStartTime.value = Date.now()
  chatList.value.forEach(chat => { if (chat !== item) chat.showActions = false })
}

const handleTouchMove = (e: TouchEvent, item: any) => {
  if (!touchStartX.value) return
  const touchX = e.touches[0].clientX
  const touchY = e.touches[0].clientY
  const deltaX = touchStartX.value - touchX
  const deltaY = Math.abs(touchY - touchStartY.value)

  if (deltaY > Math.abs(deltaX) / 2) return
  e.preventDefault()

  const maxSlideDistance = 100
  Math.min(Math.max(deltaX, 0), maxSlideDistance)

  if (item.showActions && deltaX < 0) {
    item.showActions = false
  } else if (!item.showActions && deltaX > minSwipeDistance) {
    if (String(item.id) !== '-1' && String(item.id) !== '-2') item.showActions = true
  }
}

const handleTouchEnd = (item: any) => {
  const touchDuration = Date.now() - touchStartTime.value
  touchStartX.value = 0; touchStartY.value = 0
  if (touchDuration > maxSwipeTime) item.showActions = false
}

const getUnreadCount = (chat: any) => Number(chat.userUnreadCount) || Number(chat.unreadCount) || 0

const filteredChatList = computed(() => {
  if (!loginUserStore.loginUser || !loginUserStore.loginUser.id) return []
  let specialChats = [publicGroupChat]
  let filtered = chatList.value.filter(chat => chat.id !== '-1' && chat.id !== '-2')

  if (searchText.value) {
    const searchLower = searchText.value.toLowerCase()
    filtered = filtered.filter(chat => {
      const targetName = chat.targetUser?.userName?.toLowerCase() || ''
      const chatName = (chat.isSender ? chat.userChatName : chat.targetUserChatName)?.toLowerCase() || ''
      const lastMessage = chat.lastMessage?.toLowerCase() || ''
      return targetName.includes(searchLower) || chatName.includes(searchLower) || lastMessage.includes(searchLower)
    })
    specialChats = specialChats.filter(chat => {
      const name = chat.targetUser?.userName?.toLowerCase() || ''
      const message = chat.lastMessage?.toLowerCase() || ''
      return name.includes(searchLower) || message.includes(searchLower)
    })
  }

  filtered.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime())
  return [...specialChats, ...filtered]
})

const mobileListRef = ref<HTMLElement | null>(null)
const pcListRef = ref<HTMLElement | null>(null)
const tribeListRef = ref<HTMLElement | null>(null)

onMounted(async () => {
  device.value = await getDeviceType()
  document.addEventListener('click', handleClickOutside)

  if (loginUserStore.loginUser?.id) {
    await chatListWebSocket.connect(loginUserStore.loginUser.id)

    chatListWebSocket.on('message', (data: any) => {
      if (!data) return
      loading.value = false; isLoadingMore.value = false

      if (data.type === 'CHAT_LIST') {
        const records = (data.records || []).map((record: any) => ({
          ...record, id: String(record.id), userId: String(record.userId), targetUserId: String(record.targetUserId)
        }))
        const totalCount = parseInt(data.total) || 0

        if (device.value === DEVICE_TYPE_ENUM.PC) {
          chatList.value = records.filter((chat: any) => chat.id !== '-1' && chat.id !== '-2')
        } else {
          if (mobileCurrentPage.value === 1) {
            chatList.value = records.filter((chat: any) => chat.id !== '-1' && chat.id !== '-2')
          } else {
            const newRecords = records.filter((record: any) =>
              record.id !== '-1' && record.id !== '-2' && !chatList.value.some(chat => String(chat.id) === String(record.id))
            )
            chatList.value = [...chatList.value, ...newRecords]
          }
        }
        total.value = filteredChatList.value.length
        hasMore.value = (mobileCurrentPage.value * 20) < totalCount
      } else if (data.type === 'UPDATE_LIST') {
        mobileCurrentPage.value = 1
        chatListWebSocket.sendMessage({
          type: 'REQUEST_LIST', data: { searchText: searchText.value, current: 1, pageSize: 20, chatType: undefined }
        })
      } else if (data.type === 'DELETE') {
        const deletedChatId = data.data?.id
        if (deletedChatId) chatList.value = chatList.value.filter(chat => chat.id !== deletedChatId && String(chat.id) !== '-1' && String(chat.id) !== '-2')
      } else if (data.type === 'NEW') {
        const newChat = data.data
        if (newChat && !chatList.value.some(chat => chat.id === newChat.id)) {
          chatList.value = [...chatList.value.filter(chat => String(chat.id) !== '-1' && String(chat.id) !== '-2'), newChat]
          total.value = chatList.value.length + 2
        }
      }
    })

    chatListWebSocket.sendMessage({ type: 'REQUEST_UNREAD_COUNTS' })
    chatListWebSocket.on('error', () => { loading.value = false; isLoadingMore.value = false })

    if (device.value === DEVICE_TYPE_ENUM.PC) {
      chatListWebSocket.sendMessage({ type: 'REQUEST_LIST', data: { searchText: searchText.value, current: pcsearchParams.current, pageSize: pcsearchParams.pageSize, chatType: undefined }})
    } else {
      chatListWebSocket.sendMessage({ type: 'REQUEST_LIST', data: { searchText: searchText.value, current: mobileCurrentPage.value, pageSize: 20, chatType: undefined }})
    }
  }
})

onMounted(async () => {
  device.value = await getDeviceType()
  if (chatListStore.chatListData.length > 0 && chatListStore.userId === loginUserStore.loginUser?.id) {
    chatList.value = chatListStore.chatListData
    activeTab.value = chatListStore.currentTab
    searchText.value = chatListStore.searchText
    if (device.value === DEVICE_TYPE_ENUM.PC) pcsearchParams.current = chatListStore.currentPage
    else mobileCurrentPage.value = chatListStore.currentPage

    await nextTick()
    if (device.value === DEVICE_TYPE_ENUM.PC && pcListRef.value) pcListRef.value.scrollTop = chatListStore.scrollPosition
    else if (mobileListRef.value) mobileListRef.value.scrollTop = chatListStore.scrollPosition

    recommendedSpaces.value = chatListStore.recommendedSpaces || []
    publicSpaces.value = chatListStore.publicSpaces || []
    publicCurrentPage.value = chatListStore.publicCurrentPage || 1
    publicHasMore.value = chatListStore.publicHasMore ?? true
    if (publicSpaces.value.length > 0) {
      isPublicSpacesLoaded.value = true
    }

    if (activeTab.value === 'tribe') {
      if (recommendedSpaces.value.length === 0 && !loadingRecommended.value) goToTribes()
      if (!isPublicSpacesLoaded.value && !loadingPublic.value) getPublicSpaces(true)
    }
  } else {
    await (isMobile.value ? fetchChatList(true) : pcfetchChatList(true))
  }
})

onActivated(async () => {
  await nextTick()
  if (device.value === DEVICE_TYPE_ENUM.PC && pcListRef.value) {
    pcListRef.value.scrollTop = chatListStore.scrollPosition
  } else if (mobileListRef.value) {
    mobileListRef.value.scrollTop = chatListStore.scrollPosition
  }
})

onDeactivated(() => {
  if (device.value === DEVICE_TYPE_ENUM.PC && pcListRef.value) {
    chatListStore.updateScrollPosition(pcListRef.value.scrollTop)
  } else if (mobileListRef.value) {
    chatListStore.updateScrollPosition(mobileListRef.value.scrollTop)
  }
})

onBeforeUnmount(() => {
  chatListStore.updateUserId(loginUserStore.loginUser?.id)
  if (device.value === DEVICE_TYPE_ENUM.PC && pcListRef.value) chatListStore.updateScrollPosition(pcListRef.value.scrollTop)
  else if (mobileListRef.value) chatListStore.updateScrollPosition(mobileListRef.value.scrollTop)

  chatListStore.updateCurrentPage(device.value === DEVICE_TYPE_ENUM.PC ? pcsearchParams.current : mobileCurrentPage.value)
  chatListStore.updateChatListData(chatList.value)
  chatListStore.updateCurrentTab(activeTab.value)
  chatListStore.updateSearchText(searchText.value)
  chatListStore.updateTribeData(recommendedSpaces.value, publicSpaces.value, publicCurrentPage.value, publicHasMore.value)
  document.removeEventListener('click', handleClickOutside)
})



watch(searchText, () => chatListStore.clearAll())

const loginUserStore = useLoginUserStore()
const router = useRouter()

const recommendedSpaces = ref<API.SpaceVO[]>([])
const loadingRecommended = ref(false)
const publicSpaces = ref<API.SpaceVO[]>([])
const loadingPublic = ref(false)
const publicCurrentPage = ref(1)
const publicHasMore = ref(true)
const publicTotal = ref(0)
const isPublicSpacesLoaded = ref(false)
const enableAds = inject('enableAds', true)

const publicSpacesWithAds = computed(() => {
  const result: any[] = []
  for (let i = 0; i < publicSpaces.value.length; i++) {
    result.push(publicSpaces.value[i])
    // 在第 4 个空间后插入一个广告，之后每隔 10 个插入一个广告
    if (enableAds && (i === 3 || (i > 3 && (i - 3) % 10 === 0))) {
      result.push({ id: `ad-space-${i}`, isAd: true })
    }
  }
  return result
})

const moreListRef = ref<HTMLElement | null>(null)

const handleTabChange = async (tab: string) => {
  activeTab.value = tab
  if (tab === 'tribe') {
    if (recommendedSpaces.value.length === 0 && !loadingRecommended.value) goToTribes()
    if (!isPublicSpacesLoaded.value && !loadingPublic.value) getPublicSpaces(true)
  }
}

const pcsearchParams = reactive({ current: 1, pageSize: 6, searchText: '', chatType: undefined })

const publicGroupChat: any = reactive({
  id: '-2',
  targetUser: { id: -2, userName: t('pages.chatListPage.defaults.globalGroupTitle'), userAvatar: new URL('@/assets/images/all.png', import.meta.url).href, userAccount: 'public_group', createTime: new Date().toISOString() },
  chatType: 3, lastMessage: t('pages.chatListPage.defaults.globalGroupDesc'), lastMessageTime: new Date().toISOString(), targetUserChatName: t('pages.chatListPage.defaults.globalGroupTitle'), isSender: false, userUnreadCount: 0
})

const fetchChatList = async (isRefresh = false) => {
  if (loading.value) return
  try {
    loading.value = true
    if (isRefresh) { chatList.value = []; if (device.value !== DEVICE_TYPE_ENUM.PC) mobileCurrentPage.value = 1 }
    chatListWebSocket.sendMessage({
      type: 'REQUEST_LIST',
      data: { searchText: searchText.value, current: device.value === DEVICE_TYPE_ENUM.PC ? pcsearchParams.current : mobileCurrentPage.value, pageSize: device.value === DEVICE_TYPE_ENUM.PC ? pcsearchParams.pageSize : 20, chatType: undefined }
    })
  } finally { loading.value = false; isLoadingMore.value = false }
}

const pcfetchChatList = async (isRefresh = false) => {
  if (loading.value) return
  try {
    loading.value = true
    if (isRefresh) chatList.value = []
    chatListWebSocket.sendMessage({
      type: 'CHAT_LIST',
      data: { searchText: searchText.value, current: pcsearchParams.current, pageSize: pcsearchParams.pageSize, chatType: undefined }
    })
  } finally { loading.value = false }
}

const handleListScroll = debounce(async (e: Event) => {
  if (device.value === DEVICE_TYPE_ENUM.PC) return
  const target = e.target as HTMLElement
  const { scrollHeight, scrollTop, clientHeight } = target
  isTop.value = scrollTop <= 0
  chatListStore.updateScrollPosition(scrollTop)

  if (!loading.value && !isLoadingMore.value && mobileCurrentPage.value * 20 < total.value && scrollHeight - scrollTop - clientHeight <= 50) {
    isLoadingMore.value = true
    mobileCurrentPage.value++
    chatListWebSocket.sendMessage({
      type: 'REQUEST_LIST',
      data: { current: mobileCurrentPage.value, pageSize: 20, searchText: searchText.value, chatType: undefined }
    })
  }
}, 200)

const handleTribeScroll = debounce(async (e: Event) => {
  if (device.value === DEVICE_TYPE_ENUM.PC) return
  const target = e.target as HTMLElement
  const { scrollHeight, scrollTop, clientHeight } = target
  if (activeTab.value === 'tribe' && !loadingPublic.value && publicHasMore.value && scrollHeight - scrollTop - clientHeight <= 50) await loadMorePublicSpaces()
}, 200)

const handleSearch = () => { fetchChatList(true); pcfetchChatList(true) }

const handleChatClick = async (chat: PrivateChat) => {
  if (String(chat.id) === '-2') {
    router.push({
      name: 'PrivateChat',
      params: { userId: String(chat.targetUser?.id) },
      query: { privateChatId: String(chat.id), userName: chat.targetUserChatName, userAvatar: chat.targetUser?.userAvatar, userAccount: chat.targetUser?.userAccount, createTime: String(chat.targetUser?.createTime), spaceId: '-2', type: 'group' }
    })
  } else if (chat.targetUser) {
    try { await clearUnreadCountUsingPost({ targetUserId: String(chat.targetUser.id), isSender: chat.isSender }); chat.userUnreadCount = 0 } catch (error) {}
    router.push({
      name: 'PrivateChat',
      params: { userId: String(chat.targetUser.id) },
      query: { privateChatId: String(chat.id), userName: chat.isSender ? chat.userChatName : chat.targetUserChatName, userAvatar: chat.targetUser.userAvatar, userAccount: chat.targetUser.userAccount, createTime: String(chat.targetUser.createTime), isSender: String(chat.isSender) }
    })
  }
}

const showDeleteConfirm = (chat: PrivateChat) => { selectedChat.value = chat; deleteConfirmVisible.value = true }
const confirmDelete = async () => {
  if (!selectedChat.value?.id) return
  try {
    const res = await deletePrivateChatUsingPost({ privateChatId: selectedChat.value.id })
    if (res.data.code === 0) {
      message.success(t('pages.chatListPage.messages.deleteSuccess')); deleteConfirmVisible.value = false
      chatList.value = chatList.value.filter(item => item.id !== selectedChat.value?.id)
      chatListWebSocket.sendMessage({ type: 'DELETE', data: { id: selectedChat.value.id } })
    }
  } catch (error) {}
}

const showEditNameModal = (chat: PrivateChat) => { selectedChat.value = chat; newChatName.value = chat.userChatName || ''; editNameVisible.value = true }
const handleEditNameConfirm = async () => {
  if (!selectedChat.value?.id || !newChatName.value.trim()) return
  try {
    editNameLoading.value = true
    const res = await updateChatNameUsingPost({ privateChatId: selectedChat.value.id, chatName: newChatName.value.trim() })
    if (res.data.code === 0) {
      message.success(t('pages.chatListPage.messages.editSuccess'))
      const chat = chatList.value.find(item => item.id === selectedChat.value?.id)
      if (chat) { chat.userChatName = newChatName.value.trim(); chatListWebSocket.sendMessage({ type: 'UPDATE', data: chat }) }
      editNameVisible.value = false
    }
  } finally { editNameLoading.value = false }
}

const getEmptyText = () => {
  if (searchText.value) return t('pages.chatListPage.messages.noRelatedChats')
  return activeTab.value === 'friend' ? t('pages.chatListPage.status.noFriends') : (activeTab.value === 'private' ? t('pages.chatListPage.status.noPrivate') : t('pages.chatListPage.status.noChats'))
}

const handleClickOutside = () => { chatList.value.forEach(chat => { if (chat.showActions) chat.showActions = false }) }
const showClearUnreadModal = () => { clearUnreadVisible.value = true }
const confirmClearUnread = async () => {
  try { clearUnreadLoading.value = true; chatListWebSocket.sendMessage({ type: 'CLEAR_ALL_UNREAD' }) }
  finally { clearUnreadLoading.value = false; clearUnreadVisible.value = false }
}

const goToTribes = async () => {
  try {
    loadingRecommended.value = true; const res = await listRecommendedSpacesUsingGet();
    if (res.data.code === 0 && res.data.data) recommendedSpaces.value = res.data.data;
    else recommendedSpaces.value = [];
  } catch (error) { recommendedSpaces.value = []; } finally { loadingRecommended.value = false; }
}

const getPublicSpaces = async (isRefresh = false) => {
  if (loadingPublic.value) return;
  try {
    if (isRefresh) { publicCurrentPage.value = 1; loadingPublic.value = true; }
    const res = await listSpaceVoByPageUsingPost({ current: publicCurrentPage.value, pageSize: 10, spaceType: 1 });
    if (res.data.code === 0 && res.data.data) {
      const { records, total, hasMore } = res.data.data;
      if (isRefresh || publicCurrentPage.value === 1) publicSpaces.value = records || [];
      else publicSpaces.value = [...publicSpaces.value, ...(records || [])];
      publicTotal.value = total || 0; publicHasMore.value = hasMore !== false;
      publicHasMore.value = publicCurrentPage.value < Math.ceil(publicTotal.value / 10);
      isPublicSpacesLoaded.value = true;
    } else {
      if (isRefresh || publicCurrentPage.value === 1) publicSpaces.value = [];
      publicHasMore.value = false;
    }
  } catch (error) {
    if (isRefresh || publicCurrentPage.value === 1) publicSpaces.value = [];
    publicHasMore.value = false;
  } finally { loadingPublic.value = false; }
};

const loadMorePublicSpaces = async () => {
  if (loadingPublic.value || !publicHasMore.value) return;
  publicCurrentPage.value++; await getPublicSpaces(false);
};
</script>

<style lang="scss" scoped>
/* =========================================
   yuemu- 全局与基础布局 (SaaS Modern)
   ========================================= */
* { box-sizing: border-box; }

.yuemu-chat-list-page {
  max-height: 100vh; position: relative; overflow: hidden;
  background: var(--background, #f5f5f7);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, sans-serif;
  color: var(--text-primary);
}

.yuemu-main-content {
  position: relative; z-index: 1; max-width: 800px; margin: 0 auto;
  height: 100vh; display: flex; flex-direction: column;
}

.pc-mode {
  height: calc(100vh - 120px) !important; margin-top: 20px;
  border-radius: 24px; box-shadow: 0 20px 60px rgba(0,0,0,0.08); overflow: hidden;
  background: var(--card-background, #fff); border: 1px solid var(--border-color);
}

/* =========================================
   顶部 Header & 灵动标签栏
   ========================================= */
#yuemu-chatListHeader {
  padding: 12px 16px 4px;
}

.yuemu-tabs-container { display: flex; justify-content: center; margin-bottom: 6px; }

.yuemu-chat-tabs {
  display: inline-flex; background: var(--hover-background, #f1f5f9);
  padding: 4px; border-radius: 24px; gap: 4px;

  .yuemu-tab-item {
    display: flex; align-items: center; gap: 6px; padding: 8px 20px; border-radius: 20px;
    cursor: pointer; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); color: var(--text-secondary, #64748b);

    .yuemu-icon-wrap { font-size: 16px; position: relative; }
    .yuemu-tab-text { font-size: 14px; font-weight: 600; }

    &.active {
      background: var(--card-background, #ffffff);
      color: var(--text-primary);
      font-weight: 700;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    &:active { transform: scale(0.96); }

    .yuemu-tab-badge {
      position: absolute; top: -8px; right: -8px; transform: scale(0.8);
      :deep(.ant-badge-count) { background: #ef4444; box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3); border: 2px solid var(--card-background, #fff); }
    }
  }
}

/* =========================================
   搜索栏
   ========================================= */
.yuemu-search-container {
  display: flex; align-items: center; gap: 12px;

  .yuemu-search-box {
    flex: 1; display: flex; align-items: center; background: var(--hover-background, #f1f5f9);
    height: 40px; border-radius: 20px; padding: 0 16px; gap: 8px; border: 1px solid transparent; transition: all 0.3s ease;

    &:focus-within { background: var(--card-background, #ffffff); border-color: rgba(37, 99, 235, 0.3); box-shadow: 0 4px 12px rgba(37, 99, 235, 0.08); }
    .yuemu-search-icon { color: #94a3b8; font-size: 14px; }
    &:focus-within .yuemu-search-icon { color: #2563eb; }

    .yuemu-search-input { flex: 1; border: none; background: transparent; outline: none; font-size: 15px; color: var(--text-primary); &::placeholder { color: #94a3b8; } }
  }

  .yuemu-clear-all-btn {
    width: 40px; height: 40px; border-radius: 20px; background: var(--hover-background, #f1f5f9); color: #2563eb;
    display: flex; align-items: center; justify-content: center; font-size: 16px; cursor: pointer; transition: all 0.2s ease;
    &:hover { background: #eff6ff; transform: rotate(15deg); }
    &:active { transform: scale(0.9); }
  }
}

/* =========================================
   内容区域容器
   ========================================= */
.yuemu-list-wrapper { flex: 1; overflow: hidden; position: relative; }
.yuemu-tab-panel {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  visibility: hidden; opacity: 0; pointer-events: none; z-index: 1;
}
.yuemu-tab-panel.yuemu-tab-panel-active {
  visibility: visible; opacity: 1; pointer-events: auto; z-index: 10;
}
.yuemu-chat-tab-container { height: 100%; }

/* =========================================
   无缝无极原生聊天列表 (Edge-to-Edge List)
   ========================================= */
.yuemu-chat-list {
  height: 100%; overflow-y: auto; padding: 0 0 100px 0; background: var(--background, #f8fafc);
  &::-webkit-scrollbar { display: none; }
}

@media screen and (min-width: 769px) {
  .yuemu-chat-list { padding: 12px 16px 100px; background: transparent; }
  .yuemu-chat-item-wrapper { margin-bottom: 8px !important; border-radius: 16px !important; border: 1px solid var(--border-color); }
}

.yuemu-native-list-group { display: flex; flex-direction: column; }

.yuemu-chat-item-wrapper {
  position: relative; width: 100%; background: var(--card-background, #ffffff);
  transition: background-color 0.2s ease; overflow: hidden; margin-bottom: 0; border-radius: 0;

  .yuemu-slide-actions {
    position: absolute; right: 0; top: 0; height: 100%; display: flex; align-items: center; padding: 0 16px; gap: 12px;
    background: var(--hover-background, #f1f5f9); transform: translateX(100%); transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);

    .yuemu-action-btn {
      width: 48px; height: 48px; border-radius: 50%; border: none; color: white; font-size: 16px;
      display: flex; align-items: center; justify-content: center; transition: transform 0.2s;
      &:active { transform: scale(0.9); }
      &.edit { background: #10b981; }
      &.delete { background: #ef4444; }
    }
  }

  &.actions-visible {
    .yuemu-chat-item { transform: translateX(-140px); }
    .yuemu-slide-actions { transform: translateX(0); }
  }
}

.yuemu-chat-item {
  display: flex; align-items: center; padding: 16px 20px; gap: 14px; background: transparent;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.2s; cursor: pointer;

  &:active { background-color: var(--hover-background, #f1f5f9); }

  .yuemu-chat-avatar {
    position: relative; flex-shrink: 0;

    .yuemu-thumb-placeholder { position: absolute; inset: 0; border-radius: 50%; z-index: 1; }

    .yuemu-real-img {
      width: 52px; height: 52px; border-radius: 50%; object-fit: cover;
      background: var(--hover-background, #e2e8f0); opacity: 0; transition: opacity 0.3s ease; position: relative; z-index: 2;
    }
    .yuemu-real-img.is-loaded { opacity: 1; }

    .yuemu-unread-badge {
      position: absolute; top: -2px; right: -2px; background: #ef4444; color: #fff;
      font-size: 11px; font-weight: 800; height: 18px; min-width: 18px; padding: 0 5px;
      border-radius: 9px; display: flex; align-items: center; justify-content: center;
      border: 2px solid var(--card-background, #fff); z-index: 3;
    }
  }

  .yuemu-chat-content {
    flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; height: 52px;

    .yuemu-chat-header {
      display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;

      .yuemu-chat-name {
        display: flex; align-items: center; gap: 8px; min-width: 0;
        .yuemu-name-text { font-size: 16px; font-weight: 600; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        .yuemu-chat-tags {
          display: flex; gap: 6px; flex-shrink: 0;
          .yuemu-tag { font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 6px; display: flex; align-items: center; justify-content: center; line-height: 1; }
          .friend-tag { color: #059669; background: #d1fae5; }
          .group-tag { color: #2563eb; background: #dbeafe; }
          .ai-tag { color: #7c3aed; background: #ede9fe; }
          .all-group-tag { color: #10b981; background: #d1fae5; }
        }
      }
      .yuemu-chat-time { font-size: 12px; color: #94a3b8; flex-shrink: 0; }
    }

    .yuemu-chat-message-row {
      display: flex; align-items: center; gap: 6px;
      .yuemu-sender-prefix { font-size: 13px; color: #94a3b8; flex-shrink: 0;}
      .yuemu-chat-message { font-size: 14px; color: var(--text-secondary, #64748b); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; &.is-unread { color: var(--text-primary); font-weight: 500; } }
    }
  }
}

/* =========================================
   发现区域 (Discover)
   ========================================= */
.yuemu-more-content { height: 100%; overflow-y: auto; padding: 20px; &::-webkit-scrollbar { display: none; } }
.yuemu-discovery-actions {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;

  .yuemu-action-card {
    background: var(--card-background, #fff); border-radius: 20px; padding: 28px 16px;
    display: flex; flex-direction: column; align-items: center; justify-content: flex-end; text-align: center;
    box-shadow: 0 4px 16px rgba(0,0,0,0.03); border: 1px solid var(--border-color);
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); cursor: pointer;
    min-height: 120px;
    &:active { transform: scale(0.96); }
    &:last-child:nth-child(odd) { grid-column: span 2; }

    &.bg-image-card {
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      border: none;
    }
    
    .yuemu-action-label { font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 6px; text-shadow: 0 2px 4px rgba(0,0,0,0.3); }
    .yuemu-action-desc { font-size: 12px; color: rgba(255, 255, 255, 0.85); text-shadow: 0 1px 2px rgba(0,0,0,0.3); }
  }
}

/* =========================================
   部落区域 (Tribe - ONE文艺手账风格)
   ========================================= */
.yuemu-tribe-content {
  height: 100%;
  overflow-y: auto;
  background-color: var(--background);
  &::-webkit-scrollbar { display: none; }
}

.yuemu-section-header {
  padding: 12px 12px 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 6px;

  &::before,
  &::after {
    content: '';
    flex: 1;
    border-top: 2px dotted var(--text-secondary);
    opacity: 0.4;
  }

  &::before {
    margin-right: 16px;
  }

  &::after {
    margin-left: 16px;
  }

  .yuemu-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
    margin: 0;
    letter-spacing: 2px;
    font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
    white-space: nowrap;
    padding: 0 4px;
  }
}



.yuemu-recommended-list {
  display: flex;
  gap: 8px;
  padding: 4px 8px 20px;
  padding-bottom: 4px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  &::-webkit-scrollbar { display: none; }
  .yuemu-snap-card {
    flex: 0 0 85%;
    scroll-snap-align: center;
    /* 强制移动端横向滑动的卡片拥有统一的高度比例，覆盖组件内的瀑布流内联样式 */
    :deep(.yuemu-card-cover) {
      aspect-ratio: 4 / 5 !important;
    }
  }
}

.yuemu-recommended-divider {
  height: 1px;
  background-image: linear-gradient(to right, var(--border-color) 60%, transparent 60%);
  background-size: 12px 1px;
  background-repeat: repeat-x;
  margin: 8px 20px 24px;
  opacity: 0.8;
}

.yuemu-public-spaces-list {
  padding: 0 8px 100px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* =========================================
   骨架屏与动画 (已修复移动端挤压和间距问题)
   ========================================= */
@keyframes yuemuShimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.yuemu-skeleton-anim {
  background: linear-gradient(120deg, var(--hover-background, #f1f5f9) 25%, var(--border-color, #e2e8f0) 50%, var(--hover-background, #f1f5f9) 75%);
  background-size: 400% 100%;
  animation: yuemuShimmer 2s infinite linear;
  border-radius: inherit;
}

/* --- 1. 聊天骨架 --- */
.yuemu-skeleton-list {
  display: flex;
  flex-direction: column;
  padding: 0;
}
.yuemu-skeleton-item {
  display: flex; gap: 14px; padding: 16px 20px;
  background: var(--card-background, #ffffff);

}
.yuemu-skeleton-avatar { width: 52px; height: 52px; border-radius: 50%; flex-shrink: 0; }
.yuemu-skeleton-line { height: 16px; border-radius: 6px; }
.yuemu-skeleton-line.name { width: 40%; margin-bottom: 12px; height: 18px; }
.yuemu-skeleton-line.message { width: 70%; }

/* PC 端的响应式修正 */
@media screen and (min-width: 769px) {
  .yuemu-skeleton-list {
    padding: 12px 16px 100px;
    gap: 8px;
    background: transparent;
  }
  .yuemu-skeleton-item {
    border-radius: 16px;
    border: 1px solid var(--border-color);
    border-bottom: 1px solid var(--border-color);
  }
}

/* 其他状态 */
.yuemu-empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; text-align: center; &.full-page { height: 60vh; } .yuemu-empty-img { width: 120px; margin-bottom: 20px; opacity: 0.8; } .yuemu-empty-title { font-size: 18px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px; } .yuemu-empty-text { font-size: 14px; color: var(--text-secondary); margin: 0; } }

.yuemu-list-bottom-tip { padding: 30px 0; text-align: center; .yuemu-tip-line { display: flex; align-items: center; justify-content: center; gap: 16px; .line { width: 40px; height: 1px; background: var(--border-color); } .text { font-size: 13px; color: var(--text-secondary); } } }
.yuemu-load-btn { width: 100%; padding: 14px; border-radius: 20px; border: none; background: var(--hover-background); color: var(--text-secondary); font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.2s; &:hover { background: var(--border-color); color: var(--text-primary); } }
.yuemu-loading-more { text-align: center; padding: 20px 0; color: var(--text-secondary); font-size: 14px; display: flex; align-items: center; justify-content: center; gap: 8px; }

/* =========================================
   统一前缀：重构的自适应弹窗 (移动端底部抽屉，PC端居中弹窗)
   ========================================= */
.yuemu-modal-overlay {
  position: fixed; inset: 0; z-index: 2000;
  background: rgba(0,0,0,0.5); backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center;
  padding: 24px; transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.yuemu-modal {
  position: relative; background: var(--card-background, #fff); width: 100%; max-width: 360px; border-radius: 24px;
  padding: 32px 24px 24px; text-align: center; box-shadow: 0 24px 60px rgba(0,0,0,0.15); transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);

  .yuemu-modal-icon { width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; margin: 0 auto 16px; &.danger { background: #fef2f2; color: #ef4444; } &.primary { background: #eff6ff; color: #2563eb; } }
  .yuemu-modal-title { font-size: 20px; font-weight: 700; margin-bottom: 12px; color: var(--text-primary); }
  .yuemu-modal-desc { font-size: 14px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 24px; }

  .yuemu-input-wrap {
    margin-bottom: 24px; position: relative;
    .yuemu-modal-input { width: 100%; height: 48px; background: var(--hover-background); border: 2px solid transparent; border-radius: 12px; padding: 0 16px; font-size: 15px; color: var(--text-primary); outline: none; transition: all 0.2s; &:focus { border-color: #2563eb; background: transparent; } }
    .yuemu-char-count { position: absolute; right: 12px; top: 15px; font-size: 12px; color: #94a3b8; }
  }

  .yuemu-modal-actions {
    display: flex; gap: 12px;
    button { flex: 1; height: 48px; border-radius: 16px; border: none; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); &.yuemu-btn-cancel { background: var(--hover-background); color: var(--text-primary); } &.yuemu-btn-confirm { background: #2563eb; color: #fff; } &.yuemu-btn-confirm.danger { background: #ef4444; } &:active { transform: scale(0.96); } }
  }
}

/* Vue Transition Hooks */
.yuemu-modal-fade-enter-from, .yuemu-modal-fade-leave-to { opacity: 0; }
.yuemu-modal-fade-enter-from .yuemu-modal, .yuemu-modal-fade-leave-to .yuemu-modal { transform: scale(0.95); }

/* 移动端：底部抽屉模式 */
@media screen and (max-width: 768px) {
  .yuemu-modal-overlay { align-items: flex-end; padding: 0; }
  .yuemu-modal {
    max-width: 100%; border-radius: 24px 24px 0 0; padding: 36px 24px calc(24px + env(safe-area-inset-bottom));
    &::before { content: ''; position: absolute; top: 12px; left: 50%; transform: translateX(-50%); width: 40px; height: 4px; border-radius: 2px; background: var(--border-color); }
  }
  .yuemu-modal-fade-enter-from .yuemu-modal, .yuemu-modal-fade-leave-to .yuemu-modal { transform: translateY(100%); }
}

/* 深色模式兼容 */
@media (prefers-color-scheme: dark) { .yuemu-chat-list-page {
  .yuemu-skeleton-anim { background: linear-gradient(120deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%); background-size: 400% 100%; } }
}
</style>
