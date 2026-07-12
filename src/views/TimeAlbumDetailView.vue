<template>
  <div class="yuemu-love-album-container">
    <div class="yuemu-dynamic-bg-layer">
      <div id="yuemu-nm-container"></div>
      <div class="yuemu-theme-overlay"></div>
    </div>

    <button v-if="isOwner" class="yuemu-fab-upload-btn yuemu-pulse-animation" @click="showUploadModal = true" :title="$t('pages.timeAlbumDetailView.uploadBtn')">
      <i class="fa-solid fa-plus"></i>
    </button>

    <div class="yuemu-physical-book-wrapper">
      <div class="yuemu-scrapbook-page">
        <div class="yuemu-book-binding"></div>

        <header class="yuemu-album-title-card">
          <div class="yuemu-cover-wrapper">
            <img :src="album?.coverUrl || getDefaultAvatar('album')" :alt="album?.albumName" class="yuemu-hero-cover">
          </div>
          <div class="yuemu-hero-info">
            <div class="yuemu-hero-badge"><i class="fa-solid fa-book-open"></i> Our Memories</div>
            <h1 class="yuemu-title">{{ album?.albumName || $t('pages.timeAlbumDetailView.title') }}</h1>
            <p class="yuemu-description">{{ album?.description || $t('pages.timeAlbumDetailView.desc') }}</p>
            <div class="yuemu-meta-divider"></div>
            <div class="yuemu-meta">
              <span class="yuemu-meta-item"><i class="fa-solid fa-images"></i> {{ $t('pages.timeAlbumDetailView.count', { count: pictures.length }) }}</span>
              <span class="yuemu-meta-item"><i class="fa-solid fa-calendar-day"></i>{{ $t('pages.timeAlbumDetailView.since', { date: formatAlbumDate(album?.createTime) }) }}</span>
            </div>
          </div>
        </header>

        <div v-if="pictures.length === 0" class="yuemu-romantic-empty-state">
          <div class="yuemu-empty-illustration">
            <i class="fa-solid fa-camera-retro"></i>
          </div>
          <p class="yuemu-empty-text">{{isOwner ? $t('pages.timeAlbumDetailView.emptyOwner') : $t('pages.timeAlbumDetailView.emptyVisitor')}}</p>
        </div>

        <div v-else class="yuemu-masonry-grid">
          <div v-for="(picture, index) in pictures" :key="picture.id"
               class="yuemu-scrapbook-item-wrapper"
               :class="`yuemu-tilt-${index % 5}`"
               @click="openPreviewModal(picture)">

            <div class="yuemu-polaroid-card">
              <div class="yuemu-masking-tape"></div>

              <div class="yuemu-img-container">
                <img :src="picture.thumbnailUrl" :alt="picture.name" loading="lazy">
                <div v-if="isOwner" class="yuemu-action-buttons">
                  <button class="yuemu-icon-btn yuemu-edit-btn" @click.stop="handleEditPicture(picture)" :title="$t('pages.timeAlbumDetailView.editBtn')">
                    <i class="fa-solid fa-pen"></i>
                  </button>
                  <button class="yuemu-icon-btn yuemu-delete-btn" @click.stop="handleDeletePicture(picture)" :title="$t('pages.timeAlbumDetailView.deleteBtn')">
                    <i class="fa-solid fa-trash-can"></i>
                  </button>
                </div>
              </div>

              <div class="yuemu-polaroid-caption">
                <p class="yuemu-caption-text">{{ picture.introduction || picture.picIntroduction || 'Love Memory' }}</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <Teleport to="body">
      <div v-if="previewModalVisible" class="yuemu-gallery-preview-overlay" @click="handlePreviewClose">
        <div class="yuemu-preview-header" @click.stop>
          <div class="yuemu-counter">Page {{ currentImageIndex + 1 }} of {{ pictures.length }}</div>
          <button class="yuemu-nav-close-btn" @click="handlePreviewClose">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="yuemu-preview-body" @click.stop>
          <button class="yuemu-nav-arrow yuemu-prev" @click="showPreviousImage" v-if="currentImageIndex > 0">
            <i class="fa-solid fa-chevron-left"></i>
          </button>

          <div class="yuemu-image-track" @touchstart="handleTouchStart" @touchmove="handleTouchMove" @touchend="handleTouchEnd">
            <div class="yuemu-preview-polaroid-frame" :style="{ transform: `translateX(${swipeOffset}px)` }">
              <div class="yuemu-preview-img-box">
                <img :src="selectedPicture?.url" loading="eager" />
              </div>

              <div class="yuemu-preview-text-content">
                <p class="yuemu-preview-description" v-if="selectedPicture?.introduction || selectedPicture?.picIntroduction">
                  {{ selectedPicture.introduction || selectedPicture.picIntroduction }}
                </p>
                <p class="yuemu-preview-description yuemu-empty-desc" v-else>
                  {{ $t('pages.timeAlbumDetailView.defaultIntro') }}
                </p>
                <div class="yuemu-preview-meta-info">
                  <span>{{ formatSize(selectedPicture?.picSize) }}</span>
                  <span class="yuemu-dot">•</span>
                  <span>{{selectedPicture?.picWidth}} × {{selectedPicture?.picHeight}}</span>
                </div>
              </div>
            </div>
          </div>

          <button class="yuemu-nav-arrow yuemu-next" @click="showNextImage" v-if="currentImageIndex < pictures.length - 1">
            <i class="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="showUploadModal" class="yuemu-ios-modal-overlay" @click="showUploadModal = false">
        <div class="yuemu-ios-modal-content yuemu-upload-sheet" @click.stop>
          <div class="yuemu-sheet-drag-handle"></div>
          <div class="yuemu-sheet-header">
            <h2><i class="fa-solid fa-layer-group"></i>{{ $t('pages.timeAlbumDetailView.modals.upload.title') }}</h2>
            <button class="yuemu-sheet-close" @click="showUploadModal = false">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div class="yuemu-sheet-body">
            <div class="yuemu-drop-zone" @click="handleUploadClick" @drop.prevent="handleFileDrop" @dragover.prevent>
              <div v-if="!selectedFiles.length" class="yuemu-drop-empty">
                <div class="yuemu-drop-icon"><i class="fa-solid fa-cloud-arrow-up"></i></div>
                <p>{{ $t('pages.timeAlbumDetailView.modals.upload.dropzone') }}</p>
                <span class="yuemu-sub-tip">{{ $t('pages.timeAlbumDetailView.modals.upload.limit', { limit: MAX_UPLOAD_PER_TIME, current: pictures.length, max: MAX_PHOTOS }) }}</span>
              </div>

              <div v-else class="yuemu-upload-preview-grid">
                <div v-for="(file, index) in previewFiles" :key="index" class="yuemu-preview-card">
                  <img :src="file.preview" :alt="file.name">
                  <button class="yuemu-remove-badge" @click.stop="removeFile(index)">
                    <i class="fa-solid fa-xmark"></i>
                  </button>
                  <div class="yuemu-upload-progress-bar" v-if="file.uploading">
                    <div class="yuemu-fill" :style="{ width: file.progress + '%' }"></div>
                  </div>
                </div>
              </div>
            </div>

            <div class="yuemu-desc-list" v-if="previewFiles.length > 0">
              <div v-for="(file, index) in previewFiles" :key="`desc-${index}`" class="yuemu-desc-item">
                <div class="yuemu-desc-thumb"><img :src="file.preview"></div>
                <div class="yuemu-desc-input-wrap">
                  <textarea v-model="file.description" :placeholder="$t('pages.timeAlbumDetailView.modals.upload.placeholder')" rows="2"></textarea>
                </div>
              </div>
            </div>
          </div>

          <div class="yuemu-sheet-footer">
            <button class="yuemu-btn-secondary" @click="showUploadModal = false">{{ $t('pages.timeAlbumDetailView.modals.upload.cancel') }}</button>
            <button class="yuemu-btn-primary" @click="handleUpload" :disabled="selectedFiles.length === 0 || isUploading">
              <i class="fa-solid fa-spinner fa-spin" v-if="isUploading"></i>
              {{ isUploading ? $t('pages.timeAlbumDetailView.modals.upload.uploading') : $t('pages.timeAlbumDetailView.modals.upload.submit') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <input type="file" ref="fileInput" style="display: none" accept="image/*" multiple @change="handleFileChange">

    <Teleport to="body">
      <div v-if="showEditModal" class="yuemu-ios-modal-overlay" @click="showEditModal = false">
        <div class="yuemu-ios-modal-content yuemu-edit-sheet" @click.stop>
          <div class="yuemu-sheet-drag-handle"></div>
          <div class="yuemu-sheet-header">
            <h2><i class="fa-solid fa-pen-to-square"></i>{{ $t('pages.timeAlbumDetailView.modals.edit.title') }}</h2>
            <button class="yuemu-sheet-close" @click="showEditModal = false">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div class="yuemu-sheet-body">
            <div class="yuemu-edit-preview">
              <img :src="selectedEditPicture?.thumbnailUrl" alt="edit-preview">
            </div>
            <div class="yuemu-edit-input-wrap">
              <textarea v-model="editIntroduction" :placeholder="$t('pages.timeAlbumDetailView.modals.upload.placeholder')" rows="4" maxlength="200"></textarea>
              <div class="yuemu-char-count">{{ editIntroduction.length }}/200</div>
            </div>
          </div>

          <div class="yuemu-sheet-footer">
            <button class="yuemu-btn-secondary" @click="showEditModal = false">{{ $t('pages.timeAlbumDetailView.modals.upload.cancel') }}</button>
            <button class="yuemu-btn-primary" @click="confirmEditPicture">{{ $t('pages.timeAlbumDetailView.modals.edit.submit') }}</button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="showDeleteModal" class="yuemu-ios-modal-overlay" @click="showDeleteModal = false">
        <div class="yuemu-ios-modal-content yuemu-delete-sheet" @click.stop>
          <div class="yuemu-delete-illustration">
            <img :src="selectedDeletePicture?.thumbnailUrl" alt="delete-preview">
            <div class="yuemu-trash-icon-badge">
              <i class="fa-solid fa-trash-can"></i>
            </div>
          </div>
          <div class="yuemu-delete-text">
            <h3>{{ $t('pages.timeAlbumDetailView.modals.delete.title') }}</h3>
            <p>{{ $t('pages.timeAlbumDetailView.modals.delete.desc') }}</p>
          </div>
          <div class="yuemu-sheet-footer yuemu-stack-footer">
            <button class="yuemu-btn-danger yuemu-full-width" @click="confirmDeletePicture">{{ $t('pages.timeAlbumDetailView.modals.delete.submit') }}</button>
            <button class="yuemu-btn-secondary yuemu-full-width" @click="showDeleteModal = false">{{ $t('pages.timeAlbumDetailView.modals.delete.cancel') }}</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import $ from 'jquery'
import dayjs from 'dayjs'
import { message } from 'ant-design-vue'
import { getDefaultAvatar } from '@/utils/userUtils'

import {
  getTimeAlbumByIdUsingGet,
  uploadHeartWallPicturesUsingPost,
  getHeartWallPicturesUsingGet,
  deleteHeartWallPictureUsingPost,
  updatePictureIntroductionUsingPost,
} from '@/api/timeAlbumController'

// ======================== 核心状态与路由 ========================
const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const albumId = route.params.id as string

const isOwner = computed(() => route.query.isOwner === 'true')

// ======================== 类型定义 ========================
interface Album {
  id: number
  albumName: string
  description: string
  coverUrl?: string
  createTime?: string
}

interface Picture {
  id: number
  url: string
  thumbnailUrl: string
  name: string
  createTime: string
  picWidth: number
  picHeight: number
  picSize: string | number
  picFormat: string
  introduction?: string
  picIntroduction?: string
}

interface PreviewFile extends File {
  preview: string
  progress: number
  uploading: boolean
  description: string
}

// ======================== 响应式数据 ========================
const album = ref<Album | null>(null)
const pictures = ref<Picture[]>([])
const loading = ref(false)

const showUploadModal = ref(false)
const selectedFiles = ref<File[]>([])
const previewFiles = ref<PreviewFile[]>([])
const fileInput = ref<HTMLInputElement | null>(null)
const isUploading = ref(false)

const previewModalVisible = ref(false)
const selectedPicture = ref<Picture | null>(null)
const currentImageIndex = ref(0)

const showDeleteModal = ref(false)
const selectedDeletePicture = ref<Picture | null>(null)

const showEditModal = ref(false)
const selectedEditPicture = ref<Picture | null>(null)
const editIntroduction = ref('')

// 触摸滑动状态
const swipeOffset = ref(0)
const touchStartX = ref(0)
const isSwiping = ref(false)

const MAX_PHOTOS = 100
const MAX_UPLOAD_PER_TIME = 9
const MAX_FILE_SIZE = 1 * 1024 * 1024 // 1MB
const MAX_WIDTH = 1920
const MAX_HEIGHT = 1080

// ======================== 工具函数 ========================
// 安全处理日期的函数
const formatAlbumDate = (dateStr?: string) => {
  if (!dateStr) return t('pages.timeAlbumDetailView.msgs.unknownTime')
  try {
    const parsed = dayjs(dateStr)
    return parsed.isValid() ? parsed.format('YYYY-MM-DD') : t('pages.timeAlbumDetailView.msgs.unknownTime')
  } catch (e) {
    return t('pages.timeAlbumDetailView.msgs.unknownTime')
  }
}

// 安全处理文件大小
const formatSize = (size?: string | number) => {
  if (!size) return '0 KB'
  const n = typeof size === 'string' ? parseInt(size) : size
  if (isNaN(n)) return '0 KB'
  if (n < 1024) return n + ' B'
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB'
  return (n / (1024 * 1024)).toFixed(1) + ' MB'
}

// ======================== 数据获取逻辑 ========================
const fetchAlbumInfo = async () => {
  try {
    loading.value = true
    const password = sessionStorage.getItem(`album_${albumId}_password`)
    const res = await getTimeAlbumByIdUsingGet({ id: albumId, password })
    if (res.data.code === 0) {
      album.value = res.data.data
      await fetchPictures()
    } else if (res.data.code === 40101) {
      sessionStorage.removeItem(`album_${albumId}_password`)
      router.replace('/time-album')
    } else {
      throw new Error(res.data.message)
    }
  } catch (error: any) {
    message.error(error.message || t('pages.timeAlbumDetailView.msgs.fetchAlbumFail'))
  } finally {
    loading.value = false
  }
}

const fetchPictures = async () => {
  try {
    const password = sessionStorage.getItem(`album_${albumId}_password`)
    const res = await getHeartWallPicturesUsingGet({ albumId: albumId, password })
    if (res.data.code === 0) {
      const uniquePictures = Array.from(
        new Map((res.data.data || []).map(pic => [pic.id, pic])).values()
      )
      pictures.value = uniquePictures
    }
  } catch (error: any) {
    message.error(error?.response?.data?.message || t('pages.timeAlbumDetailView.msgs.fetchPhotosFail'))
  }
}

// ======================== 图片压缩与上传 ========================
const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    if (file.size <= MAX_FILE_SIZE) {
      resolve(file)
      return
    }
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (e) => {
      const img = new Image()
      img.src = e.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        const aspectRatio = width / height
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          if (aspectRatio > 1) {
            width = MAX_WIDTH
            height = Math.round(width / aspectRatio)
          } else {
            height = MAX_HEIGHT
            width = Math.round(height * aspectRatio)
          }
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d', { alpha: false })
        if (!ctx) return reject(new Error('Canvas error'))
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'medium'
        ctx.drawImage(img, 0, 0, width, height)

        const format = 'image/jpeg'
        const compressWithQuality = (quality: number): Promise<Blob> => {
          return new Promise((resolveBlob, rejectBlob) => {
            canvas.toBlob((blob) => {
              if (!blob) return rejectBlob(new Error(t('pages.timeAlbumDetailView.msgs.compressFail')))
              if (blob.size <= MAX_FILE_SIZE || quality <= 0.5) resolveBlob(blob)
              else compressWithQuality(quality - 0.1).then(resolveBlob).catch(rejectBlob)
            }, format, quality)
          })
        }

        compressWithQuality(0.85).then((finalBlob) => {
          const newFileName = file.name.replace(/\.[^/.]+$/, '.jpg')
          resolve(new File([finalBlob], newFileName, { type: format, lastModified: Date.now() }))
        }).catch(reject)
      }
      img.onerror = () => reject(new Error(t('pages.timeAlbumDetailView.msgs.loadFail')))
    }
    reader.onerror = () => reject(new Error(t('pages.timeAlbumDetailView.msgs.readFail')))
  })
}

