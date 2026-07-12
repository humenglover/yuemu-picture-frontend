<template>
  <div class="yuemu-unread-share-list">
    <div
      v-for="(share, i) in safeShares"
      :key="share?.id ?? share?.shareId ?? i"
      class="yuemu-share-item"
      @click="handleTargetClick(share)"
    >
      <div class="yuemu-share-header">
        <a-avatar :src="safeUrl(share.user?.userAvatar) || defaultImage" :size="24" class="yuemu-user-avatar" />
        <span class="yuemu-user-name" :title="share.user?.userName">{{ share.user?.userName || t('components.unreadShareList.unknownUser') }}</span>
        <span class="yuemu-share-desc">{{ isReceived ? t('components.unreadShareList.sharedYours') : t('components.unreadShareList.youShared') }}</span>

        <span class="yuemu-target-badge">
          <i :class="share.targetType === 1 ? 'far fa-image' : 'far fa-file-alt'"></i>
          {{ share.targetType === 1 ? t('components.unreadShareList.picture') : t('components.unreadShareList.post') }}
        </span>

        <span class="yuemu-share-time">{{ formatTime(share.shareTime) }}</span>
      </div>

      <div class="yuemu-share-body">
        <template v-if="share.targetType === 1">
          <img
            :src="safeUrl(share.target?.thumbnailUrl) || defaultImage"
            :alt="share.target?.name || t('components.unreadShareList.pictureInvalid')"
            class="yuemu-target-img"
            @error="onTargetImgError"
          >
          <div class="yuemu-target-content-wrapper">
            <div class="yuemu-target-title">{{ share.target?.name || t('components.unreadShareList.pictureInvalid') }}</div>
          </div>
        </template>

        <template v-else-if="share.targetType === 2">
          <div class="yuemu-target-content-wrapper">
            <div class="yuemu-target-title">{{ share.target?.title || t('components.unreadShareList.postInvalid') }}</div>
            <div v-if="share.target?.content" class="yuemu-target-desc">
              {{ stripHtml(share.target.content) }}
            </div>
          </div>
        </template>
      </div>
    </div>

    <div v-if="safeShares.length === 0" class="yuemu-empty-state">
      <i class="far fa-share-alt yuemu-empty-icon"></i>
      <p>{{ t('components.unreadShareList.noUnreadShares') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useRouter } from 'vue-router'
import { computed } from 'vue'
import defaultImage from '@/assets/default.png'

const router = useRouter()

const props = withDefaults(defineProps<{
  shares?: any[]
  isReceived?: boolean
}>(), {
  shares: () => [],
  isReceived: false
})

const safeShares = computed(() => (props.shares || []).filter((item) => !!item))

// 格式化时间（增加异常处理）
const formatTime = (time: string) => {
  try {
    return time ? formatDistanceToNow(new Date(time), { addSuffix: true, locale: zhCN }) : '-'
  } catch (error) {
    console.error(t('components.unreadShareList.timeFormatErrorColon'), error)
    return '-'
  }
}

// 处理目标点击
const handleTargetClick = (share: any) => {
  if (share.targetType === 1 && share.target?.id) {
    router.push(`/picture-redirect/${share.target.id}`)
  } else if (share.targetType === 2 && share.target?.id) {
    router.push(`/post/${share.target.id}`)
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
.yuemu-unread-share-list {
  background: var(--header-background);
  color: var(--text-primary);
  border-radius: 12px;
  padding: 8px;
  width: 100%;
  box-sizing: border-box;
}

.yuemu-share-item {
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  box-sizing: border-box;
  margin-bottom: 4px;
}

.yuemu-share-item:last-child {
  margin-bottom: 0;
}

.yuemu-share-item:hover {
  background: #f8fafc;
}

/* --- 紧凑头部样式 --- */
.yuemu-share-header {
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

.yuemu-share-desc {
  color: #64748b;
  flex-shrink: 0;
}

.yuemu-target-badge {
  color: #60c3d5;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
  background: rgba(96, 195, 213, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}

.yuemu-share-time {
  font-size: 11px;
  color: #94a3b8;
  margin-left: auto;
  white-space: nowrap;
  flex-shrink: 0;
}

/* --- 内部引用区块样式 --- */
.yuemu-share-body {
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

.yuemu-share-item:hover .yuemu-share-body {
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

/* --- 空状态 --- */
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
  color: #60c3d5;
  margin-bottom: 12px;
  opacity: 0.5;
}

.yuemu-empty-state p {
  font-size: 13px;
  margin: 0;
}

/* --- 移动端适配 --- */
@media screen and (max-width: 768px) {
  .yuemu-share-header {
    flex-wrap: wrap;
  }

  .yuemu-share-time {
    margin-left: 0;
    width: 100%;
    text-align: left;
    padding-left: 30px;
    margin-top: -4px;
  }

  .yuemu-share-body {
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
  .yuemu-share-item:active, .yuemu-share-item:hover,
  .yuemu-share-item:active *, .yuemu-share-item:hover * {
    transform: none !important;
  }
}
</style>
