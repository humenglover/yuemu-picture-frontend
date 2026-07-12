<template>
  <div class="yuemu-music-album-container">
    <div class="yuemu-album-header">
      <h2 class="yuemu-album-title">{{ t('components.musicAlbum.title') }}</h2>
      <button v-if="props.isOwner" class="yuemu-create-album-btn" @click="showCreateModal = true">
        <span class="yuemu-btn-icon"><i class="fas fa-music"></i></span>
        <span class="yuemu-btn-text">{{ t('components.musicAlbum.createAlbum') }}</span>
      </button>
    </div>

    <div class="yuemu-album-grid">
      <div v-if="albums.length === 0" class="yuemu-empty-state">
        <div class="yuemu-empty-icon"><i class="fas fa-compact-disc"></i></div>
        <h3>{{ t('components.musicAlbum.noAlbums') }}</h3>
        <p v-if="props.isOwner">{{ t('components.musicAlbum.clickToCreate') }}</p>
        <p v-else>{{ t('components.musicAlbum.ownerNoAlbums') }}</p>
      </div>
      <div v-else v-for="album in albums" :key="album.id" class="yuemu-album-card" :data-is-owner="props.isOwner" @click="handleAlbumClick(album)">
        <div class="yuemu-album-cover">
          <div class="yuemu-image-skeleton" v-if="!album.imageLoaded"></div>
          <img :src="album.coverUrl || '/default-album-cover.png'" :alt="album.albumName" @load="handleImageLoad(album)" :class="{ 'yuemu-image-loaded': album.imageLoaded }">

          <div class="yuemu-album-info-overlay yuemu-pc-only">
            <h3 class="yuemu-album-title-text">{{ album.albumName }}</h3>
            <span class="yuemu-album-date">{{ formatDate(album.createTime) }}</span>
          </div>

          <div v-if="album.isPublic === 0" class="yuemu-private-badge">
            <span class="yuemu-private-icon"><i class="fas fa-lock"></i></span>
          </div>

          <button v-if="props.isOwner" class="yuemu-delete-btn yuemu-pc-only" @click.stop="showDeleteConfirm(album)">
            <span class="yuemu-delete-icon"><i class="fas fa-times"></i></span>
          </button>
          <div v-if="props.isOwner" class="yuemu-album-actions yuemu-pc-only">
            <button class="yuemu-action-icon-btn" @click.stop="handleEditClick(album)">
              <i class="fas fa-pen"></i>
            </button>
            <button class="yuemu-action-icon-btn" @click.stop="handlePasswordManageClick(album)">
              <i :class="album.isPublic === 1 ? 'fas fa-lock' : 'fas fa-key'"></i>
            </button>
          </div>
        </div>

        <div class="yuemu-album-info yuemu-mobile-only">
          <h3 class="yuemu-info-title">{{ album.albumName }}</h3>
          <div class="yuemu-album-footer">
            <span class="yuemu-album-date"><i class="fas fa-calendar-day"></i> {{ formatDate(album.createTime) }}</span>
            <div class="yuemu-album-mobile-actions" v-if="props.isOwner">
              <button class="yuemu-action-text-btn" @click.stop="handleEditClick(album)">{{ t('components.musicAlbum.edit') }}</button>
              <button class="yuemu-action-text-btn" @click.stop="handlePasswordManageClick(album)">
                {{ album.isPublic === 1 ? t('components.musicAlbum.setPassword') : t('components.musicAlbum.password') }}
              </button>
              <button class="yuemu-action-text-btn yuemu-danger-text" @click.stop="showDeleteConfirm(album)">{{ t('components.musicAlbum.delete') }}</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <a-modal v-model:open="showCreateModal" :title="t('components.musicAlbum.createNewAlbumModalTitle')" :footer="null" :closable="true" @cancel="showCreateModal = false" width="480px" class="yuemu-apple-modal" centered>
      <form class="yuemu-modal-form" @submit.prevent="handleCreateAlbum">
        <div class="yuemu-form-item">
          <label>{{ t('components.musicAlbum.albumNameLabel') }}</label>
          <input type="text" class="yuemu-input-base" v-model="newAlbum.albumName" :placeholder="t('components.musicAlbum.albumNamePlaceholder')" required>
        </div>
        <div class="yuemu-form-item">
          <label>{{ t('components.musicAlbum.albumDescLabel') }}</label>
          <textarea class="yuemu-input-base" v-model="newAlbum.description" rows="3" :placeholder="t('components.musicAlbum.albumDescPlaceholder')"></textarea>
        </div>
        <div class="yuemu-form-item">
          <label>{{ t('components.musicAlbum.accessSettingsLabel') }}</label>
          <div class="yuemu-switch-wrapper" @click="newAlbum.isPublic = newAlbum.isPublic === 1 ? 0 : 1">
            <div class="yuemu-apple-switch" :class="{ 'is-on': newAlbum.isPublic === 1 }"><div class="yuemu-switch-dot"></div></div>
            <span class="yuemu-switch-label">{{ newAlbum.isPublic === 1 ? t('components.musicAlbum.publicAccess') : t('components.musicAlbum.privateProtection') }}</span>
          </div>
        </div>
        <div class="yuemu-form-item" v-if="newAlbum.isPublic === 0">
          <label>{{ t('components.musicAlbum.accessPasswordLabel') }}</label>
          <input type="password" class="yuemu-input-base" v-model="newAlbum.password" :placeholder="t('components.musicAlbum.accessPasswordPlaceholder')" :required="newAlbum.isPublic === 0">
        </div>
        <div class="yuemu-form-item">
          <label>{{ t('components.musicAlbum.coverImageLabel') }}</label>
          <div class="yuemu-upload-wrapper" @click="handleUploadCover">
            <div class="yuemu-image-preview">
              <img v-if="newAlbum.coverUrl" :src="newAlbum.coverUrl" :alt="t('components.musicAlbum.coverPreview')">
              <div v-else-if="isUploading" class="yuemu-upload-loading">
                <i class="fas fa-spinner fa-spin"></i><span>{{ t('components.musicAlbum.uploading') }}</span>
              </div>
              <div v-else class="yuemu-upload-placeholder">
                <i class="fas fa-cloud-upload-alt"></i><div>{{ t('components.musicAlbum.clickToUploadCover') }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="yuemu-modal-footer">
          <button type="button" class="yuemu-btn-cancel" @click="showCreateModal = false">{{ t('common.cancel') }}</button>
          <button type="submit" class="yuemu-btn-primary-gradient">{{ t('components.musicAlbum.createAlbum') }}</button>
        </div>
      </form>
    </a-modal>

    <a-modal v-model:open="showDeleteModal" :title="null" :footer="null" :width="360" class="yuemu-apple-modal" centered>
      <div class="yuemu-confirm-content">
        <div class="yuemu-icon-warning"><i class="fas fa-exclamation-circle"></i></div>
        <h3 class="yuemu-confirm-title">{{ t('components.musicAlbum.confirmDeleteTitle').replace('{name}', selectedAlbum?.albumName || '') }}</h3>
        <p class="yuemu-confirm-desc">{{ t('components.musicAlbum.confirmDeleteDesc') }}</p>
        <div class="yuemu-confirm-actions">
          <button class="yuemu-action-cancel" @click="showDeleteModal = false">{{ t('common.cancel') }}</button>
          <button class="yuemu-action-danger" @click="confirmDelete">{{ t('components.musicAlbum.delete') }}</button>
        </div>
      </div>
    </a-modal>

    <a-modal v-model:open="showPasswordModal" :title="t('components.musicAlbum.privateAccessValidationTitle')" :footer="null" class="yuemu-apple-modal" centered width="360px">
      <form class="yuemu-modal-form" @submit.prevent="handlePasswordSubmit">
        <div class="yuemu-form-item">
          <label>{{ t('components.musicAlbum.accessPasswordLabel') }}</label>
          <input type="password" class="yuemu-input-base" v-model="passwordInput" :placeholder="t('components.musicAlbum.enterAlbumPasswordPlaceholder')" required ref="passwordInputRef">
        </div>
        <div class="yuemu-modal-footer">
          <button type="button" class="yuemu-btn-cancel" @click="showPasswordModal = false">{{ t('common.cancel') }}</button>
          <button type="submit" class="yuemu-btn-primary-gradient">{{ t('components.musicAlbum.verifyBtn') }}</button>
        </div>
      </form>
    </a-modal>

    <a-modal v-model:open="showPasswordManageModal" :title="t('components.musicAlbum.passwordManageTitle')" :footer="null" class="yuemu-apple-modal" centered width="400px">
      <div class="yuemu-modal-form">
        <div v-if="selectedAlbum?.isPublic === 1">
          <div class="yuemu-form-item">
            <label>{{ t('components.musicAlbum.setNewPasswordLabel') }}</label>
            <input type="password" class="yuemu-input-base" v-model="passwordForm.newPassword" :placeholder="t('components.musicAlbum.setNewPasswordPlaceholder')" required>
          </div>
        </div>
        <div v-else>
          <div class="yuemu-password-actions">
            <button class="yuemu-action-btn" :class="{active: currentAction === 'update'}" @click="currentAction = 'update'">
              <i class="fas fa-sync-alt"></i>{{ t('components.musicAlbum.modifyPasswordBtn') }}
            </button>
            <button class="yuemu-action-btn" :class="{active: currentAction === 'remove'}" @click="currentAction = 'remove'">
              <i class="fas fa-trash-alt"></i>{{ t('components.musicAlbum.cancelPasswordBtn') }}
            </button>
          </div>
          <div v-if="currentAction === 'update'" class="yuemu-form-item">
            <label>{{ t('components.musicAlbum.oldPasswordLabel') }}</label>
            <input type="password" class="yuemu-input-base" v-model="passwordForm.oldPassword" :placeholder="t('components.musicAlbum.oldPasswordPlaceholder')" required style="margin-bottom: 12px;">
            <label>{{ t('components.musicAlbum.newPasswordLabel') }}</label>
            <input type="password" class="yuemu-input-base" v-model="passwordForm.newPassword" :placeholder="t('components.musicAlbum.newPasswordPlaceholder2')" required>
          </div>
          <div v-if="currentAction === 'remove'" class="yuemu-form-item">
            <label>{{ t('components.musicAlbum.oldPasswordLabel') }}</label>
            <input type="password" class="yuemu-input-base" v-model="passwordForm.oldPassword" :placeholder="t('components.musicAlbum.oldPasswordPlaceholder')" required>
            <p class="yuemu-warning-text"><i class="fas fa-info-circle"></i> {{ t('components.musicAlbum.cancelPasswordWarning') }}</p>
          </div>
        </div>
        <div class="yuemu-modal-footer">
          <button class="yuemu-btn-cancel" @click="showPasswordManageModal = false">{{ t('common.cancel') }}</button>
          <button class="yuemu-btn-primary-gradient" @click="handlePasswordManage">{{ t('common.confirm') }}</button>
        </div>
      </div>
    </a-modal>

    <a-modal v-model:open="showEditModal" :title="t('components.musicAlbum.editAlbumModalTitle')" :footer="null" class="yuemu-apple-modal" centered width="480px">
      <form class="yuemu-modal-form" @submit.prevent="handleEditAlbum">
        <div class="yuemu-form-item">
          <label>{{ t('components.musicAlbum.albumNameLabel') }}</label>
          <input type="text" class="yuemu-input-base" v-model="editAlbum.albumName" :placeholder="t('components.musicAlbum.albumNamePlaceholder')" required>
        </div>
        <div class="yuemu-form-item">
          <label>{{ t('components.musicAlbum.albumDescLabel') }}</label>
          <textarea class="yuemu-input-base" v-model="editAlbum.description" rows="3" :placeholder="t('components.musicAlbum.albumDescPlaceholder')"></textarea>
        </div>
        <div class="yuemu-form-item">
          <label>{{ t('components.musicAlbum.coverImageLabel') }}</label>
          <div class="yuemu-upload-wrapper" @click="handleEditCoverUpload">
            <div class="yuemu-image-preview">
              <img v-if="editAlbum.coverUrl" :src="editAlbum.coverUrl" :alt="t('components.musicAlbum.coverPreview')">
              <div v-else-if="isUploading" class="yuemu-upload-loading"><i class="fas fa-spinner fa-spin"></i><span>{{ t('components.musicAlbum.uploading') }}</span></div>
              <div v-else class="yuemu-upload-placeholder"><i class="fas fa-image"></i><div>{{ t('components.musicAlbum.clickToChangeCover') }}</div></div>
            </div>
          </div>
        </div>
        <div class="yuemu-modal-footer">
          <button type="button" class="yuemu-btn-cancel" @click="showEditModal = false">{{ t('common.cancel') }}</button>
          <button type="submit" class="yuemu-btn-primary-gradient">{{ t('common.saveChanges') }}</button>
        </div>
      </form>
    </a-modal>

    <input type="file" ref="fileInput" style="display: none" accept="image/*" @change="handleFileChange">
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, defineProps, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import {
  createMusicAlbumUsingPost, fetchMusicAlbumsUsingGet, removeMusicAlbumUsingPost,
  fetchMusicAlbumByIdUsingGet, setMusicAlbumPasswordUsingPost, modifyMusicAlbumPasswordUsingPost,
  removeMusicAlbumPasswordUsingPost, modifyMusicAlbumUsingPost
} from '@/api/loveBoardMusicAlbumController'
import { uploadPostImageUsingPost } from '@/api/pictureController'
import { message } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'

interface MusicAlbum { id: number; albumName: string; description?: string; coverUrl?: string; createTime: string; isPublic: number; musicCount?: number; imageLoaded?: boolean; }
const { t } = useI18n()
const router = useRouter()
const props = defineProps<{ loveBoardId: string, isOwner?: boolean }>()
const albums = ref<MusicAlbum[]>([])
const showCreateModal = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const showDeleteModal = ref(false)
const selectedAlbum = ref<MusicAlbum | null>(null)
const showPasswordModal = ref(false)
const passwordInput = ref('')
const passwordInputRef = ref<HTMLInputElement | null>(null)
const selectedPrivateAlbum = ref<MusicAlbum | null>(null)
const showPasswordManageModal = ref(false)
const passwordForm = ref({ oldPassword: '', newPassword: '' })
const currentAction = ref('')
const showEditModal = ref(false)
const editAlbum = ref<MusicAlbum>({ id: 0, albumName: '', description: '', coverUrl: '', isPublic: 1, createTime: '' })
const newAlbum = ref({ albumName: '', description: '', coverUrl: '', isPublic: 1, password: '' })
const isUploading = ref(false)

const formatDate = (date: string) => dayjs(date).format('YYYY-MM-DD')
const fetchAlbums = async () => { try { const res = await fetchMusicAlbumsUsingGet({ current: 1, pageSize: 20, loveBoardId: props.loveBoardId }); if (res.data.code === 0) { const loadedStates = new Map(albums.value.map(album => [album.id, album.imageLoaded])); albums.value = res.data.data.records.map(album => ({ ...album, imageLoaded: loadedStates.get(album.id) || false })) } } catch (error) { console.error(error) } }
const handleAlbumClick = (album: MusicAlbum) => { if (album.isPublic === 0) { selectedPrivateAlbum.value = album; showPasswordModal.value = true; nextTick(() => { passwordInputRef.value?.focus() }) } else { router.push(`/music-album/${album.id}?isOwner=${props.isOwner}`) } }
const showDeleteConfirm = (album: MusicAlbum) => { selectedAlbum.value = album; showDeleteModal.value = true }
const confirmDelete = async () => { if (!selectedAlbum.value) return; try { const res = await removeMusicAlbumUsingPost({ id: selectedAlbum.value.id, loveBoardId: props.loveBoardId }); if (res.data.code === 0) { albums.value = albums.value.filter(item => item.id !== selectedAlbum.value?.id); message.success(t('components.musicAlbum.deleteSuccess')) } } catch (error) { message.error(t('components.musicAlbum.deleteFailed')) } showDeleteModal.value = false; selectedAlbum.value = null }
const handleFileChange = async (event: Event) => { const target = event.target as HTMLInputElement; if (target.files && target.files[0]) { const file = target.files[0]; try { isUploading.value = true; const res = await uploadPostImageUsingPost({}, {}, file); if (res.data.code === 0) { if (showEditModal.value) { editAlbum.value.coverUrl = res.data.data.url } else { newAlbum.value.coverUrl = res.data.data.url } } } catch (error: any) { message.error(error?.response?.data?.message || t('components.musicAlbum.uploadImageFailed')) } finally { isUploading.value = false } if (fileInput.value) { fileInput.value.value = '' } } }
const handleUploadCover = () => fileInput.value?.click()
const handleCreateAlbum = async () => { try { const res = await createMusicAlbumUsingPost({ loveBoardId: props.loveBoardId }, newAlbum.value); if (res.data.code === 0) { showCreateModal.value = false; newAlbum.value = { albumName: '', description: '', coverUrl: '', isPublic: 1, password: '' }; await fetchAlbums() } } catch (error) {} }
const handlePasswordSubmit = async () => { if (!selectedPrivateAlbum.value) return; try { const res = await fetchMusicAlbumByIdUsingGet({ id: selectedPrivateAlbum.value.id, password: passwordInput.value }); if (res.data.code === 0) { sessionStorage.setItem(`album_${selectedPrivateAlbum.value.id}_password`, passwordInput.value); router.push(`/music-album/${selectedPrivateAlbum.value.id}?isOwner=${props.isOwner}`); showPasswordModal.value = false; passwordInput.value = ''; selectedPrivateAlbum.value = null } else { message.error(t('components.musicAlbum.passwordError')); passwordInput.value = ''; nextTick(() => { passwordInputRef.value?.focus() }) } } catch (error: any) { message.error(error?.response?.data?.message || t('components.musicAlbum.validationFailed')) } }
const handleImageLoad = (album: MusicAlbum) => { const targetAlbum = albums.value.find(a => a.id === album.id); if (targetAlbum) { targetAlbum.imageLoaded = true } }
const handlePasswordManageClick = (album: MusicAlbum) => { selectedAlbum.value = album; showPasswordManageModal.value = true; currentAction.value = album.isPublic === 1 ? 'set' : ''; passwordForm.value = { oldPassword: '', newPassword: '' } }
const handlePasswordManage = async () => { if (!selectedAlbum.value) return; try { let res; if (selectedAlbum.value.isPublic === 1) { res = await setMusicAlbumPasswordUsingPost({ albumId: selectedAlbum.value.id, newPassword: passwordForm.value.newPassword }) } else if (currentAction.value === 'update') { res = await modifyMusicAlbumPasswordUsingPost({ albumId: selectedAlbum.value.id, oldPassword: passwordForm.value.oldPassword, newPassword: passwordForm.value.newPassword }) } else if (currentAction.value === 'remove') { res = await removeMusicAlbumPasswordUsingPost({ albumId: selectedAlbum.value.id, oldPassword: passwordForm.value.oldPassword }) } if (res?.data.code === 0) { message.success(t('components.musicAlbum.operationSuccess')); await fetchAlbums(); showPasswordManageModal.value = false; passwordForm.value = { oldPassword: '', newPassword: '' }; selectedAlbum.value = null; currentAction.value = '' } else { message.error(res?.data?.message || t('components.musicAlbum.operationFailed')) } } catch (error: any) { message.error(error?.response?.data?.message || t('components.musicAlbum.operationFailed')) } }
const handleEditClick = (album: MusicAlbum) => { editAlbum.value = { ...album }; showEditModal.value = true }
const handleEditCoverUpload = () => fileInput.value?.click()
const handleEditAlbum = async () => { try { const res = await modifyMusicAlbumUsingPost({ loveBoardId: props.loveBoardId }, { id: editAlbum.value.id, albumName: editAlbum.value.albumName, description: editAlbum.value.description, coverUrl: editAlbum.value.coverUrl, isPublic: editAlbum.value.isPublic }); if (res.data.code === 0) { message.success(t('components.musicAlbum.updateSuccess')); showEditModal.value = false; await fetchAlbums() } } catch (error: any) { message.error(error?.response?.data?.message || t('components.musicAlbum.updateFailed')) } }
watch(() => props.loveBoardId, (newVal) => { if (newVal) fetchAlbums() }, { immediate: true })
defineExpose({ showCreateModal, fetchAlbums })
</script>

<style scoped>
/* ==================== 1. 基础全局配置 ==================== */
.yuemu-music-album-container {
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

/* ==================== 2. 网格与卡片 (PC端默认) ==================== */
.yuemu-album-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}

.yuemu-album-card {
  position: relative;
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 4px 16px var(--shadow-color);
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s;
}
.yuemu-album-card:hover { transform: translateY(-6px); box-shadow: 0 12px 24px var(--shadow-color); border-color: var(--link-color); }

.yuemu-album-cover { width: 100%; aspect-ratio: 1 / 1; position: relative; overflow: hidden; background: #000; }
.yuemu-album-cover img { width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity 0.5s; }
.yuemu-album-cover img.yuemu-image-loaded { opacity: 1; }

.yuemu-image-skeleton {
  position: absolute; inset: 0;
  background: linear-gradient(90deg, var(--hover-background) 25%, var(--border-color) 50%, var(--hover-background) 75%);
  background-size: 200% 100%; animation: yuemu-shimmer 1.5s infinite linear;
}
@keyframes yuemu-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }

.yuemu-album-info-overlay {
  position: absolute; bottom: 0; left: 0; right: 0; padding: 40px 16px 16px;
  background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%);
  color: #fff; pointer-events: none;
}
.yuemu-album-title-text { font-size: 16px; font-weight: 700; margin: 0 0 4px 0; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.yuemu-album-date { font-size: 12px; color: rgba(255,255,255,0.7); }

/* 角标与悬浮按钮 */
.yuemu-private-badge {
  position: absolute; top: 12px; right: 12px; width: 32px; height: 32px; border-radius: 50%;
  background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 14px;
}

.yuemu-delete-btn {
  position: absolute; top: 12px; right: 12px; width: 32px; height: 32px; border-radius: 50%; border: none;
  background: rgba(0,0,0,0.6); color: #fff; display: flex; align-items: center; justify-content: center;
  cursor: pointer; opacity: 0; transform: scale(0.8); transition: 0.2s; z-index: 10;
}
.yuemu-album-card:hover .yuemu-delete-btn { opacity: 1; transform: scale(1); }
.yuemu-delete-btn:hover { background: #ef4444; }

.yuemu-album-actions {
  position: absolute; top: 12px; left: 12px; display: flex; gap: 8px;
  opacity: 0; transform: translateY(-10px); transition: 0.3s; z-index: 10;
}
.yuemu-album-card:hover .yuemu-album-actions { opacity: 1; transform: translateY(0); }

.yuemu-action-icon-btn {
  width: 32px; height: 32px; border-radius: 50%; border: none; background: rgba(0,0,0,0.6); color: #fff;
  display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; backdrop-filter: blur(4px);
}
.yuemu-action-icon-btn:hover { background: var(--link-color); }

.yuemu-empty-state { grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; color: var(--text-secondary);  border-radius: 16px; border: 1px dashed var(--border-color); }
.yuemu-empty-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.5; }

/* ==================== 3. 弹窗与表单通用适配 ==================== */
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

.yuemu-switch-wrapper { display: flex; align-items: center; gap: 12px; background: var(--hover-background); padding: 12px 16px; border-radius: 12px; cursor: pointer; border: 1px solid transparent; transition: 0.2s; }
.yuemu-switch-wrapper:active { border-color: var(--border-color); }
.yuemu-apple-switch { width: 46px; height: 24px; background: var(--border-color); border-radius: 20px; position: relative; transition: 0.3s; }
.yuemu-apple-switch.is-on { background: #34c759; }
.yuemu-switch-dot { width: 20px; height: 20px; background: #fff; border-radius: 50%; position: absolute; top: 2px; left: 2px; transition: 0.3s cubic-bezier(0.25, 0.1, 0.25, 1); box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
.yuemu-apple-switch.is-on .yuemu-switch-dot { transform: translateX(22px); }
.yuemu-switch-label { color: var(--text-primary); font-weight: 500; font-size: 14px; }

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

/* 默认隐藏移动端专属内容 */
.yuemu-mobile-only { display: none; }

/* ==================== 4. 移动端专门优化 (单列流式卡片) ==================== */
@media screen and (max-width: 768px) {
  .yuemu-music-album-container { padding: 0; }

  /* 隐藏 PC 端特有元素 */
  .yuemu-pc-only { display: none !important; }
  /* 显示移动端专属元素 */
  .yuemu-mobile-only { display: flex; }

  /* 移动端采用单列大卡片 */
  .yuemu-album-grid { grid-template-columns: 1fr; gap: 16px; }

  .yuemu-album-card { display: flex; flex-direction: column; border-radius: 16px; }

  /* 封面变为 16:9 节省空间 */
  .yuemu-album-cover { aspect-ratio: 16 / 9; }

  /* 角标位置微调 */
  .yuemu-private-badge { top: 12px; right: 12px; width: 28px; height: 28px; font-size: 12px; background: rgba(0,0,0,0.4); }

  /* 移动端底部信息区 */
  .yuemu-album-info { padding: 16px; flex-direction: column; }
  .yuemu-info-title { font-size: 17px; font-weight: 700; color: var(--text-primary); margin: 0 0 12px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .yuemu-album-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 12px; }
  .yuemu-album-date { font-size: 12px; color: var(--text-secondary); display: flex; align-items: center; gap: 4px; }

  /* 移动端外露的操作按钮 */
  .yuemu-album-mobile-actions { display: flex; gap: 8px; }
  .yuemu-action-text-btn { background: var(--hover-background); color: var(--text-primary); border: 1px solid var(--border-color); padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer; transition: 0.2s; }
  .yuemu-action-text-btn:active { border-color: var(--link-color); color: var(--link-color); }
  .yuemu-danger-text { color: #ef4444; }

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
  .yuemu-album-card:active, .yuemu-album-card:hover,
  .yuemu-album-card:active *, .yuemu-album-card:hover *,
  .yuemu-action-icon-btn:active, .yuemu-action-icon-btn:hover,
  .yuemu-action-icon-btn:active *, .yuemu-action-icon-btn:hover *,
  .yuemu-btn-primary-gradient:active, .yuemu-btn-primary-gradient:hover,
  .yuemu-btn-primary-gradient:active *, .yuemu-btn-primary-gradient:hover * {
    transform: none !important;
  }
}
</style>
