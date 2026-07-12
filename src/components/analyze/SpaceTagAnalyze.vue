<template>
  <div class="yuemu-space-tag-analyze">
    <a-card :title="t('components.analyze.tagTitle')" :bordered="false" class="yuemu-modern-transparent-card">
      <div class="yuemu-chart-container">
        <v-chart :option="options" class="yuemu-modern-chart" :loading="loading" autoresize />
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import VChart from 'vue-echarts'
import 'echarts'
import 'echarts-wordcloud'
import { computed, ref, watchEffect } from 'vue'
import { getSpaceTagAnalyzeUsingPost } from '@/api/spaceAnalyzeController.ts'
import { message } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface Props {
  queryAll?: boolean
  queryPublic?: boolean
  spaceId?: number
}

const props = withDefaults(defineProps<Props>(), {
  queryAll: false,
  queryPublic: false,
})

// 图表数据
const dataList = ref<API.SpaceCategoryAnalyzeResponse>([])
// 加载状态
const loading = ref(true)

// 获取数据
const fetchData = async () => {
  loading.value = true
  const res = await getSpaceTagAnalyzeUsingPost({
    queryAll: props.queryAll,
    queryPublic: props.queryPublic,
    spaceId: props.spaceId,
  })
  if (res.data.code === 0 && res.data.data) {
    dataList.value = res.data.data ?? []
  } else {
    message.error(t('components.analyze.fetchDataFailed') + res.data.message)
  }
  loading.value = false
}

watchEffect(() => {
  fetchData()
})

// Apple 专属精选系统色卡
const iosColors = [
  '#007AFF', // Blue
  '#34C759', // Green
  '#5856D6', // Indigo
  '#AF52DE', // Purple
  '#FF2D55', // Pink
  '#FF9500', // Orange
  '#32ADE6', // Cyan
  '#FF3B30'  // Red
]

// Apple 极简风图表选项配置
const options = computed(() => {
  const tagData = dataList.value.map((item) => ({
    name: item.tag || t('components.analyze.unnamed'),
    value: item.count,
  }))

  return {
    // 极简现代的悬浮提示框
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.85)',
      borderColor: 'transparent',
      padding: [12, 16],
      textStyle: { color: '#1C1C1E', fontSize: 13, fontWeight: 500 },
      borderRadius: 12,
      shadowBlur: 16,
      shadowColor: 'rgba(0, 0, 0, 0.08)',
      shadowOffsetX: 0,
      shadowOffsetY: 4,
      formatter: (params: any) => {
        return `<div style="display:flex; align-items:center; gap:8px;">
                  <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:${params.color}"></span>
                  <span>${params.name}</span>
                  <span style="font-weight:700;margin-left:4px;color:#1C1C1E;">${params.value} ${t('components.analyze.pieces')}</span>
                </div>`
      },
    },
    series: [
      {
        type: 'wordCloud',
        shape: 'circle',
        keepAspect: true,
        left: 'center',
        top: 'center',
        width: '95%',
        height: '95%',
        gridSize: 14, // 词间距，稍微拉开一点，增加呼吸感
        sizeRange: [14, 56], // 字体大小渐变范围
        rotationRange: [-45, 45], // 控制旋转角度，抛弃乱七八糟的 90 度倒立
        rotationStep: 45,
        drawOutOfBound: false,
        layoutAnimation: true,
        textStyle: {
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          fontWeight: '600', // 增加字重，看起来更有质感
          color: () => iosColors[Math.floor(Math.random() * iosColors.length)] // 从精选色卡随机抽色
        },
        emphasis: {
          focus: 'self',
          textStyle: {
            textShadowBlur: 12,
            textShadowColor: 'rgba(0, 0, 0, 0.15)'
          }
        },
        data: tagData,
      },
    ],
  }
})
</script>

<style scoped>
.yuemu-space-tag-analyze {
  width: 100%;
}

/* 容器尺寸 */
.yuemu-chart-container {
  height: 320px;
  width: 100%;
  position: relative;
}

.yuemu-modern-chart {
  width: 100%;
  height: 100%;
}

/* 透明卡片重置：完全依赖父级的容器背景 */
.yuemu-modern-transparent-card {
  background: transparent !important;
}

.yuemu-modern-transparent-card :deep(.ant-card-body) {
  padding: 16px 0 0 0 !important;
}

.yuemu-modern-transparent-card :deep(.ant-card-head) {
  border-bottom: none !important;
}

/* 响应式调整 */
@media screen and (max-width: 768px) {
  .yuemu-chart-container {
    height: 280px;
  }
}
</style>
