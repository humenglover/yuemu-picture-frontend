<template>
  <div class="yuemu-unread-like-list">
    <div
      v-for="(like, i) in safeLikes"
      :key="like?.id ?? like?.likeId ?? i"
      class="yuemu-like-item"
      @click="handleTargetClick(like)"
    >
      <div class="yuemu-like-header">
        <a-avatar :src="safeUrl(like.user?.userAvatar) || defaultImage" :size="24" class="yuemu-user-avatar" />
        <span class="yuemu-user-name" :title="like.user?.userName">{{ like.user?.userName || t('components.unreadLikeList.unknownUser') }}</span>
        <span class="yuemu-like-desc">{{ isReceived ? t('components.unreadLikeList.likedYours') : t('components.unreadLikeList.youLiked') }}</span>

        <span class="yuemu-target-badge">
          <PictureOutlined v-if="like.targetType === 1" />
          <FileTextOutlined v-else />
          {{ like.targetType === 1 ? t('components.unreadLikeList.picture') : t('components.unreadLikeList.post') }}
        </span>

        <span class="yuemu-like-time">{{ formatTime(like.lastLikeTime) }}</span>
      </div>

      <div class="yuemu-like-body">
        <template v-if="like.targetType === 1">
          <img
            :src="safeUrl(like.target?.thumbnailUrl) || defaultImage"
            :alt="like.target?.name || t('components.unreadLikeList.pictureInvalid')"
            class="yuemu-target-img"
            @error="onTargetImgError"
          >
          <div class="yuemu-target-content-wrapper">
            <div class="yuemu-target-title">{{ like.target?.name || t('components.unreadLikeList.pictureInvalid') }}</div>
          </div>
        </template>

        <template v-else-if="like.targetType === 2">
          <div class="yuemu-target-content-wrapper">
            <div class="yuemu-target-title">{{ like.target?.title || t('components.unreadLikeList.postInvalid') }}</div>
            <div v-if="like.target?.content" class="yuemu-target-desc">
              {{ stripHtml(like.target.content) }}
            </div>
          </div>
        </template>
      </div>
    </div>

    <div v-if="safeLikes.length === 0" class="yuemu-empty-state">
      <LikeOutlined class="yuemu-empty-icon" />
      <p>{{ t('components.unreadLikeList.noUnreadLikes') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useRouter } from 'vue-router'
import { LikeOutlined, PictureOutlined, FileTextOutlined } from '@ant-design/icons-vue'
import { computed } from 'vue'
import defaultImage from '@/assets/pictureempty.png'

const router = useRouter()

const props = defineProps<{
  likes: any[]
  isReceived?: boolean
}>()

const safeLikes = computed(() => (props.likes || []).filter((item) => !!item))

const formatTime = (time: string) => {
  try {
    return time ? formatDistanceToNow(new Date(time), { addSuffix: true, locale: zhCN }) : '-'
  } catch (error) {
    return '-'
  }
}

const handleTargetClick = (like: any) => {
  if (like.targetType === 1 && like.target?.id) {
    router.push(`/picture-redirect/${like.target.id}`)
  } else if (like.targetType === 2 && like.target?.id) {
    router.push(`/post/${like.target.id}`)
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

const onTargetImgError = (e: Event) => {
  const img = e.target as HTMLImageElement
  img.src = defaultImage
}
</script>

<style scoped>
.yuemu-unread-like-list {
  background: var(--header-background);
  color: var(--text-primary);
  border-radius: 12px;
  padding: 8px;
  width: 100%;
  box-sizing: border-box;
}

.yuemu-like-item {
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  box-sizing: border-box;
  margin-bottom: 4px;

  &:last-child {
    margin-bottom: 0;
  }

  &:hover {
    background: #f8fafc;
  }
}

.yuemu-like-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
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

.yuemu-like-desc {
  color: #64748b;
  flex-shrink: 0;
}

.yuemu-target-badge {
  color: #ff6b6b;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
  background: rgba(255, 107, 107, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}

.yuemu-like-time {
  font-size: 11px;
  color: #94a3b8;
  margin-left: auto;
  white-space: nowrap;
  flex-shrink: 0;
}

.yuemu-like-body {
  margin-left: 30px;
  background: #f1f5f9;
  border-radius: 6px;
  padding: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid transparent;
  transition: border-color 0.2s;
}

.yuemu-like-item:hover .yuemu-like-body {
  border-color: #e2e8f0;
  background: #fff;
}

.yuemu-target-img {
  width: 44px;
  height: 44px;
  object-fit: cover;
  border-radius: 4px;
  flex-shrink: 0;
  border: 1px solid #e2e8f0;
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

.yuemu-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 0;
  color: #94a3b8;
}

.yuemu-empty-icon {
  font-size: 32px;
  color: #ff6b6b;
  margin-bottom: 12px;
  opacity: 0.5;
}

.yuemu-empty-state p {
  font-size: 13px;
  margin: 0;
}

@media screen and (max-width: 768px) {
  .yuemu-like-header {
    flex-wrap: wrap;
  }

  .yuemu-like-time {
    margin-left: 0;
    width: 100%;
    text-align: left;
    padding-left: 30px;
    margin-top: -4px;
  }

  .yuemu-like-body {
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
  .yuemu-like-item:active, .yuemu-like-item:hover,
  .yuemu-like-item:active *, .yuemu-like-item:hover * {
    transform: none !important;
  }
}
</style>
