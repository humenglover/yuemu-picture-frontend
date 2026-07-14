<template>
  <Transition name="yuemu-fade-scale">
    <div v-if="visible" class="yuemu-image-out-painting-overlay">
      <div
        class="yuemu-image-out-painting-modal"
        :class="{ 'yuemu-mobile-fullscreen': device === DEVICE_TYPE_ENUM.MOBILE }"
      >
        <div class="yuemu-modal-header">
          <div class="yuemu-header-title">
            <i class="fas fa-expand-arrows-alt yuemu-ai-icon"></i>
            {{ t('components.imageOutPainting.title') }}
          </div>
          <button class="yuemu-close-button" @click="closeModal" :aria-label="$t('common.close')">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="yuemu-modal-body">
          <div class="yuemu-out-painting-container">
            <div class="yuemu-image-comparison" :class="{ 'yuemu-mobile': device === DEVICE_TYPE_ENUM.MOBILE }">

              <div class="yuemu-image-section yuemu-original">
                <div class="yuemu-section-header">
                  <span class="yuemu-section-tag">{{ t('components.imageOutPainting.originalImage') }}</span>
                </div>
                <div class="yuemu-image-wrapper yuemu-checkerboard-bg">
                  <img v-if="picture?.url" :src="picture.url" :alt="picture.name" />
                  <div v-else class="yuemu-empty-state">{{ t('components.imageOutPainting.noOriginalImage') }}</div>
                </div>
              </div>

              <div class="yuemu-image-section yuemu-result" :class="{ 'yuemu-is-generating': !!taskId }">
                <div class="yuemu-section-header">
                  <span class="yuemu-section-tag yuemu-highlight">{{ t('components.imageOutPainting.resultImage') }}</span>
                  <span v-if="taskId" class="yuemu-generating-text">
                    <i class="fas fa-circle-notch fa-spin"></i> {{ t('components.imageOutPainting.generating') }}
                  </span>
                </div>

                <div class="yuemu-image-wrapper yuemu-checkerboard-bg">
                  <img v-if="resultImageUrl" :src="resultImageUrl" :alt="t('components.imageOutPainting.resultImage')" class="yuemu-fade-in-image" />

                  <div v-else-if="taskId" class="yuemu-generating-skeleton">
                    <div class="yuemu-scan-line"></div>
                    <div class="yuemu-skeleton-icon"><i class="fas fa-wand-magic-sparkles"></i></div>
                    <p>{{ t('components.imageOutPainting.aiGenerating') }}</p>
                  </div>

                  <div v-else class="yuemu-empty-state">
                    <i class="fas fa-image"></i>
                    <p>{{ t('components.imageOutPainting.clickToStart') }}</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        <div class="yuemu-modal-footer">
          <div class="yuemu-action-buttons">
            <button
              class="yuemu-btn-primary yuemu-generate-btn"
              :class="{ 'yuemu-loading': !!taskId }"
              :disabled="!!taskId"
              @click="createTask"
            >
              <ThunderboltOutlined v-if="!taskId" class="yuemu-btn-icon" />
              <i v-else class="fas fa-spinner fa-spin yuemu-btn-icon"></i>
              {{ taskId ? t('components.imageOutPainting.aiGeneratingBtn') : t('components.imageOutPainting.startOutPainting') }}
            </button>

            <Transition name="yuemu-fade">
              <button
                v-if="resultImageUrl"
                class="yuemu-btn-outline yuemu-apply-btn"
                :class="{ 'yuemu-loading': uploadLoading }"
                :disabled="uploadLoading"
                @click="handleUpload"
              >
                <CheckOutlined v-if="!uploadLoading" class="yuemu-btn-icon" />
                <i v-else class="fas fa-spinner fa-spin yuemu-btn-icon"></i>
                {{ uploadLoading ? t('components.imageOutPainting.applying') : t('components.imageOutPainting.applyResult') }}
              </button>
            </Transition>
          </div>
        </div>

      </div>
    </div>
  </Transition>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import {
  createPictureOutPaintingTaskUsingPost,
  getPictureOutPaintingTaskUsingGet,
  uploadPictureByUrlUsingPost,
} from '@/api/pictureController.ts'
import { message } from 'ant-design-vue'
import { getDeviceType } from '@/utils/device.ts'
import { DEVICE_TYPE_ENUM } from '@/constants/device.ts'
import { ThunderboltOutlined, CheckOutlined } from '@ant-design/icons-vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const device = ref<string>('')

onMounted(async () => {
  device.value = await getDeviceType()
})

