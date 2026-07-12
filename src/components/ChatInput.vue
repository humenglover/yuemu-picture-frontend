<template>
  <div class="yuemu-chat-input">
    <div v-if="replyTo" class="yuemu-reply-preview">
      <span>{{ t('components.chatInput.reply') }} <span v-if="type !== 'private'">{{ replyTo.sender?.userName }}</span>: "{{ replyTo.content }}"</span>
      <button class="yuemu-cancel-reply-button" @click="cancelReply">{{ t('components.chatInput.cancelReply') }}</button>
    </div>

    <div class="yuemu-input-area">
      <button
        class="yuemu-emoji-trigger"
        :class="{ 'yuemu-active': showEmojiPicker }"
        @click="toggleEmojiPicker"
      >
        😊
      </button>

      <div class="yuemu-media-buttons">
        <a-upload
          :show-upload-list="false"
          :before-upload="handleImageUpload"
          accept="image/*"
        >
          <button class="yuemu-media-button" :title="t('components.chatInput.sendImage')">
            <PictureOutlined />
          </button>
        </a-upload>

        <button
          class="yuemu-media-button"
          @click="toggleAudioRecording"
          :class="{ 'yuemu-recording': isRecording }"
          :title="t('components.chatInput.recordAudio')"
        >
          <AudioOutlined />
          <span v-if="isRecording" class="yuemu-recording-time">{{ recordingTime }}s</span>
        </button>

        <button
          class="yuemu-media-button"
          @click="showVideoUrlInput"
          :title="t('components.chatInput.addVideo')"
        >
          <VideoCameraOutlined />
        </button>
      </div>

      <div class="yuemu-input-group">
        <input
          v-model="inputMessage"
          type="text"
          class="yuemu-message-input"
          :placeholder="isRecording ? t('components.chatInput.recording') : t('components.chatInput.inputMessage')"
          @keyup.enter.prevent="sendMessage"
          @input="handleInput"
          :disabled="!connected || isRecording"
          ref="messageInput"
          @blur="handleInputBlur"
        />
        <button
          class="yuemu-send-button"
          @click.prevent="sendMessage"
          :disabled="!connected || (isRecording && recordingTime < 1)"
        >
          <span v-if="isRecording">{{ t('components.chatInput.done') }}</span>
          <span v-else-if="loadingHistory" class="yuemu-loading-dots">
            <span class="yuemu-dot"></span>
            <span class="yuemu-dot"></span>
            <span class="yuemu-dot"></span>
          </span>
          <span v-else>{{ t('components.chatInput.send') }}</span>
        </button>
      </div>
    </div>

    <div v-if="showEmojiPicker" class="yuemu-emoji-picker-container">
      <EmojiPicker @select="onEmojiSelect" />
    </div>

    <div v-if="showMentionBox && String(spaceId) === '-2'" class="yuemu-mention-box" :style="mentionBoxStyle">
      <div class="yuemu-mention-item" @click="selectMention">
        <div class="yuemu-mention-avatar">
          <img src="https://static.yuemutuku.com/space/1877028360151445505/2025-07-02_k9wqCp9awJ9iPEaC_thumbnail.webp" :alt="t('components.chatInput.yuemuAssistant')" />
        </div>
        <div class="yuemu-mention-info">
          <div class="yuemu-mention-name">{{ t('components.chatInput.yuemuAssistant') }}</div>
          <div class="yuemu-mention-desc">{{ t('components.chatInput.aiAssistant') }}</div>
        </div>
      </div>
    </div>

    <a-modal
      v-model:open="videoUrlModalVisible"
      :title="t('components.chatInput.addVideo')"
      @ok="handleVideoUrlConfirm"
      @cancel="videoUrlModalVisible = false"
      :okText="t('components.chatInput.confirm')"
      :cancelText="t('components.chatInput.cancel')"
    >
      <a-input
        v-model:value="videoUrl"
        :placeholder="t('components.chatInput.videoUrlPlaceholder')"
        @keyup.enter="handleVideoUrlConfirm"
      />
      <div class="yuemu-video-url-tips">
        <p>{{ t('components.chatInput.videoFormatHint') }}</p>
        <p>{{ t('components.chatInput.videoUrlHint') }}</p>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { message } from 'ant-design-vue'
