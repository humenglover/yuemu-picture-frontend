<template>
  <div class="yuemu-report-mask" v-if="visible" @click.self="handleCancel">
    <div class="yuemu-report-container">
      <div class="yuemu-report-header">
        <h2 class="yuemu-report-title">
          <i class="fas fa-shield-alt yuemu-title-icon"></i> {{ t('components.reportModal.reportViolation') }}
        </h2>
        <button class="yuemu-report-close" @click="handleCancel">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="yuemu-report-body">
        <div class="yuemu-report-item" v-if="props.targetType && props.targetId">
          <div class="yuemu-report-badge-container">
            <div class="yuemu-target-badge">
              <span class="yuemu-target-type-tag">{{ getTargetTypeName(props.targetType) }}</span>
              <span class="yuemu-target-id-text">ID: {{ props.targetId }}</span>
            </div>
          </div>
        </div>

        <template v-else>
          <div class="yuemu-report-item">
            <div class="yuemu-report-label">{{ t('components.reportModal.targetType') }} <span class="yuemu-required">*</span></div>
            <div class="yuemu-report-select-wrap">
              <select v-model="formData.targetType" class="yuemu-report-select" required>
                <option value="" disabled>{{ t('components.reportModal.selectTargetType') }}</option>
                <option value="1">{{ t('components.reportModal.picture') }}</option>
                <option value="2">{{ t('components.reportModal.post') }}</option>
                <option value="3">{{ t('components.reportModal.comment') }}</option>
                <option value="4">{{ t('components.reportModal.user') }}</option>
                <option value="5">{{ t('components.reportModal.other') }}</option>
              </select>
              <i class="fas fa-chevron-down yuemu-select-arrow"></i>
            </div>
            <div class="yuemu-report-error" v-if="errors.targetType">{{ errors.targetType }}</div>
          </div>

          <div class="yuemu-report-item">
            <div class="yuemu-report-label">{{ t('components.reportModal.targetContentId') }} <span class="yuemu-required">*</span></div>
            <input
              type="text"
              v-model="formData.targetId"
              class="yuemu-report-input yuemu-disabled-placeholder"
              :placeholder="t('components.reportModal.placeholderTargetId')"
            >
            <div class="yuemu-report-error" v-if="errors.targetId">{{ errors.targetId }}</div>
          </div>
        </template>

        <div class="yuemu-report-item">
          <div class="yuemu-report-label">{{ t('components.reportModal.reportReason') }} <span class="yuemu-required">*</span></div>
          <div class="yuemu-report-type-grid">
            <div
              class="yuemu-report-type-chip"
              v-for="type in reportTypes"
              :key="type.value"
              :class="{ 'yuemu-active': formData.reportType === type.value }"
              @click="formData.reportType = type.value"
            >
              {{ type.label }}
            </div>
          </div>
          <div class="yuemu-report-error" v-if="errors.reportType">{{ errors.reportType }}</div>
        </div>

        <div class="yuemu-report-item">
          <div class="yuemu-report-label">{{ t('components.reportModal.supplementaryDescription') }} <span class="yuemu-required">*</span></div>
          <div class="yuemu-textarea-wrapper">
            <textarea
              v-model="formData.reason"
              class="yuemu-report-textarea"
              :placeholder="t('components.reportModal.placeholderDesc')"
              maxlength="500"
            ></textarea>
            <div class="yuemu-report-word-count" :class="{ 'yuemu-near-limit': formData.reason.length > 450 }">
              {{ formData.reason.length }}/500
            </div>
          </div>
          <div class="yuemu-report-error" v-if="errors.description">{{ errors.description }}</div>
        </div>

        <div class="yuemu-report-item">
          <div class="yuemu-report-label">{{ t('components.reportModal.evidenceScreenshot') }} <span class="yuemu-optional">{{ t('components.reportModal.optional6Pics') }}</span></div>
          <div class="yuemu-report-upload-wrap">
            <div class="yuemu-report-upload-list">
              <div
                class="yuemu-report-upload-preview"
                v-for="(file, index) in fileList"
                :key="file.uid"
              >
                <img :src="file.preview" class="yuemu-report-upload-img">
                <div class="yuemu-upload-mask" v-if="file.status === 'uploading'">
                  <i class="fas fa-spinner fa-spin"></i>
                </div>
                <button class="yuemu-report-upload-remove" @click="removeFile(index)">
                  <i class="fas fa-times"></i>
                </button>
              </div>
              <div
                class="yuemu-report-upload-btn"
                v-if="fileList.length < 6"
                @click="triggerFileInput"
              >
                <i class="fas fa-camera yuemu-upload-icon"></i>
              </div>
            </div>
            <input
              type="file"
              class="yuemu-report-file-input"
              accept="image/*"
              multiple
              @change="handleFileChange"
            >
          </div>
        </div>
      </div>

      <div class="yuemu-report-footer">
        <button
          class="yuemu-report-submit-btn"
          :class="{ 'yuemu-loading': submitting }"
          @click="handleSubmit"
          :disabled="submitting || !isFormValid"
        >
          <span v-if="!submitting">{{ t('components.reportModal.submitReport') }}</span>
          <span v-else>{{ t('components.reportModal.submitting') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

import { ref, watch, computed } from 'vue';
import { addReportUsingPost } from '@/api/reportController';
import { uploadPostImageUsingPost } from '@/api/pictureController';

interface Props {
  open?: boolean;
  targetId?: string;
  targetType?: string;
}
const props = withDefaults(defineProps<Props>(), {
  open: false,
  targetId: undefined,
  targetType: ''
});

const emit = defineEmits<{
  'update:open': [open: boolean];
  success: [];
}>();

interface ReportTypeOption {
  label: string;
  value: string;
}
const reportTypes: ReportTypeOption[] = [
  { label: t('components.reportModal.spam'), value: '1' },
  { label: t('components.reportModal.illegalContent'), value: '2' },
  { label: t('components.reportModal.harmfulInfo'), value: '3' },
  { label: t('components.reportModal.personalAttack'), value: '4' },
  { label: t('components.reportModal.privacyViolation'), value: '5' },
  { label: t('components.reportModal.copyrightIssue'), value: '6' },
  { label: t('components.reportModal.otherReason'), value: '7' }
];

interface UploadFileItem {
  uid: number;
  file?: File;
  preview: string;
  status: 'uploading' | 'done' | 'error';
  url?: string;
}

const visible = ref(false);
const submitting = ref(false);
const fileList = ref<UploadFileItem[]>([]);
const errors = ref<Record<string, string>>({});

const formData = ref({
  reportType: '',
  targetType: props.targetType || '',
  targetId: props.targetId || '',
  reason: '',
  screenshotUrls: [] as string[]
});

const getTargetTypeName = (type: string) => {
  const map: Record<string, string> = {
    '1': t('components.reportModal.picture'),
    '2': t('components.reportModal.post'),
    '3': t('components.reportModal.comment'),
    '4': t('components.reportModal.user'),
    '5': t('components.reportModal.other')
  };
  return map[type] || t('components.reportModal.unknownObject');
};

const isFormValid = computed(() => {
  return formData.value.reportType !== '' &&
    formData.value.targetType !== '' &&
    formData.value.targetId !== '' &&
    formData.value.reason.trim().length > 0;
});

watch(() => props.open, (newVal) => {
  if (newVal) {
    visible.value = true;
    resetForm();
    document.body.style.overflow = 'hidden';
  } else {
    visible.value = false;
    document.body.style.overflow = '';
  }
});

watch(() => [props.targetType, props.targetId], ([newTargetType, newTargetId]) => {
  if (visible.value) {
    formData.value.targetType = newTargetType || '';
    formData.value.targetId = newTargetId || '';
  }
});

const resetForm = () => {
  formData.value = {
    reportType: '',
    targetType: props.targetType || '',
    targetId: props.targetId || '',
    reason: '',
    screenshotUrls: []
  };
  fileList.value = [];
  errors.value = {};
};

const updateFormData = (newTargetType: string, newTargetId: string) => {
  formData.value.targetType = newTargetType;
  formData.value.targetId = newTargetId;
};

const openModal = () => {
  visible.value = true;
  resetForm();
  document.body.style.overflow = 'hidden';
};
const closeModal = () => {
  visible.value = false;
  emit('update:open', false);
  document.body.style.overflow = '';
};
const handleCancel = () => closeModal();

const triggerFileInput = () => {
  (document.querySelector('.yuemu-report-file-input') as HTMLInputElement)?.click();
};

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const files = target.files;
  if (!files) return;

  Array.from(files).forEach(file => {
    if (fileList.value.length >= 6) {
      showToast('最多上传6张图片');
      return;
    }
    if (!file.type.startsWith('image/')) {
      showToast('仅支持图片格式');
      return;
    }
    if (file.size / 1024 / 1024 >= 5) {
      showToast('图片大小不超过5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      fileList.value.push({
        uid: Date.now() + Math.random(),
        file,
        preview: e.target?.result as string,
        status: 'uploading'
      });
      uploadFile(file, fileList.value.length - 1);
    };
    reader.readAsDataURL(file);
  });
  target.value = '';
};

