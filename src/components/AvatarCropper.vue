<template>
  <div v-if="visible" class="yuemu-native-modal-overlay" @click.self="closeModal">
    <div class="yuemu-native-cropper-modal">

      <div class="yuemu-modal-header">
        <h3>{{ t('components.avatarCropper.title') }}</h3>
        <button class="yuemu-close-btn" @click="closeModal"><CloseOutlined /></button>
      </div>

      <div class="yuemu-modal-body">
        <div class="yuemu-cropper-wrapper">
          <VueCropper
            ref="cropperRef"
            :img="imageUrl"
            :autoCrop="true"
            :fixedBox="true"
            :centerBox="true"
            :canMoveBox="true"
            :info="false"
            outputType="png"
            :fixed="true"
            :fixedNumber="[1, 1]"
            mode="cover"
            class="yuemu-custom-cropper"
          />
        </div>

        <div class="yuemu-editor-footer">
          <div class="yuemu-glass-toolbar">
            <button class="yuemu-tool-btn" @click="rotateLeft" :title="t('components.avatarCropper.rotateLeft')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            </button>

            <button class="yuemu-tool-btn" @click="rotateRight" :title="t('components.avatarCropper.rotateRight')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
            </button>

            <div class="yuemu-toolbar-divider"></div>

            <button class="yuemu-tool-btn" @click="changeScale(1)" :title="t('components.avatarCropper.zoomIn')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
            </button>

            <button class="yuemu-tool-btn" @click="changeScale(-1)" :title="t('components.avatarCropper.zoomOut')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
            </button>
          </div>

          <button class="yuemu-native-btn yuemu-finish-btn" :disabled="loading" @click="handleConfirm">
            <span v-if="loading" class="yuemu-loading-spinner"></span>
            {{ loading ? t('components.avatarCropper.processing') : t('components.avatarCropper.done') }}
          </button>
        </div>
      </div>
    </div>

    <Transition name="yuemu-fade">
      <div v-if="toast.show" class="yuemu-native-toast yuemu-error">
        {{ toast.msg }}
      </div>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import 'vue-cropper/dist/index.css'
import { VueCropper } from 'vue-cropper'
import { getDeviceType } from '@/utils/device'
import { CloseOutlined } from '@ant-design/icons-vue'
import { DEVICE_TYPE_ENUM } from '@/constants/device'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface Props {
  imageUrl?: string
  onSuccess?: (file: File) => Promise<void> | void
}

const props = defineProps<Props>()
const device = ref<string>('')
const visible = ref(false)
const loading = ref(false)
const cropperRef = ref()

const toast = reactive({ show: false, msg: '' })
let toastTimer: any = null

onMounted(async () => {
  device.value = await getDeviceType()
})

function showToast(msg: string) {
  toast.msg = msg
  toast.show = true
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.show = false }, 2500)
}

function openModal() {
  visible.value = true
}

function closeModal() {
  visible.value = false
}

function rotateLeft() {
  cropperRef.value?.rotateLeft()
}

function rotateRight() {
  cropperRef.value?.rotateRight()
}

function changeScale(num: number) {
  cropperRef.value?.changeScale(num)
}

function handleConfirm() {
  loading.value = true
  cropperRef.value?.getCropBlob(async (blob: Blob) => {
    try {
      if (blob.size > 5 * 1024 * 1024) {
        showToast(t('components.avatarCropper.sizeLimit'))
        loading.value = false
        return
      }
      const file = new File([blob], 'avatar.png', { type: blob.type })
      await props.onSuccess?.(file)
    } catch (error) {
      console.error('头像裁剪失败:', error)
      showToast(t('components.avatarCropper.exception'))
    } finally {
      loading.value = false
    }
  })
}

defineExpose({
  openModal,
  closeModal
})
</script>

<style scoped>
.yuemu-native-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 16px;
}

