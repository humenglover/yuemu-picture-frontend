<template>
  <div class="yuemu-comment-list">
    <div v-for="comment in comments"
         :key="comment.commentId"
         class="comment-item"
         :class="{ 'optimistic': comment.isOptimistic }">

      <div class="comment-container">
        <div class="avatar-container">
          <img
            :src="comment.commentUser?.userAvatar || getDefaultAvatar(comment.commentUser?.userName)"
            alt="User"
            class="user-avatar"
            @click="handleUserClick(comment.commentUser)"
          />
        </div>

        <div class="comment-content">
          <div class="comment-header">
            <span class="username" @click="handleUserClick(comment.commentUser)" :title="comment.commentUser?.userName">
              {{ comment.commentUser?.userName }}
            </span>
            <span v-if="comment.location" class="comment-meta location" :title="comment.location">
              <svg class="svg-icon-mini" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21s-7-5.5-7-10.5a7 7 0 1 1 14 0c0 5-7 10.5-7 10.5z"></path><circle cx="12" cy="10.5" r="2.5"></circle></svg>
              <span class="truncate-text">{{ comment.location }}</span>
            </span>
            <span class="comment-meta time">{{ formatTime(comment.createTime) }}</span>
          </div>

          <div class="comment-text">
            {{ comment.content }}
          </div>

          <div class="comment-actions">
            <div class="action-item like-btn" @click="handleLike(comment)" :class="{ 'active': likedComments.includes(comment.commentId) }">
              <div class="icon-wrap">
                <svg v-if="!likedComments.includes(comment.commentId)" class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                <svg v-else class="svg-icon solid-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
              </div>
              <span v-if="comment.likeCount && Number(comment.likeCount) > 0" class="count">{{ comment.likeCount }}</span>
            </div>

            <div class="action-item dislike-btn" @click="handleDislike(comment)" :class="{ 'active': dislikedComments.includes(comment.commentId) }">
              <div class="icon-wrap">
                <svg v-if="!dislikedComments.includes(comment.commentId)" class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h5v11h-5z"></path></svg>
                <svg v-else class="svg-icon solid-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h5v11h-5z"></path></svg>
              </div>
            </div>

            <div class="action-item reply-btn" @click="handleReply(comment)">
              <div class="icon-wrap">
                <svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
              </div>
              <span class="reply-text">{{ t('components.comment.reply') }}</span>
            </div>

            <div v-if="canDelete(comment)" class="action-item delete-btn" @click="handleDelete(comment)">
              <div class="icon-wrap">
                <svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline stroke-linecap="round" stroke-linejoin="round" points="3 6 5 6 21 6"></polyline><path stroke-linecap="round" stroke-linejoin="round" d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="hasReplies(comment)" class="comment-children">
        <div class="thread-main-line"></div>

        <div v-for="(reply, index) in getAllReplies(comment)"
             :key="reply.commentId"
             class="reply-item"
             :class="{ 'optimistic': reply.isOptimistic }">

          <div class="comment-container">
            <div class="avatar-container">
              <img
                :src="reply.commentUser?.userAvatar || getDefaultAvatar(reply.commentUser?.userName)"
                alt="User"
                class="user-avatar small-avatar"
                @click="handleUserClick(reply.commentUser)"
              />
            </div>

            <div class="comment-content">
              <div class="comment-header">
                <span class="username" @click="handleUserClick(reply.commentUser)" :title="reply.commentUser?.userName">
                  {{ reply.commentUser?.userName }}
                </span>
                <span v-if="reply.location" class="comment-meta location" :title="reply.location">
                  <svg class="svg-icon-mini" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21s-7-5.5-7-10.5a7 7 0 1 1 14 0c0 5-7 10.5-7 10.5z"></path><circle cx="12" cy="10.5" r="2.5"></circle></svg>
                  <span class="truncate-text">{{ reply.location }}</span>
                </span>
                <span class="comment-meta time">{{ formatTime(reply.createTime) }}</span>
              </div>

              <div class="comment-text">
                <template v-if="reply.targetUser && reply.targetUser.userName">
                  <span class="reply-to" @click="handleUserClick(reply.targetUser)">{{ t('components.comment.replyTo') }}{{ reply.targetUser.userName }}：</span>
                </template>
                {{ reply.content }}
              </div>

              <div class="comment-actions">
                <div class="action-item like-btn" @click="handleLike(reply)" :class="{ 'active': likedComments.includes(reply.commentId) }">
                  <div class="icon-wrap">
                    <svg v-if="!likedComments.includes(reply.commentId)" class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                    <svg v-else class="svg-icon solid-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                  </div>
                  <span v-if="reply.likeCount && Number(reply.likeCount) > 0" class="count">{{ reply.likeCount }}</span>
                </div>

                <div class="action-item dislike-btn" @click="handleDislike(reply)" :class="{ 'active': dislikedComments.includes(reply.commentId) }">
                  <div class="icon-wrap">
                    <svg v-if="!dislikedComments.includes(reply.commentId)" class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h5v11h-5z"></path></svg>
                    <svg v-else class="svg-icon solid-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h5v11h-5z"></path></svg>
                  </div>
                </div>

                <div class="action-item reply-btn" @click="handleReply(reply)">
                  <div class="icon-wrap">
                    <svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                  </div>
                  <span class="reply-text">{{ t('components.comment.reply') }}</span>
                </div>

                <div v-if="canDelete(reply)" class="action-item delete-btn" @click="handleDelete(reply)">
                  <div class="icon-wrap">
                    <svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline stroke-linecap="round" stroke-linejoin="round" points="3 6 5 6 21 6"></polyline><path stroke-linecap="round" stroke-linejoin="round" d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 自定义删除确认弹窗 -->
    <Teleport to="body">
    <div v-if="showDeleteConfirm" class="custom-modal-overlay" @click.self="cancelDelete">
      <div class="custom-modal">
        <div class="custom-modal-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
        </div>
        <h3 class="custom-modal-title">{{ t('components.comment.confirmDeleteTitle') }}</h3>
        <p class="custom-modal-desc">{{ t('components.comment.confirmDeleteDesc') }}</p>
        <div class="custom-modal-actions">
          <button class="custom-modal-btn cancel-btn" @click="cancelDelete">{{ t('components.comment.cancel') }}</button>
          <button class="custom-modal-btn confirm-btn" @click="confirmDelete">{{ t('components.comment.confirmDelete') }}</button>
        </div>
          </div>
    </div>
    </Teleport>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { deleteCommentUsingPost, likeCommentUsingPost } from '@/api/commentsController.ts'
