<template>
  <div class="yuemu-unread-system-notify-list">
    <template v-if="safeNotifies && safeNotifies.length > 0">
      <div v-for="(notify, i) in safeNotifies" :key="notify?.id ?? i" class="yuemu-notify-item">
        <div class="yuemu-notify-content-wrap">
          <div class="yuemu-notify-icon" :class="getNotifyTypeClass(notify.notifyType)">
            <i class="far fa-bell" v-if="notify.notifyType === 'ADMIN_ANNOUNCE'"></i>
            <i class="far fa-star" v-else-if="notify.notifyType === 'POST_SELECTED'"></i>
            <i class="far fa-trash-alt" v-else-if="notify.notifyType === 'POST_DELETED'"></i>
            <i class="far fa-edit" v-else-if="notify.notifyType === 'POST_UPDATED'"></i>
            <i class="far fa-user" v-else-if="notify.notifyType === 'ACCOUNT_CHANGED'"></i>
            <i class="far fa-exclamation-circle" v-else-if="notify.notifyType === 'SYSTEM_ALERT'"></i>
            <i class="far fa-bell" v-else></i>
          </div>

          <div class="yuemu-notify-main">
            <div class="yuemu-notify-header">
              <span class="yuemu-notify-type">{{ getNotifyTypeName(notify.notifyType) }}</span>
              <span class="yuemu-notify-time">{{ formatTime(notify.createTime) }}</span>
            </div>

            <div class="yuemu-notify-title">{{ notify.title || t('components.unreadSystemNotifyList.untitled') }}</div>

            <div class="yuemu-notify-content">{{ notify.content || '' }}</div>
          </div>

          <div class="yuemu-mark-read-btn" @click="markAsRead(notify.id)">
            <i class="far fa-check"></i>
          </div>
        </div>
      </div>
    </template>
    <div v-else class="yuemu-empty-state">
      <i class="far fa-bell yuemu-empty-icon"></i>
      <p>{{ t('components.unreadSystemNotifyList.noUnreadSystemNotify') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { message } from 'ant-design-vue'
import { computed } from 'vue'
import { markAsReadUsingPut } from '@/api/systemNotifyController'

const props = defineProps<{
  notifies: any[]
}>()

const emit = defineEmits(['refresh'])

const safeNotifies = computed(() => (props.notifies || []).filter((item) => !!item))

const formatTime = (time: string) => {
  try {
    return time ? formatDistanceToNow(new Date(time), { addSuffix: true, locale: zhCN }) : '-'
  } catch (error) {
    return '-'
  }
}

const getNotifyTypeClass = (type: string) => {
  const typeClassMap: Record<string, string> = {
    'ADMIN_ANNOUNCE': 'yuemu-admin-announce',
    'POST_SELECTED': 'yuemu-post-selected',
    'POST_DELETED': 'yuemu-post-deleted',
    'POST_UPDATED': 'yuemu-post-updated',
    'ACCOUNT_CHANGED': 'yuemu-account-changed',
    'SYSTEM_ALERT': 'yuemu-system-alert'
  }
  return typeClassMap[type] || 'yuemu-default'
}

const getNotifyTypeName = (type: string) => {
  const typeNameMap: Record<string, string> = {
    'ADMIN_ANNOUNCE': t('components.unreadSystemNotifyList.adminAnnounce'),
    'POST_SELECTED': t('components.unreadSystemNotifyList.postSelected'),
    'POST_DELETED': t('components.unreadSystemNotifyList.postDeleted'),
    'POST_UPDATED': t('components.unreadSystemNotifyList.postUpdated'),
    'ACCOUNT_CHANGED': t('components.unreadSystemNotifyList.accountChanged'),
    'SYSTEM_ALERT': t('components.unreadSystemNotifyList.systemAlert')
  }
  return typeNameMap[type] || t('components.unreadSystemNotifyList.systemNotify')
}

const markAsRead = async (id?: number) => {
  if (!id) return
  try {
    const res = await markAsReadUsingPut({ id })
    if (res.data?.code === 0) {
      message.success(t('components.unreadSystemNotifyList.markedAsRead'))
      emit('refresh')
    } else {
      message.error(res.data?.message || t('components.unreadSystemNotifyList.operationFailed'))
    }
  } catch (error) {
    message.error(t('components.unreadSystemNotifyList.operationFailed'))
  }
}
</script>

<style scoped>
.yuemu-unread-system-notify-list {
  background: var(--header-background);
  color: var(--text-primary);
  border-radius: 12px;
  padding: 12px;
  width: 100%;
  box-sizing: border-box;
}

.yuemu-notify-item {
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  transition: all 0.2s ease;
  width: 100%;
  box-sizing: border-box;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: #f8fafc;
    border-radius: 8px;
  }
}

.yuemu-notify-content-wrap {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
  box-sizing: border-box;
}

.yuemu-notify-icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #fff;

  &.yuemu-admin-announce {
    background: linear-gradient(135deg, #3b82f6, #60a5fa);
  }

  &.yuemu-post-selected {
    background: linear-gradient(135deg, #f59e0b, #fbbf24);
  }

  &.yuemu-post-deleted {
    background: linear-gradient(135deg, #ef4444, #f87171);
  }

  &.yuemu-post-updated {
    background: linear-gradient(135deg, #8b5cf6, #a78bfa);
  }

  &.yuemu-account-changed {
    background: linear-gradient(135deg, #10b981, #34d399);
  }

  &.yuemu-system-alert {
    background: linear-gradient(135deg, #ec4899, #f472b6);
  }

  &.yuemu-default {
    background: linear-gradient(135deg, #64748b, #94a3b8);
  }
}

.yuemu-notify-main {
  flex: 1;
  min-width: 0;
}

.yuemu-notify-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  font-size: 13px;
  flex-wrap: wrap;
}

.yuemu-notify-type {
  font-weight: 500;
  color: #1a1a1a;
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  white-space: nowrap;
}

.yuemu-notify-time {
  font-size: 11px;
  color: #999;
  margin-left: auto;
  white-space: nowrap;
}

.yuemu-notify-title {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  word-break: break-word;
}

.yuemu-notify-content {
  font-size: 13px;
  color: #1a1a1a;
  line-height: 1.4;
  margin-bottom: 6px;
  padding: 0 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  word-break: break-word;
}

.yuemu-mark-read-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #64748b;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s ease;

  &:hover {
    background: #3b82f6;
    color: #fff;
  }
}

.yuemu-empty-state {
  text-align: center;
  padding: 32px 0;
  color: #666;
  width: 100%;
  box-sizing: border-box;
}

.yuemu-empty-icon {
  font-size: 40px;
  color: #3b82f6;
  margin-bottom: 12px;
  opacity: 0.5;
}

.yuemu-empty-state p {
  font-size: 13px;
  color: #666;
  margin: 0;
}

@media screen and (max-width: 768px) {
  .yuemu-notify-item {
    padding: 10px;
  }

  .yuemu-notify-content, .yuemu-notify-title {
    -webkit-line-clamp: 2;
    word-break: break-word;
  }

  .yuemu-notify-header {
    flex-wrap: wrap;
  }

  .yuemu-notify-time {
    margin-left: 0;
    margin-top: 2px;
    width: 100%;
    text-align: right;
  }
}

/* 移动端强制移除点击时的悬停缩放，防止底层长按死锁 */
@media (max-width: 768px) {
  .ant-card-hoverable:active, .ant-card-hoverable:hover,
  .ant-card-hoverable:active *, .ant-card-hoverable:hover *,
  .yuemu-mark-read-btn:active, .yuemu-mark-read-btn:hover,
  .yuemu-mark-read-btn:active *, .yuemu-mark-read-btn:hover * {
    transform: none !important;
  }
}
</style>