const handleUploadClick = () => fileInput.value?.click()
const handleFileChange = (e: Event) => {
  const files = (e.target as HTMLInputElement).files
  if (files) addFiles(Array.from(files))
}
const handleFileDrop = (e: DragEvent) => {
  const files = e.dataTransfer?.files
  if (files) addFiles(Array.from(files))
}

const addFiles = async (files: File[]) => {
  const remainingSlots = MAX_PHOTOS - pictures.value.length
  if (remainingSlots <= 0) return message.warning(t('pages.timeAlbumDetailView.msgs.maxAlbumLimit', { max: MAX_PHOTOS }))

  if (files.length > MAX_UPLOAD_PER_TIME) {
    message.warning(t('pages.timeAlbumDetailView.msgs.maxBatchLimit', { max: MAX_UPLOAD_PER_TIME }))
    files = files.slice(0, MAX_UPLOAD_PER_TIME)
  }
  const filesToAdd = files.slice(0, Math.min(remainingSlots, MAX_UPLOAD_PER_TIME))

  try {
    await Promise.all(
      filesToAdd.map(async (file) => {
        if (!file.type.startsWith('image/')) return
        const compressedFile = await compressImage(file)
        const reader = new FileReader()
        return new Promise<void>((resolve) => {
          reader.onload = (e) => {
            previewFiles.value.push({
              ...compressedFile,
              preview: e.target?.result as string,
              progress: 0,
              uploading: false,
              description: ''
            })
            selectedFiles.value.push(compressedFile)
            resolve()
          }
          reader.readAsDataURL(compressedFile)
        })
      })
    )
  } catch (error) {
    message.error(t('pages.timeAlbumDetailView.msgs.processFail'))
  }
}