import { message } from 'ant-design-vue'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'
import { useRouter } from 'vue-router'
import { getDefaultAvatar } from '@/utils/userUtils'
import moment from 'moment'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const router = useRouter()
const loginUserStore = useLoginUserStore()

const likedComments = ref<string[]>([])
const dislikedComments = ref<string[]>([])

interface CommentUser {
  id?: string
  userAccount?: string
  userAvatar?: string
  userName?: string
}

interface Comment {
  commentId?: string
  userId?: string
  targetId?: string
  targetType?: number
  targetUserId?: string
  content?: string
  parentId?: string | null
  likeCount?: string
  dislikeCount?: string
  createTime?: string
  commentUser?: CommentUser
  targetUser?: CommentUser
  children?: Comment[]
  isExpanded?: boolean
  isRead?: number
  picture?: string | null
  post?: string | null
  location?: string | null
  isOptimistic?: boolean
}

const props = defineProps<{
  comments: Comment[]
}>()

const emit = defineEmits<{
  (e: 'reply-clicked', commentId: string, userName: string): void
  (e: 'update-comments'): void
}>()

const hasReplies = (comment: Comment) => {
  return comment.children && comment.children.length > 0
}

const getAllReplies = (comment: Comment) => {
  const allReplies: Comment[] = []
  const collectReplies = (replies: Comment[] | undefined, parentComment?: Comment) => {
    if (!replies) return
    replies.forEach(reply => {
      // 容错处理：如果后端没返回 targetUser，根据树状层级自动把父级用户作为被回复人
      if (!reply.targetUser && parentComment) {
        reply.targetUser = parentComment.commentUser
      }
      allReplies.push(reply)
      if (reply.children) {
        collectReplies(reply.children, reply)
      }
    })
  }
  collectReplies(comment.children, comment)
  return allReplies
}