const uploadFile = async (file: File, index: number) => {
  try {
    const res = await uploadPostImageUsingPost({}, {}, file);
    if (res.data.code === 0 && res.data.data) {
      fileList.value[index] = {
        ...fileList.value[index],
        url: res.data.data.url,
        status: 'done'
      };
      formData.value.screenshotUrls = fileList.value
        .filter(f => f.status === 'done')
        .map(f => f.url);
    } else {
      throw new Error(res.data.message || '上传失败');
    }
  } catch (error: any) {
    fileList.value[index].status = 'error';
    showToast(`${t('components.reportModal.uploadFailedColon')} ${error.message}`);
  }
};

const removeFile = (index: number) => {
  fileList.value.splice(index, 1);
  formData.value.screenshotUrls = fileList.value
    .filter(f => f.status === 'done')
    .map(f => f.url);
};

const showToast = (msg: string) => {
  const toast = document.createElement('div');
  toast.className = 'yuemu-report-toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('yuemu-show');
  }, 10);
  setTimeout(() => {
    toast.classList.remove('yuemu-show');
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 2000);
};

const validateForm = (): boolean => {
  const newErrors: Record<string, string> = {};
  if (!formData.value.reportType) newErrors.reportType = t('components.reportModal.pleaseSelectReason');
  if (!formData.value.targetType) newErrors.targetType = t('components.reportModal.missingTargetType');
  if (!formData.value.targetId) newErrors.targetId = t('components.reportModal.missingTargetId');
  if (!formData.value.reason.trim()) newErrors.description = t('components.reportModal.descCannotBeEmpty');
  if (formData.value.reason.length > 500) newErrors.description = t('components.reportModal.descMax500');
  errors.value = newErrors;
  return Object.keys(newErrors).length === 0;
};

