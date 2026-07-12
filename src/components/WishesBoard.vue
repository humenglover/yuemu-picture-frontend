<template>
  <div class="yuemu-wishes-board">
    <div class="yuemu-board-top-bar">
      <div class="yuemu-stats-info">
        <span class="yuemu-stats-highlight">{{ wishes.length }}</span> {{ t('components.wishesBoard.mutualWishesCount') }}
      </div>
      <button class="yuemu-publish-trigger-btn" @click="showPublishModal">
        <i class="fas fa-pen-nib"></i> {{ t('components.wishesBoard.writeWish') }}
      </button>
    </div>

    <div class="yuemu-messages-grid">
      <div v-if="wishes.length === 0" class="yuemu-empty-state yuemu-glass-panel">
        <div class="yuemu-empty-icon"><i class="fas fa-envelope-open-text"></i></div>
        <h3 class="yuemu-empty-title">{{ t('components.wishesBoard.noWishesMessage') }}</h3>
        <p class="yuemu-empty-desc">{{ t('components.wishesBoard.beFirstToWriteWish') }}</p>
      </div>

      <div v-else v-for="wish in wishes" :key="wish.id" class="yuemu-message-card yuemu-glass-panel">
        <div class="yuemu-card-gradient-bg"></div>
        <div class="yuemu-message-content-wrap">
          <div class="yuemu-message-header">
            <div class="yuemu-user-info">
              <div class="yuemu-avatar-wrapper">
                <img :src="'https://q1.qlogo.cn/g?b=qq&nk=' + wish.qq + '&s=100'"
                     class="yuemu-avatar"
                     :class="{ 'yuemu-avatar-loading': !isAvatarLoaded[wish.id] }"
                     @load="handleAvatarLoad(wish.id)"
                     @error="handleAvatarLoad(wish.id)"
                     alt="avatar" />
              </div>
              <div class="yuemu-user-meta">
                <span class="yuemu-nickname">{{ wish.nickname }}</span>
                <span class="yuemu-location" v-if="wish.location">
                  <i class="fas fa-map-marker-alt"></i> {{ wish.location }}
                </span>
              </div>
            </div>
            <div class="yuemu-message-time">
              <i class="far fa-clock"></i> {{ formatTime(wish.createTime) }}
            </div>
          </div>

          <div class="yuemu-message-text">
            {{ wish.content }}
          </div>

          <div class="yuemu-message-footer">
            <button
              class="yuemu-action-btn yuemu-like-btn"
              :class="{ 'yuemu-liked': wish.isLiked }"
              @click="handleLike(wish)"
            >
              <i :class="wish.isLiked ? 'fas fa-heart' : 'far fa-heart'"></i>
              <span>{{ wish.likeCount || 0 }}</span>
            </button>
            <button
              v-if="isOwner"
              class="yuemu-action-btn yuemu-delete-btn"
              @click="handleDelete(wish)"
            >
              <i class="far fa-trash-alt"></i> {{ t('components.wishesBoard.deleteBtn') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <transition name="yuemu-modal-fade">
        <div v-if="showModal" class="yuemu-custom-modal-overlay" @click.self="closeModal">
          <div class="yuemu-custom-modal-container">
            <div class="yuemu-custom-modal-header">
              <h3><i class="fas fa-paper-plane"></i> {{ t('components.wishesBoard.deliverWish') }}</h3>
              <button class="yuemu-close-btn" @click="closeModal"><i class="fas fa-times"></i></button>
            </div>

            <div class="yuemu-custom-modal-body">
              <div class="yuemu-user-preview-section yuemu-glass-panel">
                <img :src="'https://q1.qlogo.cn/g?b=qq&nk=' + (newWish.qq || '10000') + '&s=100'" class="yuemu-preview-avatar">
                <div class="yuemu-system-info">
                  <div class="yuemu-info-badge">
                    <i class="fas fa-globe-asia"></i> {{ location || t('components.wishesBoard.china') }}
                  </div>
                </div>
              </div>

              <div class="yuemu-form-section">
                <div class="yuemu-input-group">
                  <label>{{ t('components.wishesBoard.qqNumber') }}</label>
                  <input
                    v-model="newWish.qq"
                    type="text"
                    class="yuemu-custom-input"
                    :placeholder="t('components.wishesBoard.placeholderGetAvatar')"
                    @blur="fetchQQInfo"
                  >
                </div>
                <div class="yuemu-input-group">
                  <label>{{ t('components.wishesBoard.exclusiveNickname') }}</label>
                  <input
                    v-model="newWish.nickname"
                    type="text"
                    class="yuemu-custom-input"
                    :placeholder="t('components.wishesBoard.placeholderEnterNickname')"
                  >
                </div>
                <div class="yuemu-input-group yuemu-textarea-group">
                  <label>{{ t('components.wishesBoard.blessing') }}</label>
                  <textarea
                    v-model="newWish.content"
                    class="yuemu-custom-textarea"
                    :placeholder="t('components.wishesBoard.placeholderWriteWhatYouWant')"
                    rows="4"
                  ></textarea>
                  <button type="button" class="yuemu-random-btn" @click="getRandomText" :title="t('components.wishesBoard.randomWord')">
                    <i class="fas fa-magic"></i>
                  </button>
                </div>
              </div>
            </div>

            <div class="yuemu-custom-modal-footer">
              <button class="yuemu-modal-btn yuemu-cancel" @click="closeModal">{{ t('components.wishesBoard.cancelBtn') }}</button>
              <button
                class="yuemu-modal-btn yuemu-submit"
                :class="{ 'yuemu-submitting': publishing }"
                @click="handlePublish"
                :disabled="!newWish.content.trim() || publishing"
              >
                <i v-if="!publishing" class="fas fa-rocket"></i>
                <i v-else class="fas fa-circle-notch fa-spin"></i>
                {{ publishing ? t('components.wishesBoard.launching') : t('components.wishesBoard.launchWish') }}
              </button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>

    <Teleport to="body">
      <transition name="yuemu-modal-fade">
        <div v-if="showDeleteConfirm" class="yuemu-custom-modal-overlay" @click.self="cancelDelete">
          <div class="yuemu-custom-modal-container yuemu-mini-confirm">
            <div class="yuemu-confirm-content">
              <div class="yuemu-confirm-icon"><i class="fas fa-exclamation-triangle"></i></div>
              <div class="yuemu-confirm-title">{{ t('components.wishesBoard.confirmEraseMemory') }}</div>
              <p class="yuemu-confirm-desc">{{ t('components.wishesBoard.irreversibleDeletionWarning') }}</p>
            </div>
            <div class="yuemu-custom-modal-footer yuemu-confirm-footer">
              <button class="yuemu-modal-btn yuemu-cancel" @click="cancelDelete">{{ t('components.wishesBoard.thinkAgain') }}</button>
              <button class="yuemu-modal-btn yuemu-danger" @click="confirmDelete">{{ t('components.wishesBoard.confirmDeleteBtn') }}</button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import {
  addMessageUsingPost,
  listMessagesByPageUsingGet,
  deleteMessageUsingDelete,
  likeMessageUsingPost,
} from '@/api/messageBoardController'
import { formatTime } from '@/utils/dateUtils'

interface Wish extends API.MessageBoard {
  isLiked?: boolean;
}

const props = defineProps<{
  ownerId: number
  isOwner: boolean
}>()

const wishes = ref<Wish[]>([])
const showModal = ref(false)
const publishing = ref(false)
const newWish = ref({ content: '', nickname: '', qq: '' })
const location = ref('')
const showDeleteConfirm = ref(false)
const wishToDelete = ref<Wish | null>(null)
const isAvatarLoaded = ref<Record<number, boolean>>({})

const showPublishModal = () => {
  showModal.value = true
  document.body.style.overflow = 'hidden'
}

const closeModal = () => {
  showModal.value = false
  document.body.style.overflow = ''
  newWish.value = { content: '', nickname: '', qq: '' }
}

const fetchQQInfo = async () => {
  const qq = newWish.value.qq
  if (!qq || !/^\d{6,10}$/.test(qq)) return
  try {
    const response = await fetch(`https://jkapi.com/api/qqinfo?qq=${qq}`)
    const data = await response.json()
    if (data.code === 200) newWish.value.nickname = data.nick
  } catch (e) {
    console.error('QQ服务异常')
  }
}

const handlePublish = async () => {
  if (!newWish.value.qq || !newWish.value.nickname || !newWish.value.content.trim()) return
  publishing.value = true
  try {
    const res = await addMessageUsingPost({
      ...newWish.value,
      location: location.value,
      ownerId: props.ownerId
    })
    if (res.data.code === 0) {
      closeModal()
      loadMessages()
      message.success(t('components.wishesBoard.wishDeliveredSuccessfully'))
    }
  } finally {
    publishing.value = false
  }
}

const loadMessages = async () => {
  try {
    const res = await listMessagesByPageUsingGet({ ownerId: props.ownerId, current: 1, size: 50 })
    if (res.data.code === 0) wishes.value = res.data.data.records || []
  } catch (e) {}
}

const handleLike = async (wish: Wish) => {
  if (!wish.id) return
  try {
    const res = await likeMessageUsingPost({ id: wish.id })
    if (res.data.code === 0) {
      wish.isLiked = !wish.isLiked
      wish.likeCount = (wish.likeCount || 0) + (wish.isLiked ? 1 : -1)
    }
  } catch (e) {}
}

const handleDelete = (wish: Wish) => {
  showDeleteConfirm.value = true
  wishToDelete.value = wish
}

const cancelDelete = () => {
  showDeleteConfirm.value = false
  wishToDelete.value = null
}

const confirmDelete = async () => {
  if (!wishToDelete.value?.id) return
  const res = await deleteMessageUsingDelete({ id: wishToDelete.value.id, ownerId: props.ownerId })
  if (res.data.code === 0) {
    wishes.value = wishes.value.filter(item => item.id !== wishToDelete.value?.id)
    message.success(t('components.wishesBoard.recordSafelyRemoved'))
  }
  cancelDelete()
}

const handleAvatarLoad = (id: number) => { isAvatarLoaded.value[id] = true }

const getRandomText = async () => {
  try {
    const res = await fetch('https://v1.hitokoto.cn').then(r => r.json())
    newWish.value.content = res.hitokoto
  } catch (e) {}
}

onMounted(() => {
  loadMessages()
  location.value = '中国' // 这里可以接入真实定位逻辑
})
</script>

<style scoped>
.yuemu-wishes-board {
  width: 100%; max-width: 1200px; margin: 0 auto;
}

.yuemu-glass-panel {
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  backdrop-filter: blur(10px);
}

.yuemu-board-top-bar {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;
}

.yuemu-stats-highlight {
  color: var(--wishes-like-color); font-size: 24px; font-weight: bold;
}

.yuemu-publish-trigger-btn {
  background: var(--wishes-button-gradient); color: #fff; border: none;
  padding: 12px 28px; border-radius: 30px; font-weight: 600; cursor: pointer;
  display: flex; align-items: center; gap: 8px; transition: 0.3s;
}

.yuemu-publish-trigger-btn:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(0,0,0,0.1); }

.yuemu-messages-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px;
}

