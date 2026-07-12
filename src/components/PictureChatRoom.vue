<template>
  <div class="yuemu-chat-room">
    <div class="yuemu-chat-content">
      <div class="yuemu-messages-container">
        <div v-if="loadingHistory && !initialLoading" class="yuemu-top-loading-indicator">
          <a-spin size="small" />
          <span>{{ t('components.pictureChatRoom.loadingHistory') }}</span>
        </div>

        <div class="yuemu-chat-messages" ref="messageContainer" @scroll.passive="handleScroll">
          <div v-if="initialLoading" class="yuemu-loading-state">
            <a-spin size="large" :indicator="spinnerIcon" />
          </div>

          <div v-else-if="!messages.length" class="yuemu-empty-state">
            <div class="yuemu-empty-icon"><i class="fas fa-comments"></i></div>
            <p>{{ t('components.pictureChatRoom.noMessages') }}</p>
          </div>

          <template v-else>
            <div v-if=" !loadingHistory && !checkingMore" class="yuemu-system-message">
              <div class="yuemu-no-more-message">
                <span>{{ t('components.pictureChatRoom.reachedTop') }}</span>
                <a-button
                  type="link"
                  size="small"
                  :loading="manualLoadingHistory"
                  @click="manualLoadHistory"
                  class="yuemu-reload-btn"
                >
                  <template #icon><ReloadOutlined /></template>
                  {{ t('components.pictureChatRoom.reload') }}
                </a-button>
              </div>
            </div>

            <template v-for="(msg, index) in messages" :key="msg.id">
              <div v-if="shouldShowTimestamp(msg, messages[index - 1])" class="yuemu-timestamp-divider">
                {{ formatMessageDivider(msg.createTime) }}
              </div>

              <div
                class="yuemu-message-item"
                :class="{
                  'yuemu-message-self': msg.sender?.id === loginUser?.id,
                  'yuemu-message-system': msg.senderId === '0',
                  'yuemu-message-recalled': msg.content === t('components.pictureChatRoom.messageRecalled'),
                  'yuemu-message-highlight': msg.id === selectedMessage?.id
                }"
                :data-message-id="msg.id"
              >
                <div
                  v-if="msg.content !== t('components.pictureChatRoom.messageRecalled')"
                  class="yuemu-message-avatar"
                  :style="{ backgroundImage: msg.senderId === '0' ?
                    'url(https://static.yuemutuku.com/space/1877028360151445505/2025-07-02_k9wqCp9awJ9iPEaC_thumbnail.webp)' :
                    `url(${msg.sender?.userAvatar})`
                  }"
                  @click="handleAvatarClick(msg.senderId === '0' ? null : msg.sender)"
                />

                <div class="yuemu-message-body">
                  <div v-if="msg.content !== t('components.pictureChatRoom.messageRecalled')" class="yuemu-message-username">
                    {{ msg.senderId === '0' ? t('components.pictureChatRoom.yuemuAssistant') : msg.sender?.userName || t('components.pictureChatRoom.user') }}
                    <span v-if="msg.senderId !== '0'" class="yuemu-location">{{ msg.messageLocation || t('components.pictureChatRoom.unknownLocation') }}</span>
                  </div>

                  <div class="yuemu-message-main" @click="showMessageActions(msg, $event)">
                    <div v-if="msg.messageType === 'text' || !msg.messageType" class="yuemu-text-bubble" v-html="msg.content === t('components.pictureChatRoom.messageRecalled') ? `${msg.senderId === '0' ? t('components.pictureChatRoom.yuemuAssistant') : msg.sender?.userName || t('components.pictureChatRoom.user')}${t('components.pictureChatRoom.recalledAMessage')}` : (msg.senderId === '0' ? parseMarkdown(msg.content) : linkifyText(msg.content))"></div>

                    <div v-else-if="msg.messageType === 'image'" class="yuemu-image-bubble">
                      <div v-if="msg.content === t('components.pictureChatRoom.messageRecalled')" class="yuemu-text-bubble">
                        {{ msg.senderId === '0' ? t('components.pictureChatRoom.yuemuAssistant') : msg.sender?.userName || t('components.pictureChatRoom.user') }}{{ t('components.pictureChatRoom.recalledAMessage') }}
                      </div>
                      <img
                        v-else
                        :src="msg.messageUrl"
                        :alt="msg.content || t('components.pictureChatRoom.image')"
                        class="yuemu-message-image"
                        @click.stop="openImagePreview(msg)"
                      />
                    </div>

                    <div v-else-if="msg.messageType === 'audio'" class="yuemu-audio-bubble">
                      <div v-if="msg.content === t('components.pictureChatRoom.messageRecalled')" class="yuemu-text-bubble">
                        {{ msg.senderId === '0' ? t('components.pictureChatRoom.yuemuAssistant') : msg.sender?.userName || t('components.pictureChatRoom.user') }}{{ t('components.pictureChatRoom.recalledAMessage') }}
                      </div>
                      <AudioBubble
                        v-else
                        :url="msg.messageUrl"
                        :is-self="msg.sender?.id === loginUser?.id"
                      />
                    </div>

                    <div v-else-if="msg.messageType === 'video'" class="yuemu-video-bubble">
                      <video controls :src="msg.messageUrl" @play="handleVideoPlay" />
                    </div>

                    <div v-else-if="msg.senderId === '0'" class="yuemu-system-content" v-html="parseMarkdown(msg.content)" />

                    <div v-if="selectedMessage?.id === msg.id && !msg.isRecalled && selectedMessage?.senderId !== '0'" class="yuemu-message-actions">
                      <button type="button" class="yuemu-action-btn" @click.stop="handleReply(msg)">
                        {{ t('components.pictureChatRoom.reply') }}
                      </button>
                      <button type="button" class="yuemu-action-btn" @click.stop="handleCopy(msg)">
                        {{ t('components.pictureChatRoom.copy') }}
                      </button>
                      
                      <button type="button" class="yuemu-action-btn" @click.stop="handleSearch(msg)">
                        {{ t('components.pictureChatRoom.search') }}
                      </button>
                      <button
                        v-if="canRecallMessage(msg)"
                        type="button"
                        class="yuemu-action-btn"
                        @click.stop="handleRecall(msg)"
                      >
                        {{ t('components.pictureChatRoom.recall') }}
                      </button>
                      <button type="button" class="yuemu-action-btn" @click="() => openReportModal(selectedMessage?.senderId)" >
                        {{ t('components.pictureChatRoom.report') }}
                      </button>
                    </div>
                  </div>

                  <div v-if="msg.replyMessage" class="yuemu-reply-quote" @click="scrollToMessage(msg.replyMessage.id)">
                    <span class="yuemu-reply-label">
                      {{ t('components.pictureChatRoom.reply') }} {{ props.type !== 'private' ? ` ${msg.replyMessage.senderId === '0' ? t('components.pictureChatRoom.yuemuAssistant') : msg.replyMessage.sender?.userName || t('components.pictureChatRoom.user')}` : '' }}:
                    </span>
                    <span v-html="msg.replyMessage.senderId === '0' ? parseMarkdown(msg.replyMessage.content) : msg.replyMessage.content"></span>
                  </div>
                </div>
              </div>
            </template>
          </template>
        </div>

        <div v-if="scrollState.hasNewMessage" class="yuemu-new-message-tip" @click="scrollToNewMessage">
          <DownOutlined />
          <span>{{ scrollState.unreadCount }}{{ t('components.pictureChatRoom.newMessages') }}</span>
        </div>

        <div class="yuemu-chat-input">
          <div v-if="replyTo" class="yuemu-reply-preview">
            <span>
              {{ t('components.pictureChatRoom.reply') }} <span v-if="props.type !== 'private'">{{ replyTo.senderId === '0' ? t('components.pictureChatRoom.yuemuAssistant') : replyTo.sender?.userName || t('components.pictureChatRoom.user') }}</span>:
              <span v-html="replyTo.senderId === '0' ? parseMarkdown(replyTo.content) : replyTo.content"></span>
            </span>
            <button class="yuemu-cancel-reply" @click="cancelReply" type="button">{{ t('components.pictureChatRoom.cancelReply') }}</button>
          </div>

          <div class="yuemu-gemini-input-wrapper" @mousedown.capture="handleButtonMousedown">
            <!-- Left Action: Upload -->
            <div class="yuemu-gemini-left-actions">
              <a-upload :show-upload-list="false" :before-upload="handleImageUpload" accept="image/*">
                <button class="yuemu-action-btn" type="button" :title="t('components.pictureChatRoom.uploadImage')">
                  <i class="fas fa-plus"></i>
                </button>
              </a-upload>
            </div>

            <!-- Center: Textarea -->
            <textarea
              ref="messageInput"
              v-model="inputMessage"
              class="yuemu-gemini-textarea"
              :placeholder="t('components.pictureChatRoom.askSomething')"
              rows="1"
              @keydown.enter.exact.prevent="sendMessage"
              @input="handleInput"
              :disabled="!loginUser"
            ></textarea>

            <!-- Right Actions: Emoji and Send -->
            <div class="yuemu-gemini-right-actions">
              <div class="yuemu-emoji-container">
                <button class="yuemu-action-btn yuemu-emoji-btn" :class="{ 'is-active': showEmojiPicker }" @click="toggleEmojiPicker" type="button" :title="t('components.pictureChatRoom.emoji')">
                  <i class="far fa-smile"></i>
                </button>
                <div v-if="showEmojiPicker" class="yuemu-emoji-panel">
                  <EmojiPicker @select="onEmojiSelect" />
                </div>
              </div>

              <button class="yuemu-gemini-send-btn" :class="{'can-send': inputMessage.trim()}" :disabled="(!inputMessage.trim() && !isRecording) || !loginUser" @click="sendMessage" type="button" :title="t('components.pictureChatRoom.send')">
                <LoadingOutlined v-if="loadingHistory" spin />
                <i v-else class="fas fa-paper-plane"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showMentionBox && String(props.spaceId) === '-2'" class="yuemu-mention-box" :style="mentionBoxStyle">
      <div class="yuemu-mention-item" @click="selectMention">
        <div class="yuemu-mention-avatar">
          <img src="https://static.yuemutuku.com/space/1877028360151445505/2025-07-02_k9wqCp9awJ9iPEaC_thumbnail.webp" :alt="t('components.pictureChatRoom.yuemuAssistant')" />
        </div>
        <div class="yuemu-mention-info">
          <div class="yuemu-mention-name">{{ t('components.pictureChatRoom.yuemuAssistant') }}</div>
          <div class="yuemu-mention-desc">{{ t('components.pictureChatRoom.aiAssistant') }}</div>
        </div>
      </div>
    </div>

    <teleport to="body">
      <div v-if="showUserModal" class="yuemu-user-modal-overlay" @click="toggleUserModal">
        <div class="yuemu-user-modal-content" @click.stop>
          <div class="yuemu-modal-header">
            <h3 class="yuemu-modal-title">
              {{ t('components.pictureChatRoom.onlineUsers') }} ({{ onlineUsers.length }})
            </h3>
            <button class="yuemu-modal-close" @click="toggleUserModal" type="button">
              ✕
            </button>
          </div>
          <div class="yuemu-modal-body">
            <div v-if="!onlineUsers.length" class="yuemu-empty-users">
              <div class="yuemu-empty-icon"><i class="fas fa-users"></i></div>
              <p>{{ t('components.pictureChatRoom.noOnlineUsers') }}</p>
            </div>
            <div v-else class="yuemu-users-scroll">
              <div
                v-for="user in onlineUsers"
                :key="user.id"
                class="yuemu-user-item"
                @click="handleAvatarClick(user)"
              >
                <div class="yuemu-user-avatar" :style="{ backgroundImage: `url(${user.userAvatar})` }">
                  <div class="yuemu-online-dot"></div>
                </div>
                <div class="yuemu-user-meta">
                  <div class="yuemu-user-name">{{ user.userName }}</div>
                  <div class="yuemu-user-role">{{ user.userRole === 'admin' ? t('components.pictureChatRoom.admin') : t('components.pictureChatRoom.user') }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </teleport>

    <div v-if="isRecording" class="yuemu-voice-modal">
      <div class="yuemu-voice-content">
        <div class="yuemu-wave-bars">
          <div class="yuemu-wave-bar" v-for="i in 12" :key="i" />
        </div>
        <div class="yuemu-voice-info">
          <span class="yuemu-voice-time">{{ recordingTime }}s</span>
          <span class="yuemu-voice-tip">{{ t('components.pictureChatRoom.releaseToSend') }}</span>
        </div>
      </div>
    </div>

    <teleport to="body">
      <div v-if="showActions && selectedMessage?.senderId !== '0'" class="yuemu-action-menu" :style="actionMenuStyle">
        <button class="yuemu-action-item" @click="() => handleReply(selectedMessage)" type="button">
          <span>{{ t('components.pictureChatRoom.reply') }}</span>
        </button>
        <button class="yuemu-action-item" @click="() => handleCopy(selectedMessage)" type="button">
          <span>{{ t('components.pictureChatRoom.copy') }}</span>
        </button>
        
        <button class="yuemu-action-item" @click="() => handleSearch(selectedMessage)" type="button">
          <span>{{ t('components.pictureChatRoom.search') }}</span>
        </button>
        <button class="yuemu-action-item" @click="() => openReportModal(selectedMessage?.senderId)" type="button">
          <span>{{ t('components.pictureChatRoom.report') }}</span>
        </button>
      </div>
    </teleport>

    <ReportModal
      ref="reportModalRef"
      :target-type="reportTargetType"
      :target-id="reportTargetId"
    />
    <ImagePreview
      v-model:visible="showImagePreview"
      :images="previewImages"
      :initialIndex="previewInitialIndex"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { ref, onMounted, onUnmounted, computed, nextTick, onBeforeUnmount, h, onActivated, onDeactivated } from 'vue'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import ChatWebSocket from '@/utils/chatWebSocket'
import { getDefaultAvatar } from '@/utils/userUtils'
import { parseMarkdown } from '@/utils/markdownParser'
import { uploadPostImageUsingPost } from '@/api/pictureController'
import {
  ReloadOutlined,
  TeamOutlined,
  LoadingOutlined,
  DownOutlined,
  AudioOutlined,
  VideoCameraOutlined,
  NotificationOutlined
} from '@ant-design/icons-vue'
import EmojiPicker from './EmojiPicker.vue'
import { uploadAudioUsingPost } from '@/api/audioFileController'
import AudioBubble from './AudioBubble.vue'
import { useDebounceFn } from '@vueuse/core'
import { ImageCompressor } from '@/utils/imageCompressor'
import ReportModal from '@/components/ReportModal.vue'
import ImagePreview from '@/components/ImagePreview.vue'

interface ChatMessage {
  id: string | number
  type: number | 'loadMore' | 'getOnlineUsers' | 'RECALL' | 'heartbeat'
  content?: string
  messageId?: number | string
  pictureId?: string | number
  spaceId?: string | number
  privateChatId?: string | number
  senderId?: string | number
  sender?: {
    id: string | number
    userName: string
    userAvatar?: string
    userRole?: string
  }
  status?: 'RECALL' | string
  createTime?: string
  replyId?: string | number
  rootId?: string | number
  replyMessage?: ChatMessage
  isAtAI?: boolean
  messageType?: string
  messageUrl?: string
  messageSize?: number
  messageLocation?: string
  [key: string]: unknown
}

interface WebSocketMessage {
  type: 'history' | 'moreHistory' | 'onlineUsers' | 'message' | 'RECALL'
  messages?: ChatMessage[]
  message?: ChatMessage
  onlineUsers?: OnlineUser[]
  hasMore?: boolean
  messageId?: string | number
  id?: string | number
  content?: string
  sender?: {
    id: string | number
    userName: string
    userAvatar?: string
    userRole?: string
  }
  createTime?: string
  messageType?: string
  messageUrl?: string
  messageSize?: number
  messageLocation?: string
}

interface OnlineUser {
  id: string | number
  userName: string
  userAvatar: string
  userRole: string
  userAccount: string
  createTime: string
}

interface MessageData {
  type: 'message' | 'CHAT' | 'RECALL' | number
  content: string
  messageType?: string
  messageLocation?: string
  messageUrl?: string
  messageSize?: number
  pictureId?: string
  spaceId?: string
  privateChatId?: string
  replyId?: string | number
  rootId?: string | number
  isAtAI?: boolean
  id?: string | number
}

const { t } = useI18n();
const props = defineProps<{
  pictureId?: number | string
  spaceId?: number | string
  privateChatId?: number | string
  type?: 'chat' | 'space' | 'private'
}>()

const loginUserStore = useLoginUserStore()
const loginUser = computed(() => loginUserStore.loginUser)

const chatWs = ref<ChatWebSocket | null>(null)
const connected = ref(false)
const messages = ref<ChatMessage[]>([])
const inputMessage = ref('')
const messageContainer = ref<HTMLElement | null>(null)
const messageInput = ref<HTMLInputElement | null>(null)

const imagesLoadingCount = ref(0)
const scrollAfterImagesLoaded = ref(false)
const initialHistoryLoaded = ref(false)

const current = ref(1)
const pageSize = ref(30)
const hasMore = ref(true)
const loadingHistory = ref(false)

const replyTo = ref<MessageData | null>(null)

const showEmojiPicker = ref(false)

const scrollState = ref({
  position: 0,
  lastHeight: 0,
  isAtTop: false,
  isAtBottom: true,
  hasNewMessage: false,
  unreadCount: 0
})

const checkingMore = ref(false)
const checkTimer = ref<ReturnType<typeof setTimeout> | null>(null)

const manualLoadingHistory = ref(false)
const manualPageSize = ref(50)

const reconnectTimer = ref<ReturnType<typeof setTimeout> | null>(null)
const maxReconnectAttempts = 5
const reconnectAttempts = ref(0)

const showUserModal = ref(false)

const onlineUsers = ref<OnlineUser[]>([])

const messageQueue = ref<MessageData[]>([])

const showImagePreview = ref(false)
const previewImages = ref<string[]>([])
const previewInitialIndex = ref(0)

const openImagePreview = (msg: ChatMessage) => {
  if (!msg.messageUrl) return
  // Collect all image messages from current chat to support swiping through history
  const imageMessages = messages.value.filter(m => m.messageType === 'image' && m.content !== t('components.pictureChatRoom.messageRecalled') && m.messageUrl)
  const urls = imageMessages.map(m => m.messageUrl as string)

  if (urls.length > 0) {
    previewImages.value = urls
    const index = urls.indexOf(msg.messageUrl as string)
    previewInitialIndex.value = index !== -1 ? index : 0
  } else {
    previewImages.value = [msg.messageUrl as string]
    previewInitialIndex.value = 0
  }
  showImagePreview.value = true
}

const emit = defineEmits<{
  (e: 'update:onlineUsers', users: OnlineUser[]): void
  (e: 'update:onlineCount', count: number): void
  (e: 'message', msg: WebSocketMessage): void
  (e: 'connected'): void
  (e: 'disconnected'): void
}>()

const router = useRouter()

const toggleUserModal = () => {
  showUserModal.value = !showUserModal.value
}

const toggleEmojiPicker = () => {
  showEmojiPicker.value = !showEmojiPicker.value
}

const onEmojiSelect = (emoji: string) => {
  inputMessage.value += emoji
  showEmojiPicker.value = false
}

const loadHistory = async () => {
  if (loadingHistory.value) return
  try {
    loadingHistory.value = true
    checkingMore.value = true

    const params = {
      ...(props.pictureId ? { pictureId: String(props.pictureId) } : {}),
      ...(props.spaceId ? { spaceId: String(props.spaceId) } : {}),
      ...(props.privateChatId ? { privateChatId: String(props.privateChatId) } : {}),
      page: current.value
    }
    chatWs.value?.sendMessage({
      type: 'loadMore',
      ...params
    })

    if (checkTimer.value) {
      clearTimeout(checkTimer.value)
    }
    checkTimer.value = setTimeout(() => {
      checkingMore.value = false
      if (messages.value.length === 0 || !hasMore.value) {
        hasMore.value = false
      }
      loadingHistory.value = false
    }, 3000)
  } catch {
    loadingHistory.value = false
    checkingMore.value = false
  }
}

const replyToMessage = (msg: ChatMessage) => {
  if (msg && msg.id) {
    replyTo.value = {
      id: String(msg.id),
      type: msg.type,
      content: msg.content,
      pictureId: msg.pictureId || '',
      senderId: msg.senderId,
      status: msg.status,
      replyId: msg.replyId,
      rootId: msg.rootId,
      sender: msg.sender ? {
        id: String(msg.sender.id),
        userName: msg.sender.userName || '',
        userAvatar: msg.sender.userAvatar || getDefaultAvatar(msg.sender.userName)
      } : undefined
    }
  }
}

const cancelReply = () => {
  replyTo.value = null
}

const handleButtonMousedown = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (target.closest('.yuemu-send-btn, .yuemu-action-btn, .yuemu-emoji-btn')) {
    e.preventDefault()
    messageInput.value?.focus()
  }
}