const removeFile = (index: number) => {
  selectedFiles.value.splice(index, 1)
  previewFiles.value.splice(index, 1)
}

const handleUpload = async () => {
  if (isUploading.value) return
  isUploading.value = true

  let completedFiles = 0
  let failedFiles = 0

  const uploadTasks = selectedFiles.value.map(async (file, index) => {
    try {
      const formData = new FormData()
      formData.append('files', file)
      formData.append('introduction', previewFiles.value[index].description || '')
      previewFiles.value[index].uploading = true

      const res = await uploadHeartWallPicturesUsingPost(
        { albumId },
        { headers: { 'Content-Type': 'multipart/form-data' }, requestType: 'form', data: formData }
      )

      if (res.data.code === 0) {
        completedFiles++
        previewFiles.value[index].progress = 100
        previewFiles.value[index].uploading = false
      } else {
        throw new Error()
      }
    } catch (error) {
      failedFiles++
      previewFiles.value[index].uploading = false
    }
  })

  await Promise.all(uploadTasks)

  if (failedFiles === 0) message.success(t('pages.timeAlbumDetailView.msgs.allSuccess'))
  else if (completedFiles > 0) message.warning(t('pages.timeAlbumDetailView.msgs.partialSuccess', { success: completedFiles, fail: failedFiles }))
  else message.error(t('pages.timeAlbumDetailView.msgs.uploadFail'))

  if (completedFiles > 0) {
    setTimeout(() => {
      showUploadModal.value = false
      selectedFiles.value = []
      previewFiles.value = []
      fetchPictures()
    }, 500)
  }
  isUploading.value = false
}