import { PictureOutlined, AudioOutlined, VideoCameraOutlined } from '@ant-design/icons-vue'
import EmojiPicker from './EmojiPicker.vue'
import { uploadPostImageUsingPost } from '@/api/pictureController'
import Recorder from 'recorderx'
import type { ChatMessage } from '@/utils/chatWebSocket'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
  connected: boolean
  loadingHistory?: boolean
  type?: 'chat' | 'space' | 'private'
  spaceId?: number | string
  replyTo?: ChatMessage | null
}>()

const emit = defineEmits<{
  (e: 'send', message: {
    type: string
    content: string
    messageType: string
    messageUrl?: string
    messageSize?: number
    replyId?: string | number
    rootId?: string | number
    isAtAI?: boolean
  }): void
  (e: 'cancel-reply'): void
}>()

// 基本状态
const inputMessage = ref('')
const messageInput = ref<HTMLInputElement | null>(null)
const showEmojiPicker = ref(false)

// 录音相关
const isRecording = ref(false)
const recorder = ref<Recorder | null>(null)
const recordingTime = ref(0)
const recordTimer = ref<number | null>(null)

// 视频URL相关
const videoUrlModalVisible = ref(false)
const videoUrl = ref('')

// @提及相关
const showMentionBox = ref(false)
const mentionBoxStyle = ref({})
const mentionStartIndex = ref(-1)

// 表情选择器
const toggleEmojiPicker = () => {
  showEmojiPicker.value = !showEmojiPicker.value
}

const onEmojiSelect = (emoji: string) => {
  inputMessage.value += emoji
  showEmojiPicker.value = false
}

// 处理图片上传
const handleImageUpload = async (file: File) => {
  try {
    const res = await uploadPostImageUsingPost({}, {}, file)
    if (res.data.code === 0) {
      emit('send', {
        type: 'message',
        content: t('components.chatInput.sentImage'),
        messageType: 'image',
        messageUrl: res.data.data.url,
        messageSize: file.size,
        ...(props.replyTo ? {
          replyId: props.replyTo.id,
          rootId: props.replyTo.rootId || props.replyTo.id
        } : {})
      })
    }
  } catch (error) {
    console.error('图片上传失败:', error)
    message.error(t('components.chatInput.imageUploadFailed'))
  }
  return false
}

// 处理音频录制
const toggleAudioRecording = async () => {
  if (isRecording.value) {
    if (recorder.value) {
      const audioBlob = await recorder.value.stop()
      isRecording.value = false
      if (recordTimer.value) {
        clearInterval(recordTimer.value)
        recordTimer.value = null
      }

      try {
        const res = await uploadPostImageUsingPost({}, {}, audioBlob)
        if (res.data.code === 0) {
          emit('send', {
            type: 'message',
            content: t('components.chatInput.sentAudio'),
            messageType: 'audio',
            messageUrl: res.data.data.url,
            messageSize: audioBlob.size,
            ...(props.replyTo ? {
              replyId: props.replyTo.id,
              rootId: props.replyTo.rootId || props.replyTo.id
            } : {})
          })
        }
      } catch (error) {
        console.error('音频上传失败:', error)
        message.error(t('components.chatInput.audioUploadFailed'))
      }
    }
  } else {
    try {
      recorder.value = new Recorder({
        sampleBits: 16,
        sampleRate: 16000,
        numChannels: 1
      })
      await recorder.value.start()
      isRecording.value = true
      recordingTime.value = 0
      recordTimer.value = window.setInterval(() => {
        recordingTime.value++
        if (recordingTime.value >= 60) {
          toggleAudioRecording()
        }
      }, 1000)
    } catch (error) {
      console.error('录音失败:', error)
      message.error(t('components.chatInput.recordFailed'))
    }
  }
}

