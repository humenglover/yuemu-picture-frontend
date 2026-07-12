<template>
  <div class="yuemu-space-card" @click="emit('click')">
    <div class="yuemu-cover-section">
      <img
        :src="spaceInfo.spaceCover || defaultCover"
        :alt="t('components.spaceInfoCard.spaceCover')"
        class="yuemu-cover-img"
        @error="e => (e.target as HTMLImageElement).src = defaultCover"
      />
      <div class="yuemu-cover-overlay">
        <div class="yuemu-space-name">{{ spaceInfo.spaceName }}</div>
      </div>
    </div>

    <div class="yuemu-creator-badge">
      <img
        :src="spaceInfo.user?.userAvatar || defaultAvatar"
        :alt="t('components.spaceInfoCard.creatorAvatar')"
        class="yuemu-creator-avatar"
        @error="e => (e.target as HTMLImageElement).src = defaultAvatar"
      />
      <span class="yuemu-creator-name">{{ spaceInfo.user?.userName || t('components.spaceInfoCard.unknownCreator') }}</span>
    </div>

    <div class="yuemu-content-section">
      <p class="yuemu-space-desc">{{ spaceInfo.spaceDesc || t('components.spaceInfoCard.noDesc') }}</p>

      <div class="yuemu-card-stats">
        <div class="yuemu-stat-item">
          <div class="yuemu-stat-value">{{ spaceInfo.memberCount || 0 }}</div>
          <div class="yuemu-stat-label">{{ t('components.spaceInfoCard.members') }}</div>
        </div>
        <div class="yuemu-stat-item">
          <div class="yuemu-stat-value">{{ spaceInfo.totalCount || 0 }}</div>
          <div class="yuemu-stat-label">{{ t('components.spaceInfoCard.pictures') }}</div>
        </div>
        <div class="yuemu-stat-item">
          <div class="yuemu-stat-tag" :class="spaceInfo.spaceType === 1 ? 'yuemu-team' : 'yuemu-private'">
            <i :class="spaceInfo.spaceType === 1 ? 'fas fa-users' : 'fas fa-lock'"></i>
            {{ spaceInfo.spaceType === 1 ? t('components.spaceInfoCard.team') : t('components.spaceInfoCard.private') }}
          </div>
        </div>
      </div>

      <div class="yuemu-progress-wrapper">
        <div class="yuemu-progress-text">
          <span>{{ formatSize(spaceInfo.totalSize) }} / {{ formatSize(spaceInfo.maxSize) }}</span>
          <span class="yuemu-usage-rate">{{ sizeProgress.toFixed(1) }}%</span>
        </div>
        <div class="yuemu-progress-bar">
          <div class="yuemu-progress-fill" :style="{ width: sizeProgress + '%' }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

import { computed } from 'vue'
import defaultCover from '@/assets/images/default_space_cover.png'
import defaultAvatar from '@/assets/default.png'

interface User {
  id: string
  userAccount: string
  userName: string
  userAvatar: string
  email: string
  userProfile: string
  userRole: string
  createTime: string
  fansCount: null | number
  followCount: null | number
}

interface SpaceInfo {
  id: string
  spaceName: string
  spaceLevel: number
  spaceType: number
  maxSize: string
  maxCount: string
  totalSize: string
  totalCount: string
  spaceDesc: string
  spaceCover: string
  userId: string
  createTime: string
  editTime: string
  updateTime: string
  isRecommended: number
  user: User | null
  permissionList: []
  memberCount: string
  activities: null
  recommendedUsers: null
}

const props = defineProps<{
  spaceInfo: SpaceInfo
}>()

const emit = defineEmits(['click'])

const formatSize = (size: string) => {
  const num = Number(size) || 0
  if (num === 0) return '0B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(num) / Math.log(k))
  return `${(num / Math.pow(k, i)).toFixed(1)}${sizes[i]}`
}

const sizeProgress = computed(() => {
  const used = Number(props.spaceInfo.totalSize) || 0
  const total = Number(props.spaceInfo.maxSize) || 0
  return total === 0 ? 0 : Math.min((used / total) * 100, 100)
})
</script>

<style scoped>
.yuemu-space-card {
  width: 100%;
  background: var(--card-background, #fff);
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
  border: 1px solid var(--border-color, #eee);
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  cursor: pointer;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
}

.yuemu-space-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 28px rgba(0,0,0,0.12);
  border-color: transparent;
}

.yuemu-cover-section {
  position: relative;
  height: 140px;
  width: 100%;
  overflow: hidden;
}

.yuemu-cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.yuemu-space-card:hover .yuemu-cover-img {
  transform: scale(1.05);
}

.yuemu-cover-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 100%);
  display: flex;
  align-items: flex-end;
  padding: 16px;
}

.yuemu-space-name {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
  margin-bottom: 12px;
  letter-spacing: 0.5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.yuemu-creator-badge {
  position: absolute;
  top: 120px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--card-background, #fff);
  padding: 4px 12px 4px 4px;
  border-radius: 30px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  z-index: 10;
  border: 1px solid var(--border-color, #f0f0f0);
}

.yuemu-creator-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
}

.yuemu-creator-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary, #333);
}

.yuemu-content-section {
  padding: 24px 16px 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.yuemu-space-desc {
  font-size: 14px;
  color: var(--text-secondary, #666);
  margin: 0 0 16px 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 42px;
}

.yuemu-card-stats {
  display: flex;
  gap: 16px;
  margin-bottom: auto;
  padding-bottom: 20px;
}

.yuemu-stat-item {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.yuemu-stat-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary, #1a1a1a);
  line-height: 1.2;
}

.yuemu-stat-slash {
  font-size: 14px;
  color: var(--text-tertiary, #bbb);
  margin: 0 2px;
  font-weight: 400;
}

.yuemu-stat-label {
  font-size: 11px;
  color: var(--text-secondary, #999);
  margin-top: 4px;
  font-weight: 500;
}

.yuemu-stat-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  height: fit-content;
  margin-top: 2px;
}

.yuemu-team {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.yuemu-private {
  background: rgba(234, 179, 8, 0.1);
  color: #eab308;
}

.yuemu-progress-wrapper {
  width: 100%;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed var(--border-color, #eee);
}

.yuemu-progress-text {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-secondary, #888);
  margin-bottom: 8px;
  font-weight: 500;
}

.yuemu-usage-rate {
  color: var(--text-primary, #333);
  font-weight: 600;
}

.yuemu-progress-bar {
  height: 3px;
  background: var(--hover-background, #f0f0f0);
  border-radius: 1.5px;
  overflow: hidden;
}

.yuemu-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
  border-radius: 1.5px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

@media (max-width: 480px) {
  .yuemu-cover-section { height: 120px; }
  .yuemu-space-name { font-size: 18px; }
  .yuemu-creator-badge { top: 104px; }
  .yuemu-content-section { padding: 20px 14px 14px; }
}

/* 移动端强制移除点击时的悬停缩放，防止底层长按死锁 */
@media (max-width: 768px) {
  .ant-card-hoverable:active, .ant-card-hoverable:hover,
  .ant-card-hoverable:active *, .ant-card-hoverable:hover *,
  .yuemu-space-card:active, .yuemu-space-card:hover,
  .yuemu-space-card:active *, .yuemu-space-card:hover * {
    transform: none !important;
  }
}
</style>
