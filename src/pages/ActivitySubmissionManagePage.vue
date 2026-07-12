<template>
  <div class="yuemu-modern-review-dashboard">

    <div class="yuemu-modern-toast" :class="{ 'yuemu-show': toast.visible, 'yuemu-error': toast.isError }">
      <i class="fas" :class="toast.isError ? 'fa-exclamation-circle' : 'fa-check-circle'"></i>
      <span>{{ toast.text }}</span>
    </div>

    <header class="yuemu-glass-header">
      <div class="yuemu-header-content">
        <button class="yuemu-icon-back-btn" @click="$router.back()">
          <i class="fas fa-arrow-left"></i>
        </button>
        <div class="yuemu-title-group">
          <h1 class="yuemu-page-title">{{ t('pages.activitySubmissionManagePage.pageTitle') }}</h1>
          <div class="yuemu-activity-meta" v-if="currentActivity">
            <span class="yuemu-activity-name">{{ currentActivity.title }}</span>
            <div class="yuemu-tags">
              <span class="yuemu-mini-tag yuemu-green" v-if="currentActivity.allowSubmission === 1">{{ t('pages.activitySubmissionManagePage.tagSubmittable') }}</span>
              <span class="yuemu-mini-tag yuemu-blue" v-if="currentActivity.allowVote === 1">{{ t('pages.activitySubmissionManagePage.tagVotable') }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="yuemu-ios-segmented-control">
        <button
          class="yuemu-seg-btn"
          :class="{ 'yuemu-active': queryParams.status === '0' }"
          @click="handleTabChange('0')"
        >
          {{ t('pages.activitySubmissionManagePage.tabPending') }}
        </button>
        <button
          class="yuemu-seg-btn"
          :class="{ 'yuemu-active': queryParams.status === '1' }"
          @click="handleTabChange('1')"
        >
          {{ t('pages.activitySubmissionManagePage.tabApproved') }}
        </button>
        <button
          class="yuemu-seg-btn"
          :class="{ 'yuemu-active': queryParams.status === '2' }"
          @click="handleTabChange('2')"
        >
          {{ t('pages.activitySubmissionManagePage.tabRejected') }}
        </button>
      </div>
    </header>

    <main class="yuemu-dashboard-body">
      <div v-if="loading && submissions.length === 0" class="yuemu-loading-state">
        <i class="fas fa-circle-notch fa-spin"></i> {{ t('pages.activitySubmissionManagePage.loadingData') }}
      </div>

      <div v-else-if="submissions.length === 0" class="yuemu-empty-state">
        <div class="yuemu-empty-icon"><i class="fas fa-inbox"></i></div>
        <h3>{{ t('pages.activitySubmissionManagePage.emptyTitle') }}</h3>
        <p>{{ t('pages.activitySubmissionManagePage.emptyDesc') }}</p>
      </div>

      <div class="yuemu-masonry-review-grid" v-else>
        <div class="yuemu-review-card" v-for="item in submissions" :key="item.id">

          <div class="yuemu-card-media">
            <img :src="item.picture?.url" :alt="item.picture?.name" loading="lazy" />
            <div class="yuemu-status-indicator" v-if="item.status !== 0">
              <span class="yuemu-indicator-tag yuemu-passed" v-if="item.status === 1"><i class="fas fa-check"></i> {{ t('pages.activitySubmissionManagePage.statusApproved') }}</span>
              <span class="yuemu-indicator-tag yuemu-rejected" v-if="item.status === 2"><i class="fas fa-times"></i> {{ t('pages.activitySubmissionManagePage.statusRejected') }}</span>
            </div>
          </div>

          <div class="yuemu-card-body">
            <h3 class="yuemu-work-title">{{ item.submissionTitle || item.picture?.name || t('pages.activitySubmissionManagePage.unnamedWork') }}</h3>
            <p class="yuemu-work-desc">{{ item.submissionDesc || t('pages.activitySubmissionManagePage.noDescription') }}</p>

            <div class="yuemu-work-meta">
              <div class="yuemu-user-info">
                <img :src="item.user?.userAvatar || getDefaultAvatar(item.user?.userName)" class="yuemu-mini-avatar" />
                <span>{{ item.user?.userName }}</span>
              </div>
              <div class="yuemu-vote-info">
                <i class="fas fa-heart"></i> {{ item.voteCount || 0 }}
              </div>
            </div>

            <div class="yuemu-card-actions" v-if="item.status === 0">
              <button class="yuemu-action-btn yuemu-reject" @click="showRejectModal(item)">
                <i class="fas fa-times"></i> {{ t('pages.activitySubmissionManagePage.btnReject') }}
              </button>
              <button class="yuemu-action-btn yuemu-approve" @click="handleReview(item.id, 1)">
                <i class="fas fa-check"></i> {{ t('pages.activitySubmissionManagePage.btnApprove') }}
              </button>
            </div>

            <div class="yuemu-reject-reason-box" v-else-if="item.status === 2 && item.reviewMessage">
              <i class="fas fa-comment-dots"></i>
              <p>{{ item.reviewMessage }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="yuemu-load-more-wrapper" v-if="total > submissions.length">
        <button class="yuemu-load-more-btn" @click="loadMore" :disabled="loading">
          <i class="fas fa-spinner fa-spin" v-if="loading"></i>
          <span v-else>{{ t('pages.activitySubmissionManagePage.btnLoadMore') }}</span>
        </button>
      </div>
    </main>

    <div class="yuemu-raw-modal-overlay" :class="{ 'yuemu-is-active': rejectModalVisible }" @click.self="rejectModalVisible = false">
      <div class="yuemu-raw-modal-box">
        <div class="yuemu-modal-header">
          <h2>{{ t('pages.activitySubmissionManagePage.modalTitle') }}</h2>
          <button class="yuemu-close-icon" @click="rejectModalVisible = false"><i class="fas fa-times"></i></button>
        </div>
        <div class="yuemu-modal-body">
          <div class="yuemu-textarea-wrapper">
            <textarea
              v-model="rejectMessage"
              class="yuemu-ios-textarea"
              :placeholder="t('pages.activitySubmissionManagePage.rejectReasonPlaceholder')"
              rows="4"
              maxlength="200"
            ></textarea>
            <span class="yuemu-char-count">{{ rejectMessage.length }}/200</span>
          </div>
        </div>
        <div class="yuemu-modal-footer">
          <button class="yuemu-modal-btn yuemu-cancel" @click="rejectModalVisible = false">{{ t('pages.activitySubmissionManagePage.btnCancel') }}</button>
          <button class="yuemu-modal-btn yuemu-danger" :disabled="!rejectMessage.trim()" @click="handleRejectConfirm">{{ t('pages.activitySubmissionManagePage.btnConfirmReject') }}</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getActivityByIdUsingGet } from '@/api/activityController'
import { listSubmissionByPageUsingPost, reviewSubmissionUsingPost } from '@/api/activitySubmissionController'
import { getDefaultAvatar } from '@/utils/userUtils'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const currentActivity = ref<any>(null)
const submissions = ref<any[]>([])
const loading = ref(false)
const total = ref(0)

const queryParams = ref({
  activityId: undefined as number | undefined,
  status: '0',
  current: 1,
  pageSize: 12
})

const rejectModalVisible = ref(false)
const rejectMessage = ref('')
const currentReviewId = ref<number>()

// 自定义 Toast
const toast = ref({ visible: false, text: '', isError: false })
let toastTimer: any = null
const showToast = (text: string, isError = false) => {
  toast.value = { visible: true, text, isError }
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value.visible = false }, 2500)
}