const handleLike = async (comment: Comment) => {
  if (comment.isOptimistic || comment.commentId?.startsWith('temp_')) {
    message.warning(t('components.comment.waitSend'))
    return
  }

  try {
    if (likedComments.value.includes(comment.commentId!)) return
    const likeCountDelta = 1
    let dislikeCountDelta = 0
    likedComments.value.push(comment.commentId!)

    if (dislikedComments.value.includes(comment.commentId!)) {
      dislikedComments.value = dislikedComments.value.filter((id) => id !== comment.commentId)
      dislikeCountDelta = -1
    }

    const requestBody = {
      commentId: comment.commentId,
      likeCount: likeCountDelta,
      dislikeCount: dislikeCountDelta,
    }
    const res = await likeCommentUsingPost(requestBody)
    if (res.data.code === 0 ) {
      comment.likeCount = String(Number(comment.likeCount || 0) + likeCountDelta)
      comment.dislikeCount = String(Number(comment.dislikeCount || 0) + dislikeCountDelta)
    } else {
      likedComments.value = likedComments.value.filter(id => id !== comment.commentId)
      if (dislikeCountDelta !== 0) dislikedComments.value.push(comment.commentId!)
      message.error(res.data.message || t('components.comment.opFailed'))
    }
  } catch (error) {
    likedComments.value = likedComments.value.filter(id => id !== comment.commentId)
    message.error(t('components.comment.opFailed'))
  }
}

const handleDislike = async (comment: Comment) => {
  if (comment.isOptimistic || comment.commentId?.startsWith('temp_')) {
    message.warning(t('components.comment.waitSend'))
    return
  }

  try {
    if (dislikedComments.value.includes(comment.commentId!)) return
    let likeCountDelta = 0
    const dislikeCountDelta = 1
    dislikedComments.value.push(comment.commentId!)

    if (likedComments.value.includes(comment.commentId!)) {
      likedComments.value = likedComments.value.filter((id) => id !== comment.commentId)
      likeCountDelta = -1
    }

    const requestBody = {
      commentId: comment.commentId,
      likeCount: likeCountDelta,
      dislikeCount: dislikeCountDelta,
    }
    const res = await likeCommentUsingPost(requestBody)
    if (res.data.code === 0) {
      comment.likeCount = String(Number(comment.likeCount || 0) + likeCountDelta)
      comment.dislikeCount = String(Number(comment.dislikeCount || 0) + dislikeCountDelta)
    } else {
      dislikedComments.value = dislikedComments.value.filter(id => id !== comment.commentId)
      if (likeCountDelta !== 0) likedComments.value.push(comment.commentId!)
      message.error(res.data.message || t('components.comment.opFailed'))
    }
  } catch (error) {
    dislikedComments.value = dislikedComments.value.filter(id => id !== comment.commentId)
    message.error(t('components.comment.opFailed'))
  }
}

const showDeleteConfirm = ref(false)
const commentToDelete = ref<Comment | null>(null)

const handleDelete = (comment: Comment) => {
  commentToDelete.value = comment
  showDeleteConfirm.value = true
}

const confirmDelete = async () => {
  if (!commentToDelete.value) return
  try {
    const res = await deleteCommentUsingPost({ commentId: commentToDelete.value.commentId })
    if (res.data.code === 0) {
      emit('update-comments')
    }
  } catch (error) {
    message.error(t('components.comment.deleteFailed'))
  } finally {
    showDeleteConfirm.value = false
    commentToDelete.value = null
  }
}

const cancelDelete = () => {
  showDeleteConfirm.value = false
  commentToDelete.value = null
}

const canDelete = (comment: Comment) => {
  return comment.commentUser?.id === loginUserStore.loginUser?.id && !comment.isOptimistic
}

const handleReply = (comment: Comment) => {
  if (comment.isOptimistic || comment.commentId?.startsWith('temp_')) {
    message.warning(t('components.comment.waitReply'))
    return
  }
  const userName = comment.commentUser?.userName || t('common.message.unknown')
  emit('reply-clicked', comment.commentId!, userName)
}