.yuemu-message-card {
  position: relative; overflow: hidden; transition: 0.3s;
}

.yuemu-message-card:hover { transform: translateY(-5px); }

.yuemu-card-gradient-bg {
  position: absolute; top: 0; left: 0; right: 0; height: 6px; opacity: 0.8;
  background: linear-gradient(90deg, #A1C4FD, #C2E9FB);
}

.yuemu-message-content-wrap { padding: 24px; }

.yuemu-user-info { display: flex; align-items: center; gap: 12px; }

.yuemu-avatar {
  width: 44px; height: 44px; border-radius: 50%; object-fit: cover;
  border: 2px solid var(--border-color); transition: 0.5s;
}

.yuemu-nickname { font-weight: 600; color: var(--text-primary); }

.yuemu-location, .yuemu-message-time { font-size: 12px; color: var(--text-secondary); }

.yuemu-message-text {
  margin: 16px 0 20px; line-height: 1.6; color: var(--text-primary);
  white-space: pre-wrap; word-break: break-all;
}

.yuemu-message-footer {
  display: flex; justify-content: flex-end; gap: 12px;
  padding-top: 16px; border-top: 1px dashed var(--border-color);
}

.yuemu-action-btn {
  background: transparent; border: none; cursor: pointer;
  display: flex; align-items: center; gap: 6px; font-size: 14px;
  color: var(--text-secondary); transition: 0.2s;
}

.yuemu-like-btn.yuemu-liked { color: var(--wishes-like-color); }

.yuemu-empty-state { text-align: center; padding: 60px 20px; grid-column: 1/-1; }
.yuemu-empty-icon { font-size: 64px; margin-bottom: 16px; color: var(--text-secondary); opacity: 0.5; }

/* 弹窗系统 */
.yuemu-custom-modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 9999;
  display: flex; justify-content: center; align-items: center;
}

