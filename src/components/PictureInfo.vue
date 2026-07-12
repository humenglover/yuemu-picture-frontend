<template>
  <div class="yuemu-picture-info">
    <div class="yuemu-info-item">
      <div class="yuemu-info-label">{{ t('components.pictureInfo.author') }}</div>
      <div class="yuemu-info-content">
        <a-space>
          <a-avatar :size="28" :src="picture.user?.userAvatar" />
          <span class="yuemu-author-name">{{ picture.user?.userName }}</span>
        </a-space>
      </div>
    </div>
    <div class="yuemu-info-item">
      <div class="yuemu-info-label">{{ t('components.pictureInfo.name') }}</div>
      <div class="yuemu-info-content">{{ picture.name ?? t('components.pictureInfo.unnamed') }}</div>
    </div>
    <div class="yuemu-info-item">
      <div class="yuemu-info-label">{{ t('components.pictureInfo.introduction') }}</div>
      <div class="yuemu-info-content">{{ picture.introduction ?? '-' }}</div>
    </div>
    <div class="yuemu-info-item" v-if="device === DEVICE_TYPE_ENUM.PC">
      <div class="yuemu-info-label">{{ t('components.pictureInfo.category') }}</div>
      <div class="yuemu-info-content">{{ picture.category ?? t('components.pictureInfo.default') }}</div>
    </div>
    <div class="yuemu-info-item" v-if="device === DEVICE_TYPE_ENUM.PC">
      <div class="yuemu-info-label" >{{ t('components.pictureInfo.tags') }}</div>
      <div class="yuemu-info-content">
        <a-tag v-for="tag in picture.tags" :key="tag">{{ tag }}</a-tag>
      </div>
    </div>
    <div class="yuemu-info-item">
      <div class="yuemu-info-label">{{ t('components.pictureInfo.aspectRatio') }}</div>
      <div class="yuemu-info-content">{{ picture.picScale ?? '-' }}</div>
    </div>
    <div class="yuemu-info-item">
      <div class="yuemu-info-label">{{ t('components.pictureInfo.size') }}</div>
      <div class="yuemu-info-content">{{ formatSize(picture.picSize) }}</div>
    </div>
    <div class="yuemu-info-item">
      <div class="yuemu-info-label">{{ t('components.pictureInfo.mainColor') }}</div>
      <div class="yuemu-info-content">
        <div
          v-if="picture.picColor"
          class="yuemu-color-block"
          :style="{ backgroundColor: toHexColor(picture.picColor) }"
        />
        <div v-else>-</div>
      </div>
    </div>
    <div class="yuemu-action-buttons">
      <a-space>
        <a-button type="primary" @click="$emit('download')" class="yuemu-action-btn">
          <DownloadOutlined />
        </a-button>
        <a-button
          type="primary"
          ghost
          @click="$emit('share')"
          v-if="showShareButton"
          class="yuemu-action-btn"
        >
          <ShareAltOutlined />
        </a-button>
        <a-button @click="$emit('edit')" v-if="canEdit" class="yuemu-action-btn">
          <EditOutlined />
        </a-button>
        <a-button danger @click="$emit('delete')" v-if="canEdit" class="yuemu-action-btn">
          <DeleteOutlined />
        </a-button>
      </a-space>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();


import {
  DownloadOutlined,
  ShareAltOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons-vue'
import { onMounted, ref } from 'vue'
import { formatSize, toHexColor } from '@/utils'
import { getDeviceType } from '@/utils/device.ts'
import { DEVICE_TYPE_ENUM } from '@/constants/device.ts'
const device = ref<string>('')
onMounted(async () => {
  device.value = await getDeviceType()
})
defineProps<{
  picture: API.PictureVO
  showShareButton: boolean
  canEdit: boolean
}>()
defineEmits(['download', 'share', 'edit', 'delete'])
</script>
<style scoped>
.yuemu-picture-info {
  padding: 12px 16px;
}
.yuemu-info-item {
  display: flex;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}
.yuemu-info-label {
  width: 60px;
  font-size: 13px;
  color: #666;
  flex-shrink: 0;
}
.yuemu-info-content {
  flex: 1;
  font-size: 13px;
  color: #333;
  padding-left: 8px;
}
.yuemu-author-name {
  font-size: 13px;
  font-weight: 500;
}
.yuemu-color-block {
  width: 66px;
  height: 24px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.yuemu-action-buttons {
  padding: 12px 0 4px;
  display: flex;
  justify-content: flex-start;
}
.yuemu-action-btn {
  width: 40px;
  height: 40px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}
:deep(.ant-tag) {
  margin: 2px 4px 2px 0;
  font-size: 12px;
}
</style>