const handleUserClick = (user: CommentUser | undefined) => {
  if (user?.id) {
    router.push({
      path: `/user/${user.id}`,
      query: {
        userName: user.userName,
        userAvatar: user.userAvatar,
        userAccount: user.userAccount,
        userProfile: user.userProfile,
        userRole: user.userRole,
        createTime: user.createTime
      }
    })
  }
}

const formatTime = (time: string | undefined) => {
  if (!time) return t('components.comment.justNow')
  const date = moment(time)
  const now = moment()

  if (now.diff(date, 'minutes') < 1) {
    return t('components.comment.justNow')
  } else if (now.diff(date, 'hours') < 1) {
    return `${now.diff(date, 'minutes')}${t('components.comment.minsAgo')}`
  } else if (now.diff(date, 'days') < 1 && now.date() === date.date()) {
    return `${now.diff(date, 'hours')}${t('components.comment.hoursAgo')}`
  } else if (now.diff(date, 'days') < 2) {
    return t('components.comment.yesterday') + date.format('HH:mm')
  } else if (now.year() === date.year()) {
    return date.format('MM-DD HH:mm')
  } else {
    return date.format('YYYY-MM-DD')
  }
}
</script>

<style scoped>
.yuemu-comment-list {
  width: 100%;
  box-sizing: border-box;
}

.comment-item {
  margin-bottom: 24px;
}

.comment-container {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  object-fit: cover;
  background-color: var(--hover-background);
  border: 1px solid var(--border-color);
  transition: filter 0.2s ease, border-color 0.2s ease;
  margin-top: 2px;
}
.user-avatar:hover {
  filter: brightness(0.9);
  border-color: var(--link-color);
}

.comment-content {
  flex: 1;
  min-width: 0;
}

.comment-header {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 8px;
  margin-bottom: 4px;
  width: 100%;
}

.username {
  font-weight: 500;
  font-size: 13.5px;
  color: var(--comment-username-color);
  cursor: pointer;
  transition: color 0.2s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 1;
  max-width: 150px;
}
.username:hover { color: var(--link-hover-color); }

.comment-meta {
  font-size: 12px;
  color: var(--comment-time-color);
  white-space: nowrap;
}

.comment-meta.time {
  flex-shrink: 0;
}

.comment-meta.location {
  display: flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 1;
  max-width: 120px;
}

.truncate-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.comment-text {
  font-size: 14.5px;
  line-height: 1.5;
  color: var(--comment-text-color);
  margin: 4px 0 8px 0;
  word-break: break-word;
  white-space: pre-wrap;
}

