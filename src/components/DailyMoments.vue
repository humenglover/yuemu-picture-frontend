<template>
  <div class="yuemu-love-timeline-container">

    <div class="yuemu-timeline-header">
      <h1 class="yuemu-main-title">{{ t('components.dailyMoments.title') }}</h1>
      <p class="yuemu-sub-title">{{ t('components.dailyMoments.subtitle') }}</p>
    </div>

    <div class="yuemu-timeline-wrapper" v-if="moments.length > 0">
      <div class="yuemu-timeline-track"></div>

      <div v-for="(moment, index) in moments" :key="moment.id"
           class="yuemu-timeline-item"
           :class="{ 'yuemu-is-left': index % 2 === 0, 'yuemu-is-right': index % 2 !== 0 }">

        <div class="yuemu-timeline-node">
          <div class="yuemu-node-core"></div>
        </div>

        <div class="yuemu-moment-card">
          <div class="yuemu-card-arrow"></div>

          <div class="yuemu-moment-content">
            <p class="yuemu-text-content">{{ moment.content }}</p>
          </div>

          <div class="yuemu-moment-footer">
            <div class="yuemu-time-info">
              <ClockCircleOutlined class="yuemu-time-icon" />
              {{ formatTime(moment.createTime) }}
            </div>

            <div class="yuemu-action-group">
              <button class="yuemu-action-btn yuemu-like-btn" :class="{'yuemu-is-liked': moment.isLiked}" @click="handleLike(moment)">
                <svg v-if="moment.isLiked" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" color="var(--comment-delete-hover-color, #ff4d4f)"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                <svg v-else viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                <span class="yuemu-count">{{ moment.likeCount || 0 }}</span>
              </button>

              <button v-if="canDelete(moment)" class="yuemu-action-btn yuemu-delete-btn" @click="handleDelete(moment.id)">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="yuemu-romantic-empty-state">
      <div class="yuemu-empty-icon-wrap"><EnvironmentOutlined class="yuemu-floating-leaf" /></div>
      <p class="yuemu-empty-text">{{ t('components.dailyMoments.emptyState') }}</p>
    </div>

    <Teleport to="body">
      <button class="yuemu-fab-publish-btn yuemu-pulse-animation" @click="showPublishModal" :title="t('components.dailyMoments.recordMoment')">
        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
        </svg>
      </button>
    </Teleport>

    <a-modal v-model:open="showModal"
             :footer="null"
             :closable="false"
             @cancel="closeModal"
             width="480px"
             wrap-class="yuemu-love-theme-modal"
             centered>

      <div class="yuemu-modal-custom-header">
        <h3 class="yuemu-modal-title">{{ (!loginUserStore.loginUser?.id || !props.isOwner) ? t('components.dailyMoments.dailyQuote') : t('components.dailyMoments.recordNow') }}</h3>
        <button class="yuemu-modal-close-btn" @click="closeModal">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>

      <div class="yuemu-modal-custom-body">
        <div v-if="!loginUserStore.loginUser?.id || !props.isOwner" class="yuemu-quote-card">
          <svg class="yuemu-quote-mark" viewBox="0 0 24 24" width="32" height="32" fill="currentColor" opacity="0.1"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/></svg>
          <p class="yuemu-quote-text">{{ currentQuote }}</p>
        </div>

        <div v-else class="yuemu-publish-form">
          <textarea
            v-model="newMoment.content"
            :placeholder="t('components.dailyMoments.placeholder')"
            maxlength="1024"
            rows="5"
            class="yuemu-romantic-textarea"
          ></textarea>

          <div class="yuemu-publish-actions">
            <label class="yuemu-custom-switch">
              <input type="checkbox" v-model="newMoment.isPublic">
              <span class="yuemu-slider"></span>
              <span class="yuemu-switch-text">{{ newMoment.isPublic ? t('components.dailyMoments.publicVisibility') : t('components.dailyMoments.privateVisibility') }}</span>
            </label>

            <button class="yuemu-btn-primary" @click="handlePublish" :disabled="!newMoment.content.trim() || publishing">
              {{ publishing ? t('components.dailyMoments.publishing') : t('components.dailyMoments.sealMoment') }}
            </button>
          </div>
        </div>
      </div>
    </a-modal>

    <a-modal v-model:open="showDeleteConfirm"
             :footer="null"
             :closable="false"
             @cancel="cancelDelete"
             width="360px"
             wrap-class="yuemu-love-theme-modal yuemu-compact-modal"
             centered>
      <div class="yuemu-danger-confirm-content">
        <div class="yuemu-danger-icon">
          <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="1.5" fill="none"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
        </div>
        <h3 class="yuemu-danger-title">{{ t('components.dailyMoments.confirmDeleteTitle') }}</h3>
        <p class="yuemu-danger-desc">{{ t('components.dailyMoments.confirmDeleteDesc') }}</p>
        <div class="yuemu-form-actions yuemu-center">
          <button class="yuemu-btn-ghost" @click="cancelDelete">{{ t('components.dailyMoments.slipHand') }}</button>
          <button class="yuemu-btn-danger" @click="confirmDelete">{{ t('components.dailyMoments.confirmErase') }}</button>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ClockCircleOutlined, EnvironmentOutlined } from '@ant-design/icons-vue'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import { message } from 'ant-design-vue'
