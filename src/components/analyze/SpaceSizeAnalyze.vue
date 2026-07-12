<template>
  <div class="yuemu-space-size-analyze">
    <a-card :title="t('components.analyze.sizeTitle')" :bordered="false" class="yuemu-modern-transparent-card">
      <div class="yuemu-chart-container">
        <v-chart :option="options" class="yuemu-modern-chart" :loading="loading" autoresize />
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import VChart from 'vue-echarts'
import 'echarts'
import { computed, ref, watchEffect } from 'vue'
import { getSpaceSizeAnalyzeUsingPost } from '@/api/spaceAnalyzeController.ts'
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
const dataList = ref<API.SpaceSizeAnalyzeResponse>([])
// 加载状态
const loading = ref(true)

// 获取数据
const fetchData = async () => {
  loading.value = true
  const res = await getSpaceSizeAnalyzeUsingPost({
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

// Apple 极简风图表选项配置
const options = computed(() => {
  const pieData = dataList.value.map((item) => ({
    name: item.sizeRange || t('components.analyze.unknownSize'),
    value: item.count,
  }))

  return {
    // 采用原生 iOS 系统经典色卡
    color: ['#007AFF', '#34C759', '#FF9500', '#AF52DE', '#FF2D55', '#32ADE6'],

    // 极简现代悬浮面板
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
                  <span style="font-weight:700;margin-left:4px;color:#1C1C1E;">${params.value} ${t('components.analyze.pieces')} (${params.percent}%)</span>
                </div>`
      },
    },

    // 图例配置：圆点样式，放到底部居中
    legend: {
      bottom: 0,
      icon: 'circle',
      itemWidth: 10,
      itemGap: 20,
      textStyle: { color: '#8E8E93', fontSize: 13 }
    },

    series: [
      {
        name: t('components.analyze.sizeDistribution'),
        type: 'pie',
        // 采用环形图 (Doughnut)，比实心大饼更有现代感
        radius: ['45%', '75%'],
        center: ['50%', '45%'], // 稍微上移，给底部图例留出空间
        avoidLabelOverlap: false,
        // 切片圆角与切割线
        itemStyle: {
          borderRadius: 8,
          borderColor: 'var(--card-background, #fff)', // 使用边框色作为缝隙，融入背景
          borderWidth: 2
        },
        // 默认隐藏外围连线标签，保持极简
        label: {
          show: false,
          position: 'center'
        },
        // 高亮时在中心优雅浮现数据
        emphasis: {
          label: {
            show: true,
            fontSize: 18,
            fontWeight: 'bold',
            color: 'var(--text-primary, #1C1C1E)',
            formatter: '{b}\n{d}%',
            lineHeight: 24
          }
        },
        labelLine: {
          show: false
        },
        data: pieData,
      },
    ],
  }
})
</script>

<style scoped>
.yuemu-space-size-analyze {
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