.reply-to {
  color: var(--link-color, #1677ff);
  cursor: pointer;
  font-weight: 500;
  margin-right: 4px;
  transition: opacity 0.2s ease;
  word-break: break-all;
}
.reply-to:hover { opacity: 0.8; text-decoration: underline; }

.comment-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-left: -8px;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  color: var(--comment-action-color);
  font-size: 12px;
  font-weight: 500;
  user-select: none;
  padding: 6px 8px;
  border-radius: 20px;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.svg-icon { width: 16px; height: 16px; }
.svg-icon-mini { width: 12px; height: 12px; flex-shrink: 0; }
.solid-icon { stroke: none; }

.action-item:hover { color: var(--comment-action-hover-color); }
.action-item:active .icon-wrap { transform: scale(0.8); }

.like-btn.active { color: var(--like-button-active-color) !important; }
.dislike-btn.active { color: var(--link-color) !important; }
.delete-btn:hover { color: var(--comment-delete-hover-color) !important; }

.comment-children {
  position: relative;
  margin-top: 12px;
  padding-left: 48px;
}

.thread-main-line {
  position: absolute;
  top: -24px;
  bottom: 24px;
  left: 17px;
  width: 2px;
  background-color: var(--comment-divider-color);
  z-index: 1;
}

.reply-item {
  position: relative;
  margin-bottom: 16px;
  z-index: 2;
}

.small-avatar {
  width: 24px;
  height: 24px;
  margin-top: 2px;
  position: relative;
  z-index: 3;
}

.reply-item::before {
  content: "";
  position: absolute;
  left: -31px;
  top: -8px;
  width: 19px;
  height: 22px;
  border-left: 2px solid var(--comment-divider-color);
  border-bottom: 2px solid var(--comment-divider-color);
  border-bottom-left-radius: 12px;
  pointer-events: none;
  z-index: 1;
}

@media (max-width: 768px) {
  .comment-item { margin-bottom: 20px; }
  .comment-container { gap: 10px; }

  .user-avatar { width: 32px; height: 32px; margin-top: 0; }

  .comment-header { margin-bottom: 2px; gap: 6px; }
  .username { font-size: 13px; max-width: 90px; }
  .comment-meta { font-size: 11.5px; }
  .comment-meta.location { max-width: 70px; }

  .comment-text { font-size: 14px; line-height: 1.45; margin: 4px 0 6px 0; }

  .comment-actions { gap: 12px; margin-left: -6px; }
  .action-item { padding: 4px 6px; font-size: 11.5px; }
  .svg-icon { width: 15px; height: 15px; }

  .comment-children { padding-left: 42px; margin-top: 8px; }
  .thread-main-line { left: 15px; top: -16px; bottom: 20px; }
  .reply-item { margin-bottom: 12px; }
  .small-avatar { width: 20px; height: 20px; margin-top: 0; }
  .reply-item::before { left: -27px; top: -10px; width: 17px; height: 20px; border-bottom-left-radius: 8px; }
}

.comment-item.optimistic .comment-container,
.reply-item.optimistic .comment-container {
  position: relative; opacity: 0.6; filter: grayscale(30%); transform: scale(0.995);
  transition: transform 0.2s ease, filter 0.2s ease, opacity 0.2s ease; overflow: hidden;
}

.comment-item.optimistic .comment-container::after,
.reply-item.optimistic .comment-container::after {
  content: ''; position: absolute; top: 0; bottom: 0; left: 0; width: 100%;
  background: linear-gradient(90deg, transparent 0%, var(--hover-background) 50%, transparent 100%);
  animation: optimisticShimmer 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  z-index: 11; pointer-events: none; transform: translateX(-100%);
}

@keyframes optimisticShimmer {
  0% { transform: translateX(-100%) skewX(-15deg); }
  100% { transform: translateX(100%) skewX(-15deg); }
}

.comment-item.optimistic .action-item, .reply-item.optimistic .action-item,
.comment-item.optimistic .user-avatar, .comment-item.optimistic .username,
.reply-item.optimistic .user-avatar, .reply-item.optimistic .username {
  pointer-events: none; cursor: not-allowed; opacity: 0.5;
}

/* 自定义删除确认弹窗样式 */
.custom-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 99999;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  animation: fadeIn 0.2s ease;
}

.custom-modal {
  background: var(--card-background, #fff);
  width: 320px;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: zoomIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  border: 1px solid var(--border-color, #f0f0f0);
}

.custom-modal-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: rgba(255, 77, 79, 0.1);
  color: #ff4d4f;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 16px;
}

.custom-modal-icon svg {
  width: 24px;
  height: 24px;
}

.custom-modal-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary, #333);
  margin: 0 0 8px 0;
}

.custom-modal-desc {
  font-size: 14px;
  color: var(--text-secondary, #666);
  margin: 0 0 24px 0;
  text-align: center;
  line-height: 1.5;
}

.custom-modal-actions {
  display: flex;
  gap: 12px;
  width: 100%;
}

.custom-modal-btn {
  flex: 1;
  height: 40px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.2s;
  border: none;
}

.custom-modal-btn.cancel-btn {
  background-color: var(--hover-background, #f5f5f5);
  color: var(--text-primary, #333);
}

.custom-modal-btn.cancel-btn:hover {
  background-color: var(--border-color, #e8e8e8);
}

.custom-modal-btn.confirm-btn {
  background-color: #ff4d4f;
  color: white;
}

.custom-modal-btn.confirm-btn:hover {
  background-color: #ff7875;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes zoomIn {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
</style>
