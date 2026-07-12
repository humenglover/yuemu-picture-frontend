<template>
  <div class="yuemu-permission-setting">
    <div class="yuemu-permission-grid">
      <div
        class="yuemu-permission-item"
        @click="togglePermission('allowPrivateChat')"
      >
        <div class="yuemu-item-icon yuemu-chat-icon">
          <i class="fas fa-comments"></i>
        </div>
        <div class="yuemu-item-text">{{ t('components.userPermissionSetting.allowPrivateChat') }}</div>
        <div class="yuemu-toggle-switch" :class="{ 'yuemu-active': permissionData.allowPrivateChat === 1 }">
          <div class="yuemu-toggle-thumb"></div>
        </div>
      </div>

      <div
        class="yuemu-permission-item"
        @click="togglePermission('allowFollow')"
      >
        <div class="yuemu-item-icon yuemu-follow-icon">
          <i class="fas fa-user-plus"></i>
        </div>
        <div class="yuemu-item-text">{{ t('components.userPermissionSetting.allowFollowed') }}</div>
        <div class="yuemu-toggle-switch" :class="{ 'yuemu-active': permissionData.allowFollow === 1 }">
          <div class="yuemu-toggle-thumb"></div>
        </div>
      </div>

      <div
        class="yuemu-permission-item"
        @click="togglePermission('showFollowList')"
      >
        <div class="yuemu-item-icon yuemu-list-icon">
          <i class="fas fa-users"></i>
        </div>
        <div class="yuemu-item-text">{{ t('components.userPermissionSetting.showFollowList') }}</div>
        <div class="yuemu-toggle-switch" :class="{ 'yuemu-active': permissionData.showFollowList === 1 }">
          <div class="yuemu-toggle-thumb"></div>
        </div>
      </div>

      <div
        class="yuemu-permission-item"
        @click="togglePermission('showFansList')"
      >
        <div class="yuemu-item-icon yuemu-fans-icon">
          <i class="fas fa-heart"></i>
        </div>
        <div class="yuemu-item-text">{{ t('components.userPermissionSetting.showFanList') }}</div>
        <div class="yuemu-toggle-switch" :class="{ 'yuemu-active': permissionData.showFansList === 1 }">
          <div class="yuemu-toggle-thumb"></div>
        </div>
      </div>
    </div>

    <div class="yuemu-action-group">
      <button class="yuemu-btn yuemu-cancel-btn" @click="handleCancel" :disabled="saving">{{ t('components.userPermissionSetting.cancel') }}</button>
      <button class="yuemu-btn yuemu-save-btn" @click="handleSave" :disabled="saving">
        <span v-if="!saving">{{ t('components.userPermissionSetting.save') }}</span>
        <span v-else>
          <span class="yuemu-loading-spinner"></span>
          保存中
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

import { ref, reactive, defineProps, defineEmits, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { updateUserPermissionsUsingPost } from '@/api/userController';

interface Props {
  userId: number | string;
  initialPermissions?: {
    allowPrivateChat?: number;
    allowFollow?: number;
    showFollowList?: number;
    showFansList?: number;
  };
}

const props = withDefaults(defineProps<Props>(), {
  initialPermissions: () => ({
    allowPrivateChat: 1,
    allowFollow: 1,
    showFollowList: 1,
    showFansList: 1
  })
});

const emit = defineEmits<{
  saved: [];
  cancelled: [];
}>();

const permissionData = reactive<{
  allowPrivateChat: number;
  allowFollow: number;
  showFollowList: number;
  showFansList: number;
}>({
  allowPrivateChat: 1,
  allowFollow: 1,
  showFollowList: 1,
  showFansList: 1
});

onMounted(() => {
  permissionData.allowPrivateChat = props.initialPermissions.allowPrivateChat ?? 1;
  permissionData.allowFollow = props.initialPermissions.allowFollow ?? 1;
  permissionData.showFollowList = props.initialPermissions.showFollowList ?? 1;
  permissionData.showFansList = props.initialPermissions.showFansList ?? 1;
});

const saving = ref(false);

const togglePermission = (key: 'allowPrivateChat' | 'allowFollow' | 'showFollowList' | 'showFansList') => {
  permissionData[key] = permissionData[key] === 1 ? 0 : 1;
};

const handleSave = async () => {
  if (!props.userId) {
    message.error(t('components.userPermissionSetting.userIdCannotBeEmpty'));
    return;
  }

  saving.value = true;
  try {
    const response = await updateUserPermissionsUsingPost({
      userId: props.userId,
      allowPrivateChat: permissionData.allowPrivateChat,
      allowFollow: permissionData.allowFollow,
      showFollowList: permissionData.showFollowList,
      showFansList: permissionData.showFansList
    });

    if (response.data.code === 0) {
      message.success(t('components.userPermissionSetting.saveSuccess'));
      emit('saved');
    } else {
      message.error(response.data.message || t('components.userPermissionSetting.saveFailed'));
    }
  } catch (error) {
    console.error(t('components.userPermissionSetting.saveFailedColon'), error);
    message.error(t('components.userPermissionSetting.saveFailedRetry'));
  } finally {
    saving.value = false;
  }
};

const handleCancel = () => {
  emit('cancelled');
};
</script>

<style scoped>
.yuemu-permission-setting {
  padding: 16px;
  background: var(--card-background);
  max-width: 400px;
  margin: 0 auto;
  border-radius: 8px;
  transition: var(--theme-transition);
}

.yuemu-setting-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.yuemu-permission-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  margin-bottom: 24px;
}

