<template>
  <a-modal
    :open="modelValue"
    @update:open="$emit('update:modelValue', $event)"
    :title="t('components.spaceDetailModal.spaceDetail')"
    :footer="null"
    width="600px"
    class="yuemu-space-detail-modal"
    @cancel="handleClose"
  >
    <div class="yuemu-space-detail-content">
      <div class="yuemu-space-header">
        <div class="yuemu-space-owner">
          <a-avatar
            :size="64"
            :src="spaceDetail?.user?.userAvatar"
            class="yuemu-owner-avatar"
          />
          <div class="yuemu-owner-info">
            <h3 class="yuemu-space-name">{{ spaceDetail?.spaceName }}</h3>
            <div class="yuemu-owner-name">
              {{ t('components.spaceDetailModal.creatorColon') }}{{ spaceDetail?.user?.userName }}
              <span class="yuemu-user-role">{{ spaceDetail?.user?.userRole === 'admin' ? t('components.spaceDetailModal.admin') : t('components.spaceDetailModal.normalUser') }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="yuemu-space-stats">
        <div class="yuemu-stat-item">
          <div class="yuemu-stat-value">{{ formatSize(spaceDetail?.totalSize) }}</div>
          <div class="yuemu-stat-label">{{ t('components.spaceDetailModal.usedSpace') }}</div>
        </div>
        <div class="yuemu-stat-item">
          <div class="yuemu-stat-value">{{ formatSize(spaceDetail?.maxSize) }}</div>
          <div class="yuemu-stat-label">{{ t('components.spaceDetailModal.totalSpace') }}</div>
        </div>
        <div class="yuemu-stat-item">
          <div class="yuemu-stat-value">{{ spaceDetail?.totalCount }}</div>
          <div class="yuemu-stat-label">{{ t('components.spaceDetailModal.pictureCount') }}</div>
        </div>
        <div class="yuemu-stat-item">
          <div class="yuemu-stat-value">{{ spaceDetail?.maxCount }}</div>
          <div class="yuemu-stat-label">{{ t('components.spaceDetailModal.maxCount') }}</div>
        </div>
      </div>

      <div class="yuemu-space-info">
        <a-descriptions :column="1">
          <a-descriptions-item :label="t('components.spaceDetailModal.spaceId')">
            <div class="yuemu-id-container">
              <span>{{ spaceDetail?.id }}</span>
              <a-button class="yuemu-copy-button" type="text" @click="copySpaceId">
                <CopyOutlined />
              </a-button>
            </div>
          </a-descriptions-item>
          <a-descriptions-item :label="t('components.spaceDetailModal.spaceType')">
            <div class="yuemu-space-type">
              {{ spaceDetail?.spaceType === 0 ? t('components.spaceDetailModal.privateSpace') : t('components.spaceDetailModal.teamSpace') }}
              <a-tag :color="spaceDetail?.spaceType === 0 ? '#ff8e53' : '#4096ff'">
                {{ spaceDetail?.spaceLevel === 0 ? t('components.spaceDetailModal.normalVersion') :
                spaceDetail?.spaceLevel === 1 ? t('components.spaceDetailModal.proVersion') : t('components.spaceDetailModal.flagshipVersion') }}
              </a-tag>
            </div>
          </a-descriptions-item>
          <a-descriptions-item :label="t('components.spaceDetailModal.spaceLevel')">
            Level {{ spaceDetail?.spaceLevel }}
          </a-descriptions-item>
          <a-descriptions-item :label="t('components.spaceDetailModal.createTime')">
            {{ formatTime(spaceDetail?.createTime) }}
          </a-descriptions-item>
          <a-descriptions-item :label="t('components.spaceDetailModal.recentUpdate')">
            {{ formatTime(spaceDetail?.updateTime) }}
          </a-descriptions-item>
        </a-descriptions>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

import { ref, defineProps, defineEmits } from 'vue'
import dayjs from 'dayjs'
import { message } from 'ant-design-vue'
import { CopyOutlined } from '@ant-design/icons-vue'

const props = defineProps<{
  modelValue: boolean
  spaceDetail: any
}>()

const emit = defineEmits(['update:modelValue'])

const handleClose = () => {
  emit('update:modelValue', false)
}

// 格式化文件大小
const formatSize = (bytes: string | number) => {
  if (!bytes || isNaN(Number(bytes))) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const value = Number(bytes)
  const i = value === 0 ? 0 : Math.floor(Math.log(value) / Math.log(k))
  if (i < 0 || i >= sizes.length) return '0 B'
  return `${(value / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

// 格式化时间
const formatTime = (time: string) => {
  return time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-'
}

// 复制空间ID
const copySpaceId = () => {
  if (props.spaceDetail?.id) {
    navigator.clipboard.writeText(props.spaceDetail.id.toString())
      .then(() => {
        message.success(t('components.spaceDetailModal.copiedSpaceId'))
      })
      .catch(() => {
        message.error(t('components.spaceDetailModal.copyFailedManualCopy'))
      })
  }
}
</script>

<style scoped>
.yuemu-space-detail-modal {
  :deep(.ant-modal-content) {
    border-radius: 16px;
    overflow: hidden;
  }
}

.yuemu-space-detail-content {
  padding: 20px;
}

.yuemu-space-header {
  margin-bottom: 24px;
}

.yuemu-space-owner {
  display: flex;
  align-items: center;
  gap: 16px;
}

.yuemu-owner-avatar {
  border: 2px solid #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.yuemu-owner-info {
  flex: 1;
}

.yuemu-space-name {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: #1a1a1a;
}

.yuemu-owner-name {
  font-size: 14px;
  color: #666;
}

.yuemu-user-role {
  margin-left: 8px;
  font-size: 12px;
  color: #ff8e53;
  background: #fff6f3;
  padding: 2px 8px;
  border-radius: 10px;
}

.yuemu-space-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
}

.yuemu-stat-item {
  text-align: center;
}

.yuemu-stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.yuemu-stat-label {
  font-size: 13px;
  color: #666;
}

.yuemu-space-info {
  background: white;
  border-radius: 12px;
  padding: 16px;
}

.yuemu-id-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.yuemu-copy-button {
  padding: 2px 4px;
  height: auto;
  font-size: 14px;
  color: #94a3b8;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;

  &:hover {
    color: #1a1a1a;
    background: #f1f5f9;
  }

  &:active {
    transform: scale(0.95);
  }
}

.yuemu-space-type {
  display: flex;
  align-items: center;
  gap: 8px;
}

.yuemu-space-type :deep(.ant-tag) {
  margin: 0;
  border: none;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .yuemu-space-detail-modal {
    :deep(.ant-modal-content) {
      margin: 12px;
    }
  }

  .yuemu-space-detail-content {
    padding: 16px;
  }

  .yuemu-space-owner {
    gap: 12px;
  }

  .yuemu-owner-avatar {
    width: 48px;
    height: 48px;
  }

  .yuemu-space-name {
    font-size: 18px;
  }

  .yuemu-space-stats {
    padding: 12px;
    gap: 12px;
  }

  .yuemu-stat-value {
    font-size: 16px;
  }

  .yuemu-stat-label {
    font-size: 12px;
  }
}

/* 移动端强制移除点击时的悬停缩放，防止底层长按死锁 */
@media (max-width: 768px) {
  .ant-card-hoverable:active, .ant-card-hoverable:hover,
  .ant-card-hoverable:active *, .ant-card-hoverable:hover *,
  .yuemu-copy-button:active, .yuemu-copy-button:hover,
  .yuemu-copy-button:active *, .yuemu-copy-button:hover * {
    transform: none !important;
  }
}
</style>
