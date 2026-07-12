<template>
  <div class="yuemu-global-ad-container" :class="{ 'is-fill': fillHeight }" :style="[ { margin: margin, '--ad-min-height': minHeight } ]">
    
    <!-- 真实的 IMG 标签：拥有真实的物理高度，绝不会被 AdSense 的 height: auto 压扁 -->
    <img :src="adBgImage" class="yuemu-ad-fallback-img" alt="Ad Placeholder" />
    
    <!-- 广告层：与占位图重叠 -->
    <div class="yuemu-ad-inner">
      <!-- 统一的广告角标 -->
      <div class="yuemu-ad-badge">{{ t('components.globalAd.badge') || 'Ad' }}</div>
      
      <!-- 隔离层 -->
      <div class="yuemu-ad-isolation-wrapper">
        <!-- AdSense 实体 -->
        <ins v-if="adNetwork === 'adsense'" class="adsbygoogle"
             style="display:block; width: 100%; height: 100%;"
             data-ad-client="ca-pub-8411665379717170"
             :data-ad-slot="adSlot"
             :data-ad-format="format"
             :data-full-width-responsive="fullWidthResponsive"></ins>
             
        <!-- 百度联盟 实体 -->
        <div v-else-if="adNetwork === 'baidu'"
             :id="baiduContainerId"
             style="width: 100%; height: 100%;">
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import adBgImage from '@/assets/images/ad.png'

const { t } = useI18n()
const baiduContainerId = ref('baidu-ad-' + Math.random().toString(36).substr(2, 9));

const props = defineProps({
  adNetwork: {
    type: String,
    default: 'adsense' // 可选: 'adsense' | 'baidu'
  },
  adSlot: {
    type: String,
    default: '8187126091'
  },
  baiduSlot: {
    type: String,
    default: 'u6934445' // 兜底的百度联盟广告位 ID
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
    default: '' // Use translation in template
  },
  margin: {
    type: String,
    default: '20px 0' // 默认上下 20px 边距，无 auto 干扰拉伸
  },
  minHeight: {
    type: String,
    default: '90px'
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
        if (props.adNetwork === 'adsense') {
          if (window) {
            // @ts-ignore
            (window.adsbygoogle = window.adsbygoogle || []).push({});
          }
        } else if (props.adNetwork === 'baidu') {
          if (window) {
            if (!document.querySelector('script[src*="cpro.baidustatic.com"]')) {
               const script = document.createElement('script');
               script.src = '//cpro.baidustatic.com/cpro/ui/c.js';
               script.async = true;
               document.head.appendChild(script);
            }
            // @ts-ignore
            (window.slotbydup = window.slotbydup || []).push({
                id: props.baiduSlot,
                container: baiduContainerId.value,
                async: true
            });
          }
        }
      } catch (e) {
        console.warn('AdSense init error:', e)
      }
    })
  }, 800)
})
</script>

<style scoped>
/* 容器：相对定位，由 img 撑开物理高度 */
.yuemu-global-ad-container {
  width: 100%;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  background-color: var(--hover-background, #f5f5f5);
  border: 1px dashed var(--border-color, #e0e0e0);
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
}

.yuemu-global-ad-container.is-fill {
  position: absolute;
  inset: 0;
  height: auto;
  border-radius: inherit;
}

/* 真实的 IMG 标签：拥有真实的物理高度，保证父级即使被强制 height: auto 也能撑开 */
.yuemu-ad-fallback-img {
  display: block;
  width: 100%;
  height: 100%;
  min-height: var(--ad-min-height, 90px);
  object-fit: cover;
  object-position: center;
}

/* 内部广告层：绝对定位覆盖在图上 */
.yuemu-ad-inner {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
}

.yuemu-ad-isolation-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  inset: 0;
  z-index: 1;
}

.yuemu-ad-badge {
  position: absolute;
  top: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.1);
  color: #999;
  font-size: 10px;
  padding: 2px 6px;
  border-bottom-left-radius: 8px;
  z-index: 10;
  pointer-events: none;
}

/* 核心杀手锏：利用 AdSense 注入的状态码隐藏空壳 iframe */
ins.adsbygoogle[data-ad-status="unfilled"] {
  display: none !important;
}
</style>
