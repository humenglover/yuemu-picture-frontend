<template>
  <div class="yuemu-compact-editor-page">
    <header class="yuemu-compact-header">
      <button class="yuemu-nav-btn yuemu-cancel" @click="handleCancel">{{ t('pages.activityEditPage.btnCancel') }}</button>
      <div class="yuemu-header-title">{{ isEdit ? t('pages.activityEditPage.titleEdit') : t('pages.activityEditPage.titlePublish') }}</div>
      <button
        class="yuemu-nav-btn yuemu-publish"
        :class="{ 'yuemu-disabled': !canSubmit }"
        @click="handleSubmit"
        :disabled="!canSubmit || submitting"
      >
        <i class="fas fa-spinner fa-spin" v-if="submitting"></i>
        <span v-else>{{ t('pages.activityEditPage.btnComplete') }}</span>
      </button>
    </header>

    <main class="yuemu-compact-scroll-body">
      <div class="yuemu-section-title-wrap">
        <textarea
          v-model="formState.title"
          class="yuemu-compact-title-input"
          :placeholder="t('pages.activityEditPage.inputTitlePlaceholder')"
          rows="1"
          maxlength="100"
          @input="autoResizeTextarea"
          ref="titleInputRef"
        ></textarea>
      </div>

      <div class="yuemu-section-cover-wrap">
        <div class="yuemu-cover-dropzone" :class="{ 'yuemu-has-img': formState.coverUrl }" @click="!uploading && triggerCoverUpload()">
          <template v-if="formState.coverUrl">
            <img :src="formState.coverUrl" class="yuemu-cover-img" />
            <div class="yuemu-cover-overlay">
              <button class="yuemu-mini-btn" @click.stop="triggerCoverUpload()"><i class="fas fa-sync"></i> {{ t('pages.activityEditPage.btnReplace') }}</button>
              <button class="yuemu-mini-btn" @click.stop="showCoverGenerator = true"><i class="fas fa-wand-magic-sparkles"></i> {{ t('pages.activityEditPage.btnAi') }}</button>
            </div>
          </template>
          <template v-else>
            <div class="yuemu-empty-state">
              <i class="fas fa-camera"></i>
              <span>{{ t('pages.activityEditPage.addCover') }}</span>
            </div>
          </template>
          <div class="yuemu-upload-progress-mask" v-if="uploading">
            <i class="fas fa-circle-notch fa-spin"></i> {{ uploadProgress }}%
          </div>
        </div>
        <input type="file" ref="coverFileInput" accept="image/*" @change="handleCoverUpload" hidden />
      </div>

      <div class="yuemu-compact-group">
        <div class="yuemu-group-inner">
          <div class="yuemu-setting-row">
            <div class="yuemu-row-left">
              <div class="yuemu-icon-mono"><i class="fas fa-calendar-alt"></i></div>
              <span class="yuemu-label-main">{{ t('pages.activityEditPage.expireDate') }} <span class="yuemu-required">*</span></span>
            </div>
            <div class="yuemu-row-right">
              <div class="yuemu-ios-picker-bubble">
                <input
                  type="date"
                  v-model="formState.expireDate"
                  :min="minDate"
                  @change="handleDateChange"
                  class="yuemu-mini-native-input"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="yuemu-compact-group">
        <div class="yuemu-group-title">{{ t('pages.activityEditPage.interactionSetting') }}</div>
        <div class="yuemu-group-inner" :class="{ 'yuemu-disabled-group': isActivityExpired }">

          <div class="yuemu-setting-row" @click="checkPrerequisites">
            <div class="yuemu-row-left">
              <div class="yuemu-icon-mono"><i class="fas fa-images"></i></div>
              <div class="yuemu-label-stack">
                <span class="yuemu-label-main">{{ t('pages.activityEditPage.worksCollection') }}</span>
              </div>
            </div>
            <div class="yuemu-row-right">
              <label class="yuemu-mini-switch" :class="{ 'yuemu-disabled': !formState.expireDate || isActivityExpired }">
                <input
                  type="checkbox"
                  v-model="formState.allowSubmission"
                  :disabled="!formState.expireDate || isActivityExpired"
                  @change="handleSubmissionToggle"
                >
                <span class="yuemu-slider"></span>
              </label>
            </div>
          </div>

          <div class="yuemu-collapse-panel" :class="{ 'yuemu-is-open': formState.allowSubmission }">
            <div class="yuemu-sub-row">
              <label>{{ t('pages.activityEditPage.startTime') }}</label>
              <div class="yuemu-ios-picker-bubble">
                <input
                  type="datetime-local"
                  v-model="formState.submissionStartTime"
                  :max="subStartMax"
                  class="yuemu-mini-native-input"
                />
              </div>
            </div>
            <div class="yuemu-sub-row">
              <label>{{ t('pages.activityEditPage.endTime') }}</label>
              <div class="yuemu-ios-picker-bubble">
                <input
                  type="datetime-local"
                  v-model="formState.submissionEndTime"
                  :min="subEndMin"
                  :max="maxDatetime"
                  class="yuemu-mini-native-input"
                />
              </div>
            </div>
            <div class="yuemu-sub-row">
              <label>{{ t('pages.activityEditPage.maxSubmissions') }}</label>
              <div class="yuemu-number-wrap">
                <input type="number" v-model.number="formState.maxSubmissionsPerUser" min="1" max="10" />
                <span>{{ t('pages.activityEditPage.unitCopies') }}</span>
              </div>
            </div>
            <div class="yuemu-sub-row">
              <label>{{ t('pages.activityEditPage.manualAudit') }}</label>
              <label class="yuemu-mini-switch">
                <input type="checkbox" v-model="formState.isNeedAudit" :true-value="1" :false-value="0">
                <span class="yuemu-slider"></span>
              </label>
            </div>
          </div>

          <div class="yuemu-divider"></div>

          <div class="yuemu-setting-row" @click="checkPrerequisites">
            <div class="yuemu-row-left">
              <div class="yuemu-icon-mono"><i class="fas fa-check-square"></i></div>
              <div class="yuemu-label-stack">
                <span class="yuemu-label-main">{{ t('pages.activityEditPage.publicVoting') }}</span>
              </div>
            </div>
            <div class="yuemu-row-right">
              <label class="yuemu-mini-switch" :class="{ 'yuemu-disabled': !formState.expireDate || isActivityExpired }">
                <input
                  type="checkbox"
                  v-model="formState.allowVote"
                  :disabled="!formState.expireDate || isActivityExpired"
                  @change="handleVoteToggle"
                >
                <span class="yuemu-slider"></span>
              </label>
            </div>
          </div>

          <div class="yuemu-collapse-panel" :class="{ 'yuemu-is-open': formState.allowVote }">
            <div class="yuemu-sub-row">
              <label>{{ t('pages.activityEditPage.startTime') }}</label>
              <div class="yuemu-ios-picker-bubble">
                <input
                  type="datetime-local"
                  v-model="formState.voteStartTime"
                  :max="voteStartMax"
                  class="yuemu-mini-native-input"
                />
              </div>
            </div>
            <div class="yuemu-sub-row">
              <label>{{ t('pages.activityEditPage.voteEndTime') }}</label>
              <div class="yuemu-ios-picker-bubble">
                <input
                  type="datetime-local"
                  v-model="formState.voteEndTime"
                  :min="voteEndMin"
                  :max="maxDatetime"
                  class="yuemu-mini-native-input"
                />
              </div>
            </div>
            <div class="yuemu-sub-row">
              <label>{{ t('pages.activityEditPage.voteType') }}</label>
              <select v-model.number="formState.voteType" @change="handleVoteTypeChange" class="yuemu-ios-select-bubble">
                <option :value="0">{{ t('pages.activityEditPage.voteSingle') }}</option>
                <option :value="1">{{ t('pages.activityEditPage.voteMultiple') }}</option>
              </select>
            </div>
            <div class="yuemu-sub-row" v-if="formState.voteType === 1">
              <label>{{ t('pages.activityEditPage.maxVotes') }}</label>
              <div class="yuemu-number-wrap">
                <input type="number" v-model.number="formState.maxVotesPerUser" min="2" max="20" />
                <span>{{ t('pages.activityEditPage.unitVotes') }}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      <div class="yuemu-compact-group yuemu-editor-group">
        <div class="yuemu-group-title">{{ t('pages.activityEditPage.contentTitle') }} <span class="yuemu-required">*</span></div>
        <div class="yuemu-compact-editor">
          <div class="yuemu-editor-toolbar-mini">
            <Toolbar :editor="editorRef" :defaultConfig="toolbarConfig" :mode="mode" />
          </div>
          <div class="yuemu-editor-content-mini">
            <Editor v-model="formState.content" :defaultConfig="editorConfig" :mode="mode" @onCreated="handleCreated" />
          </div>
        </div>
      </div>
    </main>

    <div class="yuemu-compact-toast" :class="{ 'yuemu-show': showToast, 'yuemu-error': toastType === 'error' }">
      {{ toastMessage }}
    </div>

    <CoverGenerator v-if="showCoverGenerator" :initialText="formState.title || t('pages.activityEditPage.coverTitle')" @close="showCoverGenerator = false" @confirm="handleCoverGenerated" />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { ref, computed, shallowRef, onBeforeUnmount, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import '@wangeditor/editor/dist/css/style.css'
import dayjs from 'dayjs'
import { uploadPostImageUsingPost } from '@/api/pictureController'
import { addActivityUsingPost, editActivityUsingPost, getActivityByIdUsingGet } from '@/api/activityController'
import CoverGenerator from '@/components/CoverGenerator.vue'

interface FormState {
  id?: string; title: string; coverUrl: string; expireTime: dayjs.Dayjs | null; expireDate: string; content: string; spaceId?: number;
  allowSubmission: boolean; submissionStartTime: string; submissionEndTime: string; maxSubmissionsPerUser: number; isNeedAudit: number;
  allowVote: boolean; voteStartTime: string; voteEndTime: string; voteType: number; maxVotesPerUser: number;
}

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const editorRef = shallowRef()
const mode = 'default'
const submitting = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
const coverFileInput = ref<HTMLInputElement>()
const showCoverGenerator = ref(false)
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'error'>('success')
const titleInputRef = ref<HTMLTextAreaElement>()

const isEdit = computed(() => !!route.params.id)

const spaceId = computed(() => {
  const querySpaceId = route.query.spaceId as string
  return querySpaceId ? Number(querySpaceId) : undefined
})

const minDate = computed(() => dayjs().format('YYYY-MM-DD'))
const currentDatetime = computed(() => dayjs().format('YYYY-MM-DDTHH:mm'))

const maxDatetime = computed(() => {
  if (!formState.value.expireDate) return ''
  return `${formState.value.expireDate}T23:59`
})

const subStartMax = computed(() => formState.value.submissionEndTime || maxDatetime.value)
const subEndMin = computed(() => formState.value.submissionStartTime || currentDatetime.value)

const voteStartMax = computed(() => formState.value.voteEndTime || maxDatetime.value)
const voteEndMin = computed(() => formState.value.voteStartTime || currentDatetime.value)

const isActivityExpired = computed(() => {
  return isEdit.value && formState.value.expireTime && dayjs().isAfter(formState.value.expireTime)
})

const canSubmit = computed(() => {
  return formState.value.title.trim().length > 0 &&
    formState.value.coverUrl &&
    formState.value.expireDate &&
    formState.value.content.trim().length > 10
})

const formState = ref<FormState>({
  title: '', coverUrl: '', expireTime: null, expireDate: '', content: '', spaceId: spaceId.value,
  allowSubmission: false, submissionStartTime: '', submissionEndTime: '', maxSubmissionsPerUser: 1, isNeedAudit: 1,
  allowVote: false, voteStartTime: '', voteEndTime: '', voteType: 0, maxVotesPerUser: 1,
})

const autoResizeTextarea = () => {
  const el = titleInputRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = el.scrollHeight + 'px'
}

const showToastMessage = (message: string, type: 'success' | 'error' = 'success') => {
  toastMessage.value = message; toastType.value = type; showToast.value = true
  setTimeout(() => { showToast.value = false }, 3000)
}

const checkPrerequisites = () => {
  if (isActivityExpired.value) {
    showToastMessage(t('pages.activityEditPage.toastActivityExpired'), 'error')
    return
  }
  if (!formState.value.expireDate) {
    showToastMessage(t('pages.activityEditPage.toastSetExpireDateFirst'), 'error')
  }
}

const handleSubmissionToggle = () => {
  if (formState.value.allowSubmission) {
    formState.value.submissionStartTime = dayjs().format('YYYY-MM-DDTHH:mm')
    formState.value.submissionEndTime = `${formState.value.expireDate}T23:59`
  }
}

const handleVoteToggle = () => {
  if (formState.value.allowVote) {
    formState.value.voteStartTime = dayjs().format('YYYY-MM-DDTHH:mm')
    formState.value.voteEndTime = `${formState.value.expireDate}T23:59`
  }
}

const handleVoteTypeChange = () => {
  if (formState.value.voteType === 0) {
    formState.value.maxVotesPerUser = 1
  } else if (formState.value.voteType === 1 && formState.value.maxVotesPerUser <= 1) {
    formState.value.maxVotesPerUser = 2
  }
}

const handleDateChange = () => {
  if (formState.value.expireDate) {
    const endOfDay = dayjs(formState.value.expireDate).endOf('day')
    formState.value.expireTime = endOfDay

    if (formState.value.allowSubmission && formState.value.submissionEndTime) {
      if (dayjs(formState.value.submissionEndTime).isAfter(endOfDay)) {
        formState.value.submissionEndTime = `${formState.value.expireDate}T23:59`
      }
    }
    if (formState.value.allowVote && formState.value.voteEndTime) {
      if (dayjs(formState.value.voteEndTime).isAfter(endOfDay)) {
        formState.value.voteEndTime = `${formState.value.expireDate}T23:59`
      }
    }
  } else {
    formState.value.allowSubmission = false
    formState.value.allowVote = false
  }
}

const validateTimes = (): boolean => {
  if (formState.value.allowSubmission) {
    const start = dayjs(formState.value.submissionStartTime)
    const end = dayjs(formState.value.submissionEndTime)
    if (!start.isValid() || !end.isValid()) { showToastMessage(t('pages.activityEditPage.toastCompleteCollectionTime'), 'error'); return false }
    if (start.isAfter(end)) { showToastMessage(t('pages.activityEditPage.toastCollectionStartError'), 'error'); return false }
    if (end.isAfter(formState.value.expireTime)) { showToastMessage(t('pages.activityEditPage.toastCollectionEndError'), 'error'); return false }
  }

  if (formState.value.allowVote) {
    const start = dayjs(formState.value.voteStartTime)
    const end = dayjs(formState.value.voteEndTime)
    if (!start.isValid() || !end.isValid()) { showToastMessage(t('pages.activityEditPage.toastCompleteVoteTime'), 'error'); return false }
    if (start.isAfter(end)) { showToastMessage(t('pages.activityEditPage.toastVoteStartError'), 'error'); return false }
    if (end.isAfter(formState.value.expireTime)) { showToastMessage(t('pages.activityEditPage.toastVoteEndError'), 'error'); return false }
  }
  return true
}

const handleSubmit = async () => {
  if (!canSubmit.value) {
    showToastMessage(t('pages.activityEditPage.toastIncompleteForm'), 'error')
    return
  }
  if (!validateTimes()) return

  submitting.value = true
  try {
    const req: any = {
      title: formState.value.title, content: editorRef.value?.getHtml() || '', coverUrl: formState.value.coverUrl,
      expireTime: formState.value.expireTime?.format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
      allowSubmission: formState.value.allowSubmission ? 1 : 0,
      submissionStartTime: formState.value.allowSubmission ? dayjs(formState.value.submissionStartTime).format('YYYY-MM-DDTHH:mm:ss.SSSZ') : undefined,
      submissionEndTime: formState.value.allowSubmission ? dayjs(formState.value.submissionEndTime).format('YYYY-MM-DDTHH:mm:ss.SSSZ') : undefined,
      maxSubmissionsPerUser: formState.value.allowSubmission ? (formState.value.maxSubmissionsPerUser || 1) : undefined,
      allowVote: formState.value.allowVote ? 1 : 0,
      voteStartTime: formState.value.allowVote ? dayjs(formState.value.voteStartTime).format('YYYY-MM-DDTHH:mm:ss.SSSZ') : undefined,
      voteEndTime: formState.value.allowVote ? dayjs(formState.value.voteEndTime).format('YYYY-MM-DDTHH:mm:ss.SSSZ') : undefined,
      voteType: formState.value.allowVote ? formState.value.voteType : undefined,
      maxVotesPerUser: formState.value.allowVote ? (formState.value.maxVotesPerUser || 1) : undefined,
      isNeedAudit: formState.value.isNeedAudit,
    }

    if (spaceId.value) {
      req.spaceId = spaceId.value
    }

    if (isEdit.value) {
      req.id = formState.value.id
      const res = await editActivityUsingPost(req)
      if (res.data?.code === 0) {
        showToastMessage(t('pages.activityEditPage.toastUpdateSuccess'), 'success')
        setTimeout(() => router.push(`/activity/detail/${formState.value.id}`), 1000)
      } else {
        showToastMessage(res.data?.message || t('pages.activityEditPage.toastUpdateFail'), 'error')
      }
    } else {
      const res = await addActivityUsingPost(req)
      if (res.data?.data) {
        showToastMessage(t('pages.activityEditPage.toastPublishSuccess'), 'success')
        setTimeout(() => router.push(`/activity/detail/${res.data.data}`), 1000)
      } else {
        showToastMessage(res.data?.message || t('pages.activityEditPage.toastPublishFail'), 'error')
      }
    }
  } catch (error: any) {
    showToastMessage(isEdit.value ? t('pages.activityEditPage.toastUpdateFail') : t('pages.activityEditPage.toastPublishFail'), 'error')
  }
  finally { submitting.value = false }
}

const triggerCoverUpload = () => coverFileInput.value?.click()
const handleCoverUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement; const file = target.files?.[0]
  if (!file) return
  try {
    uploading.value = true; uploadProgress.value = 10
    const compressedFile = await compressImage(file)
    uploadProgress.value = 40
    const res = await uploadPostImageUsingPost({}, {}, compressedFile)
    uploadProgress.value = 90
    if (res.data.code === 0 && res.data.data) {
      formState.value.coverUrl = res.data.data.url
    } else throw new Error(t('pages.activityEditPage.toastUploadFail'))
  } catch (error: any) { showToastMessage(t('pages.activityEditPage.toastUploadFail'), 'error') }
  finally { uploading.value = false; uploadProgress.value = 0; if (target) target.value = '' }
}