const sendMessage = async () => {
  if (!loginUser.value || (!inputMessage.value.trim() && !isRecording.value)) {
    return
  }

  const wasFocused = document.activeElement === messageInput.value

  try {
    const location = await getLocation()

    const messageData: ChatMessage = {
      type: props.spaceId === -2 ? 3 : 'message',
      content: inputMessage.value.trim(),
      messageType: 'text',
      messageLocation: location,
      ...(props.pictureId ? { pictureId: String(props.pictureId) } : {}),
      ...(props.spaceId ? { spaceId: String(props.spaceId) } : {}),
      ...(props.privateChatId ? { privateChatId: String(props.privateChatId) } : {})
    };

    if (replyTo.value) {
      messageData.replyId = replyTo.value.id
      messageData.rootId = replyTo.value.rootId || replyTo.value.id
    }

    messageData.isAtAI = inputMessage.value.includes(`@${t('components.pictureChatRoom.yuemuAssistant')}`)

    if (chatWs.value?.isConnected()) {
      chatWs.value.sendMessage(messageData)
    } else {
      messageQueue.value.push(messageData)
      if (!chatWs.value) {
        initWebSocket()
      }
      else if (!chatWs.value.isConnected() && !chatWs.value.isConnecting()) {
        chatWs.value.connect()
      }
      message.info(t('components.pictureChatRoom.msgSubmitted'))
    }

    inputMessage.value = ''
    replyTo.value = null

    // 重置输入框高度
    if (messageInput.value) {
      messageInput.value.style.height = 'auto'
    }

    if (wasFocused) {
      messageInput.value?.focus()
    }
  } catch (error) {
    console.error('发送消息失败:', error)
    message.error(t('components.pictureChatRoom.sendFailed'))
    messageInput.value?.focus()
  }
}

