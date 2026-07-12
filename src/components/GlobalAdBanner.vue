<template>
  <div class="yuemu-global-ad-container" :style="[ { margin: margin }, fillHeight ? { position: 'absolute', inset: 0, height: 'auto', width: 'auto' } : {} ]">
    <div class="yuemu-ad-inner" :style="fillHeight ? { position: 'absolute', inset: 0, height: 'auto', maxWidth: 'none', borderRadius: 'inherit' } : {}">
      <!-- 占位符（纯 CSS 控制，只有广告未能显示时才会被看到） -->
      <span class="yuemu-ad-placeholder">
        <i class="fas fa-bullhorn" style="margin-right: 8px;"></i>{{ placeholderText }}
      </span>
      
      <!-- AdSense 实体 -->
      <ins class="adsbygoogle"
           style="display:block; width: 100%; height: 100%; position: relative; z-index: 1;"
           data-ad-client="ca-pub-8411665379717170"
           :data-ad-slot="adSlot"
           :data-ad-format="format"
           :data-full-width-responsive="fullWidthResponsive"></ins>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  adSlot: {
    type: String,
    default: '8187126091'
  },
  format: {
    type: String,
    default: 'horizontal' // 默认横向模式，高度克制，寸土寸金
  },
  fullWidthResponsive: {
    type: String,
    default: 'false' // 默认关闭自适应，由父容器决定宽度，绝对安全
  },
  placeholderText: {
    type: String,
    default: 'Advertisement Space'
  },
  margin: {
    type: String,
    default: '20px 0' // 默认上下 20px 边距，无 auto 干扰拉伸
  },
  fillHeight: {
    type: Boolean,
    default: false
  }
})

onMounted(() => {
  // 稍作延迟，确保 DOM 和布局已经完全就绪，不干扰页面核心指标(LCP)
  setTimeout(() => {
    nextTick(() => {
      try {
        if (window) {
          // @ts-ignore
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        }
      } catch (e) {
        console.warn('AdSense init error:', e)
      }
    })
  }, 800)
})
</script>

<style scoped>
/* 最安全的流式外壳，只控制宽度，不引入危险的 flex/grid 排版破坏 */
.yuemu-global-ad-container {
  width: 100%;
  box-sizing: border-box;
}

.yuemu-ad-inner {
  width: 100%;
  max-width: 100%;
  min-height: 90px;
  margin: 0 auto;
  background: var(--hover-background, #f5f5f5);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed var(--border-color, #e0e0e0);
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
  transition: all 0.3s ease;
}

.yuemu-ad-placeholder {
  position: absolute;
  color: var(--text-secondary, #999);
  font-size: 14px;
  font-weight: bold;
  pointer-events: none;
  display: flex;
  align-items: center;
  opacity: 0.6;
}

/* 核心杀手锏：利用 AdSense 注入的状态码隐藏空壳 iframe */
ins.adsbygoogle[data-ad-status="unfilled"] {
  display: none !important;
}
</style>
