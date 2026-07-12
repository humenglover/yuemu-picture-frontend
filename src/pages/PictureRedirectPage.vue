<template>
  <div class="dispatch-container">
    <div class="loading-wrapper">
      <div class="spinner"></div>
      <p class="loading-text">{{ $t('pages.pictureRedirectPage.loading') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getDeviceType } from '@/utils/device.ts'
import { DEVICE_TYPE_ENUM } from '@/constants/device.ts'

const router = useRouter()
const route = useRoute()

onMounted(async () => {
  const deviceType = await getDeviceType()
  const pictureId = route.params.id as string

  // 获取传递的图片数据（通过history state传递）
  const pictureData = history.state?.state?.pictureData

  if (deviceType === DEVICE_TYPE_ENUM.MOBILE) {
    // 如果是移动端，跳转到移动端图片详情页，并传递图片数据
    await router.replace({
      path: `/mobile/picture/${pictureId}`,
      state: { pictureData }
    })
  } else {
    // 如果是PC端，跳转到PC端图片详情页，并传递图片数据
    await router.replace({
      path: `/picture/${pictureId}`,
      state: { pictureData }
    })
  }
})
</script>

<style scoped>
/* 强制全屏覆盖，无视父级元素的 padding/margin 限制 */
.dispatch-container {
  position: fixed;         /* 固定定位，脱离文档流 */
  top: 0;
  left: 0;
  width: 100vw;            /* 强制占据 100% 视口宽度 */
  height: 100vh;           /* 强制占据 100% 视口高度 */
  display: flex;
  justify-content: center; /* 水平绝对居中 */
  align-items: center;     /* 垂直绝对居中 */
  z-index: 9999;           /* 确保在最上层，不被其他东西挤压或遮挡 */
}

/* 内部包装器：让动画和文字垂直排列 */
.loading-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 旋转加载动画样式 */
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

/* 提示文字样式 */
.loading-text {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
  letter-spacing: 1px;
}

/* 旋转动画关键帧 */
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