// 处理视频URL
const showVideoUrlInput = () => {
  videoUrlModalVisible.value = true
}

const handleVideoUrlConfirm = () => {
  if (!videoUrl.value) {
    message.warning(t('components.chatInput.inputVideoUrl'))
    return
  }
  try {
    new URL(videoUrl.value)
  } catch {
    message.error(t('components.chatInput.invalidUrl'))
    return
  }
  emit('send', {
    type: 'message',
    content: t('components.chatInput.sentVideo'),
    messageType: 'video',
    messageUrl: videoUrl.value,
    ...(props.replyTo ? {
      replyId: props.replyTo.id,
      rootId: props.replyTo.rootId || props.replyTo.id
    } : {})
  })
  videoUrl.value = ''
  videoUrlModalVisible.value = false
}

// 发送文本消息
const sendMessage = () => {
  if (isRecording.value) {
    toggleAudioRecording()
    return
  }
  if (!inputMessage.value.trim() || !props.connected) return

  const isAtAI = inputMessage.value.includes(`@${t('components.chatInput.yuemuAssistant')}`)
  const messageContent = inputMessage.value.trim()

  emit('send', {
    type: 'message',
    content: messageContent,
    messageType: 'text',
    ...(props.replyTo ? {
      replyId: props.replyTo.id,
      rootId: props.replyTo.rootId || props.replyTo.id
    } : {}),
    isAtAI
  })
  inputMessage.value = ''
}

// 处理@提及
const handleInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  const value = target.value
  const cursorPosition = target.selectionStart || 0

  if (value[cursorPosition - 1] === '@') {
    mentionStartIndex.value = cursorPosition - 1
    showMentionBox.value = true
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
      mentionBoxStyle.value = {
        position: 'absolute',
        bottom: '100%',
        left: '0',
        marginBottom: '8px',
        width: '240px',
        zIndex: 1000
      }
    }
  } else if (showMentionBox.value) {
    const textFromMentionStart = value.slice(mentionStartIndex.value, cursorPosition)
    if (!textFromMentionStart.startsWith('@') || textFromMentionStart.includes(' ')) {
      showMentionBox.value = false
    }
  }
}

const handleInputBlur = () => {
  setTimeout(() => {
    showMentionBox.value = false
  }, 200)
}

const selectMention = () => {
  if (mentionStartIndex.value >= 0) {
    const beforeMention = inputMessage.value.slice(0, mentionStartIndex.value)
    const afterMention = inputMessage.value.slice(mentionStartIndex.value + 1)
    inputMessage.value = beforeMention + `@${t('components.chatInput.yuemuAssistant')} ` + afterMention
  }
  showMentionBox.value = false
  mentionStartIndex.value = -1
  messageInput.value?.focus()
}

const cancelReply = () => {
  emit('cancel-reply')
}

onUnmounted(() => {
  if (recordTimer.value) clearInterval(recordTimer.value)
  if (recorder.value && isRecording.value) recorder.value.stop()
})
</script>

<style scoped>
.yuemu-chat-input {
  padding: 16px;
  position: relative;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  margin-top: 0;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
}

