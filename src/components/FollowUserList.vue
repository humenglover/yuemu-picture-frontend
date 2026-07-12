<template>
  <div v-if="props.mode === 'list'" class="yuemu-follow-users-container">
    <div v-if="!props.users || props.users.length === 0" class="yuemu-empty-following-small">
      <p class="yuemu-empty-tip">{{ t('components.followUserList.noFollowing') }}</p>
    </div>
    <div v-else class="yuemu-follow-users-list">
      <div
        v-for="user in props.users"
        :key="user.id"
        class="yuemu-follow-user-item"
        @click="$emit('item-click', user.id)"
      >
        <img :src="user.userAvatar || getDefaultAvatar(user.userName)" :alt="user.userName" class="yuemu-follow-user-avatar" />
        <span class="yuemu-follow-user-name">{{ user.userName }}</span>
      </div>
      <div class="yuemu-follow-user-item yuemu-view-more-item" @click="$emit('more-click')">
        <div class="yuemu-view-more-avatar">
          <i class="fas fa-plus"></i>
        </div>
        <span class="yuemu-follow-user-name">{{ t('components.followUserList.viewMore') }}</span>
      </div>
    </div>
  </div>

  <div v-else-if="props.mode === 'stack'" class="yuemu-following-filter-content">
    <div class="yuemu-avatar-stack-v3">
      <div v-for="(user, index) in props.users.slice(0, maxCount)"
           :key="user.id"
           class="yuemu-stacked-avatar-wrapper-v3"
           :style="{ zIndex: 50 - index }"
           @click="$emit('item-click', user.id)">
        <img :src="user.userAvatar || getDefaultAvatar(user.userName)" class="yuemu-stacked-avatar-v3" />
        <div class="yuemu-name-tooltip-v3">{{ user.userName }}</div>
      </div>
      <div v-if="props.users.length > maxCount" class="yuemu-stacked-more-v3" @click="$emit('more-click')">
        +{{ props.users.length - maxCount }}
      </div>
    </div>
    <div class="yuemu-following-tip-text">
      <span class="yuemu-tip-inner-v3">{{ t('components.followUserList.recentlyFollowed', { count: props.users.length }) }}</span>
      <div class="yuemu-mobile-plus-v3" @click="$emit('more-click')">
        <i class="fas fa-plus"></i>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getDefaultAvatar } from '@/utils/userUtils'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface User {
  id: string | number
  userName: string
  userAvatar?: string
}

const props = withDefaults(defineProps<{
  users?: User[]
  mode?: 'list' | 'stack'
  loading?: boolean
  maxCount?: number
}>(), {
  users: () => [],
  mode: 'list',
  loading: false,
  maxCount: 12
})

defineEmits(['item-click', 'more-click'])
</script>

<style scoped>
/* List 模式 (移动端/Banner下) */
.yuemu-follow-users-container {
  padding: 15px 10px;
  background: var(--card-background);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.yuemu-follow-users-container::-webkit-scrollbar {
  display: none;
}

.yuemu-follow-users-list {
  display: flex;
  gap: 15px;
  min-width: max-content;
}

.yuemu-follow-user-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 60px;
  cursor: pointer;
  transition: transform 0.2s;
}

.yuemu-follow-user-item:active {
  transform: scale(0.95);
}

.yuemu-follow-user-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--border-color);
}

.yuemu-follow-user-name {
  font-size: 11px;
  color: var(--text-secondary);
  width: 100%;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.yuemu-view-more-item .yuemu-view-more-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: var(--hover-background);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  border: 2px dashed var(--border-color);
}

/* Stack 模式 (PC 导航) */
.yuemu-following-filter-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
  overflow: hidden;
  max-width: 100%;
}

.yuemu-avatar-stack-v3 {
  display: flex;
  align-items: center;
}

.yuemu-stacked-avatar-wrapper-v3 {
  position: relative;
  margin-right: -15px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.yuemu-stacked-avatar-wrapper-v3:hover {
  transform: translateY(-8px) scale(1.15);
  z-index: 100 !important;
}

.yuemu-stacked-avatar-v3 {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 3px solid var(--card-background);
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  object-fit: cover;
}

.yuemu-name-tooltip-v3 {
  position: absolute;
  top: -36px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--text-primary);
  color: var(--background);
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 11px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s;
  pointer-events: none;
  z-index: 100;
}

.yuemu-stacked-avatar-wrapper-v3:hover .yuemu-name-tooltip-v3 {
  opacity: 1;
  visibility: visible;
  top: -42px;
}

.yuemu-stacked-more-v3 {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--hover-background);
  border: 3px solid var(--card-background);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 700;
  margin-left: 10px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
  cursor: pointer;
}

.yuemu-following-tip-text {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
  margin-left: 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
}

.yuemu-mobile-plus-v3 {
  display: none;
}

.yuemu-empty-following-small {
  padding: 10px;
  text-align: center;
}

.yuemu-empty-tip {
  font-size: 12px;
  color: var(--text-secondary);
}

/* 响应式适配移动端堆叠效果 */
@media screen and (max-width: 768px) {
  .yuemu-following-filter-content {
    gap: 12px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    width: 100%;
  }

  .yuemu-following-filter-content::-webkit-scrollbar {
    display: none;
  }

  .yuemu-stacked-avatar-v3, .yuemu-stacked-more-v3 {
    width: 38px;
    height: 38px;
    border-width: 2px;
  }

  .yuemu-stacked-avatar-wrapper-v3 {
    margin-right: -12px;
  }

  .yuemu-following-tip-text {
    font-size: 11px;
    white-space: nowrap !important;
    overflow: visible !important;
    flex: 0 0 auto;
    min-width: 0;
    margin-left: 8px;
    display: flex;
    align-items: center;
  }

  .yuemu-tip-inner-v3 {
    display: none;
  }

  .yuemu-mobile-plus-v3 {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: var(--hover-background);
    border-radius: 50%;
    color: var(--text-secondary);
    border: 1px solid var(--border-color);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
  }

  .yuemu-mobile-plus-v3:active {
    transform: scale(0.9);
    background: var(--border-color);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);
  }

  .yuemu-mobile-plus-v3 i {
    font-size: 12px;
  }
}

/* 移动端强制移除点击时的悬停缩放，防止底层长按死锁 */
@media (max-width: 768px) {
  .ant-card-hoverable:active, .ant-card-hoverable:hover,
  .ant-card-hoverable:active *, .ant-card-hoverable:hover *,
  .yuemu-stacked-avatar-wrapper-v3:active, .yuemu-stacked-avatar-wrapper-v3:hover,
  .yuemu-stacked-avatar-wrapper-v3:active *, .yuemu-stacked-avatar-wrapper-v3:hover * {
    transform: none !important;
  }
}
</style>
