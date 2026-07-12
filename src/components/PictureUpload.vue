<template>
  <div class="yuemu-upload-container">
    <div
      class="yuemu-upload-box"
      :class="{ 'yuemu-uploading': isUploading }"
      @click="handleClick"
      @drop.prevent="handleDrop"
      @dragover.prevent
    >
      <div v-if="!previewUrl" class="yuemu-upload-content">
        <div class="yuemu-illustration-wrapper">
          <img src="@/assets/illustrations/upload-illustration.png" :alt="t('components.pictureUpload.uploadIllustration')" class="yuemu-upload-illustration" />
        </div>
        <div class="yuemu-upload-info">
          <p class="yuemu-primary-text">
            {{ isMobile ? t('components.pictureUpload.clickToUploadAmazing') : t('components.pictureUpload.clickOrDragToUpload') }}
          </p>
          <div class="yuemu-support-tips">
            <span class="yuemu-tip-tag">JPG</span>
            <span class="yuemu-tip-tag">PNG</span>
            <span class="yuemu-tip-tag">GIF</span>
            <span class="yuemu-tip-tag">WEBP</span>
          </div>
        </div>
        <div v-if="isUploading" class="yuemu-uploading-overlay">
          <div class="yuemu-spinner"></div>
          <span>{{ t('components.pictureUpload.processing') }}</span>
        </div>
      </div>
      <div v-else class="yuemu-preview-content">
        <img :src="previewUrl" class="yuemu-preview-image" />
        <div class="yuemu-preview-mask">
          <div class="yuemu-change-icon">
            <i class="fa-solid fa-camera-rotate"></i>
          </div>
          <p class="yuemu-change-text">{{ t('components.pictureUpload.clickToChange') }}</p>
        </div>
      </div>
      <input
        type="file"
        ref="fileInput"
        style="display: none"
        accept="image/*"
        @change="handleFileChange"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch } from 'vue'
import { message } from 'ant-design-vue'
import { uploadPictureUsingPost } from '@/api/pictureController'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const MAX_ORIGINAL_SIZE = 20 * 1024 * 1024
const MAX_COMPRESSED_SIZE = 5 * 1024 * 1024
const MAX_WIDTH = 2560
const MAX_HEIGHT = 1440
interface Props {
  picture?: API.PictureVO
  spaceId?: number
  onSuccess?: (newPicture: API.PictureVO, file: File) => void
  onUploadStart?: (url?: string) => void
  onUploadProgress?: (progress: number) => void
}
const props = defineProps<Props>()
const fileInput = ref<HTMLInputElement | null>(null)
const previewUrl = ref<string>('')
const isUploading = ref(false)
const isMobile = ref(false)
watch(
  () => props.picture,
  (newPicture) => {
    if (newPicture?.url) {
      previewUrl.value = newPicture.url
    }
  },
  { immediate: true },
)
onMounted(() => {
  isMobile.value = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  )
})
const checkWebPSupport = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const webP = new Image()
    webP.onload = function() {
      const result = webP.width > 0 && webP.height > 0
      resolve(result)
    }
    webP.onerror = function() {
      resolve(false)
    }
    webP.src = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA=='
  })
}
const compressImage = async (file: File): Promise<File> => {
  const supportsWebP = await checkWebPSupport()
  const targetFormat = supportsWebP ? 'image/webp' : 'image/jpeg'
  const targetQuality = targetFormat === 'image/webp' ? 0.85 : 0.92
  return new Promise((resolve, reject) => {
    if (file.type === 'image/webp' && file.size <= MAX_COMPRESSED_SIZE) {
      resolve(file)
      return
    }
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (e) =>{
      const img = new Image()
      img.src = e.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        const initialScale = Math.min(1, Math.sqrt(MAX_COMPRESSED_SIZE / file.size))
        const aspectRatio = width / height
        width = Math.round(width * initialScale)
        height = Math.round(height * initialScale)
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          if (aspectRatio > 1) {
            width = Math.min(width, MAX_WIDTH)
            height = Math.round(width / aspectRatio)
          } else {
            height = Math.min(height, MAX_HEIGHT)
            width = Math.round(height * aspectRatio)
          }
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d', { alpha: targetFormat === 'image/webp' })
        if (!ctx) {
          reject(new Error(t('components.pictureUpload.cannotCreateCanvas')))
          return
        }
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        if (targetFormat === 'image/jpeg') {
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(0, 0, width, height)
        }
        ctx.drawImage(img, 0, 0, width, height)
        const compressWithQuality = (minQuality: number, maxQuality: number, attempt = 0): Promise<Blob> => {
          return new Promise((resolveBlob, rejectBlob) => {
            if (attempt > 8 || maxQuality - minQuality < 0.01) {
              canvas.toBlob(
                (blob) =>{
                  if (!blob) {
                    rejectBlob(new Error(t('components.pictureUpload.imageCompressFailed')))
                    return
                  }
                  resolveBlob(blob)
                },
                targetFormat,
                minQuality
              )
              return
            }
            const currentQuality = (minQuality + maxQuality) / 2
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  rejectBlob(new Error(t('components.pictureUpload.imageCompressFailed')))
                  return
                }
                if (Math.abs(blob.size - MAX_COMPRESSED_SIZE)< MAX_COMPRESSED_SIZE * 0.05) {
                  resolveBlob(blob)
                } else if (blob.size >MAX_COMPRESSED_SIZE) {
                  compressWithQuality(minQuality, currentQuality, attempt + 1)
                    .then(resolveBlob)
                    .catch(rejectBlob)
                } else {
                  compressWithQuality(currentQuality, maxQuality, attempt + 1)
                    .then(resolveBlob)
                    .catch(rejectBlob)
                }
              },
              targetFormat,
              currentQuality
            )
          })
        }
        compressWithQuality(0.5, targetQuality)
          .then((finalBlob) => {
            const extension = targetFormat === 'image/webp' ? '.webp' : '.jpg'
            const newFileName = file.name.replace(/\.[^/.]+$/, '') + extension
            const compressedFile = new File([finalBlob], newFileName, {
              type: targetFormat,
              lastModified: Date.now(),
            })
            resolve(compressedFile)
          })
          .catch((error) => {
            reject(error)
          })
      }
      img.onerror = () => reject(new Error(t('components.pictureUpload.imageLoadFailed')))
    }
    reader.onerror = () => reject(new Error(t('components.pictureUpload.fileReadFailed')))
  })
}
const handleClick = () => {
  if (isUploading.value) {
    message.warning(t('components.pictureUpload.uploadingPleaseWait'))
    return
  }
  fileInput.value?.click()
}
const handleDrop = async (e: DragEvent) => {
  if (isMobile.value || isUploading.value) return
  e.preventDefault()
  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    try {
      const file = files[0]
      previewUrl.value = URL.createObjectURL(file)
      await handleUpload(file)
    } catch (error) {
      message.error(t('components.pictureUpload.processFileFailedRetry'))
    }
  }
}
const handleFileChange = async (e: Event) => {
  const input = e.target as HTMLInputElement
  const files = input.files
  if (files && files.length > 0) {
    try {
      const file = files[0]
      previewUrl.value = URL.createObjectURL(file)
      await handleUpload(file)
    } catch (error) {
      message.error(t('components.pictureUpload.processFileFailedRetry'))
    }
  }
}
const handleUpload = async (file: File) => {
  if (!file.type.startsWith('image/')) {
    message.error(t('components.pictureUpload.pleaseSelectPictureFile'))
    return
  }
  if (file.size > MAX_ORIGINAL_SIZE) {
    message.error(t('components.pictureUpload.pictureSizeExceedsLimit'))
    return
  }
  isUploading.value = true
  props.onUploadStart?.(previewUrl.value)
  try {
    const compressedFile = await compressImage(file)
    if (compressedFile.size > MAX_COMPRESSED_SIZE) {
      message.warning(t('components.pictureUpload.pictureTooLarge'))
    }
    const formData = new FormData()
    formData.append('file', compressedFile)
    if (props.spaceId) {
      formData.append('spaceId', props.spaceId.toString())
    }
    if (props.picture?.id) {
      formData.append('id', props.picture.id.toString())
    }
    const res = await uploadPictureUsingPost(
      {
        spaceId: props.spaceId,
        id: props.picture?.id,
      },
      {},
      compressedFile,
      {
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total ?? 100)
          )
          props.onUploadProgress?.(progress)
        },
      }
    )
    if (res.data.code === 0 && res.data.data) {
      props.onSuccess?.(res.data.data, compressedFile)
    } else {
      message.error(t('components.pictureUpload.uploadFailedWithColon') + (res.data?.message || t('components.pictureUpload.checkFormatAndSize')))
    }
  } catch (error: any) {
    message.error(t('components.pictureUpload.uploadFailedWithColon2') + (error.response?.data?.message || t('components.pictureUpload.pleaseTryAgainLater')))
  } finally {
    isUploading.value = false
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
}</script>
<style scoped>.yuemu-upload-container {
  padding: 0;
  height: 100%;
}
.yuemu-upload-box {
  border-radius: 12px;
  padding: 60px 40px;
  text-align: center;
  cursor: pointer;
  transition: var(--theme-transition);
  width: 100%;
  min-height: 440px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}