import {
  addWeiYanUsingPost,
  deleteWeiYanUsingPost,
  listWeiYanUsingGet,
  likeWeiYanUsingPost
} from '@/api/weiYanController'
import { formatTime } from '@/utils/dateUtils'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface WeiYan {
  id: number
  userId: number
  loveBoardId: number
  content: string
  createTime: string
  isPublic: number
  likeCount: number
  isLiked?: boolean
  userAvatar?: string
}

const router = useRouter()
const loginUserStore = useLoginUserStore()
const moments = ref<WeiYan[]>([])
const showModal = ref(false)
const publishing = ref(false)
const newMoment = ref({
  content: '',
  isPublic: true,
  loveBoardId: 0
})

const props = defineProps<{
  loveBoardId: string
  isOwner: boolean
}>()

const positiveQuotes = [
  "每一个微笑都是对生活的感恩 ❤️",
  "爱是生命中最美的风景 🌈",
  "珍惜当下，感恩遇见 🌟",
  "愿你被这个世界温柔以待 🌸",
  "生活虽不完美，但依然值得期待 ✨",
  "带着希望前进，怀着爱继续 💫",
  "每个人都是自己人生的主角 🌠",
  "相信美好，美好就会不期而遇 🍀",
  "保持热爱，奔赴山海 ⭐",
  "愿你眼中有光，心中有爱 💖"
]

const currentQuote = ref(positiveQuotes[Math.floor(Math.random() * positiveQuotes.length)])

const handleLike = async (moment: WeiYan) => {
  if (moment.isLiked) {
    message.warning(t('components.dailyMoments.alreadyLiked'))
    return
  }

  try {
    const response = await likeWeiYanUsingPost({ id: moment.id })
    if (response.data.code === 0) {
      moment.likeCount = Number(moment.likeCount || 0) + 1
      moment.isLiked = true
    } else if (response.data.code === 40100) {
      message.warning(t('components.dailyMoments.alreadyLiked'))
    } else {
      message.error(t('components.dailyMoments.likeFailed') + response.data.message)
    }
  } catch (error) {
    console.error('点赞失败:', error)
    message.error(t('components.dailyMoments.likeError'))
  }
}

const canDelete = (moment: WeiYan): boolean => {
  return props.isOwner
}

const handleDelete = async (id: number) => {
  if (!loginUserStore.loginUser?.id) {
    message.warning(t('components.dailyMoments.pleaseLogin'))
    return
  }
  showDeleteConfirm.value = true
  momentToDelete.value = id
}

const showDeleteConfirm = ref(false)
const momentToDelete = ref<number | null>(null)

const confirmDelete = async () => {
  if (!momentToDelete.value) return

  try {
    const response = await deleteWeiYanUsingPost({
      id: momentToDelete.value,
      loveBoardId: props.loveBoardId
    })
    if (response.data.code === 0) {
      message.success(t('components.dailyMoments.deleteSuccess'))
      moments.value = moments.value.filter(item => item.id !== momentToDelete.value)
      showDeleteConfirm.value = false
    } else {
      message.error(t('components.dailyMoments.deleteFailedPrefix') + response.data.message)
    }
  } catch (error) {
    console.error('删除失败:', error)
    message.error(t('components.dailyMoments.deleteError'))
  }
}

const cancelDelete = () => {
  showDeleteConfirm.value = false
  momentToDelete.value = null
}