// ======================== 图片预览与滑动 ========================
const openPreviewModal = (picture: Picture) => {
  selectedPicture.value = picture
  currentImageIndex.value = pictures.value.findIndex(p => p.id === picture.id)
  previewModalVisible.value = true
}

const showPreviousImage = () => {
  if (currentImageIndex.value > 0) {
    currentImageIndex.value--
    selectedPicture.value = pictures.value[currentImageIndex.value]
  }
}

const showNextImage = () => {
  if (currentImageIndex.value < pictures.value.length - 1) {
    currentImageIndex.value++
    selectedPicture.value = pictures.value[currentImageIndex.value]
  }
}

const handleTouchStart = (e: TouchEvent) => {
  touchStartX.value = e.touches[0].clientX
  isSwiping.value = true
}

const handleTouchMove = (e: TouchEvent) => {
  if (!isSwiping.value) return
  const currentX = e.touches[0].clientX
  const diff = currentX - touchStartX.value

  const previewFrame = document.querySelector('.yuemu-preview-polaroid-frame') as HTMLElement
  if (previewFrame) previewFrame.style.transition = 'none'

  const maxDiff = window.innerWidth * 0.4
  let finalDiff = diff * 0.95
  if (Math.abs(finalDiff) > maxDiff) finalDiff = Math.sign(finalDiff) * maxDiff

  if ((currentImageIndex.value === 0 && diff > 0) || (currentImageIndex.value === pictures.value.length - 1 && diff < 0)) {
    swipeOffset.value = finalDiff * 0.4
  } else {
    swipeOffset.value = finalDiff
  }
}

const handleTouchEnd = () => {
  const minSwipeDistance = 40
  const previewFrame = document.querySelector('.yuemu-preview-polaroid-frame') as HTMLElement

  if (previewFrame) {
    previewFrame.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)'
  }

  if (Math.abs(swipeOffset.value) > minSwipeDistance) {
    const targetOffset = Math.sign(swipeOffset.value) * window.innerWidth
    if (swipeOffset.value > 0 && currentImageIndex.value > 0) {
      swipeOffset.value = targetOffset
      setTimeout(() => {
        showPreviousImage()
        nextTick(() => { swipeOffset.value = 0 })
      }, 50)
    } else if (swipeOffset.value < 0 && currentImageIndex.value < pictures.value.length - 1) {
      swipeOffset.value = targetOffset
      setTimeout(() => {
        showNextImage()
        nextTick(() => { swipeOffset.value = 0 })
      }, 50)
    } else {
      swipeOffset.value = 0
    }
  } else {
    swipeOffset.value = 0
  }
  isSwiping.value = false
}

const handlePreviewClose = () => {
  previewModalVisible.value = false
  swipeOffset.value = 0
}

// ======================== 图片编辑 ========================
const handleEditPicture = (picture: Picture) => {
  selectedEditPicture.value = picture
  editIntroduction.value = picture.introduction || picture.picIntroduction || ''
  showEditModal.value = true
}

const confirmEditPicture = async () => {
  if (!selectedEditPicture.value) return
  try {
    const res = await updatePictureIntroductionUsingPost({
      pictureId: selectedEditPicture.value.id,
      albumId: albumId,
      introduction: editIntroduction.value
    })
    if (res.data.code === 0) {
      message.success(t('pages.timeAlbumDetailView.msgs.editSuccess'))
      showEditModal.value = false
      selectedEditPicture.value = null
      editIntroduction.value = ''
      await fetchPictures()
    } else {
      throw new Error(res.data.message)
    }
  } catch (error: any) {
    message.error(error.message || t('pages.timeAlbumDetailView.msgs.editFail'))
  }
}

// ======================== 图片删除 ========================
const handleDeletePicture = (picture: Picture) => {
  selectedDeletePicture.value = picture
  showDeleteModal.value = true
}

const confirmDeletePicture = async () => {
  if (!selectedDeletePicture.value) return
  try {
    const res = await deleteHeartWallPictureUsingPost({
      albumId: albumId,
      pictureId: String(selectedDeletePicture.value.id)
    })
    if (res.data.code === 0) {
      message.success(t('pages.timeAlbumDetailView.msgs.delSuccess'))
      showDeleteModal.value = false
      selectedDeletePicture.value = null
      await fetchPictures()
    } else {
      throw new Error(res.data.message)
    }
  } catch (error: any) {
    message.error(error.message || t('pages.timeAlbumDetailView.msgs.delFail'))
  }
}