const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve) => {
    const reader = new FileReader(); reader.readAsDataURL(file)
    reader.onload = (e) => {
      const img = new Image(); img.src = e.target?.result as string
      img.onload = () => {
        let width = img.width, height = img.height
        if (width > 1920 || height > 1080) {
          const ratio = Math.min(1920 / width, 1080 / height); width *= ratio; height *= ratio
        }
        const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height
        canvas.getContext('2d')?.drawImage(img, 0, 0, width, height)
        canvas.toBlob((blob) => {
          resolve(blob ? new File([blob], file.name.replace(/\.[^/.]+$/, '.webp'), { type: 'image/webp' }) : file)
        }, 'image/webp', 0.8)
      }
    }
  })
}

const getActivityDetail = async () => {
  const id = route.params.id as string
  if (!id) return
  try {
    const res = await getActivityByIdUsingGet({ id })
    if (res.data?.data) {
      const act = res.data.data
      formState.value = {
        id: act.id, title: act.title, content: act.content, coverUrl: act.coverUrl,
        expireTime: dayjs(act.expireTime), expireDate: dayjs(act.expireTime).format('YYYY-MM-DD'),
        allowSubmission: act.allowSubmission === 1,
        submissionStartTime: act.submissionStartTime ? dayjs(act.submissionStartTime).format('YYYY-MM-DDTHH:mm') : '',
        submissionEndTime: act.submissionEndTime ? dayjs(act.submissionEndTime).format('YYYY-MM-DDTHH:mm') : '',
        maxSubmissionsPerUser: act.maxSubmissionsPerUser || 1,
        isNeedAudit: act.isNeedAudit !== undefined ? act.isNeedAudit : 1,
        allowVote: act.allowVote === 1,
        voteStartTime: act.voteStartTime ? dayjs(act.voteStartTime).format('YYYY-MM-DDTHH:mm') : '',
        voteEndTime: act.voteEndTime ? dayjs(act.voteEndTime).format('YYYY-MM-DDTHH:mm') : '',
        voteType: act.voteType || 0, maxVotesPerUser: act.maxVotesPerUser || 1,
      }
      await nextTick()
      autoResizeTextarea()
    }
  } catch (error) { showToastMessage(t('pages.activityEditPage.toastFetchDetailFail'), 'error'); router.back() }
}

