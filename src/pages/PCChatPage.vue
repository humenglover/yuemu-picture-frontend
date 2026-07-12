<template>
  <div class="pc-chat-app-wrapper" :class="{ 'is-tribe-tab': activeTab === 'tribe' }">
    <div class="chat-side-panel" :style="{ width: leftPanelWidth + 'px' }">

      <div class="panel-header-zone">
        <div class="title-row">
          <h2 class="app-title">{{ $t('pages.pcChatPage.titleMessages') }}</h2>
          <button v-if="unreadCounts.totalUnread > 0 && activeTab === 'chat'"
                  class="icon-action-btn" @click.stop="showClearUnreadModal" :title="$t('pages.pcChatPage.clearAllUnread')">
            <i class="fas fa-broom"></i>
          </button>
        </div>

        <div class="pill-tab-switcher">
          <div class="tab-item" :class="{ active: activeTab === 'chat' }" @click="handleTabChange('chat')">
            <i class="far fa-comment"></i>
            <span>{{ $t('pages.pcChatPage.session') }}</span>
            <span v-if="unreadCounts.totalUnread > 0" class="badge-dot"></span>
          </div>
          <div class="tab-item" :class="{ active: activeTab === 'tribe' }" @click="handleTabChange('tribe')">
            <i class="fas fa-users"></i>
            <span>{{ $t('pages.pcChatPage.tribe') }}</span>
          </div>
        </div>

        <div class="search-row" v-if="activeTab === 'chat'">
          <div class="search-input-box">
            <i class="fas fa-search search-icon"></i>
            <input type="text" v-model="searchText" :placeholder="$t('pages.pcChatPage.searchPlaceholder')" @keyup.enter="handleSearch" />
          </div>
        </div>
      </div>

      <div v-show="activeTab === 'chat'" class="list-scroll-area" ref="chatListContainerRef" @scroll="handleListScroll">
        <div class="chat-list-wrapper">

          <div v-if="!loading && filteredChatList.length === 0" class="beautiful-empty-state">
            <img class="empty-illu" src="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg" :alt="$t('pages.pcChatPage.emptyAlt')" />
            <h3 class="empty-title">{{ getEmptyText() }}</h3>
            <p v-if="searchText" class="empty-desc">{{ $t('pages.pcChatPage.tryOtherKeyword') }}</p>
          </div>

          <div v-else class="contact-list">
            <div v-for="item in filteredChatList" :key="item.id"
                 class="contact-card"
                 :class="{ active: String(selectedChat?.id) === String(item.id) }"
                 @click="handleChatSelect(item)">

              <div class="avatar-box">
                <img :src="item.targetUser?.userAvatar || getDefaultAvatar(item.targetUser?.userName)" />
                <div v-if="getUnreadCount(item) > 0" class="unread-count">
                  {{ getUnreadCount(item) > 99 ? '99+' : getUnreadCount(item) }}
                </div>
              </div>

              <div class="info-box">
                <div class="info-header">
                  <div class="name-area">
                    <span class="user-name">{{ item.isSender ? item.userChatName : item.targetUserChatName }}</span>
                    <span class="type-tag" :class="getChatTypeClass(item)">
                      {{ item.chatType === 3 ? $t('pages.pcChatPage.groupType') : item.chatType === 2 ? $t('pages.pcChatPage.aiType') : $t('pages.pcChatPage.friendType') }}
                    </span>
                  </div>
                  <span class="time-text">{{ formatMessageTime(item.lastMessageTime) }}</span>
                </div>
                <div class="info-footer">
                  <span class="msg-text">{{ item.lastMessage || $t('pages.pcChatPage.noMsg') }}</span>
                </div>
              </div>

              <div class="hover-action-group" v-if="item.chatType !== 2 && item.chatType !== 3">
                <button class="circle-btn" @click.stop="showEditNameModal(item)" :title="$t('pages.pcChatPage.editName')">
                  <i class="fas fa-pen"></i>
                </button>
                <button class="circle-btn danger" @click.stop="showDeleteConfirm(item)" :title="$t('pages.pcChatPage.delChat')">
                  <i class="fas fa-trash-alt"></i>
                </button>
              </div>
            </div>
          </div>

          <div class="load-more-zone" v-if="filteredChatList.length > 0">
            <div v-if="loadingMore" class="text-loading"><i class="fas fa-spinner fa-spin"></i> {{ $t('pages.pcChatPage.loading') }}</div>
            <div v-else-if="hasMore" class="text-link" @click="loadMore">{{ $t('pages.pcChatPage.loadMore') }}</div>
            <div v-else class="text-muted">{{ $t('pages.pcChatPage.bottom') }}</div>
          </div>
        </div>
      </div>

      <div v-show="activeTab === 'tribe'" class="list-scroll-area">
        <div class="tribe-list-wrapper">
          <RecommendedSpacesList ref="recommendedSpacesListRef" />
        </div>
      </div>
    </div>

    <div class="panel-divider-line"
         @mousedown="startResize"
         @touchstart="startResize"
         @touchmove.prevent>
    </div>

    <div class="chat-main-stage" :class="{ 'mobile-active-stage': activeTab === 'chat' && selectedChat }">
      <template v-if="activeTab === 'chat' && selectedChat">
        <header class="stage-top-bar">
          <div class="target-info-area">
            <button class="mobile-back-btn" @click.stop="selectedChat = null" :title="$t('pages.pcChatPage.backList')">
              <i class="fas fa-chevron-left"></i>
            </button>
            <img class="target-avatar" :src="selectedChat.targetUser?.userAvatar || getDefaultAvatar(selectedChat.targetUser?.userName)" @click="handleAvatarClick" />
            <div class="target-text" @click="handleAvatarClick">
              <h3 class="target-name">{{ selectedChat.targetUser?.userName }}</h3>
              <div class="target-status">
                <template v-if="selectedChat.chatType === 3">
                  <span class="status-badge group">{{ $t('pages.pcChatPage.allGroup') }}</span>
                </template>
                <template v-else>
                  <span class="status-dot" :class="{ 'is-online': isOnline }"></span>
                  <span class="status-label" :class="{ 'is-online': isOnline }">{{ isOnline ? $t('pages.pcChatPage.online') : $t('pages.pcChatPage.offline') }}</span>
                </template>
              </div>
            </div>
          </div>

          <div class="action-icons-area" v-if="selectedChat.chatType === 3">
            <button class="soft-btn" @click="showAnnouncement = true">
              <i class="fas fa-bullhorn"></i> <span>{{ $t('pages.pcChatPage.announcement') }}</span>
            </button>
            <button class="soft-btn primary" @click="showOnlineUsers = true">
              <i class="fas fa-users"></i> <span>{{ onlineUsers.length }}</span>
            </button>
          </div>
        </header>

        <div class="room-container">
          <PictureChatRoom
            :key="selectedChat.id"
            ref="chatRoomRef"
            :privateChatId="selectedChat.id"
            :spaceId="selectedChat.id === -2 || selectedChat.id === '-2' ? -2 : undefined"
            :type="selectedChat.chatType === 3 ? 'space' : 'private'"
            @message="handleChatMessage"
            @mounted="handleChatMounted"
            @update:onlineUsers="updateOnlineUsers"
          />
        </div>
      </template>

      <div class="tribe-full-page" v-else-if="activeTab === 'tribe'">
        <TribeList ref="tribeListRef" />
      </div>

      <div class="welcome-blank-page" v-else>
        <div class="welcome-box">
          <img class="floating-hero" src="/src/assets/illustrations/happy.png" alt="Happy Chat">
          <p class="welcome-text">{{ $t('pages.pcChatPage.welcome') }}</p>
        </div>
      </div>
    </div>

    <div v-if="clearUnreadVisible" class="native-modal-overlay" @click="clearUnreadVisible = false">
      <div class="native-modal-card" @click.stop>
        <div class="modal-icon success"><i class="fas fa-check-double"></i></div>
        <h3 class="modal-title">{{ $t('pages.pcChatPage.clearUnreadTitle') }}</h3>
        <div class="modal-body">
          <p v-html="$t('pages.pcChatPage.clearUnreadDesc', { total: unreadCounts.totalUnread })"></p>
          <p class="sub-text" v-if="unreadCounts.friendUnread > 0 || unreadCounts.privateUnread > 0">
            {{ $t('pages.pcChatPage.clearUnreadTypes', { friend: unreadCounts.friendUnread, private: unreadCounts.privateUnread }) }}
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn-ghost" @click="clearUnreadVisible = false">{{ $t('pages.pcChatPage.cancel') }}</button>
          <button class="btn-solid success" @click="confirmClearUnread" :disabled="clearUnreadLoading">
            {{ clearUnreadLoading ? $t('pages.pcChatPage.clearLoading') : $t('pages.pcChatPage.confirmClear') }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="editNameVisible" class="native-modal-overlay" @click="editNameVisible = false">
      <div class="native-modal-card" @click.stop>
        <h3 class="modal-title">{{ $t('pages.pcChatPage.editNameTitle') }}</h3>
        <div class="modal-body">
          <input v-model="newChatName" class="elegant-input" :placeholder="$t('pages.pcChatPage.editNamePlaceholder')" maxlength="50" />
        </div>
        <div class="modal-footer">
          <button class="btn-ghost" @click="editNameVisible = false">{{ $t('pages.pcChatPage.cancel') }}</button>
          <button class="btn-solid primary" @click="handleEditNameConfirm" :disabled="editNameLoading">
            {{ editNameLoading ? $t('pages.pcChatPage.saveLoading') : $t('pages.pcChatPage.confirmEdit') }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="deleteConfirmVisible" class="native-modal-overlay" @click="deleteConfirmVisible = false">
      <div class="native-modal-card" @click.stop>
        <div class="modal-icon danger"><i class="fas fa-exclamation-triangle"></i></div>
        <h3 class="modal-title">{{ $t('pages.pcChatPage.deleteTitle') }}</h3>
        <div class="modal-body text-left">
          <div class="info-panel">
            <p><strong>{{ $t('pages.pcChatPage.contact') }}</strong>{{ chatToDelete?.targetUser?.userName || $t('pages.pcChatPage.unknown') }}</p>
            <p class="sub-text">{{ $t('pages.pcChatPage.deleteDesc') }}</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-ghost" @click="deleteConfirmVisible = false">{{ $t('pages.pcChatPage.thinkAgain') }}</button>
          <button class="btn-solid danger" @click="confirmDeleteChat" :disabled="deleteLoading">
            {{ deleteLoading ? $t('pages.pcChatPage.processing') : $t('pages.pcChatPage.confirmDelete') }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="showAnnouncement" class="native-modal-overlay" @click="showAnnouncement = false">
      <div class="native-modal-card align-left" @click.stop>
        <div class="modal-header-row">
          <h3 class="modal-title m-0"><i class="fas fa-bullhorn highlight-text primary"></i> {{ $t('pages.pcChatPage.groupAnnouncement') }}</h3>
          <button class="close-btn" @click="showAnnouncement = false"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body rich-text">
          <p>{{ $t('pages.pcChatPage.announceDesc') }}</p>
          <ul>
            <li><i class="fas fa-star"></i> {{ $t('pages.pcChatPage.rule1') }}</li>
            <li><i class="fas fa-handshake"></i> {{ $t('pages.pcChatPage.rule2') }}</li>
            <li><i class="fas fa-times"></i> {{ $t('pages.pcChatPage.rule3') }}</li>
          </ul>
        </div>
        <div class="modal-footer mt-4">
          <button class="btn-solid primary w-full" @click="showAnnouncement = false">{{ $t('pages.pcChatPage.iKnow') }}</button>
        </div>
      </div>
    </div>

    <teleport to="body">
      <div v-if="showOnlineUsers" class="native-modal-overlay" @click="showOnlineUsers = false">
        <div class="native-modal-card user-list-modal" @click.stop>
          <div class="modal-header-row">
            <h3 class="modal-title m-0"><i class="fas fa-users" style="color: var(--link-color); margin-right: 6px;"></i> {{ $t('pages.pcChatPage.onlineUsers', { count: onlineUsers.length }) }}</h3>
            <button class="close-btn" @click="showOnlineUsers = false"><i class="fas fa-times"></i></button>
          </div>
          <div class="user-list-view">
            <div v-if="!onlineUsers.length" class="empty-state">
              <i class="fas fa-user-friends empty-icon"></i>
              <p>{{ $t('pages.pcChatPage.noOtherOnline') }}</p>
            </div>
            <div v-for="user in onlineUsers" :key="user.id" class="user-row" @click="handleUserClick(user)">
              <div class="u-avatar">
                <img :src="user.userAvatar || getDefaultAvatar(user.userName)" />
                <span class="online-indicator"></span>
              </div>
              <div class="u-info">
                <div class="u-name">{{ user.userName }}</div>
                <div class="u-role">{{ user.userRole === 'admin' ? $t('pages.pcChatPage.admin') : $t('pages.pcChatPage.normalUser') }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </teleport>

  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue' // 仅保留 message 提示
import { getDefaultAvatar } from '@/utils/userUtils'
import { listPrivateChatByPageUsingPost, deletePrivateChatUsingPost, updateChatNameUsingPost, clearUnreadCountUsingPost } from '@/api/privateChatController'
import { formatMessageTime } from "@/utils/dateUtils"
import PictureChatRoom from '@/components/PictureChatRoom.vue'
import TribeList from '@/components/TribeList.vue'
import RecommendedSpacesList from '@/components/RecommendedSpacesList.vue'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import { useChatListStore } from '@/stores/useChatListStore'
import { chatListWebSocket } from '@/utils/chatListWebSocket'

// 定义类型
interface PrivateChat {
  id: string;
  userId: string;
  targetUserId: string;
  targetUser?: {
    id: string;
    userName: string;
    userAvatar?: string;
    userAccount: string;
    createTime: string;
  };
  chatType: number;
  lastMessage?: string;
  lastMessageTime: string;
  targetUserChatName: string;
  isSender: boolean;
  userChatName?: string;
  userUnreadCount: number;
}

const router = useRouter()
const chatRoomRef = ref()
const selectedChat = ref<PrivateChat | null>(null)
const isOnline = ref(false)
const recommendedSpacesListRef = ref()
const chatListContainerRef = ref<HTMLElement>()
const isFirstLoad = ref(true)
const ignoreScroll = ref(false)

// 在线用户和公告相关状态
const onlineUsers = ref<any[]>([])
const showOnlineUsers = ref(false)
const showAnnouncement = ref(false)

const loginUserStore = useLoginUserStore()
const chatListStore = useChatListStore()

// 搜索参数
const searchParams = ref({
  current: 1,
  pageSize: 10,
  searchText: '',
  chatType: undefined as number | undefined
})

const loadingMore = ref(false)
const hasMore = ref(true)
const allChatList = ref<PrivateChat[]>([])

const loading = ref(false)
const searchText = ref('')
const activeTab = ref('chat')
const chatList = ref<PrivateChat[]>([])
const total = ref(0)

// 原生弹窗相关状态
const editNameVisible = ref(false)
const editNameLoading = ref(false)
const newChatName = ref('')

const clearUnreadVisible = ref(false)
const clearUnreadLoading = ref(false)

const deleteConfirmVisible = ref(false)
const chatToDelete = ref<PrivateChat | null>(null)
const deleteLoading = ref(false)

// 使用WebSocket的未读消息总数
const unreadCounts = computed(() => chatListWebSocket.unreadCounts.value)

// 添加特殊群配置（仅保留全员群），设为响应式以支持实时更新
const publicGroupChat = ref({
  id: -2,
  targetUser: { id: '-2', userName: t('pages.pcChatPage.publicGroup'), userAvatar: new URL('@/assets/images/all.png', import.meta.url).href, userAccount: 'public_group', createTime: new Date().toISOString() },
  chatType: 3, lastMessage: t('pages.pcChatPage.welcomeMsg'), lastMessageTime: new Date().toISOString(), targetUserChatName: t('pages.pcChatPage.publicGroup'), isSender: false, userUnreadCount: 0
})

// 计算属性：过滤后的聊天列表
const filteredChatList = computed(() => {
  if (activeTab.value !== 'chat') {
    return [];
  }

  // 始终包含公共群
  let specialChats = [publicGroupChat.value as any]
  let filtered = [...allChatList.value]

  // 搜索过滤
  if (searchText.value) {
    const searchLower = searchText.value.toLowerCase()
    filtered = filtered.filter((chat: PrivateChat) => {
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

  filtered.sort((a: PrivateChat, b: PrivateChat) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime())
  return [...specialChats, ...filtered]
})

const getUnreadCount = (chat: any) => Number(chat.userUnreadCount) || Number(chat.unreadCount) || 0

// 获取聊天列表
const fetchChatList = async (reset = true) => {
  if (loading.value) return
  try {
    if (reset) {
      loading.value = true
      searchParams.value.current = 1
      allChatList.value = []
    }
    chatListWebSocket.sendMessage({
      type: 'REQUEST_LIST',
      data: {
        searchText: searchText.value,
        current: searchParams.value.current,
        pageSize: searchParams.value.pageSize,
        chatType: undefined
      }
    })
  } catch (error: any) {
    loading.value = false
  }
}

// 处理标签切换
const handleTabChange = (tab: string) => {
  activeTab.value = tab
  chatListStore.updateCurrentTab(tab)

  if (tab === 'chat') {
    // 只有当完全没有数据时才尝试去重新拉取第一页，平时依靠 WebSocket 保持实时状态即可
    if (allChatList.value.length === 0 && !loading.value) {
      searchParams.value.current = 1
      fetchChatList()
    }
  } else if (tab === 'tribe') {
    nextTick(() => {
      if (recommendedSpacesListRef.value && recommendedSpacesListRef.value.refresh) {
        recommendedSpacesListRef.value.refresh();
      }
    });
  }
}

// 处理搜索
const handleSearch = () => {
  searchParams.value.current = 1
  chatListStore.updateSearchText(searchText.value)
  chatListStore.clearAll()
  fetchChatList()
}

// 加载更多聊天
const loadMore = () => {
  if (loading.value || loadingMore.value || !hasMore.value) return;
  loadingMore.value = true
  searchParams.value.current += 1
  chatListWebSocket.sendMessage({
    type: 'REQUEST_LIST',
    data: {
      searchText: searchText.value,
      current: searchParams.value.current,
      pageSize: searchParams.value.pageSize,
      chatType: undefined
    }
  })
}

// 处理滚动事件
const handleListScroll = (event: Event) => {
  if (ignoreScroll.value) return;
  const target = event.target as HTMLElement;
  const { scrollTop, scrollHeight, clientHeight } = target;
  chatListStore.updateScrollPosition(scrollTop)

  if (!loading.value && !loadingMore.value && hasMore.value) {
    if (scrollHeight - scrollTop - clientHeight < 100) {
      loadMore();
    }
  }
}

// 自动探测是否需要加载
const checkAutoLoad = () => {
  
  nextTick(() => {
    if (!chatListContainerRef.value) return;
    const { scrollTop, scrollHeight, clientHeight } = chatListContainerRef.value;
    if (scrollHeight - scrollTop - clientHeight < 100 && hasMore.value && !loading.value && !loadingMore.value) {
      loadMore();
    }
  });
}

// 处理聊天选择
const handleChatSelect = async (chat: PrivateChat) => {
  if (chat.targetUser) {
    try {
      await clearUnreadCountUsingPost({ targetUserId: String(chat.targetUser.id), isSender: chat.isSender })
      const updatedChat = allChatList.value.find(item => item.id === chat.id)
      if (updatedChat) updatedChat.userUnreadCount = 0
      // 通知全局刷新未读红点总数
      chatListWebSocket.sendMessage({ type: 'REQUEST_UNREAD_COUNTS' })
    } catch (error) {}
    selectedChat.value = chat
    chatListStore.updateSelectedChatId(chat.id)
  }
}

// 显示和确认删除聊天
const showDeleteConfirm = (chat: PrivateChat) => {
  chatToDelete.value = chat
  deleteConfirmVisible.value = true
}

const confirmDeleteChat = async () => {
  if (!chatToDelete.value) return
  try {
    deleteLoading.value = true
    const res = await deletePrivateChatUsingPost({ privateChatId: chatToDelete.value.id })
    if (res.data.code === 0) {
      message.success(t('pages.pcChatPage.deleteSuccess'))
      chatListWebSocket.sendMessage({ type: 'DELETE', data: { id: chatToDelete.value.id } })
      allChatList.value = allChatList.value.filter(c => c.id !== chatToDelete.value!.id)
    }
  } catch (error) {
  } finally {
    deleteLoading.value = false
    deleteConfirmVisible.value = false
    chatToDelete.value = null
  }
}

// 修改名称
const showEditNameModal = (chat: PrivateChat) => {
  newChatName.value = chat.userChatName || ''
  editNameVisible.value = true
  selectedChat.value = chat
}

const handleEditNameConfirm = async () => {
  if (!selectedChat.value?.id || !newChatName.value.trim()) return
  try {
    editNameLoading.value = true
    const res = await updateChatNameUsingPost({ privateChatId: selectedChat.value.id, chatName: newChatName.value.trim() })
    if (res.data.code === 0) {
      message.success(t('pages.pcChatPage.editSuccess'))
      chatListWebSocket.sendMessage({ type: 'UPDATE', data: { id: selectedChat.value.id, chatName: newChatName.value.trim() } })
      editNameVisible.value = false
    }
  } finally {
    editNameLoading.value = false
  }
}

const getChatTypeClass = (chat: PrivateChat) => {
  if (chat.chatType === 2) return 'theme-ai'
  if (chat.chatType === 3) return 'theme-group'
  return chat.chatType === 1 ? 'theme-friend' : 'theme-private'
}

const getEmptyText = () => searchText.value ? t('pages.pcChatPage.noMatchSession') : t('pages.pcChatPage.emptyHere')

const handleAvatarClick = () => {
  if (!selectedChat.value?.targetUser) return
  router.push({
    path: `/user/${selectedChat.value.targetUser.id}`,
    query: { userName: selectedChat.value.targetUser.userName, userAvatar: selectedChat.value.targetUser.userAvatar }
  })
}

const handleChatMounted = async () => {
  await nextTick()
  const messageContainer = chatRoomRef.value?.$el.querySelector('.chat-messages')
  if (messageContainer) messageContainer.scrollTop = messageContainer.scrollHeight
}

const handleChatMessage = (msg: any) => {
  if (msg.type === 'error') return

  if (msg.type === 'onlineUsers') {
    const targetUserOnline = msg.onlineUsers?.some((user:any) => user.id === selectedChat.value?.targetUser?.id) ?? false
    isOnline.value = targetUserOnline
  } else if (msg.type === 'history' || msg.type === 'message') {
    nextTick(() => {
      const messageContainer = chatRoomRef.value?.$el.querySelector('.chat-messages')
      if (messageContainer) messageContainer.scrollTop = messageContainer.scrollHeight
    })
    // 实时同步更新左侧列表最后一条消息
    if (msg.type === 'message' && msg.data) {
      const msgData = msg.data;
      let text = msgData.content || '';
      if (msgData.messageType === 'image') {
         text = '[图片]';
      }
      let targetChat = allChatList.value.find(item => String(item.id) === String(selectedChat.value?.id))
      // 如果目标是全员群，则直接更新其自身的响应式数据
      if (!targetChat && String(selectedChat.value?.id) === '-2') {
         targetChat = publicGroupChat.value
      }
      if (targetChat) {
         targetChat.lastMessage = text;
         targetChat.lastMessageTime = msgData.createTime || new Date().toISOString();
         targetChat.userUnreadCount = 0;
         if (targetChat.targetUser && String(targetChat.targetUser.id) !== '-2') {
           clearUnreadCountUsingPost({ targetUserId: String(targetChat.targetUser.id), isSender: targetChat.isSender }).then(() => {
             chatListWebSocket.requestUnreadCounts()
           }).catch(() => {})
         }
         // 强制触发浅拷贝以更新 computed 顺序
         allChatList.value = [...allChatList.value];
      }
    }
  } else if (msg.type === 'RECALL' && msg.messageId) {
    if (selectedChat.value) {
      const chat = allChatList.value.find(item => item.id === selectedChat.value?.id)
      if (chat) {
        chat.lastMessage = t('pages.pcChatPage.msgWithdrawn')
        allChatList.value = [...allChatList.value]
      }
    }
  }
}

const updateOnlineUsers = (users: any[]) => onlineUsers.value = users
const handleUserClick = (user: any) => showOnlineUsers.value = false

watch(() => selectedChat.value?.id, async (newId, oldId) => {
  if (newId && newId !== oldId) {
    await nextTick()
    if (chatRoomRef.value) chatRoomRef.value.initWebSocket()
  }
})

// 拖拽相关
const leftPanelWidth = ref(360)
const isDragging = ref(false)
const minWidth = 320
const maxWidth = 550
const touchStartX = ref(0)
const initialWidth = ref(0)

const startResize = (e: MouseEvent | TouchEvent) => {
  isDragging.value = true
  if (e instanceof MouseEvent) {
    document.addEventListener('mousemove', handleResize)
    document.addEventListener('mouseup', stopResize)
  } else {
    touchStartX.value = e.touches[0].clientX
    initialWidth.value = leftPanelWidth.value
    document.addEventListener('touchmove', handleTouchResize)
    document.addEventListener('touchend', stopResize)
  }
  document.body.style.userSelect = 'none'
}
const handleTouchResize = (e: TouchEvent) => {
  if (!isDragging.value) return
  const newWidth = initialWidth.value + (e.touches[0].clientX - touchStartX.value)
  if (newWidth >= minWidth && newWidth <= maxWidth) leftPanelWidth.value = newWidth
  e.preventDefault()
}
const handleResize = (e: MouseEvent) => {
  if (!isDragging.value) return
  if (e.clientX >= minWidth && e.clientX <= maxWidth) leftPanelWidth.value = e.clientX
}
const stopResize = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  document.removeEventListener('touchmove', handleTouchResize)
  document.removeEventListener('touchend', stopResize)
  document.body.style.userSelect = ''
}

// 清除未读
const showClearUnreadModal = () => clearUnreadVisible.value = true
const confirmClearUnread = async () => {
  try {
    clearUnreadLoading.value = true
    chatListWebSocket.sendMessage({ type: 'CLEAR_ALL_UNREAD' })
    chatList.value.forEach(chat => { if (chat) chat.userUnreadCount = 0 })
    await new Promise(resolve => setTimeout(resolve, 500))
    chatListWebSocket.sendMessage({ type: 'REQUEST_UNREAD_COUNTS' })
  } finally {
    clearUnreadLoading.value = false
    clearUnreadVisible.value = false
  }
}

// ============================================================
// 状态管理：完全参照 ChatListPage.vue 的稳定设计
// - onBeforeUnmount 保存状态到 store
// - onMounted 从 store 恢复状态
// - handleListScroll 实时保存滚动位置
// - 不使用 keepAlive，无任何 hack
// ============================================================

onBeforeUnmount(() => {
  // 离开页面前保存完整状态
  chatListStore.updateUserId(loginUserStore.loginUser?.id)
  // 注意：在此处读取 scrollTop 是危险的，因为组件卸载时可能导致值为 0，且 handleListScroll 已实时保存。
  chatListStore.updateCurrentPage(searchParams.value.current)
  chatListStore.updateChatListData(allChatList.value)
  chatListStore.updateCurrentTab(activeTab.value)
  chatListStore.updateSearchText(searchText.value)
  chatListStore.updateSelectedChatId(selectedChat.value?.id ?? null)
})

onBeforeUnmount(() => {
  // 清理拖拽事件
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  document.removeEventListener('touchmove', handleTouchResize)
  document.removeEventListener('touchend', stopResize)
  chatListWebSocket.off('message', handleWebSocketMessage)
})

const handleWebSocketMessage = (data: any) => {
  if (!data) return
  loading.value = false

  if (data.type === 'CHAT_LIST') {
    const records = (data.records || []).map((record: any) => ({
      ...record, id: String(record.id), userId: String(record.userId), targetUserId: String(record.targetUserId)
    }))
    const totalCount = parseInt(data.total) || 0
    const currentPage = parseInt(data.current) || 1
    const pageSize = parseInt(data.pageSize) || 10

    if (currentPage === 1 && allChatList.value.length > 0) {
      // 核心修复：保持第一页的服务器权威顺序，同时保留之前加载的后续页数据
      const validRecords = records.filter((chat: any) => chat.id !== '-1' && chat.id !== '-2')
      // 提取出在第一页中没有出现的旧数据
      const oldRecords = allChatList.value.filter(oldChat => 
        !validRecords.some(newChat => String(newChat.id) === String(oldChat.id)) && oldChat.id !== '-1' && oldChat.id !== '-2'
      )
      // 将最新的第一页排在最前面，旧数据接在后面
      allChatList.value = [...validRecords, ...oldRecords]
    } else if (currentPage === 1) {
      allChatList.value = records.filter((chat: any) => chat.id !== '-1' && chat.id !== '-2')
    } else {
      const newChats = records.filter((chat: any) => chat.id !== '-1' && chat.id !== '-2' && !allChatList.value.some(existing => existing.id === chat.id))
      allChatList.value = [...allChatList.value, ...newChats]
    }

    total.value = totalCount
    hasMore.value = allChatList.value.length < totalCount
    loading.value = false
    loadingMore.value = false
    if (currentPage >= Math.ceil(totalCount / pageSize)) hasMore.value = false

    // 数据渲染后：如果是首次加载背景刷新，则恢复记录的滚动位置；其他情况（如收到新消息）不再强制修改滚动条
    nextTick(() => {
      if (isFirstLoad.value) {
        ignoreScroll.value = true
        const savedPos = chatListStore.scrollPosition
        if (savedPos > 0 && chatListContainerRef.value) {
          chatListContainerRef.value.scrollTop = savedPos
        }
        setTimeout(() => ignoreScroll.value = false, 200)
        isFirstLoad.value = false
      }
      checkAutoLoad()
    })
  } else if (data.type === 'UPDATE_LIST') {
    searchParams.value.current = 1
    chatListWebSocket.sendMessage({ type: 'REQUEST_LIST', data: { searchText: searchText.value, current: 1, pageSize: searchParams.value.pageSize, chatType: undefined } })
  } else if (data.type === 'DELETE') {
    const deletedChatId = data.data?.id
    if (deletedChatId) {
      allChatList.value = allChatList.value.filter(chat => String(chat.id) !== String(deletedChatId) && chat.id !== '-1' && chat.id !== '-2')
    }
  } else if (data.type === 'NEW') {
    const newChat = data.data
    if (newChat) {
      if (String(newChat.id) === String(selectedChat.value?.id)) {
        newChat.userUnreadCount = 0
        newChat.unreadCount = 0
        if (newChat.targetUser && String(newChat.targetUser.id) !== '-2') {
           clearUnreadCountUsingPost({ targetUserId: String(newChat.targetUser.id), isSender: newChat.isSender }).then(() => {
             chatListWebSocket.requestUnreadCounts()
           }).catch(() => {})
        }
      }
      // 无论是否存在，都过滤掉旧的，把新的置顶
      const filteredList = allChatList.value.filter(chat => 
        String(chat.id) !== String(newChat.id) && chat.id !== '-1' && chat.id !== '-2'
      )
      allChatList.value = [newChat, ...filteredList]
    }
  } else if (data.type === 'UNREAD_COUNT_UPDATE') {
    const { chatId, unreadCount } = data
    if (String(chatId) === String(selectedChat.value?.id)) {
      const chat = allChatList.value.find(item => String(item.id) === String(chatId))
      if (chat && chat.targetUser && String(chat.targetUser.id) !== '-2') {
         clearUnreadCountUsingPost({ targetUserId: String(chat.targetUser.id), isSender: chat.isSender }).then(() => {
           chatListWebSocket.requestUnreadCounts()
         }).catch(() => {})
      }
    } else {
      const chat = allChatList.value.find(item => String(item.id) === String(chatId))
      if (chat) {
        chat.userUnreadCount = Number(unreadCount)
        chat.unreadCount = Number(unreadCount)
        allChatList.value = [...allChatList.value]
      }
    }
  } else if (data.type === 'ERROR') {
    loading.value = false
    loadingMore.value = false
  }
}

onMounted(async () => {
  // 第一步：从 store 恢复缓存状态（与 ChatListPage 完全一致）
  const hasCachedData = chatListStore.chatListData.length > 0 && chatListStore.userId === loginUserStore.loginUser?.id
  if (hasCachedData) {
    allChatList.value = chatListStore.chatListData
    activeTab.value = chatListStore.currentTab
    searchText.value = chatListStore.searchText;
    searchParams.value.current = chatListStore.currentPage;
    await nextTick();
    if (chatListContainerRef.value) chatListContainerRef.value.scrollTop = chatListStore.scrollPosition;
    // 恢复上次选中的聊天
    if (chatListStore.selectedChatId) {
      const restored = allChatList.value.find(c => c.id === chatListStore.selectedChatId)
      if (restored) selectedChat.value = restored
    }
  }

  if (!loginUserStore.loginUser?.id) return

  // 第二步：连接 WebSocket 并设置消息处理
  await chatListWebSocket.connect(loginUserStore.loginUser.id)

  chatListWebSocket.on('message', handleWebSocketMessage)

  // 第三步：主动拉取最新数据（如果已有缓存，这将在后台无感刷新列表）
  fetchChatList()

  chatListWebSocket.sendMessage({ type: 'REQUEST_UNREAD_COUNTS' })
})

onActivated(() => {
  if (chatListContainerRef.value && chatListStore.scrollPosition > 0) {
    ignoreScroll.value = true
    chatListContainerRef.value.scrollTop = chatListStore.scrollPosition
    setTimeout(() => ignoreScroll.value = false, 200)
  }
})
</script>

<style lang="scss" scoped>
/* ==========================================
   全局容器与初始化 (严格保留 1400x90vh)
   ========================================== */
.pc-chat-app-wrapper {
  font-family: var(--font-family-base);
  display: flex;
  height: calc(100vh - 90px);
  max-width: 1400px;
  margin: 10px auto;
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 12px 36px var(--shadow-color);
  transition: var(--theme-transition);
}

button { font-family: inherit; }

/* ==========================================
   左侧边栏 (极简呼吸感布局)
   ========================================== */
.chat-side-panel {
  display: flex;
  flex-direction: column;
  background: var(--card-background);
  height: 100%;
  position: relative;
  z-index: 2;
  border-right: 1px solid var(--border-color);

  .panel-header-zone {
    padding: 24px 20px 12px;
    background: var(--card-background);
    z-index: 10;

    .title-row {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 20px;
      .app-title { font-size: 24px; font-weight: 700; color: var(--text-primary); margin: 0; letter-spacing: 0.5px; }
      .icon-action-btn {
        width: 34px; height: 34px; border-radius: 50%; border: none;
        background: rgba(82, 196, 26, 0.1); color: #52c41a; font-size: 15px;
        display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s;
        &:hover { background: rgba(82, 196, 26, 0.2); transform: rotate(15deg) scale(1.05); }
      }
    }

    .pill-tab-switcher {
      display: flex; gap: 4px; background: var(--hover-background); margin-bottom: 16px;
      padding: 4px; border-radius: 12px;
      .tab-item {
        flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
        height: 32px; border-radius: 8px; font-size: 14px; font-weight: 500;
        color: var(--text-secondary); background: transparent;
        cursor: pointer; transition: all 0.2s; position: relative;
        &:hover { color: var(--text-primary); }
        &.active {
          background: var(--card-background);
          color: var(--text-primary);
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .badge-dot { position: absolute; top: 6px; right: 15%; width: 6px; height: 6px; background: #ff3b30; border-radius: 50%; }
      }
    }

    .search-row {
      margin-top: 0;
      .search-input-box {
        position: relative; display: flex; align-items: center;
        background: var(--hover-background); border-radius: 12px;
        padding: 0 12px; height: 40px; transition: 0.3s;
        border: 1px solid transparent;
        &:focus-within { background: var(--card-background); border-color: var(--link-color); box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
        .search-icon { color: var(--text-secondary); font-size: 14px; margin-right: 8px; }
        input { flex: 1; border: none; background: transparent; color: var(--text-primary); font-size: 14px; outline: none; }
        input::placeholder { color: var(--text-secondary); opacity: 0.7; }
      }
    }
  }

  /* 列表区域 */
  .list-scroll-area {
    flex: 1; overflow-y: auto; overflow-x: hidden; padding: 0 12px 16px;
    -webkit-overflow-scrolling: touch; /* 移动端平滑滚动 */

    .beautiful-empty-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding-top: 80px; text-align: center;
      .empty-illu { width: 120px; margin-bottom: 20px; opacity: 0.8; }
      .empty-title { font-size: 16px; font-weight: 600; color: var(--text-primary); margin: 0 0 8px; }
      .empty-desc { font-size: 13px; color: var(--text-secondary); margin: 0; }
    }

    .contact-list { display: flex; flex-direction: column; gap: 6px; padding-top: 4px; }

    .contact-card {
      display: flex; align-items: center; gap: 14px; padding: 12px;
      border-radius: 12px; cursor: pointer; position: relative; transition: 0.2s;
      border: 1px solid transparent;

      &:hover { background: var(--hover-background); border-color: var(--border-color); .hover-action-group { opacity: 1; transform: translateY(-50%) translateX(0); } }
      &.active { background: var(--nav-item-active); border-color: rgba(59,130,246,0.2); }

      .avatar-box {
        position: relative; width: 48px; height: 48px; flex-shrink: 0;
        img { width: 100%; height: 100%; border-radius: 12px; object-fit: cover; }
        .unread-count {
          position: absolute; top: -6px; right: -6px; background: #ff3b30; color: #fff;
          font-size: 11px; font-weight: 700; min-width: 20px; height: 20px; line-height: 20px;
          border-radius: 10px; display: flex; align-items: center; justify-content: center;
          padding: 0 6px; border: 2px solid var(--card-background); z-index: 2;
          box-shadow: 0 2px 4px rgba(255, 59, 48, 0.3);
        }
      }

      .info-box {
        flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; gap: 4px;
        .info-header {
          display: flex; justify-content: space-between; align-items: center;
          .name-area { display: flex; align-items: center; gap: 8px; overflow: hidden; }
          .user-name { font-size: 15px; font-weight: 600; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .time-text { font-size: 12px; color: var(--text-secondary); flex-shrink: 0; }
        }
        .info-footer {
          .msg-text { font-size: 13px; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block; }
        }
      }

      .type-tag {
        font-size: 10px; padding: 2px 6px; border-radius: 6px; font-weight: 600; flex-shrink: 0;
        &.theme-ai { color: #8b5cf6; background: rgba(139,92,246,0.1); }
        &.theme-group { color: #0ea5e9; background: rgba(14,165,233,0.1); }
        &.theme-friend { color: #10b981; background: rgba(16,185,129,0.1); }
        &.theme-private { color: #3b82f6; background: rgba(59,130,246,0.1); }
      }

      .hover-action-group {
        position: absolute; right: 12px; top: 50%; transform: translateY(-50%) translateX(10px);
        display: flex; gap: 6px; opacity: 0; transition: 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        background: var(--card-background); padding: 6px; border-radius: 12px; box-shadow: 0 4px 12px var(--shadow-color); border: 1px solid var(--border-color);

        .circle-btn {
          width: 32px; height: 32px; border-radius: 8px; background: transparent; border: none;
          display: flex; align-items: center; justify-content: center;
          color: var(--text-secondary); font-size: 14px; cursor: pointer; transition: 0.2s;
          &:hover { background: var(--hover-background); color: var(--link-color); }
          &.danger:hover { color: #ff3b30; background: rgba(255,59,48,0.1); }
        }
      }
    }
  }

  .load-more-zone {
    text-align: center; padding: 16px 0; font-size: 13px;
    .text-loading { color: var(--text-secondary); }
    .text-link { color: var(--link-color); cursor: pointer; font-weight: 500; &:hover { text-decoration: underline; } }
    .text-muted { color: var(--text-secondary); opacity: 0.6; }
  }
}

/* ==========================================
   隐藏式拖拽条
   ========================================== */
.panel-divider-line {
  width: 4px; background: transparent; cursor: col-resize; z-index: 10; position: relative; margin: 0 -2px;
  &::after { content: ''; position: absolute; left: 1px; width: 2px; height: 100%; background: transparent; transition: 0.3s; }
  &:hover::after, &:active::after { background: var(--link-color); opacity: 0.5; }
}

/* ==========================================
   右侧主舞台 (聊天窗口)
   ========================================== */
.chat-main-stage {
  flex: 1; display: flex; flex-direction: column; background: var(--chat-background); min-width: 0;

  .stage-top-bar {
    height: 70px; padding: 0 24px; display: flex; justify-content: space-between; align-items: center;
    background: var(--chat-header-background); border-bottom: 1px solid var(--chat-header-border); z-index: 10;

    .target-info-area {
      display: flex; align-items: center; gap: 14px; cursor: pointer;
      .target-avatar { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; border: 2px solid transparent; transition: 0.2s; &:hover { border-color: var(--link-color); transform: scale(1.05); } }
      .target-text {
        display: flex; flex-direction: column; gap: 2px;
        .target-name { font-size: 17px; font-weight: 600; color: var(--chat-header-text); margin: 0; }
        .target-status {
          font-size: 12px; display: flex; align-items: center; gap: 6px;
          .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #d1d5db; &.is-online{background:#10b981;box-shadow:0 0 0 2px rgba(16,185,129,0.2);} }
          .status-label { color: var(--text-secondary); &.is-online{color:#10b981;font-weight:500;} }
          .status-badge.group { background: rgba(59,130,246,0.1); color: var(--link-color); padding: 2px 8px; border-radius: 12px; font-weight: 600; }
        }
      }
    }

    .action-icons-area {
      display: flex; gap: 12px;
      .soft-btn {
        padding: 8px 16px; border-radius: 20px; border: none; background: var(--hover-background);
        font-size: 13px; font-weight: 500; color: var(--text-primary); cursor: pointer; display: flex; align-items: center; gap: 6px; transition: 0.2s;
        &:hover { background: var(--border-color); color: var(--link-color); }
        &.primary { background: rgba(59,130,246,0.1); color: var(--link-color); &:hover{background:var(--link-color);color:#fff;} }
      }
    }
  }

  .room-container { flex: 1; position: relative; overflow: hidden; }

  /* 欢迎引导页 (带悬浮动画) */
  .welcome-blank-page {
    flex: 1; display: flex; align-items: center; justify-content: center; background: var(--chat-background);
    .welcome-box {
      text-align: center; display: flex; flex-direction: column; align-items: center;
      .floating-hero { width: 240px; margin-bottom: 30px; animation: gentleFloat 3s ease-in-out infinite; filter: drop-shadow(0 20px 30px rgba(0,0,0,0.08)); }
      .welcome-text { font-size: 16px; font-weight: 500; color: var(--text-secondary); letter-spacing: 1px; }
    }
  }
}

/* 部落页主内容和推荐容器 - 添加弹性高度保证滚动 */
.tribe-list-wrapper {
  flex: 1; height: 100%; overflow-y: auto; overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}
.tribe-full-page {
  flex: 1; height: 100%; overflow-y: auto; overflow-x: hidden; position: relative;
  -webkit-overflow-scrolling: touch;
}

/* ==========================================
   原生毛玻璃弹窗 (精美版)
   ========================================== */
.native-modal-overlay {
  position: fixed; inset: 0; background: rgba(0, 0, 0, 0.45); backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center; z-index: 9999; animation: overlayFade 0.2s ease;
}

.native-modal-card {
  background: var(--card-background); width: 360px; padding: 28px; border-radius: 20px; text-align: center;
  box-shadow: 0 24px 48px rgba(0,0,0,0.2); animation: cardPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); border: 1px solid var(--border-color);

  .modal-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; .m-0{margin:0;} .close-icon{cursor:pointer;color:var(--text-secondary);font-size:18px;transition:0.2s;&:hover{color:var(--text-primary);transform:rotate(90deg);}} .close-btn{background:transparent;border:none;} }

  .modal-icon {
    width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
    font-size: 28px; margin: 0 auto 20px;
    &.success { background: rgba(16,185,129,0.1); color: #10b981; }
    &.danger { background: rgba(239,68,68,0.1); color: #ef4444; }
  }

  .modal-title { font-size: 18px; font-weight: 600; color: var(--text-primary); margin-bottom: 12px; }

  .modal-body {
    font-size: 15px; color: var(--text-secondary); margin-bottom: 28px; line-height: 1.6;
    .highlight-text { font-weight: 700; &.success{color:#10b981;} &.primary{color:var(--link-color);} }
    .sub-text { font-size: 13px; margin-top: 8px; opacity: 0.8; }

    .elegant-input {
      width: 100%; height: 44px; padding: 0 16px; border-radius: 12px; border: 1px solid var(--border-color);
      background: var(--hover-background); color: var(--text-primary); font-size: 15px; outline: none; transition: 0.2s;
      &:focus { background: var(--card-background); border-color: var(--link-color); box-shadow: 0 0 0 3px rgba(59,130,246,0.15); }
    }

    .info-panel { background: var(--hover-background); padding: 16px; border-radius: 12px; text-align: left; }

    &.text-left { text-align: left; }
    &.rich-text { text-align: left; ul { padding-left: 20px; margin-top: 12px; li { margin-bottom: 8px; } } }
  }

  .modal-footer {
    display: flex; gap: 12px;
    button { flex: 1; padding: 12px 0; border-radius: 12px; font-size: 15px; font-weight: 600; border: none; cursor: pointer; transition: 0.2s; }
    .btn-ghost { background: var(--hover-background); color: var(--text-primary); &:hover{filter:brightness(0.95);} }
    .btn-solid {
      color: #fff;
      &.primary { background: var(--link-color); &:hover{opacity:0.9;box-shadow:0 4px 12px rgba(59,130,246,0.3);} }
      &.success { background: #10b981; &:hover{opacity:0.9;box-shadow:0 4px 12px rgba(16,185,129,0.3);} }
      &.danger { background: #ef4444; &:hover{opacity:0.9;box-shadow:0 4px 12px rgba(239,68,68,0.3);} }
      &:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none !important; }
    }
    .w-full { width: 100%; flex: none; }
    .mt-4 { margin-top: 16px; }
  }

  &.align-left { text-align: left; }
  &.user-list-modal {
    width: 400px; padding: 24px;
    .user-list-view { max-height: 360px; overflow-y: auto; margin: 0 -12px; padding: 0 12px; }
    .empty-state { text-align: center; color: var(--text-secondary); padding: 40px 0; .empty-icon { font-size: 40px; margin-bottom: 12px; } }
    .user-row {
      display: flex; align-items: center; gap: 14px; padding: 12px; border-radius: 12px; cursor: pointer; transition: 0.2s;
      &:hover { background: var(--hover-background); }
      .u-avatar { position: relative; img{width:44px;height:44px;border-radius:50%;object-fit:cover;} .online-indicator{position:absolute;bottom:2px;right:0;width:12px;height:12px;background:#10b981;border-radius:50%;border:2px solid var(--card-background);} }
      .u-info { text-align: left; .u-name{font-size:15px;color:var(--text-primary);font-weight:600;} .u-role{font-size:12px;color:var(--text-secondary);} }
    }
  }
}

/* ==========================================
   动画与滚动条
   ========================================== */
@keyframes gentleFloat { 0% { transform: translateY(0px); } 50% { transform: translateY(-15px); } 100% { transform: translateY(0px); } }
@keyframes overlayFade { from { opacity: 0; } to { opacity: 1; } }
@keyframes cardPop { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }

::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.15); border-radius: 3px; &:hover { background: rgba(0, 0, 0, 0.25); } }

/* ==========================================
   移动端深度优化适配 (Mobile Responsive)
   ========================================== */
.mobile-back-btn { display: none; }

@media (max-width: 768px) {
  .pc-chat-app-wrapper {
    height: 100vh !important;
    margin: 0 !important;
    border-radius: 0 !important;
    border: none !important;
    position: relative;
    overflow: hidden;

    /* 1. 当处于 Tribe 部落标签时，采用【上下分屏】显示 */
    &.is-tribe-tab {
      flex-direction: column;
      .chat-side-panel {
        width: 100% !important;
        height: 35vh !important; /* 上方分配给左侧面板 (推荐列表) */
        flex: none;
        border-right: none;
        border-bottom: 1px solid var(--border-color);
      }
      .chat-main-stage {
        position: relative;
        transform: none;
        width: 100%;
        height: 65vh !important; /* 下方分配给右侧面板 (部落大列表) */
        flex: 1;
      }
    }
  }

  /* 2. 当处于 Chat 会话标签时，采用【左右侧滑抽屉】显示 */
  .pc-chat-app-wrapper:not(.is-tribe-tab) {
    .chat-side-panel {
      width: 100% !important;
      height: 100%;
      flex: none;
    }

    .panel-divider-line {
      display: none !important;
    }

    .chat-main-stage {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 50;
      /* 默认右侧移出屏幕 */
      transform: translateX(100%);
      transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
      background: var(--chat-background);

      /* 选中聊天时，滑入全屏 */
      &.mobile-active-stage {
        transform: translateX(0);
      }
    }
  }

  /* 移动端专属返回键显示 */
  .mobile-back-btn {
    display: flex !important;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    margin-right: 8px;
    border: none;
    background: transparent;
    color: var(--text-primary);
    font-size: 20px;
    cursor: pointer;
    transition: background 0.2s;
    border-radius: 50%;
    &:active {
      background: var(--hover-background);
    }
  }

  .stage-top-bar {
    padding: 0 16px !important;
  }

  .panel-header-zone {
    padding: 16px 16px 12px !important;
  }
}
</style>
