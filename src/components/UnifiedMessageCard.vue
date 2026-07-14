<template>
  <div class="yuemu-unified-message-list">
    <div v-if="loading" class="yuemu-loading-state">
      <i class="fas fa-circle-notch fa-spin"></i>
      <p>{{ t('components.unifiedMessageCard.loading') }}</p>
    </div>

    <transition-group
      v-else-if="allMessages && allMessages.length > 0"
      name="yuemu-list-fade"
      tag="div"
      class="yuemu-message-grid"
    >
      <template v-for="(message, index) in allMessages" :key="getMessageKey(message, index)">
        <div
          class="yuemu-compact-message-card"
          :class="{ 'yuemu-is-read': isMessageRead(message) }"
          @click="handleMessageClick(message)"
        >
        <div class="yuemu-card-status-info">
          <span class="yuemu-time-stamp">{{ formatTime(getMessageTime(message)) }}</span>
          <div
            v-if="!isMessageRead(message)"
            class="yuemu-status-indicator"
          >
            <div class="yuemu-unread-blue-dot"></div>
            <div
              class="yuemu-quick-read-btn"
              @click.stop="markAsReadExplicitly(message)"
              :title="t('components.unifiedMessageCard.markAsRead')"
            >
              <CheckOutlined />
            </div>
          </div>
        </div>

        <div class="yuemu-user-meta-line">
          <img
            v-if="messageType !== 'system'"
            :src="getUserAvatar(message) || defaultImage"
            class="yuemu-inline-avatar"
            @error="handleImageError"
            alt="avatar"
          />
          <div v-else class="yuemu-inline-system-icon" :class="getSystemIconClass(message.notifyType)">
            <component :is="getSystemNotificationIcon(message.notifyType)" />
          </div>

          <div class="yuemu-meta-text-wrap">
            <span class="yuemu-user-name">{{ getUserName(message) }}</span>
            <span class="yuemu-action-text" v-if="messageType !== 'system'">
              {{ getActionText() }}
            </span>
            <span v-else class="yuemu-inline-system-tag" :class="getSystemIconClass(message.notifyType)">
              {{ getNotificationTagText(message.notifyType) }}
            </span>
          </div>
        </div>

        <div class="yuemu-card-main-content">
          <div v-if="messageType === 'comment'" class="yuemu-comment-content">
            {{ message.content }}
          </div>
          <div v-else-if="messageType === 'system'" class="yuemu-system-content">
            <div class="yuemu-system-title">{{ message.title }}</div>
            <p class="yuemu-system-desc">{{ message.content }}</p>
          </div>
        </div>

        <div class="yuemu-card-refer-footer" v-if="messageType !== 'system'">
          <div class="yuemu-target-embed-card">
            <img
              v-if="getTargetInfo(message).type === 'picture'"
              :src="getTargetInfo(message).image || defaultImage"
              class="yuemu-embed-thumb"
              @error="handleImageError"
            />
            <div v-else class="yuemu-embed-icon"><FileTextOutlined /></div>
            <div class="yuemu-embed-info">
              <span class="yuemu-embed-title">{{ getTargetInfo(message).title || t('components.unifiedMessageCard.contentInvalid') }}</span>
            </div>
          </div>
        </div>
        </div>
        
        <div v-if="$enableAds && index > 0 && index % 11 === 0" :key="'ad-' + index" class="yuemu-compact-message-card" style="padding: 0; min-height: 120px; overflow: hidden; position: relative; border: none; background: transparent; box-shadow: none;">
          <GlobalAdBanner margin="0" :fillHeight="true" />
        </div>
      </template>
    </transition-group>

    <div v-else class="yuemu-empty-state">
      <div class="yuemu-empty-icon-wrapper">
        <component :is="getIconComponent()" />
      </div>
      <p>{{ t('components.unifiedMessageCard.noRecord', { title: getTitle() }) }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

// @ts-nocheck
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useRouter } from 'vue-router'
import {
  CommentOutlined, LikeOutlined, ShareAltOutlined, BellOutlined,
  FileImageOutlined, FileTextOutlined, StarOutlined, ExclamationCircleOutlined,
  CheckOutlined
} from '@ant-design/icons-vue'
import { message as antMessage } from 'ant-design-vue'
import { markSingleAsReadUsingPost } from '@/api/messageCenterController'
import defaultImage from '@/assets/default.png'
import GlobalAdBanner from '@/components/GlobalAdBanner.vue'