interface Props {
  picture?: API.PictureVO
  spaceId?: number
  onSuccess?: (newPicture: API.PictureVO) => void
}

const props = defineProps<Props>()
const resultImageUrl = ref<string>('')
const taskId = ref<string>()

const createTask = async () => {
  if (!props.picture?.id) return

  const res = await createPictureOutPaintingTaskUsingPost({
    pictureId: props.picture.id,
    parameters: { xScale: 2, yScale: 2 },
  })

  if (res.data.code === 0 && res.data.data) {
    message.success(t('components.imageOutPainting.taskSubmitted'))
    taskId.value = res.data.data.output.taskId
    startPolling()
  } else {
    message.error(t('components.imageOutPainting.taskFailed') + res.data.message)
  }
}

let pollingTimer: NodeJS.Timeout | null = null

const startPolling = () => {
  if (!taskId.value) return

  pollingTimer = setInterval(async () => {
    try {
      const res = await getPictureOutPaintingTaskUsingGet({ taskId: taskId.value })
      if (res.data.code === 0 && res.data.data) {
        const taskResult = res.data.data.output
        if (taskResult.taskStatus === 'SUCCEEDED') {
          message.success(t('components.imageOutPainting.outPaintingSuccess'))
          resultImageUrl.value = taskResult.outputImageUrl
          clearPolling()
        } else if (taskResult.taskStatus === 'FAILED') {
          message.error(t('components.imageOutPainting.outPaintingFailedRetry'))
          clearPolling()
        }
      }
    } catch (error: any) {
      console.error('扩图任务轮询失败', error)
      message.error(t('components.imageOutPainting.pollingFailed') + error.message)
      clearPolling()
    }
  }, 3000)
}

const clearPolling = () => {
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
    taskId.value = undefined
  }
}

const uploadLoading = ref(false)

const handleUpload = async () => {
  uploadLoading.value = true
  try {
    const params: API.PictureUploadRequest = {
      fileUrl: resultImageUrl.value,
      spaceId: props.spaceId,
    }
    if (props.picture) {
      params.id = props.picture.id
    }
    const res = await uploadPictureByUrlUsingPost(params)
    if (res.data.code === 0 && res.data.data) {
      message.success(t('components.imageOutPainting.applySuccess'))
      props.onSuccess?.(res.data.data)
      closeModal()
    } else {
      message.error(t('components.imageOutPainting.applyFailed') + res.data.message)
    }
  } catch (error: any) {
    console.error('应用失败', error)
    message.error(t('components.imageOutPainting.applyFailed') + error.message)
  }
  uploadLoading.value = false
}

const visible = ref(false)

const openModal = () => {
  visible.value = true
}

const closeModal = () => {
  visible.value = false
  clearPolling()
}

defineExpose({ openModal })
</script>

<style lang="scss" scoped>
.yuemu-image-out-painting-overlay {
  position: fixed;
  inset: 0;
  background: var(--comment-drawer-backdrop);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
}

.yuemu-image-out-painting-modal {
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  width: 900px;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 40px var(--shadow-color);
  overflow: hidden;
  transition: var(--theme-transition);

  &.yuemu-mobile-fullscreen {
    width: 100vw;
    height: 100vh;
    max-width: 100vw;
    max-height: 100vh;
    border-radius: 0;
    border: none;
  }
}

.yuemu-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border-color);
  background: var(--card-background);
  flex-shrink: 0;

  .yuemu-header-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 8px;

    .yuemu-ai-icon {
      color: var(--link-color);
      font-size: 16px;
    }
  }

  .yuemu-close-button {
    background: transparent;
    border: none;
    color: var(--text-secondary);
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    font-size: 18px;
    transition: all 0.2s;

    &:hover {
      background: var(--hover-background);
      color: var(--text-primary);
      transform: rotate(90deg);
    }
  }
}

.yuemu-modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
  background: var(--background);
}

.yuemu-image-comparison {
  display: flex;
  gap: 24px;
  height: 100%;

  &.yuemu-mobile {
    flex-direction: column;
    gap: 20px;
  }
}

.yuemu-image-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;

  &.yuemu-is-generating .yuemu-image-wrapper {
    border-color: var(--link-color);
    box-shadow: 0 0 15px rgba(59, 130, 246, 0.2);
  }
}

.yuemu-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .yuemu-section-tag {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-secondary);
    padding: 4px 12px;
    background: var(--hover-background);
    border-radius: 20px;
    border: 1px solid var(--border-color);

    &.yuemu-highlight {
      color: var(--link-color);
      background: var(--nav-item-active);
      border-color: rgba(59, 130, 246, 0.3);
    }
  }

  .yuemu-generating-text {
    font-size: 13px;
    color: var(--link-color);
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 6px;
  }
}