const handleScroll = (e: Event) => {
  const target = e.target as HTMLElement
  scrollState.value.position = target.scrollTop
  scrollState.value.lastHeight = target.scrollHeight
  scrollState.value.isAtTop = target.scrollTop <= 1

  const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 50
  scrollState.value.isAtBottom = isNearBottom

  if (isNearBottom) {
    scrollState.value.hasNewMessage = false
  }

  if (target.scrollTop <= 30 && !loadingHistory.value && hasMore.value) {
    loadHistory()
  }

  if (target.scrollTop <= 5 && !loadingHistory.value && !hasMore.value && !checkingMore.value) {
    hasMore.value = true
    loadHistory()
  }
}

const scrollToBottom = (force: boolean = false) => {
  if (!messageContainer.value) return

  if (force || scrollState.value.isAtBottom) {
    setTimeout(() => {
      if (messageContainer.value) {
        messageContainer.value.scrollTop = messageContainer.value.scrollHeight
        scrollState.value.position = messageContainer.value.scrollTop
        scrollState.value.lastHeight = messageContainer.value.scrollHeight
        scrollState.value.hasNewMessage = false
        scrollState.value.unreadCount = 0
      }
    }, 50)
  } else {
    const lastMessage = messages.value[messages.value.length - 1]
    if (lastMessage && lastMessage.sender?.id !== loginUser.value?.id) {
      scrollState.value.hasNewMessage = true
      scrollState.value.unreadCount++
    }
  }
}

const scrollToNewMessage = () => {
  scrollToBottom(true)
}

const shouldShowTimestamp = (current: ChatMessage, prev: ChatMessage | undefined): boolean => {
  if (!prev) return true
  return dayjs(current.createTime).diff(dayjs(prev.createTime), 'minute') >= 60
}

const formatMessageDivider = (time: string) => {
  const msgTime = dayjs(time)
  const now = dayjs()
  if (msgTime.isSame(now, 'day')) return msgTime.format('HH:mm')
  if (msgTime.isSame(now.subtract(1, 'day'), 'day')) return t('components.pictureChatRoom.yesterday') + ' ' + msgTime.format('HH:mm')
  if (msgTime.isSame(now.subtract(2, 'day'), 'day')) return t('components.pictureChatRoom.dayBeforeYesterday') + ' ' + msgTime.format('HH:mm')
  if (msgTime.isSame(now, 'year')) return msgTime.format('MM-DD HH:mm')
  return msgTime.format('YYYY-MM-DD HH:mm')
}

interface UserProfile {
  id: string | number
  userName: string
  userAvatar?: string
  userAccount?: string
  createTime?: string
}

const handleAvatarClick = (user: UserProfile | null) => {
  if (!user?.id) return
  router.push({
    path: `/user/${user.id}`,
    query: {
      userName: user.userName,
      userAvatar: user.userAvatar || getDefaultAvatar(user.userName),
      userAccount: user.userAccount,
      createTime: user.createTime
    }
  })
}