const editorConfig = computed(() => ({
  placeholder: t('pages.activityEditPage.placeholderContent'), html: true, autoFocus: false, scroll: true,
  MENU_CONF: {
    uploadImage: {
      async customUpload(file: File, insertFn: any) {
        try {
          const compressedFile = await compressImage(file)
          const res = await uploadPostImageUsingPost({}, {}, compressedFile)
          if (res.data.code === 0 && res.data.data) insertFn(res.data.data.url, file.name, res.data.data.url)
        } catch (e: any) { showToastMessage(t('pages.activityEditPage.toastInsertFail'), 'error') }
      }
    }
  }
}))
const toolbarConfig = { excludeKeys: ['group-video', 'insertTable', 'fontSize', 'fontFamily', 'color', 'bgColor'] }
const handleCreated = (editor: any) => { editorRef.value = editor; if (isEdit.value) getActivityDetail() }

const handleCancel = () => { if (window.confirm(t('pages.activityEditPage.confirmDiscard'))) router.back() }

const handleCoverGenerated = async (dataUrl: string) => {
  try {
    uploading.value = true
    const blob = await (await fetch(dataUrl)).blob()
    const file = new File([blob], `ai-cover-${Date.now()}.png`, { type: 'image/png' })
    const compressedFile = await compressImage(file)
    const res = await uploadPostImageUsingPost({}, {}, compressedFile)
    if (res.data.code === 0 && res.data.data) {
      formState.value.coverUrl = res.data.data.url; showCoverGenerator.value = false
    } else throw new Error()
  } catch (error: any) { showToastMessage(t('pages.activityEditPage.toastApplyFail'), 'error') }
  finally { uploading.value = false }
}