const router = useRouter()
const props = defineProps<{
  messageType: 'comment' | 'like' | 'share' | 'system'
  allMessages: any[]
  unreadCount: number
  loading?: boolean
}>()

const emit = defineEmits(['refresh'])

// === 辅助业务逻辑 ===
const getTitle = () => ({ comment: t('components.unifiedMessageCard.commentTitle'), like: t('components.unifiedMessageCard.likeTitle'), share: t('components.unifiedMessageCard.shareTitle'), system: t('components.unifiedMessageCard.systemNotifyTitle') }[props.messageType] || t('components.unifiedMessageCard.messageTitle'))
const getActionText = () => ({ comment: t('components.unifiedMessageCard.commentAction'), like: t('components.unifiedMessageCard.likeAction'), share: t('components.unifiedMessageCard.shareAction') }[props.messageType] || '')
const getIconComponent = () => ({ comment: CommentOutlined, like: LikeOutlined, share: ShareAltOutlined, system: BellOutlined }[props.messageType] || BellOutlined)

const getTargetInfo = (msg: any) => {
  const info = { type: 'unknown', title: '', image: '', id: null }
  const targetObj = props.messageType === 'comment' ? (msg.targetType === 1 ? msg.picture : msg.post) : msg.target
  if (!targetObj) return info
  info.type = msg.targetType === 1 ? 'picture' : 'post'
  info.title = targetObj.name || targetObj.title
  info.image = targetObj.thumbnailUrl
  info.id = targetObj.id
  return info
}

const getSystemNotificationIcon = (type: string) => {
  const icons = { PICTURE_APPROVED: FileImageOutlined, PICTURE_REJECTED: ExclamationCircleOutlined, POST_APPROVED: FileTextOutlined, POST_REJECTED: ExclamationCircleOutlined, PICTURE_FEATURED: StarOutlined, POST_FEATURED: StarOutlined }
  return icons[type] || BellOutlined
}

const getSystemIconClass = (type: string) => ({ PICTURE_APPROVED: 'yuemu-status-success', PICTURE_REJECTED: 'yuemu-status-error', PICTURE_FEATURED: 'yuemu-status-warning' }[type] || 'yuemu-status-default')

const getNotificationTagText = (type: string) => {
  const tags = { PICTURE_APPROVED: t('components.unifiedMessageCard.picApproved'), PICTURE_REJECTED: t('components.unifiedMessageCard.picRejected'), POST_APPROVED: t('components.unifiedMessageCard.postApproved'), POST_REJECTED: t('components.unifiedMessageCard.postRejected'), PICTURE_FEATURED: t('components.unifiedMessageCard.picFeatured'), POST_FEATURED: t('components.unifiedMessageCard.postFeatured') }
  return tags[type] || t('components.unifiedMessageCard.systemNotifyDefault')
}

const getMessageKey = (msg: any, index: number) => msg?.id ?? index
const formatTime = (time: string) => time ? formatDistanceToNow(new Date(time), { addSuffix: true, locale: zhCN }) : '-'
const getUserName = (msg: any) => (props.messageType === 'system' ? t('components.unifiedMessageCard.yuemuAssistant') : (msg.commentUser?.userName || msg.user?.userName || t('components.unifiedMessageCard.unknownUser')))
const getUserAvatar = (msg: any) => (props.messageType === 'comment' ? msg.commentUser?.userAvatar : msg.user?.userAvatar)
const getMessageTime = (msg: any) => msg.createTime || msg.lastLikeTime || msg.shareTime
const isMessageRead = (msg: any) => (props.messageType === 'system' ? msg.readStatus === 1 : msg.isRead === 1)