const manualLoadHistory = async () => {
  if (manualLoadingHistory.value) return
  try {
    manualLoadingHistory.value = true
    checkingMore.value = true

    const params = {
      ...(props.pictureId ? { pictureId: String(props.pictureId) } : {}),
      ...(props.spaceId ? { spaceId: String(props.spaceId) } : {}),
      ...(props.privateChatId ? { privateChatId: String(props.privateChatId) } : {}),
      page: current.value,
      pageSize: manualPageSize.value
    }
    chatWs.value?.sendMessage({
      type: 'loadMore',
      ...params
    })

    if (checkTimer.value) {
      clearTimeout(checkTimer.value)
    }
    checkTimer.value = setTimeout(() => {
      checkingMore.value = false
      manualLoadingHistory.value = false
      if (messages.value.length === 0 || !hasMore.value) {
        hasMore.value = false
      }
    }, 5000)
  } catch {
    manualLoadingHistory.value = false
    checkingMore.value = false
  }
}

const reconnect = () => {
  if (reconnectAttempts.value >= maxReconnectAttempts) {
    console.log('达到最大重连次数，停止重连')
    message.error(t('components.pictureChatRoom.disconnected'))
    return
  }

  if (reconnectTimer.value) {
    clearTimeout(reconnectTimer.value)
  }

  if (connected.value && chatWs.value?.isConnected()) {
    console.log('WebSocket已连接，不需要重连')
    return
  }

  reconnectTimer.value = setTimeout(() => {
    console.log('尝试重新连接...')
    reconnectAttempts.value++
    initWebSocket()
  }, 3000)
}

const initWebSocket = () => {
  if (!loginUser.value) {
    message.error(t('components.pictureChatRoom.loginFirst'))
    return
  }

  if (chatWs.value?.isConnected()) {
    console.log('[聊天室] WebSocket连接已存在且正常')
    connected.value = true
    return
  }

  if (chatWs.value) {
    console.log('[聊天室] 销毁旧的WebSocket连接')
    chatWs.value.destroy()
    chatWs.value = null
  }

  current.value = 1
  hasMore.value = true
  loadingHistory.value = false
  checkingMore.value = false
  messages.value = []
  initialLoading.value = true

  let chatType: 'chat' | 'space' | 'private' = 'chat'
  if (props.spaceId) {
    chatType = 'space'
  } else if (props.privateChatId) {
    chatType = 'private'
  }

  console.log('[聊天室] 创建新的WebSocket连接')
  chatWs.value = new ChatWebSocket({
    pictureId: props.pictureId,
    spaceId: props.spaceId,
    privateChatId: props.privateChatId,
    type: chatType
  })

  chatWs.value.on('open', () => {
    console.log('[聊天室] WebSocket连接成功')
    connected.value = true
    reconnectAttempts.value = 0
    emit('connected')

    if (messageQueue.value.length > 0) {
      console.log(`[聊天室] 发送队列中的 ${messageQueue.value.length} 条消息`)
      messageQueue.value.forEach(msg => {
        chatWs.value?.sendMessage(msg)
      })
      messageQueue.value = []
      message.success('消息已发送')
    }
  })

  chatWs.value.on('close', () => {
    console.log('[聊天室] WebSocket连接已断开')
    connected.value = false
    emit('disconnected')
    if (!destroyed.value && document.visibilityState === 'visible') {
      reconnect()
    }
  })

  chatWs.value.on('error', () => {
    console.log('[聊天室] WebSocket连接发生错误')
    connected.value = false
    if (!destroyed.value && document.visibilityState === 'visible') {
      reconnect()
    }
  })

  chatWs.value.on('message', (msg: WebSocketMessage) => {
    if (msg.type === 'history') {
      console.log('收到初始历史消息:', msg.messages)
      if (msg.messages) {
        messages.value = msg.messages
          .filter((m: ChatMessage) => m.content?.trim())
          .map((m: ChatMessage) => ({
            ...m,
            sender: m.sender ? {
              ...m.sender,
              userAvatar: m.sender.userAvatar || getDefaultAvatar(m.sender.userName)
            } : null
          }))
          .reverse()
      }

      initialLoading.value = false

      if (checkTimer.value) {
        clearTimeout(checkTimer.value)
      }
      hasMore.value = msg.messages ? msg.messages.length >= pageSize.value : false
      current.value++
      loadingHistory.value = false
      checkingMore.value = false
      initialHistoryLoaded.value = true

      setTimeout(() => {
        safeScrollToBottom(true)
        setTimeout(() => {
          safeScrollToBottom(true)
        }, 300)
      }, 150)
      manualLoadingHistory.value = false
    } else if (msg.type === 'moreHistory') {
      console.log('收到更多历史消息:', msg.messages)
      const oldScrollHeight = messageContainer.value?.scrollHeight || 0
      const oldScrollTop = messageContainer.value?.scrollTop || 0

      const newMessages = msg.messages
        .filter((m: ChatMessage) => m.content?.trim())
        .map((m: ChatMessage) => ({
          ...m,
          sender: m.sender ? {
            ...m.sender,
            userAvatar: m.sender.userAvatar || getDefaultAvatar(m.sender.userName)
          } : null
        }))
        .reverse()

      if (checkTimer.value) {
        clearTimeout(checkTimer.value)
      }
      checkingMore.value = false
      manualLoadingHistory.value = false

      if (newMessages.length === 0) {
        loadingHistory.value = false
        return
      }

      messages.value = [...newMessages, ...messages.value]
      hasMore.value = msg.hasMore &&
        (manualLoadingHistory.value ?
          newMessages.length >= manualPageSize.value :
          newMessages.length >= pageSize.value)
      current.value++
      loadingHistory.value = false

      nextTick(() => {
        if (messageContainer.value) {
          const newScrollHeight = messageContainer.value.scrollHeight
          const heightDiff = newScrollHeight - oldScrollHeight
          messageContainer.value.scrollTop = oldScrollTop + heightDiff
        }
      })
    } else if (msg.type === 'RECALL' && msg.messageId) {
      console.log('收到撤回消息:', msg.messageId)
      const messageIndex = messages.value.findIndex(m => String(m.id) === String(msg.messageId))
      if (messageIndex !== -1) {
        messages.value[messageIndex].status = 'recalled'
        messages.value[messageIndex].content = t('components.pictureChatRoom.messageRecalled')
      }
      emit('message', msg)
    } else if (msg.type === 'message' && msg.message) {
      const newMessage = msg.message
      if (!messages.value.some(m => m.id === newMessage.id) && newMessage.content?.trim()) {
        messages.value.push({
          ...newMessage,
          sender: newMessage.sender ? {
            ...newMessage.sender,
            userAvatar: newMessage.sender.userAvatar || getDefaultAvatar(newMessage.sender.userName)
          } : null,
          createTime: newMessage.createTime || dayjs().format('YYYY-MM-DD HH:mm:ss')
        })
        if (newMessage.sender?.id !== loginUser.value?.id) {
          safeScrollToBottom(false)
        } else {
          safeScrollToBottom(true)
        }
      }
      // 核心修复：必须将消息向外抛出，通知外部组件更新左侧列表！
      emit('message', { type: 'message', data: newMessage })
    } else if (msg.type === 'onlineUsers') {
      onlineUsers.value = msg.onlineUsers || []
      emit('update:onlineUsers', msg.onlineUsers || [])
      emit('update:onlineCount', msg.onlineUsers?.length || 0)
      emit('message', msg)
    } else {
      if (!messages.value.some(m => m.id === msg.id) && msg.content?.trim()) {
        const newMessage = {
          ...msg,
          sender: msg.sender ? {
            ...msg.sender,
            userAvatar: msg.sender.userAvatar || getDefaultAvatar(msg.sender.userName)
          } : null,
          createTime: msg.createTime || dayjs().format('YYYY-MM-DD HH:mm:ss')
        }
        messages.value.push(newMessage)
        if (msg.sender?.id !== loginUser.value?.id) {
          safeScrollToBottom(false)
        } else {
          safeScrollToBottom(true)
        }
      }
      // 核心修复：必须将消息向外抛出，通知外部组件更新左侧列表！
      emit('message', { type: 'message', data: msg })
    }
  })

  chatWs.value.connect()
}

defineExpose({
  initWebSocket,
  disconnect: () => {
    if (chatWs.value) {
      chatWs.value.disconnect()
    }
  }
})

const handleVisibilityChange = () => {
  const now = Date.now()
  if (now - lastVisibilityChange.value < MIN_VISIBILITY_INTERVAL) {
    return
  }
  lastVisibilityChange.value = now

  if (document.visibilityState === 'visible') {
    if (chatWs.value?.isConnected()) {
      console.log('[聊天室] 页面恢复可见，WebSocket连接正常')
      return
    }
    console.log('[聊天室] 页面恢复可见，检测到WebSocket未连接，准备重新连接')
    reconnectAttempts.value = 0
    initWebSocket()
  }
}

