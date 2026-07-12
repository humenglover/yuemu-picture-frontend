<template>
  <Teleport to="body">
    <Transition name="yuemu-modal-fade">
      <div v-if="visible" class="yuemu-modal-overlay" @click="handleCancel">
        <div class="yuemu-modal-dialog" @click.stop>
          <div class="yuemu-modal-header">
            <h3>{{ t('components.externalLink.leavingSite') }}</h3>
            <button class="yuemu-modal-close" @click="handleCancel">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div class="yuemu-modal-content">
            <i class="fas fa-exclamation-triangle warning-icon"></i>
            <p class="warning-text">{{ t('components.externalLink.warningText') }}</p>
            <div class="url-box">
              <div class="url-text">{{ externalUrl }}</div>
            </div>
            <p class="security-tips">{{ t('components.externalLink.securityTips') }}</p>

            <div class="modal-actions">
              <button class="yuemu-btn-cancel" @click="handleCancel">{{ t('components.externalLink.cancelVisit') }}</button>
              <button class="yuemu-btn-confirm" @click="handleConfirm">{{ t('components.externalLink.continueVisit') }}</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const visible = ref(false)
const externalUrl = ref('')

const openModal = (url: string) => {
  externalUrl.value = url
  visible.value = true
  document.body.style.overflow = 'hidden'
}

const handleCancel = () => {
  visible.value = false
  document.body.style.overflow = ''
}

const handleConfirm = () => {
  window.open(externalUrl.value, '_blank')
  visible.value = false
  document.body.style.overflow = ''
}

onUnmounted(() => {
  if (visible.value) {
    document.body.style.overflow = ''
  }
})

defineExpose({
  openModal
})
</script>

<style scoped>
/* 遮罩层动画 */
.yuemu-modal-fade-enter-active,
.yuemu-modal-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.yuemu-modal-fade-enter-from,
.yuemu-modal-fade-leave-to {
  opacity: 0;
}

.yuemu-modal-fade-enter-from .yuemu-modal-dialog,
.yuemu-modal-fade-leave-to .yuemu-modal-dialog {
  transform: scale(0.95) translateY(10px);
}

/* 基础样式 */
.yuemu-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.yuemu-modal-dialog {
  width: 100%;
  max-width: 440px;
  background: var(--card-background, #ffffff);
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  border: 1px solid var(--border-color, rgba(0,0,0,0.05));
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

/* 头部 */
.yuemu-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--border-color, #f0f0f0);
}
.yuemu-modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #1a1a1a);
}
.yuemu-modal-close {
  background: none;
  border: none;
  font-size: 18px;
  color: var(--text-secondary, #999);
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.yuemu-modal-close:hover {
  background: var(--hover-background, #f5f5f5);
  color: var(--text-primary, #333);
}

/* 内容 */
.yuemu-modal-content {
  padding: 32px 24px;
  text-align: center;
}

.warning-icon {
  font-size: 48px;
  color: #faad14;
  margin-bottom: 20px;
}

.warning-text {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #333);
  margin: 0 0 16px;
}

.url-box {
  background: var(--hover-background, #f8f9fa);
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 20px;
  border: 1px solid var(--border-color, #f0f0f0);
}

.url-text {
  color: #1677ff;
  font-family: monospace;
  font-size: 14px;
  word-break: break-all;
  line-height: 1.5;
}

.security-tips {
  font-size: 13px;
  color: #ff4d4f;
  margin: 0 0 32px;
}

/* 按钮 */
.modal-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.yuemu-btn-cancel,
.yuemu-btn-confirm {
  height: 40px;
  padding: 0 24px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 120px;
}

.yuemu-btn-cancel {
  background: var(--hover-background, #f5f5f5);
  color: var(--text-primary, #333);
  border: 1px solid var(--border-color, transparent);
}
.yuemu-btn-cancel:hover {
  background: var(--border-color, #e8e8e8);
}

.yuemu-btn-confirm {
  background: #1677ff;
  color: #ffffff;
  border: none;
}
.yuemu-btn-confirm:hover {
  background: #4096ff;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(22, 119, 255, 0.2);
}
.yuemu-btn-confirm:active {
  background: #0958d9;
  transform: translateY(0);
}

/* 暗色主题适配 */
:root[class~="dark-theme"] .warning-icon {
  text-shadow: 0 0 20px rgba(250, 173, 20, 0.3);
}
:root[class~="dark-theme"] .url-box {
  background: rgba(0, 0, 0, 0.2);
}
:root[class~="dark-theme"] .yuemu-btn-cancel {
  background: var(--search-btn-bg, #333);
}
:root[class~="dark-theme"] .yuemu-btn-cancel:hover {
  background: #444;
}

/* 移动端强制移除点击时的悬停缩放，防止底层长按死锁 */
@media (max-width: 768px) {
  .ant-card-hoverable:active, .ant-card-hoverable:hover,
  .ant-card-hoverable:active *, .ant-card-hoverable:hover *,
  .yuemu-modal-close:active, .yuemu-modal-close:hover,
  .yuemu-modal-close:active *, .yuemu-modal-close:hover *,
  .yuemu-btn-confirm:active, .yuemu-btn-confirm:hover,
  .yuemu-btn-confirm:active *, .yuemu-btn-confirm:hover *,
  .yuemu-btn-cancel:active, .yuemu-btn-cancel:hover,
  .yuemu-btn-cancel:active *, .yuemu-btn-cancel:hover * {
    transform: none !important;
  }
}
</style>
