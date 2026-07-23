<template>
  <div class="yuemu-space-page">

    <div class="yuemu-app-container">

      <header class="yuemu-app-header">
        <div class="yuemu-header-left">
          <button class="yuemu-back-btn" @click="router.back()">
            <i class="fas fa-chevron-left"></i>
          </button>
        </div>
        <div class="yuemu-header-center">
          <span class="yuemu-header-title">{{ route.query?.id ? t('pages.addSpacePage.titleEdit') : t('pages.addSpacePage.titleCreate') }}{{ SPACE_TYPE_MAP[spaceType] }}</span>
        </div>
        <div class="yuemu-header-right"></div>
      </header>

      <main class="yuemu-app-content">

        <div class="yuemu-hero-cover-section">
          <div
            class="yuemu-cover-uploader"
            :class="{ 'has-cover': spaceForm.spaceCover }"
            @click="!spaceForm.spaceCover && triggerFileSelect()"
          >
            <template v-if="spaceForm.spaceCover">
              <img :src="spaceForm.spaceCover" class="yuemu-cover-image" :alt="t('pages.addSpacePage.defaultCoverText')">
              <div class="yuemu-cover-overlay">
                <button type="button" class="yuemu-tool-btn" @click.stop="showCoverGenerator = true">
                  <i class="fas fa-wand-magic-sparkles"></i> {{ t('pages.addSpacePage.btnAiCover') }}
                </button>
                <button type="button" class="yuemu-tool-btn" @click.stop="triggerFileSelect()">
                  <i class="fas fa-sync-alt"></i> {{ t('pages.addSpacePage.btnReplace') }}
                </button>
                <button type="button" class="yuemu-tool-btn danger" @click.stop="spaceForm.spaceCover = ''">
                  <i class="fas fa-trash-alt"></i>
                </button>
              </div>
            </template>
            <template v-else>
              <div class="yuemu-empty-cover-state">
                <div class="yuemu-icon-wrapper"><i class="fas fa-camera"></i></div>
                <p class="yuemu-empty-text">{{ t('pages.addSpacePage.placeholderAddCover') }} <span class="yuemu-required">*</span></p>
                <div class="yuemu-action-pills">
                  <button type="button" class="yuemu-pill-btn" @click.stop="triggerFileSelect()">{{ t('pages.addSpacePage.btnLocalAlbum') }}</button>
                  <button type="button" class="yuemu-pill-btn primary" @click.stop="showCoverGenerator = true">
                    <i class="fas fa-wand-magic-sparkles"></i> {{ t('pages.addSpacePage.btnAiGenerate') }}
                  </button>
                </div>
              </div>
            </template>
          </div>
        </div>

        <div class="yuemu-content-inputs">
          <input
            v-model="spaceForm.spaceName"
            type="text"
            :placeholder="t('pages.addSpacePage.placeholderSpaceName')"
            class="yuemu-input yuemu-title-input"
            maxlength="30"
          >
          <div class="yuemu-desc-wrapper">
            <textarea
              v-model="spaceForm.spaceDesc"
              :placeholder="t('pages.addSpacePage.placeholderSpaceDesc')"
              class="yuemu-input yuemu-desc-input"
              rows="4"
              maxlength="200"
            ></textarea>
            <span class="yuemu-word-count" :class="{ 'is-full': spaceForm.spaceDesc?.length === 200 }">
              {{ spaceForm.spaceDesc?.length || 0 }}/200
            </span>
          </div>
        </div>

        <div class="yuemu-settings-list" v-if="!route.query?.id">
          <div class="yuemu-info-card">
            <div class="yuemu-info-header">
              <i class="fas fa-crown yuemu-info-icon"></i>
              <span>{{ t('pages.addSpacePage.labelSpaceCapacity') }}</span>
            </div>
            <p class="yuemu-info-desc">
              {{ t('pages.addSpacePage.descSpaceCapacity') }}
            </p>
            <div class="yuemu-level-tags">
              <div class="yuemu-level-tag" :class="{ 'is-active': currentMemberType === 0 }">
                <span class="yuemu-tag-name">{{ t('pages.addSpacePage.tagNormalUser') }}</span>
                <span class="yuemu-tag-limit">512 MB</span>
              </div>
              <div class="yuemu-level-tag" :class="{ 'is-active': currentMemberType === 1 }">
                <span class="yuemu-tag-name">{{ t('pages.addSpacePage.tagProMember') }}</span>
                <span class="yuemu-tag-limit">1 GB</span>
              </div>
              <div class="yuemu-level-tag" :class="{ 'is-active': currentMemberType === 2 || isAdmin }">
                <span class="yuemu-tag-name">{{ t('pages.addSpacePage.tagPlusMember') }}</span>
                <span class="yuemu-tag-limit">5 GB</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer class="yuemu-app-footer">
        <button
          class="yuemu-submit-btn"
          :class="{ 'is-disabled': loading || !validateForm() }"
          @click="handleSubmit"
          :disabled="loading || !validateForm()"
        >
          <i v-if="loading" class="fas fa-spinner fa-spin"></i>
          <span>{{ loading ? t('pages.addSpacePage.statusProcessing') : (route.query?.id ? t('pages.addSpacePage.btnSaveChanges') : t('pages.addSpacePage.btnCreateNow')) }}</span>
        </button>
      </footer>

    </div>

    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      @change="handleFileChange"
      class="yuemu-hidden-input"
    >
    <CoverGenerator
      v-if="showCoverGenerator"
      :initialText="spaceForm.spaceName || t('pages.addSpacePage.defaultCoverText')"
      @close="showCoverGenerator = false"
      @confirm="handleCoverGenerated"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, computed } from 'vue'