.yuemu-image-wrapper {
  flex: 1;
  min-height: 300px;
  background: var(--post-content-background);
  border: 1.5px dashed var(--border-color);
  border-radius: 12px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: all 0.3s ease;

  img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    border-radius: 8px;
    z-index: 2;
  }

  .yuemu-fade-in-image {
    animation: yuemu-fadeIn 0.5s ease-out;
  }

  &.yuemu-checkerboard-bg::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 1;
    opacity: 0.4;
    background-image: linear-gradient(45deg, var(--border-color) 25%, transparent 25%),
    linear-gradient(-45deg, var(--border-color) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, var(--border-color) 75%),
    linear-gradient(-45deg, transparent 75%, var(--border-color) 75%);
    background-size: 16px 16px;
    background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
  }
}

.yuemu-empty-state {
  color: var(--text-secondary);
  font-size: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  z-index: 2;

  i {
    font-size: 32px;
    opacity: 0.5;
  }
}

.yuemu-generating-skeleton {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(var(--background), 0.7);
  backdrop-filter: blur(4px);
  color: var(--link-color);

  .yuemu-skeleton-icon {
    font-size: 32px;
    margin-bottom: 12px;
    animation: yuemu-pulse 1.5s infinite;
  }

  p {
    font-size: 14px;
    font-weight: 500;
  }

  .yuemu-scan-line {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
    background: linear-gradient(90deg, transparent, var(--link-color), transparent);
    box-shadow: 0 0 10px var(--link-color);
    animation: yuemu-scan 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  }
}

.yuemu-modal-footer {
  padding: 16px 24px;
  background: var(--card-background);
  border-top: 1px solid var(--border-color);
  flex-shrink: 0;
}

.yuemu-action-buttons {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  align-items: center;

  button {
    height: 44px;
    padding: 0 24px;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s ease;

    .yuemu-btn-icon {
      font-size: 16px;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  .yuemu-btn-outline {
    background: transparent;
    border: 1px solid var(--border-color);
    color: var(--text-primary);

    &:hover:not(:disabled) {
      border-color: var(--link-color);
      color: var(--link-color);
      background: var(--nav-item-active);
    }
  }

  .yuemu-btn-primary {
    background: var(--link-color);
    color: #ffffff;
    border: none;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
      filter: brightness(1.1);
    }

    &:active:not(:disabled) {
      transform: translateY(0);
    }
  }
}

@media screen and (max-width: 768px) {
  .yuemu-modal-header {
    padding: 12px 16px;
  }
  .yuemu-modal-body {
    padding: 16px;
  }
  .yuemu-modal-footer {
    padding: 12px 16px;
    padding-bottom: calc(12px + env(safe-area-inset-bottom));
  }

  .yuemu-image-wrapper {
    min-height: 220px;
  }

  .yuemu-action-buttons {
    flex-direction: column-reverse;
    gap: 12px;

    button {
      width: 100%;
      justify-content: center;
    }
  }
}

@keyframes yuemu-fadeIn {
  from { opacity: 0; transform: scale(0.98); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes yuemu-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.9); }
}

@keyframes yuemu-scan {
  0% { transform: translateY(-10px); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(300px); opacity: 0; }
}

.yuemu-fade-scale-enter-active, .yuemu-fade-scale-leave-active {
  transition: opacity 0.3s, transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.yuemu-fade-scale-enter-from, .yuemu-fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.yuemu-fade-enter-active, .yuemu-fade-leave-active {
  transition: opacity 0.3s;
}
.yuemu-fade-enter-from, .yuemu-fade-leave-to {
  opacity: 0;
}

/* 移动端强制移除点击时的悬停缩放，防止底层长按死锁 */
@media (max-width: 768px) {
  .ant-card-hoverable:active, .ant-card-hoverable:hover,
  .ant-card-hoverable:active *, .ant-card-hoverable:hover *,
  .yuemu-btn-primary:active, .yuemu-btn-primary:hover,
  .yuemu-btn-primary:active *, .yuemu-btn-primary:hover *,
  .yuemu-btn-outline:active, .yuemu-btn-outline:hover,
  .yuemu-btn-outline:active *, .yuemu-btn-outline:hover *,
  .yuemu-close-button:active, .yuemu-close-button:hover,
  .yuemu-close-button:active *, .yuemu-close-button:hover * {
    transform: none !important;
  }
}
</style>