.yuemu-upload-box:hover {
  border-color: #3b82f6;
}
.yuemu-upload-box.yuemu-uploading {
  pointer-events: none;
}
.yuemu-upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
  width: 100%;
}
.yuemu-illustration-wrapper {
  width: 160px;
  height: 160px;
  transition: transform 0.3s ease;
}
.yuemu-upload-box:hover .yuemu-illustration-wrapper {
  transform: scale(1.02);
}
.yuemu-upload-illustration {
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
.yuemu-upload-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.yuemu-primary-text {
  font-size: 18px;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0;
}
.yuemu-support-tips {
  display: flex;
  justify-content: center;
  gap: 12px;
}
.yuemu-tip-tag {
  color: var(--text-secondary);
  font-size: 12px;
  letter-spacing: 0.05em;
  padding: 2px 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
}
.yuemu-uploading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--card-background);
  opacity: 0.95;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 20;
  color: #3b82f6;
  gap: 12px;
}
.yuemu-spinner {
  width: 32px;
  height: 32px;
  border: 2px solid var(--border-color);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: yuemu-spin 0.8s linear infinite;
}
@keyframes yuemu-spin {
  to { transform: rotate(360deg); }
}
.yuemu-preview-content {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  border-radius: 8px;
}
.yuemu-preview-image {
  width: 100%;
  height: 100%;
  display: block;
  max-height: 500px;
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
  gap: 8px;
}
.yuemu-upload-box:hover .yuemu-preview-mask {
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
  .yuemu-upload-box {
    padding: 32px 20px;
    min-height: 300px;
  }
  .yuemu-illustration-wrapper {
    width: 120px;
    height: 120px;
  }
  .yuemu-primary-text {
    font-size: 16px;
  }
}
/* 移动端强制移除点击时的悬停缩放，防止底层长按死锁 */
@media (max-width: 768px) {
  .ant-card-hoverable:active, .ant-card-hoverable:hover,
  .ant-card-hoverable:active *, .ant-card-hoverable:hover *,
  .yuemu-upload-box:active, .yuemu-upload-box:hover,
  .yuemu-upload-box:active *, .yuemu-upload-box:hover * {
    transform: none !important;
  }
}</style>
