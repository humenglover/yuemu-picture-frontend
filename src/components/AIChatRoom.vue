<template>
  <div class="yuemu-chat-room">
    <transition name="yuemu-fade-slide">
      <div class="yuemu-thinking-status" v-if="loading">
        <i class="fas fa-spinner fa-spin yuemu-icon-spin"></i>
        <span>{{ t('components.aiChat.thinking') }}</span>
      </div>
    </transition>

    <div class="yuemu-chat-window">
      <div class="yuemu-messages-wrapper">
        <div class="yuemu-messages-container">

          <div class="yuemu-history-header">
            <template v-if="!hasMore && messages.length > 0 && isAtTop">
              <div class="yuemu-history-end">{{ t('components.aiChat.endOfHistory') }}</div>
            </template>
            <template v-else-if="hasMore && isAtTop">
              <button
                type="button"
                class="yuemu-btn-ghost"
                :disabled="loadingHistory"
                @click="loadHistory"
              >
                <i class="fas fa-chevron-down" :class="{ 'fa-spin': loadingHistory, 'fa-spinner': loadingHistory }"></i>
                {{ loadingHistory ? t('components.aiChat.loading') : t('components.aiChat.loadMoreHistory') }}
              </button>
            </template>
          </div>

          <div class="yuemu-chat-list" ref="messageContainer" @scroll="handleScroll">
            <div v-if="loadingHistory" class="yuemu-loading-bar">
              <i class="fas fa-circle-notch fa-spin"></i> {{ t('components.aiChat.tracingMemories') }}
            </div>

            <template v-for="(msg, index) in messages" :key="msg.id">
              <div v-if="shouldShowTimestamp(msg, messages[index - 1])" class="yuemu-timestamp">
                {{ formatMessageDivider(msg.createTime) }}
              </div>

              <div class="yuemu-message-item" :class="{ 'is-self': !msg.isAI }">
                <div class="yuemu-message-inner">
                  <div class="yuemu-avatar">
                    <img
                      :src="msg.isAI ? 'https://static.yuemutuku.com/public/1866450683272450049/2025-03-14_ZKdnsKKV4Z3Rxvcx.webp' : loginUser?.userAvatar"
                      alt="avatar"
                    >
                  </div>

                  <div class="yuemu-message-bubble">
                    <div class="yuemu-bubble-content" v-if="msg.isAI">
                      <div class="yuemu-md-body" v-html="formatMarkdown(msg.content)"></div>

                      <div class="yuemu-bubble-actions">
                        <button class="yuemu-btn-action" @click="copyMessage(msg.content)">
                          <template v-if="!msg.copied">
                            <i class="far fa-copy"></i> {{ t('components.aiChat.copy') }}
                          </template>
                          <template v-else>
                            <i class="fas fa-check text-success"></i> {{ t('components.aiChat.copied') }}
                          </template>
                        </button>
                      </div>
                    </div>
                    <div class="yuemu-bubble-content" v-else>
                      {{ msg.content }}
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>

      <div class="yuemu-chat-input-zone">
        <div class="yuemu-input-capsule">
          <input
            v-model="inputMessage"
            :placeholder="t('components.aiChat.inputPlaceholder')"
            @keyup.enter.prevent="sendMessage"
            :disabled="loading"
            class="yuemu-input"
            ref="messageInput"
            @blur="handleInputBlur"
            type="text"
          >
          <button
            type="button"
            class="yuemu-btn-send"
            @click.prevent="sendMessage"
            :disabled="loading || !inputMessage.trim()"
          >
            <i v-if="loading" class="fas fa-circle-notch fa-spin"></i>
            <i v-else class="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { getChatHistoryUsingPost, sendUsingPost } from '@/api/aiChatController'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const loginUserStore = useLoginUserStore()
const loginUser = computed(() => loginUserStore.loginUser)

