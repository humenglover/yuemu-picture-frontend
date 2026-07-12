<template>
  <div id="yuemu-addPictureBatchPage">
    <div class="yuemu-batch-container yuemu-fade-in-up">
      <header class="yuemu-batch-header">
        <p class="yuemu-batch-desc">{{ t('pages.addPictureBatchPage.pageDesc') }}</p>
      </header>

      <div class="yuemu-control-panel">
        <div class="yuemu-form-group">
          <label class="yuemu-label">{{ t('pages.addPictureBatchPage.labelKeyword') }} <span class="yuemu-required">*</span></label>
          <div class="yuemu-input-wrapper">
            <i class="fas fa-search yuemu-input-icon"></i>
            <input
              type="text"
              v-model.trim="formData.searchText"
              :placeholder="t('pages.addPictureBatchPage.placeholderKeyword')"
              class="yuemu-input"
              :disabled="uploading"
            />
          </div>
        </div>

        <div class="yuemu-form-row">
          <div class="yuemu-form-group yuemu-flex-1">
            <label class="yuemu-label">{{ t('pages.addPictureBatchPage.labelCount') }}</label>
            <div class="yuemu-stepper-wrapper">
              <button class="yuemu-stepper-btn" @click="updateCount(-1)" :disabled="uploading || formData.count <= 1">
                <i class="fas fa-minus"></i>
              </button>
              <input
                type="number"
                v-model.number="formData.count"
                min="1" max="15"
                class="yuemu-stepper-input"
                :disabled="uploading"
                @blur="validateCount"
              />
              <button class="yuemu-stepper-btn" @click="updateCount(1)" :disabled="uploading || formData.count >= 15">
                <i class="fas fa-plus"></i>
              </button>
            </div>
          </div>

          <div class="yuemu-form-group yuemu-flex-2">
            <label class="yuemu-label">{{ t('pages.addPictureBatchPage.labelCategory') }} <span class="yuemu-required">*</span></label>
            <div class="yuemu-input-wrapper yuemu-select-wrapper">
              <i class="fas fa-folder-open yuemu-input-icon"></i>
              <input
                type="text"
                v-model.trim="formData.category"
                :placeholder="t('pages.addPictureBatchPage.placeholderCategory')"
                class="yuemu-input"
                :disabled="uploading"
                @focus="showCategoryList = true"
                @blur="hideCategoryListDelay"
              />
              <i class="fas fa-chevron-down yuemu-dropdown-icon"></i>
              <transition name="yuemu-dropdown-fade">
                <div class="yuemu-dropdown-list" v-if="showCategoryList && categoryOptions.length > 0">
                  <div
                    v-for="cat in categoryOptions"
                    :key="cat.value"
                    class="yuemu-dropdown-item"
                    @click="selectCategory(cat.value)"
                  >
                    {{ cat.label }}
                  </div>
                </div>
              </transition>
            </div>
          </div>
        </div>
      </div>

      <button
        v-if="!uploading && !progress.completed"
        class="yuemu-execute-btn"
        :class="{ 'yuemu-is-loading': loading }"
        :disabled="loading"
        @click="handleSubmit"
      >
        <span class="yuemu-btn-text">{{ loading ? t('pages.addPictureBatchPage.btnInitEngine') : t('pages.addPictureBatchPage.btnStartFetch') }}</span>
        <i v-if="!loading" class="fas fa-bolt yuemu-btn-icon"></i>
        <i v-else class="fas fa-circle-notch fa-spin yuemu-btn-icon"></i>
      </button>

      <transition name="yuemu-panel-slide">
        <div v-if="uploading || progress.completed" class="yuemu-progress-panel">

          <div class="yuemu-progress-header">
            <div class="yuemu-stage-info">
              <span class="yuemu-stage-dot" :class="progress.stage"></span>
              <span class="yuemu-stage-text">{{ progress.stageDescription || t('pages.addPictureBatchPage.connecting') }}</span>
            </div>
            <div class="yuemu-percentage-text">{{ progress.percentage }}%</div>
          </div>

          <div class="yuemu-progress-track">
            <div
              class="yuemu-progress-bar"
              :class="{ 'yuemu-is-error': progress.stage === 'error', 'yuemu-is-success': progress.completed }"
              :style="{ width: `${progress.percentage}%` }"
            ></div>
          </div>

          <div v-if="progress.stage === 'uploading'" class="yuemu-radar-details">
            <div class="yuemu-stats-row">
              <span class="yuemu-stat-label">{{ t('pages.addPictureBatchPage.engineLoad') }} <span class="yuemu-stat-value yuemu-highlight">{{ progress.current }} / {{ progress.total }}</span></span>
            </div>
            <div v-if="progress.currentPictureTitle" class="yuemu-current-file">
              <i class="fas fa-file-image yuemu-file-icon yuemu-pulse"></i>
              <div class="yuemu-file-info">
                <div class="yuemu-file-name">{{ t('pages.addPictureBatchPage.importing') }} {{ progress.currentPictureTitle }}</div>
                <div class="yuemu-file-status">{{ t('pages.addPictureBatchPage.encryptTransfer') }}</div>
              </div>
            </div>
          </div>

          <div v-if="progress.completed" class="yuemu-result-summary" :class="progress.stage === 'error' ? 'yuemu-error-panel' : 'yuemu-success-panel'">
            <div class="yuemu-result-icon">
              <i :class="progress.stage === 'error' ? 'fas fa-times-circle' : 'fas fa-check-circle'"></i>
            </div>
            <div class="yuemu-result-content">
              <h3 v-if="progress.stage === 'error'">{{ t('pages.addPictureBatchPage.taskInterrupt') }}</h3>
              <h3 v-else>{{ t('pages.addPictureBatchPage.taskComplete') }}</h3>
              <p v-if="progress.stage === 'error'">{{ progress.errorMessage }}</p>
              <p v-else>{{ t('pages.addPictureBatchPage.successMsg', { successCount: progress.successCount }) }}<span v-if="progress.failCount > 0">{{ t('pages.addPictureBatchPage.failMsg', { failCount: progress.failCount }) }}</span>。</p>
            </div>
          </div>

          <div v-if="progress.completed" class="yuemu-result-actions">
            <button class="yuemu-action-btn yuemu-ghost" @click="handleReset">{{ t('pages.addPictureBatchPage.btnContinue') }}</button>
            <button class="yuemu-action-btn yuemu-primary" @click="handleGoHome" v-if="progress.stage !== 'error'">{{ t('pages.addPictureBatchPage.btnViewGallery') }}</button>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { onMounted, onUnmounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { listPictureTagCategoryUsingGet, uploadPictureByBatchUsingPost } from '@/api/pictureController.ts'
import { useRouter } from 'vue-router'
import { useLoginUserStore } from '@/stores/useLoginUserStore'

const router = useRouter()
const loginUserStore = useLoginUserStore()
const { t } = useI18n()

const formData = reactive({
  searchText: '',
  count: 10,
  category: ''
})

const loading = ref(false)
const uploading = ref(false)
const categoryOptions = ref<{ value: string; label: string }[]>([])
const showCategoryList = ref(false)

const updateCount = (delta: number) => {
  const newVal = formData.count + delta
  if (newVal >= 1 && newVal <= 15) {
    formData.count = newVal
  }
}
const validateCount = () => {
  if (formData.count < 1) formData.count = 1
  if (formData.count > 15) formData.count = 15
}

const hideCategoryListDelay = () => {
  setTimeout(() => { showCategoryList.value = false }, 200)
}
const selectCategory = (val: string) => {
  formData.category = val
  showCategoryList.value = false
}

let ws: WebSocket | null = null
const progress = reactive({
  taskId: '', stage: '', stageDescription: '', total: 0, current: 0,
  percentage: 0, currentPictureTitle: '', successCount: 0, failCount: 0,
  errorMessage: '', completed: false
})

const getTagCategoryOptions = async () => {
  try {
    const res = await listPictureTagCategoryUsingGet()
    if (res.data.code === 0 && res.data.data) {
      categoryOptions.value = (res.data.data.categoryList ?? []).map((data: string) => ({ value: data, label: data }))
    }
  } catch (error) {
    console.error('获取分类失败', error)
  }
}

const connectWebSocket = () => {
  const userId = loginUserStore.loginUser?.id
  if (!userId) { message.error(t('pages.addPictureBatchPage.toastPleaseLogin')); return false }

  const wsUrl = import.meta.env.VITE_WS_URL || (window.location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + window.location.host
  const wsEndpoint = `${wsUrl}/api/ws/batch-upload?userId=${userId}`

  try {
    ws = new WebSocket(wsEndpoint)
    ws.onopen = () => { message.success(t('pages.addPictureBatchPage.toastEngineConnected')) }
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        Object.assign(progress, data)
        if (data.stage === 'completed') {
          message.success(t('pages.addPictureBatchPage.toastFetchComplete'))
          uploading.value = false
        } else if (data.stage === 'error') {
          message.error(data.errorMessage || t('pages.addPictureBatchPage.toastFetchFail'))
          uploading.value = false
        }
      } catch (error) {}
    }
    ws.onerror = () => { message.warning(t('pages.addPictureBatchPage.toastConnectionFluctuation')) }
    return true
  } catch (error) { return false }
}