.yuemu-native-cropper-modal {
  background-color: var(--card-background, #ffffff);
  border: 1px solid var(--border-color, #f0f0f0);
  border-radius: 20px;
  width: 100%;
  max-width: 560px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  animation: yuemu-modal-in 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

@keyframes yuemu-modal-in {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.yuemu-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color, #f0f0f0);
  position: relative;
}

.yuemu-modal-header h3 {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary, #1f2937);
  flex: 1;
  text-align: center;
}

.yuemu-close-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: var(--text-secondary, #6b7280);
  cursor: pointer;
  transition: 0.2s;
  padding: 0;
  position: absolute;
  right: 24px;
}

.yuemu-close-btn:hover {
  color: var(--text-primary, #111827);
  transform: rotate(90deg);
}

.yuemu-modal-body {
  padding: 24px;
  background-color: var(--background, #f9fafb);
}

.yuemu-cropper-wrapper {
  height: 400px;
  border-radius: 16px;
  overflow: hidden;
  background-color: #111827;
  box-shadow: inset 0 2px 10px rgba(0,0,0,0.2);
  margin-bottom: 24px;
  position: relative;
}

.yuemu-custom-cropper {
  width: 100%;
  height: 100%;
  background-image: radial-gradient(#374151 1px, transparent 1px);
  background-size: 20px 20px;
}

:deep(.cropper-view-box) {
  outline: 2px solid #ffffff !important;
  outline-color: rgba(255, 255, 255, 0.8) !important;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.6);
}
:deep(.cropper-face) {
  background-color: transparent !important;
}

.yuemu-editor-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.yuemu-glass-toolbar {
  display: flex;
  align-items: center;
  background: var(--card-background, #ffffff);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 99px;
  padding: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  gap: 4px;
}

.yuemu-tool-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  border-radius: 50%;
  color: var(--text-secondary, #4b5563);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.yuemu-tool-btn svg {
  width: 18px;
  height: 18px;
}

.yuemu-tool-btn:hover {
  background-color: var(--hover-background, #f3f4f6);
  color: var(--link-color, #2563eb);
  transform: scale(1.05);
}

.yuemu-tool-btn:active {
  transform: scale(0.95);
}

.yuemu-toolbar-divider {
  width: 1px;
  height: 20px;
  background-color: var(--border-color, #e5e7eb);
  margin: 0 4px;
}

.yuemu-native-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  cursor: pointer;
  font-family: inherit;
  outline: none;
}

.yuemu-finish-btn {
  height: 44px;
  padding: 0 32px;
  border-radius: 22px;
  font-size: 15px;
  font-weight: 600;
  background: var(--link-color, #2563eb);
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);
  transition: all 0.3s ease;
}

.yuemu-finish-btn:not(:disabled):hover {
  background: var(--link-hover-color, #1d4ed8);
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);
  transform: translateY(-1px);
}

.yuemu-finish-btn:not(:disabled):active {
  transform: translateY(1px);
}

.yuemu-finish-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.yuemu-loading-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: yuemu-spin 0.8s linear infinite;
}

@keyframes yuemu-spin {
  to { transform: rotate(360deg); }
}

.yuemu-native-toast {
  position: fixed;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2000;
  background: var(--card-background, #ffffff);
  color: var(--text-primary, #111827);
  padding: 12px 24px;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  font-weight: 500;
  font-size: 14px;
}

.yuemu-native-toast.yuemu-error {
  border-left: 4px solid var(--comment-delete-hover-color, #ef4444);
}

.yuemu-fade-enter-active,
.yuemu-fade-leave-active {
  transition: all 0.3s ease;
}

.yuemu-fade-enter-from,
.yuemu-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px);
}

@media screen and (max-width: 768px) {
  .yuemu-native-modal-overlay {
    padding: 0;
    align-items: flex-end;
  }

  .yuemu-native-cropper-modal {
    border-radius: 20px 20px 0 0;
    max-height: 90vh;
  }

  .yuemu-cropper-wrapper {
    height: 320px;
    margin-bottom: 20px;
  }

  .yuemu-editor-footer {
    flex-direction: column;
    gap: 20px;
  }

  .yuemu-glass-toolbar {
    width: 100%;
    justify-content: center;
    padding: 8px;
    gap: 8px;
  }

  .yuemu-tool-btn {
    width: 44px;
    height: 44px;
  }

  .yuemu-tool-btn svg {
    width: 22px;
    height: 22px;
  }

  .yuemu-finish-btn {
    width: 100%;
    height: 48px;
  }
}

/* 移动端强制移除点击时的悬停缩放，防止底层长按死锁 */
@media (max-width: 768px) {
  .ant-card-hoverable:active, .ant-card-hoverable:hover,
  .ant-card-hoverable:active *, .ant-card-hoverable:hover *,
  .yuemu-close-btn:active, .yuemu-close-btn:hover,
  .yuemu-close-btn:active *, .yuemu-close-btn:hover *,
  .yuemu-tool-btn:active, .yuemu-tool-btn:hover,
  .yuemu-tool-btn:active *, .yuemu-tool-btn:hover * {
    transform: none !important;
  }
}
</style>
