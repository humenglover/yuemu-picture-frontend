<template>
  <div id="spaceAnalyzePage">
    <div class="apple-page-header">
      <h1 class="apple-large-title">{{ $t('pages.spaceAnalyzePage.title') }}</h1>
      <div class="apple-sub-nav">
        <span class="pill-item" v-if="queryAll">
          <i class="fas fa-layer-group"></i> {{ $t('pages.spaceAnalyzePage.global') }}
        </span>
        <span class="pill-item" v-else-if="queryPublic">
          <i class="fas fa-globe"></i> {{ $t('pages.spaceAnalyzePage.public') }}
        </span>
        <a class="pill-item link" v-else :href="`/space/${spaceId}`">
          <i class="fas fa-folder-open"></i> {{ $t('pages.spaceAnalyzePage.space') }}{{ spaceId }}
        </a>
      </div>
    </div>

    <a-row :gutter="[20, 20]" class="analysis-grid">
      <a-col :xs="24" :lg="12" class="analysis-col">
        <div class="apple-card">
          <div class="apple-icon-wrapper ios-blue">
            <i class="fas fa-database"></i>
          </div>
          <SpaceUsageAnalyze :spaceId="spaceId" :queryAll="queryAll" :queryPublic="queryPublic" />
        </div>
      </a-col>

      <a-col :xs="24" :lg="12" class="analysis-col">
        <div class="apple-card">
          <div class="apple-icon-wrapper ios-green">
            <i class="fas fa-shapes"></i>
          </div>
          <SpaceCategoryAnalyze :spaceId="spaceId" :queryAll="queryAll" :queryPublic="queryPublic" />
        </div>
      </a-col>

      <a-col :xs="24" :lg="12" class="analysis-col">
        <div class="apple-card">
          <div class="apple-icon-wrapper ios-purple">
            <i class="fas fa-tags"></i>
          </div>
          <SpaceTagAnalyze :spaceId="spaceId" :queryAll="queryAll" :queryPublic="queryPublic" />
        </div>
      </a-col>

      <a-col :xs="24" :lg="12" class="analysis-col">
        <div class="apple-card">
          <div class="apple-icon-wrapper ios-orange">
            <i class="fas fa-chart-bar"></i>
          </div>
          <SpaceSizeAnalyze :spaceId="spaceId" :queryAll="queryAll" :queryPublic="queryPublic" />
        </div>
      </a-col>

      <a-col :xs="24" :lg="12" class="analysis-col">
        <div class="apple-card">
          <div class="apple-icon-wrapper ios-cyan">
            <i class="fas fa-users"></i>
          </div>
          <SpaceUserAnalyze :spaceId="spaceId" :queryAll="queryAll" :queryPublic="queryPublic" />
        </div>
      </a-col>

      <a-col :xs="24" :lg="12" class="analysis-col" v-if="isAdmin">
        <div class="apple-card">
          <div class="apple-icon-wrapper ios-red">
            <i class="fas fa-ranking-star"></i>
          </div>
          <SpaceRankAnalyze :spaceId="spaceId" :queryAll="queryAll" :queryPublic="queryPublic" />
        </div>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import SpaceUsageAnalyze from '@/components/analyze/SpaceUsageAnalyze.vue'
import SpaceCategoryAnalyze from '@/components/analyze/SpaceCategoryAnalyze.vue'
import SpaceTagAnalyze from '@/components/analyze/SpaceTagAnalyze.vue'
import SpaceSizeAnalyze from '@/components/analyze/SpaceSizeAnalyze.vue'
import SpaceUserAnalyze from '@/components/analyze/SpaceUserAnalyze.vue'
import SpaceRankAnalyze from '@/components/analyze/SpaceRankAnalyze.vue'
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'

const { t } = useI18n();

const route = useRoute()

// 空间 id
const spaceId = computed(() => {
  return route.query?.spaceId as string
})

// 是否查询所有空间
const queryAll = computed(() => {
  return !!route.query?.queryAll
})

// 是否查询公共空间
const queryPublic = computed(() => {
  return !!route.query?.queryPublic
})

// 判断用户是否为管理员
const loginUserStore = useLoginUserStore()
const loginUser = loginUserStore.loginUser
const isAdmin = computed(() => {
  return loginUser.userRole === 'admin'
})
</script>

<style scoped>
/* ===================== 1. 页面级底色与布局 ===================== */
#spaceAnalyzePage {
  /* Apple 系统偏好底层使用非常淡的灰，凸显纯白卡片 */
  background-color: var(--background, #F2F2F7);
  color: var(--text-primary);
  min-height: 100vh;
  padding: 32px 24px 60px;
  max-width: 1440px;
  margin: 0 auto;
}