const closeWebSocket = () => { if (ws) { ws.close(); ws = null } }

const resetProgress = () => {
  Object.assign(progress, {
    taskId: '', stage: '', stageDescription: '', total: 0, current: 0,
    percentage: 0, currentPictureTitle: '', successCount: 0, failCount: 0,
    errorMessage: '', completed: false
  })
}

const handleSubmit = async () => {
  if (!formData.searchText) return message.warning(t('pages.addPictureBatchPage.toastMustEnterKeyword'))
  if (!formData.category) return message.warning(t('pages.addPictureBatchPage.toastMustSelectCategory'))

  connectWebSocket()
  await new Promise(resolve => setTimeout(resolve, 600))

  loading.value = true
  uploading.value = true
  resetProgress()

  try {
    const res = await uploadPictureByBatchUsingPost({
      searchText: formData.searchText,
      count: Math.floor(formData.count),
      categoryName: formData.category
    })

    if (res.data.code === 0) {
      // 🎯 任务已提交到后台，通过 WebSocket 接收进度，这里立即结束 loading 状态
      message.success(t('pages.addPictureBatchPage.toastTaskStarted'))
    } else {
      message.error(res.data.message || t('pages.addPictureBatchPage.toastEngineStartFail'))
      uploading.value = false
      closeWebSocket()
    }
  } catch (error) {
    message.error(t('pages.addPictureBatchPage.toastNetworkError'))
    uploading.value = false
    closeWebSocket()
  } finally {
    loading.value = false
  }
}