onMounted(() => {
  lastVisibilityChange.value = Date.now()
  document.addEventListener('visibilitychange', handleVisibilityChange)
  initWebSocket()
  chatWs.value?.on('message', handleRecallEvent)
  window.addEventListener('resize', handleResize)
  handleResize()
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  window.removeEventListener('resize', handleResize)
  if (reconnectTimer.value) {
    clearTimeout(reconnectTimer.value)
  }
  if (chatWs.value) {
    chatWs.value.disconnect()
  }
  if (checkTimer.value) {
    clearTimeout(checkTimer.value)
  }
  emit('update:onlineCount', 0)
  emit('update:onlineUsers', [])
})

const showMentionBox = ref(false)
const mentionBoxStyle = ref({})
const mentionStartIndex = ref(-1)

const handleInput = (e: Event) => {
  const target = e.target as HTMLTextAreaElement
  const value = target.value
  const cursorPosition = target.selectionStart || 0

  // 自动调整高度
  target.style.height = 'auto'
  target.style.height = `${target.scrollHeight}px`

  if (value[cursorPosition - 1] === '@') {
    mentionStartIndex.value = cursorPosition - 1
    showMentionBox.value = true

    const inputRect = target.getBoundingClientRect()
    const isMobile = window.innerWidth <= 768

    if (isMobile) {
      mentionBoxStyle.value = {
        position: 'fixed',
        left: '16px',
        right: '16px',
        bottom: '80px',
        width: 'auto',
        top: 'auto',
        zIndex: 1000
      }
    } else {
      const textBeforeAt = value.substring(0, cursorPosition)
      const tempSpan = document.createElement('span')
      const inputStyle = window.getComputedStyle(target)
      tempSpan.style.font = inputStyle.font
      tempSpan.style.fontFamily = inputStyle.fontFamily
      tempSpan.style.fontSize = inputStyle.fontSize
      tempSpan.style.fontWeight = inputStyle.fontWeight
      tempSpan.style.letterSpacing = inputStyle.letterSpacing
      tempSpan.style.position = 'absolute'
      tempSpan.style.visibility = 'hidden'
      tempSpan.style.whiteSpace = 'pre'
      tempSpan.textContent = textBeforeAt

      document.body.appendChild(tempSpan)
      const spanRect = tempSpan.getBoundingClientRect()

      const atPositionTop = inputRect.top
      const atPositionLeft = inputRect.left + spanRect.width

      document.body.removeChild(tempSpan)

      mentionBoxStyle.value = {
        position: 'fixed',
        top: `${atPositionTop - 310}px`,
        left: `${atPositionLeft}px`,
        width: '240px',
        zIndex: 9999,
        maxHeight: '300px',
        overflowY: 'auto'
      }

      if (atPositionTop - 310 < 10) {
        mentionBoxStyle.value.top = `${inputRect.bottom + 8}px`
      }

      if (atPositionLeft + 240 > window.innerWidth) {
        mentionBoxStyle.value.left = `${Math.max(0, inputRect.left)}px`
      }
    }
  } else if (showMentionBox.value) {
    const textFromMentionStart = value.slice(mentionStartIndex.value, cursorPosition)
    if (!textFromMentionStart.startsWith('@') || textFromMentionStart.includes(' ')) {
      showMentionBox.value = false
    }
  }
}

const selectMention = () => {
  if (mentionStartIndex.value >= 0) {
    const beforeMention = inputMessage.value.slice(0, mentionStartIndex.value)
    const afterMention = inputMessage.value.slice(mentionStartIndex.value + 1)
    inputMessage.value = beforeMention + '@' + t('components.pictureChatRoom.yuemuAssistant') + ' ' + afterMention
  }
  showMentionBox.value = false
  mentionStartIndex.value = -1
  messageInput.value?.focus()
}

const handleInputBlur = () => {
  setTimeout(() => {
    showMentionBox.value = false
  }, 200)

  if (isRecording.value) {
    return
  }
}

const showActions = ref(false)
const actionMenuStyle = ref({})
const selectedMessage = ref<ChatMessage | null>(null)

const reportModalRef = ref()
const reportTargetType = ref<string>('')
const reportTargetId = ref<string>('')

const openReportModal = (userId: string | number) => {
  if (!userId) {
    message.error('无法获取用户信息，无法举报')
    showActions.value = false
    selectedMessage.value = null
    return
  }

  if (reportModalRef.value) {
    reportTargetType.value = '3'
    reportTargetId.value = userId.toString()

    reportModalRef.value.openModal(reportTargetType.value, reportTargetId.value)
  } else {
    message.error('举报组件未加载')
  }
  showActions.value = false
  selectedMessage.value = null
}

const showMessageActions = (msg: ChatMessage, event: MouseEvent) => {
  if (!event || !msg || msg.content === t('components.pictureChatRoom.messageRecalled') || msg.senderId === '0') return

  event.preventDefault()
  event.stopPropagation()

  if (selectedMessage.value?.id === msg.id) {
    selectedMessage.value = null
  } else {
    selectedMessage.value = msg
  }

  const closeMenu = (e: MouseEvent) => {
    const target = e.target as HTMLElement
    const isPreviewElement = target.closest('.ant-image-preview') ||
      target.closest('.ant-image-preview-mask') ||
      target.closest('.ant-image-preview-operations') ||
      target.closest('.ant-image-preview-img') ||
      target.classList.contains('ant-image-preview-wrap');

    if (!target.closest('.yuemu-message-actions') &&
      !target.closest('.yuemu-message-main') &&
      !isPreviewElement) {
      selectedMessage.value = null
      document.removeEventListener('click', closeMenu)
    }
  }

  document.removeEventListener('click', closeMenu)
  setTimeout(() => {
    document.addEventListener('click', closeMenu)
  }, 0)
}

const handleReply = (msg?: ChatMessage) => {
  const messageToReply = msg || selectedMessage.value;
  if (messageToReply) {
    replyToMessage(messageToReply)
    showActions.value = false
    selectedMessage.value = null
  }
}

const handleCopy = async (msg?: ChatMessage) => {
  const messageToCopy = msg || selectedMessage.value;
  if (messageToCopy?.content) {
    try {
      await navigator.clipboard.writeText(messageToCopy.content)
      message.success('复制成功')
    } catch (err) {
      message.error('复制失败，请手动复制')
    }
  }
  showActions.value = false
  selectedMessage.value = null
}

const handleTranslate = async (msg?: ChatMessage) => {
  const messageToTranslate = msg || selectedMessage.value;
  if (!messageToTranslate?.content) return
  try {
    const text = encodeURIComponent(messageToTranslate.content)
    window.open(`https://fanyi.baidu.com/#zh/en/${text}`, '_blank')
  } catch (err) {
    message.error('翻译失败，请稍后重试')
  }
  showActions.value = false
  selectedMessage.value = null
}

const handleSearch = async (msg?: ChatMessage) => {
  const messageToSearch = msg || selectedMessage.value;
  if (!messageToSearch?.content) return
  const searchText = encodeURIComponent(messageToSearch.content)
  window.open(`https://www.baidu.com/s?wd=${searchText}`, '_blank')
  showActions.value = false
  selectedMessage.value = null
}

const isMobile = ref(window.innerWidth <= 768)

const handleResize = () => {
  isMobile.value = window.innerWidth <= 768
}

const canRecallMessage = (msg: ChatMessage) => {
  if (!msg || !loginUser.value) return false
  if (msg.senderId !== loginUser.value.id) return false
  const messageTime = dayjs(msg.createTime)
  const now = dayjs()
  const diffSeconds = now.diff(messageTime, 'second')
  return diffSeconds <= 60 && msg.content !== t('components.pictureChatRoom.messageRecalled')
}

const handleRecall = (msg: ChatMessage) => {
  if (!chatWs.value || !msg.id) return
  try {
    chatWs.value.recallMessage(msg.id)
    showActions.value = false
    selectedMessage.value = null
  } catch {
    message.error('消息撤回失败，请重试')
  }
}

const handleRecallEvent = (data: WebSocketMessage) => {
  if (data.type === 'RECALL' && data.messageId && data.message) {
    const index = messages.value.findIndex(msg => msg.id === data.messageId)
    if (index !== -1) {
      messages.value[index] = data.message
    }
  }
}

onBeforeUnmount(() => {
  console.log('[聊天室] 组件卸载，清理WebSocket连接')
  destroyed.value = true
  if (chatWs.value) {
    chatWs.value.destroy()
    chatWs.value = null
  }
  if (reconnectTimer.value) {
    clearTimeout(reconnectTimer.value)
  }
  if (checkTimer.value) {
    clearTimeout(checkTimer.value)
  }
  emit('update:onlineCount', 0)
  emit('update:onlineUsers', [])
})

