<template>
  <div class="yuemu-redirect-page">
    <div class="yuemu-redirect-content">
      <div class="yuemu-spinner-ring">
        <div class="yuemu-spinner-core"></div>
        <div class="yuemu-spinner-glow"></div>
      </div>

      <h2 class="yuemu-title">{{ $t('pages.chatRedirectPage.matching') }}</h2>
      <p class="yuemu-desc">{{ $t('pages.chatRedirectPage.distributing') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import { getDeviceType } from '@/utils/device'
import { DEVICE_TYPE_ENUM } from '@/constants/device'

const router = useRouter()
const route = useRoute()

onMounted(async () => {
  try {
    // 尝试获取设备类型
    const device = await getDeviceType()

    // 稍微加一点极短的延迟（300ms），让用户能看清过场动画，避免画面闪烁太快
    setTimeout(async () => {
      // 根据设备类型进行重定向
      if (device === DEVICE_TYPE_ENUM.PC) {
        console.log(t('pages.chatRedirectPage.detectPc'))
        await router.replace({ name: 'PCChat' })
      } else {
        console.log(t('pages.chatRedirectPage.detectMobile'))
        await router.replace({
          name: 'ChatList',
          query: route.query
        })
      }
    }, 300)

  } catch (error) {
    console.error(t('pages.chatRedirectPage.redirectFailedTitle') + ':', error)
    message.error(t('pages.chatRedirectPage.redirectFailed'))

    // 提供一个备用方案
    setTimeout(() => {
      router.replace({ name: 'ChatList' })
    }, 2000)
  }
})
</script>

<style scoped>
/* 全屏容器，绝对居中 */
.yuemu-redirect-page {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: var(--background, #f5f7fa);
  z-index: 9999;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  transition: background-color 0.3s ease;
}

.yuemu-redirect-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
  animation: yuemuFadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

/* 现代质感 Spinner */
.yuemu-spinner-ring {
  position: relative;
  width: 56px;
  height: 56px;
  margin-bottom: 24px;
}

.yuemu-spinner-core {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 3px solid var(--border-color, #e2e8f0);
  border-top-color: var(--link-color, #1677ff);
  animation: yuemuSpin 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
  z-index: 2;
}

.yuemu-spinner-glow {
  position: absolute;
  inset: -8px;
  border-radius: 50%;
  background: var(--link-color, #1677ff);
  opacity: 0.15;
  filter: blur(8px);
  animation: yuemuPulse 2s ease-in-out infinite;
  z-index: 1;
}

/* 文本排版 */
.yuemu-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary, #1e293b);
  margin: 0 0 10px 0;
  letter-spacing: 2px;
}

.yuemu-desc {
  font-size: 14px;
  color: var(--text-secondary, #64748b);
  margin: 0;
  opacity: 0.8;
}

/* 动画定义 */
@keyframes yuemuSpin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes yuemuPulse {
  0%, 100% { transform: scale(0.8); opacity: 0.1; }
  50% { transform: scale(1.1); opacity: 0.25; }
}

@keyframes yuemuFadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 深色模式兼容（如果你的全局变量定义了这些，会自动生效，这里做个兜底） */
@media (prefers-color-scheme: dark) { .yuemu-redirect-page {
  background-color: #141414;
} }
@media (prefers-color-scheme: dark) { .yuemu-spinner-core {
  border-color: #333;
  border-top-color: #1677ff;
} }
</style>