const showPublishModal = () => {
  if (!loginUserStore.loginUser?.id || !props.isOwner) {
    currentQuote.value = positiveQuotes[Math.floor(Math.random() * positiveQuotes.length)]
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  newMoment.value = {
    content: '',
    isPublic: true,
    loveBoardId: Number(props.loveBoardId)
  }
}

const handlePublish = async () => {
  if (!loginUserStore.loginUser?.id) {
    message.warning(t('components.dailyMoments.loginToPublish'))
    return
  }

  if (!newMoment.value.content.trim()) {
    message.warning(t('components.dailyMoments.inputContent'))
    return
  }

  publishing.value = true
  try {
    const response = await addWeiYanUsingPost({
      content: newMoment.value.content,
      isPublic: newMoment.value.isPublic ? 1 : 0,
      loveBoardId: props.loveBoardId,
      userId: String(loginUserStore.loginUser.id),
      type: 0
    })

    if (response.data.code === 0) {
      message.success(t('components.dailyMoments.publishSuccess'))
      await fetchMoments()
      closeModal()
    } else {
      message.error(t('components.dailyMoments.publishFailedPrefix') + response.data.message)
    }
  } catch (error) {
    console.error('发布失败:', error)
    message.error(t('components.dailyMoments.publishError'))
  } finally {
    publishing.value = false
  }
}

const fetchMoments = async () => {
  try {
    if (!props.loveBoardId) return

    const params = {
      loveBoardId: props.loveBoardId,
      userId: loginUserStore.loginUser?.id ? String(loginUserStore.loginUser.id) : undefined,
      current: 1,
      pageSize: 20
    }

    const response = await listWeiYanUsingGet(params)

    if (response.data.code === 0) {
      moments.value = (response.data.data?.records || []).map(moment => ({
        ...moment,
        likeCount: Number(moment.likeCount || 0)
      }))
      moments.value.sort((a: WeiYan, b: WeiYan) =>
        new Date(b.createTime).getTime() - new Date(a.createTime).getTime()
      )
    }
  } catch (error: any) {
    console.error('获取点点滴滴列表失败:', error)
  }
}

onMounted(() => {
  fetchMoments()
})
</script>

<style scoped>
.yuemu-love-timeline-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 24px 100px;
  color: var(--text-primary);
  font-family: var(--font-family-base);
  min-height: 80vh;
}

.yuemu-timeline-header {
  text-align: center;
  margin-bottom: 60px;
}
.yuemu-main-title {
  font-size: 2.2rem; font-weight: 800; margin: 0 0 12px; color: var(--text-primary);
}
.yuemu-sub-title {
  font-size: 15px; color: var(--text-secondary); margin: 0;
}

.yuemu-timeline-wrapper {
  position: relative;
  padding: 20px 0;
}

.yuemu-timeline-track {
  position: absolute;
  top: 0; bottom: 0; left: 50%;
  width: 2px;
  background: var(--border-color);
  transform: translateX(-50%);
  border-radius: 2px;
  opacity: 0.6;
}

.yuemu-timeline-item {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 48px;
  width: 100%;
}
.yuemu-timeline-item.yuemu-is-left { flex-direction: row-reverse; }

