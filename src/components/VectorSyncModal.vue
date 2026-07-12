<template>
  <teleport to="body">
    <transition name="yuemu-fade-scale">
      <div class="yuemu-modal-overlay" v-if="visible" @click.self="handleClose">
        <div class="yuemu-modal-box yuemu-vector-sync-modal">
          <button class="yuemu-modal-close" @click="handleClose">
            <CloseOutlined />
          </button>

          <div class="yuemu-modal-header">
            <div class="yuemu-modal-icon">
              <DatabaseOutlined />
            </div>
            <h3 class="yuemu-modal-title">{{ t('components.vectorSyncModal.fullGallerySync') }}</h3>
            <p class="yuemu-modal-desc">
              {{ t('components.vectorSyncModal.syncDescription') }}
            </p>
          </div>

          <div class="yuemu-modal-body">
            <!-- 未开始状态 -->
            <div v-if="status === 'idle'" class="yuemu-sync-idle">
              <div class="yuemu-warning-card">
                <ExclamationCircleOutlined class="yuemu-warning-icon" />
                <div class="yuemu-warning-text">
                  <strong>{{ t('components.vectorSyncModal.attention') }}</strong> {{ t('components.vectorSyncModal.warningDesc') }}
                </div>
              </div>
              <a-button type="primary" size="large" class="yuemu-sync-start-btn" @click="startSync" :loading="starting">
                <ThunderboltOutlined /> {{ t('components.vectorSyncModal.startGlobalBatch') }}
              </a-button>
            </div>

            <!-- 同步中状态 -->
            <div v-else class="yuemu-sync-progress-wrap">
              <div class="yuemu-progress-header">
                <span class="yuemu-progress-status" :class="status">
                  <LoadingOutlined v-if="status === 'syncing'" spin />
                  <CheckCircleOutlined v-else-if="status === 'success'" />
                  <CloseCircleOutlined v-else-if="status === 'error'" />
                  {{ statusText }}
                </span>
                <span class="yuemu-progress-count">{{ completedCount }} / {{ totalCount }}</span>
              </div>

              <div class="yuemu-progress-bar-container">
                <div class="yuemu-progress-bar-inner" :style="{ width: progressPercent + '%' }" :class="status"></div>
              </div>

              <div class="yuemu-progress-stats">
                <div class="yuemu-stat-item">
                  <span class="yuemu-stat-label">{{ t('components.vectorSyncModal.successStored') }}</span>
                  <span class="yuemu-stat-value success">{{ processedCount }}</span>
                </div>
                <div class="yuemu-stat-item">
                  <span class="yuemu-stat-label">{{ t('components.vectorSyncModal.recognitionFailed') }}</span>
                  <span class="yuemu-stat-value error">{{ failedCount }}</span>
                </div>
                <div class="yuemu-stat-item">
                  <span class="yuemu-stat-label">{{ t('components.vectorSyncModal.currentProgress') }}</span>
                  <span class="yuemu-stat-value primary">{{ progressPercent.toFixed(1) }}%</span>
                </div>
              </div>

              <div v-if="status === 'success' || status === 'error'" class="yuemu-restart-wrap">
                <a-button type="dashed" @click="resetToIdle">
                  <ReloadOutlined /> {{ t('components.vectorSyncModal.recheckBatch') }}
                </a-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