// ======================== 动态背景 (JQ雪花特效) ========================
const initDynamicBackground = () => {
  nextTick(() => {
    const container = document.getElementById('yuemu-nm-container')
    if (!container) return
    const RENDERER = {
      SNOW_COUNT: { INIT: 50, DELTA: 0.2 },
      BACKGROUND_COLOR: 'rgb(255, 240, 245)',
      INIT_HUE: 120, DELTA_HUE: 0.1,
      width: 0, height: 0,
      center: { x: 0, y: 0 },
      countRate: 0,
      canvas: document.createElement('canvas'),
      context: document.createElement('canvas').getContext('2d') as CanvasRenderingContext2D,
      radius: 0, hue: 0, snows: [] as any[],
      init: function() {
        this.setParameters(); this.createSnow(this.SNOW_COUNT.INIT * this.countRate, true); this.render();
      },
      setParameters: function() {
        this.width = container.clientWidth; this.height = container.clientHeight;
        this.center = { x: this.width / 2, y: this.height / 2 };
        this.countRate = this.width * this.height / 250000;
        this.canvas.width = this.width; this.canvas.height = this.height;
        $(container).append(this.canvas);
        this.radius = Math.sqrt(this.center.x * this.center.x + this.center.y * this.center.y);
        this.hue = this.INIT_HUE; this.snows = [];
        this.render = this.render.bind(this);
      },
      createSnow: function(count: number, toRandomize: boolean) {
        for (let i = 0; i < count; i++) this.snows.push(new (SNOW as any)(this.width, this.height, this.center, toRandomize));
      },
      render: function() {
        requestAnimationFrame(this.render);
        const gradient = this.context.createRadialGradient(this.center.x, this.center.y, 0, this.center.x, this.center.y, this.radius);
        const bgColor = this.BACKGROUND_COLOR.replace('%h', this.hue.toString());
        gradient.addColorStop(0, bgColor.replace('%l', '30'));
        gradient.addColorStop(0.2, bgColor.replace('%l', '20'));
        gradient.addColorStop(1, bgColor.replace('%l', '5'));
        this.context.fillStyle = gradient;
        this.context.fillRect(0, 0, this.width, this.height);
        for (let i = this.snows.length - 1; i >= 0; i--) {
          if (!this.snows[i].render(this.context)) this.snows.splice(i, 1);
        }
        this.hue = (this.hue + this.DELTA_HUE) % 360;
        this.createSnow(this.SNOW_COUNT.DELTA, false);
      }
    };

    const SNOW = function(this: any, width: number, height: number, center: any, toRandomize: boolean) {
      this.width = width; this.height = height; this.center = center; this.init(toRandomize);
    };
    SNOW.prototype = {
      RADIUS: 30, TOP_RADIUS: { MIN: 1, MAX: 3 }, SCALE: { INIT: 0.4, DELTA: 0.01, MAX: 4 },
      DELTA_ROTATE: { MIN: -Math.PI / 360, MAX: Math.PI / 360 },
      THRESHOLD_TRANSPARENCY: 0.8, VELOCITY: { MIN: -1, MAX: 1 }, LINE_WIDTH: 2, BLUR: 8, COLOR: 'rgba(255, 192, 203, 0.9)',
      init: function(toRandomize: boolean) {
        this.radius = this.RADIUS + this.TOP_RADIUS.MAX * 2 + this.LINE_WIDTH;
        this.length = this.radius * 2;
        this.canvas = document.createElement('canvas'); this.canvas.width = this.length; this.canvas.height = this.length;
        this.context = this.canvas.getContext('2d');
        this.x = Math.random() * this.width; this.y = Math.random() * this.height;
        this.vx = this.VELOCITY.MIN + (this.VELOCITY.MAX - this.VELOCITY.MIN) * Math.random();
        this.vy = this.VELOCITY.MIN + (this.VELOCITY.MAX - this.VELOCITY.MIN) * Math.random();
        this.deltaRotate = this.DELTA_ROTATE.MIN + (this.DELTA_ROTATE.MAX - this.DELTA_ROTATE.MIN) * Math.random();
        this.scale = this.SCALE.INIT; this.deltaScale = 1 + this.SCALE.DELTA * 500 / Math.max(this.width, this.height);
        this.rotate = 0;
        if (toRandomize) {
          for (let i = 0, count = Math.random() * 1000; i < count; i++) {
            this.x += this.vx; this.y += this.vy; this.scale *= this.deltaScale; this.rotate += this.deltaRotate;
          }
        }
        this.context.clearRect(0, 0, this.length, this.length);
        this.context.save(); this.context.translate(this.radius, this.radius);
        this.context.shadowColor = this.COLOR; this.context.shadowBlur = this.BLUR;
        this.context.fillText('❤️', 0, 0); this.context.restore();
      },
      render: function(context: CanvasRenderingContext2D) {
        context.save();
        if (this.scale > this.THRESHOLD_TRANSPARENCY) {
          context.globalAlpha = Math.max(0, (this.SCALE.MAX - this.scale) / (this.SCALE.MAX - this.THRESHOLD_TRANSPARENCY));
          if (this.scale > this.SCALE.MAX || this.x < -this.radius || this.x > this.width + this.radius || this.y < -this.radius || this.y > this.height + this.radius) {
            context.restore(); return false;
          }
        }
        context.translate(this.x, this.y); context.rotate(this.rotate); context.scale(this.scale, this.scale);
        context.drawImage(this.canvas, -this.radius, -this.radius); context.restore();
        this.x += this.vx; this.y += this.vy; this.scale *= this.deltaScale; this.rotate += this.deltaRotate;
        return true;
      }
    };
    RENDERER.init();
  })
}

onMounted(() => {
  fetchAlbumInfo()
  initDynamicBackground()
})

onUnmounted(() => {
  const container = document.getElementById('yuemu-nm-container')
  if (container) container.innerHTML = ''
})
</script>

<style scoped>
/* ================= 全局基础 & 变量应用 ================= */
.yuemu-love-album-container {
  position: relative;
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
  overflow-x: hidden;
}

/* ================= 动态背景融合 ================= */
.yuemu-dynamic-bg-layer {
  position: fixed; inset: 0; z-index: -1; pointer-events: none;
}
#yuemu-nm-container { width: 100%; height: 100%; background: transparent !important; }
.yuemu-theme-overlay {
  position: absolute; inset: 0;
  background: var(--background);
  opacity: 0.85;
  transition: background var(--theme-transition);
}

/* ================= 实体纸质手账本布局 ================= */
.yuemu-physical-book-wrapper {
  max-width: 1100px;
  margin: 40px auto;
  padding: 0 24px;
}
.yuemu-scrapbook-page {
  /* 弱化了强烈的牛皮纸感，改为柔和雅致的内页色 */
  background: var(--card-background);
  border-radius: 12px 24px 24px 12px;
  box-shadow:
    inset 15px 0 30px rgba(0,0,0,0.02),
    0 16px 40px rgba(0,0,0,0.06),
    -1px 0 2px rgba(0,0,0,0.05);
  position: relative;
  padding: 60px 40px 40px 40px;
  border: 1px solid var(--border-color);
  transition: background var(--theme-transition);
}
[data-theme='dark'] .yuemu-scrapbook-page {
  box-shadow: inset 15px 0 30px rgba(0,0,0,0.1), 0 16px 40px rgba(0,0,0,0.3);
}