.yuemu-input-area {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.yuemu-media-buttons {
  display: flex;
  gap: 8px;
}

.yuemu-media-button {
  background: none;
  border: none;
  font-size: 20px;
  padding: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 50%;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.yuemu-media-button:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #1890ff;
}

.yuemu-media-button.yuemu-recording {
  color: #ff4d4f;
  animation: yuemu-pulse 1s infinite;
}

.yuemu-recording-time {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #ff4d4f;
  color: white;
  font-size: 12px;
  padding: 2px 4px;
  border-radius: 8px;
  min-width: 20px;
  text-align: center;
}

@keyframes yuemu-pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.yuemu-emoji-trigger {
  background: none;
  border: none;
  font-size: 20px;
  padding: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 50%;
  color: #666;
}

.yuemu-emoji-trigger:hover,
.yuemu-emoji-trigger.yuemu-active {
  background: rgba(0, 0, 0, 0.05);
  transform: scale(1.1);
  color: #1890ff;
}

.yuemu-input-group {
  display: flex;
  flex: 1;
  background: rgba(0, 0, 0, 0.05);
  padding: 4px;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.yuemu-message-input {
  flex: 1;
  padding: 12px;
  border: none;
  background: transparent;
  font-size: 14px;
  color: #333;
  outline: none;
}

.yuemu-message-input::placeholder {
  color: #999;
}

.yuemu-send-button {
  padding: 8px 24px;
  border-radius: 12px;
  border: none;
  background: #1890ff;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 80px;
}

.yuemu-send-button:hover {
  background: #40a9ff;
}

.yuemu-send-button:disabled {
  background: #d9d9d9;
  cursor: not-allowed;
}

.yuemu-reply-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding: 8px 16px;
  border-radius: 12px;
  background: rgba(24, 144, 255, 0.1);
  border-left: 3px solid #1890ff;
  font-size: 13px;
  color: #1890ff;
  width: 100%;
}

.yuemu-cancel-reply-button {
  padding: 4px 12px;
  border-radius: 12px;
  border: none;
  background: rgba(0, 0, 0, 0.1);
  color: #666;
  font-size: 12px;
  cursor: pointer;
}

.yuemu-video-url-tips {
  margin-top: 12px;
  font-size: 12px;
  color: #999;
}

.yuemu-video-url-tips p {
  margin: 4px 0;
}

.yuemu-mention-box {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  overflow: hidden;
  border: 1px solid #eee;
}

.yuemu-mention-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.yuemu-mention-item:hover {
  background: #f5f5f5;
}

.yuemu-mention-avatar img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  margin-right: 10px;
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

.yuemu-loading-dots {
  display: flex;
  gap: 4px;
  justify-content: center;
}

.yuemu-dot {
  width: 4px;
  height: 4px;
  background: white;
  border-radius: 50%;
  animation: yuemu-dot-blink 1.4s infinite both;
}

.yuemu-dot:nth-child(2) { animation-delay: 0.2s; }
.yuemu-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes yuemu-dot-blink {
  0%, 80%, 100% { opacity: 0; }
  40% { opacity: 1; }
}

@media screen and (max-width: 768px) {
  .yuemu-chat-input {
    padding: 12px;
  }
  .yuemu-input-area {
    gap: 8px;
  }
  .yuemu-media-button,
  .yuemu-emoji-trigger {
    padding: 6px;
    font-size: 18px;
  }
  .yuemu-send-button {
    padding: 8px 16px;
    min-width: 60px;
  }
}

/* 移动端强制移除点击时的悬停缩放，防止底层长按死锁 */
@media (max-width: 768px) {
  .ant-card-hoverable:active, .ant-card-hoverable:hover,
  .ant-card-hoverable:active *, .ant-card-hoverable:hover *,
  .yuemu-send-button:active, .yuemu-send-button:hover,
  .yuemu-send-button:active *, .yuemu-send-button:hover *,
  .yuemu-mention-item:active, .yuemu-mention-item:hover,
  .yuemu-mention-item:active *, .yuemu-mention-item:hover *,
  .yuemu-media-button:active, .yuemu-media-button:hover,
  .yuemu-media-button:active *, .yuemu-media-button:hover *,
  .yuemu-emoji-trigger:active, .yuemu-emoji-trigger:hover,
  .yuemu-emoji-trigger:active *, .yuemu-emoji-trigger:hover * {
    transform: none !important;
  }
}
</style>