const messages = ref<any[]>([])
const inputMessage = ref('')
const messageContainer = ref<HTMLElement | null>(null)
const messageInput = ref<HTMLElement | null>(null)
const loading = ref(false)

// 分页相关
const current = ref(1)
const pageSize = ref(20)
const hasMore = ref(true)
const loadingHistory = ref(false)
const isAtTop = ref(false)

// 加载历史消息
const loadHistory = async () => {
  if (loadingHistory.value) return
  try {
    loadingHistory.value = true
    const res = await getChatHistoryUsingPost({
      current: current.value,
      pageSize: pageSize.value
    })

    if (res?.data) {
      const { records, total, pages } = res.data
      if (records && Array.isArray(records)) {
        const historyMessages = records.map(msg => ({
          id: Date.now() + Math.random(),
          content: msg.content,
          createTime: msg.createTime,
          isAI: msg.role === 'assistant'
        }))

        // 记录加载前的滚动高度
        const prevHeight = messageContainer.value?.scrollHeight || 0
        messages.value = [...historyMessages.reverse(), ...messages.value]
        hasMore.value = current.value < Number(pages)
        current.value++

        // 恢复滚动位置
        nextTick(() => {
          if (messageContainer.value) {
            const newHeight = messageContainer.value.scrollHeight
            messageContainer.value.scrollTop = newHeight - prevHeight
          }
        })
      }
    }
  } catch (error) {
    // message.error('加载历史消息失败')
  } finally {
    loadingHistory.value = false
  }
}

// 发送消息
const sendMessage = async () => {
  if (!inputMessage.value.trim() || loading.value) return

  const userInput = inputMessage.value
  const userMessage = {
    id: Date.now(),
    content: userInput,
    createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    isAI: false
  }

  messages.value.push(userMessage)
  inputMessage.value = ''
  scrollToBottom()

  try {
    loading.value = true
    const res = await sendUsingPost({ query: userInput })

    // 处理消息上限的情况
    if (res?.data.code === 50001) {
      message.error({ content: t('components.aiChat.limitReached'), duration: 3 })
      messages.value.pop()
      return
    }

    if (res?.data) {
      const aiMessage = {
        id: Date.now() + 1,
        content: res.data,
        createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        isAI: true
      }
      messages.value.push(aiMessage)
      scrollToBottom()
    }
  } catch (error) {
    messages.value.pop()
    message.error(t('components.aiChat.sendFailed'))
  } finally {
    loading.value = false
  }
}

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messageContainer.value) {
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight
    }
  })
}

const handleScroll = (e: Event) => {
  const target = e.target as HTMLElement
  isAtTop.value = target.scrollTop <= 1

  if (target.scrollTop <= 30 && !loadingHistory.value && hasMore.value) {
    loadHistory()
  }
}

const handleInputBlur = (e: Event) => {
  const target = e.target as HTMLInputElement
  setTimeout(() => { target.focus() }, 100)
}

const shouldShowTimestamp = (currentMsg: any, prevMsg: any) => {
  if (!prevMsg) return true
  const currentTime = dayjs(currentMsg.createTime)
  const prevTime = dayjs(prevMsg.createTime)
  return currentTime.diff(prevTime, 'minute') >= 5
}

const formatMessageDivider = (time: string) => {
  const msgTime = dayjs(time)
  const now = dayjs()
  if (msgTime.isSame(now, 'day')) return msgTime.format('HH:mm')
  if (msgTime.isSame(now.subtract(1, 'day'), 'day')) return t('components.aiChat.yesterday') + msgTime.format('HH:mm')
  if (msgTime.isSame(now.subtract(2, 'day'), 'day')) return t('components.aiChat.dayBeforeYesterday') + msgTime.format('HH:mm')
  if (msgTime.isSame(now, 'year')) return msgTime.format('MM-DD HH:mm')
  return msgTime.format('YYYY-MM-DD HH:mm')
}

