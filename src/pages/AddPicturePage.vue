<template>
  <div id="yuemu-pictureEditPage" class="yuemu-modern-publish-page">
    <header class="yuemu-publish-header">
      <div class="yuemu-header-left">
        <button class="yuemu-back-btn" @click="handleBack">
          <i class="fa-solid fa-angle-left"></i>
        </button>
        <span class="yuemu-header-title yuemu-mobile-title-inline">{{ picture?.id ? t('pages.addPicturePage.titleEdit') : t('pages.addPicturePage.titlePublish') }}</span>
      </div>
      <div class="yuemu-header-center yuemu-mobile-hide">
        <span class="yuemu-header-title">{{ picture?.id ? t('pages.addPicturePage.titleEdit') : t('pages.addPicturePage.titlePublish') }}</span>
      </div>
      <div class="yuemu-header-right">
        <button class="yuemu-draft-inbox-btn" @click="showDraftModal = true" v-if="!spaceId">
          <i class="fa-solid fa-inbox yuemu-mobile-hide-icon"></i>
          <span>{{ t('pages.addPicturePage.btnDraftBox') }}</span>
        </button>
        <button class="yuemu-preview-header-btn" @click="showImagePreview" v-if="picture?.url && !uploading">
          <i class="fa-solid fa-eye yuemu-mobile-hide-icon"></i>
          <span>{{ t('pages.addPicturePage.btnPreview') }}</span>
        </button>
        <div class="yuemu-pc-actions">
          <button class="yuemu-btn-draft" @click="saveAsDraft" v-if="!spaceId" :disabled="submitting || uploading">{{ t('pages.addPicturePage.btnSaveDraft') }}</button>
          <button class="yuemu-btn-publish" @click="handleSubmit" :disabled="!picture || submitting || uploading">
            <i class="fa-solid fa-spinner fa-spin" v-if="submitting"></i>
            {{ submitting ? t('pages.addPicturePage.statusPublishing') : t('pages.addPicturePage.btnPublish') }}
          </button>
        </div>
      </div>
    </header>

    <div class="yuemu-publish-scroll-container">
      <div class="yuemu-publish-content-grid">

        <div v-if="spaceId && spaceInfo" class="yuemu-space-info-banner">
          <div class="yuemu-space-banner-left">
            <img :src="spaceInfo.spaceCover|| 'src/assets/default-av.png'" alt="空间头像" class="yuemu-space-avatar" />
            <div class="yuemu-space-meta">
              <span class="yuemu-space-name">{{ spaceInfo.spaceName }}</span>
              <span class="yuemu-space-desc">{{ spaceInfo.spaceDescription || t('pages.addPicturePage.noDescription') }}</span>
            </div>
          </div>
          <div class="yuemu-space-stats">
            <span class="yuemu-stat-badge"><i class="fa-solid fa-hard-drive"></i> {{ Math.round((spaceInfo.totalSize || 0) / 1024 / 1024) }}/{{ Math.round((spaceInfo.maxSize || 0) / 1024 / 1024) }}M</span>
          </div>
        </div>

        <main class="yuemu-main-workspace">
          <section class="yuemu-visual-section">
            <div v-if="!picture && !tempPreviewUrl" class="yuemu-unified-upload-card yuemu-empty-state-card">
              <div class="yuemu-upload-mode-toggle">
                <div class="yuemu-toggle-track">
                  <div class="yuemu-toggle-indicator" :class="uploadType"></div>
                  <button class="yuemu-toggle-btn" :class="{ active: uploadType === 'file' }" @click="uploadType = 'file'">
                    <i class="fa-solid fa-cloud-arrow-up"></i> {{ t('pages.addPicturePage.btnLocalUpload') }}
                  </button>
                  <button class="yuemu-toggle-btn" :class="{ active: uploadType === 'url' }" @click="uploadType = 'url'">
                    <i class="fa-solid fa-link"></i> {{ t('pages.addPicturePage.btnUrlUpload') }}
                  </button>
                </div>
              </div>

              <div class="yuemu-upload-component-wrapper">
                <PictureUpload
                  v-if="uploadType === 'file'"
                  :spaceId="spaceId"
                  :onSuccess="onUploadSuccess"
                  :onUploadStart="onUploadStart"
                  :onUploadProgress="onUploadProgress"
                />
                <UrlPictureUpload
                  v-else
                  :spaceId="spaceId"
                  :onSuccess="onUrlUploadSuccess"
                />
              </div>
            </div>

            <div v-else class="yuemu-preview-card">
              <div class="yuemu-image-stage" @click="showImagePreview">
                <div
                  class="yuemu-stage-blur-bg"
                  v-if="picture?.url || tempPreviewUrl"
                  :style="{ backgroundImage: `url(${picture?.url || tempPreviewUrl})` }"
                ></div>

                <div class="yuemu-doubao-loader-overlay" v-if="uploading">
                  <div class="yuemu-rolling-circle yuemu-circle-1"></div>
                  <div class="yuemu-rolling-circle yuemu-circle-2"></div>
                </div>

                <img :src="picture?.url || tempPreviewUrl" alt="预览图" class="yuemu-preview-img" :class="{ 'is-uploading': uploading }" />

                <div class="yuemu-glass-toolbar" @click.stop v-if="!uploading">
                  <button class="yuemu-tool-btn" @click="doEditPicture" :title="t('pages.addPicturePage.btnEditPicture')">
                    <i class="fa-solid fa-sliders"></i>
                  </button>
                  <button class="yuemu-tool-btn" @click="doImagePainting" :title="t('pages.addPicturePage.btnAiOutPainting')">
                    <i class="fa-solid fa-expand"></i>
                  </button>
                  <div class="yuemu-tool-divider"></div>
                  <button class="yuemu-tool-btn danger" @click="handleReupload" :title="t('pages.addPicturePage.btnReplacePicture')">
                    <i class="fa-solid fa-arrow-rotate-right"></i>
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section class="yuemu-form-section">
            <div class="yuemu-form-card yuemu-ios-group">
              <div class="yuemu-immersive-inputs">
                <input
                  v-model="pictureForm.name"
                  :placeholder="t('pages.addPicturePage.placeholderTitle')"
                  class="yuemu-modern-input yuemu-title-input"
                  maxlength="100"
                  :disabled="aiWriting"
                  :class="{ 'yuemu-input-disabled': aiWriting }"
                />
                <div class="yuemu-input-divider"></div>

                <div class="yuemu-desc-wrapper">
                  <textarea
                    v-model="pictureForm.introduction"
                    :placeholder="t('pages.addPicturePage.placeholderContent')"
                    class="yuemu-modern-input yuemu-desc-input"
                    rows="4"
                    :disabled="aiWriting"
                    :class="{ 'yuemu-input-disabled': aiWriting }"
                  ></textarea>

                  <div class="yuemu-ai-floating-btn" v-if="picture?.url">
                    <button class="yuemu-ai-write-btn" @click="doAiGeneratePictureContent" :disabled="aiWriting">
                      <i class="fa-solid fa-wand-magic-sparkles"></i>
                      {{ aiWriting ? aiWritingStatus : t('pages.addPicturePage.btnAiWriting') }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="picture?.url && !spaceId" class="yuemu-form-card yuemu-smart-ai-panel">
              <div class="yuemu-ai-header">
                <div class="yuemu-ai-title">
                  <i class="fa-solid fa-wand-magic-sparkles"></i> {{ t('pages.addPicturePage.aiFeatureExtraction') }}
                </div>
                <button class="yuemu-ai-detail-btn" @click="viewYoloDetail" :disabled="aiTagLoading || uploading">
                  {{ uploading ? t('pages.addPicturePage.statusWaitingPicture') : (aiTagLoading ? t('pages.addPicturePage.statusAnalyzing') : t('pages.addPicturePage.btnDeepAnalysis')) }} <i class="fa-solid fa-angle-right"></i>
                </button>
              </div>
              <div class="yuemu-ai-content">
                <div v-if="aiTagLoading" class="yuemu-ai-loading-pulse">
                  <div class="yuemu-pulse-dot"></div> {{ t('pages.addPicturePage.aiReadingDetails') }}
                </div>
                <div v-else-if="picture?.aiLabels && translateLabels(picture.aiLabels)?.length > 0" class="yuemu-ai-chip-group">
                  <span v-for="tag in translateLabels(picture.aiLabels)" :key="tag" class="yuemu-ai-chip">
                    # {{ tag }}
                  </span>
                </div>
                <div v-if="!aiTagLoading && picture?.aiLabels && hasSensitiveLabel(picture.aiLabels)" class="yuemu-ai-alert">
                  <i class="fa-solid fa-shield-halved"></i> {{ getSensitiveWarning() }}
                </div>
              </div>
            </div>

            <div class="yuemu-form-card yuemu-ios-group yuemu-settings-group">
              <div class="yuemu-setting-row" @click="showCategoryModal = true">
                <div class="yuemu-setting-info">
                  <div class="yuemu-setting-icon-wrap yuemu-bg-blue">
                    <i class="fa-solid fa-folder-open"></i>
                  </div>
                  <span class="yuemu-setting-label">{{ t('pages.addPicturePage.labelSelectCategory') }} <span class="yuemu-required">*</span></span>
                </div>
                <div class="yuemu-setting-action">
                  <span class="yuemu-setting-value" :class="{ 'placeholder': !pictureForm.category }">
                    {{ pictureForm.category || t('pages.addPicturePage.requiredField') }}
                  </span>
                  <i class="fa-solid fa-chevron-right yuemu-chevron"></i>
                </div>
              </div>

              <div class="yuemu-setting-divider"></div>

              <div class="yuemu-setting-row" @click="showTagModal = true">
                <div class="yuemu-setting-info">
                  <div class="yuemu-setting-icon-wrap yuemu-bg-orange">
                    <i class="fa-solid fa-hashtag"></i>
                  </div>
                  <span class="yuemu-setting-label">{{ t('pages.addPicturePage.labelParticipateTopic') }}</span>
                </div>
                <div class="yuemu-setting-action">
                  <div class="yuemu-tag-preview-list" v-if="pictureForm.tags.length > 0">
                    <span class="yuemu-preview-tag" v-for="tag in pictureForm.tags.slice(0, 1)" :key="tag">{{ tag }}</span>
                    <span class="yuemu-preview-tag more" v-if="pictureForm.tags.length > 1">+{{ pictureForm.tags.length - 1 }}</span>
                  </div>
                  <span class="yuemu-setting-value placeholder" v-else>{{ t('pages.addPicturePage.placeholderAddTag') }}</span>
                  <i class="fa-solid fa-chevron-right yuemu-chevron"></i>
                </div>
              </div>

              <div class="yuemu-setting-divider"></div>

              <!-- <div class="yuemu-setting-row">
                <div class="yuemu-setting-info">
                  <div class="yuemu-setting-icon-wrap yuemu-bg-green">
                    <i class="fa-solid fa-download"></i>
                  </div>
                  <span class="yuemu-setting-label">允许保存图片</span>
                </div>
                <div class="yuemu-setting-action" @click="pictureForm.isDownload = pictureForm.isDownload === 1 ? 0 : 1">
                  <div class="yuemu-ios-switch" :class="{ active: pictureForm.isDownload === 1 }">
                    <div class="yuemu-switch-handle"></div>
                  </div>
                </div>
              </div> -->
            </div>
          </section>
        </main>
      </div>
    </div>

    <footer class="yuemu-publish-footer yuemu-mobile-footer">
      <button class="yuemu-footer-btn yuemu-draft-btn" @click="saveAsDraft" v-if="!spaceId" :disabled="submitting || uploading">{{ t('pages.addPicturePage.btnSaveDraft') }}</button>
      <button class="yuemu-footer-btn yuemu-publish-btn" @click="handleSubmit" :disabled="!picture || submitting || uploading">
        <i class="fa-solid fa-spinner fa-spin" v-if="submitting"></i>
        {{ submitting ? t('pages.addPicturePage.statusPublishing') : t('pages.addPicturePage.btnPublish') }}
      </button>
    </footer>

    <Transition name="yuemu-fade-modal">
      <div v-if="showCategoryModal" class="yuemu-glass-modal-mask" @click="showCategoryModal = false">
        <div class="yuemu-glass-modal yuemu-category-modal" @click.stop>
          <div class="yuemu-modal-drag-handle yuemu-mobile-only"></div>
          <div class="yuemu-modal-top">
            <h3>{{ t('pages.addPicturePage.modalTitleSelectCategory') }}</h3>
            <button class="yuemu-close-btn" @click="showCategoryModal = false"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="yuemu-modal-search" v-if="categoryOptions.length > 8">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input v-model="categorySearchText" :placeholder="t('pages.addPicturePage.placeholderSearchCategory')" @input="filterCategories" />
          </div>
          <div class="yuemu-modal-scroll-area">
            <div v-if="filteredCategoryOptions.length === 0" class="yuemu-empty-state">{{ t('pages.addPicturePage.emptyCategory') }}</div>
            <div class="yuemu-selection-grid">
              <div
                class="yuemu-selection-card"
                v-for="category in filteredCategoryOptions"
                :key="category.value"
                :class="{ active: pictureForm.category === category.value }"
                @click="selectCategory(category.value)"
              >
                {{ category.label }}
                <i class="fa-solid fa-circle-check yuemu-check-mark" v-if="pictureForm.category === category.value"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="yuemu-fade-modal">
      <div v-if="showTagModal" class="yuemu-glass-modal-mask" @click="showTagModal = false">
        <div class="yuemu-glass-modal yuemu-tag-modal" @click.stop>
          <div class="yuemu-modal-drag-handle yuemu-mobile-only"></div>
          <div class="yuemu-modal-top">
            <h3>{{ t('pages.addPicturePage.modalTitleParticipateTopic') }}</h3>
            <button class="yuemu-close-btn" @click="showTagModal = false"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <div class="yuemu-tag-creator">
            <input v-model="tagInput" :placeholder="t('pages.addPicturePage.placeholderCustomTag')" @keyup.enter="addCustomTag" />
            <button @click="addCustomTag"><i class="fa-solid fa-arrow-up"></i></button>
          </div>

          <div class="yuemu-active-tags-area" v-if="pictureForm.tags.length > 0">
            <span class="yuemu-active-tag" v-for="tag in pictureForm.tags" :key="tag">
              # {{ tag }} <i class="fa-solid fa-xmark" @click="removeTag(tag)"></i>
            </span>
          </div>

          <div class="yuemu-modal-search yuemu-tag-search" v-if="tagOptions.length > 0">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input v-model="tagSearchText" :placeholder="t('pages.addPicturePage.placeholderSearchTopic')" @input="filterTags" />
          </div>

          <div class="yuemu-modal-scroll-area">
            <div class="yuemu-selection-chips">
              <div
                class="yuemu-chip"
                v-for="tag in filteredTagOptions"
                :key="tag.value"
                :class="{ active: pictureForm.tags.includes(tag.value) }"
                @click="toggleTag(tag.value)"
              >
                # {{ tag.label }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="yuemu-fade-modal">
      <div v-if="showDraftModal" class="yuemu-glass-modal-mask" @click="showDraftModal = false">
        <div class="yuemu-glass-modal yuemu-draft-modal" @click.stop>
          <div class="yuemu-modal-drag-handle yuemu-mobile-only"></div>
          <div class="yuemu-modal-top">
            <h3>{{ t('pages.addPicturePage.modalTitleLocalDrafts') }}</h3>
            <button class="yuemu-close-btn" @click="showDraftModal = false"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="yuemu-modal-scroll-area yuemu-draft-scroll-area" @scroll="handleDraftScroll">
            <div v-if="draftLoading" class="yuemu-draft-loading">
              <i class="fa-solid fa-spinner fa-spin"></i>
              <p>{{ t('pages.addPicturePage.statusLoadingInspiration') }}</p>
            </div>
            <div v-else-if="draftList.length === 0" class="yuemu-empty-draft">
              <div class="yuemu-empty-icon-wrap">
                <i class="fa-solid fa-inbox"></i>
              </div>
              <p>{{ t('pages.addPicturePage.emptyDrafts') }}</p>
            </div>
            <div v-else>
              <div class="yuemu-xhs-draft-grid">
                <div
                  v-for="draft in draftList"
                  :key="draft.id"
                  class="yuemu-xhs-draft-card"
                  @click="loadDraft(draft)"
                >
                  <div class="yuemu-draft-cover-wrap">
                    <img :src="draft.url" alt="草稿预览" class="yuemu-draft-cover" />
                    <div class="yuemu-draft-overlay">
                      <span class="yuemu-draft-time-badge">{{ formatDraftTime(draft.editTime || draft.createTime) }}</span>
                    </div>
                    <button class="yuemu-draft-glass-delete" @click.stop="deleteDraft(draft.id)">
                      <i class="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                  <div class="yuemu-draft-card-info">
                    <div class="yuemu-draft-title">{{ draft.name || t('pages.addPicturePage.unnamedShare') }}</div>
                  </div>
                </div>
              </div>

              <!-- 触底加载更多状态展示 -->
              <div v-if="draftLoadingMore" class="yuemu-draft-load-more">
                <i class="fa-solid fa-spinner fa-spin"></i>
                <span>{{ t('pages.addPicturePage.statusLoadingMore') }}</span>
              </div>
              <div v-else-if="!hasMoreDrafts && draftList.length > 0" class="yuemu-draft-no-more">
                <span>{{ t('pages.addPicturePage.noMoreData') }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <ImagePreview
      v-model:visible="showPreview"
      :images="picture?.url ? [picture.url] : []"
    />

    <Transition name="yuemu-fade-modal">
      <div v-if="showYoloModal" class="yuemu-glass-modal-mask" @click.self="showYoloModal = false">
        <div class="yuemu-glass-modal yuemu-yolo-modal">
          <div class="yuemu-modal-drag-handle yuemu-mobile-only"></div>
          <div class="yuemu-modal-top">
            <h3>{{ t('pages.addPicturePage.modalTitleAiYolo') }}</h3>
            <button class="yuemu-close-btn" @click="showYoloModal = false"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="yuemu-yolo-content">
            <div v-if="yoloLoading" class="yuemu-cyber-loading">
              <div class="yuemu-scanner"></div>
              <p>{{ t('pages.addPicturePage.aiScanningNetwork') }}</p>
            </div>
            <div v-else-if="yoloResult" class="yuemu-yolo-result-view">
              <div class="yuemu-yolo-image-box">
                <img :src="'data:image/jpeg;base64,' + yoloResult.annotatedImageBase64" alt="标注图" />
              </div>
              <div class="yuemu-yolo-data">
                <h4>{{ t('pages.addPicturePage.extractedTotal', { count: yoloResult.detections?.length || 0 }) }}</h4>
                <div class="yuemu-data-list">
                  <div v-for="(det, index) in yoloResult.detections" :key="index" class="yuemu-data-item">
                    <span class="yuemu-det-name">{{ translateLabels([det.label])[0] }}</span>
                    <span class="yuemu-det-score">{{ (det.confidence * 100).toFixed(1) }}%</span>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="yuemu-yolo-image-box yuemu-yolo-fail">
              <i class="fa-solid fa-triangle-exclamation"></i>
              <p>{{ t('pages.addPicturePage.failGetDeepFeatures') }}</p>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <div class="yuemu-toast-message" :class="[toastType, { 'yuemu-show': showToast }]">
      <i class="fa-solid" :class="toastType === 'success' ? 'fa-circle-check' : (toastType === 'warning' ? 'fa-triangle-exclamation' : 'fa-circle-xmark')"></i>
      <span>{{ toastMessage }}</span>
    </div>

    <div class="yuemu-center-modal-overlay" v-if="showConfirmModal">
      <div class="yuemu-center-modal">
        <div class="yuemu-modal-icon" :class="confirmConfig.okType === 'danger' ? 'yuemu-danger' : 'yuemu-blue'">
          <i class="fa-solid" :class="confirmConfig.okType === 'danger' ? 'fa-trash-can' : 'fa-circle-info'"></i>
        </div>
        <h3 class="yuemu-modal-title">{{ confirmConfig.title }}</h3>
        <p class="yuemu-modal-desc">{{ confirmConfig.content }}</p>
        <div class="yuemu-modal-actions">
          <button class="yuemu-modal-btn yuemu-outline" @click="handleConfirmCancel">{{ confirmConfig.cancelText }}</button>
          <button class="yuemu-modal-btn" :class="confirmConfig.okType === 'danger' ? 'yuemu-danger-btn' : 'yuemu-primary'" @click="handleConfirmOk">{{ confirmConfig.okText }}</button>
        </div>
      </div>
    </div>

    <ImageCropper
      ref="imageCropperRef"
      :imageUrl="picture?.url"
      :picture="picture"
      :spaceId="spaceId"
      :space="spaceInfo"
      :onSuccess="onCropSuccess"
    />
    <ImageOutPainting
      ref="imageOutPaintingRef"
      :picture="picture"
      :spaceId="spaceId"
      :onSuccess="onImageOutPaintingSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import PictureUpload from '@/components/PictureUpload.vue'
import UrlPictureUpload from '@/components/UrlPictureUpload.vue'
import ImageCropper from '@/components/ImageCropper.vue'
import ImageOutPainting from '@/components/ImageOutPainting.vue'
import ImagePreview from '@/components/ImagePreview.vue'
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { translateLabels, hasSensitiveLabel, getSensitiveWarning } from '@/utils/yoloUtils'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import { detectObjectsUsingPost } from '@/api/yoloController'
import { getDeviceType } from '@/utils/device'
import { DEVICE_TYPE_ENUM } from '@/constants/device'
import {
  editPictureUsingPost,
  getPictureVoByIdUsingGet,
  listPictureTagCategoryUsingGet,
  deletePictureUsingPost,
  updatePictureDraftStatusUsingPost,
  getLatestDraftUsingGet,
  listDraftPicturesUsingGet,
  aiTagUsingPost,
  aiGenerateImageStreamUsingGet
} from '@/api/pictureController'
import myAxios from '@/request'
import { getSpaceVoByIdUsingGet } from '@/api/spaceController'

const { t } = useI18n()

// ================= 全局原生提示框状态 =================
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'error' | 'warning'>('success')
let toastTimer: any = null

const showToastMsg = (msg: string, type: 'success' | 'error' | 'warning' = 'success') => {
  toastMessage.value = msg
  toastType.value = type
  showToast.value = true
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { showToast.value = false }, 3000)
}

const showConfirmModal = ref(false)
const confirmConfig = reactive({
  title: '',
  content: '',
  okText: t('pages.addPicturePage.btnConfirm'),
  cancelText: t('pages.addPicturePage.btnCancel'),
  okType: 'primary',
  onOk: () => {},
  onCancel: () => {}
})

const showCustomConfirm = (config: any) => {
  Object.assign(confirmConfig, {
    okText: t('pages.addPicturePage.btnConfirm'),
    cancelText: t('pages.addPicturePage.btnCancel'),
    okType: 'primary',
    onCancel: () => {},
    ...config
  })
  showConfirmModal.value = true
}

const handleConfirmOk = () => {
  showConfirmModal.value = false
  if (confirmConfig.onOk) confirmConfig.onOk()
}

const handleConfirmCancel = () => {
  showConfirmModal.value = false
  if (confirmConfig.onCancel) confirmConfig.onCancel()
}
// ===================================================

const picture = ref<any>()
const tempPreviewUrl = ref<string>('')
const uploading = ref(false)
const aiWriting = ref(false)
const aiWritingStatus = ref(t('pages.addPicturePage.aiWritingStatusInit'))
const aiTagLoading = ref(false)
const uploadProgress = ref(0)
const uploadType = ref<'file' | 'url'>('file')
const submitting = ref(false)
const isMobile = ref(false)

const pictureForm = reactive<API.PictureEditRequest>({
  name: '',
  introduction: '',
  category: '',
  tags: [],
  isDownload: 1,
  aiLabels: '',
  spaceId: undefined
})

const showCategoryModal = ref(false)
const showTagModal = ref(false)
const showPreview = ref(false)
const showDraftModal = ref(false)
const draftLoading = ref(false)
const rawDraftList = ref<any[]>([])
const draftList = ref<any[]>([])
const draftPage = ref(1)
const draftPageSize = 10
const draftLoadingMore = ref(false)
const hasMoreDrafts = computed(() => draftList.value.length < rawDraftList.value.length)
const tagInput = ref('')

const showYoloModal = ref(false)
const yoloLoading = ref(false)
const yoloResult = ref<{ annotatedImageBase64: string; detections: any[] } | null>(null)

const categorySearchText = ref('')
const tagSearchText = ref('')
const filteredCategoryOptions = ref<{ label: string; value: string }[]>([])
const filteredTagOptions = ref<{ label: string; value: string }[]>([])

const route = useRoute()
const router = useRouter()
const loginUserStore = useLoginUserStore()

const spaceId = computed(() => route.query?.spaceId || null)
const spaceInfo = ref<API.SpaceVO>()

const categoryOptions = ref<{ label: string; value: string }[]>([])
const tagOptions = ref<{ label: string; value: string }[]>([])

const isCreated = ref(false)

const imageCropperRef = ref()
const imageOutPaintingRef = ref()

onMounted(async () => {
  isMobile.value = (await getDeviceType()) === DEVICE_TYPE_ENUM.MOBILE
  await Promise.all([
    getSpaceInfo(),
    getTagCategoryOptions(),
    getOldPicture()
  ])

  filteredCategoryOptions.value = [...categoryOptions.value]
  filteredTagOptions.value = [...tagOptions.value]
})

const onUploadStart = (url?: string) => {
  uploading.value = true
  uploadProgress.value = 0
  if (url) {
    tempPreviewUrl.value = url
  }
}

const onUploadProgress = (progress: number) => {
  uploadProgress.value = Math.min(progress, 99)
}

const onSuccess = (newPicture: API.PictureVO) => {
  uploading.value = false
  uploadProgress.value = 100
  tempPreviewUrl.value = ''
  picture.value = newPicture
  if (!pictureForm.name) {
    pictureForm.name = newPicture.name || ''
  }
  pictureForm.isDownload = newPicture.isDownload ?? 1
  if (newPicture.aiLabels) {
    pictureForm.aiLabels = Array.isArray(newPicture.aiLabels)
      ? JSON.stringify(newPicture.aiLabels)
      : newPicture.aiLabels
  }
}

const onUploadSuccess = async (newPicture: API.PictureVO, file: File) => {
  onSuccess(newPicture)
  if (!spaceId.value) {
    doAiTag(file, String(newPicture.id))
  }
}

const doAiGeneratePictureContent = async () => {
  if (!picture.value?.url) return
  if (aiWriting.value) return

  // 收起手机键盘和输入法
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }

  aiWriting.value = true
  aiWritingStatus.value = t('pages.addPicturePage.aiWritingStatusPreparing')
  pictureForm.name = ''
  pictureForm.introduction = ''

  try {
    let accumulatedText = ''
    let eventBuffer = ''
    let rawContent = ''

    await aiGenerateImageStreamUsingGet(
      { imageUrl: picture.value.url },
      {
        responseType: 'text',
        onDownloadProgress: (progressEvent: any) => {
          const xhr = progressEvent.event?.target
          if (!xhr) return

          const responseText = xhr.responseText
          const newText = responseText.substring(accumulatedText.length)
          accumulatedText = responseText
          eventBuffer += newText

          let nextNewlineIndex
          while ((nextNewlineIndex = eventBuffer.indexOf('\n\n')) !== -1) {
            const eventChunk = eventBuffer.slice(0, nextNewlineIndex)
            eventBuffer = eventBuffer.slice(nextNewlineIndex + 2)

            let eventType = 'message'
            let dataStr = ''
            eventChunk.split('\n').forEach(line => {
              if (line.startsWith('event:')) eventType = line.substring(6).trim()
              else if (line.startsWith('data:')) dataStr = line.substring(5).trim()
            })

            if (dataStr) {
              try {
                const data = JSON.parse(dataStr)
                if (data.isSystem) {
                  message.warning(data.text || '')
                  return
                }

                if (eventType === 'status' && data.status) {
                  aiWritingStatus.value = data.status
                } else if (eventType === 'content_chunk' && data.text) {
                  rawContent += data.text

                  let cleanContent = rawContent

                  // 1. 提取 TITLE
                  const titleMatch = cleanContent.match(/#TITLE#([^\n<]+)/)
                  if (titleMatch) {
                    pictureForm.name = titleMatch[1].trim()
                    cleanContent = cleanContent.replace(/#TITLE#[^\n<]+(?:[\n\s]|<br\s*\/?>)*/i, '')
                  } else {
                    const firstLineMatch = cleanContent.match(/^([^#\n<]+)(?:[\n\s]|<br\s*\/?>)+/)
                    if (firstLineMatch) {
                      pictureForm.name = firstLineMatch[1].trim()
                      cleanContent = cleanContent.replace(/^([^#\n<]+)(?:[\n\s]|<br\s*\/?>)+/, '')
                    }
                  }

                  pictureForm.introduction = cleanContent.trim()
                } else if (eventType === 'done') {
                  aiWriting.value = false
                } else if (eventType === 'error') {
                  aiWriting.value = false
                  message.error(data.error || t('pages.addPicturePage.toastAiWritingFail'))
                }
              } catch (e) {}
            }
          }
        }
      }
    )
  } catch (error) {
    message.error(t('pages.addPicturePage.toastAiRequestError'))
    aiWriting.value = false
  }
}

const onUrlUploadSuccess = async (newPicture: API.PictureVO) => {
  onSuccess(newPicture)
}

const getSpaceInfo = async () => {
  if (spaceId.value) {
    const res = await getSpaceVoByIdUsingGet({ id: spaceId.value })
    if (res.data.code === 0) spaceInfo.value = res.data.data
  }
}

const getTagCategoryOptions = async () => {
  const res = await listPictureTagCategoryUsingGet()
  if (res.data.code === 0 && res.data.data) {
    tagOptions.value = (res.data.data.tagList ?? []).map((item: string) => ({
      value: item,
      label: item
    }))
    categoryOptions.value = (res.data.data.categoryList ?? []).map((item: string) => ({
      value: item,
      label: item
    }))
    filteredCategoryOptions.value = [...categoryOptions.value]
    filteredTagOptions.value = [...tagOptions.value]
  }
}

// 安全地将可能是字符串形式的 JSON 数组强制解析为真正数组的辅助方法
const safeParseArray = (val: any) => {
  if (Array.isArray(val)) return val
  if (typeof val === 'string' && val.trim() !== '') {
    try {
      const parsed = JSON.parse(val)
      return Array.isArray(parsed) ? parsed : []
    } catch (e) {
      return []
    }
  }
  return []
}

const getOldPicture = async () => {
  const id = route.query?.id
  if (id) {
    const res = await getPictureVoByIdUsingGet({ id })
    if (res.data.code === 0 && res.data.data) {
      const data = res.data.data
      picture.value = data
      Object.assign(pictureForm, {
        name: data.name,
        introduction: data.introduction,
        category: data.category,
        tags: safeParseArray(data.tags),
        isDownload: data.isDownload ?? 1,
        aiLabels: data.aiLabels || ''
      })
    }
  }
}

const getLatestDraft = async () => {
  try {
    const res = await getLatestDraftUsingGet()
    if (res.data.code === 0 && res.data.data && !picture.value) {
      const data = res.data.data
      picture.value = data
      Object.assign(pictureForm, {
        name: data.name || '',
        introduction: data.introduction || '',
        category: data.category || '',
        tags: safeParseArray(data.tags),
        isDownload: data.isDownload ?? 1,
        aiLabels: data.aiLabels || ''
      })
    }
  } catch (e) {}
}

const getDraftList = async () => {
  draftLoading.value = true
  draftPage.value = 1
  try {
    const res = await listDraftPicturesUsingGet()
    if (res.data.code === 0 && res.data.data) {
      rawDraftList.value = Array.isArray(res.data.data) ? res.data.data : []
      draftList.value = rawDraftList.value.slice(0, draftPageSize)
    }
  } catch (error) {
    showToastMsg(t('pages.addPicturePage.toastFetchDraftFail'), 'error')
  } finally {
    draftLoading.value = false
  }
}

const handleDraftScroll = (e: Event) => {
  const target = e.target as HTMLElement
  if (!target) return
  // 判断滚动条是否触底
  const threshold = 15 // 触底阈值
  const isBottom = target.scrollHeight - target.scrollTop - target.clientHeight < threshold
  if (isBottom && !draftLoadingMore.value && hasMoreDrafts.value) {
    loadMoreDrafts()
  }
}

const loadMoreDrafts = async () => {
  if (draftLoadingMore.value || !hasMoreDrafts.value) return
  draftLoadingMore.value = true
  // 模拟加载延时以提供更加优雅的动效
  await new Promise(resolve => setTimeout(resolve, 300))
  try {
    draftPage.value += 1
    draftList.value = rawDraftList.value.slice(0, draftPage.value * draftPageSize)
  } finally {
    draftLoadingMore.value = false
  }
}

const loadDraft = (draft: any) => {
  picture.value = draft
  Object.assign(pictureForm, {
    name: draft.name || '',
    introduction: draft.introduction || '',
    category: draft.category || '',
    tags: safeParseArray(draft.tags),
    isDownload: draft.isDownload ?? 1,
    aiLabels: draft.aiLabels || ''
  })
  showDraftModal.value = false
  showToastMsg(t('pages.addPicturePage.toastDraftLoaded'), 'success')
}

const deleteDraft = async (draftId: number) => {
  showCustomConfirm({
    title: t('pages.addPicturePage.confirmTitleDeleteDraft'),
    content: t('pages.addPicturePage.confirmContentDeleteDraft'),
    okText: t('pages.addPicturePage.btnDelete'),
    cancelText: t('pages.addPicturePage.btnCancel'),
    okType: 'danger',
    onOk: async () => {
      try {
        const res = await deletePictureUsingPost({ id: draftId })
        if (res.data.code === 0) {
          showToastMsg(t('pages.addPicturePage.toastDeleteSuccess'), 'success')
          rawDraftList.value = rawDraftList.value.filter(d => d.id !== draftId)
          draftList.value = rawDraftList.value.slice(0, draftPage.value * draftPageSize)
        } else {
          showToastMsg(t('pages.addPicturePage.toastDeleteFail'), 'error')
        }
      } catch (error) {
        showToastMsg(t('pages.addPicturePage.toastDeleteFail'), 'error')
      }
    }
  })
}

const formatDraftTime = (time: string) => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60))
      return minutes === 0 ? t('pages.addPicturePage.timeJustNow') : t('pages.addPicturePage.timeMinutesAgo', { minutes })
    }
    return t('pages.addPicturePage.timeHoursAgo', { hours })
  } else if (days === 1) {
    return t('pages.addPicturePage.timeYesterday')
  } else if (days < 7) {
    return t('pages.addPicturePage.timeDaysAgo', { days })
  } else {
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }
}

watch(showDraftModal, (newVal) => {
  if (newVal) {
    getDraftList()
  }
})

const filterCategories = () => {
  const searchText = categorySearchText.value.trim().toLowerCase()
  if (!searchText) {
    filteredCategoryOptions.value = [...categoryOptions.value]
    return
  }
  filteredCategoryOptions.value = categoryOptions.value.filter((item: any) =>
    item.label.toLowerCase().includes(searchText) || item.value.toLowerCase().includes(searchText)
  )
}

const filterTags = () => {
  const searchText = tagSearchText.value.trim().toLowerCase()
  if (!searchText) {
    filteredTagOptions.value = [...tagOptions.value]
    return
  }
  filteredTagOptions.value = tagOptions.value.filter((item: any) =>
    item.label.toLowerCase().includes(searchText) || item.value.toLowerCase().includes(searchText)
  )
}

const viewYoloDetail = async () => {
  if (!picture.value?.url) return
  showYoloModal.value = true
  yoloLoading.value = true
  yoloResult.value = null
  try {
    const response = await fetch(picture.value.url)
    const blob = await response.blob()
    const file = new File([blob], 'image.jpg', { type: blob.type })
    const res = await detectObjectsUsingPost({}, file)
    if (res.data.code === 0) {
      yoloResult.value = res.data.data
    } else {
      showToastMsg(t('pages.addPicturePage.toastFetchDetailFail'), 'error')
    }
  } catch (error) {
    showToastMsg(t('pages.addPicturePage.toastNetworkLimit'), 'error')
  } finally {
    yoloLoading.value = false
  }
}

const doAiTag = async (file?: File, pictureId?: string) => {
  const pId = pictureId || (picture.value?.id ? String(picture.value.id) : null)
  if (!pId) return
  aiTagLoading.value = true
  try {
    let targetFile = file
    if (!targetFile && picture.value?.url) {
      try {
        const response = await fetch(picture.value.url)
        const blob = await response.blob()
        const extension = picture.value.url.split('.').pop() || 'jpg'
        targetFile = new File([blob], `image.${extension}`, { type: blob.type })
      } catch (e) {
        return
      }
    }
    if (!targetFile) return
    const res = await aiTagUsingPost({ pictureId: pId }, {}, targetFile)
    if (res.data.data) {
      const labelsStr = JSON.stringify(res.data.data)
      picture.value = { ...picture.value, aiLabels: labelsStr }
      pictureForm.aiLabels = labelsStr
    }
  } catch (error) {
  } finally {
    aiTagLoading.value = false
  }
}

const selectCategory = (value: string) => {
  pictureForm.category = value
  showCategoryModal.value = false
}

const toggleTag = (value: string) => {
  const index = pictureForm.tags.indexOf(value)
  if (index > -1) {
    pictureForm.tags.splice(index, 1)
  } else {
    pictureForm.tags.push(value)
  }
}

const addCustomTag = () => {
  const val = tagInput.value.trim()
  if (val && !pictureForm.tags.includes(val)) {
    pictureForm.tags.push(val)
    tagInput.value = ''
  }
}

const removeTag = (tag: string) => {
  const index = pictureForm.tags.indexOf(tag)
  if (index > -1) pictureForm.tags.splice(index, 1)
}

const showImagePreview = () => {
  if (picture.value?.url && !uploading.value) showPreview.value = true
}

const closeImagePreview = () => { showPreview.value = false }

const doEditPicture = () => { imageCropperRef.value?.openModal() }
const doImagePainting = () => { imageOutPaintingRef.value?.openModal() }
const onCropSuccess = (newPic: API.PictureVO) => { picture.value = newPic }
const onImageOutPaintingSuccess = (newPic: API.PictureVO) => { picture.value = newPic }

const handleReupload = () => {
  picture.value = undefined
  Object.assign(pictureForm, { name: '', introduction: '', category: '', tags: [], isDownload: 1 })
  uploading.value = false
  uploadProgress.value = 0
}

const handleSubmit = async () => {
  if (!picture.value?.id || submitting.value) return
  if (!pictureForm.category) {
    showToastMsg(t('pages.addPicturePage.toastSelectCategoryPrompt'), 'error')
    showCategoryModal.value = true
    return
  }
  submitting.value = true
  try {
    const aiLabelsStr = Array.isArray(pictureForm.aiLabels) ? JSON.stringify(pictureForm.aiLabels) : (pictureForm.aiLabels || '')

    // 强制保障 tags 为数组，防止传给后端字符串形式的 "[]"
    let tagsArray = []
    if (typeof pictureForm.tags === 'string') {
      try { tagsArray = JSON.parse(pictureForm.tags) } catch(e) { tagsArray = [] }
    } else if (Array.isArray(pictureForm.tags)) {
      tagsArray = pictureForm.tags
    }

    const res = await editPictureUsingPost({ id: picture.value.id, spaceId: spaceId.value, ...pictureForm, tags: tagsArray, aiLabels: aiLabelsStr })

    if (res.data.code === 0) {
      const draftRes = await updatePictureDraftStatusUsingPost({ pictureId: picture.value.id, isDraft: 0 })
      if (draftRes.data.code === 0) {
        isCreated.value = true
        if (!spaceId.value) {
          const hasShown = localStorage.getItem('hasShownApprovalNotice')
          if (!hasShown) {
            showCustomConfirm({
              title: t('pages.addPicturePage.confirmTitlePublishSuccess'),
              content: t('pages.addPicturePage.confirmContentPublishSuccess'),
              okText: t('pages.addPicturePage.btnOk'),
              onOk: () => {
                localStorage.setItem('hasShownApprovalNotice', 'true')
                router.push(`/picture-redirect/${picture.value.id}`)
              },
              onCancel: () => router.push(`/picture-redirect/${picture.value.id}`)
            })
          } else {
            showToastMsg(t('pages.addPicturePage.confirmTitlePublishSuccess'), 'success')
            router.push(`/picture-redirect/${picture.value.id}`)
          }
        } else {
          showToastMsg(t('pages.addPicturePage.toastSavedToSpace'), 'success')
          router.push(`/space/${spaceId.value}`)
        }
      }
    }
  } catch (error) {
    showToastMsg(t('pages.addPicturePage.toastPublishFail'), 'error')
  } finally {
    submitting.value = false
  }
}

const saveAsDraft = async () => {
  if (!picture.value?.id) return showToastMsg(t('pages.addPicturePage.toastUploadContentFirst'), 'error')
  try {
    const aiLabelsStr = Array.isArray(pictureForm.aiLabels) ? JSON.stringify(pictureForm.aiLabels) : (pictureForm.aiLabels || '')

    // 强制保障 tags 为数组，防止传给后端字符串形式的 "[]"
    let tagsArray = []
    if (typeof pictureForm.tags === 'string') {
      try { tagsArray = JSON.parse(pictureForm.tags) } catch(e) { tagsArray = [] }
    } else if (Array.isArray(pictureForm.tags)) {
      tagsArray = pictureForm.tags
    }

    const res = await editPictureUsingPost({ id: picture.value.id, spaceId: spaceId.value, ...pictureForm, tags: tagsArray, aiLabels: aiLabelsStr })
    if (res.data.code === 0) {
      const draftRes = await updatePictureDraftStatusUsingPost({ pictureId: picture.value.id, isDraft: 1 })
      if (draftRes.data.code === 0) {
        showToastMsg(t('pages.addPicturePage.toastSavedToDrafts'), 'success')
        router.push('/')
      }
    }
  } catch (error) {
    showToastMsg(t('pages.addPicturePage.toastSaveDraftFail'), 'error')
  }
}

const handleBack = () => {
  if (picture.value && !isCreated.value) {
    showCustomConfirm({
      title: t('pages.addPicturePage.confirmTitleDiscardEdit'),
      content: t('pages.addPicturePage.confirmContentDiscardEdit'),
      okText: t('pages.addPicturePage.btnLeave'),
      cancelText: t('pages.addPicturePage.btnContinueEdit'),
      okType: 'danger',
      onOk: () => router.back()
    })
  } else {
    router.back()
  }
}
</script>

<style scoped>
/* ====================================
   全局与基础重置 (加前缀版)
   ==================================== */
.yuemu-modern-publish-page {
  position: fixed; inset: 0; background-color: var(--background);
  color: var(--text-primary); z-index: 100; display: flex; flex-direction: column;
  overflow: hidden; transition: background-color 0.3s, color 0.3s;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
}

.yuemu-mobile-only { display: none; }

/* ====================================
   头部导航 (Header)
   ==================================== */
.yuemu-publish-header {
  padding: 0 24px 0;
  height: 60px;
  background: var(--card-background);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  display: flex; align-items: center; justify-content: space-between;
  border-bottom: 0.5px solid var(--border-color); z-index: 10; flex-shrink: 0;
  position: relative;
}

.yuemu-header-left, .yuemu-header-right { z-index: 2; position: relative; }

.yuemu-header-left { display: flex; align-items: center; }
.yuemu-back-btn { width: 36px; height: 36px; border: none; border-radius: 50%; background: transparent; color: var(--text-primary); display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 20px; transition: 0.2s; }
.yuemu-back-btn:hover { background: var(--hover-background); }

.yuemu-header-center {
  position: absolute; left: 50%;
  transform: translateX(-50%); height: 60px; display: flex;
  align-items: center; justify-content: center; width: 50%; z-index: 1;
}
.yuemu-header-title { font-size: 17px; font-weight: 600; color: var(--text-primary); letter-spacing: 0.5px; }

.yuemu-header-right { display: flex; justify-content: flex-end; align-items: center; gap: 16px; }

/* 隐藏移动端图标辅助类 */
.yuemu-mobile-hide-icon {
  display: inline-block;
}

.yuemu-mobile-title-inline {
  display: none;
}

/* 顶部草稿箱和预览按钮 */
.yuemu-draft-inbox-btn, .yuemu-preview-header-btn {
  background: var(--hover-background); border: 1px solid var(--border-color); border-radius: 18px; padding: 6px 14px;
  display: flex; align-items: center; gap: 6px; color: var(--text-primary); font-size: 14px;
  font-weight: 500; cursor: pointer; transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.yuemu-draft-inbox-btn:hover, .yuemu-preview-header-btn:hover { background: var(--border-color); transform: translateY(-1px); }
.yuemu-draft-inbox-btn i, .yuemu-preview-header-btn i { font-size: 16px; color: #007AFF; }

/* 触底加载更多及无更多提示样式 */
.yuemu-draft-load-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px 0;
  color: var(--text-secondary);
  font-size: 13px;
}
.yuemu-draft-load-more i {
  color: #007AFF;
}
.yuemu-draft-no-more {
  text-align: center;
  padding: 16px 0;
  color: var(--text-secondary);
  font-size: 12px;
  opacity: 0.6;
}

.yuemu-pc-actions { display: flex; gap: 12px; }

.yuemu-btn-draft { background: transparent; border: 1px solid var(--border-color); color: var(--text-secondary); padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: 500; cursor: pointer; transition: 0.2s; }
.yuemu-btn-draft:hover { background: var(--hover-background); color: var(--text-primary); border-color: var(--text-secondary); }

.yuemu-btn-publish { background: #007AFF; border: none; color: #fff; padding: 8px 24px; border-radius: 20px; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 6px; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 12px rgba(0, 122, 255, 0.2); }
.yuemu-btn-publish:hover:not(:disabled) { transform: scale(1.05); box-shadow: 0 6px 16px rgba(0, 122, 255, 0.3); }
.yuemu-btn-publish:disabled { background: var(--border-color); color: var(--text-secondary); cursor: not-allowed; box-shadow: none; transform: none; }

.yuemu-mobile-footer { display: none; }

/* ====================================
   主工作区布局
   ==================================== */
.yuemu-publish-scroll-container { flex: 1; overflow-y: auto; padding: 24px; }
.yuemu-publish-content-grid { max-width: 1100px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px; }
.yuemu-main-workspace { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 32px; align-items: start; }

/* ====================================
   空间信息横幅
   ==================================== */
.yuemu-space-info-banner { background: var(--card-background); border-radius: 20px; padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 4px 20px var(--shadow-color); border: 1px solid var(--border-color); }
.yuemu-space-banner-left { display: flex; align-items: center; gap: 16px; flex: 1; overflow: hidden; }
.yuemu-space-avatar { width: 50px; height: 50px; border-radius: 14px; object-fit: cover; border: 1px solid rgba(0,0,0,0.05); }
.yuemu-space-meta { flex: 1; overflow: hidden; display: flex; align-items: center; gap: 12px; }
.yuemu-space-name { margin: 0; font-size: 16px; font-weight: 700; color: var(--text-primary); white-space: nowrap; flex-shrink: 0; }
.yuemu-space-desc { margin: 0; font-size: 13px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; }
.yuemu-space-stats { display: flex; gap: 12px; flex-shrink: 0; }
.yuemu-stat-badge { background: var(--hover-background); padding: 6px 12px; border-radius: 10px; font-size: 13px; font-weight: 500; color: var(--text-secondary); display: flex; align-items: center; gap: 6px; }

/* ====================================
   左侧：视觉区
   ==================================== */
.yuemu-visual-section { display: flex; flex-direction: column; height: 100%; }

.yuemu-unified-upload-card.yuemu-empty-state-card { background: var(--hover-background); border: 1px solid rgba(0,0,0,0.05); border-radius: 36px; padding: 40px; min-height: 500px; display: flex; flex-direction: column; align-items: center; justify-content: center; transition: 0.3s; }
.yuemu-unified-upload-card.yuemu-empty-state-card:hover { border-color: rgba(0, 122, 255, 0.3); background: var(--card-background); }

.yuemu-upload-mode-toggle { margin-bottom: 40px; width: 100%; display: flex; justify-content: center; }
.yuemu-toggle-track { background: rgba(0,0,0,0.04); padding: 6px; border-radius: 100px; display: inline-flex; position: relative; max-width: 100%; box-sizing: border-box; box-shadow: inset 0 2px 6px rgba(0,0,0,0.02); }
.yuemu-toggle-indicator { position: absolute; top: 6px; bottom: 6px; width: calc(50% - 6px); background: var(--card-background); border-radius: 100px; box-shadow: 0 4px 12px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04); transition: 0.4s cubic-bezier(0.34, 1.2, 0.64, 1); }
.yuemu-toggle-indicator.url { transform: translateX(100%); }
.yuemu-toggle-btn { position: relative; z-index: 1; border: none; background: transparent; padding: 12px 32px; font-size: 15px; font-weight: 500; color: var(--text-secondary); cursor: pointer; transition: 0.3s; display: flex; align-items: center; justify-content: center; gap: 8px; flex: 1; border-radius: 100px; }
.yuemu-toggle-btn.active { color: var(--text-primary); font-weight: 600; }

.yuemu-upload-component-wrapper { width: 100%; flex: 1; display: flex; align-items: center; justify-content: center; }

.yuemu-preview-card { border-radius: 24px; overflow: hidden; background: var(--card-background); box-shadow: 0 8px 30px var(--shadow-color); }
.yuemu-image-stage { position: relative; width: 100%; height: 550px; background: var(--background); display: flex; align-items: center; justify-content: center; overflow: hidden; }

.yuemu-stage-blur-bg { position: absolute; inset: -50px; background-size: cover; background-position: center; filter: blur(40px) brightness(0.85); opacity: 0.6; z-index: 0; }
.yuemu-preview-img { position: relative; z-index: 1; max-width: 90%; max-height: 90%; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.25); object-fit: contain; transition: 0.3s; }
.yuemu-preview-img.is-uploading { filter: blur(10px) brightness(0.9); }

.yuemu-glass-toolbar { position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%); background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); padding: 8px 16px; border-radius: 100px; display: flex; align-items: center; gap: 16px; border: 0.5px solid rgba(255, 255, 255, 0.2); z-index: 10; opacity: 0; transition: 0.3s; }
.yuemu-image-stage:hover .yuemu-glass-toolbar { opacity: 1; bottom: 32px; }

.yuemu-tool-btn { background: rgba(255,255,255,0.1); border: none; color: #fff; font-size: 16px; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
.yuemu-tool-btn:hover { background: rgba(255, 255, 255, 0.3); transform: scale(1.1); }
.yuemu-tool-btn.danger:hover { background: #ff3b30; color: #fff; }
.yuemu-tool-divider { width: 1px; height: 16px; background: rgba(255,255,255,0.3); }

/* ====================================
   右侧：沉浸式极简表单
   ==================================== */
.yuemu-form-card { background: var(--card-background); margin-bottom:12px;border-radius: 24px; padding: 24px; box-shadow: 0 4px 30px var(--shadow-color); display: flex; flex-direction: column; gap: 16px; }

.yuemu-immersive-inputs { display: flex; flex-direction: column; gap: 12px; }
.yuemu-modern-input { width: 100%; border: none; outline: none; background: transparent; color: var(--text-primary); font-family: inherit; }
.yuemu-modern-input::placeholder { color: var(--text-secondary); opacity: 0.6; font-weight: normal; }
.yuemu-title-input { font-size: 20px; font-weight: 700; line-height: 1.4; padding: 4px 0;}
.yuemu-input-divider { height: 0.5px; background: var(--border-color); width: 100%; margin: 4px 0;}
.yuemu-desc-input { font-size: 15px; line-height: 1.6; resize: none; color: var(--text-primary); padding: 4px 0;}

.yuemu-smart-ai-panel { background: var(--hover-background); border-radius: 16px; padding: 16px; border: 0.5px solid var(--border-color); box-shadow: none;}
.yuemu-ai-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.yuemu-ai-title { color: var(--text-primary); font-weight: 600; font-size: 14px; display: flex; align-items: center; gap: 8px; }
.yuemu-ai-title i { color: #007AFF; }
.yuemu-ai-detail-btn { background: transparent; border: none; color: var(--text-secondary); font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 4px; }
.yuemu-ai-chip-group { display: flex; flex-wrap: wrap; gap: 8px; }
.yuemu-ai-chip { background: var(--card-background); border: 0.5px solid var(--border-color); color: var(--text-secondary); padding: 4px 12px; border-radius: 8px; font-size: 12px; }
.yuemu-ai-loading-pulse { display: flex; align-items: center; gap: 8px; color: var(--text-secondary); font-size: 13px; }
.yuemu-pulse-dot { width: 8px; height: 8px; background: #007AFF; border-radius: 50%; animation: pulse 1s infinite; }

.yuemu-settings-group { display: flex; flex-direction: column; gap: 0; padding: 0;}
.yuemu-setting-row { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; cursor: pointer; transition: background-color 0.2s; }
.yuemu-setting-row:hover { background-color: var(--hover-background); }
.yuemu-setting-row:first-child { border-radius: 24px 24px 0 0; }
.yuemu-setting-row:last-child { border-radius: 0 0 24px 24px; }
.yuemu-setting-divider { height: 0.5px; background: var(--border-color); margin-left: 56px; }

.yuemu-setting-info { display: flex; align-items: center; gap: 12px; font-size: 15px; font-weight: 500; color: var(--text-primary); }
.yuemu-setting-icon-wrap { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 14px;}
.yuemu-bg-blue { background: #007AFF; }
.yuemu-bg-orange { background: #FF9500; }
.yuemu-bg-green { background: #34C759; }

.yuemu-required { color: #ff3b30; margin-left: 2px; }
.yuemu-setting-action { display: flex; align-items: center; gap: 8px; color: var(--text-secondary); font-size: 14px; }
.yuemu-setting-value { color: var(--text-secondary); font-weight: 400; max-width: 120px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: right;}
.yuemu-setting-value.placeholder { color: var(--text-secondary); opacity: 0.5;}
.yuemu-chevron { font-size: 12px; color: var(--text-secondary); opacity: 0.5;}

.yuemu-ios-switch { width: 50px; height: 30px; background: var(--border-color); border-radius: 15px; position: relative; transition: 0.3s; }
.yuemu-ios-switch.active { background: #34C759; }
.yuemu-switch-handle { width: 26px; height: 26px; background: #fff; border-radius: 50%; position: absolute; top: 2px; left: 2px; box-shadow: 0 2px 4px rgba(0,0,0,0.2); transition: 0.3s cubic-bezier(0.32, 0.72, 0, 1); }
.yuemu-ios-switch.active .yuemu-switch-handle { transform: translateX(20px); }

/* ====================================
   补全的丢失样式 (重点修复区)
   ==================================== */

/* 标签创建与展示区域 */
.yuemu-tag-creator { padding: 16px 24px; display: flex; gap: 12px; border-bottom: 0.5px solid var(--border-color); }
.yuemu-tag-creator input { flex: 1; background: var(--hover-background); border: none; padding: 10px 16px; border-radius: 12px; outline: none; color: var(--text-primary); font-size: 15px;}
.yuemu-tag-creator button { background: #007AFF; color: #fff; border: none; width: 44px; border-radius: 12px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center;}
.yuemu-tag-creator button:hover { opacity: 0.8; }

.yuemu-active-tags-area { padding: 16px 24px; display: flex; flex-wrap: wrap; gap: 8px; border-bottom: 0.5px solid var(--border-color); }
.yuemu-active-tag { background: rgba(0, 122, 255, 0.1); color: #007AFF; padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 500; display: flex; align-items: center; gap: 6px; }
.yuemu-active-tag i { cursor: pointer; opacity: 0.7; transition: 0.2s; }
.yuemu-active-tag i:hover { opacity: 1; }

.yuemu-tag-search { border-bottom: none !important; padding-bottom: 0 !important; }

/* 标签碎片列表 */
.yuemu-selection-chips { display: flex; flex-wrap: wrap; gap: 10px; }
.yuemu-chip { background: var(--hover-background); color: var(--text-secondary); padding: 8px 16px; border-radius: 20px; font-size: 13px; cursor: pointer; border: 1px solid transparent; transition: 0.2s; }
.yuemu-chip.active { background: rgba(0, 122, 255, 0.1); color: #007AFF; border-color: rgba(0, 122, 255, 0.3); font-weight: 600; }

.yuemu-tag-preview-list { display: flex; gap: 6px; }
.yuemu-preview-tag { background: var(--hover-background); padding: 2px 8px; border-radius: 6px; font-size: 12px; color: var(--text-primary); }

/* 全屏大图预览 */
.yuemu-fullscreen-preview { position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 3000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px); animation: yuemu-fadeIn 0.2s; }
.yuemu-fullscreen-preview img { max-width: 100vw; max-height: 100vh; object-fit: contain; }
.yuemu-close-preview { position: absolute; top: 20px; right: 20px; background: rgba(255,255,255,0.2); border: none; color: #fff; width: 40px; height: 40px; border-radius: 50%; font-size: 20px; cursor: pointer; transition: 0.2s; z-index: 3001; display: flex; align-items: center; justify-content: center;}
.yuemu-close-preview:hover { background: rgba(255,255,255,0.4); transform: rotate(90deg); }

/* YOLO AI 分析弹窗 */
.yuemu-yolo-content { padding: 0; display: flex; flex-direction: column; max-height: 70vh; overflow-y: auto;}
.yuemu-cyber-loading { padding: 60px; text-align: center; color: #0A84FF; font-family: monospace; }
.yuemu-scanner { width: 100px; height: 2px; background: #0A84FF; margin: 0 auto 20px; box-shadow: 0 0 10px #0A84FF; animation: yuemu-scan 1s infinite alternate; }
@keyframes yuemu-scan { from { transform: translateY(-10px); } to { transform: translateY(10px); } }
.yuemu-yolo-result-view { display: flex; flex-direction: column; }
.yuemu-yolo-image-box { background: #000; padding: 16px; text-align: center; border-bottom: 1px solid #3A3A3C;}
.yuemu-yolo-image-box img { max-height: 40vh; max-width: 100%; border-radius: 8px; object-fit: contain;}
.yuemu-yolo-data { padding: 20px; background: #1C1C1E; }
.yuemu-yolo-data h4 { margin: 0 0 16px 0; color: #EBEBF5; font-size: 15px; font-weight: 500; }
.yuemu-data-list { display: flex; flex-wrap: wrap; gap: 10px; }
.yuemu-data-item { background: rgba(10, 132, 255, 0.1); border: 1px solid rgba(10, 132, 255, 0.3); padding: 6px 12px; border-radius: 8px; font-size: 13px; color: #0A84FF; display: flex; align-items: center; gap: 6px;}
.yuemu-det-score { color: #34C759; font-weight: 600; font-family: monospace;}
.yuemu-yolo-fail { padding: 60px 20px; color: #ff3b30; display: flex; flex-direction: column; align-items: center; gap: 12px; font-size: 15px;}
.yuemu-yolo-fail i { font-size: 32px; }

/* 原生 Toast 提示 */
.yuemu-toast-message { position: fixed; top: 20px; left: 50%; transform: translate(-50%, -20px); background: rgba(0,0,0,0.8); color: #fff; padding: 12px 24px; border-radius: 30px; display: flex; align-items: center; gap: 8px; z-index: 9999; font-size: 15px; font-weight: 500; opacity: 0; visibility: hidden; transition: all 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28); backdrop-filter: blur(8px); }
.yuemu-toast-message.yuemu-show { transform: translate(-50%, 20px); opacity: 1; visibility: visible; }
.yuemu-toast-message.success i { color: #34C759; }
.yuemu-toast-message.error i { color: #ff3b30; }
.yuemu-toast-message.warning i { color: #FF9500; }

/* 居中确认框 (Center Modal) */
.yuemu-center-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 2000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); animation: yuemu-fadeIn 0.2s;}
.yuemu-center-modal { background: var(--card-background); width: 85%; max-width: 320px; border-radius: 20px; padding: 24px; text-align: center; animation: yuemu-zoomIn 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28); border: 1px solid var(--border-color); box-shadow: 0 20px 40px rgba(0,0,0,0.2);}
@keyframes yuemu-zoomIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.yuemu-modal-icon { width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; margin: 0 auto 16px; }
.yuemu-modal-icon.yuemu-blue { background: rgba(0, 122, 255, 0.1); color: #007AFF; }
.yuemu-modal-icon.yuemu-danger { background: rgba(255, 59, 48, 0.1); color: #ff3b30; }
.yuemu-modal-title { font-size: 18px; font-weight: 600; margin: 0 0 10px; color: var(--text-primary); }
.yuemu-modal-desc { font-size: 14px; color: var(--text-secondary); margin: 0 0 24px; line-height: 1.5; }
.yuemu-modal-actions { display: flex; gap: 12px; }
.yuemu-modal-btn { flex: 1; height: 44px; border-radius: 22px; font-size: 15px; font-weight: 600; cursor: pointer; border: none; transition: 0.2s;}
.yuemu-modal-btn.yuemu-primary { background: #007AFF; color: #fff; }
.yuemu-modal-btn.yuemu-danger-btn { background: #ff3b30; color: #fff; }
.yuemu-modal-btn.yuemu-outline { background: var(--hover-background); color: var(--text-primary); }
.yuemu-modal-btn:hover { filter: brightness(0.9); }

/* ====================================
   小红书风格网格草稿箱 (PC/H5 通用)
   ==================================== */
.yuemu-draft-modal { max-width: 640px !important; }
.yuemu-draft-scroll-area { padding: 16px; background: var(--background); border-radius: 0 0 24px 24px; }
.yuemu-empty-draft { padding: 80px 20px; text-align: center; color: var(--text-secondary); }
.yuemu-empty-icon-wrap { width: 80px; height: 80px; background: var(--card-background); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; box-shadow: 0 8px 24px var(--shadow-color); }
.yuemu-empty-icon-wrap i { font-size: 32px; color: var(--border-color); }
.yuemu-empty-draft p { margin: 0; font-size: 15px; font-weight: 500; }

.yuemu-xhs-draft-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.yuemu-xhs-draft-card { background: var(--card-background); border-radius: 12px; overflow: hidden; cursor: pointer; transition: 0.3s; box-shadow: 0 2px 8px var(--shadow-color); display: flex; flex-direction: column; border: 0.5px solid var(--border-color);}
.yuemu-xhs-draft-card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px var(--shadow-color); }

.yuemu-draft-cover-wrap { position: relative; width: 100%; aspect-ratio: 3/4; overflow: hidden; background: var(--hover-background); }
.yuemu-draft-cover { width: 100%; height: 100%; object-fit: cover; transition: 0.3s; }
.yuemu-xhs-draft-card:hover .yuemu-draft-cover { transform: scale(1.05); }

.yuemu-draft-overlay { position: absolute; inset: auto 0 0 0; height: 50%; background: linear-gradient(to top, rgba(0,0,0,0.6), transparent); display: flex; align-items: flex-end; padding: 10px; pointer-events: none; }
.yuemu-draft-time-badge { color: rgba(255,255,255,0.9); font-size: 11px; font-weight: 500; background: rgba(0,0,0,0.3); backdrop-filter: blur(8px); padding: 2px 8px; border-radius: 10px; }

.yuemu-draft-glass-delete { position: absolute; top: 8px; right: 8px; width: 28px; height: 28px; border-radius: 50%; background: rgba(0,0,0,0.4); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border: none; color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; opacity: 0; transform: scale(0.9); }
.yuemu-xhs-draft-card:hover .yuemu-draft-glass-delete { opacity: 1; transform: scale(1); }
.yuemu-draft-glass-delete:hover { background: #ff3b30; }

.yuemu-draft-card-info { padding: 10px; }
.yuemu-draft-title { font-size: 14px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* ====================================
   全局玻璃态弹窗 / 底部抽屉动画 (iOS Style)
   ==================================== */
.yuemu-fade-modal-enter-active, .yuemu-fade-modal-leave-active { transition: opacity 0.3s ease; }
.yuemu-fade-modal-enter-from, .yuemu-fade-modal-leave-to { opacity: 0; }
.yuemu-fade-modal-enter-active .yuemu-glass-modal { animation: slideUpModal 0.4s cubic-bezier(0.32, 0.72, 0, 1); }
.yuemu-fade-modal-leave-active .yuemu-glass-modal { animation: slideDownModal 0.3s cubic-bezier(0.32, 0.72, 0, 1) forwards; }
@keyframes slideUpModal { from { transform: translateY(40px) scale(0.95); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
@keyframes slideDownModal { from { transform: translateY(0) scale(1); opacity: 1; } to { transform: translateY(40px) scale(0.95); opacity: 0; } }
@keyframes yuemu-fadeIn { from { opacity: 0; } to { opacity: 1; } }

.yuemu-glass-modal-mask { position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); z-index: 1000; display: flex; align-items: center; justify-content: center; }
.yuemu-glass-modal { background: var(--card-background); width: 90%; max-width: 440px; border-radius: 24px; box-shadow: 0 24px 48px rgba(0,0,0,0.2); display: flex; flex-direction: column; max-height: 85vh; position: relative; overflow: hidden; border: 0.5px solid var(--border-color);}
.yuemu-modal-top { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 0.5px solid var(--border-color); background: var(--card-background); z-index: 2;}
.yuemu-modal-top h3 { margin: 0; font-size: 17px; font-weight: 600; color: var(--text-primary); }
.yuemu-close-btn { background: var(--hover-background); border: none; width: 30px; height: 30px; border-radius: 50%; color: var(--text-secondary); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s;}
.yuemu-close-btn:hover { background: var(--border-color); color: var(--text-primary); transform: rotate(90deg);}

/* 通用列表和搜索 */
.yuemu-modal-search { padding: 12px 24px; position: relative; border-bottom: 0.5px solid var(--border-color); }
.yuemu-modal-search i { position: absolute; left: 36px; top: 50%; transform: translateY(-50%); color: var(--text-secondary); font-size: 14px; }
.yuemu-modal-search input { width: 100%; background: var(--hover-background); border: none; padding: 10px 16px 10px 36px; border-radius: 12px; font-size: 15px; color: var(--text-primary); outline: none; }
.yuemu-modal-scroll-area { padding: 16px 24px; overflow-y: auto; flex: 1; min-height: 200px; }

.yuemu-selection-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.yuemu-selection-card { background: var(--hover-background); padding: 12px 4px; border-radius: 12px; font-size: 14px; text-align: center; cursor: pointer; border: 1px solid transparent; color: var(--text-secondary); transition: 0.2s; position: relative; }
.yuemu-selection-card.active { border-color: #007AFF; color: #007AFF; background: rgba(0, 122, 255, 0.08); font-weight: 600; }
.yuemu-check-mark { position: absolute; right: -4px; top: -4px; color: #007AFF; font-size: 18px; background: var(--card-background); border-radius: 50%; }

/* ====================================
   ★ 移动端深度适配 (精细紧凑的 iOS 风格)
   ==================================== */
@media (max-width: 768px) {
  .yuemu-mobile-only { display: block; }
  .yuemu-mobile-hide { display: none; }

  /* 移动端标签一行三个与分类保持一致 */
  .yuemu-selection-chips { 
    display: grid !important; 
    grid-template-columns: repeat(3, 1fr) !important; 
    gap: 12px 8px !important; 
  }
  .yuemu-chip { 
    text-align: center; 
    padding: 10px 4px !important; 
    white-space: nowrap; 
    overflow: hidden; 
    text-overflow: ellipsis; 
  }

  .yuemu-publish-scroll-container { padding: 0; background: var(--background); }
  .yuemu-publish-content-grid { gap: 0; }
  .yuemu-main-workspace { grid-template-columns: 1fr; gap: 0; }

  .yuemu-publish-header {
    padding-left: 12px; padding-right: 12px; border-bottom: none;
    height: 44px; /* iOS 标准高度 */
    background: var(--card-background);
    display: flex !important;
    flex-direction: row !important;
    justify-content: space-between !important;
    align-items: center !important;
    width: 100% !important;
  }

  .yuemu-mobile-title-inline {
    display: inline-block !important;
    margin-left: 8px;
    font-size: 15px !important;
    font-weight: 700 !important;
    color: var(--text-primary);
  }

  .yuemu-mobile-hide-icon {
    display: none !important;
  }

  .yuemu-header-right {
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
    z-index: 2;
  }

  .yuemu-header-title { font-size: 16px; }
  .yuemu-pc-actions { display: none; }
  .yuemu-back-btn { font-size: 22px; width: 32px; height: 32px;}

  /* 移动端极简黑白灰胶囊按钮适配 */
  .yuemu-draft-inbox-btn, .yuemu-preview-header-btn {
    background: var(--hover-background) !important;
    border: 1px solid var(--border-color) !important;
    padding: 5px 12px !important;
    font-size: 13px !important;
    font-weight: 600 !important;
    color: var(--text-primary) !important;
    height: auto !important;
    border-radius: 16px !important;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02) !important;
    transform: none !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 0 !important;
    transition: all 0.2s ease !important;
  }
  .yuemu-draft-inbox-btn:active, .yuemu-preview-header-btn:active {
    background: var(--border-color) !important;
    opacity: 0.85;
  }

  .yuemu-mobile-footer {
    display: flex;
    padding: 8px 16px calc(8px + env(safe-area-inset-bottom, 0px));
    background: var(--card-background);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border-top: 0.5px solid var(--border-color);
    gap: 12px; flex-shrink: 0; position: relative; z-index: 20;
  }
  .yuemu-footer-btn { height: 44px; border-radius: 22px; font-size: 15px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer; border: none; }
  .yuemu-mobile-footer .yuemu-draft-btn { flex: 1; max-width: 110px; background: var(--hover-background); color: var(--text-primary); }
  .yuemu-mobile-footer .yuemu-publish-btn { flex: 2; background: #007AFF; color: #fff; }

  .yuemu-space-info-banner {
    border-radius: 0;
    padding: 12px 16px;
    border: none;
    border-bottom: 0.5px solid var(--border-color);
    box-shadow: none;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .yuemu-space-banner-left {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .yuemu-space-avatar {
    width: 44px;
    height: 44px;
    flex-shrink: 0;
  }

  .yuemu-space-meta {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .yuemu-space-name {
    font-size: 15px;
    margin: 0;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .yuemu-space-desc {
    font-size: 12px;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
  }

  .yuemu-space-stats {
    flex-shrink: 0;
    display: flex;
    justify-content: flex-end;
  }

  .yuemu-stat-badge {
    font-size: 12px;
    padding: 4px 10px;
    white-space: nowrap;
  }

  .yuemu-visual-section { background: var(--background); }
  /* 紧凑的上传区域 */
  .yuemu-unified-upload-card.yuemu-empty-state-card { padding: 24px 16px; min-height: 280px; border-radius: 0; border-left: none; border-right: none; border-top: none;}
  .yuemu-upload-mode-toggle { margin-bottom: 24px;}

  .yuemu-preview-card { border-radius: 0; box-shadow: none; border-bottom: 0.5px solid var(--border-color); }
  .yuemu-image-stage { height: auto; max-height: 60vh; min-height: 240px; background: #000;} /* 图片区域纯黑，更具沉浸感 */
  .yuemu-stage-blur-bg { display: none; } /* 移动端去掉高斯背景，省空间且干净 */
  .yuemu-preview-img { max-width: 100%; max-height: 60vh; border-radius: 0; box-shadow: none; object-fit: contain;}
  .yuemu-glass-toolbar { width: auto; min-width: 200px; justify-content: space-around; bottom: 16px; opacity: 1; padding: 6px 16px; border-radius: 30px;}

  /* 紧凑的表单区域 (iOS Settings Style) */
  .yuemu-form-section { background: var(--background); padding: 4px; display: flex; flex-direction: column; gap: 16px;}
  .yuemu-form-card { border-radius: 12px; padding: 0; box-shadow: none; border: none; background: var(--card-background); overflow: hidden;}

  .yuemu-immersive-inputs { padding: 16px 16px 12px; gap: 8px; border-bottom: none;}
  .yuemu-title-input { font-size: 18px; padding: 0;}
  .yuemu-input-divider { margin: 8px 0;}
  .yuemu-desc-input { font-size: 15px; padding: 0;}

  .yuemu-smart-ai-panel { padding: 16px; border-radius: 12px; border: none; margin: 0;}

  /* 分组列表极致紧凑 */
  .yuemu-settings-group { border-radius: 12px; overflow: hidden;}
  .yuemu-setting-row { padding: 12px 16px; min-height: 50px;}
  .yuemu-setting-row:first-child { border-radius: 0; }
  .yuemu-setting-row:last-child { border-radius: 0; }

  /* iOS Bottom Sheet 动画 */
  .yuemu-fade-modal-enter-active .yuemu-glass-modal { animation: slideUpSheet 0.4s cubic-bezier(0.32, 0.72, 0, 1); }
  .yuemu-fade-modal-leave-active .yuemu-glass-modal { animation: slideDownSheet 0.3s cubic-bezier(0.32, 0.72, 0, 1) forwards; }
  @keyframes slideUpSheet { from { transform: translateY(100%); } to { transform: translateY(0); } }
  @keyframes slideDownSheet { from { transform: translateY(0); } to { transform: translateY(100%); } }

  .yuemu-glass-modal-mask { align-items: flex-end; }
  .yuemu-glass-modal { width: 100%; max-width: 100%; border-radius: 20px 20px 0 0; max-height: 85vh; padding-top: 8px; padding-bottom: env(safe-area-inset-bottom, 0px); border: none;}
  .yuemu-modal-drag-handle { width: 36px; height: 4px; background: var(--border-color); border-radius: 2px; margin: 4px auto 8px auto; }
  .yuemu-modal-top { padding: 10px 20px 16px; border-bottom: none; }
  .yuemu-modal-top h3 { font-size: 16px; text-align: center; width: 100%; position: absolute; left: 0; pointer-events: none; }
  .yuemu-close-btn { position: relative; z-index: 2; margin-left: auto; background: var(--hover-background); width: 28px; height: 28px; border-radius: 14px;}

  .yuemu-draft-glass-delete { opacity: 1; transform: scale(1); }
}

/* ====================================
   ★ 暗黑模式极致深度适配 (Dark Mode)
   ==================================== */
[data-theme='dark'] .yuemu-modern-publish-page {
  background-color: #000000; /* 极致黑底 */
}
[data-theme='dark'] .yuemu-publish-scroll-container,
[data-theme='dark'] .yuemu-visual-section,
[data-theme='dark'] .yuemu-form-section {
  background-color: #000000;
}

[data-theme='dark'] .yuemu-form-card,
[data-theme='dark'] .yuemu-space-info-banner,
[data-theme='dark'] .yuemu-publish-header,
[data-theme='dark'] .yuemu-mobile-footer,
[data-theme='dark'] .yuemu-glass-modal,
[data-theme='dark'] .yuemu-draft-scroll-area,
[data-theme='dark'] .yuemu-center-modal {
  background: #1C1C1E; /* iOS 标准深色卡片背景 */
}

[data-theme='dark'] .yuemu-setting-row:hover { background-color: #2C2C2E; }
[data-theme='dark'] .yuemu-border-color,
[data-theme='dark'] .yuemu-input-divider,
[data-theme='dark'] .yuemu-setting-divider,
[data-theme='dark'] .yuemu-modal-top,
[data-theme='dark'] .yuemu-modal-search,
[data-theme='dark'] .yuemu-tag-creator,
[data-theme='dark'] .yuemu-active-tags-area {
  border-color: rgba(255, 255, 255, 0.1) !important;
  background-color: rgba(255, 255, 255, 0.1) !important;
}
[data-theme='dark'] .yuemu-tag-search { background-color: transparent !important; }

[data-theme='dark'] .yuemu-smart-ai-panel,
[data-theme='dark'] .yuemu-unified-upload-card.yuemu-empty-state-card {
  background: #1C1C1E;
  border-color: rgba(255, 255, 255, 0.1);
}

[data-theme='dark'] .yuemu-modern-input,
[data-theme='dark'] .yuemu-setting-value,
[data-theme='dark'] .yuemu-setting-label {
  color: #FFFFFF;
}
[data-theme='dark'] .yuemu-modern-input::placeholder,
[data-theme='dark'] .yuemu-setting-value.placeholder {
  color: #EBEBF5;
  opacity: 0.6;
}

[data-theme='dark'] .yuemu-close-btn,
[data-theme='dark'] .yuemu-draft-inbox-btn,
[data-theme='dark'] .yuemu-back-btn:hover {
  background: #2C2C2E;
  color: #FFFFFF;
}

[data-theme='dark'] .yuemu-xhs-draft-card {
  background: #1C1C1E;
  border-color: rgba(255, 255, 255, 0.1);
}
[data-theme='dark'] .yuemu-draft-cover-wrap {
  background: #000000;
}
[data-theme='dark'] .yuemu-selection-card,
[data-theme='dark'] .yuemu-chip,
[data-theme='dark'] .yuemu-tag-creator input {
  background: #2C2C2E;
  color: #EBEBF5;
}
[data-theme='dark'] .yuemu-modal-search input {
  background: #2C2C2E;
  color: #FFF;
}
[data-theme='dark'] .yuemu-modal-btn.yuemu-outline {
  background: rgba(255, 255, 255, 0.1);
  color: #FFF;
  color: #FFF;
}

/* AI Write Action & Button */
.yuemu-desc-wrapper {
  position: relative;
  width: 100%;
}

.yuemu-desc-input {
  padding-bottom: 40px !important; /* 给右下角的 AI 按钮留出空间 */
}

.yuemu-input-disabled {
  opacity: 0.6;
  pointer-events: none;
}

.yuemu-ai-floating-btn {
  position: absolute;
  right: 0px;
  bottom: 0px;
  z-index: 10;
  pointer-events: auto;
}

.yuemu-ai-write-btn {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%);
  color: #8b5cf6;
  border: 1px solid rgba(139, 92, 246, 0.2);
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.05);
  backdrop-filter: blur(4px);
}

.yuemu-ai-write-btn i {
  font-size: 0.9rem;
}

.yuemu-ai-write-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%);
  border-color: rgba(139, 92, 246, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);
}

.yuemu-ai-write-btn:active:not(:disabled) {
  transform: translateY(0);
}

.yuemu-ai-write-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  filter: grayscale(1);
}
</style>