const handleReset = () => {
  resetProgress()
  uploading.value = false
  formData.searchText = ''
  formData.count = 10
}

const handleGoHome = () => { router.push('/') }

onMounted(() => { getTagCategoryOptions() })
onUnmounted(() => { closeWebSocket() })
</script>

<style scoped>
/* ================= 全局与容器 ================= */
#yuemu-addPictureBatchPage {
  min-height: calc(100vh - 64px);
  background-color: var(--background);
  color: var(--text-primary);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 60px 20px;
  box-sizing: border-box;
}

.yuemu-batch-container {
  width: 100%;
  max-width: 540px;
  position: relative;
  z-index: 10;
}

/* ================= 头部介绍 ================= */
.yuemu-batch-header { text-align: center; margin-bottom: 32px; }
.yuemu-icon-ring {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  border-radius: 50%;
  background: var(--card-background);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: var(--link-color);
  box-shadow: 0 4px 12px var(--shadow-color);
}

.yuemu-batch-title { font-size: 28px; font-weight: 700; margin: 0 0 8px; color: var(--text-primary); letter-spacing: -0.5px; }
.yuemu-batch-desc { font-size: 15px; color: var(--text-secondary); margin: 0; line-height: 1.5; }

/* ================= 核心表单 ================= */
.yuemu-control-panel {
  background: var(--card-background);
  border-radius: 18px;
  padding: 32px;
  box-shadow: 0 8px 30px var(--shadow-color);
  margin-bottom: 24px;
  position: relative;
  z-index: 50;
  border: 1px solid var(--border-color);
}

.yuemu-form-row { display: flex; gap: 16px; margin-top: 20px; }
.yuemu-flex-1 { flex: 1; } .yuemu-flex-2 { flex: 2; }
.yuemu-form-group { display: flex; flex-direction: column; gap: 8px; }

