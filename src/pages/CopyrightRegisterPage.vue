<template>
  <Transition name="yuemu-fade-page">
    <div class="yuemu-copyright-register-fullscreen">

      <header class="yuemu-app-header">
        <div class="yuemu-header-inner">
          <button class="yuemu-back-btn" @click="goBack">
            <i class="fa-solid fa-chevron-left"></i>
            <span>{{ $t('pages.copyrightRegisterPage.back') }}</span>
          </button>
          <h1 class="yuemu-nav-title">{{ isEditMode ? $t('pages.copyrightRegisterPage.editCopyright') : $t('pages.copyrightRegisterPage.registerCopyright') }}</h1>
          <div class="yuemu-header-placeholder"></div>
        </div>
      </header>

      <main class="yuemu-app-scroll-content">
        <div class="yuemu-responsive-grid">

          <div class="yuemu-form-column">

            <section class="yuemu-apple-card">
              <h2 class="yuemu-card-title">{{ $t('pages.copyrightRegisterPage.picAsset') }}</h2>
              <div v-if="picture" class="yuemu-asset-preview">
                <img :src="picture.url" :alt="picture.name" class="yuemu-asset-img" />
                <div class="yuemu-asset-info">
                  <h3 class="yuemu-asset-name">{{ picture.name }}</h3>
                  <p class="yuemu-asset-meta">{{ $t('pages.copyrightRegisterPage.uploadTime') }}：{{ formatDate(picture.createTime) }}</p>
                </div>
              </div>
              <div v-else class="yuemu-loading-state">
                <i class="fa-solid fa-spinner fa-spin"></i> {{ $t('pages.copyrightRegisterPage.loadingAsset') }}
              </div>
            </section>

            <section class="yuemu-apple-card">
              <h2 class="yuemu-card-title">{{ $t('pages.copyrightRegisterPage.copyrightInfo') }}</h2>
              <div class="yuemu-grouped-form">
                <div class="yuemu-form-item">
                  <label>{{ $t('pages.copyrightRegisterPage.owner') }} <span class="yuemu-required">*</span></label>
                  <input
                    v-model="form.copyrightOwner"
                    type="text"
                    class="yuemu-stealth-input"
                    :placeholder="$t('pages.copyrightRegisterPage.ownerPlaceholder')"
                    maxlength="128"
                  />
                </div>
                <div class="yuemu-form-item yuemu-vertical">
                  <label>{{ $t('pages.copyrightRegisterPage.copyrightDesc') }}</label>
                  <textarea
                    v-model="form.copyrightDesc"
                    class="yuemu-stealth-textarea"
                    :placeholder="$t('pages.copyrightRegisterPage.descPlaceholder')"
                    rows="3"
                    maxlength="512"
                  ></textarea>
                </div>
              </div>
            </section>

            <section class="yuemu-apple-card">
              <h2 class="yuemu-card-title">{{ $t('pages.copyrightRegisterPage.permissions') }}</h2>
              <div class="yuemu-grouped-form">
                <div class="yuemu-form-item yuemu-toggle-item" @click="toggleCommercial">
                  <div class="yuemu-item-label">
                    <div class="yuemu-icon-box blue"><i class="fa-solid fa-store"></i></div>
                    <span>{{ $t('pages.copyrightRegisterPage.allowCommercial') }}</span>
                  </div>
                  <div class="yuemu-ios-switch" :class="{ active: form.allowCommercial === 1 }">
                    <div class="yuemu-switch-knob"></div>
                  </div>
                </div>
                <div class="yuemu-form-item yuemu-toggle-item" @click="toggleAttribution">
                  <div class="yuemu-item-label">
                    <div class="yuemu-icon-box orange"><i class="fa-solid fa-signature"></i></div>
                    <span>{{ $t('pages.copyrightRegisterPage.requireAttribution') }}</span>
                  </div>
                  <div class="yuemu-ios-switch" :class="{ active: form.requireAttribution === 1 }">
                    <div class="yuemu-switch-knob"></div>
                  </div>
                </div>
              </div>
            </section>

            <div class="yuemu-action-bar">
              <button class="yuemu-btn-cancel" @click="goBack">{{ $t('pages.copyrightRegisterPage.cancel') }}</button>
              <button class="yuemu-btn-submit" @click="handleSubmit" :disabled="submitting || !canSubmit">
                <i class="fa-solid fa-spinner fa-spin" v-if="submitting"></i>
                <span v-else>{{ isEditMode ? $t('pages.copyrightRegisterPage.updateInfo') : $t('pages.copyrightRegisterPage.confirmRegister') }}</span>
              </button>
            </div>
          </div>

          <aside class="yuemu-info-column">
            <div class="yuemu-apple-card yuemu-info-card">
              <div class="yuemu-info-header">
                <div class="yuemu-info-icon"><i class="fa-solid fa-shield-halved"></i></div>
                <h3 class="yuemu-info-title">{{ $t('pages.copyrightRegisterPage.infoTitle') }}</h3>
              </div>
              <ul class="yuemu-info-list">
                <li v-if="!isEditMode">{{ $t('pages.copyrightRegisterPage.info1_new') }}</li>
                <li v-if="isEditMode">{{ $t('pages.copyrightRegisterPage.info1_edit') }}</li>
                <li>{{ $t('pages.copyrightRegisterPage.info2') }}</li>
                <li>{{ $t('pages.copyrightRegisterPage.info3') }}</li>
              </ul>
            </div>
          </aside>

        </div>
      </main>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { getPictureVoByIdUsingGet } from '@/api/pictureController'
