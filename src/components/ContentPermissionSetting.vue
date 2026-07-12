<template>
  <div class="yuemu-permission-wrapper">

    <div class="yuemu-setting-intro">
      {{ t('components.permission.intro') }}
    </div>

    <div class="yuemu-ios-list-group">
      <div class="yuemu-ios-list-item" @click="togglePermission('allowLike')">
        <div class="yuemu-item-left">
          <div class="yuemu-icon-box yuemu-bg-pink">
            <i class="fas fa-heart"></i>
          </div>
          <div class="yuemu-item-info">
            <span class="yuemu-item-title">{{ t('components.permission.allowLike') }}</span>
            <span class="yuemu-item-sub">{{ t('components.permission.allowLikeDesc') }}</span>
          </div>
        </div>
        <div class="yuemu-ios-toggle" :class="{ 'is-active': permissionData.allowLike === 1 }">
          <div class="yuemu-toggle-knob"></div>
        </div>
      </div>

      <div class="yuemu-ios-list-item" @click="togglePermission('allowComment')">
        <div class="yuemu-item-left">
          <div class="yuemu-icon-box yuemu-bg-blue">
            <i class="fas fa-comment-dots"></i>
          </div>
          <div class="yuemu-item-info">
            <span class="yuemu-item-title">{{ t('components.permission.allowComment') }}</span>
            <span class="yuemu-item-sub">{{ t('components.permission.allowCommentDesc') }}</span>
          </div>
        </div>
        <div class="yuemu-ios-toggle" :class="{ 'is-active': permissionData.allowComment === 1 }">
          <div class="yuemu-toggle-knob"></div>
        </div>
      </div>

      <div class="yuemu-ios-list-item" @click="togglePermission('allowCollect')">
        <div class="yuemu-item-left">
          <div class="yuemu-icon-box yuemu-bg-yellow">
            <i class="fas fa-star"></i>
          </div>
          <div class="yuemu-item-info">
            <span class="yuemu-item-title">{{ t('components.permission.allowCollect') }}</span>
            <span class="yuemu-item-sub">{{ t('components.permission.allowCollectDesc') }}</span>
          </div>
        </div>
        <div class="yuemu-ios-toggle" :class="{ 'is-active': permissionData.allowCollect === 1 }">
          <div class="yuemu-toggle-knob"></div>
        </div>
      </div>

      <div class="yuemu-ios-list-item" @click="togglePermission('allowShare')">
        <div class="yuemu-item-left">
          <div class="yuemu-icon-box yuemu-bg-green">
            <i class="fas fa-share-alt"></i>
          </div>
          <div class="yuemu-item-info">
            <span class="yuemu-item-title">{{ t('components.permission.allowShare') }}</span>
            <span class="yuemu-item-sub">{{ t('components.permission.allowShareDesc') }}</span>
          </div>
        </div>
        <div class="yuemu-ios-toggle" :class="{ 'is-active': permissionData.allowShare === 1 }">
          <div class="yuemu-toggle-knob"></div>
        </div>
      </div>
    </div>

    <div class="yuemu-action-bar">
      <button class="yuemu-submit-btn" :disabled="saving" @click="handleSave">
        <i class="fas fa-spinner fa-spin" v-if="saving"></i>
        <span v-else>{{ t('components.permission.save') }}</span>
      </button>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { message } from 'ant-design-vue';
import { setPicturePermissionUsingPost } from '@/api/pictureController';
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface Props {
  pictureId: number | string;
  initialPermissions?: {
    allowLike?: number;
    allowComment?: number;
    allowCollect?: number;
    allowShare?: number;
  };
}

const props = withDefaults(defineProps<Props>(), {
  initialPermissions: () => ({
    allowLike: 1,
    allowComment: 1,
    allowCollect: 1,
    allowShare: 1
  })
});

const emit = defineEmits<{
  'permissions-updated': [permissions: any];
}>();

const permissionData = reactive({
  allowLike: props.initialPermissions.allowLike ?? 1,
  allowComment: props.initialPermissions.allowComment ?? 1,
  allowCollect: props.initialPermissions.allowCollect ?? 1,
  allowShare: props.initialPermissions.allowShare ?? 1
});

const saving = ref(false);

const togglePermission = (key: 'allowLike' | 'allowComment' | 'allowCollect' | 'allowShare') => {
  permissionData[key] = permissionData[key] === 1 ? 0 : 1;
};