import { message } from 'ant-design-vue'
import {
  addSpaceUsingPost,
  getSpaceVoByIdUsingGet,
  listSpaceLevelUsingGet,
  updateSpaceUsingPost,
} from '@/api/spaceController'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
import { SPACE_LEVEL_OPTIONS, SPACE_LEVEL_ENUM, SPACE_TYPE_ENUM, SPACE_TYPE_MAP } from '@/constants/space'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import { formatSize } from '../utils'
import { uploadPostImageUsingPost } from '@/api/pictureController'
import CoverGenerator from '@/components/CoverGenerator.vue'

const loginUserStore = useLoginUserStore()
const isAdmin = computed(() => loginUserStore.loginUser?.userRole === 'admin')
const currentMemberType = computed(() => loginUserStore.loginUser?.memberType || 0)

declare namespace API {
  interface SpaceAddRequest {
    spaceName?: string;
    spaceType?: number;
    spaceLevel?: number;
    spaceDesc?: string;
    spaceCover?: string;
  }
  interface SpaceEditRequest {
    id?: string | number;
    spaceName?: string;
    spaceType?: number;
    spaceLevel?: number;
    spaceDesc?: string;
    spaceCover?: string;
  }
  interface SpaceLevel {
    value?: number;
    text?: string;
    maxSize?: number;
    maxCount?: number;
  }
  interface SpaceVO {
    id?: number;
    spaceName?: string;
    spaceLevel?: number;
    spaceDesc?: string;
    spaceCover?: string;
  }
}

const route = useRoute()
const router = useRouter()

const fileInputRef = ref<HTMLInputElement | null>(null)
const loading = ref(false)
const space = ref<API.SpaceVO>()
const spaceLevelList = ref<API.SpaceLevel[]>([])
const showCoverGenerator = ref(false)
const showLevelSheet = ref(false)

const spaceForm = reactive<API.SpaceAddRequest | API.SpaceEditRequest>({
  spaceName: '',
  spaceDesc: '',
  spaceCover: '',
  spaceLevel: undefined
})

const spaceType = computed(() => {
  return route.query?.type ? Number(route.query.type) : SPACE_TYPE_ENUM.PRIVATE
})

const triggerFileSelect = () => fileInputRef.value?.click()

const getLevelText = (value: number) => {
  return SPACE_LEVEL_OPTIONS.find(opt => opt.value === value)?.label || ''
}

const selectLevel = (value: number) => {
  spaceForm.spaceLevel = value
  showLevelSheet.value = false
}

const validateForm = () => {
  if (!spaceForm.spaceName?.trim()) return false
  if (!spaceForm.spaceCover) return false
  return true
}

const uploadCoverImage = async (file: File) => {
  try {
    const res = await uploadPostImageUsingPost({}, {}, file)
    if (res.data.code === 0) {
      spaceForm.spaceCover = res.data.data.url
      message.success(t('pages.addSpacePage.toastCoverUploadSuccess'))
    } else {
      message.error(t('pages.addSpacePage.toastUploadFail', { message: res.data.message }))
    }
  } catch (err) {
    message.error(t('pages.addSpacePage.toastNetworkError'))
  }
}