onMounted(() => { if (isEdit.value) getActivityDetail() })
onBeforeUnmount(() => { if (editorRef.value) editorRef.value.destroy() })
</script>

<style scoped>
.yuemu-compact-editor-page {
  position: fixed; inset: 0; z-index: 1000;
  background: var(--background);
  display: flex; flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, sans-serif;
}

@media (min-width: 600px) {
  .yuemu-compact-editor-page {
    position: relative; max-width: 800px; margin: 40px auto;
    height: 85vh; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.1);
    border: 1px solid var(--border-color);
  }
}

.yuemu-compact-header {
  display: flex; justify-content: space-between; align-items: center;
  height: 44px; padding: 0 12px; background: var(--background);
  border-bottom: 1px solid var(--border-color); z-index: 10;
}
.yuemu-header-title { font-size: 15px; font-weight: 600; color: var(--text-primary); }
.yuemu-nav-btn { background: transparent; border: none; font-size: 14px; font-weight: 500; cursor: pointer; padding: 4px 8px; color: var(--text-primary); }
.yuemu-nav-btn.yuemu-publish { font-weight: 600; }
.yuemu-nav-btn.yuemu-publish.yuemu-disabled { color: var(--text-secondary); opacity: 0.4; cursor: not-allowed; }

.yuemu-compact-scroll-body {
  flex: 1; overflow-y: auto; padding: 16px 12px 60px; background: var(--hover-background);
}