const initialLoading = ref(true)

const lastVisibilityChange = ref(Date.now())
const MIN_VISIBILITY_INTERVAL = 1000

const destroyed = ref(false)

const safeScrollToBottom = async (force: boolean = true) => {
  await nextTick()
  scrollToBottom(force)

  if (imagesLoadingCount.value > 0) {
    scrollAfterImagesLoaded.value = true
  } else {
    await nextTick()
    scrollToBottom(force)
  }
}

const handleImageStartLoading = () => {
  imagesLoadingCount.value++
}

const handleImageLoaded = () => {
  imagesLoadingCount.value--

  if (imagesLoadingCount.value <= 0 && scrollAfterImagesLoaded.value) {
    scrollAfterImagesLoaded.value = false
    setTimeout(() => {
      scrollToBottom(true)
    }, 200)
  } else if (imagesLoadingCount.value <= 0) {
    setTimeout(() => {
      scrollToBottom(true)
    }, 200)

    if (initialHistoryLoaded.value) {
      setTimeout(() => {
        scrollToBottom(true)
      }, 400)
    }
  }
}

const handlePreviewVisibleChange = (visible: boolean) => {
  if (!visible && selectedMessage.value) {
    return
  }
}

const isRecording = ref(false)
const recorder = ref<MediaRecorder | null>(null)
const recordingTime = ref(0)
const recordingTimer = ref<number | null>(null)
const audioChunks = ref<Blob[]>([])
const mediaStream = ref<MediaStream | null>(null)

const spinnerIcon = h(LoadingOutlined, {
  style: { fontSize: '24px', color: '#b2a284', marginBottom: '12px' }
})

const checkAudioDuration = (blob: Blob): Promise<boolean> => {
  return new Promise((resolve) => {
    const audio = new Audio(URL.createObjectURL(blob))
    audio.onloadedmetadata = () => {
      if (audio.duration < 1) {
        message.warning('录音时间太短，请至少录制1秒')
        resolve(false)
      } else {
        resolve(true)
      }
    }
    audio.onerror = () => {
      message.error('音频检查失败')
      resolve(false)
    }
  })
}

const handleAudioData = async (audioBlob: Blob) => {
  try {
    const isValidDuration = await checkAudioDuration(audioBlob)
    if (!isValidDuration) {
      return
    }

    const file = new File([audioBlob], `audio_${Date.now()}.mp3`, {
      type: 'audio/mpeg',
      lastModified: Date.now()
    })

    const response = await uploadAudioUsingPost({}, {}, file, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    if (response.data?.code === 0 && response.data?.data) {
      const location = await getLocation()
      const audioMessage = {
        type: props.spaceId === -2 ? 3 : 'message',
        content: '语音消息',
        messageType: 'audio',
        messageUrl: response.data.data.fileUrl,
        messageSize: response.data.data.fileSize,
        messageLocation: location,
        ...(props.pictureId ? { pictureId: String(props.pictureId) } : {}),
        ...(props.spaceId ? { spaceId: String(props.spaceId) } : {}),
        ...(props.privateChatId ? { privateChatId: String(props.privateChatId) } : {})
      }

      if (chatWs.value?.isConnected()) {
        chatWs.value.sendMessage(audioMessage)
      } else {
        messageQueue.value.push(audioMessage)
        if (!chatWs.value) {
          initWebSocket()
        }
        else if (!chatWs.value.isConnected() && !chatWs.value.isConnecting()) {
          chatWs.value.connect()
        }
        message.info('语音消息已提交，连接建立后将自动发送')
      }
    } else {
      console.error('音频上传响应格式错误:', response)
      message.error('音频上传失败')
    }
  } catch (error) {
    console.error('音频处理失败:', error)
    message.error('音频处理失败')
  }
}

const cleanupRecording = () => {
  if (mediaStream.value) {
    mediaStream.value.getTracks().forEach(track => track.stop())
    mediaStream.value = null
  }

  if (recordingTimer.value) {
    clearInterval(recordingTimer.value)
    recordingTimer.value = null
  }

  recorder.value = null
  isRecording.value = false
  recordingTime.value = 0
  audioChunks.value = []
}

const debouncedStartRecording = useDebounceFn(async () => {
  if (isRecording.value) return

  try {
    cleanupRecording()

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 44100,
        echoCancellation: true,
        noiseSuppression: true
      }
    })

    mediaStream.value = stream

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm',
      audioBitsPerSecond: 128000
    })

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        audioChunks.value.push(e.data)
      }
    }

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks.value, { type: 'audio/webm' })
      await handleAudioData(audioBlob)
      cleanupRecording()
    }

    recorder.value = mediaRecorder
    mediaRecorder.start()
    isRecording.value = true

    recordingTimer.value = window.setInterval(() => {
      recordingTime.value++
      if (recordingTime.value >= 60) {
        stopRecording()
      }
    }, 1000)

  } catch (err) {
    console.error('录音失败:', err)
    message.error('录音失败，请检查麦克风权限')
    cleanupRecording()
  }
}, 300)

const startRecording = () => {
  debouncedStartRecording()
}

const stopRecording = () => {
  if (recorder.value && recorder.value.state === 'recording') {
    try {
      recorder.value.stop()
      messageInput.value?.focus()
    } catch (error) {
      console.error('停止录音失败:', error)
      message.error('停止录音失败')
      cleanupRecording()
      messageInput.value?.focus()
    }
  } else {
    cleanupRecording()
    messageInput.value?.focus()
  }
}

const handleImageUpload = async (file: File) => {
  try {
    const compressedFile = await ImageCompressor.compress(file, {
      maxWidth: 1280,
      maxHeight: 1280,
      maxSize: 500 * 1024
    })

    const location = await getLocation()
    const res = await uploadPostImageUsingPost({}, {}, compressedFile)
    if (res.data.code === 0) {
      const messageData = {
        type: props.spaceId === -2 ? 3 : 'message',
        content: file.name,
        messageType: 'image',
        messageUrl: res.data.data.url,
        messageSize: compressedFile.size,
        messageLocation: location,
        ...(props.pictureId ? { pictureId: String(props.pictureId) } : {}),
        ...(props.spaceId ? { spaceId: String(props.spaceId) } : {}),
        ...(props.privateChatId ? { privateChatId: String(props.privateChatId) } : {})
      }

      if (chatWs.value?.isConnected()) {
        chatWs.value.sendMessage(messageData)
      } else {
        messageQueue.value.push(messageData)
        if (!chatWs.value) {
          initWebSocket()
        }
        else if (!chatWs.value.isConnected() && !chatWs.value.isConnecting()) {
          chatWs.value.connect()
        }
        message.info('图片已提交，连接建立后将自动发送')
      }
    } else {
      message.error('图片上传失败')
    }
  } catch (error) {
    console.error('图片处理失败:', error)
    message.error('图片处理失败')
  }
  return false
}

const getLocation = () => {
  return new Promise((resolve) => {
    let defaultLocation = '北京'
    fetch('https://api.myip.la/cn?json')
      .then(response => response.json())
      .then(data => {
        if (data && data.location && data.location.province) {
          resolve(data.location.province)
        } else {
          resolve(defaultLocation)
        }
      })
      .catch(() => {
        resolve(defaultLocation)
      })
  })
}

const handleVideoPlay = (event: Event) => {
  document.querySelectorAll('video').forEach((video) => {
    if (video !== event.target) {
      video.pause()
      video.currentTime = 0
    }
  })
}

