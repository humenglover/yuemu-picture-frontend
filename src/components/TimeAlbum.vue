<template>
  <div class="yuemu-time-album-container">
    <div class="yuemu-album-header">
      <h2 class="yuemu-album-title">{{ t('components.timeAlbum.cherishedMemories') }}</h2>
      <button v-if="props.isOwner" class="yuemu-create-album-btn" @click="showCreateModal = true">
        <span class="yuemu-btn-icon"><i class="fas fa-sparkles"></i></span>
        <span class="yuemu-btn-text">{{ t('components.timeAlbum.createAlbum') }}</span>
      </button>
    </div>

    <div class="yuemu-album-grid">
      <div v-if="albums.length === 0" class="yuemu-empty-state">
        <div class="yuemu-empty-icon"><i class="fas fa-images"></i></div>
        <h3>{{ t('components.timeAlbum.noTimeAlbum') }}</h3>
        <p v-if="props.isOwner">{{ t('components.timeAlbum.clickToCreateFirstAlbum') }}</p>
        <p v-else>{{ t('components.timeAlbum.ownerHasNoAlbumYet') }}</p>
      </div>
      <div v-else v-for="album in albums" :key="album.id" class="yuemu-album-card" :data-is-owner="props.isOwner" @click="handleAlbumClick(album)">
        <div class="yuemu-album-cover">
          <div class="yuemu-image-skeleton" v-if="!album.imageLoaded"></div>
          <img :src="album.coverUrl || '/default-album-cover.png'" :alt="album.albumName" @load="handleImageLoad(album)" :class="{ 'yuemu-image-loaded': album.imageLoaded }">

          <div v-if="album.isPublic === 0" class="yuemu-private-badge">
            <span class="yuemu-private-icon"><i class="fas fa-lock"></i></span>
          </div>

          <button v-if="props.isOwner" class="yuemu-delete-btn" @click.stop="showDeleteConfirm(album)">
            <span class="yuemu-delete-icon"><i class="fas fa-times"></i></span>
          </button>
        </div>

        <div class="yuemu-album-info">
          <h3 class="yuemu-info-title">{{ album.albumName }}</h3>
          <p class="yuemu-info-desc">{{ album.description || t('components.timeAlbum.noAlbumDesc') }}</p>

          <div class="yuemu-album-footer">
            <span class="yuemu-album-date"><i class="fas fa-calendar-day"></i> {{ formatDate(album.createTime) }}</span>
            <div class="yuemu-album-actions" v-if="props.isOwner">
              <button class="yuemu-action-text-btn" @click.stop="handleEditClick(album)">{{ t('components.timeAlbum.editBtn') }}</button>
              <button class="yuemu-action-text-btn" @click.stop="handlePasswordManageClick(album)">
                {{ album.isPublic === 1 ? t('components.timeAlbum.setPassword') : t('components.timeAlbum.password') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <a-modal v-model:open="showCreateModal" :title="t('components.timeAlbum.createNewAlbum')" :footer="null" :closable="true" @cancel="showCreateModal = false" width="480px" class="yuemu-apple-modal" centered>
      <form class="yuemu-modal-form" @submit.prevent="handleCreateAlbum">
        <div class="yuemu-form-item">
          <label>{{ t('components.timeAlbum.albumName') }}</label>
          <input type="text" class="yuemu-input-base" v-model="newAlbum.albumName" :placeholder="t('components.timeAlbum.placeholderAlbumName')" required>
        </div>
        <div class="yuemu-form-item">
          <label>{{ t('components.timeAlbum.albumDesc') }}</label>
          <textarea class="yuemu-input-base" v-model="newAlbum.description" rows="3" :placeholder="t('components.timeAlbum.placeholderAlbumDesc')"></textarea>
        </div>
        <div class="yuemu-form-item">
          <label>{{ t('components.timeAlbum.accessSettings') }}</label>
          <div class="yuemu-switch-wrapper" @click="newAlbum.isPublic = newAlbum.isPublic === 1 ? 0 : 1">
            <div class="yuemu-apple-switch" :class="{ 'is-on': newAlbum.isPublic === 1 }"><div class="yuemu-switch-dot"></div></div>
            <span class="yuemu-switch-label">{{ newAlbum.isPublic === 1 ? t('components.timeAlbum.publicAccess') : t('components.timeAlbum.privateProtection') }}</span>
          </div>
        </div>
        <div class="yuemu-form-item" v-if="newAlbum.isPublic === 0">
          <label>{{ t('components.timeAlbum.accessPassword') }}</label>
          <input type="password" class="yuemu-input-base" v-model="newAlbum.password" :placeholder="t('components.timeAlbum.placeholderSetAccessPassword')" :required="newAlbum.isPublic === 0">
        </div>
        <div class="yuemu-form-item">
          <label>{{ t('components.timeAlbum.coverImage') }}</label>
          <div class="yuemu-upload-wrapper" @click="handleUploadCover">
            <div class="yuemu-image-preview">
              <img v-if="newAlbum.coverUrl" :src="newAlbum.coverUrl" :alt="t('components.timeAlbum.coverPreview')">
              <div v-else-if="isUploading" class="yuemu-upload-loading">
                <i class="fas fa-spinner fa-spin"></i><span>{{ t('components.timeAlbum.uploading') }}</span>
              </div>
              <div v-else class="yuemu-upload-placeholder">
                <i class="fas fa-image"></i><div>{{ t('components.timeAlbum.clickToUploadCover') }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="yuemu-modal-footer">
          <button type="button" class="yuemu-btn-cancel" @click="showCreateModal = false">{{ t('components.timeAlbum.cancel') }}</button>
          <button type="submit" class="yuemu-btn-primary-gradient">{{ t('components.timeAlbum.createAlbum') }}</button>
        </div>
      </form>
    </a-modal>

    <a-modal v-model:open="showDeleteModal" :title="null" :footer="null" :width="360" class="yuemu-apple-modal" centered>
      <div class="yuemu-confirm-content">
        <div class="yuemu-icon-warning"><i class="fas fa-exclamation-circle"></i></div>
        <h3 class="yuemu-confirm-title">{{ t('components.timeAlbum.confirmDeleteAlbum', { name: selectedAlbum?.albumName }) }}</h3>
        <p class="yuemu-confirm-desc">{{ t('components.timeAlbum.deleteAlbumWarning') }}</p>
        <div class="yuemu-confirm-actions">
          <button class="yuemu-action-cancel" @click="showDeleteModal = false">{{ t('components.timeAlbum.cancel') }}</button>
          <button class="yuemu-action-danger" @click="confirmDelete">{{ t('components.timeAlbum.deleteBtn') }}</button>
        </div>
      </div>
    </a-modal>

    <a-modal v-model:open="showPasswordModal" :title="t('components.timeAlbum.privateAccessVerification')" :footer="null" class="yuemu-apple-modal" centered width="360px">
      <form class="yuemu-modal-form" @submit.prevent="handlePasswordSubmit">
        <div class="yuemu-form-item">
          <label>{{ t('components.timeAlbum.accessPassword') }}</label>
          <input type="password" class="yuemu-input-base" v-model="passwordInput" :placeholder="t('components.timeAlbum.placeholderEnterAlbumPassword')" required ref="passwordInputRef">
        </div>
        <div class="yuemu-modal-footer">
          <button type="button" class="yuemu-btn-cancel" @click="showPasswordModal = false">{{ t('components.timeAlbum.cancel') }}</button>
          <button type="submit" class="yuemu-btn-primary-gradient">{{ t('components.timeAlbum.verifyBtn') }}</button>
        </div>
      </form>
    </a-modal>

    <a-modal v-model:open="showPasswordManageModal" :title="t('components.timeAlbum.passwordManagement')" :footer="null" class="yuemu-apple-modal" centered width="400px">
      <div class="yuemu-modal-form">
        <div v-if="selectedAlbum?.isPublic === 1">
          <div class="yuemu-form-item">
            <label>{{ t('components.timeAlbum.setNewPassword') }}</label>
            <input type="password" class="yuemu-input-base" v-model="passwordForm.newPassword" :placeholder="t('components.timeAlbum.placeholderSetPwdToPrivate')" required>
          </div>
        </div>
        <div v-else>
          <div class="yuemu-password-actions">
            <button class="yuemu-action-btn" :class="{active: currentAction === 'update'}" @click="currentAction = 'update'">
              <i class="fas fa-sync-alt"></i>{{ t('components.timeAlbum.changePassword') }}
            </button>
            <button class="yuemu-action-btn" :class="{active: currentAction === 'remove'}" @click="currentAction = 'remove'">
              <i class="fas fa-trash-alt"></i>{{ t('components.timeAlbum.cancelPassword') }}
            </button>
          </div>
          <div v-if="currentAction === 'update'" class="yuemu-form-item">
            <label>{{ t('components.timeAlbum.oldPassword') }}</label>
            <input type="password" class="yuemu-input-base" v-model="passwordForm.oldPassword" :placeholder="t('components.timeAlbum.placeholderOldPwd')" required style="margin-bottom: 12px;">
            <label>{{ t('components.timeAlbum.newPassword') }}</label>
            <input type="password" class="yuemu-input-base" v-model="passwordForm.newPassword" :placeholder="t('components.timeAlbum.placeholderNewPwd')" required>
          </div>
          <div v-if="currentAction === 'remove'" class="yuemu-form-item">
            <label>{{ t('components.timeAlbum.oldPassword') }}</label>
            <input type="password" class="yuemu-input-base" v-model="passwordForm.oldPassword" :placeholder="t('components.timeAlbum.placeholderOldPwd')" required>
            <p class="yuemu-warning-text"><i class="fas fa-info-circle"></i> {{ t('components.timeAlbum.cancelPwdWarning') }}</p>
          </div>
        </div>
        <div class="yuemu-modal-footer">
          <button class="yuemu-btn-cancel" @click="showPasswordManageModal = false">{{ t('components.timeAlbum.cancel') }}</button>
          <button class="yuemu-btn-primary-gradient" @click="handlePasswordManage">{{ t('components.timeAlbum.confirm') }}</button>
        </div>
      </div>
    </a-modal>

    <a-modal v-model:open="showEditModal" :title="t('components.timeAlbum.editAlbum')" :footer="null" class="yuemu-apple-modal" centered width="480px">
      <form class="yuemu-modal-form" @submit.prevent="handleEditAlbum">
        <div class="yuemu-form-item">
          <label>{{ t('components.timeAlbum.albumName') }}</label>
          <input type="text" class="yuemu-input-base" v-model="editAlbum.albumName" :placeholder="t('components.timeAlbum.placeholderAlbumName')" required>
        </div>
        <div class="yuemu-form-item">
          <label>{{ t('components.timeAlbum.albumDesc') }}</label>
          <textarea class="yuemu-input-base" v-model="editAlbum.description" rows="3" :placeholder="t('components.timeAlbum.placeholderAlbumDesc')"></textarea>
        </div>
        <div class="yuemu-form-item">
          <label>{{ t('components.timeAlbum.coverImage') }}</label>
          <div class="yuemu-upload-wrapper" @click="handleEditCoverUpload">
            <div class="yuemu-image-preview">
              <img v-if="editAlbum.coverUrl" :src="editAlbum.coverUrl" :alt="t('components.timeAlbum.coverPreview')">
              <div v-else-if="isUploading" class="yuemu-upload-loading"><i class="fas fa-spinner fa-spin"></i><span>{{ t('components.timeAlbum.uploading') }}</span></div>
              <div v-else class="yuemu-upload-placeholder"><i class="fas fa-image"></i><div>{{ t('components.timeAlbum.clickToChangeCover') }}</div></div>
            </div>
          </div>
        </div>
        <div class="yuemu-modal-footer">
          <button type="button" class="yuemu-btn-cancel" @click="showEditModal = false">{{ t('components.timeAlbum.cancel') }}</button>
          <button type="submit" class="yuemu-btn-primary-gradient">{{ t('components.timeAlbum.saveChanges') }}</button>
        </div>
      </form>
    </a-modal>

    <input type="file" ref="fileInput" style="display: none" accept="image/*" @change="handleFileChange">
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

/* ... JavaScript 逻辑保持与你原版完全一致 ... */
import { ref, onMounted, defineProps, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import dayjs from 'dayjs'
import { addTimeAlbumUsingPost, listTimeAlbumUsingGet, deleteTimeAlbumUsingPost, getTimeAlbumByIdUsingGet, setAlbumPasswordUsingPost, updateAlbumPasswordUsingPost, removeAlbumPasswordUsingPost, updateTimeAlbumUsingPost } from '@/api/timeAlbumController'
import { uploadPostImageUsingPost } from '@/api/pictureController'
import { message } from 'ant-design-vue'

interface TimeAlbum { id: number; albumName: string; description?: string; coverUrl?: string; createTime: string; isPublic: number; imageLoaded?: boolean; }
const router = useRouter()
const route = useRoute()
const props = defineProps<{ loveBoardId: string, isOwner?: boolean }>()
const albums = ref<TimeAlbum[]>([])
const showCreateModal = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const showDeleteModal = ref(false)
const selectedAlbum = ref<TimeAlbum | null>(null)
const showPasswordModal = ref(false)
const passwordInput = ref('')
const passwordInputRef = ref<HTMLInputElement | null>(null)
const selectedPrivateAlbum = ref<TimeAlbum | null>(null)
const showPasswordManageModal = ref(false)
const passwordForm = ref({ oldPassword: '', newPassword: '' })
const currentAction = ref('')
const showEditModal = ref(false)
const editAlbum = ref<TimeAlbum>({ id: 0, albumName: '', description: '', coverUrl: '', isPublic: 1, createTime: '' })
const newAlbum = ref({ albumName: '', description: '', coverUrl: '', isPublic: 1, password: '' })
const isUploading = ref(false)

const formatDate = (date: string) => dayjs(date).format('YYYY-MM-DD')
const fetchAlbums = async () => { try { const res = await listTimeAlbumUsingGet({ current: 1, pageSize: 20, loveBoardId: props.loveBoardId }); if (res.data.code === 0) { const loadedStates = new Map(albums.value.map(album => [album.id, album.imageLoaded])); albums.value = res.data.data.records.map(album => ({ ...album, imageLoaded: loadedStates.get(album.id) || false })) } } catch (error) {} }
const handleAlbumClick = (album: TimeAlbum) => { if (album.isPublic === 0) { selectedPrivateAlbum.value = album; showPasswordModal.value = true; nextTick(() => passwordInputRef.value?.focus()) } else { router.push(`/time-album/${album.id}?isOwner=${props.isOwner}`) } }
const showDeleteConfirm = (album: TimeAlbum) => { selectedAlbum.value = album; showDeleteModal.value = true }
const confirmDelete = async () => { if (!selectedAlbum.value) return; try { const res = await deleteTimeAlbumUsingPost({ id: selectedAlbum.value.id, loveBoardId: props.loveBoardId }); if (res.data.code === 0) { albums.value = albums.value.filter(item => item.id !== selectedAlbum.value?.id); message.success(t('components.timeAlbum.deleteSuccess')) } } catch (error) { message.error(t('components.timeAlbum.deleteAlbumFailed')) } showDeleteModal.value = false; selectedAlbum.value = null }
const handleFileChange = async (event: Event) => { const target = event.target as HTMLInputElement; if (target.files && target.files[0]) { const file = target.files[0]; try { isUploading.value = true; const res = await uploadPostImageUsingPost({}, {}, file); if (res.data.code === 0) { if (showEditModal.value) { editAlbum.value.coverUrl = res.data.data.url } else { newAlbum.value.coverUrl = res.data.data.url } } } catch (error: any) { message.error(t('components.timeAlbum.uploadImageFailed')) } finally { isUploading.value = false } if (fileInput.value) fileInput.value.value = '' } }
const handleUploadCover = () => fileInput.value?.click()
const handleCreateAlbum = async () => { try { const res = await addTimeAlbumUsingPost({ loveBoardId: props.loveBoardId }, newAlbum.value); if (res.data.code === 0) { showCreateModal.value = false; newAlbum.value = { albumName: '', description: '', coverUrl: '', isPublic: 1, password: '' }; await fetchAlbums() } } catch (error) {} }
const handlePasswordSubmit = async () => { if (!selectedPrivateAlbum.value) return; try { const res = await getTimeAlbumByIdUsingGet({ id: selectedPrivateAlbum.value.id, password: passwordInput.value }); if (res.data.code === 0) { sessionStorage.setItem(`album_${selectedPrivateAlbum.value.id}_password`, passwordInput.value); router.push(`/time-album/${selectedPrivateAlbum.value.id}?isOwner=${props.isOwner}`); showPasswordModal.value = false; passwordInput.value = ''; selectedPrivateAlbum.value = null } else { message.error(t('components.timeAlbum.wrongPassword')); passwordInput.value = ''; nextTick(() => passwordInputRef.value?.focus()) } } catch (error) { message.error(t('components.timeAlbum.verificationFailed')) } }
const handleImageLoad = (album: TimeAlbum) => { const targetAlbum = albums.value.find(a => a.id === album.id); if (targetAlbum) targetAlbum.imageLoaded = true }
const handlePasswordManageClick = (album: TimeAlbum) => { selectedAlbum.value = album; showPasswordManageModal.value = true; currentAction.value = album.isPublic === 1 ? 'set' : ''; passwordForm.value = { oldPassword: '', newPassword: '' } }
const handlePasswordManage = async () => { if (!selectedAlbum.value) return; try { let res; if (selectedAlbum.value.isPublic === 1) { res = await setAlbumPasswordUsingPost({ albumId: selectedAlbum.value.id, newPassword: passwordForm.value.newPassword }) } else if (currentAction.value === 'update') { res = await updateAlbumPasswordUsingPost({ albumId: selectedAlbum.value.id, oldPassword: passwordForm.value.oldPassword, newPassword: passwordForm.value.newPassword }) } else if (currentAction.value === 'remove') { res = await removeAlbumPasswordUsingPost({ albumId: selectedAlbum.value.id, oldPassword: passwordForm.value.oldPassword }) } if (res?.data.code === 0) { message.success(t('components.timeAlbum.operationSuccess')); await fetchAlbums(); showPasswordManageModal.value = false; selectedAlbum.value = null } else { message.error(res?.data?.message || t('components.timeAlbum.operationFailed')) } } catch (error) { message.error(t('components.timeAlbum.operationError')) } }
const handleEditClick = (album: TimeAlbum) => { editAlbum.value = { ...album }; showEditModal.value = true }
const handleEditCoverUpload = () => fileInput.value?.click()
const handleEditAlbum = async () => { try { const res = await updateTimeAlbumUsingPost({ loveBoardId: props.loveBoardId }, { ...editAlbum.value }); if (res.data.code === 0) { message.success(t('components.timeAlbum.updateSuccess')); showEditModal.value = false; await fetchAlbums() } } catch (error) { message.error(t('components.timeAlbum.updateFailed')) } }
watch(() => props.loveBoardId, (val) => { if (val) fetchAlbums() }, { immediate: true })
defineExpose({ showCreateModal, fetchAlbums })
</script>

<style scoped>
/* ==================== 1. 基础全局配置 ==================== */
.yuemu-time-album-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px;
  color: var(--text-primary);
}

.yuemu-album-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.yuemu-album-title { font-size: 22px; font-weight: 800; color: var(--text-primary); margin: 0; }

.yuemu-create-album-btn {
  display: flex; align-items: center; gap: 6px; padding: 8px 16px;
  background: var(--link-color); color: #fff; border: none; border-radius: 12px;
  font-size: 14px; font-weight: 600; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 12px rgba(var(--link-color-rgb), 0.3);
}
.yuemu-create-album-btn:hover { filter: brightness(1.1); transform: translateY(-2px); }

/* ==================== 2. 网格与卡片 (时光相册) ==================== */
.yuemu-album-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.yuemu-album-card {
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 4px 16px var(--shadow-color);
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s;
  display: flex; flex-direction: column;
}
.yuemu-album-card:hover { transform: translateY(-6px); box-shadow: 0 12px 24px var(--shadow-color); border-color: var(--link-color); }

.yuemu-album-cover { width: 100%; aspect-ratio: 4 / 3; position: relative; overflow: hidden; background: #000; }
.yuemu-album-cover img { width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity 0.5s; }
.yuemu-album-cover img.yuemu-image-loaded { opacity: 1; }

.yuemu-image-skeleton {
  position: absolute; inset: 0;
  background: linear-gradient(90deg, var(--hover-background) 25%, var(--border-color) 50%, var(--hover-background) 75%);
  background-size: 200% 100%; animation: yuemu-shimmer 1.5s infinite linear;
}
@keyframes yuemu-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }

.yuemu-album-info { padding: 16px; flex: 1; display: flex; flex-direction: column; }
.yuemu-info-title { font-size: 17px; font-weight: 700; color: var(--text-primary); margin: 0 0 6px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.yuemu-info-desc { font-size: 13px; color: var(--text-secondary); margin: 0 0 12px 0; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

.yuemu-album-footer { display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 12px; border-top: 1px solid var(--border-color); }
.yuemu-album-date { font-size: 12px; color: var(--text-secondary); display: flex; align-items: center; gap: 4px; }

/* 角标与悬浮按钮 */
.yuemu-private-badge {
  position: absolute; top: 12px; left: 12px; width: 32px; height: 32px; border-radius: 50%;
  background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 14px;
}

.yuemu-delete-btn {
  position: absolute; top: 12px; right: 12px; width: 32px; height: 32px; border-radius: 50%; border: none;
  background: rgba(0,0,0,0.6); color: #fff; display: flex; align-items: center; justify-content: center;
  cursor: pointer; opacity: 0; transform: scale(0.8); transition: 0.2s; z-index: 10;
}
.yuemu-album-card:hover .yuemu-delete-btn { opacity: 1; transform: scale(1); }
.yuemu-delete-btn:hover { background: #ef4444; }

.yuemu-album-actions { display: flex; gap: 8px; }
.yuemu-action-text-btn { background: var(--hover-background); color: var(--text-primary); border: 1px solid var(--border-color); padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer; transition: 0.2s; }
.yuemu-action-text-btn:hover { border-color: var(--link-color); color: var(--link-color); }

.yuemu-empty-state { grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; color: var(--text-secondary); border-radius: 16px; border: 1px dashed var(--border-color); }
.yuemu-empty-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.5; }

/* ==================== 3. 弹窗与表单通用适配 ==================== */
/* 复用上方设计 */
:deep(.yuemu-apple-modal .ant-modal-content) { background: var(--card-background); border-radius: 20px; padding: 0; overflow: hidden; border: 1px solid var(--border-color); }
:deep(.yuemu-apple-modal .ant-modal-header) { background: var(--card-background); padding: 20px 24px; border-bottom: 1px solid var(--border-color); }
:deep(.yuemu-apple-modal .ant-modal-title) { font-weight: 700; font-size: 18px; text-align: center; color: var(--text-primary); }
:deep(.yuemu-apple-modal .ant-modal-close) { color: var(--text-secondary); }

.yuemu-modal-form { padding: 24px; }
.yuemu-form-item { margin-bottom: 16px; }
.yuemu-form-item label { display: block; font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 8px; }

.yuemu-input-base {
  width: 100%; padding: 12px; background: var(--hover-background); border: 1px solid var(--border-color);
  border-radius: 12px; color: var(--text-primary); font-size: 14px; outline: none; transition: 0.2s; box-sizing: border-box;
}
.yuemu-input-base:focus { border-color: var(--link-color); }
.yuemu-input-base::placeholder { color: var(--text-secondary); opacity: 0.6; }
textarea.yuemu-input-base { resize: vertical; min-height: 80px; }

/* 苹果级 Switch */
.yuemu-switch-wrapper { display: flex; align-items: center; gap: 12px; background: var(--hover-background); padding: 12px 16px; border-radius: 12px; cursor: pointer; border: 1px solid transparent; transition: 0.2s; }
.yuemu-switch-wrapper:active { border-color: var(--border-color); }
.yuemu-apple-switch { width: 46px; height: 24px; background: var(--border-color); border-radius: 20px; position: relative; transition: 0.3s; }
.yuemu-apple-switch.is-on { background: #34c759; }
.yuemu-switch-dot { width: 20px; height: 20px; background: #fff; border-radius: 50%; position: absolute; top: 2px; left: 2px; transition: 0.3s cubic-bezier(0.25, 0.1, 0.25, 1); box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
.yuemu-apple-switch.is-on .yuemu-switch-dot { transform: translateX(22px); }
.yuemu-switch-label { color: var(--text-primary); font-weight: 500; font-size: 14px; }

/* 上传框 */
.yuemu-upload-wrapper { border: 1px dashed var(--border-color); border-radius: 12px; padding: 4px; background: var(--hover-background); cursor: pointer; transition: 0.2s; }
.yuemu-upload-wrapper:hover { border-color: var(--link-color); }
.yuemu-image-preview { position: relative; width: 100%; height: 160px; border-radius: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center; }
.yuemu-image-preview img { width: 100%; height: 100%; object-fit: cover; }
.yuemu-upload-placeholder, .yuemu-upload-loading { display: flex; flex-direction: column; align-items: center; gap: 8px; color: var(--text-secondary); font-size: 14px; }
.yuemu-upload-placeholder i { font-size: 24px; }

.yuemu-modal-footer { display: flex; gap: 12px; margin-top: 32px; }
.yuemu-btn-cancel { flex: 1; padding: 12px; background: transparent; border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 12px; font-weight: 600; cursor: pointer; transition: 0.2s; }
.yuemu-btn-cancel:hover { background: var(--hover-background); }
.yuemu-btn-primary-gradient { flex: 2; padding: 12px; border: none; background: linear-gradient(135deg, var(--link-color), var(--link-hover-color)); color: #fff; border-radius: 12px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(var(--link-color-rgb), 0.3); transition: 0.2s; }
.yuemu-btn-primary-gradient:hover { filter: brightness(1.1); }

.yuemu-confirm-content { text-align: center; padding: 24px; }
.yuemu-icon-warning { font-size: 48px; color: #ef4444; margin-bottom: 16px; }
.yuemu-confirm-title { font-size: 18px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px; }
.yuemu-confirm-desc { font-size: 13px; color: var(--text-secondary); margin-bottom: 24px; }
.yuemu-confirm-actions { display: flex; border-top: 1px solid var(--border-color); margin: 0 -24px -24px; }
.yuemu-action-cancel, .yuemu-action-danger { flex: 1; height: 50px; background: transparent; border: none; font-size: 16px; font-weight: 600; cursor: pointer; transition: 0.2s; }
.yuemu-action-cancel { color: var(--text-primary); border-right: 1px solid var(--border-color); }
.yuemu-action-danger { color: #ef4444; }
.yuemu-action-cancel:hover, .yuemu-action-danger:hover { background: var(--hover-background); }

.yuemu-password-actions { display: flex; gap: 12px; margin-bottom: 20px; }
.yuemu-action-btn { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 16px; background: var(--hover-background); border: 1px solid var(--border-color); border-radius: 12px; color: var(--text-primary); cursor: pointer; transition: 0.2s; font-size: 13px; font-weight: 500; }
.yuemu-action-btn.active, .yuemu-action-btn:hover { border-color: var(--link-color); color: var(--link-color); background: rgba(var(--link-color-rgb), 0.05); }
.yuemu-action-btn i { font-size: 20px; }
.yuemu-warning-text { color: #ef4444; font-size: 12px; margin-top: 8px; display: flex; align-items: center; gap: 4px; }

/* ==================== 4. 移动端专门优化 ==================== */
@media screen and (max-width: 768px) {
  .yuemu-time-album-container { padding: 0; }
  /* 移动端时光相册采用单列流式卡片，展示更清晰的文字 */
  .yuemu-album-grid { grid-template-columns: 1fr; gap: 16px; }

  .yuemu-album-card { border-radius: 16px; }
  .yuemu-album-cover { aspect-ratio: 16 / 9; } /* 移动端封面改扁，省空间 */

  .yuemu-album-info { padding: 16px; }
  .yuemu-info-title { font-size: 16px; }
  .yuemu-info-desc { font-size: 13px; margin-bottom: 12px; }

  .yuemu-album-footer { padding-top: 12px; }
  .yuemu-album-date { font-size: 12px; }

  /* 移动端操作按钮外露，增大点击区域 */
  .yuemu-delete-btn { opacity: 1; transform: none; width: 36px; height: 36px; font-size: 14px; background: rgba(0,0,0,0.5); }
  .yuemu-action-text-btn { padding: 6px 12px; font-size: 13px; border-radius: 8px; }

  .yuemu-album-title { font-size: 18px; }
  .yuemu-create-album-btn { padding: 6px 12px; font-size: 13px; }
}

/* 移动端强制移除点击时的悬停缩放，防止底层长按死锁 */
@media (max-width: 768px) {
  .yuemu-action-cancel:active, .yuemu-action-cancel:hover,
  .yuemu-action-cancel:active *, .yuemu-action-cancel:hover *,
  .ant-card-hoverable:active, .ant-card-hoverable:hover,
  .ant-card-hoverable:active *, .ant-card-hoverable:hover *,
  .yuemu-delete-btn:active, .yuemu-delete-btn:hover,
  .yuemu-delete-btn:active *, .yuemu-delete-btn:hover *,
  .yuemu-action-btn:active, .yuemu-action-btn:hover,
  .yuemu-action-btn:active *, .yuemu-action-btn:hover *,
  .yuemu-btn-cancel:active, .yuemu-btn-cancel:hover,
  .yuemu-btn-cancel:active *, .yuemu-btn-cancel:hover *,
  .yuemu-action-danger:active, .yuemu-action-danger:hover,
  .yuemu-action-danger:active *, .yuemu-action-danger:hover *,
  .yuemu-upload-wrapper:active, .yuemu-upload-wrapper:hover,
  .yuemu-upload-wrapper:active *, .yuemu-upload-wrapper:hover *,
  .yuemu-create-album-btn:active, .yuemu-create-album-btn:hover,
  .yuemu-create-album-btn:active *, .yuemu-create-album-btn:hover *,
  .yuemu-btn-primary-gradient:active, .yuemu-btn-primary-gradient:hover,
  .yuemu-btn-primary-gradient:active *, .yuemu-btn-primary-gradient:hover *,
  .yuemu-album-card:active, .yuemu-album-card:hover,
  .yuemu-album-card:active *, .yuemu-album-card:hover *,
  .yuemu-action-text-btn:active, .yuemu-action-text-btn:hover,
  .yuemu-action-text-btn:active *, .yuemu-action-text-btn:hover * {
    transform: none !important;
  }
}
</style>
