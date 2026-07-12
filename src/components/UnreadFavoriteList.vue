<template>
  <div class="yuemu-unread-favorite-list">
    <div
      v-for="(favorite, i) in safeFavorites"
      :key="favorite?.id ?? i"
      class="yuemu-favorite-item"
      @click="handleTargetClick(favorite)"
    >
      <div class="yuemu-favorite-header">
        <img :src="safeUrl(favorite.user?.userAvatar) || defaultImage" :alt="favorite.user?.userName" class="yuemu-user-avatar" />
        <span class="yuemu-user-name" :title="favorite.user?.userName">{{ favorite.user?.userName || t('components.unreadFavoriteList.unknownUser') }}</span>
        <span class="yuemu-favorite-desc">{{ isReceived ? t('components.unreadFavoriteList.favoritedYours') : t('components.unreadFavoriteList.youFavorited') }}</span>

        <span class="yuemu-target-badge">
          <i :class="favorite.targetType === 1 ? 'far fa-image' : 'far fa-file-alt'"></i>
          {{ favorite.targetType === 1 ? t('components.unreadFavoriteList.picture') : t('components.unreadFavoriteList.post') }}
        </span>

        <span class="yuemu-favorite-time">{{ formatTime(favorite.lastFavoriteTime) }}</span>
      </div>

      <div class="yuemu-favorite-body">
        <template v-if="favorite.targetType === 1">
          <img
            :src="safeUrl(favorite.target?.thumbnailUrl) || defaultImage"
            :alt="favorite.target?.name || t('components.unreadFavoriteList.pictureInvalid')"
            class="yuemu-target-img"
            @error="onTargetImgError"
          >
          <div class="yuemu-target-content-wrapper">
            <div class="yuemu-target-title">{{ favorite.target?.name || t('components.unreadFavoriteList.pictureInvalid') }}</div>
          </div>
        </template>

        <template v-else-if="favorite.targetType === 2">
          <div class="yuemu-target-content-wrapper">
            <div class="yuemu-target-title">{{ favorite.target?.title || t('components.unreadFavoriteList.postInvalid') }}</div>
            <div v-if="favorite.target?.content" class="yuemu-target-desc">
              {{ stripHtml(favorite.target.content) }}
            </div>
          </div>
        </template>
      </div>
    </div>

    <div v-if="safeFavorites.length === 0" class="yuemu-empty-state">
      <i class="far fa-heart yuemu-empty-icon"></i>
      <p>{{ isReceived ? t('components.unreadFavoriteList.noReceivedFavorites') : t('components.unreadFavoriteList.noFavoriteRecords') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

import { useRouter } from 'vue-router'
import { computed } from 'vue'
import defaultImage from '@/assets/default.png'

const router = useRouter()

interface FavoriteRecord {
  id: string | number;
  lastFavoriteTime: string;
  user: {
    id: string | number;
    userName: string;
    userAvatar?: string;
  };
  targetType: number; // 1-图片 2-帖子 3-空间
  targetUserId: string | number;
  target: any;
  isRead: number;
}

const props = withDefaults(defineProps<{
  favorites?: FavoriteRecord[]
  isReceived?: boolean
}>(), {
  favorites: () => [],
  isReceived: false
})

const safeFavorites = computed<FavoriteRecord[]>(() => (props.favorites || []).filter((item) => !!item))

// 格式化时间
const formatTime = (timeString: string) => {
  if (!timeString) return '';

  const date = new Date(timeString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return t('components.unreadFavoriteList.justNow');
  } else if (diffInSeconds < 3600) {
    return t('components.unreadFavoriteList.minutesAgo', { min: Math.floor(diffInSeconds / 60) });
  } else if (diffInSeconds < 86400) {
    return t('components.unreadFavoriteList.hoursAgo', { hour: Math.floor(diffInSeconds / 3600) });
  } else {
    return date.toLocaleDateString('zh-CN');
  }
}

// 处理目标点击
const handleTargetClick = (favorite: any) => {
  if (favorite.targetType === 1 && favorite.target?.id) {
    router.push(`/picture-redirect/${favorite.target.id}`)
  } else if (favorite.targetType === 2 && favorite.target?.id) {
    router.push(`/post/${favorite.target.id}`)
  }
}

// 去除 HTML 标签
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
.yuemu-unread-favorite-list {
  background: var(--header-background);
  color: var(--text-primary);
  border-radius: 12px;
  padding: 8px;
  width: 100%;
  box-sizing: border-box;
}

.yuemu-favorite-item {
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  box-sizing: border-box;
  margin-bottom: 4px;
}

.yuemu-favorite-item:last-child {
  margin-bottom: 0;
}

.yuemu-favorite-item:hover {
  background: #f8fafc;
}

.yuemu-favorite-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  font-size: 13px;
  flex-wrap: nowrap;
}

.yuemu-user-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
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

.yuemu-favorite-desc {
  color: #64748b;
  flex-shrink: 0;
}

.yuemu-target-badge {
  color: #f59e0b;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
  background: rgba(245, 158, 11, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}

.yuemu-favorite-time {
  font-size: 11px;
  color: #94a3b8;
  margin-left: auto;
  white-space: nowrap;
  flex-shrink: 0;
}

.yuemu-favorite-body {
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

.yuemu-favorite-item:hover .yuemu-favorite-body {
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
  color: #f59e0b;
  margin-bottom: 12px;
  opacity: 0.5;
}

.yuemu-empty-state p {
  font-size: 13px;
  margin: 0;
}

@media screen and (max-width: 768px) {
  .yuemu-favorite-header {
    flex-wrap: wrap;
  }

  .yuemu-favorite-time {
    margin-left: 0;
    width: 100%;
    text-align: left;
    padding-left: 30px;
    margin-top: -4px;
  }

  .yuemu-favorite-body {
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
  .yuemu-favorite-item:active, .yuemu-favorite-item:hover,
  .yuemu-favorite-item:active *, .yuemu-favorite-item:hover * {
    transform: none !important;
  }
}
</style>