// === 交互逻辑 ===
const markAsReadInternal = async (msg: any) => {
  const id = props.messageType === 'system' ? msg.id : (msg.id || msg.commentId || msg.likeId || msg.shareId)
  if (!id || isMessageRead(msg)) return false
  const res = await markSingleAsReadUsingPost({ type: props.messageType, id })
  if (res.data?.code === 0) {
    if (props.messageType === 'system') msg.readStatus = 1; else msg.isRead = 1
    return true
  }
  return false
}

const markAsReadExplicitly = async (msg: any) => {
  if (await markAsReadInternal(msg)) { antMessage.success(t('common.message.markAsRead')); emit('refresh') }
}

const handleMessageClick = async (msg: any) => {
  const wasUnread = !isMessageRead(msg)
  await markAsReadInternal(msg)
  if (wasUnread) emit('refresh')
  if (props.messageType === 'system') return
  const info = getTargetInfo(msg)
  if (info.id) router.push(info.type === 'picture' ? `/picture-redirect/${info.id}` : `/post/${info.id}`)
}

const handleImageError = (e: Event) => { e.target.src = defaultImage }
</script>

<style scoped>

.yuemu-message-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: 1fr;
}

@media screen and (min-width: 769px) {
  .yuemu-message-grid {
    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
    gap: 14px;
    padding: 10px;
  }
}

