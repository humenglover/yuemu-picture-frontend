<template>
  <div class="yuemu-contest-page">
    <div class="yuemu-toast" :class="{ 'show': toast.visible, 'error': toast.isError }">
      {{ toast.text }}
    </div>

    <header class="yuemu-contest-hero">
      <div class="yuemu-hero-bg" v-if="loading">
        <div class="yuemu-skeleton-anim" style="width: 100%; height: 100%;"></div>
      </div>
      <div class="yuemu-hero-bg" v-else-if="activity.coverUrl">
        <img
          :src="activity.coverUrl"
          :alt="t('pages.activityDetailPage.coverAlt')"
          :class="{ 'cover-loaded': coverImageLoaded }"
          @load="coverImageLoaded = true"
          @error="coverImageLoaded = true"
        />
      </div>
      <div class="yuemu-hero-bg fallback" v-else></div>

      <div class="yuemu-hero-overlay"></div>

      <div class="yuemu-hero-wrapper">
        <div class="yuemu-hero-content">
          <h1 class="yuemu-contest-title" style="margin-top: 16px;">
            <div v-if="loading" class="yuemu-skeleton-anim" style="width: 70%; height: 38px; border-radius: 8px; margin-bottom: 8px;"></div>
            <div v-if="loading" class="yuemu-skeleton-anim" style="width: 40%; height: 38px; border-radius: 8px;"></div>
            <span v-else>{{ activity.title }}</span>
          </h1>

          <div class="yuemu-meta-bottom">
            <div class="yuemu-author-info" v-if="loading">
              <div class="yuemu-skeleton-anim" style="width: 32px; height: 32px; border-radius: 50%;"></div>
              <div class="yuemu-skeleton-anim" style="width: 120px; height: 18px; border-radius: 4px;"></div>
            </div>
            <div class="yuemu-author-info" v-else @click="goToUserProfile(activity.user)">
              <img
                :src="activity.user?.userAvatar || getDefaultAvatar(activity.user?.userName)"
                :class="{ 'avatar-loaded': authorAvatarLoaded }"
                @load="authorAvatarLoaded = true"
                @error="authorAvatarLoaded = true"
              />
              <span class="yuemu-author-name">
                {{ t('pages.activityDetailPage.hostPrefix') }}{{ activity.user?.userName }}
                <span style="opacity: 0.5; margin: 0 8px;">|</span>
                <i class="fas fa-fire" style="margin-right: 4px; color: rgba(255,255,255,0.9);"></i>{{ activity.viewCount || 0 }}{{ t('pages.activityDetailPage.hotness') }}
              </span>
            </div>
            <button class="yuemu-btn-icon-blur" @click="handleShare" :title="t('pages.activityDetailPage.shareActivity')" v-if="!loading">
              <i class="fas fa-share"></i>
            </button>
          </div>
        </div>
      </div>
    </header>

    <div class="yuemu-tabs-container">
      <div class="yuemu-tabs-inner">
        <div class="yuemu-tabs-nav">
          <div class="yuemu-tab-item" :class="{ active: activeTab === 'content' }" @click="activeTab = 'content'">
            {{ t('pages.activityDetailPage.tabIntro') }}
          </div>
          <div class="yuemu-tab-item" v-if="activity.allowSubmission === 1 || activity.allowVote === 1"
               :class="{ active: activeTab === 'submissions' }" @click="switchToSubmissions">
            {{ t('pages.activityDetailPage.tabWorks') }} <span class="yuemu-badge-count" v-if="submissionTotal > 0">{{ submissionTotal }}</span>
          </div>
        </div>
        <div class="yuemu-tabs-action" v-if="activity.allowSubmission == 1 && !isExpired(activity.submissionEndTime)">
          <button class="yuemu-btn-pill primary" @click="showSubmitModal = true">
            <i class="fas fa-plus"></i> {{ t('pages.activityDetailPage.btnSubmit') }}
          </button>
        </div>
      </div>
    </div>

    <main class="yuemu-content-section" v-show="activeTab === 'content'">
      <div v-if="loading" class="yuemu-skeleton-block">
        <div class="yuemu-skeleton-anim" style="width: 100%; height: 200px; border-radius: 12px; margin-bottom: 20px;"></div>
        <div class="yuemu-skeleton-anim" style="width: 100%; height: 24px; border-radius: 4px; margin-bottom: 12px;"></div>
        <div class="yuemu-skeleton-anim" style="width: 80%; height: 24px; border-radius: 4px; margin-bottom: 12px;"></div>
        <div class="yuemu-skeleton-anim" style="width: 90%; height: 24px; border-radius: 4px;"></div>
      </div>
      <div v-else class="yuemu-rich-text-wrapper">
        <Html-content :content="activity.content" />
      </div>
    </main>

    <main class="yuemu-gallery-section" v-show="activeTab === 'submissions'">

      <div class="yuemu-gallery-tools">
        <div class="yuemu-sort-pills">
          <button :class="{ active: sortField === 'createTime' }" @click="changeSort('createTime')">{{ t('pages.activityDetailPage.sortLatest') }}</button>
          <button :class="{ active: sortField === 'voteCount' }" @click="changeSort('voteCount')">{{ t('pages.activityDetailPage.sortHottest') }}</button>
        </div>

        <div class="yuemu-vote-controls" v-if="activity.allowVote === 1 && !isExpired(activity.voteEndTime)">
          <div class="yuemu-vote-status" v-if="activity.voteType === 1">
            {{ t('pages.activityDetailPage.remainingVotes') }}<span>{{ activity.remainingVotes || 0 }}</span>
          </div>
          <div class="yuemu-batch-actions" v-if="activity.voteType === 1 && activity.remainingVotes > 0">
            <button class="yuemu-btn-pill outline" :class="{ active: isVotingMode }" @click="toggleVotingMode">
              {{ isVotingMode ? t('pages.activityDetailPage.btnCancelSelect') : t('pages.activityDetailPage.btnBatchVote') }}
            </button>
            <button
              v-if="isVotingMode && selectedSubmissions.size > 0"
              class="yuemu-btn-pill success"
              @click="handleBatchVote"
              :disabled="selectedSubmissions.size > activity.remainingVotes"
            >
              {{ t('pages.activityDetailPage.btnVoteCount', { count: selectedSubmissions.size }) }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="loadingSubmissions && submissionPage === 1" class="yuemu-masonry-layout">
        <div class="yuemu-masonry-item yuemu-card skeleton-card" v-for="i in 6" :key="'skel-' + i">
          <div class="yuemu-img-wrapper yuemu-skeleton-wrapper">
            <div class="yuemu-skeleton-anim yuemu-skeleton-img" :style="{ paddingBottom: (Math.floor(Math.random() * 40) + 100) + '%' }"></div>
          </div>
          <div class="yuemu-item-content">
            <div class="yuemu-skeleton-anim" style="width: 80%; height: 16px; border-radius: 4px; margin-bottom: 12px;"></div>
            <div class="yuemu-item-footer" style="justify-content: flex-start; gap: 8px;">
              <div class="yuemu-skeleton-anim" style="width: 20px; height: 20px; border-radius: 50%;"></div>
              <div class="yuemu-skeleton-anim" style="width: 60px; height: 14px; border-radius: 4px;"></div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="submissions.length === 0 && !loadingSubmissions" class="yuemu-empty-state">
        <i class="fas fa-camera-retro"></i>
        <p>{{ t('pages.activityDetailPage.emptyWorks') }}</p>
      </div>

      <div class="yuemu-masonry-layout" v-else-if="submissions.length > 0">
        <div class="yuemu-masonry-item yuemu-card" v-for="item in submissions" :key="item.id"
             :class="{ 'is-selected': selectedSubmissions.has(item.id), 'voting-active': isVotingMode }">

          <div class="yuemu-img-wrapper" @click="handleImageClick(item)"
               :style="item.picture?.picWidth && item.picture?.picHeight ? { aspectRatio: `${item.picture.picWidth} / ${item.picture.picHeight}` } : {}">
            <div class="yuemu-thumb-placeholder yuemu-skeleton-anim" v-show="!item._imgLoaded"></div>
            <img
              :src="item.picture?.url"
              :alt="item.submissionTitle"
              loading="lazy"
              class="yuemu-real-img"
              :class="{ 'is-loaded': item._imgLoaded }"
              @load="item._imgLoaded = true"
              @error="item._imgLoaded = true"
            />

            <div class="yuemu-selection-indicator" v-if="isVotingMode">
              <div class="yuemu-check-circle" :class="{ 'checked': selectedSubmissions.has(item.id) }">
                <i class="fas fa-check" v-if="selectedSubmissions.has(item.id)"></i>
              </div>
            </div>
          </div>

          <div class="yuemu-item-content" @click="isVotingMode ? handleImageClick(item) : null">
            <div class="yuemu-item-title">{{ item.submissionTitle || item.picture?.name || t('pages.activityDetailPage.noTitle') }}</div>

            <div class="yuemu-item-footer">
              <div class="yuemu-item-author" @click.stop="goToUserProfile(item.user)">
                <img
                  :src="item.user?.userAvatar || getDefaultAvatar(item.user?.userName)"
                  class="yuemu-author-avatar"
                  :class="{ 'avatar-loaded': item._avatarLoaded }"
                  @load="item._avatarLoaded = true"
                  @error="item._avatarLoaded = true"
                />
                <span class="yuemu-author-name">{{ item.user?.userName }}</span>
              </div>

              <button
                v-if="activity.allowVote === 1 && !isExpired(activity.voteEndTime) && !isVotingMode"
                class="yuemu-like-btn"
                :class="{ 'liked': item.hasVoted }"
                :disabled="item.voting || (activity.voteType === 0 && activity.userVoteCount > 0 && !item.hasVoted)"
                @click.stop="handleSingleVote(item)"
              >
                <i :class="item.hasVoted ? 'fas fa-heart' : 'far fa-heart'"></i>
                <span>{{ item.voteCount || 0 }}</span>
              </button>
              <div class="yuemu-like-display" v-else-if="activity.allowVote === 1">
                <i class="fas fa-heart"></i>
                <span>{{ item.voteCount || 0 }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div ref="loadMoreTrigger" class="yuemu-infinite-trigger">
        <div v-show="loadingSubmissions && submissionPage > 1" class="yuemu-spinner-box">
          <i class="fas fa-spinner fa-spin"></i> {{ t('pages.activityDetailPage.loadingMore') }}
        </div>
        <div v-show="!hasMoreData && submissions.length > 0" class="yuemu-end-message">
          {{ t('pages.activityDetailPage.noMoreData') }}
        </div>
      </div>
    </main>

    <Teleport to="body">
      <div v-if="previewVisible" class="yuemu-gallery-preview-overlay" @click="closePreview">
        <div class="yuemu-preview-header" @click.stop>
          <div class="yuemu-counter">{{ t('pages.activityDetailPage.pageCount', { index: previewIndex + 1, total: submissions.length }) }}</div>
          <button class="yuemu-nav-close-btn" @click="closePreview">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="yuemu-preview-body" @click.stop>
          <button class="yuemu-nav-arrow yuemu-prev" @click="showPrevImage" v-if="previewIndex > 0">
            <i class="fas fa-chevron-left"></i>
          </button>

          <div class="yuemu-image-track" @touchstart="handleTouchStart" @touchmove="handleTouchMove" @touchend="handleTouchEnd">
            <div class="yuemu-preview-polaroid-frame" :style="{ transform: `translateX(${swipeOffset}px)` }">
              <div class="yuemu-preview-img-box">
                <img :src="submissions[previewIndex]?.picture?.url" loading="eager" />
              </div>

              <div class="yuemu-preview-text-content">
                <h3 class="yuemu-preview-title">{{ submissions[previewIndex]?.submissionTitle || submissions[previewIndex]?.picture?.name || t('pages.activityDetailPage.noTitle') }}</h3>
                <p class="yuemu-preview-description" v-if="submissions[previewIndex]?.submissionDesc">
                  {{ submissions[previewIndex]?.submissionDesc }}
                </p>
                <p class="yuemu-preview-description yuemu-empty-desc" v-else>
                  {{ t('pages.activityDetailPage.emptyDesc') }}
                </p>
              </div>
            </div>
          </div>

          <button class="yuemu-nav-arrow yuemu-next" @click="showNextImage" v-if="previewIndex < submissions.length - 1">
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </Teleport>

    <ShareModal
      ref="shareModalRef"
      :title="activity.title"
      :link="currentUrl"
      :imageUrl="activity.coverUrl"
      :user="activity.user"
      :createTime="activity.createTime"
    />

    <div class="yuemu-modal-overlay" v-if="showSubmitModal" @click.self="closeSubmitModal">
      <div class="yuemu-modal">
        <div class="yuemu-modal-header">
          <h3>{{ t('pages.activityDetailPage.modalTitle') }}</h3>
          <button class="yuemu-close-btn" @click="closeSubmitModal"><i class="fas fa-times"></i></button>
        </div>

        <div class="yuemu-modal-body">
          <div class="yuemu-upload-zone" @click="triggerImageUpload" :class="{ 'has-img': uploadedImageUrl }">
            <template v-if="uploadedImageUrl">
              <img :src="uploadedImageUrl" class="yuemu-preview" />
              <div class="yuemu-replace-mask"><span>{{ t('pages.activityDetailPage.clickToReplace') }}</span></div>
              <button class="yuemu-del-btn" @click.stop="removeUploadedImage"><i class="fas fa-trash"></i></button>
            </template>
            <template v-else>
              <i class="fas fa-cloud-upload-alt yuemu-upload-icon"></i>
              <div class="yuemu-upload-text">{{ t('pages.activityDetailPage.clickToUpload') }}</div>
              <div class="yuemu-upload-hint">{{ t('pages.activityDetailPage.uploadHint') }}</div>
            </template>
            <div class="yuemu-uploading-mask" v-if="imageUploading">
              <i class="fas fa-spinner fa-spin"></i> {{ imageUploadProgress }}%
            </div>
          </div>
          <input type="file" ref="imageFileInput" accept="image/*" @change="handleImageUpload" hidden />

          <div class="yuemu-input-group">
            <input type="text" v-model="formData.submissionTitle" class="yuemu-input" :placeholder="t('pages.activityDetailPage.inputTitlePlaceholder')" maxlength="50" :disabled="aiWriting" :class="{ 'yuemu-input-disabled': aiWriting }" />
          </div>
          <div class="yuemu-input-group" style="position: relative;">
            <textarea v-model="formData.submissionDesc" class="yuemu-textarea" :placeholder="t('pages.activityDetailPage.inputDescPlaceholder')" rows="3" maxlength="200" :disabled="aiWriting" :class="{ 'yuemu-input-disabled': aiWriting }"></textarea>

            <div class="yuemu-ai-floating-btn" v-if="uploadedImageUrl" style="position: absolute; right: 10px; bottom: 10px;">
              <button class="yuemu-btn-pill" style="font-size: 12px; padding: 4px 12px; background: transparent; color: #8b5cf6; border: 1px solid #8b5cf6;" @click="doAiGeneratePictureContent" :disabled="aiWriting">
                <i class="fas fa-wand-magic-sparkles"></i>
                {{ aiWriting ? aiWritingStatus : t('pages.activityDetailPage.btnAiGenerate') }}
              </button>
            </div>
          </div>
        </div>

        <div class="yuemu-modal-footer">
          <button class="yuemu-btn-pill outline" @click="closeSubmitModal">{{ t('pages.activityDetailPage.btnCancel') }}</button>
          <button class="yuemu-btn-pill primary" :disabled="!uploadedPictureId || submitting" @click="handleSubmit">
            {{ submitting ? t('pages.activityDetailPage.btnSubmitting') : t('pages.activityDetailPage.btnConfirmPublish') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { ref, onMounted, onUnmounted, nextTick, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import HtmlContent from '@/components/HtmlContent.vue'
import ShareModal from '@/components/ShareModal.vue'
import { getActivityByIdUsingGet } from '@/api/activityController'
import { getDefaultAvatar } from '@/utils/userUtils'
import { formatTime } from '@/utils/dateUtils'
import { listSubmissionByPageUsingPost, submitToActivityUsingPost } from '@/api/activitySubmissionController'
import { voteUsingPost, cancelVoteUsingDelete } from '@/api/activityVoteController'
import { uploadPostImageUsingPost, aiGenerateImageStreamUsingGet } from '@/api/pictureController'
import { doShareUsingPost } from '@/api/shareRecordController'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const loading = ref(true)
const activity = ref<any>({})
const activeTab = ref('content')
const coverImageLoaded = ref(false)
const authorAvatarLoaded = ref(false)

// Toast 控制
const toast = ref({ visible: false, text: '', isError: false })
let toastTimer: any = null
const showToast = (text: string, isError = false) => {
  toast.value = { visible: true, text, isError }
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value.visible = false }, 2500)
}

const submissions = ref<any[]>([])
const loadingSubmissions = ref(false)
const sortField = ref('createTime')
const submissionPage = ref(1)
const submissionTotal = ref(0)
const hasMoreData = ref(true)

// 图片预览状态
const previewVisible = ref(false)
const previewIndex = ref(0)
const swipeOffset = ref(0)
const touchStartX = ref(0)
const isSwiping = ref(false)

const closePreview = () => {
  previewVisible.value = false
  swipeOffset.value = 0
  document.body.style.overflow = ''
}

const openPreview = (item: any) => {
  const idx = submissions.value.findIndex(s => s.id === item.id)
  previewIndex.value = idx >= 0 ? idx : 0
  previewVisible.value = true
  document.body.style.overflow = 'hidden'
}

const showPrevImage = () => {
  if (previewIndex.value > 0) previewIndex.value--
}

const showNextImage = () => {
  if (previewIndex.value < submissions.value.length - 1) previewIndex.value++
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

  if ((previewIndex.value === 0 && diff > 0) || (previewIndex.value === submissions.value.length - 1 && diff < 0)) {
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
    if (swipeOffset.value > 0 && previewIndex.value > 0) {
      swipeOffset.value = targetOffset
      setTimeout(() => {
        showPrevImage()
        nextTick(() => { swipeOffset.value = 0 })
      }, 50)
    } else if (swipeOffset.value < 0 && previewIndex.value < submissions.value.length - 1) {
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

const loadMoreTrigger = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

const selectedSubmissions = ref<Set<number>>(new Set())
const isVotingMode = ref(false)

const currentUrl = computed(() => typeof window !== 'undefined' ? window.location.href : '')

const showSubmitModal = ref(false)

watch(showSubmitModal, (newVal) => {
  if (newVal) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

const submitting = ref(false)
const formData = ref({ activityId: 0, pictureId: undefined as number | undefined, submissionTitle: '', submissionDesc: '' })
const shareModalRef = ref<InstanceType<typeof ShareModal>>()
const imageFileInput = ref<HTMLInputElement>()
const imageUploading = ref(false)
const imageUploadProgress = ref(0)
const uploadedImageUrl = ref('')
const uploadedPictureId = ref<number | undefined>()

const aiWriting = ref(false)
const aiWritingStatus = ref(t('pages.activityDetailPage.statusAnalyzing'))

const getActivityDetail = async () => {
  loading.value = true
  const id = route.params.id as string
  if (!id) { showToast(t('pages.activityDetailPage.toastActivityIdEmpty'), true); return router.back() }

  try {
    const res = await getActivityByIdUsingGet({ id: id as any })
    if (res.data?.data) {
      activity.value = res.data.data
      formData.value.activityId = activity.value.id as number
      loading.value = false
      // Reset image loading states
      coverImageLoaded.value = false
      authorAvatarLoaded.value = false
    } else {
      showToast(t('pages.activityDetailPage.toastActivityNotFound'), true); router.back()
    }
  } catch (error) {
    showToast(t('pages.activityDetailPage.toastActivityFetchFail'), true); router.back()
  }
}

const goToUserProfile = (user: any) => {
  if (!user?.id) return
  router.push({
    path: `/user/${user.id}`,
    query: { userName: user.userName, userAvatar: user.userAvatar, userAccount: user.userAccount, userProfile: user.userProfile, userRole: user.userRole, createTime: user.createTime }
  })
}

const switchToSubmissions = () => {
  activeTab.value = 'submissions'
  if (submissions.value.length === 0) loadSubmissions()
}

const changeSort = (field: string) => {
  sortField.value = field
  loadSubmissions()
}

const loadSubmissions = async () => {
  if (!activity.value.id) return
  loadingSubmissions.value = true
  submissionPage.value = 1
  hasMoreData.value = true
  try {
    const res = await listSubmissionByPageUsingPost({
      activityId: activity.value.id, status: 1, current: submissionPage.value,
      pageSize: 15, sortField: sortField.value, sortOrder: 'descend'
    })
    if (res.data?.data) {
      const records = res.data.data.records || []
      // 初始化加载状态
      submissions.value = records.map((r: any) => ({ ...r, _imgLoaded: false, _avatarLoaded: false }))
      submissionTotal.value = res.data.data.total || 0
      hasMoreData.value = submissions.value.length < submissionTotal.value
    }
  } catch (error) { showToast(t('pages.activityDetailPage.toastWorksFetchFail'), true) }
  finally { loadingSubmissions.value = false }
}

const loadMoreSubmissions = async () => {
  if (!activity.value.id || loadingSubmissions.value || !hasMoreData.value) return
  submissionPage.value++
  loadingSubmissions.value = true
  try {
    const res = await listSubmissionByPageUsingPost({
      activityId: activity.value.id, status: 1, current: submissionPage.value,
      pageSize: 15, sortField: sortField.value, sortOrder: 'descend'
    })
    if (res.data?.data?.records) {
      const records = res.data.data.records.map((r: any) => ({ ...r, _imgLoaded: false, _avatarLoaded: false }))
      submissions.value.push(...records)
      hasMoreData.value = submissions.value.length < (res.data.data.total || 0)
    }
  } catch (error) { showToast(t('pages.activityDetailPage.toastLoadFail'), true) }
  finally { loadingSubmissions.value = false }
}

const setupIntersectionObserver = () => {
  observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && activeTab.value === 'submissions' && !loadingSubmissions.value && hasMoreData.value && submissions.value.length > 0) {
      loadMoreSubmissions()
    }
  }, { rootMargin: '200px' })

  if (loadMoreTrigger.value) observer.observe(loadMoreTrigger.value)
}

const toggleVotingMode = () => {
  isVotingMode.value = !isVotingMode.value
  if (!isVotingMode.value) selectedSubmissions.value.clear()
}

const handleImageClick = (item: any) => {
  if (isVotingMode.value) {
    if (selectedSubmissions.value.has(item.id)) selectedSubmissions.value.delete(item.id)
    else {
      if (selectedSubmissions.value.size >= (activity.value.remainingVotes || 0)) return showToast(t('pages.activityDetailPage.toastSelectLimit', { count: activity.value.remainingVotes }), true)
      selectedSubmissions.value.add(item.id)
    }
  } else {
    openPreview(item)
  }
}

const handleSingleVote = async (item: any) => { await handleVote(item) }

const handleVote = async (item: any) => {
  if (!activity.value.id || item.voting) return
  item.voting = true
  try {
    if (item.hasVoted) {
      const res = await cancelVoteUsingDelete({ activityId: activity.value.id, submissionId: item.id })
      if (res.data.code === 0) {
        item.hasVoted = false; item.voteCount = (item.voteCount || 1) - 1
        if (activity.value.userVoteCount > 0) activity.value.userVoteCount--
        if (activity.value.remainingVotes !== undefined) activity.value.remainingVotes++
      }
    } else {
      const res = await voteUsingPost({ activityId: activity.value.id, submissionIds: [item.id] })
      if (res.data.code === 0) {
        item.hasVoted = true; item.voteCount = (item.voteCount || 0) + 1
        activity.value.userVoteCount = (activity.value.userVoteCount || 0) + 1
        if (activity.value.remainingVotes !== undefined && activity.value.remainingVotes > 0) activity.value.remainingVotes--
      }
    }
  } catch (error: any) { showToast(t('pages.activityDetailPage.toastActionFail'), true) }
  finally { item.voting = false }
}

const handleBatchVote = async () => {
  if (selectedSubmissions.value.size === 0) return
  const submissionIds = Array.from(selectedSubmissions.value)
  try {
    const res = await voteUsingPost({ activityId: activity.value.id, submissionIds })
    if (res.data.code === 0) {
      submissions.value.forEach(item => {
        if (selectedSubmissions.value.has(item.id)) { item.hasVoted = true; item.voteCount = (item.voteCount || 0) + 1 }
      })
      activity.value.userVoteCount = (activity.value.userVoteCount || 0) + submissionIds.length
      activity.value.remainingVotes = Math.max(0, (activity.value.remainingVotes || 0) - submissionIds.length)
      showToast(t('pages.activityDetailPage.toastVoteSuccess', { count: submissionIds.length }))
      isVotingMode.value = false; selectedSubmissions.value.clear()
    } else showToast(res.data.message || t('pages.activityDetailPage.toastVoteFail'), true)
  } catch (error: any) { showToast(error.message || t('pages.activityDetailPage.toastVoteFail'), true) }
}

const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve) => {
    const reader = new FileReader(); reader.readAsDataURL(file)
    reader.onload = (e) => {
      const img = new Image(); img.src = e.target?.result as string
      img.onload = () => {
        let { width, height } = img
        if (width > 1920 || height > 1080) { const ratio = Math.min(1920 / width, 1080 / height); width *= ratio; height *= ratio }
        const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height
        canvas.getContext('2d')?.drawImage(img, 0, 0, width, height)
        canvas.toBlob((blob) => { resolve(blob ? new File([blob], file.name.replace(/\.[^/.]+$/, '.webp'), { type: 'image/webp' }) : file) }, 'image/webp', 0.8)
      }
    }
  })
}

const triggerImageUpload = () => imageFileInput.value?.click()
const handleImageUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement; const file = target.files?.[0]
  if (!file) return
  try {
    imageUploading.value = true; imageUploadProgress.value = 10
    if (file.size > 10 * 1024 * 1024) throw new Error(t('pages.activityDetailPage.toastUploadLimit'))
    const compressedFile = await compressImage(file); imageUploadProgress.value = 40
    const res = await uploadPostImageUsingPost({}, { headers: { 'Content-Type': 'multipart/form-data' } }, compressedFile)
    imageUploadProgress.value = 90
    if (res.data.code === 0 && res.data.data) { uploadedImageUrl.value = res.data.data.url; uploadedPictureId.value = res.data.data.id; imageUploadProgress.value = 100 }
    else throw new Error(res.data.message)
  } catch (error: any) { showToast(error.message || t('pages.activityDetailPage.toastUploadFail'), true) }
  finally { imageUploading.value = false; imageUploadProgress.value = 0; if (target) target.value = '' }
}
const removeUploadedImage = () => { uploadedImageUrl.value = ''; uploadedPictureId.value = undefined }
const closeSubmitModal = () => { showSubmitModal.value = false; removeUploadedImage(); formData.value.submissionTitle = ''; formData.value.submissionDesc = '' }

const handleSubmit = async () => {
  if (!uploadedPictureId.value) return
  submitting.value = true
  try {
    const res = await submitToActivityUsingPost({ activityId: formData.value.activityId, pictureId: uploadedPictureId.value, submissionTitle: formData.value.submissionTitle, submissionDesc: formData.value.submissionDesc } as any)
    if (res.data.code === 0) { showToast(t('pages.activityDetailPage.toastPublishSuccess')); closeSubmitModal(); loadSubmissions() }
    else showToast(res.data.message || t('pages.activityDetailPage.toastSubmitFail'), true)
  } catch (error: any) { showToast(error.message || t('pages.activityDetailPage.toastSubmitFail'), true) }
  finally { submitting.value = false }
}

const doAiGeneratePictureContent = async () => {
  if (!uploadedImageUrl.value) return
  if (aiWriting.value) return

  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }

  aiWriting.value = true
  aiWritingStatus.value = t('pages.activityDetailPage.aiPreparing')
  formData.value.submissionTitle = ''
  formData.value.submissionDesc = ''

  try {
    let accumulatedText = ''
    let eventBuffer = ''
    let rawContent = ''

    await aiGenerateImageStreamUsingGet(
      { imageUrl: uploadedImageUrl.value },
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
            eventChunk.split('\n').forEach((line: string) => {
              if (line.startsWith('event:')) eventType = line.substring(6).trim()
              else if (line.startsWith('data:')) dataStr = line.substring(5).trim()
            })

            if (dataStr) {
              try {
                const data = JSON.parse(dataStr)
                if (data.isSystem) {
                  showToast(data.text || '', true)
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
                    formData.value.submissionTitle = titleMatch[1].trim()
                    cleanContent = cleanContent.replace(/#TITLE#[^\n<]+(?:[\n\s]|<br\s*\/?>)*/i, '')
                  } else {
                    const firstLineMatch = cleanContent.match(/^([^#\n<]+)(?:[\n\s]|<br\s*\/?>)+/)
                    if (firstLineMatch) {
                      formData.value.submissionTitle = firstLineMatch[1].trim()
                      cleanContent = cleanContent.replace(/^([^#\n<]+)(?:[\n\s]|<br\s*\/?>)+/, '')
                    }
                  }

                  formData.value.submissionDesc = cleanContent.trim()
                } else if (eventType === 'done') {
                  aiWriting.value = false
                } else if (eventType === 'error') {
                  aiWriting.value = false
                  showToast(data.error || t('pages.activityDetailPage.toastAiFail'), true)
                }
              } catch (e) {}
            }
          }
        }
      }
    )
  } catch (error) {
    showToast(t('pages.activityDetailPage.toastAiError'), true)
    aiWriting.value = false
  }
}

const isExpired = (endTime: string | undefined) => endTime ? new Date(endTime) < new Date() : false
const handleShare = async () => { if (!activity.value?.id) return; shareModalRef.value?.openModal(); try { await doShareUsingPost({ targetId: activity.value.id, targetType: 2, isShared: true }) } catch (error) {} }

onMounted(() => {
  getActivityDetail()
  nextTick(() => setupIntersectionObserver())
})

onUnmounted(() => {
  if (observer) observer.disconnect()
  document.body.style.overflow = '' // 清理防止内存泄漏
})
</script>

<style scoped>
/* =========================================================
   现代沉浸式布局，无边距优先 (Mobile First Edge-to-Edge)
   统一使用 yuemu- 前缀
   ========================================================= */

.yuemu-contest-page {
  width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
  background-color: var(--background, #f5f5f5);
  color: var(--text-primary);
  padding-bottom: env(safe-area-inset-bottom, 30px);
  min-height: 100vh!important;
}

/* --- 统一骨架屏动画 --- */
@keyframes yuemuShimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.yuemu-skeleton-anim {
  background: linear-gradient(90deg, var(--hover-background) 25%, var(--border-color) 50%, var(--hover-background) 75%);
  background-size: 400% 100%;
  animation: yuemuShimmer 1.5s infinite ease-in-out;
}
/* 深色模式兼容 */
@media (prefers-color-scheme: dark) { .yuemu-skeleton-anim {
  background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%);
  background-size: 400% 100%;
} }

/* --- 通用组件 --- */
.yuemu-toast {
  position: fixed; top: 40px; left: 50%; transform: translate(-50%, -20px);
  background: var(--text-primary, #333); color: var(--background, #fff);
  padding: 10px 20px; border-radius: 30px; font-size: 14px; font-weight: 500;
  opacity: 0; visibility: hidden; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 10000; box-shadow: 0 4px 16px var(--shadow-color); white-space: nowrap;
}
.yuemu-toast.show { transform: translate(-50%, 0); opacity: 1; visibility: visible; }
.yuemu-toast.error { background: #ef4444; color: #fff; }

.yuemu-badge { padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; backdrop-filter: blur(8px); }
.yuemu-badge.ongoing { background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.4); }
.yuemu-badge.expired { background: rgba(255,255,255,0.1); color: #ccc; border: 1px solid rgba(255,255,255,0.2); }

.yuemu-btn-icon-blur {
  background: rgba(255,255,255,0.15); border: none; width: 36px; height: 36px; border-radius: 50%;
  color: #fff; font-size: 14px; cursor: pointer; backdrop-filter: blur(8px); transition: all 0.2s;
}
.yuemu-btn-icon-blur:hover { background: rgba(255,255,255,0.3); transform: scale(1.05); }

.yuemu-btn-pill {
  border: none; padding: 8px 20px; border-radius: 20px; font-size: 14px; font-weight: 600;
  cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 6px;
}
.yuemu-btn-pill.primary { background: var(--text-primary); color: var(--background); }
.yuemu-btn-pill.primary:disabled { opacity: 0.5; cursor: not-allowed; }
.yuemu-btn-pill.outline { background: transparent; border: 1px solid var(--border-color); color: var(--text-primary); }
.yuemu-btn-pill.outline.active { background: var(--text-primary); color: var(--background); }
.yuemu-btn-pill.success { background: #10b981; color: white; }

.yuemu-tabs-container {
  position: sticky; top: 0; z-index: 100;
  background: var(--header-background, rgba(255,255,255,0.9)); backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-color);
}
.yuemu-tabs-inner { max-width: 1000px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; padding: 0 20px; }
.yuemu-tabs-nav { display: flex; gap: 24px; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
.yuemu-tabs-nav::-webkit-scrollbar { display: none; }
.yuemu-tab-item { padding: 16px 0; font-size: 16px; font-weight: 500; color: var(--text-secondary); cursor: pointer; position: relative; transition: color 0.2s; white-space: nowrap; flex-shrink: 0; }
.yuemu-tab-item.active { color: var(--text-primary); font-weight: 600; }
.yuemu-tab-item.active::after { content: ''; position: absolute; bottom: 0; left: 0; width: 100%; height: 3px; background: var(--text-primary); border-radius: 2px 2px 0 0; }
.yuemu-badge-count { font-size: 11px; background: var(--text-primary); color: var(--background); padding: 2px 6px; border-radius: 10px; margin-left: 4px; vertical-align: top; }

.yuemu-sort-pills { display: flex; background: var(--hover-background); padding: 4px; border-radius: 8px; }
.yuemu-sort-pills button { background: transparent; border: none; padding: 6px 16px; font-size: 13px; font-weight: 500; color: var(--text-secondary); border-radius: 6px; cursor: pointer; transition: 0.2s; }
.yuemu-sort-pills button.active { background: var(--card-background); color: var(--text-primary); box-shadow: 0 1px 4px var(--shadow-color); }

.yuemu-card {
  background: var(--card-background, #fff); border-radius: 12px; overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04); cursor: pointer; transform: translateZ(0);
}

.yuemu-input-group { margin-bottom: 16px; }
.yuemu-input, .yuemu-textarea {
  width: 100%; background: var(--hover-background); border: 1px solid var(--border-color);
  padding: 14px; border-radius: 12px; font-size: 14px; color: var(--text-primary);
  outline: none; font-family: inherit; box-sizing: border-box; transition: 0.2s;
}
.yuemu-input:focus, .yuemu-textarea:focus { border-color: var(--text-primary); }
.yuemu-textarea { resize: vertical; }

.yuemu-modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(6px);
  z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 20px;
}
.yuemu-modal {
  background: var(--card-background); width: 100%; max-width: 480px; border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2); overflow: hidden; animation: yuemuModalPop 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes yuemuModalPop { from { transform: translateY(20px) scale(0.95); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }


/* =========================================================
   专属业务样式
   ========================================================= */
.yuemu-contest-hero {
  position: relative; width: 100%; min-height: 45vh; max-height: 600px;
  display: flex; flex-direction: column; justify-content: flex-end;
  background: #000; overflow: hidden;
}
.yuemu-hero-bg { position: absolute; inset: 0; z-index: 0; }
.yuemu-hero-bg img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transform: scale(1.05);
  transition: opacity 0.6s ease, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}
.yuemu-hero-bg img.cover-loaded {
  opacity: 1;
  transform: scale(1);
}
.yuemu-fallback { background: linear-gradient(135deg, #1f2937, #000); }
.yuemu-hero-overlay { position: absolute; inset: 0; z-index: 1; background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.1) 100%); }

.yuemu-hero-wrapper { position: relative; z-index: 2; max-width: 1000px; margin: 0 auto; width: 100%; }
.yuemu-hero-content { padding: 40px 20px 30px; color: #fff; }
.yuemu-meta-top { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.yuemu-view-count { font-size: 13px; color: rgba(255,255,255,0.7); }

.yuemu-contest-title { font-size: 32px; font-weight: 800; line-height: 1.3; margin: 0 0 20px 0; color: #fff; }
.yuemu-meta-bottom { display: flex; justify-content: space-between; align-items: center; }
.yuemu-author-info { display: flex; align-items: center; gap: 10px; cursor: pointer; transition: opacity 0.2s; }
.yuemu-author-info:hover { opacity: 0.8; }
.yuemu-author-info img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.2);
  object-fit: cover;
  flex-shrink: 0;
  opacity: 0;
  transform: scale(0.8);
  transition: opacity 0.4s ease, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.yuemu-author-info img.avatar-loaded {
  opacity: 1;
  transform: scale(1);
}
.yuemu-author-name { font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.9); }


.yuemu-content-section, .yuemu-gallery-section { max-width: 1000px; margin: 0 auto; padding: 24px 20px; }
.yuemu-gallery-tools { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; margin-bottom: 20px; }
.yuemu-vote-controls { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
.yuemu-vote-status { font-size: 14px; color: var(--text-secondary); }
.yuemu-vote-status span { color: var(--text-primary); font-weight: 600; font-size: 16px; }
.yuemu-batch-actions { display: flex; gap: 8px; }

/* 瀑布流布局 */
.yuemu-masonry-layout { column-count: 3; column-gap: 16px; }
.yuemu-masonry-item { break-inside: avoid; margin-bottom: 16px; position: relative; }
.skeleton-card { pointer-events: none; }

/* 骨架屏图片容器 */
.yuemu-skeleton-wrapper {
  position: relative;
  width: 100%;
  overflow: hidden;
  border-radius: 12px 12px 0 0;
}
.yuemu-skeleton-img {
  width: 100%;
  height: 0;
  /* padding-bottom 通过内联样式动态设置，模拟不同高度 */
}

.yuemu-img-wrapper {
  position: relative;
  width: 100%;
  overflow: hidden;
  border-radius: 12px 12px 0 0;
  background: var(--hover-background);
  min-height: 180px; /* Fallback for items without aspect-ratio */
}

/* 针对 img-wrapper 下真实的 img 释放 100% 宽度，保留占位和淡入 */
.yuemu-img-wrapper > .yuemu-real-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  opacity: 0;
  transform: scale(1.08);
  transition: opacity 0.4s ease, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: opacity, transform;
  position: relative;
  z-index: 2;
}
.yuemu-img-wrapper > .yuemu-real-img.is-loaded {
  opacity: 1;
  transform: scale(1);
}

/* 占位底色在底部 */
.yuemu-thumb-placeholder {
  position: absolute;
  inset: 0;
  z-index: 1;
  border-radius: inherit;
}

/* 多选状态 */
.yuemu-masonry-item.voting-active { transition: transform 0.2s, box-shadow 0.2s; }
.yuemu-masonry-item.is-selected { transform: scale(0.96); box-shadow: 0 0 0 3px #10b981; border-radius: 8px; }
.yuemu-selection-indicator { position: absolute; top: 12px; right: 12px; z-index: 10; }
.yuemu-check-circle { width: 24px; height: 24px; border: 2px solid rgba(255,255,255,0.9); border-radius: 50%; background: rgba(0,0,0,0.3); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; transition: 0.2s; }
.yuemu-check-circle.checked { background: #10b981; border-color: #10b981; }
.yuemu-check-circle i { color: white; font-size: 12px; }

/* 卡片内容区 */
.yuemu-item-content { padding: 12px; }
.yuemu-item-title { font-size: 14px; font-weight: 600; color: var(--text-primary, #333); margin-bottom: 10px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.yuemu-item-footer { display: flex; justify-content: space-between; align-items: center; }
.yuemu-item-author { display: flex; align-items: center; gap: 6px; cursor: pointer; min-width: 0; flex: 1; }
.yuemu-author-avatar {
  width: 20px !important;
  height: 20px !important;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  border: 1px solid var(--border-color);
  opacity: 0;
  transform: scale(0.8);
  transition: opacity 0.4s ease, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.yuemu-author-avatar.avatar-loaded {
  opacity: 1;
  transform: scale(1);
}
.yuemu-author-name { font-size: 12px; color: var(--text-secondary, #666); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; }

.yuemu-like-btn, .yuemu-like-display { background: transparent; border: none; color: var(--text-secondary, #666); display: flex; align-items: center; gap: 4px; font-size: 12px; cursor: pointer; padding: 0; flex-shrink: 0; }
.yuemu-like-btn.liked { color: #ff2442; }
.yuemu-like-btn.liked i { color: #ff2442; }
.yuemu-like-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.yuemu-empty-state { text-align: center; padding: 80px 20px; color: var(--text-secondary); }
.yuemu-empty-state i { font-size: 40px; margin-bottom: 16px; opacity: 0.5; }
.yuemu-empty-state p { font-size: 14px; }
.yuemu-infinite-trigger { height: 40px; display: flex; justify-content: center; align-items: center; margin-top: 10px; }
.yuemu-spinner-box, .yuemu-end-message { font-size: 13px; color: var(--text-secondary); }

/* 弹窗特化样式 */
.yuemu-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid var(--border-color); }
.yuemu-modal-header h3 { margin: 0; font-size: 18px; font-weight: 600; color: var(--text-primary); }
.yuemu-close-btn { background: none; border: none; font-size: 20px; color: var(--text-secondary); cursor: pointer; }
.yuemu-modal-body { padding: 24px; }
.yuemu-upload-zone { border: 1px dashed var(--border-color); background: var(--hover-background); border-radius: 12px; height: 180px; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; cursor: pointer; margin-bottom: 20px; overflow: hidden; transition: 0.2s; }
.yuemu-upload-zone:hover { border-color: var(--text-primary); }
.yuemu-upload-zone.has-img { border-style: solid; }
.yuemu-upload-icon { font-size: 32px; color: var(--text-secondary); margin-bottom: 12px; }
.yuemu-upload-text { font-size: 15px; font-weight: 500; color: var(--text-primary); margin-bottom: 4px; }
.yuemu-upload-hint { font-size: 12px; color: var(--text-secondary); }
.yuemu-preview { width: 100%; height: 100%; object-fit: contain; }
.yuemu-replace-mask { position: absolute; inset: 0; background: rgba(0,0,0,0.5); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 14px; opacity: 0; transition: 0.2s; }
.yuemu-upload-zone:hover .yuemu-replace-mask { opacity: 1; }
.yuemu-del-btn { position: absolute; top: 12px; right: 12px; background: rgba(0,0,0,0.6); color: #fff; border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; z-index: 10; }
.yuemu-uploading-mask { position: absolute; inset: 0; background: rgba(0,0,0,0.7); color: #fff; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 500; }
.yuemu-modal-footer { padding: 16px 24px; display: flex; justify-content: flex-end; gap: 12px; border-top: 1px solid var(--border-color); }



/* ================= 移动端深度适配 ================= */
@media (max-width: 768px) {
  .yuemu-contest-hero { aspect-ratio: auto; min-height: 28vh; border-radius: 0; }
  .yuemu-contest-title { font-size: 26px; }
  .yuemu-gallery-section { padding: 16px 4px; }
  .yuemu-content-section { padding: 20px 16px; }
  .yuemu-gallery-tools { padding: 0 4px; align-items: flex-start; }
  .yuemu-tabs-inner { padding: 0 12px; }

  /* 移动端瀑布流：2列，缝隙适当减小 */
  .yuemu-masonry-layout { column-count: 2; column-gap: 8px; padding: 0; }
  .yuemu-card { margin-bottom: 8px; border-radius: 8px; }

  /* 移动端图片容器最小高度调整 */
  .yuemu-img-wrapper {
    min-height: 140px;
    border-radius: 8px 8px 0 0;
  }

  .yuemu-item-content { padding: 8px; }
  .yuemu-item-title { font-size: 13px; margin-bottom: 6px; }
  .yuemu-author-name { font-size: 11px; }
  .yuemu-like-btn, .yuemu-like-display { font-size: 11px; }

  .yuemu-modal-overlay { padding: 0; align-items: flex-end; }
  .yuemu-modal { 
    height: auto; 
    max-height: 90vh; 
    border-radius: 20px 20px 0 0; 
    display: flex; flex-direction: column; 
    animation: yuemuDrawerSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .yuemu-modal::before {
    content: ''; display: block; width: 40px; height: 4px; 
    background: var(--border-color); border-radius: 2px; 
    margin: 12px auto 0;
  }
  .yuemu-modal-header { padding-top: 12px; border-bottom: none; }
  .yuemu-modal-body { flex: 1; overflow-y: auto; }


}

@keyframes yuemuDrawerSlideUp {
  from { transform: translateY(100%); opacity: 0.5; }
  to { transform: translateY(0); opacity: 1; }
}

/* ================= 沉浸式相册预览 ================= */
.yuemu-gallery-preview-overlay {
  position: fixed; inset: 0; z-index: 2000;
  background: rgba(0,0,0,0.85); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  display: flex; flex-direction: column;
  animation: yuemu-fadeIn 0.3s ease;
}
.yuemu-preview-header {
  height: 80px; display: flex; justify-content: space-between; align-items: center;
  padding: 0 40px;
}
.yuemu-counter { font-size: 15px; color: rgba(255,255,255,0.7); font-weight: 500; font-family: monospace; letter-spacing: 1px;}
.yuemu-nav-close-btn {
  background: rgba(255,255,255,0.1); border: none; color: #fff;
  width: 44px; height: 44px; border-radius: 50%; font-size: 20px;
  display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; backdrop-filter: blur(4px);
}
.yuemu-nav-close-btn:hover { background: rgba(255,255,255,0.25); transform: rotate(90deg); }

.yuemu-preview-body {
  flex: 1; position: relative; display: flex; align-items: center; justify-content: center;
  overflow: hidden; padding-bottom: 40px;
}
.yuemu-image-track {
  width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
  touch-action: pan-y;
}
.yuemu-preview-polaroid-frame {
  background: var(--card-background); padding: 24px 24px 40px 24px;
  border-radius: 16px; box-shadow: 0 24px 60px rgba(0,0,0,0.4);
  max-width: 90vw; max-height: 90vh; display: flex; flex-direction: column;
  transform-origin: center; transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
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
.yuemu-preview-title {
  margin: 0; font-size: 18px; font-weight: 600; color: var(--text-primary);
}
.yuemu-preview-description {
  font-size: 16px; font-weight: 500;
  color: var(--text-primary); margin: 0;
  line-height: 1.6; white-space: pre-wrap;
  max-width: 600px;
}
.yuemu-empty-desc { opacity: 0.4; font-size: 14px;}

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

@media (max-width: 768px) {
  .yuemu-nav-arrow { display: none; }
  .yuemu-preview-header { padding: 0 16px; height: 60px; }
  .yuemu-preview-polaroid-frame { padding: 16px 16px 32px 16px; max-width: 95vw; border-radius: 12px;}
  .yuemu-preview-img-box img { max-height: calc(85vh - 120px); }
  .yuemu-preview-description { font-size: 15px; }
}

@keyframes yuemu-fadeIn { from { opacity: 0; } to { opacity: 1; } }
</style>