/* ===================== 2. 极简 Large Title 头部 ===================== */
.apple-page-header {
  margin-bottom: 32px;
  padding: 0 8px;
}

.apple-large-title {
  margin: 0 0 12px 0;
  font-size: 34px;
  font-weight: 700;
  letter-spacing: -0.8px; /* SF Pro 风格的紧凑字间距 */
  color: var(--text-primary);
}

.apple-sub-nav {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 面包屑 / 胶囊标签 */
.pill-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  background: var(--hover-background, #E5E5EA);
  padding: 6px 14px;
  border-radius: 16px;
  transition: all 0.2s ease;
}

.pill-item.link {
  color: #007AFF; /* 经典的 iOS 蓝 */
  background: rgba(0, 122, 255, 0.08);
  text-decoration: none;
}

.pill-item.link:hover {
  background: rgba(0, 122, 255, 0.15);
}

/* ===================== 3. 苹果风原生卡片 ===================== */
.analysis-grid {
  margin: 0 !important;
}

.apple-card {
  position: relative;
  /* 卡片使用纯色背景 */
  background: var(--card-background, #FFFFFF);
  border-radius: 20px;
  padding: 24px;
  height: 100%;
  /* 极致柔和的阴影，摒弃厚重感 */
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.03);
  transition: transform 0.2s cubic-bezier(0.25, 0.1, 0.25, 1);
}

/* 移除花哨的 Hover 描边，仅保留轻微的物理上浮反馈 */
.apple-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
}

/* ===================== 4. 经典的系统设置级图标 (Squircle) ===================== */
.apple-icon-wrapper {
  position: absolute;
  top: 24px;
  left: 24px;
  width: 28px;
  height: 28px;
  border-radius: 7px; /* 模拟 Apple 小巧的连续平滑圆角 */
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #FFFFFF;
  z-index: 10;
}

/* 采用原汁原味的 iOS 系统调色板，完全剔除过渡渐变 */
.ios-blue { background-color: #007AFF; }
.ios-green { background-color: #34C759; }
.ios-purple { background-color: #AF52DE; }
.ios-orange { background-color: #FF9500; }
.ios-cyan { background-color: #32ADE6; }
.ios-red { background-color: #FF3B30; }

/* ===================== 5. 穿透与覆写 Ant Design ===================== */
.apple-card :deep(.ant-card) {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

.apple-card :deep(.ant-card-head) {
  border-bottom: 1px solid var(--border-color, #F2F2F7);
  padding: 0 0 14px 0;
  margin-bottom: 18px;
  min-height: auto;
}

/* 标题布局：为左侧小图标留出完美间距，字体样式对标 iOS 分组标题 */
.apple-card :deep(.ant-card-head-title) {
  padding-left: 38px;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.4px;
  color: var(--text-primary, #1C1C1E);
  line-height: 28px;
}

.apple-card :deep(.ant-card-body) {
  padding: 0;
}

/* 图表文字配色适配 */
.apple-card :deep(canvas) {
  filter: var(--chart-filter, none);
}

/* ===================== 6. 移动端适配 ===================== */
@media screen and (max-width: 768px) {
  #spaceAnalyzePage {
    padding: 16px 12px 40px;
  }

  .apple-page-header {
    margin-bottom: 24px;
    padding: 0 4px;
  }

  .apple-large-title {
    font-size: 28px;
  }

  .pill-item {
    font-size: 13px;
    padding: 5px 12px;
  }

  .analysis-col {
    padding-left: 0 !important;
    padding-right: 0 !important;
  }

  .apple-card {
    padding: 20px;
    border-radius: 16px;
  }

  .apple-icon-wrapper {
    top: 20px;
    left: 20px;
  }

  .apple-card :deep(.ant-card-head-title) {
    font-size: 16px;
    padding-left: 36px;
  }
}

/* ===================== 7. 纯正暗黑模式支持 ===================== */
.dark-theme #spaceAnalyzePage {
  /* Apple 的暗黑底层通常是纯黑或极深色 */
  background-color: #000000;
}

.dark-theme .apple-card {
  /* 卡片色提升灰阶 */
  background-color: #1C1C1E;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: none;
}

.dark-theme .apple-card :deep(.ant-card-head) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.dark-theme .apple-card :deep(.ant-card-head-title) {
  color: #FFFFFF;
}

.dark-theme .pill-item {
  background: #2C2C2E;
  color: #EBEBF5;
}

.dark-theme .pill-item.link {
  background: rgba(10, 132, 255, 0.15);
  color: #0A84FF; /* iOS Dark Mode Blue */
}
</style>
