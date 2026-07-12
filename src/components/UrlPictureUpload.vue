<template>
  <div class="yuemu-url-upload-container">
    <div v-if="previewUrl" class="yuemu-preview-area">
      <img :src="previewUrl" class="yuemu-preview-image" />
      <div class="yuemu-preview-mask" @click="clearPreview">
        <div class="yuemu-change-icon">
          <i class="fa-solid fa-link-slash"></i>
        </div>
        <p class="yuemu-change-text">{{ t('components.urlPictureUpload.clickToChangeUrl') }}</p>
      </div>
    </div>

    <div v-else class="yuemu-url-input-card">
      <div class="yuemu-illustration-wrapper">
        <img src="@/assets/illustrations/url-upload-illustration.png" :alt="t('components.urlPictureUpload.urlUploadIllustration')" class="yuemu-url-illustration" />
      </div>

      <div class="yuemu-input-section">
        <p class="yuemu-primary-text">{{ t('components.urlPictureUpload.publishViaImageUrl') }}</p>
        <div class="yuemu-url-input-group">
          <div class="yuemu-input-wrapper">
            <i class="fa-solid fa-link yuemu-prefix-icon"></i>
            <input
              v-model="url"
              :placeholder="t('components.urlPictureUpload.placeholderPasteImageUrl')"
              class="yuemu-modern-input"
              :disabled="loading"
              @keyup.enter="handlePreview"
            />
          </div>
          <button
            class="yuemu-submit-button"
            :class="{ 'yuemu-loading': loading }"
            :disabled="!url || loading"
            @click="handlePreview"
          >
            <i v-if="loading" class="fa-solid fa-spinner fa-spin"></i>
            <span v-else>{{ t('components.urlPictureUpload.fetchNow') }}</span>
          </button>
        </div>
        <p class="yuemu-tip-text">{{ t('components.urlPictureUpload.supportHttpHttps') }}</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import { uploadPictureByUrlUsingPost } from '@/api/pictureController'

const { t } = useI18n()

interface Props {
  picture?: API.PictureVO
  spaceId?: number
  onSuccess?: (newPicture: API.PictureVO) => void
}

const props = defineProps<Props>()
const url = ref<string>('')
const loading = ref<boolean>(false)
const previewUrl = ref<string>('')

watch(
  () => props.picture,
  (newPicture) => {
    if (newPicture?.url) {
      previewUrl.value = newPicture.url
    }
  },
  { immediate: true },
)

const handleSubmit = async () => {
  if (!url.value) return

  loading.value = true
  try {
    const params: API.PictureUploadRequest = { fileUrl: url.value }
    if (props.spaceId) params.spaceId = props.spaceId
    if (props.picture?.id) params.id = props.picture.id

    const res = await uploadPictureByUrlUsingPost(params)
    if (res.data.code === 0 && res.data.data) {
      message.success(t('components.urlPictureUpload.fetchSuccess'))
      props.onSuccess?.(res.data.data)
    } else {
      message.error(res.data.message || t('components.urlPictureUpload.fetchFailed'))
      previewUrl.value = ''
      url.value = ''
    }
  } catch (error: any) {
    message.error(error.message || t('components.urlPictureUpload.fetchFailedCrossDomainOrInvalid'))
    previewUrl.value = ''
    url.value = ''
  } finally {
    loading.value = false
  }
}

const handlePreview = async () => {
  if (!url.value) return

  if (!url.value.match(/^https?:\/\/.+/)) {
    message.warning(t('components.urlPictureUpload.pleaseEnterValidLink'))
    return
  }

  previewUrl.value = url.value
  await handleSubmit()
}

const clearPreview = () => {
  previewUrl.value = ''
  url.value = ''
}
</script>

<style scoped>
.yuemu-url-upload-container {
  padding: 0;
  height: 100%;
}

.yuemu-url-input-card {
  border-radius: 12px;
  padding: 60px 40px;
  width: 100%;
  min-height: 440px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 32px;
  transition: var(--theme-transition);
}

.yuemu-url-input-card:hover {
  border-color: #3b82f6;
}

.yuemu-illustration-wrapper {
  width: 140px;
  height: 140px;
  transition: transform 0.3s ease;
}

.yuemu-url-input-card:hover .yuemu-illustration-wrapper {
  transform: scale(1.02);
}

.yuemu-url-illustration {
  width: 100%;
  height: 100%;
  object-fit: contain;
  animation: yuemu-illustrationFadeIn 1.2s ease-out forwards;
}

@keyframes yuemu-illustrationFadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.yuemu-input-section {
  width: 100%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.yuemu-primary-text {
  font-size: 18px;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0;
}

.yuemu-url-input-group {
  width: 100%;
  display: flex;
  gap: 8px;
}

.yuemu-input-wrapper {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.yuemu-prefix-icon {
  position: absolute;
  left: 12px;
  color: var(--text-secondary);
  font-size: 14px;
}

.yuemu-modern-input {
  width: 100%;
  height: 44px;
  padding: 0 12px 0 36px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--card-background);
  font-size: 14px;
  outline: none;
  transition: all 0.2s ease;
  color: var(--text-primary);
}

.yuemu-modern-input:focus {
  border-color: #3b82f6;
}

.yuemu-submit-button {
  height: 44px;
  padding: 0 24px;
  border-radius: 8px;
  background: #3b82f6;
  color: white;
  border: none;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
  font-size: 14px;
}

.yuemu-submit-button:hover:not(:disabled) {
  background: #2563eb;
}

.yuemu-submit-button:disabled {
  background: var(--hover-background);
  color: var(--text-secondary);
  cursor: not-allowed;
}

.yuemu-tip-text {
  font-size: 12px;
  color: var(--text-secondary);
}

.yuemu-preview-area {
  width: 100%;
  height: 440px;
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  background: var(--background);
}

.yuemu-preview-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.yuemu-preview-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.3s ease;
  color: white;
  cursor: pointer;
  gap: 8px;
}

.yuemu-preview-area:hover .yuemu-preview-mask {
  opacity: 1;
}

.yuemu-change-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.yuemu-change-text {
  font-size: 14px;
  font-weight: 400;
}

@media screen and (max-width: 768px) {
  .yuemu-url-input-card {
    padding: 0 20px;
    min-height: 300px;
    gap: 24px;
  }
}

/* 移动端强制移除点击时的悬停缩放，防止底层长按死锁 */
@media (max-width: 768px) {
  .yuemu-submit-button:active, .yuemu-submit-button:hover,
  .yuemu-submit-button:active *, .yuemu-submit-button:hover *,
  .ant-card-hoverable:active, .ant-card-hoverable:hover,
  .ant-card-hoverable:active *, .ant-card-hoverable:hover *,
  .yuemu-preview-area:active, .yuemu-preview-area:hover,
  .yuemu-preview-area:active *, .yuemu-preview-area:hover *,
  .yuemu-url-input-card:active, .yuemu-url-input-card:hover,
  .yuemu-url-input-card:active *, .yuemu-url-input-card:hover * {
    transform: none !important;
  }
}
</style>