const loadCurrentActivity = async () => {
  const activityId = route.query.activityId
  if (!activityId) {
    showToast(t('pages.activitySubmissionManagePage.toastMissingId'), true)
    setTimeout(() => router.back(), 1500)
    return
  }

  try {
    const res = await getActivityByIdUsingGet({ id: activityId as string })
    if (res.data?.data) {
      currentActivity.value = res.data.data
      if (currentActivity.value.allowSubmission !== 1) {
        showToast(t('pages.activitySubmissionManagePage.toastSubmissionNotAllowed'), true)
        setTimeout(() => router.back(), 1500)
        return
      }
      queryParams.value.activityId = currentActivity.value.id
      loadSubmissions(false)
    } else {
      showToast(t('pages.activitySubmissionManagePage.toastActivityNotExist'), true)
      setTimeout(() => router.back(), 1500)
    }
  } catch (error) {
    showToast(t('pages.activitySubmissionManagePage.toastFetchActivityFail'), true)
    setTimeout(() => router.back(), 1500)
  }
}

const loadSubmissions = async (isAppend = false) => {
  if (!queryParams.value.activityId) return

  loading.value = true
  try {
    const res = await listSubmissionByPageUsingPost({
      ...queryParams.value,
      status: parseInt(queryParams.value.status)
    })
    if (res.data?.data) {
      const newRecords = res.data.data.records || []
      if (isAppend) {
        submissions.value.push(...newRecords)
      } else {
        submissions.value = newRecords
      }
      total.value = res.data.data.total || 0
    }
  } catch (error) {
    showToast(t('pages.activitySubmissionManagePage.toastFetchListFail'), true)
  } finally {
    loading.value = false
  }
}