const handleSave = async () => {
  if (!props.pictureId) {
    message.error(t('components.permission.idEmpty'));
    return;
  }
  saving.value = true;
  try {
    const response = await setPicturePermissionUsingPost({
      pictureId: props.pictureId,
      ...permissionData
    });
    if (response.data.code === 0) {
      emit('permissions-updated', { ...permissionData });
    } else {
      message.error(response.data.message || t('components.permission.saveFailed'));
    }
  } catch (error) {
    console.error('保存失败:', error);
    message.error(t('components.permission.saveFailedNetwork'));
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
/* 容器基底，继承全局暗色/亮色变量 */
.yuemu-permission-wrapper {
  padding: 12px 16px;
  max-width: 600px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

/* 顶部引导说明 */
.yuemu-setting-intro {
  font-size: 13px;
  color: var(--text-secondary, #8e8e93);
  line-height: 1.6;
  margin-bottom: 24px;
  padding: 0 4px;
}

/* iOS 风格的分组列表 */
.yuemu-ios-list-group {
  background: var(--card-background, #ffffff);
  border-radius: 12px;
  box-shadow: 0 2px 12px var(--shadow-color, rgba(0, 0, 0, 0.04));
  overflow: hidden;
  border: 1px solid var(--border-color, rgba(0, 0, 0, 0.05));
}

.yuemu-ios-list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-bottom: 1px solid var(--border-color, #f0f0f0);
}

.yuemu-ios-list-item:last-child {
  border-bottom: none;
}

.yuemu-ios-list-item:active {
  background-color: var(--hover-background, #f5f5f5);
}

/* 列表左侧信息 */
.yuemu-item-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* 高级质感图标底座（微渐变） */
.yuemu-icon-box {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  color: #ffffff;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.yuemu-bg-pink { background: linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%); }
.yuemu-bg-blue { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
.yuemu-bg-yellow { background: linear-gradient(135deg, #f6d365 0%, #fda085 100%); }
.yuemu-bg-green { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }

/* 文本信息 */
.yuemu-item-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.yuemu-item-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary, #333333);
  letter-spacing: 0.3px;
}

.yuemu-item-sub {
  font-size: 12px;
  color: var(--text-secondary, #999999);
  line-height: 1.3;
}

/* 原生级 iOS 开关 (完美复刻尺寸) */
.yuemu-ios-toggle {
  width: 51px;
  height: 31px;
  border-radius: 15.5px;
  background-color: var(--border-color, #e5e5ea);
  position: relative;
  transition: background-color 0.3s cubic-bezier(0.2, 0.85, 0.32, 1.2);
  flex-shrink: 0;
}

.yuemu-ios-toggle.is-active {
  background-color: #34c759; /* iOS System Green */
}

/* 完美复刻滑块阴影 */
.yuemu-toggle-knob {
  width: 27px;
  height: 27px;
  background-color: #ffffff;
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: 2px;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15), 0 1px 1px rgba(0, 0, 0, 0.16), 0 3px 1px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s cubic-bezier(0.2, 0.85, 0.32, 1.2);
}

.yuemu-ios-toggle.is-active .yuemu-toggle-knob {
  transform: translateX(20px);
}

/* 底部操作区 */
.yuemu-action-bar {
  margin-top: 32px;
  padding-bottom: env(safe-area-inset-bottom);
}

/* 提交按钮 */
.yuemu-submit-btn {
  width: 100%;
  height: 48px;
  background: var(--link-color, #007aff);
  color: #ffffff;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.2);
}

.yuemu-submit-btn:hover:not(:disabled) {
  filter: brightness(1.05);
}

.yuemu-submit-btn:active:not(:disabled) {
  transform: scale(0.98);
  box-shadow: 0 2px 6px rgba(0, 122, 255, 0.15);
}

.yuemu-submit-btn:disabled {
  background: var(--border-color, #e5e5ea);
  color: var(--text-secondary, #a1a1aa);
  box-shadow: none;
  cursor: not-allowed;
}

/* 移动端强制移除点击时的悬停缩放，防止底层长按死锁 */
@media (max-width: 768px) {
  .ant-card-hoverable:active, .ant-card-hoverable:hover,
  .ant-card-hoverable:active *, .ant-card-hoverable:hover *,
  .yuemu-submit-btn:active, .yuemu-submit-btn:hover,
  .yuemu-submit-btn:active *, .yuemu-submit-btn:hover * {
    transform: none !important;
  }
}
</style>