import { registerCopyrightUsingPost, updateCopyrightUsingPost, getCopyrightByPictureIdUsingGet } from '@/api/pictureCopyrightController.ts'

const route = useRoute()
const router = useRouter()

const picture = ref<API.PictureVO>()
const submitting = ref(false)
const isEditMode = ref(false)
const copyrightId = ref<string>('')

const form = reactive({
  pictureId: 0 as number | string,
  copyrightOwner: '',
  copyrightDesc: '',
  allowCommercial: 0,
  requireAttribution: 1
})

const canSubmit = computed(() => {
  return form.copyrightOwner.trim().length > 0
})

onMounted(async () => {
  const pictureId = route.query.pictureId
  if (!pictureId) {
    message.error(t('pages.copyrightRegisterPage.missingPicId'))
    router.back()
    return
  }

  form.pictureId = String(pictureId)
  await loadPicture()
  await loadExistingCopyright()
})

const loadPicture = async () => {
  try {
    const res = await getPictureVoByIdUsingGet({ id: form.pictureId })
    if (res.data.code === 0 && res.data.data) {
      picture.value = res.data.data
    } else {
      message.error(t('pages.copyrightRegisterPage.picNotFound'))
      router.back()
    }
  } catch (error) {
    message.error(t('pages.copyrightRegisterPage.loadFailed'))
    router.back()
  }
}

const loadExistingCopyright = async () => {
  try {
    const res = await getCopyrightByPictureIdUsingGet({ pictureId: form.pictureId })
    if (res.data.code === 0 && res.data.data) {
      const copyright = res.data.data
      isEditMode.value = true
      copyrightId.value = String(copyright.id)
      form.copyrightOwner = copyright.copyrightOwner || ''
      form.copyrightDesc = copyright.copyrightDesc || ''
      form.allowCommercial = copyright.allowCommercial || 0
      form.requireAttribution = copyright.requireAttribution !== undefined ? copyright.requireAttribution : 1
    }
  } catch (error) {
    // 没有版权信息，保持新建模式
  }
}

const toggleCommercial = () => form.allowCommercial = form.allowCommercial === 1 ? 0 : 1
const toggleAttribution = () => form.requireAttribution = form.requireAttribution === 1 ? 0 : 1

const handleSubmit = async () => {
  if (!canSubmit.value) {
    message.warning(t('pages.copyrightRegisterPage.fillOwner'))
    return
  }

  submitting.value = true
  try {
    let res
    if (isEditMode.value && copyrightId.value) {
      res = await updateCopyrightUsingPost({ id: copyrightId.value, ...form })
      if (res.data.code === 0) {
        message.success(t('pages.copyrightRegisterPage.updateSuccess'))
        router.push({ name: 'PictureRedirect', params: { id: form.pictureId } })
      } else throw new Error(res.data.message || t('pages.copyrightRegisterPage.updateFail'))
    } else {
      res = await registerCopyrightUsingPost(form)
      if (res.data.code === 0) {
        message.success(t('pages.copyrightRegisterPage.registerSuccess'))
        router.push({ name: 'PictureRedirect', params: { id: form.pictureId } })
      } else throw new Error(res.data.message || t('pages.copyrightRegisterPage.registerFail'))
    }
  } catch (error: any) {
    message.error(error.message)
  } finally {
    submitting.value = false
  }
}