import { ref, computed, watch, onUnmounted } from 'vue'
import {
  CloseOutlined, DatabaseOutlined, ExclamationCircleOutlined,
  ThunderboltOutlined, LoadingOutlined, CheckCircleOutlined, CloseCircleOutlined, ReloadOutlined
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { startSyncUsingPost } from '@/api/vectorSyncController'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible'])

const status = ref<'idle' | 'syncing' | 'success' | 'error'>('idle')
const starting = ref(false)
const totalCount = ref(0)
const processedCount = ref(0)
const failedCount = ref(0)
const isRunning = ref(false)

let eventSource: EventSource | null = null

const statusText = computed(() => {
  switch (status.value) {
    case 'idle': return t('components.vectorSyncModal.statusIdle')
    case 'syncing': return t('components.vectorSyncModal.statusSyncing')
    case 'success': return t('components.vectorSyncModal.statusSuccess')
    case 'error': return t('components.vectorSyncModal.statusError')
    default: return ''
  }
})

const progressPercent = computed(() => {
  if (totalCount.value === 0) return 0
  return Math.min(100, ((processedCount.value + failedCount.value) / totalCount.value) * 100)
})

const completedCount = computed(() => processedCount.value + failedCount.value)

const resetToIdle = () => {
  status.value = 'idle'
  totalCount.value = 0
  processedCount.value = 0
  failedCount.value = 0
}

const handleClose = () => {
  if (status.value === 'syncing') {
    message.warning(t('components.vectorSyncModal.backgroundTaskRunning'))
  }
  emit('update:visible', false)
}

const startSync = async () => {
  starting.value = true
  try {
    const res = await startSyncUsingPost()
    if (res.data?.code === 0) {
      status.value = 'syncing'
      message.success(t('components.vectorSyncModal.batchTaskStarted'))
      connectSSE()
    } else {
      message.error(res.data?.message || t('components.vectorSyncModal.startFailed'))
    }
  } catch (error: any) {
    message.error(t('components.vectorSyncModal.requestFailedColon') + error.message)
  } finally {
    starting.value = false
  }
}

const connectSSE = () => {
  if (eventSource) {
    eventSource.close()
  }

  const url = '/api/api/vector/sync/progress/stream'
  eventSource = new EventSource(url, { withCredentials: true })

  eventSource.addEventListener('syncProgress', (event) => {
    try {
      const data = JSON.parse(event.data)
      totalCount.value = data.total || 0
      processedCount.value = data.processed || 0
      failedCount.value = data.failed || 0
      isRunning.value = data.running

      // 如果没在运行，直接判断为完成（这涵盖了“秒完成”、“全部被跳过”以及“跑完”的情况）
      if (!data.running) {
        status.value = 'success'
        if (data.total === 0) {
          message.success(t('components.vectorSyncModal.allPicturesVectorized'))
        }
        closeSSE()
      } else {
        status.value = 'syncing'
      }
    } catch (e) {
      console.error('SSE数据解析错误', e)
    }
  })

  eventSource.addEventListener('syncDone', () => {
    status.value = 'success'
    closeSSE()
  })

  eventSource.onerror = () => {
    console.warn('SSE连接中断')
    if (status.value === 'syncing') {
      // 在完成时由于后台移除流可能会触发 onerror
      if (processedCount.value > 0 && processedCount.value >= totalCount.value) {
        status.value = 'success'
      }
      closeSSE()
    }
  }
}

const closeSSE = () => {
  if (eventSource) {
    eventSource.close()
    eventSource = null
  }
}

// 每次打开面板时，如果是 idle 状态，尝试连接一下看看是否后台已经在跑
watch(() => props.visible, (newVal) => {
  if (newVal && status.value === 'idle') {
    connectSSE()
  }
  if (!newVal) {
    closeSSE()
  }
})

onUnmounted(() => {
  closeSSE()
})
</script>

<style scoped>
.yuemu-fade-scale-enter-active,
.yuemu-fade-scale-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.yuemu-fade-scale-enter-from,
.yuemu-fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.yuemu-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.yuemu-modal-box {
  background: var(--card-background, #ffffff);
  border-radius: 16px;
  width: 90%;
  max-width: 520px;
  padding: 32px;
  position: relative;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border-color, #e2e8f0);
}

.yuemu-modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s;
  padding: 8px;
  border-radius: 50%;
}
.yuemu-modal-close:hover {
  background: var(--hover-background, #f1f5f9);
  color: var(--text-primary);
}

.yuemu-modal-header {
  text-align: center;
  margin-bottom: 32px;
}
.yuemu-modal-icon {
  font-size: 48px;
  color: #2563eb;
  margin-bottom: 16px;
  background: rgba(37, 99, 235, 0.1);
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}
.yuemu-modal-title {
  margin: 0 0 12px;
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
}
.yuemu-modal-desc {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.6;
}

.yuemu-warning-card {
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 24px;
}
.yuemu-warning-icon {
  color: #f59e0b;
  font-size: 18px;
  margin-top: 2px;
}
.yuemu-warning-text {
  color: #d97706;
  font-size: 13px;
  line-height: 1.5;
}

.yuemu-sync-start-btn {
  width: 100%;
  height: 48px;
  border-radius: 24px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border: none;
  box-shadow: 0 8px 16px rgba(37, 99, 235, 0.2);
}
.yuemu-sync-start-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 20px rgba(37, 99, 235, 0.3);
}

.yuemu-sync-progress-wrap {
  background: var(--hover-background, #f8fafc);
  border-radius: 12px;
  padding: 24px;
  border: 1px solid var(--border-color, #e2e8f0);
}

.yuemu-progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.yuemu-progress-status {
  font-weight: 600;
  font-size: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.yuemu-progress-status.syncing { color: #2563eb; }
.yuemu-progress-status.success { color: #10b981; }
.yuemu-progress-status.error { color: #ef4444; }

.yuemu-progress-count {
  font-size: 14px;
  color: var(--text-secondary);
  font-family: monospace;
}

.yuemu-progress-bar-container {
  height: 8px;
  background: var(--border-color, #e2e8f0);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 24px;
}
.yuemu-progress-bar-inner {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}
.yuemu-progress-bar-inner.syncing {
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
  animation: yuemu-stripe-move 2s linear infinite;
  background-size: 40px 40px;
  background-image: linear-gradient(45deg, rgba(255, 255, 255, 0.15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.15) 75%, transparent 75%, transparent);
}
.yuemu-progress-bar-inner.success { background: #10b981; }
.yuemu-progress-bar-inner.error { background: #ef4444; }

@keyframes yuemu-stripe-move {
  0% { background-position: 40px 0; }
  100% { background-position: 0 0; }
}

.yuemu-progress-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.yuemu-stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.yuemu-stat-label {
  font-size: 12px;
  color: var(--text-secondary);
}
.yuemu-stat-value {
  font-size: 18px;
  font-weight: 700;
  font-family: monospace;
}
.yuemu-stat-value.success { color: #10b981; }
.yuemu-stat-value.error { color: #ef4444; }
.yuemu-stat-value.primary { color: #2563eb; }

.yuemu-restart-wrap {
  margin-top: 24px;
  text-align: center;
}

/* 移动端强制移除点击时的悬停缩放，防止底层长按死锁 */
@media (max-width: 768px) {
  .ant-card-hoverable:active, .ant-card-hoverable:hover,
  .ant-card-hoverable:active *, .ant-card-hoverable:hover *,
  .yuemu-modal-close:active, .yuemu-modal-close:hover,
  .yuemu-modal-close:active *, .yuemu-modal-close:hover *,
  .yuemu-sync-start-btn:active, .yuemu-sync-start-btn:hover,
  .yuemu-sync-start-btn:active *, .yuemu-sync-start-btn:hover * {
    transform: none !important;
  }
}
</style>