// 标准化 Markdown 类名渲染
const formatMarkdown = (content: string) => {
  if (!content) return ''
  return content
    .replace(/\n\s*\n/g, '\n\n')
    .replace(/^(#{1,6})\s+(.+)$/gm, (_, level, text) => `<div class="yuemu-md-h${level.length}">${text}</div>`)
    .replace(/```(\w+)?\n([\s\S]+?)```/g, (_, lang, code) => `<pre class="yuemu-md-pre"><div class="yuemu-md-code-header"><span>${lang || 'plaintext'}</span></div><code>${code.trim()}</code></pre>`)
    .replace(/`([^`]+)`/g, '<code class="yuemu-md-inline">$1</code>')
    .replace(/^(\s*)[•*-]\s+(.+)$/gm, '<li class="yuemu-md-li">$2</li>')
    .replace(/^(\s*)\d+\.\s+(.+)$/gm, '<li class="yuemu-md-li">$2</li>')
    .replace(/^>\s+(.+)$/gm, '<blockquote class="yuemu-md-quote">$1</blockquote>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="yuemu-md-link">$1</a>')
    .replace(/\n/g, '<br/>')
}

const copyMessage = async (content: string) => {
  try {
    await navigator.clipboard.writeText(content)
    message.success(t('components.aiChat.copySuccess'))
  } catch (err) {
    message.error(t('components.aiChat.copyFailed'))
  }
}

onMounted(async () => {
  await loadHistory()
  scrollToBottom()
})
</script>

<style scoped>
/* =========================================================
   规范化 UI 组件 (yuemu- 系列)
   ========================================================= */

.yuemu-chat-room {
  flex: 1; display: flex; flex-direction: column; height: 100%;
  max-width: 1000px; margin: 0 auto; width: 100%; position: relative;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

/* 顶部思考状态 (Glassmorphism) */
.yuemu-thinking-status {
  position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
  background: rgba(114, 46, 209, 0.15); color: #722ed1;
  padding: 8px 20px; border-radius: 30px; font-size: 14px; font-weight: 500;
  display: flex; align-items: center; gap: 8px; z-index: 1000;
  backdrop-filter: blur(8px); border: 1px solid rgba(114, 46, 209, 0.2);
  box-shadow: 0 4px 16px rgba(114, 46, 209, 0.1);
}

.yuemu-chat-window {
  display: flex; flex-direction: column; height: 94%;
  background: var(--card-background, #fff); border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05); overflow: hidden; margin-bottom: 20px;
  border: 1px solid var(--border-color, rgba(0,0,0,0.05));
}

/* 消息滚动区 */
.yuemu-messages-wrapper { flex: 1; overflow: hidden; position: relative; background: var(--background, #fafafa); }
.yuemu-messages-container { height: 100%; display: flex; flex-direction: column; }

.yuemu-history-header { text-align: center; padding: 12px 0; min-height: 40px; }
.yuemu-history-end { color: var(--text-secondary, #999); font-size: 12px; }

.yuemu-btn-ghost {
  background: transparent; border: none; color: #722ed1; font-size: 13px; font-weight: 500;
  cursor: pointer; padding: 6px 16px; border-radius: 20px; transition: 0.2s;
}
.yuemu-btn-ghost:hover { background: rgba(114, 46, 209, 0.08); }

.yuemu-chat-list { flex: 1; overflow-y: auto; padding: 10px 20px 20px; scroll-behavior: smooth; }
.yuemu-chat-list::-webkit-scrollbar { width: 6px; }
.yuemu-chat-list::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 4px; }

.yuemu-loading-bar { text-align: center; padding: 10px; color: var(--text-secondary); font-size: 12px; }
.yuemu-timestamp { text-align: center; margin: 24px 0 16px; color: var(--text-secondary, #999); font-size: 12px; }

/* 消息卡片 */
.yuemu-message-item { margin-bottom: 24px; animation: yuemuSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.yuemu-message-inner { display: flex; gap: 12px; align-items: flex-start; max-width: 85%; }

.yuemu-avatar { width: 36px; height: 36px; border-radius: 50%; overflow: hidden; flex-shrink: 0; box-shadow: 0 2px 8px rgba(0,0,0,0.05); background: var(--hover-background); }
.yuemu-avatar img { width: 100%; height: 100%; object-fit: cover; }

/* 气泡样式 */
.yuemu-message-bubble {
  background: var(--card-background, #fff); color: var(--text-primary, #333);
  padding: 12px 16px; border-radius: 2px 16px 16px 16px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.02);
  border: 1px solid var(--border-color, rgba(0,0,0,0.05));
  font-size: 14.5px; line-height: 1.6; min-width: 60px;
}

/* 用户视角的特殊样式 */
.yuemu-message-item.is-self { display: flex; justify-content: flex-end; }
.yuemu-message-item.is-self .yuemu-message-inner { flex-direction: row-reverse; }
.yuemu-message-item.is-self .yuemu-message-bubble {
  background: linear-gradient(135deg, #722ed1, #9254de);
  color: #fff; border: none; border-radius: 16px 2px 16px 16px;
  box-shadow: 0 4px 12px rgba(114, 46, 209, 0.2);
}

.yuemu-bubble-actions {
  display: flex; justify-content: flex-end; margin-top: 8px; padding-top: 8px;
  border-top: 1px dashed var(--border-color, rgba(0,0,0,0.06));
}
.yuemu-btn-action {
  background: none; border: none; font-size: 12px; color: var(--text-secondary, #999);
  cursor: pointer; display: flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 4px; transition: 0.2s;
}
.yuemu-btn-action:hover { background: rgba(0,0,0,0.04); color: var(--text-primary, #333); }
.text-success { color: #10b981; }

/* ================= 底部输入框 ================= */
.yuemu-chat-input-zone { padding: 16px 20px 20px; background: var(--card-background, #fff); border-top: 1px solid var(--border-color, rgba(0,0,0,0.05)); }
.yuemu-input-capsule {
  display: flex; align-items: center; background: var(--hover-background, #f4f5f7);
  border-radius: 24px; padding: 6px 6px 6px 16px; border: 1px solid transparent; transition: 0.2s;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
}
.yuemu-input-capsule:focus-within { border-color: rgba(114, 46, 209, 0.3); background: var(--card-background, #fff); box-shadow: 0 4px 16px rgba(114, 46, 209, 0.08); }
.yuemu-input { flex: 1; background: transparent; border: none; outline: none; font-size: 15px; color: var(--text-primary); padding: 8px 0; }
.yuemu-input::placeholder { color: var(--text-secondary, #999); }
.yuemu-btn-send {
  width: 40px; height: 40px; border-radius: 50%; border: none; background: #722ed1; color: white;
  display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; flex-shrink: 0; box-shadow: 0 2px 8px rgba(114, 46, 209, 0.3);
}
.yuemu-btn-send:hover:not(:disabled) { transform: scale(1.05); background: #531dab; }
.yuemu-btn-send:disabled { background: #d9d9d9; box-shadow: none; cursor: not-allowed; }

/* ================= Markdown 内容渲染 (使用 :deep) ================= */
:deep(.yuemu-md-body) {
  word-break: break-word;
}
:deep(.yuemu-md-h1), :deep(.yuemu-md-h2), :deep(.yuemu-md-h3), :deep(.yuemu-md-h4) {
  font-weight: 600; margin: 16px 0 8px; color: var(--text-primary);
}
:deep(.yuemu-md-h1) { font-size: 18px; }
:deep(.yuemu-md-h2) { font-size: 16px; }
:deep(.yuemu-md-h3) { font-size: 15px; }

:deep(.yuemu-md-quote) {
  margin: 8px 0; padding: 8px 12px; border-left: 3px solid #722ed1;
  background: rgba(114, 46, 209, 0.05); color: var(--text-secondary); border-radius: 0 6px 6px 0;
}
:deep(.yuemu-md-li) { margin: 4px 0 4px 16px; list-style-type: disc; }
:deep(.yuemu-md-link) { color: #1677ff; text-decoration: none; }
:deep(.yuemu-md-link:hover) { text-decoration: underline; }

:deep(.yuemu-md-inline) {
  background: var(--hover-background, #f0f0f0); color: #e83e8c;
  padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 13px;
}
:deep(.yuemu-md-pre) {
  margin: 12px 0; background: #1e1e1e; border-radius: 10px; overflow: hidden;
}
:deep(.yuemu-md-code-header) {
  background: #2d2d2d; color: #a3a3a3; padding: 6px 12px; font-size: 12px; border-bottom: 1px solid #333; text-transform: uppercase;
}
:deep(.yuemu-md-pre code) {
  display: block; padding: 12px; color: #d4d4d4; font-family: monospace; font-size: 13.5px; overflow-x: auto;
}

/* ================= 移动端深度适配 ================= */
@media screen and (max-width: 768px) {
  .yuemu-chat-room { padding: 0; }
  .yuemu-chat-window { border-radius: 0; margin-bottom: 0; border: none; height: 100dvh; }
  .yuemu-chat-list { padding: 10px 12px 20px; }
  .yuemu-message-inner { max-width: 92%; gap: 8px; }
  .yuemu-avatar { width: 32px; height: 32px; }
  .yuemu-message-bubble { padding: 10px 14px; font-size: 14px; }

  .yuemu-chat-input-zone { padding: 10px 12px 16px; }
  .yuemu-input-capsule { padding: 4px 4px 4px 12px; border-radius: 20px; }
  .yuemu-btn-send { width: 36px; height: 36px; }
}

@keyframes yuemuSlideIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.yuemu-fade-slide-enter-active, .yuemu-fade-slide-leave-active { transition: all 0.3s; }
.yuemu-fade-slide-enter-from, .yuemu-fade-slide-leave-to { opacity: 0; transform: translate(-50%, -20px); }

/* 深色模式兼容 */
@media (prefers-color-scheme: dark) { .yuemu-chat-window { background: #141414; border-color: #333; } }
@media (prefers-color-scheme: dark) { .yuemu-messages-wrapper { background: #000; } }
@media (prefers-color-scheme: dark) { .yuemu-message-bubble { background: #1f1f1f; border-color: #333; color: #eee; } }
@media (prefers-color-scheme: dark) { .yuemu-chat-input-zone { background: #141414; border-color: #333; } }
@media (prefers-color-scheme: dark) { .yuemu-input-capsule { background: #1f1f1f; } }
@media (prefers-color-scheme: dark) { .yuemu-input { color: #eee; } }
@media (prefers-color-scheme: dark) { .yuemu-btn-action:hover { background: rgba(255,255,255,0.1); color: #fff; } }

/* 移动端强制移除点击时的悬停缩放，防止底层长按死锁 */
@media (max-width: 768px) {
  .ant-card-hoverable:active, .ant-card-hoverable:hover,
  .ant-card-hoverable:active *, .ant-card-hoverable:hover *,
  .yuemu-md-link:active, .yuemu-md-link:hover,
  .yuemu-md-link:active *, .yuemu-md-link:hover *,
  .yuemu-btn-ghost:active, .yuemu-btn-ghost:hover,
  .yuemu-btn-ghost:active *, .yuemu-btn-ghost:hover *,
  .yuemu-btn-send:active, .yuemu-btn-send:hover,
  .yuemu-btn-send:active *, .yuemu-btn-send:hover *,
  .yuemu-btn-action:active, .yuemu-btn-action:hover,
  .yuemu-btn-action:active *, .yuemu-btn-action:hover * {
    transform: none !important;
  }
}
</style>