const handleFileChange = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    message.error(t('pages.addSpacePage.toastSelectImageFile'))
    return
  }
  await uploadCoverImage(file)
  target.value = ''
}

const handleCoverGenerated = async (dataUrl: string) => {
  try {
    const response = await fetch(dataUrl)
    const blob = await response.blob()
    const file = new File([blob], `space-cover-${Date.now()}.png`, { type: 'image/png' })
    await uploadCoverImage(file)
    showCoverGenerator.value = false
  } catch (error: any) {
    message.error(t('pages.addSpacePage.toastCoverGenerateFail'))
  }
}

const fetchSpaceLevelList = async () => {
  const res = await listSpaceLevelUsingGet()
  if (res.data.code === 0 && res.data.data) {
    spaceLevelList.value = res.data.data
  }
}

const getOldSpace = async () => {
  const id = route.query?.id
  if (id) {
    const res = await getSpaceVoByIdUsingGet({ id })
    if (res.data.code === 0 && res.data.data) {
      const data = res.data.data
      space.value = data
      spaceForm.spaceName = data.spaceName || ''
      spaceForm.spaceLevel = data.spaceLevel
      spaceForm.spaceDesc = data.spaceDesc || ''
      spaceForm.spaceCover = data.spaceCover || ''
    }
  }
}

const handleSubmit = async () => {
  if (!validateForm() || loading.value) return
  loading.value = true
  try {
    let res
    if (space.value?.id) {
      res = await updateSpaceUsingPost({ id: space.value.id, ...spaceForm })
    } else {
      res = await addSpaceUsingPost({ ...spaceForm, spaceType: spaceType.value })
    }
    if (res.data.code === 0 && res.data.data) {
      message.success(t('pages.addSpacePage.toastOperationSuccess'))
      router.push({ name: 'SpaceDetail', params: { id: res.data.data } })
    } else {
      message.error(res.data.message || t('pages.addSpacePage.toastOperationFail'))
    }
  } catch (err) {
    message.error(t('pages.addSpacePage.toastSubmitFail'))
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchSpaceLevelList()
  getOldSpace()
})
</script>

