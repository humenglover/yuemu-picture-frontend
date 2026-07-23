<template>
  <div class="yuemu-unread-comment-list">
    <template v-if="safeComments && safeComments.length > 0">
      <div
        v-for="(comment, i) in safeComments"
        :key="comment?.id ?? comment?.commentId ?? i"
        class="yuemu-comment-item"
        :class="{ 'yuemu-clickable': isTargetClickable(comment) }"
        @click="handleTargetClick(comment)"
      >
        <div class="yuemu-comment-header">
          <a-avatar :src="safeUrl(comment.commentUser?.userAvatar) || defaultImage" :size="24" class="yuemu-user-avatar" />
          <span class="yuemu-user-name" :title="comment.commentUser?.userName">{{ comment.commentUser?.userName || t('components.unreadCommentList.unknownUser') }}</span>
          <span class="yuemu-comment-desc">{{ isReceived ? t('components.unreadCommentList.commentedYours') : t('components.unreadCommentList.youCommented') }}</span>

          <span class="yuemu-target-badge">
            <PictureOutlined v-if="comment.targetType === 1" />
            <FileTextOutlined v-else />
            {{ comment.targetType === 1 ? t('components.unreadCommentList.picture') : t('components.unreadCommentList.post') }}
          </span>

          <span class="yuemu-comment-time">{{ formatTime(comment.createTime) }}</span>
        </div>

        <div class="yuemu-comment-text" v-if="comment.content">
          {{ comment.content }}
        </div>

        <div class="yuemu-comment-body">
          <template v-if="comment.targetType === 1">
            <img
              :src="(comment.picture && comment.picture.thumbnailUrl) ? comment.picture.thumbnailUrl : defaultImage"
              :alt="comment.picture?.name || t('components.unreadCommentList.pictureInvalid')"
              @error="handleImageError"
              class="yuemu-target-img"
              :class="{ 'yuemu-error': !isTargetClickable(comment) }"
            >
            <div class="yuemu-target-content-wrapper">
              <div class="yuemu-target-title">{{ comment.picture?.name || t('components.unreadCommentList.pictureInvalid') }}</div>
              <div v-if="!isTargetClickable(comment)" class="yuemu-target-status">
                {{ t('components.unreadCommentList.picDeletedOrInaccessible') }}
              </div>
            </div>
          </template>

          <template v-else-if="comment.targetType === 2">
            <div class="yuemu-target-content-wrapper">
              <div class="yuemu-target-title">{{ comment.post?.title || t('components.unreadCommentList.postInvalid') }}</div>
              <div class="yuemu-target-desc" v-if="comment.post?.content">
                {{ stripHtml(comment.post.content) }}
              </div>
              <div v-if="!isTargetClickable(comment)" class="yuemu-target-status">
                {{ t('components.unreadCommentList.postDeletedOrInaccessible') }}
              </div>
            </div>
          </template>
        </div>
      </div>
    </template>

    <div v-else class="yuemu-empty-state">
      <CommentOutlined class="yuemu-empty-icon" />
      <p>{{ t('components.unreadCommentList.noUnreadComments') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useRouter } from 'vue-router'
import { CommentOutlined, PictureOutlined, FileTextOutlined } from '@ant-design/icons-vue'
import { computed } from 'vue'

const router = useRouter()

const props = defineProps<{
  comments: any[]
  isReceived?: boolean
}>()

const safeComments = computed(() => (props.comments || []).filter((item) => !!item))

const defaultImage = 'src/assets/pictureempty.png'

const formatTime = (time: string) => {
  try {
    return time ? formatDistanceToNow(new Date(time), { addSuffix: true, locale: zhCN }) : '-'
  } catch (error) {
    return '-'
  }
}

const isTargetClickable = (comment: any) => {
  if (comment.targetType === 1) {
    return comment.picture && comment.picture.id
  } else if (comment.targetType === 2) {
    return comment.post && comment.post.id
  }
  return false
}

const handleImageError = (e: Event) => {
  const img = e.target as HTMLImageElement
  img.src = defaultImage
  img.classList.add('yuemu-error')
}

const handleTargetClick = (comment: any) => {
  try {
    if (!isTargetClickable(comment)) return

    if (comment.targetType === 1 && comment.picture?.id) {
      router.push({ name: 'PictureRedirect', params: { id: comment.picture.id } })
    } else if (comment.targetType === 2 && comment.post?.id) {
      router.push({ name: 'PostDetail', params: { id: comment.post.id } })
    }
  } catch (error) {
    console.error(error)
  }
}

const stripHtml = (html: string) => {
  if (!html) return ''
  return html.replace(/<[^>]+>/g, '').slice(0, 45) + '...'
}

const safeUrl = (url?: string) => {
  if (!url) return ''
  return url.replace(/`/g, '').trim()
}
</script>

<style scoped>
.yuemu-unread-comment-list {
  background: var(--header-background);
  color: var(--text-primary);
  border-radius: 12px;
  padding: 8px;
}

.yuemu-comment-item {
  padding: 10px;
  border-radius: 8px;
  transition: all 0.2s ease;
  width: 100%;
  box-sizing: border-box;
  margin-bottom: 4px;

  &:last-child {
    margin-bottom: 0;
  }

  &.yuemu-clickable {
    cursor: pointer;
    &:hover {
      background: #f8fafc;
    }
    &:hover .yuemu-comment-body {
      background: #fff;
      border-color: #e2e8f0;
    }
  }
}

.yuemu-comment-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  font-size: 13px;
  flex-wrap: nowrap;
}

.yuemu-user-avatar {
  flex-shrink: 0;
}

.yuemu-user-name {
  font-weight: 500;
  color: #1a1a1a;
  max-width: 90px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.yuemu-comment-desc {
  color: #64748b;
  flex-shrink: 0;
}

.yuemu-target-badge {
  color: #4299e1;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
  background: rgba(66, 153, 225, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}

.yuemu-comment-time {
  font-size: 11px;
  color: #94a3b8;
  margin-left: auto;
  white-space: nowrap;
  flex-shrink: 0;
}

.yuemu-comment-text {
  margin-left: 30px;
  font-size: 13px;
  color: #1a1a1a;
  line-height: 1.5;
  margin-bottom: 8px;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.yuemu-comment-body {
  margin-left: 30px;
  background: #f1f5f9;
  border-radius: 6px;
  padding: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid transparent;
  transition: border-color 0.2s, background 0.2s;
}

.yuemu-target-img {
  width: 44px;
  height: 44px;
  object-fit: cover;
  border-radius: 4px;
  flex-shrink: 0;
  border: 1px solid #e2e8f0;

  &.yuemu-error {
    opacity: 0.5;
    filter: grayscale(100%);
  }
}

.yuemu-target-content-wrapper {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.yuemu-target-title {
  font-weight: 500;
  color: #334155;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.yuemu-target-desc {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.yuemu-target-status {
  font-size: 11px;
  color: #ef4444;
  margin-top: 4px;
  display: inline-block;
  background: rgba(239, 68, 68, 0.05);
  padding: 2px 6px;
  border-radius: 4px;
}

.yuemu-empty-state {
  text-align: center;
  padding: 32px 0;
  color: #94a3b8;
}

.yuemu-empty-icon {
  font-size: 32px;
  color: #4299e1;
  margin-bottom: 12px;
  opacity: 0.5;
}

.yuemu-empty-state p {
  font-size: 13px;
  margin: 0;
}

@media screen and (max-width: 768px) {
  .yuemu-comment-header {
    flex-wrap: wrap;
  }

  .yuemu-comment-time {
    margin-left: 0;
    width: 100%;
    text-align: left;
    padding-left: 30px;
    margin-top: -4px;
  }

  .yuemu-comment-text {
    margin-left: 0;
  }

  .yuemu-comment-body {
    margin-left: 0;
    padding: 6px;
  }

  .yuemu-target-img {
    width: 36px;
    height: 36px;
  }
}

/* 移动端强制移除点击时的悬停缩放，防止底层长按死锁 */
@media (max-width: 768px) {
  .ant-card-hoverable:active, .ant-card-hoverable:hover,
  .ant-card-hoverable:active *, .ant-card-hoverable:hover *,
  .yuemu-clickable:active, .yuemu-clickable:hover,
  .yuemu-clickable:active *, .yuemu-clickable:hover * {
    transform: none !important;
  }
}
</style>