/* =========== 极致紧凑卡片 =========== */
.yuemu-compact-message-card {
  background: var(--card-background, #fff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 14px;
  padding: 12px;
  transition: all 0.2s ease;
  position: relative;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
}

@media screen and (min-width: 769px) {
  .yuemu-compact-message-card:hover {
    border-color: var(--link-color, #3b82f6);
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    transform: translateY(-1px);
  }
}

.yuemu-compact-message-card.yuemu-is-read {
  opacity: 0.65;
}

/* =========== 状态区域 =========== */
.yuemu-card-status-info {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  z-index: 2;
  pointer-events: none;
}

.yuemu-time-stamp {
  font-size: 11px;
  color: var(--text-tertiary, #94a3b8);
  white-space: nowrap;
}

.yuemu-status-indicator {
  display: flex;
  align-items: center;
  pointer-events: auto;
}

.yuemu-unread-blue-dot {
  width: 7px;
  height: 7px;
  background: var(--link-color, #3b82f6);
  border-radius: 50%;
  transition: opacity 0.2s;
}

.yuemu-quick-read-btn {
  font-size: 13px;
  color: var(--link-color, #3b82f6);
  padding: 3px;
  border-radius: 4px;
  background: rgba(59, 130, 246, 0.08);
  margin-left: -7px;
  opacity: 0;
  transition: all 0.2s ease;
}

@media screen and (max-width: 768px) {
  .yuemu-compact-message-card:not(.yuemu-is-read) .yuemu-quick-read-btn {
    opacity: 1;
  }
  .yuemu-compact-message-card:not(.yuemu-is-read) .yuemu-unread-blue-dot {
    opacity: 0;
  }
}

@media screen and (min-width: 769px) {
  .yuemu-compact-message-card:not(.yuemu-is-read):hover .yuemu-quick-read-btn {
    opacity: 1;
    transform: scale(1.1);
  }
  .yuemu-compact-message-card:not(.yuemu-is-read):hover .yuemu-unread-blue-dot {
    opacity: 0;
  }
}

/* =========== 第一行：用户信息流 =========== */
.yuemu-user-meta-line {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-right: 70px;
  min-height: 24px;
}

.yuemu-inline-avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1px solid #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  flex-shrink: 0;
}

.yuemu-inline-system-icon {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #fff;
  flex-shrink: 0;
}

.yuemu-meta-text-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  min-width: 0;
}

.yuemu-user-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary, #1e293b);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.yuemu-action-text {
  font-size: 13px;
  color: var(--text-secondary, #64748b);
}

.yuemu-inline-system-tag {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 600;
}

/* =========== 第二行：主内容 =========== */
.yuemu-card-main-content {
  width: 100%;
  min-width: 0;
  overflow: hidden;
}

.yuemu-comment-content {
  font-size: 14px;
  color: var(--text-primary, #0f172a);
  line-height: 1.5;
  word-wrap: break-word;
  word-break: break-word;
  overflow-wrap: break-word;
  margin: 0;
  max-width: 100%;
}

.yuemu-system-content {
  padding: 8px 10px;
  background: var(--hover-background, #f1f5f9);
  border-radius: 8px;
  border: 1px solid var(--border-color, #e2e8f0);
}

.yuemu-system-title {
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 3px;
  color: var(--text-primary);
}

.yuemu-system-desc {
  font-size: 12px;
  color: var(--text-secondary, #64748b);
  margin: 0;
  line-height: 1.5;
}

/* =========== 第三行：引用卡片 =========== */
.yuemu-card-refer-footer {
  width: 100%;
  margin-top: 2px;
}

.yuemu-target-embed-card {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--hover-background, #f1f5f9);
  padding: 5px 8px;
  border-radius: 6px;
  border: 1px solid transparent;
  transition: border-color 0.2s;
}

.yuemu-compact-message-card:hover .yuemu-target-embed-card {
  border-color: var(--border-color);
}

.yuemu-embed-thumb {
  width: 20px;
  height: 20px;
  border-radius: 3px;
  object-fit: cover;
}

.yuemu-embed-icon {
  font-size: 12px;
  color: var(--text-tertiary, #94a3b8);
}

.yuemu-embed-info {
  flex: 1;
  min-width: 0;
}

.yuemu-embed-title {
  font-size: 12px;
  color: var(--text-secondary, #64748b);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

/* =========== 语义化颜色状态 =========== */
.yuemu-status-success { background-color: #52c41a; color: #fff; }
.yuemu-inline-system-tag.yuemu-status-success { background-color: rgba(82, 196, 26, 0.1); color: #52c41a; }

.yuemu-status-error { background-color: #ff4d4f; color: #fff; }
.yuemu-inline-system-tag.yuemu-status-error { background-color: rgba(255, 77, 79, 0.1); color: #ff4d4f; }

.yuemu-status-warning { background-color: #faad14; color: #fff; }
.yuemu-inline-system-tag.yuemu-status-warning { background-color: rgba(250, 173, 20, 0.1); color: #faad14; }

.yuemu-status-default { background-color: var(--link-color, #3b82f6); color: #fff; }
.yuemu-inline-system-tag.yuemu-status-default { background-color: rgba(59, 130, 246, 0.1); color: var(--link-color, #3b82f6); }

/* =========== 其他状态 UI =========== */
.yuemu-loading-state, .yuemu-empty-state { padding: 40px 0; text-align: center; color: var(--text-tertiary); }
.yuemu-loading-state i { font-size: 24px; color: var(--link-color); margin-bottom: 8px; }
.yuemu-empty-icon-wrapper { font-size: 32px; margin-bottom: 8px; opacity: 0.5; }

/* 列表动画 */
.yuemu-list-fade-enter-active, .yuemu-list-fade-leave-active { transition: all 0.25s ease; }
.yuemu-list-fade-enter-from { opacity: 0; transform: translateY(10px); }
.yuemu-list-fade-leave-to { opacity: 0; transform: scale(0.95); }

/* 移动端强制移除点击时的悬停缩放，防止底层长按死锁 */
@media (max-width: 768px) {
  .yuemu-compact-message-card:active, .yuemu-compact-message-card:hover,
  .yuemu-compact-message-card:active *, .yuemu-compact-message-card:hover *,
  .ant-card-hoverable:active, .ant-card-hoverable:hover,
  .ant-card-hoverable:active *, .ant-card-hoverable:hover * {
    transform: none !important;
  }
}
</style>
