<template>
  <div
    class="yuemu-viewfinder-decoration"
    aria-hidden="true"
    :title="t('components.glowingVine.viewfinder')"
  >
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- 相机取景器辅助线 Pattern -->
        <pattern id="viewfinder-scale" width="60" height="24" patternUnits="userSpaceOnUse" patternTransform="translate(30, 0)">
          <!-- 贯穿水平线 -->
          <line x1="0" y1="12" x2="60" y2="12" stroke="#1890ff" stroke-width="1" />
          
          <!-- 主刻度 (|) -->
          <line x1="0" y1="4" x2="0" y2="20" stroke="#1890ff" stroke-width="1.5" />
          
          <!-- 副刻度 (+) -->
          <line x1="15" y1="10" x2="15" y2="14" stroke="#1890ff" stroke-width="1" />
          <line x1="30" y1="8"  x2="30" y2="16" stroke="#1890ff" stroke-width="1" />
          <line x1="45" y1="10" x2="45" y2="14" stroke="#1890ff" stroke-width="1" />
        </pattern>
      </defs>
      
      <!-- 渲染连续刻度 -->
      <rect width="100%" height="100%" fill="url(#viewfinder-scale)" />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<style scoped>
.yuemu-viewfinder-decoration {
  flex: 1;
  margin: 0 40px;
  height: 24px;
  /* 用户要求的透明度和颜色 */
  opacity: 0.2;
  overflow: hidden;
  position: relative;
  /* 两侧羽化渐变，让刻度线自然隐入背景，避免边缘生硬截断 */
  mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
  -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
  transition: opacity 0.3s ease;
  pointer-events: none; /* 防止干扰点击 */
}

/* 鼠标悬停时稍微提亮，增加一点呼吸感 */
.yuemu-viewfinder-decoration:hover {
  opacity: 0.4;
}

</style>