const handleTabChange = (status: string) => {
  queryParams.value.status = status
  queryParams.value.current = 1
  loadSubmissions(false)
}

const loadMore = () => {
  queryParams.value.current++
  loadSubmissions(true)
}

const handleReview = async (id: number, status: number, reviewMsg?: string) => {
  try {
    const res = await reviewSubmissionUsingPost({
      id,
      status,
      reviewMessage: reviewMsg
    })
    if (res.data.code === 0) {
      showToast(status === 1 ? t('pages.activitySubmissionManagePage.toastApproveSuccess') : t('pages.activitySubmissionManagePage.toastRejectSuccess'))
      // 重新加载当前列表以更新状态
      queryParams.value.current = 1
      loadSubmissions(false)
    } else {
      showToast(res.data.message || t('pages.activitySubmissionManagePage.toastActionFail'), true)
    }
  } catch (error: any) {
    showToast(error.message || t('pages.activitySubmissionManagePage.toastActionFail'), true)
  }
}

const showRejectModal = (item: any) => {
  currentReviewId.value = item.id
  rejectMessage.value = ''
  rejectModalVisible.value = true
}

const handleRejectConfirm = () => {
  if (!rejectMessage.value.trim()) {
    showToast(t('pages.activitySubmissionManagePage.toastRejectReasonEmpty'), true)
    return
  }
  if (currentReviewId.value) {
    handleReview(currentReviewId.value, 2, rejectMessage.value)
    rejectModalVisible.value = false
  }
}

onMounted(() => {
  loadCurrentActivity()
})
</script>

<style scoped>
/* =========================================================
   现代化管理后台 / SaaS 风格 / 摆脱 Ant Design 基因
   ========================================================= */
.yuemu-modern-review-dashboard {
  min-height: 100vh;
  background-color: var(--background);
  color: var(--text-primary);
  font-family: var(--font-family-base);
}

/* --- 全局 Toast --- */
.yuemu-modern-toast {
  position: fixed; top: 40px; left: 50%; transform: translate(-50%, -20px);
  background: var(--text-primary); color: var(--background);
  padding: 12px 24px; border-radius: 30px; font-size: 14px; font-weight: 500;
  display: flex; align-items: center; gap: 8px;
  opacity: 0; visibility: hidden; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 10000; box-shadow: 0 10px 30px var(--shadow-color);
}
.yuemu-modern-toast.yuemu-show { transform: translate(-50%, 0); opacity: 1; visibility: visible; }
.yuemu-modern-toast.yuemu-error { background: #ef4444; color: #fff; }

/* --- 1. 毛玻璃吸顶 Header --- */
.yuemu-glass-header {
  position: sticky; top: 0; z-index: 100;
  background: var(--header-background);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-color);
  padding: 20px 32px;
}

.yuemu-header-content {
  display: flex; align-items: center; gap: 20px;
  max-width: 1400px; margin: 0 auto;
}

.yuemu-icon-back-btn {
  width: 40px; height: 40px; border-radius: 50%;
  background: var(--hover-background); border: 1px solid var(--border-color);
  color: var(--text-primary); font-size: 16px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.2s;
}
.yuemu-icon-back-btn:hover { background: var(--text-primary); color: var(--background); }

.yuemu-title-group { display: flex; flex-direction: column; gap: 4px; }
.yuemu-page-title { margin: 0; font-size: 22px; font-weight: 700; color: var(--text-primary); }