.yuemu-label { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.yuemu-required { color: #ff3b30; }

/* 苹果风输入框 */
.yuemu-input-wrapper { position: relative; display: flex; align-items: center; }
.yuemu-input-icon { position: absolute; left: 14px; color: var(--text-secondary); font-size: 15px; pointer-events: none; }
.yuemu-input {
  width: 100%;
  height: 48px;
  padding: 0 16px 0 40px;
  font-size: 15px;
  color: var(--text-primary);
  background: var(--hover-background);
  border: 1px solid transparent;
  border-radius: 12px;
  outline: none;
  transition: all 0.2s ease;
}

.yuemu-input:focus {
  background: var(--card-background);
  border-color: var(--link-color);
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}
.yuemu-input:focus + .yuemu-input-icon { color: var(--link-color); }
.yuemu-input::placeholder { color: var(--text-secondary); opacity: 0.7;}
.yuemu-input:disabled { opacity: 0.5; cursor: not-allowed; }

/* 苹果风数字步进器 */
.yuemu-stepper-wrapper {
  display: flex; align-items: center; height: 48px; background: var(--hover-background);
  border-radius: 12px; overflow: hidden; border: 1px solid transparent;
}

.yuemu-stepper-btn {
  width: 40px; height: 100%; background: transparent; border: none; color: var(--text-primary);
  font-size: 14px; cursor: pointer; transition: 0.2s;
}

.yuemu-stepper-btn:hover:not(:disabled) { background: var(--border-color); }
.yuemu-stepper-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.yuemu-stepper-input {
  flex: 1; height: 100%; width: 0; text-align: center; font-size: 15px; font-weight: 500;
  color: var(--text-primary); background: transparent; border: none; outline: none;
  -moz-appearance: textfield;
}
.yuemu-stepper-input::-webkit-outer-spin-button, .yuemu-stepper-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }

/* 苹果风下拉菜单 */
.yuemu-select-wrapper { cursor: pointer; }
.yuemu-dropdown-icon { position: absolute; right: 14px; color: var(--text-secondary); font-size: 12px; pointer-events: none; }
.yuemu-dropdown-list {
  position: absolute; top: calc(100% + 8px); left: 0; width: 100%; max-height: 220px; overflow-y: auto;
  background: var(--ios-bg-blur);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: 0 10px 40px var(--shadow-color);
  z-index: 100;
  padding: 6px;
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
}

.yuemu-dropdown-item { padding: 10px 14px; font-size: 14px; color: var(--text-primary); cursor: pointer; border-radius: 8px; transition: 0.2s; }
.yuemu-dropdown-item:hover { background: var(--link-color); color: #fff; }
.yuemu-dropdown-fade-enter-active, .yuemu-dropdown-fade-leave-active { transition: opacity 0.2s, transform 0.2s; }
.yuemu-dropdown-fade-enter-from, .yuemu-dropdown-fade-leave-to { opacity: 0; transform: translateY(-5px); }

/* ================= 执行按钮 ================= */
.yuemu-execute-btn {
  width: 100%; height: 50px; border-radius: 12px; border: none;
  background: var(--link-color);
  color: #fff; font-size: 16px; font-weight: 600;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  cursor: pointer; transition: all 0.2s ease;
  position: relative; z-index: 10;
}
.yuemu-execute-btn:hover:not(:disabled) { background: var(--link-hover-color); }
.yuemu-execute-btn:active:not(:disabled) { transform: scale(0.98); }
.yuemu-execute-btn.yuemu-is-loading { opacity: 0.7; cursor: not-allowed; }

/* ================= 雷达进度面板 ================= */
.yuemu-progress-panel {
  background: var(--card-background); border-radius: 18px; border: 1px solid var(--border-color);
  padding: 32px; box-shadow: 0 8px 30px var(--shadow-color);
  margin-top: 24px; position: relative; z-index: 10;
}

.yuemu-progress-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.yuemu-stage-info { display: flex; align-items: center; gap: 8px; }
.yuemu-stage-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--link-color); }
.yuemu-stage-dot.error { background: #ff3b30; }
.yuemu-stage-dot.completed { background: #34c759; }
.yuemu-stage-text { font-size: 15px; font-weight: 600; color: var(--text-primary); }
.yuemu-percentage-text { font-size: 20px; font-weight: 700; color: var(--text-primary); font-variant-numeric: tabular-nums; }

/* 苹果风进度条 */
.yuemu-progress-track { height: 6px; background: var(--hover-background); border-radius: 6px; overflow: hidden; margin-bottom: 24px; }
.yuemu-progress-bar { height: 100%; background: var(--link-color); border-radius: 6px; transition: width 0.3s ease; }
.yuemu-progress-bar.yuemu-is-success { background: #34c759; }
.yuemu-progress-bar.yuemu-is-error { background: #ff3b30; }

/* 抓取流动详情 */
.yuemu-radar-details { background: var(--hover-background); border-radius: 12px; padding: 16px; border: 1px solid var(--border-color); }
.yuemu-stats-row { margin-bottom: 12px; font-size: 13px; color: var(--text-secondary); font-weight: 500;}
.yuemu-highlight { color: var(--text-primary); font-weight: 600; font-size: 14px; margin-left: 6px; }

.yuemu-current-file { display: flex; align-items: center; gap: 12px; }
.yuemu-file-icon { font-size: 20px; color: var(--link-color); }
.yuemu-file-icon.yuemu-pulse { animation: yuemu-file-pulse 1.5s infinite ease-in-out; }
@keyframes yuemu-file-pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.05); opacity: 0.6; } }
.yuemu-file-info { flex: 1; overflow: hidden; }
.yuemu-file-name { font-size: 14px; font-weight: 500; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px; }
.yuemu-file-status { font-size: 12px; color: var(--text-secondary); }

/* 结果汇总 */
.yuemu-result-summary { display: flex; align-items: center; gap: 16px; padding: 20px; border-radius: 12px; margin-bottom: 24px; }
.yuemu-result-summary.yuemu-success-panel { background: rgba(52, 199, 89, 0.1); border: 1px solid rgba(52, 199, 89, 0.2); }
.yuemu-result-summary.yuemu-error-panel { background: rgba(255, 59, 48, 0.1); border: 1px solid rgba(255, 59, 48, 0.2); }
.yuemu-result-icon { font-size: 32px; }
.yuemu-success-panel .yuemu-result-icon { color: #34c759; }
.yuemu-error-panel .yuemu-result-icon { color: #ff3b30; }
.yuemu-result-content h3 { margin: 0 0 4px; font-size: 16px; font-weight: 600; color: var(--text-primary); }
.yuemu-result-content p { margin: 0; font-size: 14px; color: var(--text-secondary); line-height: 1.5; }
.yuemu-success-num { font-weight: 600; color: #34c759; font-size: 15px; }

.yuemu-result-actions { display: flex; gap: 12px; }
.yuemu-action-btn { flex: 1; height: 44px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; }
.yuemu-action-btn.yuemu-ghost { background: var(--hover-background); border: 1px solid var(--border-color); color: var(--text-primary); }
.yuemu-action-btn.yuemu-ghost:hover { background: var(--border-color); }
.yuemu-action-btn.yuemu-primary { background: var(--link-color); color: #fff; border: none; }
.yuemu-action-btn.yuemu-primary:hover { background: var(--link-hover-color); }

/* ================= 动画与响应式 ================= */
.yuemu-fade-in-up { animation: yuemuFadeInUp 0.5s ease forwards; }
@keyframes yuemuFadeInUp { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }

.yuemu-panel-slide-enter-active, .yuemu-panel-slide-leave-active { transition: all 0.3s ease; overflow: hidden; }
.yuemu-panel-slide-enter-from, .yuemu-panel-slide-leave-to { opacity: 0; transform: translateY(-10px); max-height: 0; padding-top: 0; padding-bottom: 0; margin-top: 0; }
.yuemu-panel-slide-enter-to, .yuemu-panel-slide-leave-from { max-height: 400px; }

@media (max-width: 768px) {
  #yuemu-addPictureBatchPage { padding: 20px 16px; }
  .yuemu-batch-title { font-size: 24px; }
  .yuemu-control-panel { padding: 24px 20px; }
  .yuemu-form-row { flex-direction: column; gap: 16px; }
  .yuemu-result-summary { flex-direction: column; text-align: center; gap: 12px; }
}
</style>