/* 书本左侧的装订线效果 - 现代化处理 */
.yuemu-book-binding {
  position: absolute; top: 0; left: 0; bottom: 0;
  width: 30px;
  background: linear-gradient(to right, rgba(0,0,0,0.03) 0%, rgba(0,0,0,0.01) 100%);
  border-right: 1px solid var(--border-color);
  border-radius: 12px 0 0 12px;
  z-index: 10; pointer-events: none;
}
[data-theme='dark'] .yuemu-book-binding {
  background: linear-gradient(to right, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.05) 100%);
}

/* ================= 浪漫扉页 ================= */
.yuemu-album-title-card {
  margin-bottom: 50px; display: flex; align-items: center; gap: 40px;
  background: var(--background);
  padding: 32px 40px; border-radius: 20px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.04);
  border: 1px solid var(--border-color);
  position: relative;
}

.yuemu-cover-wrapper {
  width: 140px; height: 140px; border-radius: 50%;
  overflow: hidden; box-shadow: 0 8px 24px var(--shadow-color);
  flex-shrink: 0; border: 4px solid var(--card-background);
}
.yuemu-hero-cover { width: 100%; height: 100%; object-fit: cover; }
.yuemu-hero-info { flex: 1; display: flex; flex-direction: column; justify-content: center; }
.yuemu-hero-badge {
  display: inline-flex; align-items: center; gap: 8px;
  color: var(--love-primary, #ff7a9e);
  font-size: 14px; margin-bottom: 12px; font-weight: 700;
}
.yuemu-title { font-size: 2.2rem; font-weight: 800; margin: 0 0 12px 0; color: var(--text-primary); line-height: 1.2;}
.yuemu-description { color: var(--text-secondary); font-size: 15px; margin: 0 0 20px 0; line-height: 1.6; }
.yuemu-meta-divider { height: 1px; background: var(--border-color); margin-bottom: 16px; width: 100%; }
.yuemu-meta { display: flex; gap: 24px; font-size: 14px; color: var(--text-secondary); }
.yuemu-meta-item { display: flex; align-items: center; gap: 8px; font-weight: 500;}

/* ================= 空状态 ================= */
.yuemu-romantic-empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  height: 40vh; text-align: center;
}
.yuemu-empty-illustration {
  font-size: 56px; color: var(--border-color);
  animation: yuemu-float 3s ease-in-out infinite; margin-bottom: 16px;
}
@keyframes yuemu-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
.yuemu-empty-text { color: var(--text-secondary); font-size: 15px; font-weight: 500;}

/* ================= 拍立得瀑布流手账排版 ================= */
.yuemu-masonry-grid {
  column-count: 3;
  column-gap: 32px;
}
.yuemu-scrapbook-item-wrapper {
  break-inside: avoid;
  margin-bottom: 32px; cursor: pointer;
  transform: translateZ(0);
  transition: transform 0.4s cubic-bezier(0.32, 0.72, 0, 1), z-index 0s;
  position: relative; z-index: 1;
}

.yuemu-polaroid-card {
  background: var(--background);
  padding: 12px 12px 24px 12px;
  border-radius: 16px; /* 优雅的圆角 */
  box-shadow: 0 10px 30px rgba(0,0,0,0.06);
  border: 1px solid var(--border-color);
  transition: box-shadow 0.4s ease;
  position: relative;
}
[data-theme='dark'] .yuemu-polaroid-card { box-shadow: 0 10px 30px rgba(0,0,0,0.3); }

/* 高级毛玻璃胶带 */
.yuemu-masking-tape {
  position: absolute; top: -14px; left: 50%;
  width: 80px; height: 28px;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.6);
  transform: translateX(-50%) rotate(-2deg);
  z-index: 2; border-radius: 6px; border: 1px solid rgba(255,255,255,0.2);
}
[data-theme='dark'] .yuemu-masking-tape {
  background: rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.05);
}

/* 交互放大 */
.yuemu-scrapbook-item-wrapper:hover {
  transform: translateY(-8px) scale(1.03) rotate(0deg) !important;
  z-index: 10;
}
.yuemu-scrapbook-item-wrapper:hover .yuemu-polaroid-card {
  box-shadow: 0 20px 40px rgba(0,0,0,0.12);
}
[data-theme='dark'] .yuemu-scrapbook-item-wrapper:hover .yuemu-polaroid-card { box-shadow: 0 20px 40px rgba(0,0,0,0.4); }

.yuemu-img-container {
  border-radius: 8px; overflow: hidden; background: var(--hover-background); position: relative;
}
.yuemu-img-container img { width: 100%; display: block; object-fit: cover; }

/* 瀑布流外层的简略描述 */
.yuemu-polaroid-caption { margin-top: 16px; text-align: center; }
.yuemu-caption-text {
  font-size: 14px; color: var(--text-primary); margin: 0;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  opacity: 0.9; font-weight: 500; letter-spacing: 0.5px;
}

/* 微随机倾斜类 */
.yuemu-tilt-0 { transform: rotate(-1.5deg); }
.yuemu-tilt-1 { transform: rotate(1deg); }
.yuemu-tilt-2 { transform: rotate(-0.5deg); }
.yuemu-tilt-3 { transform: rotate(1.5deg); }
.yuemu-tilt-4 { transform: rotate(-1deg); }

/* 照片右上角的操作按钮 */
.yuemu-action-buttons {
  position: absolute; top: 10px; right: 10px;
  display: flex; gap: 8px; opacity: 0; transform: scale(0.8);
  transition: all 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}
.yuemu-scrapbook-item-wrapper:hover .yuemu-action-buttons { opacity: 1; transform: scale(1); }

