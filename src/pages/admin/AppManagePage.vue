<template>
  <div id="yuemu-appManagePage">
    <div class="yuemu-main-container">

      <div class="yuemu-header-panel">
        <div class="yuemu-header-main-row">
          <div class="yuemu-page-info">
            <h1 class="yuemu-page-title">{{ t('pages.admin.appManagePage.title') }}</h1>
            <p class="yuemu-text-secondary" style="margin: 4px 0 0 0; font-size: 13px;">{{ t('pages.admin.appManagePage.desc') }}</p>
          </div>
          <div class="yuemu-action-group">
            <a-button type="primary" class="yuemu-btn-primary" @click="showUploadModal">
              <UploadOutlined /> <span class="yuemu-btn-text">{{ t('pages.admin.appManagePage.publishNewVersion') }}</span>
            </a-button>
          </div>
        </div>
      </div>

      <div class="yuemu-info-card">
        <div class="yuemu-card-title-row">
          <div class="yuemu-title-left">
            <div class="yuemu-app-icon">
              <AppleOutlined v-if="device === 'ios'" />
              <AndroidOutlined v-else />
            </div>
            <div class="yuemu-title-text-group">
              <h2>{{ t('pages.admin.appManagePage.currentOnlineVersion') }}</h2>
              <span class="yuemu-tag yuemu-tag-green yuemu-tag-mini" v-if="currentVersion.version">Active</span>
            </div>
          </div>
        </div>

        <div class="yuemu-info-grid" v-if="currentVersion.version">
          <div class="yuemu-info-item">
            <span class="yuemu-label">{{ t('pages.admin.appManagePage.versionLabel') }}</span>
            <span class="yuemu-value yuemu-version-text">{{ currentVersion.version }}</span>
          </div>
          <div class="yuemu-info-item">
            <span class="yuemu-label">{{ t('pages.admin.appManagePage.buildLabel') }}</span>
            <span class="yuemu-value">{{ currentVersion.versionCode }}</span>
          </div>
          <div class="yuemu-info-item">
            <span class="yuemu-label">{{ t('pages.admin.appManagePage.packageSize') }}</span>
            <span class="yuemu-value">{{ formatFileSize(currentVersion.apkSize) }}</span>
          </div>
          <div class="yuemu-info-item">
            <span class="yuemu-label">{{ t('pages.admin.appManagePage.updateStrategy') }}</span>
            <span class="yuemu-tag" :class="currentVersion.forceUpdate ? 'yuemu-tag-red' : 'yuemu-tag-blue'">
              {{ currentVersion.forceUpdate ? t('pages.admin.appManagePage.forceUpdate') : t('pages.admin.appManagePage.suggestUpdate') }}
            </span>
          </div>
          <div class="yuemu-info-item yuemu-full-width-mobile">
            <span class="yuemu-label">{{ t('pages.admin.appManagePage.publishTime') }}</span>
            <span class="yuemu-value yuemu-text-secondary">{{ currentVersion.updateTime ? dayjs(currentVersion.updateTime).format('YYYY-MM-DD HH:mm:ss') : '-' }}</span>
          </div>
          <div class="yuemu-info-item yuemu-full-width-mobile">
            <span class="yuemu-label">{{ t('pages.admin.appManagePage.downloadSource') }}</span>
            <a :href="currentVersion.downloadUrl" target="_blank" class="yuemu-download-link">
              <CloudDownloadOutlined /> {{ t('pages.admin.appManagePage.getApk') }}
            </a>
          </div>
          <div class="yuemu-info-item yuemu-full-width">
            <span class="yuemu-label">{{ t('pages.admin.appManagePage.releaseNotes') }}</span>
            <div class="yuemu-release-notes">
              <pre>{{ currentVersion.description || t('pages.admin.appManagePage.noDescription') }}</pre>
            </div>
          </div>
        </div>

        <div class="yuemu-empty-state" v-else>
          <InboxOutlined class="yuemu-empty-icon" />
          <p>{{ t('pages.admin.appManagePage.noVersionRecord') }}</p>
        </div>
      </div>

    </div>

    <a-modal
      v-model:open="uploadModalVisible"
      :title="t('pages.admin.appManagePage.publishNewVersionTitle')"
      :footer="null"
      class="yuemu-modal yuemu-responsive-modal"
      destroyOnClose
    >
      <a-form :model="uploadForm" :rules="rules" ref="uploadFormRef" class="yuemu-form" layout="vertical">
        <div class="yuemu-form-row">
          <div class="yuemu-form-item yuemu-half">
            <label>{{ t('pages.admin.appManagePage.versionFormLabel') }} <span class="yuemu-required">*</span></label>
            <a-input v-model:value="uploadForm.version" :placeholder="t('pages.admin.appManagePage.versionPlaceholder')" class="yuemu-input" />
          </div>
          <div class="yuemu-form-item yuemu-half">
            <label>{{ t('pages.admin.appManagePage.buildFormLabel') }} <span class="yuemu-required">*</span></label>
            <a-input-number
              v-model:value="uploadForm.versionCode"
              :min="1"
              style="width: 100%"
              :placeholder="t('pages.admin.appManagePage.buildPlaceholder')"
              class="yuemu-input"
            />
          </div>
        </div>

        <div class="yuemu-form-item">
          <label>{{ t('pages.admin.appManagePage.releaseNotesFormLabel') }} <span class="yuemu-required">*</span></label>
          <a-textarea
            v-model:value="uploadForm.description"
            :rows="4"
            :placeholder="t('pages.admin.appManagePage.releaseNotesPlaceholder')"
            class="yuemu-input"
          />
        </div>

        <div class="yuemu-form-item yuemu-switch-item">
          <label>{{ t('pages.admin.appManagePage.forceUpdateLabel') }}</label>
          <a-switch v-model:checked="uploadForm.isForce" />
        </div>

        <div class="yuemu-form-item yuemu-upload-area">
          <label>{{ t('pages.admin.appManagePage.uploadApkLabel') }} <span class="yuemu-required">*</span></label>
          <a-upload-dragger
            v-model:fileList="fileList"
            name="file"
            :maxCount="1"
            :beforeUpload="beforeUpload"
            @change="handleFileChange"
            class="yuemu-upload-dragger"
          >
            <p class="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p class="ant-upload-text">{{ t('pages.admin.appManagePage.uploadApkText') }}</p>
            <p class="ant-upload-hint yuemu-text-secondary">
              {{ t('pages.admin.appManagePage.uploadApkHint') }}
            </p>
          </a-upload-dragger>
        </div>

        <div class="yuemu-modal-footer">
          <a-button class="yuemu-btn-ghost" @click="handleCancel" :disabled="uploading">{{ t('pages.admin.appManagePage.cancel') }}</a-button>
          <a-button type="primary" class="yuemu-btn-primary" @click="handleUpload" :loading="uploading">{{ t('pages.admin.appManagePage.startPublish') }}</a-button>
        </div>
      </a-form>
    </a-modal>

  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import {
  UploadOutlined,
  InboxOutlined,
  CloudDownloadOutlined,
  AppleOutlined,
  AndroidOutlined
} from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import { getLatestVersionUsingGet } from '@/api/appController'