const handleSubmit = async () => {
  if (!validateForm()) return;
  const uploadingFiles = fileList.value.filter(file => file.status === 'uploading');
  if (uploadingFiles.length > 0) {
    showToast('照片正在上传中，请稍候');
    return;
  }
  submitting.value = true;
  try {
    const reportData = {
      reportType: parseInt(formData.value.reportType),
      targetType: parseInt(formData.value.targetType),
      targetId: parseInt(formData.value.targetId),
      reason: formData.value.reason,
      screenshotUrls: formData.value.screenshotUrls
    };
    const response = await addReportUsingPost(reportData);
    if (response.data.code === 0) {
      showToast('举报提交成功，我们会尽快处理！');
      resetForm();
      closeModal();
      emit('success');
    } else {
      showToast(response.data.message || t('components.reportModal.submitFailedRetry'));
    }
  } catch (error: any) {
    showToast(error.message || t('components.reportModal.networkOrSystemError'));
  } finally {
    submitting.value = false;
  }
};

defineExpose({ openModal, closeModal, updateFormData });
</script>

<style scoped>
.yuemu-report-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999999;
  padding: 20px;
}

.yuemu-report-container {
  width: 100%;
  max-width: 440px;
  background: var(--surface-color, #ffffff);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  max-height: 85vh;
  animation: yuemu-modal-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes yuemu-modal-pop {
  from { opacity: 0; transform: scale(0.95) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.yuemu-report-header {
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  position: relative;
}

.yuemu-report-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 24px;
  right: 24px;
  height: 1px;
  background: var(--border-color, #f0f0f0);
}

.yuemu-report-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-color, #333);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.yuemu-title-icon {
  color: #ff4d4f;
  font-size: 16px;
}

.yuemu-report-close {
  background: var(--bg-color, #f5f5f5);
  border: none;
  font-size: 16px;
  color: var(--text-secondary, #999);
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.yuemu-report-close:hover {
  background: var(--border-color, #e8e8e8);
  color: var(--text-color, #333);
  transform: rotate(90deg);
}

.yuemu-report-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.yuemu-report-body::-webkit-scrollbar {
  width: 6px;
}

.yuemu-report-body::-webkit-scrollbar-thumb {
  background: var(--border-color, #e0e0e0);
  border-radius: 3px;
}

.yuemu-report-item {
  margin-bottom: 24px;
}

.yuemu-report-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color, #333);
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.yuemu-required { color: #ff4d4f; }
.yuemu-optional {
  font-weight: normal;
  font-size: 12px;
  color: var(--text-secondary, #999);
}

.yuemu-report-badge-container {
  background: var(--bg-color, #f8f9fa);
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid var(--border-color, #f0f0f0);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.yuemu-target-badge {
  display: flex;
  align-items: center;
  gap: 8px;
}

.yuemu-target-type-tag {
  background: #e6f4ff;
  color: #1677ff;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 500;
}

.yuemu-target-id-text {
  font-size: 13px;
  color: var(--text-color, #333);
  font-family: monospace;
}

.yuemu-report-type-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.yuemu-report-type-chip {
  background: var(--bg-color, #f5f5f5);
  color: var(--text-color, #333);
  border: 1px solid transparent;
  padding: 10px 8px;
  border-radius: 8px;
  text-align: center;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}

.yuemu-report-type-chip:hover {
  background: var(--border-color, #ebebeb);
}

.yuemu-report-type-chip.yuemu-active {
  background: #e6f4ff;
  color: #1677ff;
  border-color: #91caff;
  font-weight: 500;
}

.yuemu-report-select-wrap {
  position: relative;
}

.yuemu-report-select, .yuemu-report-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--border-color, #e5e5e5);
  border-radius: 10px;
  font-size: 14px;
  color: var(--text-color, #333);
  background: var(--surface-color, #fff);
  outline: none;
  transition: all 0.2s;
}

.yuemu-report-select {
  appearance: none;
}

.yuemu-select-arrow {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary, #999);
  pointer-events: none;
  font-size: 12px;
}

.yuemu-report-select:focus, .yuemu-report-input:focus {
  border-color: #1677ff;
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.1);
}

.yuemu-disabled-placeholder::placeholder {
  color: var(--text-secondary, #bbb);
}

.yuemu-textarea-wrapper {
  position: relative;
  border: 1px solid var(--border-color, #e5e5e5);
  border-radius: 12px;
  background: var(--bg-color, #fcfcfc);
  transition: all 0.2s;
}

.yuemu-textarea-wrapper:focus-within {
  border-color: #1677ff;
  background: var(--surface-color, #fff);
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.1);
}

.yuemu-report-textarea {
  width: 100%;
  padding: 14px 16px;
  min-height: 100px;
  background: transparent;
  border: none;
  font-size: 14px;
  color: var(--text-color, #333);
  resize: none;
  outline: none;
}

.yuemu-report-word-count {
  position: absolute;
  bottom: 10px;
  right: 14px;
  font-size: 12px;
  color: var(--text-secondary, #999);
}

.yuemu-report-word-count.yuemu-near-limit {
  color: #faad14;
}

.yuemu-report-upload-wrap {
  margin-top: 8px;
}

.yuemu-report-upload-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.yuemu-report-upload-btn {
  width: 76px;
  height: 76px;
  background: var(--bg-color, #f5f5f5);
  border: 1px dashed var(--border-color, #d9d9d9);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary, #999);
  cursor: pointer;
  transition: all 0.2s;
}

.yuemu-report-upload-btn:hover {
  border-color: #1677ff;
  color: #1677ff;
}

.yuemu-upload-icon {
  font-size: 22px;
}

.yuemu-report-file-input {
  display: none;
}

.yuemu-report-upload-preview {
  position: relative;
  width: 76px;
  height: 76px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.yuemu-report-upload-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.yuemu-upload-mask {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(255,255,255,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1677ff;
}

.yuemu-report-upload-remove {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  background: rgba(0,0,0,0.5);
  color: #fff;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  backdrop-filter: blur(4px);
  transition: background 0.2s;
}

.yuemu-report-upload-remove:hover {
  background: #ff4d4f;
}

.yuemu-report-error {
  font-size: 12px;
  color: #ff4d4f;
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.yuemu-report-footer {
  padding: 16px 24px 20px;
  flex-shrink: 0;
}

.yuemu-report-submit-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #1677ff, #3e8eff);
  color: #fff;
  border: none;
  border-radius: 30px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 6px 16px rgba(22, 119, 255, 0.25);
}

.yuemu-report-submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(22, 119, 255, 0.35);
}

.yuemu-report-submit-btn:disabled {
  background: #d9d9d9;
  box-shadow: none;
  transform: none;
  cursor: not-allowed;
  color: rgba(0,0,0,0.25);
}

.yuemu-report-toast {
  position: fixed;
  top: 30px;
  left: 50%;
  transform: translateX(-50%) translateY(-20px);
  padding: 12px 24px;
  background: rgba(0,0,0,0.8);
  backdrop-filter: blur(10px);
  color: #fff;
  font-size: 14px;
  border-radius: 20px;
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 1000000;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}

.yuemu-report-toast.yuemu-show {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

@media (max-width: 480px) {
  .yuemu-report-container {
    width: 92%;
    border-radius: 24px;
  }
  .yuemu-report-type-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 移动端强制移除点击时的悬停缩放，防止底层长按死锁 */
@media (max-width: 768px) {
  .ant-card-hoverable:active, .ant-card-hoverable:hover,
  .ant-card-hoverable:active *, .ant-card-hoverable:hover *,
  .yuemu-report-type-chip:active, .yuemu-report-type-chip:hover,
  .yuemu-report-type-chip:active *, .yuemu-report-type-chip:hover *,
  .yuemu-report-close:active, .yuemu-report-close:hover,
  .yuemu-report-close:active *, .yuemu-report-close:hover *,
  .yuemu-report-upload-btn:active, .yuemu-report-upload-btn:hover,
  .yuemu-report-upload-btn:active *, .yuemu-report-upload-btn:hover *,
  .yuemu-report-upload-remove:active, .yuemu-report-upload-remove:hover,
  .yuemu-report-upload-remove:active *, .yuemu-report-upload-remove:hover *,
  .yuemu-report-submit-btn:active, .yuemu-report-submit-btn:hover,
  .yuemu-report-submit-btn:active *, .yuemu-report-submit-btn:hover * {
    transform: none !important;
  }
}
</style>