.yuemu-custom-modal-container {
  background: var(--card-background); width: 100%; max-width: 480px;
  border-radius: 24px; border: 1px solid var(--border-color); overflow: hidden;
}

.yuemu-mini-confirm { max-width: 320px; }

.yuemu-custom-modal-header {
  padding: 20px 24px; display: flex; justify-content: space-between; align-items: center;
  border-bottom: 1px solid var(--border-color);
}

.yuemu-close-btn { background: none; border: none; font-size: 20px; color: var(--text-secondary); cursor: pointer; }

.yuemu-custom-modal-body { padding: 24px; }

.yuemu-user-preview-section {
  display: flex; align-items: center; gap: 16px; padding: 16px;
  margin-bottom: 24px; background: var(--hover-background);
}

.yuemu-preview-avatar { width: 56px; height: 56px; border-radius: 50%; border: 2px solid #fff; }

.yuemu-input-group { margin-bottom: 20px; }
.yuemu-input-group label { display: block; margin-bottom: 8px; font-size: 14px; }

.yuemu-custom-input, .yuemu-custom-textarea {
  width: 100%; padding: 12px; border-radius: 12px; border: 1px solid var(--border-color);
  background: var(--background); color: var(--text-primary);
}

.yuemu-textarea-group { position: relative; }
.yuemu-random-btn {
  position: absolute; right: 10px; bottom: 10px; background: var(--card-background);
  border: 1px solid var(--border-color); border-radius: 50%; width: 32px; height: 32px; cursor: pointer;
}

.yuemu-custom-modal-footer { padding: 16px 24px; display: flex; justify-content: flex-end; gap: 12px; border-top: 1px solid var(--border-color); }

.yuemu-modal-btn { padding: 10px 24px; border-radius: 20px; border: none; cursor: pointer; font-weight: 500; }
.yuemu-modal-btn.yuemu-cancel { background: var(--hover-background); color: var(--text-secondary); }
.yuemu-modal-btn.yuemu-submit { background: var(--wishes-button-gradient); color: #fff; }
.yuemu-modal-btn.yuemu-danger { background: #ff4d4f; color: #fff; }

.yuemu-confirm-content { text-align: center; padding: 20px; }
.yuemu-confirm-icon { font-size: 48px; color: #ff4d4f; margin-bottom: 12px; }

@media (max-width: 768px) {
  .yuemu-messages-grid { grid-template-columns: 1fr; }
  .yuemu-custom-modal-container { max-width: 100%; border-radius: 24px 24px 0 0; align-self: flex-end; }
}

/* 移动端强制移除点击时的悬停缩放，防止底层长按死锁 */
@media (max-width: 768px) {
  .ant-card-hoverable:active, .ant-card-hoverable:hover,
  .ant-card-hoverable:active *, .ant-card-hoverable:hover *,
  .yuemu-message-card:active, .yuemu-message-card:hover,
  .yuemu-message-card:active *, .yuemu-message-card:hover *,
  .yuemu-publish-trigger-btn:active, .yuemu-publish-trigger-btn:hover,
  .yuemu-publish-trigger-btn:active *, .yuemu-publish-trigger-btn:hover * {
    transform: none !important;
  }
}
</style>
