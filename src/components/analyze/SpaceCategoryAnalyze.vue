<template>
  <div class="yuemu-space-category-analyze">
    <a-card :title="t('components.analyze.categoryTitle')" :bordered="false" class="yuemu-modern-transparent-card">
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
import { getSpaceCategoryAnalyzeUsingPost } from '@/api/spaceAnalyzeController.ts'
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
  const res = await getSpaceCategoryAnalyzeUsingPost({
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
  const categories = dataList.value.map((item) => item.category || t('components.analyze.uncategorized'))
  const countData = dataList.value.map((item) => item.count)
  const sizeData = dataList.value.map((item) => (item.totalSize / (1024 * 1024)).toFixed(2)) // 转为 MB

  return {
    // 经典的 iOS 蓝和绿
    color: ['#007AFF', '#34C759'],

    // 极简现代的悬浮提示框
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.85)',
      borderColor: 'transparent',
      padding: [12, 16],
      textStyle: { color: '#1C1C1E', fontSize: 13, fontWeight: 500 },
      borderRadius: 12,
      shadowBlur: 16,
      shadowColor: 'rgba(0, 0, 0, 0.08)',
      shadowOffsetX: 0,
      shadowOffsetY: 4,
      axisPointer: {
        type: 'shadow',
        shadowStyle: { color: 'rgba(0, 0, 0, 0.03)' } // 极其微弱的背景柱提示
      }
    },

    // 图例配置：圆点样式，放到底部
    legend: {
      data: [t('components.analyze.imageCount'), t('components.analyze.imageSizeMB')],
      bottom: 0,
      icon: 'circle',
      itemWidth: 10,
      itemGap: 24,
      textStyle: { color: '#8E8E93', fontSize: 13 } // iOS 标准次级文字色
    },

    // 完美贴合卡片边缘
    grid: {
      left: '2%',
      right: '2%',
      top: '12%',
      bottom: '12%',
      containLabel: true
    },

    // X轴：去线，留白
    xAxis: {
      type: 'category',
      data: categories,
      axisLine: { show: false }, // 隐藏轴线
      axisTick: { show: false }, // 隐藏刻度线
      axisLabel: { color: '#8E8E93', margin: 12, fontSize: 12 }
    },

    // Y轴：精简辅助线
    yAxis: [
      {
        type: 'value',
        name: t('components.analyze.count'),
        nameTextStyle: { color: '#8E8E93', padding: [0, 0, 0, 20] },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#8E8E93', fontSize: 12 },
        // 极淡的虚线网格
        splitLine: {
          lineStyle: { color: 'rgba(150, 150, 150, 0.15)', type: 'dashed' }
        }
      },
      {
        type: 'value',
        name: t('components.analyze.sizeMB'),
        nameTextStyle: { color: '#8E8E93', padding: [0, 20, 0, 0] },
        position: 'right',
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#8E8E93', fontSize: 12 },
        // 副轴不显示网格线，防止网格交叉变成“渔网”
        splitLine: { show: false }
      },
    ],

    // 柱子样式：微圆角，控制最大宽度
    series: [
      {
        name: t('components.analyze.imageCount'),
        type: 'bar',
        data: countData,
        yAxisIndex: 0,
        barMaxWidth: 20,
        itemStyle: { borderRadius: [6, 6, 0, 0] } // 顶部圆角
      },
      {
        name: t('components.analyze.imageSizeMB'),
        type: 'bar',
        data: sizeData,
        yAxisIndex: 1,
        barMaxWidth: 20,
        itemStyle: { borderRadius: [6, 6, 0, 0] } // 顶部圆角
      },
    ],
  }
})
</script>

<style scoped>
.yuemu-space-category-analyze {
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

/* 让 ECharts 在暗黑模式下根据全局滤镜自动反转以适配深色（依托于主页面的设置） */
.yuemu-modern-chart :deep(canvas) {
  transition: filter 0.3s ease;
}

/* 响应式调整 */
@media screen and (max-width: 768px) {
  .yuemu-chart-container {
    height: 280px;
  }
}
</style>