.yuemu-section-title-wrap { margin-bottom: 12px; padding: 0 4px; }
.yuemu-compact-title-input {
  width: 100%; background: transparent; border: none; outline: none;
  font-size: 22px; font-weight: 700; color: var(--text-primary);
  line-height: 1.3; resize: none; overflow: hidden; padding: 0;
}
.yuemu-compact-title-input::placeholder { color: var(--text-secondary); opacity: 0.6; font-weight: 600; }

.yuemu-section-cover-wrap { margin-bottom: 16px; }
.yuemu-cover-dropzone {
  width: 100%; aspect-ratio: 16 / 9; max-height: 180px;
  background: var(--card-background); border: 1px solid var(--border-color);
  border-radius: 8px; display: flex; align-items: center; justify-content: center;
  position: relative; overflow: hidden; cursor: pointer;
}
.yuemu-empty-state { text-align: center; color: var(--text-secondary); font-size: 13px; }
.yuemu-empty-state i { display: block; font-size: 20px; margin-bottom: 6px; }

.yuemu-cover-img { width: 100%; height: 100%; object-fit: cover; }
.yuemu-cover-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; gap: 12px; opacity: 0; transition: opacity 0.2s; }
.yuemu-cover-dropzone.yuemu-has-img:hover .yuemu-cover-overlay { opacity: 1; }
.yuemu-mini-btn { background: var(--text-primary); color: var(--background); border: none; padding: 6px 12px; border-radius: 14px; font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 4px; }
.yuemu-upload-progress-mask { position: absolute; inset: 0; background: rgba(0,0,0,0.6); color: #fff; display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 13px; font-weight: 500; }

.yuemu-compact-group { margin-bottom: 16px; }
.yuemu-group-title { font-size: 12px; font-weight: 600; color: var(--text-secondary); margin: 0 0 4px 8px; }
.yuemu-group-title .yuemu-required { color: #ef4444; }
.yuemu-group-inner { background: var(--card-background); border-radius: 8px; border: 1px solid var(--border-color); overflow: hidden; transition: opacity 0.3s; }
.yuemu-disabled-group { opacity: 0.6; pointer-events: none; }

.yuemu-setting-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; min-height: 44px; box-sizing: border-box; }
.yuemu-divider { height: 1px; background: var(--border-color); margin-left: 36px; }

.yuemu-row-left { display: flex; align-items: center; gap: 10px; }
.yuemu-icon-mono { width: 24px; height: 24px; border-radius: 6px; background: var(--text-primary); color: var(--background); display: flex; align-items: center; justify-content: center; font-size: 12px; }
.yuemu-label-main { font-size: 14px; font-weight: 500; color: var(--text-primary); }
.yuemu-label-main .yuemu-required { color: #ef4444; }

.yuemu-ios-picker-bubble {
  position: relative;
  display: inline-flex;
  align-items: center;
  background: var(--hover-background);
  border: 1px solid var(--border-color);
  padding: 4px 8px;
  border-radius: 6px;
  user-select: none;
  -webkit-user-select: none;
}

.yuemu-mini-native-input {
  position: relative;
  z-index: 1;
  background: transparent; border: none; outline: none; font-size: 13px; font-weight: 500;
  color: var(--text-primary); text-align: center; font-family: inherit;
  width: auto; max-width: 140px;
}

.yuemu-mini-native-input::-webkit-calendar-picker-indicator {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  width: 100%; height: 100%;
  opacity: 0; cursor: pointer;
  z-index: 2;
  color: transparent; background: transparent;
}

.yuemu-ios-select-bubble {
  background: var(--hover-background); border: 1px solid var(--border-color);
  padding: 4px 8px; border-radius: 6px; font-size: 13px; font-weight: 500;
  color: var(--text-primary); font-family: inherit; outline: none;
  appearance: none; text-align: center; cursor: pointer;
}

.yuemu-mini-switch { position: relative; display: inline-block; width: 40px; height: 24px; }
.yuemu-mini-switch.yuemu-disabled { opacity: 0.5; cursor: not-allowed; }
.yuemu-mini-switch input { opacity: 0; width: 0; height: 0; }
.yuemu-mini-switch .yuemu-slider { position: absolute; cursor: pointer; inset: 0; background-color: var(--border-color); border-radius: 24px; transition: 0.3s; }
.yuemu-mini-switch.yuemu-disabled .yuemu-slider { cursor: not-allowed; }
.yuemu-mini-switch .yuemu-slider:before { position: absolute; content: ""; height: 20px; width: 20px; left: 2px; bottom: 2px; background: var(--card-background); border-radius: 50%; transition: 0.3s; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
.yuemu-mini-switch input:checked + .yuemu-slider { background-color: var(--text-primary); }
.yuemu-mini-switch input:checked + .yuemu-slider:before { transform: translateX(16px); }

.yuemu-collapse-panel { max-height: 0; overflow: hidden; transition: max-height 0.3s ease; background: var(--hover-background); }
.yuemu-collapse-panel.yuemu-is-open { max-height: 300px; border-top: 1px solid var(--border-color); }
.yuemu-sub-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 12px 12px 46px; font-size: 13px; color: var(--text-primary); border-bottom: 1px solid rgba(0,0,0,0.03); }
.yuemu-sub-row:last-child { border-bottom: none; }
.yuemu-sub-row label { color: var(--text-secondary); font-weight: 500; }

.yuemu-number-wrap { display: flex; align-items: center; gap: 6px; }
.yuemu-number-wrap input { width: 50px; text-align: center; background: var(--card-background); border: 1px solid var(--border-color); border-radius: 4px; padding: 4px; font-size: 13px; color: var(--text-primary); outline: none; }
.yuemu-number-wrap span { color: var(--text-secondary); font-weight: 500; }

.yuemu-compact-editor { border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; background: var(--card-background); }
.yuemu-editor-toolbar-mini { border-bottom: 1px solid var(--border-color); }
:deep(.w-e-toolbar) { padding: 0 !important; background: transparent !important; }
:deep(.w-e-text-container) { min-height: 200px !important; background: transparent !important; color: var(--text-primary) !important; font-size: 14px; }

.yuemu-compact-toast {
  position: fixed; top: 56px; left: 50%; transform: translate(-50%, -10px);
  background: var(--text-primary); color: var(--background); padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 500;
  opacity: 0; visibility: hidden; transition: 0.2s; z-index: 10000; box-shadow: 0 4px 12px var(--shadow-color);
}
.yuemu-compact-toast.yuemu-show { transform: translate(-50%, 0); opacity: 1; visibility: visible; }
.yuemu-compact-toast.yuemu-error { background: #ef4444; color: #fff; }
</style>
