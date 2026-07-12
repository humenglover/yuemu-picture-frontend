<template>
  <div class="yuemu-digital-clock-container">
    <div class="yuemu-time-section">
      <div class="yuemu-time">{{ timeString }}</div>
      <div class="yuemu-time-dots">
        <span class="yuemu-dot"></span>
        <span class="yuemu-dot"></span>
      </div>
    </div>
    <div class="yuemu-date">{{ dateString }}</div>
    <div class="yuemu-decoration-icons">
      <span class="yuemu-floating-icon">☁️</span>
      <span class="yuemu-floating-icon">🌤️</span>
      <span class="yuemu-floating-icon">☀️</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: 'DigitalClock'
})

import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const timeString = ref('')
const dateString = ref('')
let timer: number | null = null

// 更新时间
const updateTime = () => {
  const now = new Date()

  // 格式化时间
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  timeString.value = `${hours}:${minutes}:${seconds}`

  // 格式化日期
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const date = String(now.getDate()).padStart(2, '0')
  const day = [t('components.digitalClock.sunday'), t('components.digitalClock.monday'), t('components.digitalClock.tuesday'), t('components.digitalClock.wednesday'), t('components.digitalClock.thursday'), t('components.digitalClock.friday'), t('components.digitalClock.saturday')][now.getDay()]
  dateString.value = `${month}${t('components.digitalClock.month')}${date}${t('components.digitalClock.day')} ${day}`
}

// 组件挂载时启动定时器
onMounted(() => {
  updateTime() // 立即执行一次
  timer = window.setInterval(updateTime, 1000)
})

// 组件卸载时清除定时器
onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
})
</script>

<style scoped>
.yuemu-digital-clock-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 24px;
  border-radius: 20px;
  /* 蓝天白云主背景：浅蓝渐变+玻璃拟态 */
  background: linear-gradient(135deg, rgba(187, 222, 251, 0.25), rgba(144, 202, 249, 0.15));
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow:
    0 8px 32px rgba(30, 136, 229, 0.12),
    inset 0 0 0 1px rgba(255, 255, 255, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.yuemu-digital-clock-container:hover {
  transform: translateY(-2px);
  box-shadow:
    0 12px 40px rgba(30, 136, 229, 0.18),
    inset 0 0 0 1px rgba(255, 255, 255, 0.3);
}

.yuemu-time-section {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
}

.yuemu-time {
  font-size: 32px;
  font-weight: 600;
  color: #ffffff;
  font-family: 'Monaco', monospace;
  letter-spacing: 2px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  /* 蓝天白云渐变文字：天蓝到浅蓝 */
  background: linear-gradient(to right, #1976d2, #64b5f6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.yuemu-time-dots {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-left: 4px;
}

.yuemu-dot {
  width: 4px;
  height: 4px;
  /* 圆点改为天空蓝 */
  background-color: #2196f3;
  border-radius: 50%;
  animation: yuemu-pulse 1s ease-in-out infinite;
}

.yuemu-dot:nth-child(2) {
  animation-delay: 0.5s;
}

.yuemu-date {
  font-size: 14px;
  /* 日期文字改为浅蓝灰，更贴合蓝天白云 */
  color: rgba(25, 118, 210, 0.85);
  margin-top: 4px;
  font-weight: 500;
  letter-spacing: 1px;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.2);
}

.yuemu-decoration-icons {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  pointer-events: none;
  overflow: hidden;
}

.yuemu-floating-icon {
  position: absolute;
  font-size: 12px;
  opacity: 0.6;
  animation: yuemu-float 6s ease-in-out infinite;
}

.yuemu-floating-icon:nth-child(1) {
  top: 20%;
  left: 10%;
  animation-delay: 0s;
}

.yuemu-floating-icon:nth-child(2) {
  top: 60%;
  right: 15%;
  animation-delay: -2s;
}

.yuemu-floating-icon:nth-child(3) {
  bottom: 20%;
  left: 20%;
  animation-delay: -4s;
}

@keyframes yuemu-pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
}

@keyframes yuemu-float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-10px) rotate(10deg);
  }
}

/* 移动端强制移除点击时的悬停缩放，防止底层长按死锁 */
@media (max-width: 768px) {
  .ant-card-hoverable:active, .ant-card-hoverable:hover,
  .ant-card-hoverable:active *, .ant-card-hoverable:hover *,
  .yuemu-digital-clock-container:active, .yuemu-digital-clock-container:hover,
  .yuemu-digital-clock-container:active *, .yuemu-digital-clock-container:hover * {
    transform: none !important;
  }
}
</style>