const goBack = () => router.back()
const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
</script>

<style scoped>
/* ================= 1. 彻底锁定全屏幕视口 ================= */
.yuemu-copyright-register-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: var(--background);
  color: var(--text-primary);
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh; /* 适配移动端底部安全区 */
  overflow: hidden; /* 绝对禁止整个外层滚动 */
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  transition: background-color 0.3s ease;
}

/* ================= 2. 顶部毛玻璃导航 ================= */
.yuemu-app-header {
  flex-shrink: 0;
  background: var(--card-background);
  background-color: rgba(255, 255, 255, 0.85); /* 提供一个带透明度的底色给毛玻璃使用 */
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-color);
  z-index: 10;
}

@media (prefers-color-scheme: dark) { .yuemu-app-header {
  background-color: rgba(20, 20, 25, 0.85);
} }

.yuemu-header-inner {
  max-width: 1000px;
  margin: 0 auto;
  height: 56px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  padding-top: 0;
}

.yuemu-back-btn {
  background: transparent;
  border: none;
  color: var(--link-color);
  font-size: 15px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 0;
  cursor: pointer;
  transition: opacity 0.2s;
}
.yuemu-back-btn:hover { opacity: 0.7; }
.yuemu-back-btn i { font-size: 16px; margin-top: 1px; }

.yuemu-nav-title { font-size: 16px; font-weight: 600; margin: 0; position: absolute; left: 50%; transform: translateX(-50%); color: var(--text-primary); }
.yuemu-header-placeholder { width: 60px; }

/* ================= 3. 内部局部滑动区 ================= */
.yuemu-app-scroll-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  padding: 24px 16px;
  padding-bottom: calc(40px + env(safe-area-inset-bottom));
  background: var(--background, #f5f5f7);
}

.yuemu-responsive-grid {
  max-width: 1000px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 24px;
  align-items: start;
}

/* ================= 4. 基础卡片样式 ================= */
.yuemu-apple-card {
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.yuemu-apple-card:hover {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
}

.yuemu-card-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 12px 4px;
}

/* --- 资产预览 --- */
.yuemu-asset-preview {
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--hover-background);
  padding: 12px;
  border-radius: 12px;
  border: 1px solid transparent;
}

.yuemu-asset-img {
  width: 64px;
  height: 64px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--card-background);
}

.yuemu-asset-name { font-size: 15px; font-weight: 600; margin: 0 0 4px 0; color: var(--text-primary); display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
.yuemu-asset-meta { font-size: 12px; color: var(--text-secondary); margin: 0; font-family: monospace; }
.yuemu-loading-state { text-align: center; padding: 30px; color: var(--link-color); font-size: 14px; display: flex; flex-direction: column; gap: 8px; font-weight: 500;}

/* ================= 5. Inset Grouped 紧凑型表单 ================= */
.yuemu-grouped-form {
  background: var(--hover-background);
  border-radius: 14px;
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.yuemu-form-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-color);
  transition: background-color 0.2s;
}
.yuemu-form-item:last-child { border-bottom: none; }
.yuemu-form-item.yuemu-toggle-item { cursor: pointer; }
.yuemu-form-item.yuemu-toggle-item:active { background: rgba(0, 0, 0, 0.05); }