const linkifyText = (text: string): string => {
  if (!text) return ''

  // URL正则表达式，匹配http、https、www开头的链接
  const urlRegex = /(https?:\/\/[^\s<]+)|(www\.[^\s<]+)/g

  // 转义HTML特殊字符
  const escapeHtml = (str: string) => {
    const div = document.createElement('div')
    div.textContent = str
    return div.innerHTML
  }

  // 替换URL为可点击的链接
  return escapeHtml(text).replace(urlRegex, (url) => {
    const href = url.startsWith('www.') ? `https://${url}` : url
    return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="yuemu-message-link" onclick="event.stopPropagation()">${url}</a>`
  })
}

const scrollToMessage = (messageId: string | number) => {
  const messageElement = document.querySelector(`[data-message-id="${messageId}"]`)
  if (messageElement) {
    messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

</script>

<style scoped lang="scss">
@mixin hardware-accelerate {
  transform: translateZ(0);
  will-change: transform;
}

.yuemu-chat-room {
  display: flex;
  background: var(--background);
  color: var(--text-primary);
  flex-direction: column;
  height: 100%;
  position: relative;
  @include hardware-accelerate;
  contain: layout style paint;
}

.yuemu-chat-content {
  display: flex;
  flex: 1;
  min-height: 0;
  padding: 12px;
  gap: 12px;
  @include hardware-accelerate;
}

.yuemu-messages-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: transparent;
  position: relative;
  overflow: hidden;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.yuemu-top-loading-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  background: rgba(24, 144, 255, 0.1);
  border-radius: 8px;
  margin: 4px 12px;
  gap: 8px;
  font-size: 12px;
  color: var(--link-color);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  animation: yuemu-fade-in 0.3s ease;
  @include hardware-accelerate;

  .dark-theme & {
    background: rgba(24, 144, 255, 0.15);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }

  :deep(.ant-spin) {
    color: var(--link-color);
  }
}

.yuemu-system-message {
  margin: auto;
  display: flex;
  justify-content: center;
  align-items: center;
}

.yuemu-reload-btn {
  margin: auto;
}

.yuemu-no-more-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px;
  color: var(--text-secondary);
  font-size: 12px;

  .dark-theme & {
    color: var(--text-secondary);
  }

  span {
    white-space: nowrap;
  }
}

.yuemu-chat-messages {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 12px 12px;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  @include hardware-accelerate;
  contain: strict;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 2px;
  }

  .dark-theme &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
  }
}

.yuemu-loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 8px;
  color: var(--text-secondary);
}

.yuemu-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-secondary);
  gap: 8px;

  .yuemu-empty-icon {
    font-size: 48px;

    i {
      color: var(--text-secondary);
      opacity: 0.5;
    }
  }
}

.yuemu-timestamp-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin: 32px 0;
  font-size: 11px;
  color: var(--text-secondary);
  letter-spacing: 1px;
  text-transform: uppercase;
  user-select: none;

  &::before,
  &::after {
    content: '·';
    font-size: 16px;
    color: var(--border-color);
  }
}

.yuemu-message-item {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  animation: yuemu-slide-in 0.3s ease;
  @include hardware-accelerate;
  contain: layout style paint;

  &.yuemu-message-self {
    flex-direction: row-reverse;

    .yuemu-message-body {
      align-items: flex-end;
    }

    .yuemu-message-main {
      align-items: flex-end;
    }

    .yuemu-text-bubble {
      background: rgba(24, 144, 255, 0.1);
      border: 1px solid rgba(24, 144, 255, 0.3);
      border-radius: 18px 2px 18px 18px;
      box-shadow: 0 2px 8px rgba(24, 144, 255, 0.1);

      .dark-theme & {
        background: rgba(24, 144, 255, 0.15);
        border-color: rgba(24, 144, 255, 0.4);
        box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
      }
    }
  }

  &.yuemu-message-recalled {
    .yuemu-message-main {
      opacity: 0.6;
    }

    .yuemu-text-bubble {
      text-align: center;
      color: var(--text-secondary);
      font-style: italic;
      align-self: center;
      max-width: 200px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      border-radius: 9999px !important;
      padding: 6px 20px;
      background: var(--hover-background);
      border-color: var(--border-color);
    }

    .yuemu-message-body {
      align-items: center;
      width: 100%;
      max-width: 100%;
    }

    .yuemu-message-avatar {
      display: none;
    }
  }
}

.yuemu-message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-size: cover;
  background-position: center;
  cursor: pointer;
  flex-shrink: 0;
  @include hardware-accelerate;
  transition: transform 0.2s ease;

  &:active {
    transform: scale(0.9);
  }
}

.yuemu-message-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 70%;
  min-width: 0;
}

.yuemu-message-username {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 2px;

  .yuemu-location {
    margin-left: 8px;
    font-size: 11px;
    color: var(--text-secondary);
    background: transparent;
    padding: 0;
    opacity: 0.6;
  }
}

.yuemu-message-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.yuemu-text-bubble {
  padding: 8px 14px;
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 2px 18px 18px 18px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-primary);
  word-break: break-word;
  word-wrap: break-word;
  overflow-wrap: break-word;
  position: relative;
  @include hardware-accelerate;

  .dark-theme & {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
  }

  :deep(.yuemu-message-link) {
    color: var(--link-color);
    text-decoration: underline;
    cursor: pointer;
    transition: opacity 0.2s ease;

    &:hover {
      opacity: 0.8;
    }

    &:active {
      opacity: 0.6;
    }
  }
}

.yuemu-image-bubble,
.yuemu-audio-bubble,
.yuemu-video-bubble {
  max-width: 220px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  @include hardware-accelerate;

  .yuemu-message-self & {
    border-radius: 18px 2px 18px 18px;
  }
  .yuemu-message-item:not(.yuemu-message-self) & {
    border-radius: 2px 18px 18px 18px;
  }

  img,
  video {
    display: block;
    width: 100%;
    height: auto;
    cursor: pointer;
  }
}

.yuemu-message-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
  padding: 8px;
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  @include hardware-accelerate;

  .dark-theme & {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  }

  .yuemu-action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 44px;
    height: 32px;
    padding: 0 10px;
    border: none;
    border-radius: 6px;
    background: rgba(0, 0, 0, 0.03);
    color: var(--text-primary);
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    flex-shrink: 0;

    &:hover {
      background: var(--hover-background);
    }

    &:active {
      background: var(--hover-background);
      transform: scale(0.95);
    }

    .dark-theme & {
      &:hover {
        background: rgba(255, 255, 255, 0.08);
      }

      &:active {
        background: rgba(255, 255, 255, 0.12);
      }
    }
  }
}

.yuemu-reply-quote {
  margin-top: 4px;
  padding: 6px 10px;
  background: var(--hover-background);
  border-left: 3px solid var(--link-color);
  border-radius: 6px;
  font-size: 12px;
  color: var(--text-primary);
  cursor: pointer;
  overflow: hidden;
  @include hardware-accelerate;
  transition: all 0.2s ease;

  &:hover {
    background: var(--border-color);
  }

  &:active {
    background: var(--border-color);
    transform: scale(0.98);
  }

  .dark-theme & {
    background: rgba(255, 255, 255, 0.05);

    &:hover {
      background: rgba(255, 255, 255, 0.08);
    }

    &:active {
      background: rgba(255, 255, 255, 0.1);
    }
  }

  .yuemu-reply-label {
    color: var(--text-secondary);
    margin-right: 4px;
  }

  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  text-overflow: ellipsis;
}

.yuemu-new-message-tip {
  position: absolute;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%) translateZ(0);
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  background: var(--link-color);
  border-radius: 20px;
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  z-index: 10;
  animation: yuemu-fade-in 0.3s ease;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
  @include hardware-accelerate;
  contain: layout style paint;

  &:hover {
    transform: translateX(-50%) translateY(-2px) translateZ(0);
    box-shadow: 0 4px 12px rgba(24, 144, 255, 0.4);
  }

  &:active {
    transform: translateX(-50%) translateY(0) translateZ(0);
  }
}

.yuemu-chat-input {
  padding: 6px 12px 16px;
  flex-shrink: 0;
  width: 100%;
  max-width: 840px;
  margin: 0 auto;
  @include hardware-accelerate;
}

.yuemu-reply-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  padding: 8px 12px;
  background: rgba(24, 144, 255, 0.1);
  border-left: 3px solid var(--link-color);
  border-radius: 6px;
  font-size: 12px;

  .dark-theme & {
    background: rgba(24, 144, 255, 0.15);
  }

  span {
    flex: 1;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    text-overflow: ellipsis;
    color: var(--text-primary);
  }

  .yuemu-cancel-reply {
    color: var(--link-color);
    border: none;
    background: none;
    cursor: pointer;
    font-size: 12px;
    padding: 4px 8px;
    flex-shrink: 0;
    margin-left: 8px;
    border-radius: 4px;
    transition: background 0.2s ease;

    &:hover {
      background: rgba(24, 144, 255, 0.1);
    }

    &:active {
      background: rgba(24, 144, 255, 0.2);
    }
  }
}

/* Gemini-style Input Box */
.yuemu-gemini-input-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  position: relative;
  background: var(--card-background);
  border-radius: 24px;
  padding: 8px 16px;
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(0,0,0,0.02);
  margin-top: 4px;
}
.yuemu-gemini-input-wrapper:focus-within {
  background: var(--background);
  border-color: rgba(24, 144, 255, 0.4);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.08);
}
.dark-theme .yuemu-gemini-input-wrapper {
  background: rgba(255, 255, 255, 0.05);
}
.dark-theme .yuemu-gemini-input-wrapper:focus-within {
  background: rgba(0, 0, 0, 0.2);
  border-color: rgba(24, 144, 255, 0.5);
}

.yuemu-gemini-left-actions,
.yuemu-gemini-right-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  padding-bottom: 2px;
}

.yuemu-gemini-textarea {
  flex: 1;
  padding: 6px 0;
  border: none;
  outline: none;
  font-size: 15px;
  min-width: 0;
  background: transparent;
  color: var(--text-primary);
  resize: none;
  max-height: 120px;
  overflow-y: auto;
  line-height: 1.4;
  display: block;
  width: 100%;
}
.yuemu-gemini-textarea::placeholder {
  color: var(--text-secondary);
  opacity: 0.6;
}

.yuemu-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: transparent;
  font-size: 16px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}
.yuemu-action-btn:hover {
  background: var(--hover-background);
  color: var(--text-primary);
}
.yuemu-action-btn.is-active {
  color: var(--link-color);
  background: rgba(24, 144, 255, 0.1);
}
.dark-theme .yuemu-action-btn:hover {
  background: rgba(255, 255, 255, 0.08);
}

.yuemu-gemini-send-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: transparent;
  font-size: 16px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}
.yuemu-gemini-send-btn.can-send {
  background: var(--link-color);
  color: #fff;
}
.yuemu-gemini-send-btn.can-send:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
}
.yuemu-gemini-send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: transparent;
  color: var(--text-secondary);
}

.yuemu-emoji-container {
  position: relative;
  display: flex;
  align-items: center;

  @media (max-width: 768px) {
    position: static;
  }
}

.yuemu-emoji-panel {
  position: absolute;
  bottom: 100%;
  right: -8px;
  margin-bottom: 8px;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  z-index: 100;
  @include hardware-accelerate;

  @media (max-width: 768px) {
    left: 0;
    right: 0;
    width: 100%;
  }
}

.yuemu-emoji-panel :deep(.v3-emoji-picker) {
  @media (max-width: 768px) {
    width: 100% !important;
  }
}

.yuemu-mention-box {
  position: fixed;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  width: 240px;
  max-height: 300px;
  margin-left: -300px;
  overflow-y: auto;
  z-index: 9999;
  @include hardware-accelerate;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

  @media (max-width: 768px) {
    position: fixed;
    left: 16px !important;
    right: 16px !important;
    bottom: 70px;
    margin-left: 0;
    width: auto !important;
  }
}

.yuemu-mention-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  transition: background 0.2s ease;

  &:active {
    background: #f0f0f0;
  }
}

.yuemu-mention-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 8px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.yuemu-mention-info {
  flex: 1;
  min-width: 0;
}

.yuemu-mention-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.yuemu-mention-desc {
  font-size: 12px;
  color: #999;
}

.yuemu-user-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: yuemu-fade-in 0.2s ease;
  @include hardware-accelerate;
}

.yuemu-user-modal-content {
  background: #fff;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  animation: yuemu-scale-in 0.2s ease;
  @include hardware-accelerate;
  contain: layout style paint;
}

.yuemu-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
  flex-shrink: 0;
}

.yuemu-modal-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
  font-weight: 500;
  margin: 0;
}

.yuemu-modal-close {
  width: 32px;
  height: 32px;
  border: none;
  background: #f5f5f5;
  border-radius: 50%;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  @include hardware-accelerate;

  &:active {
    transform: scale(0.9);
    background: #e0e0e0;
  }
}

.yuemu-modal-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.yuemu-empty-users {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #999;
  gap: 8px;

  .yuemu-empty-icon {
    font-size: 48px;

    i {
      color: #999;
    }
  }
}

.yuemu-users-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 8px 16px;
}

.yuemu-user-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s ease;
  @include hardware-accelerate;

  &:active {
    background: #f0f0f0;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 4px;
    padding: 8px 4px;
  }
}

.yuemu-user-avatar {
  position: relative;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-size: cover;
  background-position: center;
  flex-shrink: 0;

  .yuemu-online-dot {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #52c41a;
    border: 1px solid #fff;
  }
}

.yuemu-user-meta {
  flex: 1;
  min-width: 0;

  .yuemu-user-name {
    font-size: 13px;
    font-weight: 500;
    color: #333;
    margin-bottom: 2px;
  }

  .yuemu-user-role {
    font-size: 11px;
    color: #999;
  }
}

.yuemu-voice-modal {
  position: fixed;
  bottom: 20%;
  left: 50%;
  transform: translate(-50%, -50%) translateZ(0);
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  z-index: 9999;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  @include hardware-accelerate;
}

.yuemu-voice-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.yuemu-wave-bars {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 60px;
  padding: 0 20px;
}

.yuemu-wave-bar {
  width: 4px;
  height: 20px;
  background: #1890ff;
  border-radius: 2px;
  animation: yuemu-wave-bar-anim 1s ease-in-out infinite;
}

.yuemu-voice-info {
  text-align: center;

  .yuemu-voice-time {
    font-size: 24px;
    color: #1890ff;
    font-weight: 500;
  }

  .yuemu-voice-tip {
    display: block;
    margin-top: 8px;
    font-size: 14px;
    color: #666;
  }
}

.yuemu-action-menu {
  position: absolute;
  background: var(--card-background, #ffffff);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  padding: 8px;
  z-index: 1001;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
  max-width: 260px;
  border: 1px solid var(--border-color);
  @include hardware-accelerate;
}

.yuemu-action-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px;
  border: none;
  background: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s ease;
  min-width: 60px;

  &:active {
    background: #f0f0f0;
  }
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

@keyframes yuemu-wave-bar-anim {
  0%, 100% { height: 20px; }
  50% { height: 40px; }
}

@keyframes yuemu-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes yuemu-scale-in {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@media (max-width: 768px) {
  .yuemu-chat-content {
    padding: 0;
  }

  .yuemu-messages-container {
    border-radius: 0;
  }

  .yuemu-chat-messages {
    padding: 0 8px 8px;
  }

  .yuemu-message-item {
    gap: 6px;
    margin-bottom: 12px;
  }

  .yuemu-message-avatar {
    width: 32px;
    height: 32px;
  }

  .yuemu-message-body {
    max-width: 80%;
  }

  .yuemu-text-bubble {
    padding: 6px 10px;
    font-size: 14px;
  }

  .yuemu-image-bubble,
  .yuemu-audio-bubble,
  .yuemu-video-bubble {
    max-width: 150px;
  }

  .yuemu-chat-input {
    padding: 6px 8px;
  }

  .yuemu-input-wrapper {
    gap: 6px;
  }

  .yuemu-emoji-btn,
  .yuemu-img-btn,
  .yuemu-voice-btn {
    width: 28px;
    height: 28px;
    font-size: 14px;
  }

  .yuemu-send-btn {
    padding: 0 12px;
    height: 28px;
    border-radius: 8px;
    font-size: 14px;
  }

  .yuemu-message-input-container {
    padding: 2px 8px;

    .yuemu-message-input {
      padding: 3px 0;
      line-height: 1.25;
    }
  }

  .yuemu-mention-box {
    position: fixed;
    left: 16px !important;
    right: 16px !important;
    bottom: 70px;
    width: auto !important;
  }

  .yuemu-user-modal-content {
    width: 85%;
    max-height: 60vh;
  }

  .yuemu-message-actions {
    padding: 6px 8px;
    gap: 6px;
    border-radius: 6px;
    flex-wrap: wrap;
    width: fit-content;
    max-width: 100%;
    justify-content: flex-start; /* 默认左对齐（他人消息） */

    .yuemu-action-btn {
      min-width: auto;
      height: 28px;
      padding: 0 10px;
      font-size: 12px;
      border-radius: 6px;
      background: rgba(0, 0, 0, 0.04);
      flex-shrink: 0;
    }
  }

  /* 自己发送的消息，操作按钮右对齐 */
  .yuemu-message-self .yuemu-message-actions {
    justify-content: flex-end;
  }
}

.yuemu-message-highlight {
  /* background: none; */
}

/* 移动端强制移除点击时的悬停缩放，防止底层长按死锁 */
@media (max-width: 768px) {
  .ant-card-hoverable:active, .ant-card-hoverable:hover,
  .ant-card-hoverable:active *, .ant-card-hoverable:hover *,
  .yuemu-action-btn:active, .yuemu-action-btn:hover,
  .yuemu-action-btn:active *, .yuemu-action-btn:hover *,
  .yuemu-reply-quote:active, .yuemu-reply-quote:hover,
  .yuemu-reply-quote:active *, .yuemu-reply-quote:hover *,
  .yuemu-new-message-tip:active, .yuemu-new-message-tip:hover,
  .yuemu-new-message-tip:active *, .yuemu-new-message-tip:hover *,
  .can-send:active, .can-send:hover,
  .can-send:active *, .can-send:hover *,
  .yuemu-cancel-reply:active, .yuemu-cancel-reply:hover,
  .yuemu-cancel-reply:active *, .yuemu-cancel-reply:hover * {
    transform: none !important;
  }
}
</style>