.yuemu-permission-item {
  display: flex;
  align-items: center;
  padding: 12px 10px;
  border-radius: 6px;
  background: var(--hover-background);
  cursor: pointer;
  transition: var(--theme-transition);
}

.yuemu-permission-item:hover {
  background: var(--nav-item-hover);
}

.yuemu-item-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.yuemu-chat-icon {
  color: var(--link-color);
}

.yuemu-follow-icon {
  color: var(--markdown-heading-blue-border);
}

.yuemu-list-icon {
  color: var(--markdown-heading-green-border);
}

.yuemu-fans-icon {
  color: var(--markdown-heading-pink-border);
}

.yuemu-item-text {
  flex: 1;
  font-size: 15px;
  color: var(--text-primary);
}

.yuemu-toggle-switch {
  width: 40px;
  height: 22px;
  border-radius: 11px;
  background: var(--border-color);
  position: relative;
  transition: background 0.2s ease;
}

.yuemu-toggle-switch.yuemu-active {
  background: var(--link-color);
}

.yuemu-toggle-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--text-other);
  position: absolute;
  top: 2px;
  left: 2px;
  transition: left 0.2s ease;
  box-shadow: 0 1px 3px var(--shadow-color);
}

.yuemu-toggle-switch.yuemu-active .yuemu-toggle-thumb {
  left: 20px;
}

.yuemu-action-group {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.yuemu-btn {
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  font-size: 14px;
  cursor: pointer;
  transition: var(--theme-transition);
}

.yuemu-cancel-btn {
  background: var(--hover-background);
  color: var(--text-secondary);
}

.yuemu-cancel-btn:hover {
  background: var(--border-color);
}

.yuemu-save-btn {
  background: var(--link-color);
  color: var(--text-other);
  display: flex;
  align-items: center;
  gap: 6px;
}

.yuemu-save-btn:hover:not(:disabled) {
  background: var(--link-hover-color);
}

.yuemu-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.yuemu-loading-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid transparent;
  border-top: 2px solid var(--text-other);
  border-radius: 50%;
  animation: yuemu-spin 1s linear infinite;
}

@keyframes yuemu-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (min-width: 375px) {
  .yuemu-permission-grid {
    grid-template-columns: 1fr;
  }
}

/* 移动端强制移除点击时的悬停缩放，防止底层长按死锁 */
@media (max-width: 768px) {
  .ant-card-hoverable:active, .ant-card-hoverable:hover,
  .ant-card-hoverable:active *, .ant-card-hoverable:hover *,
  .yuemu-permission-item:active, .yuemu-permission-item:hover,
  .yuemu-permission-item:active *, .yuemu-permission-item:hover *,
  .yuemu-save-btn:active, .yuemu-save-btn:hover,
  .yuemu-save-btn:active *, .yuemu-save-btn:hover *,
  .yuemu-cancel-btn:active, .yuemu-cancel-btn:hover,
  .yuemu-cancel-btn:active *, .yuemu-cancel-btn:hover * {
    transform: none !important;
  }
}
</style>