.yuemu-icon-btn {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  border: none; width: 34px; height: 34px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  cursor: pointer;
}
.yuemu-edit-btn { color: var(--love-primary, #ff7a9e); }
.yuemu-edit-btn:hover { background: var(--love-primary, #ff7a9e); color: #fff; }
.yuemu-delete-btn { color: var(--comment-delete-hover-color, #ff4d4f); }
.yuemu-delete-btn:hover { background: var(--comment-delete-hover-color, #ff4d4f); color: #fff; }

/* ================= 悬浮上传按钮 (FAB) ================= */
.yuemu-fab-upload-btn {
  position: fixed; bottom: 40px; right: 40px;
  width: 60px; height: 60px; border-radius: 50%;
  background: var(--love-primary, #ff7a9e); color: #fff;
  border: none; font-size: 24px;
  box-shadow: 0 10px 24px rgba(255, 122, 158, 0.4);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; z-index: 90; transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.yuemu-fab-upload-btn:hover { transform: scale(1.1) translateY(-4px); box-shadow: 0 14px 32px rgba(255, 122, 158, 0.5); }

/* ================= 沉浸式拍立得全屏预览 ================= */
.yuemu-gallery-preview-overlay {
  position: fixed; inset: 0; background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); z-index: 9999;
  display: flex; flex-direction: column; animation: yuemu-fadeIn 0.2s ease;
}
.yuemu-preview-header {
  height: 80px; display: flex; align-items: center; justify-content: space-between;
  padding: 0 32px; color: rgba(255,255,255,0.9);
}
.yuemu-counter { font-size: 15px; font-weight: 600; letter-spacing: 1px;}
.yuemu-nav-close-btn {
  background: rgba(255,255,255,0.1); border: none; color: #fff;
  width: 44px; height: 44px; border-radius: 50%; font-size: 20px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: background 0.2s;
}
.yuemu-nav-close-btn:hover { background: rgba(255,255,255,0.2); }

.yuemu-preview-body {
  flex: 1; position: relative; display: flex;
  align-items: center; justify-content: center; overflow: hidden;
}
.yuemu-image-track { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }

.yuemu-preview-polaroid-frame {
  background: var(--card-background);
  padding: 24px 24px 40px 24px;
  border-radius: 16px;
  box-shadow: 0 30px 60px rgba(0,0,0,0.4);
  display: flex; flex-direction: column;
  max-width: 90vw; max-height: 85vh;
  transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  will-change: transform;
  border: 1px solid var(--border-color);
}
.yuemu-preview-img-box {
  border-radius: 8px; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  background: var(--hover-background);
  box-shadow: inset 0 2px 8px rgba(0,0,0,0.05);
}
.yuemu-preview-img-box img {
  max-width: 100%; max-height: calc(85vh - 160px);
  object-fit: contain; display: block;
}

.yuemu-preview-text-content {
  margin-top: 24px; text-align: center;
  display: flex; flex-direction: column; align-items: center; gap: 8px;
}
.yuemu-preview-description {
  font-size: 16px; font-weight: 500;
  color: var(--text-primary); margin: 0;
  line-height: 1.6; white-space: pre-wrap;
  max-width: 600px;
}
.yuemu-empty-desc { opacity: 0.4; font-size: 14px;}
.yuemu-preview-meta-info {
  font-size: 13px; color: var(--text-secondary);
  display: flex; justify-content: center; gap: 8px; font-family: monospace;
}

.yuemu-nav-arrow {
  position: absolute; top: 50%; transform: translateY(-50%);
  background: rgba(255,255,255,0.1); border: none; color: #fff;
  width: 56px; height: 56px; border-radius: 50%; font-size: 20px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.2s; z-index: 10; backdrop-filter: blur(4px);
}
.yuemu-nav-arrow:hover { background: rgba(255,255,255,0.25); scale: 1.1; }
.yuemu-nav-arrow.yuemu-prev { left: 40px; }
.yuemu-nav-arrow.yuemu-next { right: 40px; }

/* ================= 现代风格弹窗 (Apple Bottom Sheet) ================= */
.yuemu-ios-modal-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  animation: yuemu-fadeIn 0.2s ease;
}
.yuemu-ios-modal-content {
  background: var(--card-background); color: var(--text-primary);
  border-radius: 24px; width: 90%; max-width: 520px;
  box-shadow: 0 24px 48px var(--shadow-color);
  display: flex; flex-direction: column; overflow: hidden;
  animation: yuemu-slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  border: 1px solid var(--border-color);
}
.yuemu-sheet-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20px 24px; border-bottom: 1px solid var(--border-color);
}
.yuemu-sheet-header h2 { margin: 0; font-size: 18px; font-weight: 600; display: flex; align-items: center; gap: 8px;}
.yuemu-sheet-header h2 i { color: var(--love-primary, #ff7a9e); }
.yuemu-sheet-close {
  background: var(--hover-background); border: none; color: var(--text-secondary);
  width: 32px; height: 32px; border-radius: 50%; font-size: 16px;
  display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s;
}
.yuemu-sheet-close:hover { background: var(--border-color); color: var(--text-primary); }
.yuemu-sheet-body { padding: 24px; max-height: 60vh; overflow-y: auto; }
.yuemu-sheet-footer {
  padding: 16px 24px; border-top: 1px solid var(--border-color);
  display: flex; justify-content: flex-end; gap: 12px; background: var(--card-background);
}
.yuemu-btn-primary, .yuemu-btn-secondary, .yuemu-btn-danger {
  padding: 10px 24px; border-radius: 20px; font-size: 14px; font-weight: 600;
  cursor: pointer; border: none; transition: transform 0.1s; display: flex; align-items: center; gap: 8px; justify-content: center;
}
.yuemu-btn-primary { background: var(--love-primary, #ff7a9e); color: #fff; }
.yuemu-btn-primary:active { transform: scale(0.96); }
.yuemu-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.yuemu-btn-secondary { background: var(--hover-background); color: var(--text-primary); }
.yuemu-btn-danger { background: var(--comment-delete-hover-color, #ff4d4f); color: #fff; }
.yuemu-full-width { width: 100%; padding: 14px; font-size: 16px; border-radius: 16px;}

/* ================= 上传区块 ================= */
.yuemu-drop-zone {
  border: 2px dashed var(--border-color); border-radius: 16px; padding: 32px 16px;
  text-align: center; cursor: pointer; transition: 0.2s; background: var(--hover-background);
}
.yuemu-drop-zone:hover { border-color: var(--love-primary); background: var(--background);}
.yuemu-drop-icon { font-size: 32px; margin-bottom: 12px; color: var(--text-secondary); }
.yuemu-drop-empty p { margin: 0 0 8px; font-weight: 500; }
.yuemu-sub-tip { font-size: 13px; color: var(--text-secondary); }

.yuemu-upload-preview-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.yuemu-preview-card { position: relative; aspect-ratio: 1; border-radius: 12px; overflow: hidden; border: 1px solid var(--border-color); }
.yuemu-preview-card img { width: 100%; height: 100%; object-fit: cover; }
.yuemu-remove-badge {
  position: absolute; top: 6px; right: 6px; background: rgba(0,0,0,0.6); color: #fff; border: none;
  width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 12px;
}
.yuemu-upload-progress-bar { position: absolute; bottom: 0; left: 0; right: 0; height: 4px; background: rgba(255,255,255,0.3); }
.yuemu-upload-progress-bar .yuemu-fill { height: 100%; background: var(--love-primary); transition: width 0.3s; }

.yuemu-desc-list { margin-top: 24px; display: flex; flex-direction: column; gap: 16px; }
.yuemu-desc-item { display: flex; gap: 12px; }
.yuemu-desc-thumb { width: 48px; height: 48px; border-radius: 8px; overflow: hidden; flex-shrink: 0; border: 1px solid var(--border-color); }
.yuemu-desc-thumb img { width: 100%; height: 100%; object-fit: cover; }
.yuemu-desc-input-wrap { flex: 1; }
.yuemu-desc-input-wrap textarea {
  width: 100%; padding: 10px 12px; border-radius: 12px; border: 1px solid var(--border-color);
  background: var(--background); color: var(--text-primary); font-size: 14px; font-family: inherit; resize: none;
  transition: 0.2s;
}
.yuemu-desc-input-wrap textarea:focus { border-color: var(--love-primary); outline: none; box-shadow: 0 0 0 2px rgba(255, 122, 158, 0.1); }

/* ================= 编辑描述区块 ================= */
.yuemu-edit-sheet { max-width: 480px; }
.yuemu-edit-preview {
  width: 100%; max-height: 200px; border-radius: 16px; overflow: hidden;
  background: var(--background); margin-bottom: 20px; border: 1px solid var(--border-color);
}
.yuemu-edit-preview img { width: 100%; height: 100%; object-fit: contain; }
.yuemu-edit-input-wrap { position: relative; }
.yuemu-edit-input-wrap textarea {
  width: 100%; padding: 16px; border-radius: 16px; border: 1px solid var(--border-color);
  background: var(--background); color: var(--text-primary); font-size: 15px; font-family: inherit; resize: none;
  line-height: 1.6; transition: 0.2s;
}
.yuemu-edit-input-wrap textarea:focus { border-color: var(--love-primary); outline: none; box-shadow: 0 0 0 2px rgba(255, 122, 158, 0.1); }
.yuemu-char-count {
  position: absolute; bottom: 12px; right: 16px;
  font-size: 12px; color: var(--text-secondary); pointer-events: none;
}

/* ================= 删除确认区块 ================= */
.yuemu-delete-sheet { max-width: 360px; text-align: center; }
.yuemu-delete-illustration { position: relative; height: 160px; background: var(--background); border-bottom: 1px solid var(--border-color);}
.yuemu-delete-illustration img { width: 100%; height: 100%; object-fit: cover; opacity: 0.6; filter: grayscale(40%); }
.yuemu-trash-icon-badge {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  background: var(--comment-delete-hover-color, #ff4d4f); color: #fff; font-size: 24px;
  width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 20px rgba(255,77,79,0.3); border: 4px solid var(--card-background);
}
.yuemu-delete-text { padding: 32px 24px 0; }
.yuemu-delete-text h3 { margin: 0 0 12px; font-size: 18px; font-weight: 600;}
.yuemu-delete-text p { margin: 0; color: var(--text-secondary); font-size: 14px; line-height: 1.5; }
.yuemu-stack-footer { flex-direction: column; gap: 12px; border-top: none; padding-top: 24px; }

/* ================= 动画 ================= */
@keyframes yuemu-fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes yuemu-slideUpFade { from { opacity: 0; transform: translateY(40px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }

/* ================= 移动端极致全屏适配 ================= */
@media (max-width: 768px) {
  .yuemu-physical-book-wrapper { margin: 0; padding: 0; }
  .yuemu-scrapbook-page {
    border-radius: 0; box-shadow: none; min-height: 100vh;
    padding: 30px 16px 150px 36px; border-right: none; border-left: none; border-bottom: none;
  }
  .yuemu-book-binding { width: 24px; border-radius: 0; }

  .yuemu-album-title-card { flex-direction: column; gap: 20px; padding: 24px; text-align: center;}
  .yuemu-cover-wrapper { width: 100px; height: 100px; }
  .yuemu-hero-badge { align-self: center; }
  .yuemu-meta { flex-direction: column; gap: 8px; align-items: center;}

  .yuemu-masonry-grid { column-count: 2; column-gap: 16px; }
  .yuemu-scrapbook-item-wrapper { margin-bottom: 24px; }
  .yuemu-polaroid-card { padding: 8px 8px 24px 8px; border-radius: 12px;}
  .yuemu-masking-tape { width: 60px; height: 20px; top: -10px;}
  .yuemu-caption-text { font-size: 13px; }

  .yuemu-fab-upload-btn { bottom: 24px; right: 24px; width: 56px; height: 56px; font-size: 20px;}

  .yuemu-nav-arrow { display: none; }
  .yuemu-preview-header { padding: 0 16px; height: 60px; }
  .yuemu-preview-polaroid-frame { padding: 16px 16px 32px 16px; max-width: 95vw; border-radius: 12px;}
  .yuemu-preview-img-box img { max-height: calc(85vh - 120px); }
  .yuemu-preview-description { font-size: 15px; }

  .yuemu-ios-modal-overlay { align-items: flex-end; }
  .yuemu-ios-modal-content {
    width: 100%; max-width: 100%; border-radius: 24px 24px 0 0;
    border-bottom: none; border-left: none; border-right: none;
    animation: yuemu-slideUpSheet 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  }
  .yuemu-sheet-drag-handle { width: 40px; height: 4px; background: var(--border-color); border-radius: 2px; margin: 12px auto 0; }
  .yuemu-sheet-header { padding: 16px 20px; border-bottom: none; }
  .yuemu-sheet-body { padding: 0 20px 24px; max-height: 70vh; }
  .yuemu-sheet-footer { padding-bottom: calc(16px + env(safe-area-inset-bottom)); }
  .yuemu-delete-sheet { max-width: 100%; }
  .yuemu-edit-sheet { max-width: 100%; }
}

@keyframes yuemu-slideUpSheet { from { transform: translateY(100%); } to { transform: translateY(0); } }
</style>