.yuemu-activity-meta { display: flex; align-items: center; gap: 12px; }
.yuemu-activity-name { font-size: 14px; color: var(--text-secondary); max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.yuemu-tags { display: flex; gap: 6px; }
.yuemu-mini-tag { padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; }
.yuemu-mini-tag.yuemu-green { background: rgba(16, 185, 129, 0.15); color: #059669; }
.yuemu-mini-tag.yuemu-blue { background: rgba(59, 130, 246, 0.15); color: #2563eb; }
.dark-theme .yuemu-mini-tag.yuemu-green { color: #34d399; }
.dark-theme .yuemu-mini-tag.yuemu-blue { color: #60a5fa; }

/* --- 2. 居中 Apple 风格 Segmented Control --- */
.yuemu-ios-segmented-control {
  max-width: 400px; margin: 24px auto 0;
  display: flex; background: var(--hover-background);
  padding: 4px; border-radius: 10px; border: 1px solid var(--border-color);
}
.yuemu-seg-btn {
  flex: 1; background: transparent; border: none; padding: 8px 0;
  font-size: 14px; font-weight: 500; color: var(--text-secondary);
  border-radius: 8px; cursor: pointer; transition: all 0.2s;
}
.yuemu-seg-btn.yuemu-active { background: var(--card-background); color: var(--text-primary); font-weight: 600; box-shadow: 0 2px 8px var(--shadow-color); }

/* --- 3. 卡片瀑布流主体 --- */
.yuemu-dashboard-body {
  max-width: 1400px; margin: 0 auto; padding: 32px; min-height: 60vh;
}

.yuemu-loading-state, .yuemu-empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  height: 40vh; color: var(--text-secondary);
}
.yuemu-loading-state i { font-size: 32px; margin-bottom: 16px; color: var(--text-primary); }
.yuemu-empty-icon { width: 80px; height: 80px; border-radius: 50%; background: var(--hover-background); display: flex; align-items: center; justify-content: center; font-size: 32px; margin-bottom: 16px; }
.yuemu-empty-state h3 { font-size: 18px; margin: 0 0 8px 0; color: var(--text-primary); }
.yuemu-empty-state p { font-size: 14px; margin: 0; }

.yuemu-masonry-review-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.yuemu-review-card {
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 16px; overflow: hidden;
  box-shadow: 0 4px 20px var(--shadow-color);
  transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  display: flex; flex-direction: column;
}
.yuemu-review-card:hover { transform: translateY(-6px); box-shadow: 0 12px 30px var(--shadow-color); }

.yuemu-card-media { position: relative; width: 100%; aspect-ratio: 16 / 10; background: var(--hover-background); border-bottom: 1px solid var(--border-color); }
.yuemu-card-media img { width: 100%; height: 100%; object-fit: cover; }
.yuemu-status-indicator { position: absolute; top: 12px; left: 12px; }
.yuemu-indicator-tag { padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; backdrop-filter: blur(8px); display: flex; align-items: center; gap: 4px; }
.yuemu-indicator-tag.yuemu-passed { background: rgba(16, 185, 129, 0.85); color: white; }
.yuemu-indicator-tag.yuemu-rejected { background: rgba(239, 68, 68, 0.85); color: white; }

.yuemu-card-body { padding: 20px; display: flex; flex-direction: column; flex: 1; }
.yuemu-work-title { font-size: 16px; font-weight: 600; margin: 0 0 8px 0; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.yuemu-work-desc { font-size: 13px; color: var(--text-secondary); margin: 0 0 16px 0; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; flex: 1; }

.yuemu-work-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px dashed var(--border-color); }
.yuemu-user-info { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-primary); font-weight: 500; }
.yuemu-mini-avatar { width: 24px; height: 24px; border-radius: 50%; object-fit: cover; background: var(--border-color); }
.yuemu-vote-info { font-size: 13px; color: #ef4444; font-weight: 600; display: flex; align-items: center; gap: 4px; }

/* 现代感操作按钮 */
.yuemu-card-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.yuemu-action-btn {
  border: none; padding: 10px 0; border-radius: 10px; font-size: 14px; font-weight: 600;
  cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;
  transition: all 0.2s;
}
/* 拒绝：浅红底深红字 */
.yuemu-action-btn.yuemu-reject { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
.yuemu-action-btn.yuemu-reject:hover { background: #ef4444; color: white; }
.dark-theme .yuemu-action-btn.yuemu-reject { background: rgba(239, 68, 68, 0.2); color: #f87171; }
.dark-theme .yuemu-action-btn.yuemu-reject:hover { background: #ef4444; color: white; }

/* 批准：浅绿底深绿字 */
.yuemu-action-btn.yuemu-approve { background: rgba(16, 185, 129, 0.1); color: #10b981; }
.yuemu-action-btn.yuemu-approve:hover { background: #10b981; color: white; }
.dark-theme .yuemu-action-btn.yuemu-approve { background: rgba(16, 185, 129, 0.2); color: #34d399; }
.dark-theme .yuemu-action-btn.yuemu-approve:hover { background: #10b981; color: white; }

.yuemu-reject-reason-box {
  background: var(--hover-background); border-radius: 8px; padding: 12px;
  font-size: 13px; color: var(--text-secondary); display: flex; gap: 8px; align-items: flex-start;
}
.yuemu-reject-reason-box i { color: #ef4444; margin-top: 3px; }
.yuemu-reject-reason-box p { margin: 0; line-height: 1.4; word-break: break-word; }

/* 加载更多 */
.yuemu-load-more-wrapper { text-align: center; margin-top: 40px; }
.yuemu-load-more-btn {
  background: transparent; border: 1px solid var(--border-color); color: var(--text-primary);
  padding: 10px 32px; border-radius: 20px; font-size: 14px; font-weight: 500;
  cursor: pointer; transition: all 0.2s;
}
.yuemu-load-more-btn:hover { background: var(--text-primary); color: var(--background); }

/* --- 4. 丝滑原生弹窗 --- */
.yuemu-raw-modal-overlay {
  position: fixed; inset: 0; background: var(--comment-drawer-backdrop, rgba(0,0,0,0.5));
  backdrop-filter: blur(4px); z-index: 2000;
  display: flex; align-items: center; justify-content: center;
  opacity: 0; visibility: hidden; transition: all 0.3s ease;
}
.yuemu-raw-modal-overlay.yuemu-is-active { opacity: 1; visibility: visible; }

.yuemu-raw-modal-box {
  background: var(--card-background); width: 100%; max-width: 480px;
  border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  transform: scale(0.95) translateY(20px); transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  border: 1px solid var(--border-color); overflow: hidden;
}
.yuemu-raw-modal-overlay.yuemu-is-active .yuemu-raw-modal-box { transform: scale(1) translateY(0); }

.yuemu-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid var(--border-color); }
.yuemu-modal-header h2 { margin: 0; font-size: 18px; font-weight: 600; color: var(--text-primary); }
.yuemu-close-icon { background: none; border: none; font-size: 20px; color: var(--text-secondary); cursor: pointer; transition: color 0.2s; }
.yuemu-close-icon:hover { color: var(--text-primary); }

.yuemu-modal-body { padding: 24px; }
.yuemu-textarea-wrapper { position: relative; }
.yuemu-ios-textarea {
  width: 100%; background: var(--hover-background); border: 1px solid var(--border-color);
  color: var(--text-primary); padding: 16px; border-radius: 12px; font-size: 15px;
  font-family: inherit; outline: none; resize: none; transition: border-color 0.2s;
  box-sizing: border-box;
}
.yuemu-ios-textarea:focus { border-color: var(--text-primary); }
.yuemu-char-count { position: absolute; right: 12px; bottom: 12px; font-size: 12px; color: var(--text-secondary); }

.yuemu-modal-footer { padding: 16px 24px; display: flex; justify-content: flex-end; gap: 12px; background: var(--hover-background); }
.yuemu-modal-btn { border: none; padding: 10px 24px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; transition: opacity 0.2s; }
.yuemu-modal-btn.yuemu-cancel { background: transparent; color: var(--text-secondary); }
.yuemu-modal-btn.yuemu-cancel:hover { color: var(--text-primary); }
.yuemu-modal-btn.yuemu-danger { background: #ef4444; color: white; }
.yuemu-modal-btn.yuemu-danger:disabled { opacity: 0.5; cursor: not-allowed; }

/* --- 响应式 --- */
@media (max-width: 768px) {
  .yuemu-glass-header { padding: 16px; }
  .yuemu-page-title { font-size: 18px; }
  .yuemu-dashboard-body { padding: 20px 16px; }
  .yuemu-masonry-review-grid { grid-template-columns: 1fr; gap: 16px; }
  .yuemu-card-media { aspect-ratio: 16 / 9; }
  .yuemu-raw-modal-box { margin: 0 16px; }
}
/* --- 修复图片无限高度拉伸 --- */
.yuemu-card-media {
  position: relative;
  width: 100%;
  height: 220px; /* 直接使用固定高度，保证所有卡片头部绝对整齐 */
  overflow: hidden; /* 核心：严格裁剪溢出部分 */
  flex-shrink: 0; /* 核心：防止在 Flex 布局中被图片原始尺寸撑开或挤压 */
  background: var(--hover-background);
  border-bottom: 1px solid var(--border-color);
}

.yuemu-card-media img {
  width: 100%;
  height: 100%;
  object-fit: cover; /* 保证图片等比缩放并铺满整个 220px 区域 */
  display: block;
  transition: transform 0.4s ease; /* 可选：加上配合 hover 的缩放动画效果会更好 */
}

/* 鼠标悬浮时，图片轻微放大，增加高级感 */
.yuemu-review-card:hover .yuemu-card-media img {
  transform: scale(1.05);
}
</style>