.yuemu-form-item.yuemu-vertical {
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.yuemu-form-item label {
  font-size: 15px;
  color: var(--text-primary);
  font-weight: 500;
  white-space: nowrap;
}

.yuemu-required { color: #ff4d4f; }

/* 无边框输入，靠右对齐 */
.yuemu-stealth-input {
  flex: 1; background: transparent; border: none;
  font-size: 15px; color: var(--text-primary); text-align: right;
  outline: none; margin-left: 16px; min-width: 0;
}

.yuemu-stealth-textarea {
  width: 100%; background: var(--card-background); border: 1px solid transparent;
  font-size: 15px; color: var(--text-primary); outline: none; resize: none;
  line-height: 1.6; padding: 12px; border-radius: 10px; transition: 0.2s;
}
.yuemu-stealth-textarea:focus { border-color: var(--link-color); background: var(--card-background); }

.yuemu-stealth-input::placeholder, .yuemu-stealth-textarea::placeholder {
  color: var(--text-secondary); opacity: 0.6;
}

/* ================= 6. 开关组件 ================= */
.yuemu-item-label { display: flex; align-items: center; gap: 12px; font-size: 15px; color: var(--text-primary); font-weight: 500; }
.yuemu-icon-box { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 13px; }
.yuemu-icon-box.blue { background: #1677ff; }
.yuemu-icon-box.orange { background: #fa8c16; }

.yuemu-ios-switch {
  width: 48px; height: 28px; border-radius: 14px;
  background-color: var(--border-color); position: relative;
  transition: background-color 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.yuemu-ios-switch.active { background-color: #52c41a; }
.yuemu-switch-knob {
  width: 24px; height: 24px; background-color: #fff; border-radius: 50%;
  position: absolute; top: 2px; left: 2px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.yuemu-ios-switch.active .yuemu-switch-knob { transform: translateX(20px); }

/* ================= 7. 操作按钮区 ================= */
.yuemu-action-bar { display: flex; gap: 16px; justify-content: flex-end; margin-top: 24px; }

.yuemu-btn-cancel, .yuemu-btn-submit {
  height: 48px; padding: 0 28px; border-radius: 14px; font-size: 15px; font-weight: 600;
  border: none; cursor: pointer; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex; align-items: center; justify-content: center; gap: 8px;
}

.yuemu-btn-cancel { background: var(--hover-background); color: var(--text-secondary); border: 1px solid var(--border-color); }
.yuemu-btn-cancel:hover { background: var(--border-color); color: var(--text-primary); }

.yuemu-btn-submit { background: var(--link-color); color: #fff; box-shadow: 0 4px 12px rgba(22, 119, 255, 0.2); }
.yuemu-btn-submit:active:not(:disabled) { transform: scale(0.96); }
.yuemu-btn-submit:disabled { background: var(--hover-background); color: var(--text-secondary); box-shadow: none; cursor: not-allowed; border: 1px solid var(--border-color); }

/* ================= 8. 说明引导卡片 ================= */
.yuemu-info-card { height: fit-content; padding: 24px; background: rgba(22, 119, 255, 0.04); border-color: rgba(22, 119, 255, 0.1); }
.yuemu-info-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.yuemu-info-icon { width: 36px; height: 36px; background: var(--link-color); color: #fff; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 16px; box-shadow: 0 4px 12px rgba(22, 119, 255, 0.2);}
.yuemu-info-title { font-size: 16px; font-weight: 600; color: var(--link-color); margin: 0; }

.yuemu-info-list { list-style: none; padding: 0; margin: 0; }
.yuemu-info-list li { font-size: 13px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 12px; padding-left: 18px; position: relative; }
.yuemu-info-list li::before { content: "•"; color: var(--link-color); font-weight: bold; font-size: 16px; position: absolute; left: 0; top: -2px; }

/* ================= 9. 动画与移动端自适应 ================= */
.yuemu-fade-page-enter-active, .yuemu-fade-page-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.yuemu-fade-page-enter-from, .yuemu-fade-page-leave-to { opacity: 0; transform: translateY(10px); }

@media (max-width: 768px) {
  .yuemu-app-scroll-content { padding: 16px; }
  .yuemu-responsive-grid { grid-template-columns: 1fr; gap: 16px; }

  .yuemu-apple-card { padding: 16px; margin-bottom: 16px; border-radius: 16px; }

  /* 移动端输入框改为上下结构，获得更大触控区 */
  .yuemu-form-item { flex-direction: column; align-items: flex-start; gap: 12px; padding: 16px; }
  .yuemu-stealth-input {
    text-align: left; margin-left: 0; width: 100%;
    background: var(--card-background); padding: 12px; border-radius: 10px;
    border: 1px solid transparent; transition: 0.2s;
  }
  .yuemu-stealth-input:focus { border-color: var(--link-color); }

  .yuemu-form-item.yuemu-toggle-item { flex-direction: row; align-items: center; justify-content: space-between; }

  .yuemu-action-bar { flex-direction: column-reverse; gap: 12px; margin-top: 24px; }
  .yuemu-btn-submit, .yuemu-btn-cancel { width: 100%; height: 52px; border-radius: 16px; font-size: 16px;}
}
</style>