<style scoped>
/* ================= 全局与基础重置 ================= */
.yuemu-space-page {
  position: fixed; inset: 0;
  background-color: var(--hover-background, #f5f5f5);
  display: flex; align-items: center; justify-content: center;
  z-index: 100; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

/* ★ 核心设备容器：完美解决 PC 贴边和排版乱象 */
.yuemu-app-container {
  width: 100%; max-width: 540px;
  height: 100dvh;
  background: var(--card-background, #ffffff);
  display: flex; flex-direction: column;
  position: relative;
}

/* PC 端变成悬浮的精美卡片 */
@media (min-width: 641px) {
  .yuemu-app-container {
    height: 90vh; max-height: 850px;
    border-radius: 24px;
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.08);
    overflow: hidden; /* 切割内部滚动条，保证圆角完美 */
    border: 1px solid var(--border-color, #eaeaea);
  }
}

.yuemu-blue-link { color: #1677ff; text-decoration: none; font-weight: 500; }
.yuemu-blue-link:hover { text-decoration: underline; }
.yuemu-hidden-input { display: none; }
.yuemu-required { color: #ff4d4f; font-weight: normal; margin-left: 2px; }

/* ================= 顶部导航 ================= */
.yuemu-app-header {
  height: 50px;
  padding-top: 0;
  display: flex; align-items: center; justify-content: space-between;
  padding-left: 16px; padding-right: 16px;
  color: var(--text-primary);
  border-bottom: 1px solid var(--hover-background, #f5f5f5);
  flex-shrink: 0; position: relative; z-index: 10;
}

.yuemu-header-left, .yuemu-header-right { width: 40px; display: flex; align-items: center; z-index: 2; }
.yuemu-header-center { position: absolute; left: 50%; transform: translateX(-50%); font-size: 16px; font-weight: 600; z-index: 1; }

.yuemu-back-btn {
  width: 32px; height: 32px; border: none; background: transparent;
  font-size: 18px; color: var(--text-primary); cursor: pointer;
  display: flex; align-items: center; justify-content: flex-start;
}

/* ================= 滚动内容区 ================= */
.yuemu-app-content {
  flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch;
  background: var(--hover-background, #f5f5f7);
}
.yuemu-app-content::-webkit-scrollbar { width: 4px; }
.yuemu-app-content::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 4px; }

/* ================= 1. Hero 封面区 ================= */
.yuemu-hero-cover-section { background: var(--card-background, #fff); padding: 16px; }

.yuemu-cover-uploader {
  width: 100%; aspect-ratio: 4 / 3;
  background: var(--hover-background, #f4f5f7); border-radius: 16px;
  overflow: hidden; position: relative;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.2s; border: 1px solid var(--border-color, #eee);
}

.yuemu-cover-image { width: 100%; height: 100%; object-fit: cover; }

.yuemu-cover-overlay {
  position: absolute; inset: 0; background: rgba(0,0,0,0.3);
  display: flex; align-items: center; justify-content: center; gap: 12px;
  opacity: 0; transition: opacity 0.3s;
}
.yuemu-cover-uploader.has-cover:hover .yuemu-cover-overlay { opacity: 1; }
@media (max-width: 768px) {
  .yuemu-cover-overlay { opacity: 1; background: linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.5)); align-items: flex-end; padding-bottom: 20px; }
}

.yuemu-tool-btn {
  background: rgba(255,255,255,0.2); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.3); padding: 8px 16px; border-radius: 20px;
  font-size: 13px; font-weight: 500; display: flex; align-items: center; gap: 6px; cursor: pointer; color: #fff;
}
.yuemu-tool-btn.danger { background: rgba(255, 77, 79, 0.8); border-color: transparent; padding: 8px 12px; }

.yuemu-empty-cover-state { text-align: center; display: flex; flex-direction: column; align-items: center; }
.yuemu-icon-wrapper { width: 56px; height: 56px; background: rgba(22, 119, 255, 0.1); color: #1677ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 12px; }
.yuemu-empty-text { font-size: 15px; font-weight: 600; color: var(--text-primary); margin: 0 0 16px 0; }

.yuemu-action-pills { display: flex; gap: 12px; }
.yuemu-pill-btn {
  background: var(--card-background); border: 1px solid var(--border-color); color: var(--text-primary);
  padding: 8px 20px; border-radius: 20px; font-size: 13px; font-weight: 500; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.02);
}
.yuemu-pill-btn.primary { background: rgba(22, 119, 255, 0.1); color: #1677ff; border-color: transparent; }

/* ================= 2. 沉浸式内容区 ================= */
.yuemu-content-inputs { background: var(--card-background, #fff); padding: 0 20px 20px; margin-bottom: 12px; }

.yuemu-input { width: 100%; border: none; outline: none; background: transparent; color: var(--text-primary); font-family: inherit; }
.yuemu-input::placeholder { color: var(--text-secondary); opacity: 0.6; font-weight: normal; }

.yuemu-title-input { font-size: 20px; font-weight: 700; border-bottom: 1px solid var(--hover-background); padding: 16px 0; margin-bottom: 16px; }
.yuemu-desc-input { font-size: 14px; line-height: 1.6; resize: none; min-height: 100px; }

.yuemu-desc-wrapper { position: relative; }
.yuemu-word-count { position: absolute; bottom: -8px; right: 0; font-size: 12px; color: var(--text-secondary); }
.yuemu-word-count.is-full { color: #ff4d4f; }

/* ================= 3. 单元格列表 ================= */
.yuemu-settings-list { background: var(--card-background, #fff); padding: 0 20px; margin-bottom: 12px; }

.yuemu-setting-cell { display: flex; align-items: center; justify-content: space-between; padding: 20px 0; cursor: pointer; }
.yuemu-cell-left { display: flex; align-items: center; gap: 10px; font-size: 15px; font-weight: 500; }
.yuemu-cell-icon { color: var(--text-secondary); font-size: 16px; width: 20px; text-align: center;}
.yuemu-cell-right { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--text-secondary); }
.yuemu-cell-value { color: var(--text-primary); font-weight: 500; }
.yuemu-cell-value.placeholder { color: var(--text-secondary); font-weight: normal; }
.yuemu-arrow-icon { font-size: 14px; opacity: 0.5; }

/* ================= 4. 提示卡片 ================= */
.yuemu-info-card { background: var(--card-background, #fff); padding: 20px; margin-bottom: 16px; }

.yuemu-info-header { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; margin-bottom: 8px; color: var(--text-primary); }
.yuemu-info-icon { color: #1677ff; }
.yuemu-info-desc { font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin: 0 0 16px 0; }

.yuemu-level-tags { display: flex; flex-direction: column; gap: 10px; }
.yuemu-level-tag { display: flex; justify-content: space-between; padding: 12px 16px; background: var(--hover-background); border-radius: 8px; border: 1px solid var(--border-color, #eee); transition: all 0.3s; opacity: 0.6; }
.yuemu-level-tag.is-active { background: rgba(22, 119, 255, 0.05); border-color: rgba(22, 119, 255, 0.3); opacity: 1; }
.yuemu-level-tag.is-active .yuemu-tag-name { color: #1677ff; }
.yuemu-level-tag.is-active .yuemu-tag-limit { color: #1677ff; font-weight: bold; }
.yuemu-tag-name { font-size: 13px; font-weight: 600; color: var(--text-primary);}
.yuemu-tag-limit { font-size: 13px; color: var(--text-secondary); font-family: monospace; }

/* ================= ★ 底部操作栏 ================= */
.yuemu-app-footer {
  flex-shrink: 0;
  background: var(--card-background, #fff);
  padding: 16px 20px calc(24px + env(safe-area-inset-bottom, 0px));
  box-shadow: 0 -4px 20px rgba(0,0,0,0.03);
  border-top: 1px solid var(--hover-background, #f5f5f5);
  z-index: 50;
}

.yuemu-submit-btn {
  width: 100%; height: 48px;
  background: #1677ff; border: none; border-radius: 24px;
  color: #fff; font-size: 16px; font-weight: 600;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  cursor: pointer; box-shadow: 0 6px 16px rgba(22, 119, 255, 0.2); transition: 0.2s;
}
.yuemu-submit-btn:active:not(.is-disabled) { transform: scale(0.98); }
.yuemu-submit-btn.is-disabled { background: var(--hover-background, #eee); color: var(--text-secondary); box-shadow: none; cursor: not-allowed; }

/* ================= 底部抽屉 (Action Sheet) ================= */
.yuemu-fade-modal-enter-active, .yuemu-fade-modal-leave-active { transition: opacity 0.3s; }
.yuemu-fade-modal-enter-from, .yuemu-fade-modal-leave-to { opacity: 0; }
.yuemu-fade-modal-enter-active .yuemu-action-sheet-panel { animation: yuemuSlideUp 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); }
.yuemu-fade-modal-leave-active .yuemu-action-sheet-panel { animation: yuemuSlideDown 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }

@keyframes yuemuSlideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
@keyframes yuemuSlideDown { from { transform: translateY(0); } to { transform: translateY(100%); } }

.yuemu-action-sheet-mask {
  position: absolute; inset: 0; background: rgba(0,0,0,0.5);
  z-index: 1000; display: flex; align-items: flex-end; justify-content: center;
}

.yuemu-action-sheet-panel {
  width: 100%; background: var(--card-background, #fff);
  border-radius: 20px 20px 0 0;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.yuemu-sheet-drag-bar { width: 40px; height: 4px; background: #ddd; border-radius: 2px; margin: 10px auto; }
.yuemu-sheet-header { position: relative; text-align: center; padding: 10px 0 16px; border-bottom: 1px solid var(--hover-background); }
.yuemu-sheet-header h3 { margin: 0; font-size: 16px; font-weight: 600; color: var(--text-primary); }
.yuemu-sheet-close { position: absolute; right: 16px; top: 8px; border: none; background: transparent; font-size: 18px; color: var(--text-secondary); padding: 4px; cursor: pointer; }

.yuemu-sheet-content { padding: 8px 16px 24px; max-height: 50vh; overflow-y: auto; }
.yuemu-sheet-option {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 0; border-bottom: 1px solid var(--hover-background); cursor: pointer;
}
.yuemu-sheet-option:last-child { border-bottom: none; }
.yuemu-option-title { font-size: 15px; color: var(--text-primary); }

.yuemu-check-circle { width: 22px; height: 22px; border-radius: 50%; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center; color: transparent; transition: 0.2s; }
.yuemu-sheet-option.is-active .yuemu-option-title { font-weight: 600; color: #1677ff; }
.yuemu-sheet-option.is-active .yuemu-check-circle { background: #1677ff; border-color: #1677ff; color: #fff; font-size: 12px; }
</style>