const device = ref('android')
const currentVersion = ref<any>({})
const uploadModalVisible = ref(false)
const uploading = ref(false)
const fileList = ref<any[]>([])
const uploadFormRef = ref()

const uploadForm = ref({
  version: '',
  versionCode: undefined,
  description: '',
  isForce: false
})

const rules = {
  version: [{ required: true, get message() { return t('pages.admin.appManagePage.enterVersionMsg') } }],
  versionCode: [{ required: true, get message() { return t('pages.admin.appManagePage.enterBuildMsg') } }],
  description: [{ required: true, get message() { return t('pages.admin.appManagePage.enterReleaseNotesMsg') } }],
}

const fetchLatestVersion = async () => {
  try {
    const res = await getLatestVersionUsingGet()
    if (res.data?.code === 0 && res.data.data) {
      currentVersion.value = res.data.data
    }
  } catch (error) {
    message.error(t('pages.admin.appManagePage.fetchVersionFailed'))
  }
}

const formatFileSize = (bytes?: number) => {
  if (!bytes) return '-'
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${size.toFixed(2)} ${units[unitIndex]}`
}

const handleFileChange = (info: any) => {
  fileList.value = info.fileList.slice(-1)
}

const beforeUpload = () => false

const showUploadModal = () => {
  uploadForm.value = {
    version: '',
    versionCode: undefined,
    description: '',
    isForce: false
  }
  fileList.value = []
  uploadModalVisible.value = true
}

const handleCancel = () => {
  if (uploading.value) return
  uploadModalVisible.value = false
}

const handleUpload = async () => {
  try {
    await uploadFormRef.value.validate()
    if (fileList.value.length === 0) {
      message.error(t('pages.admin.appManagePage.selectApkFile'))
      return
    }
    const file = fileList.value[0]?.originFileObj
    if (!file || !file.name.endsWith('.apk')) {
      message.error(t('pages.admin.appManagePage.onlyApkAllowed'))
      return
    }
    const versionPattern = /^\d+\.\d+\.\d+$/
    if (!versionPattern.test(uploadForm.value.version)) {
      message.error(t('pages.admin.appManagePage.versionFormatInvalid'))
      return
    }

    uploading.value = true
    const formData = new FormData()
    const appVersionData = {
      version: uploadForm.value.version,
      versionCode: uploadForm.value.versionCode,
      description: uploadForm.value.description,
      isForce: uploadForm.value.isForce ? 1 : 0,
      status: 1
    }
    formData.append('file', file)
    formData.append('appVersion', JSON.stringify(appVersionData))

    const res = await fetch('/api/app/upload', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': localStorage.getItem('token') || ''
      }
    }).then(response => response.json())

    if (res.code === 0) {
      message.success(t('pages.admin.appManagePage.publishSuccess'))
      uploadModalVisible.value = false
      fetchLatestVersion()
    } else {
      throw new Error(res.message || t('pages.admin.appManagePage.uploadFailed'))
    }
  } catch (error: any) {
    if (error.errorFields) return
    message.error(error.message || t('pages.admin.appManagePage.publishFailed'))
  } finally {
    uploading.value = false
  }
}

onMounted(() => fetchLatestVersion())
</script>

<style scoped>
#yuemu-appManagePage {
  height: 100%;
  box-sizing: border-box;
  background-color: var(--background);
  color: var(--text-primary);
  transition: var(--theme-transition);
  overflow-y: auto;
}
.yuemu-text-secondary { color: var(--text-secondary); }

.yuemu-main-container {
  padding: 24px;
  max-width: 1000px;
  margin: 0 auto;
  box-sizing: border-box;
}

.yuemu-header-panel {
  background-color: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 16px var(--shadow-color);
  margin-bottom: 24px;
}

.yuemu-header-main-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.yuemu-page-title { margin: 0; font-size: 24px; font-weight: 600; color: var(--text-primary); }
.yuemu-action-group { display: flex; gap: 12px; align-items: center; }

.yuemu-btn-primary { background-color: var(--link-color) !important; color: var(--text-other) !important; border: none !important; border-radius: 8px !important; font-weight: 500; height: 38px; padding: 0 20px;}
.yuemu-btn-ghost { border-radius: 8px !important; border: 1px solid var(--border-color) !important; color: var(--text-primary) !important; background-color: transparent !important; height: 38px; padding: 0 20px;}

.yuemu-info-card {
  background-color: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 20px var(--shadow-color);
}

.yuemu-card-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border-color);
}

.yuemu-title-left { display: flex; align-items: center; gap: 16px; }
.yuemu-app-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: #fff;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  flex-shrink: 0;
}

.yuemu-title-text-group { display: flex; align-items: center; gap: 12px; }
.yuemu-title-text-group h2 { margin: 0; font-size: 22px; font-weight: 600; color: var(--text-primary); }

.yuemu-info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px 40px;
}
.yuemu-info-item { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.yuemu-info-item.yuemu-full-width { grid-column: 1 / -1; }
.yuemu-label { font-size: 13px; color: var(--text-secondary); font-weight: 500; }
.yuemu-value { font-size: 16px; color: var(--text-primary); word-break: break-all; }
.yuemu-version-text { font-size: 24px !important; font-weight: 700; color: var(--link-color) !important; letter-spacing: 1px; }

.yuemu-release-notes {
  background-color: var(--hover-background);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 16px;
  overflow-x: auto;
}
.yuemu-release-notes pre {
  margin: 0;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-primary);
  white-space: pre-wrap;
}

.yuemu-download-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background-color: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
}

.yuemu-empty-state { text-align: center; padding: 60px 0; color: var(--text-secondary); }
.yuemu-empty-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.5; }

.yuemu-tag { display: inline-flex; align-items: center; padding: 6px 12px; border-radius: 8px; font-size: 13px; font-weight: 600; }
.yuemu-tag-mini { padding: 4px 8px; font-size: 11px; border-radius: 6px; }
.yuemu-tag-blue { background-color: rgba(59, 130, 246, 0.1); color: #3b82f6; }
.yuemu-tag-green { background-color: rgba(16, 185, 129, 0.1); color: #10b981; }
.yuemu-tag-red { background-color: rgba(239, 68, 68, 0.1); color: #ef4444; }

:deep(.yuemu-responsive-modal) { width: 560px !important; max-width: 95% !important; }
:deep(.yuemu-modal .ant-modal-content) { background-color: var(--card-background); border: 1px solid var(--border-color); border-radius: 16px; padding: 0; overflow: hidden; }
:deep(.yuemu-modal .ant-modal-header) { background-color: var(--card-background); border-bottom: 1px solid var(--border-color); padding: 20px 24px; margin-bottom: 0;}
:deep(.yuemu-modal .ant-modal-title) { color: var(--text-primary); font-size: 18px; font-weight: 600; }
:deep(.yuemu-modal .ant-modal-close) { color: var(--text-secondary); top: 20px;}
:deep(.yuemu-modal .ant-modal-body) { padding: 24px; }

.yuemu-form-row { display: flex; gap: 16px; }
.yuemu-form-item { margin-bottom: 20px; display: flex; flex-direction: column;}
.yuemu-form-item.yuemu-half { flex: 1; }
.yuemu-form label { display: block; font-size: 13px; color: var(--text-secondary); margin-bottom: 8px; font-weight: 500;}
.yuemu-required { color: var(--comment-delete-hover-color); }

.yuemu-switch-item {
  flex-direction: row !important;
  justify-content: space-between;
  align-items: center;
  background: var(--hover-background);
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
}

:deep(.yuemu-input), :deep(.ant-input-number) {
  background-color: var(--background) !important;
  color: var(--text-primary) !important;
  border: 1px solid var(--border-color) !important;
  border-radius: 8px !important;
}

:deep(.yuemu-upload-dragger.ant-upload-wrapper .ant-upload-drag) {
  background-color: var(--background) !important;
  border: 2px dashed var(--border-color) !important;
  border-radius: 12px;
}

.yuemu-modal-footer { display: flex; gap: 12px; margin-top: 32px; }
.yuemu-modal-footer .ant-btn { flex: 1; height: 44px; border-radius: 12px; font-size: 15px; }

@media screen and (max-width: 768px) {
  .yuemu-main-container { padding: 12px; }
  .yuemu-header-main-row { flex-direction: column; align-items: flex-start; gap: 16px; }
  .yuemu-info-grid { grid-template-columns: 1fr; gap: 16px; }
  .yuemu-form-row { flex-direction: column; gap: 0; }
  .yuemu-btn-primary { width: 100%; justify-content: center; }
  .yuemu-action-group { width: 100%; }
}
</style>