.yuemu-timeline-node {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  background: var(--background);
  border-radius: 50%; z-index: 2;
}
.yuemu-node-core {
  width: 12px; height: 12px;
  background: var(--love-primary, #ff7a9e);
  border-radius: 50%;
  box-shadow: 0 0 0 4px rgba(255, 122, 158, 0.2);
  transition: all 0.3s ease;
}
.yuemu-timeline-item:hover .yuemu-node-core {
  transform: scale(1.3);
  box-shadow: 0 0 0 6px rgba(255, 122, 158, 0.3);
}

.yuemu-moment-card {
  box-sizing: border-box;
  width: calc(50% - 40px);
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 24px var(--shadow-color);
  position: relative;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
}
.yuemu-timeline-item:hover .yuemu-moment-card {
  transform: translateY(-4px);
  box-shadow: 0 16px 40px rgba(0,0,0,0.12);
}

.yuemu-card-arrow {
  position: absolute;
  top: 24px;
  width: 12px; height: 12px;
  background: var(--card-background);
  border: 1px solid var(--border-color);
  transform: rotate(45deg);
}
.yuemu-is-left .yuemu-card-arrow {
  right: -7px;
  border-bottom: none; border-left: none;
}
.yuemu-is-right .yuemu-card-arrow {
  left: -7px;
  border-top: none; border-right: none;
}

.yuemu-moment-content { margin-bottom: 20px; }
.yuemu-text-content {
  font-size: 15px; color: var(--text-primary);
  line-height: 1.8; margin: 0; white-space: pre-wrap; word-break: break-word;
}

.yuemu-moment-footer {
  display: flex; justify-content: space-between; align-items: center;
  border-top: 1px dashed var(--border-color);
  padding-top: 16px;
}
.yuemu-time-info {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; color: var(--text-secondary); font-family: monospace;
}
.yuemu-time-icon { font-size: 14px; opacity: 0.8; }

.yuemu-action-group { display: flex; align-items: center; gap: 12px; }
.yuemu-action-btn {
  display: flex; align-items: center; gap: 4px;
  background: transparent; border: none; padding: 6px;
  border-radius: 20px; cursor: pointer; color: var(--text-secondary);
  transition: all 0.2s; font-size: 13px; font-weight: 500;
}
.yuemu-action-btn:hover { background: var(--hover-background); color: var(--text-primary); }
.yuemu-like-btn.yuemu-is-liked { color: var(--comment-delete-hover-color, #ff4d4f); }
.yuemu-like-btn.yuemu-is-liked:hover { background: rgba(255, 77, 79, 0.1); }
.yuemu-delete-btn:hover { color: var(--comment-delete-hover-color, #ff4d4f); }

.yuemu-romantic-empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  height: 40vh; text-align: center; opacity: 0.8;
}
.yuemu-floating-leaf { font-size: 56px; animation: yuemu-float 3s ease-in-out infinite; display: inline-block;}
@keyframes yuemu-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
.yuemu-empty-text { margin-top: 20px; color: var(--text-secondary); font-size: 15px; letter-spacing: 1px; }

.yuemu-fab-publish-btn {
  position: fixed; bottom: 40px; right: 40px;
  width: 64px; height: 64px; border-radius: 50%;
  background: var(--love-primary, #ff7a9e); color: #fff;
  border: 2px solid rgba(255,255,255,0.2);
  box-shadow: 0 8px 24px rgba(0,0,0,0.2), inset 0 -4px 10px rgba(0,0,0,0.2);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; z-index: 90; transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.yuemu-fab-publish-btn:hover {
  transform: scale(1.1) translateY(-4px);
  box-shadow: 0 12px 30px rgba(0,0,0,0.3), inset 0 -4px 10px rgba(0,0,0,0.2);
}

:deep(.yuemu-love-theme-modal .ant-modal-content) {
  border-radius: 24px;
  background: var(--card-background);
  box-shadow: 0 24px 60px rgba(0,0,0,0.2);
  border: 1px solid var(--border-color);
  padding: 0; overflow: hidden;
}
:deep(.yuemu-compact-modal .ant-modal-content) { border-radius: 20px; }

.yuemu-modal-custom-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 24px 32px 16px; border-bottom: 1px solid var(--border-color);
}
.yuemu-modal-title { font-size: 18px; font-weight: 600; color: var(--text-primary); margin: 0; }
.yuemu-modal-close-btn {
  background: var(--hover-background); border: none; color: var(--text-secondary);
  width: 32px; height: 32px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
  transition: all 0.2s;
}
.yuemu-modal-close-btn:hover { background: var(--border-color); color: var(--text-primary); transform: rotate(90deg); }

.yuemu-modal-custom-body { padding: 24px 32px 32px; }

.yuemu-quote-card {
  position: relative; padding: 32px;
  background: var(--hover-background); border-radius: 16px;
  text-align: center; border: 1px solid var(--border-color);
}
.yuemu-quote-mark { position: absolute; top: 16px; left: 16px; color: var(--love-primary, #ff7a9e); }
.yuemu-quote-text {
  font-size: 18px; color: var(--love-primary, #ff7a9e); line-height: 1.6;
  font-weight: 500; margin: 0; position: relative; z-index: 1;
  font-family: var(--font-family-base); letter-spacing: 1px;
}

.yuemu-publish-form { display: flex; flex-direction: column; gap: 24px; }
.yuemu-romantic-textarea {
  width: 100%; padding: 16px;
  background: var(--background); border: 1px solid var(--border-color);
  color: var(--text-primary); border-radius: 16px; font-family: inherit; font-size: 15px;
  resize: none; transition: all 0.2s; line-height: 1.6;
}
.yuemu-romantic-textarea:focus {
  border-color: var(--love-primary, #ff7a9e); outline: none;
  box-shadow: 0 0 0 3px rgba(255, 122, 158, 0.1); background: var(--card-background);
}
.yuemu-publish-actions { display: flex; justify-content: space-between; align-items: center; }

.yuemu-custom-switch { display: flex; align-items: center; gap: 12px; cursor: pointer; user-select: none; }
.yuemu-custom-switch input { display: none; }
.yuemu-slider {
  width: 44px; height: 24px; background-color: var(--border-color); border-radius: 24px; position: relative; transition: .4s;
}
.yuemu-slider:before {
  position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px;
  background-color: white; border-radius: 50%; transition: .4s; box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}
.yuemu-custom-switch input:checked + .yuemu-slider { background-color: var(--love-primary, #ff7a9e); }
.yuemu-custom-switch input:checked + .yuemu-slider:before { transform: translateX(20px); }
.yuemu-switch-text { font-size: 14px; font-weight: 500; color: var(--text-secondary); }

.yuemu-btn-primary, .yuemu-btn-ghost, .yuemu-btn-danger {
  padding: 10px 24px; border-radius: 20px; font-size: 14px; font-weight: 600; border: none; cursor: pointer; transition: all 0.2s;
}
.yuemu-btn-primary { background: var(--love-primary, #ff7a9e); color: #fff; box-shadow: 0 4px 12px rgba(255, 122, 158, 0.3); }
.yuemu-btn-primary:active { transform: scale(0.96); }
.yuemu-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.yuemu-btn-ghost { background: var(--hover-background); color: var(--text-primary); }
.yuemu-btn-ghost:hover { background: var(--border-color); }
.yuemu-btn-danger { background: var(--comment-delete-hover-color, #ff4d4f); color: #fff; }

.yuemu-danger-confirm-content { text-align: center; padding: 32px 24px; }
.yuemu-danger-icon { color: var(--comment-delete-hover-color, #ff4d4f); margin-bottom: 16px; display: inline-flex; }
.yuemu-danger-title { font-size: 18px; color: var(--text-primary); margin: 0 0 12px; }
.yuemu-danger-desc { color: var(--text-secondary); font-size: 14px; margin-bottom: 32px; }
.yuemu-form-actions { display: flex; gap: 12px; justify-content: center;}

@media (max-width: 768px) {
  .yuemu-love-timeline-container { padding: 0; }
  .yuemu-timeline-header { margin-bottom: 32px; text-align: left; }
  .yuemu-main-title { font-size: 1.8rem; }
  .yuemu-timeline-track { left: 24px; transform: none; }
  .yuemu-timeline-item {
    flex-direction: row !important;
    justify-content: flex-start;
    margin-bottom: 32px;
  }
  .yuemu-timeline-node { left: 24px; transform: translateX(-50%); width: 24px; height: 24px; }
  .yuemu-node-core { width: 10px; height: 10px; }
  .yuemu-moment-card {
    width: calc(100% - 48px);
    margin-left: 48px;
    padding: 20px;
  }
  .yuemu-card-arrow {
    left: -6px !important; right: auto !important;
    border-top: none !important; border-right: none !important;
    border-bottom: 1px solid var(--border-color) !important;
    border-left: 1px solid var(--border-color) !important;
  }
  :deep(.yuemu-love-theme-modal) { margin: 16px; max-width: calc(100vw - 32px) !important; }
  .yuemu-modal-custom-header { padding: 20px; }
  .yuemu-modal-custom-body { padding: 20px; }
  .yuemu-fab-publish-btn { bottom: 24px; right: 24px; width: 56px; height: 56px; }
  .yuemu-publish-actions { flex-direction: column; align-items: stretch; gap: 16px; }
  .yuemu-custom-switch { justify-content: center; }
}

/* 移动端强制移除点击时的悬停缩放，防止底层长按死锁 */
@media (max-width: 768px) {
  .ant-card-hoverable:active, .ant-card-hoverable:hover,
  .ant-card-hoverable:active *, .ant-card-hoverable:hover *,
  .yuemu-delete-btn:active, .yuemu-delete-btn:hover,
  .yuemu-delete-btn:active *, .yuemu-delete-btn:hover *,
  .yuemu-action-btn:active, .yuemu-action-btn:hover,
  .yuemu-action-btn:active *, .yuemu-action-btn:hover *,
  .yuemu-fab-publish-btn:active, .yuemu-fab-publish-btn:hover,
  .yuemu-fab-publish-btn:active *, .yuemu-fab-publish-btn:hover *,
  .yuemu-is-liked:active, .yuemu-is-liked:hover,
  .yuemu-is-liked:active *, .yuemu-is-liked:hover *,
  .yuemu-timeline-item:active, .yuemu-timeline-item:hover,
  .yuemu-timeline-item:active *, .yuemu-timeline-item:hover *,
  .yuemu-modal-close-btn:active, .yuemu-modal-close-btn:hover,
  .yuemu-modal-close-btn:active *, .yuemu-modal-close-btn:hover *,
  .yuemu-btn-ghost:active, .yuemu-btn-ghost:hover,
  .yuemu-btn-ghost:active *, .yuemu-btn-ghost:hover * {
    transform: none !important;
  }
}
</style>
