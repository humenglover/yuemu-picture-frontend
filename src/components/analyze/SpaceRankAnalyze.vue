<template>
  <div class="yuemu-space-rank-analyze">
    <a-card :bordered="false" class="yuemu-analyze-card" :bodyStyle="{ padding: '24px' }">
      <div class="yuemu-card-header">
        <div class="yuemu-header-title">
          <h3>{{ t('components.analyze.rankTitle') }}</h3>
        </div>
      </div>
      <v-chart :option="options" class="yuemu-chart-container" :loading="loading" autoresize />
    </a-card>
  </div>
</template>

<script setup lang="ts">
import VChart from 'vue-echarts'
import * as echarts from 'echarts'
import { computed, ref, watchEffect } from 'vue'
import { getSpaceRankAnalyzeUsingPost } from '@/api/spaceAnalyzeController'
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
const dataList = ref<API.Space[]>([])
const loading = ref(true)

// 获取数据
const fetchData = async () => {
  loading.value = true
  const res = await getSpaceRankAnalyzeUsingPost({
    queryAll: props.queryAll,
    queryPublic: props.queryPublic,
    spaceId: props.spaceId,
    topN: 10,
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

// 重新设计的排行榜图表选项
const options = computed(() => {
  const spaceNames = dataList.value.map((item) => item.spaceName)
  const usageData = dataList.value.map((item) => (item.totalSize / (1024 * 1024)).toFixed(2)) // 转为 MB

  // 找出最大值，用于背景槽的相对计算
  const maxData = Math.max(...usageData.map(Number))
  const backgroundData = Array(usageData.length).fill(maxData * 1.1) // 背景槽比最大值略长一点

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'none' }, // 隐藏默认的突兀阴影
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#f0f0f0',
      textStyle: { color: '#333' },
      padding: [10, 16],
      extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.08); border-radius: 8px;',
      formatter: (params: any) => {
        // 只显示真实数据，不显示背景条的 tooltip
        const data = params.find((p: any) => p.seriesName === t('components.analyze.spaceUsage'))
        if (!data) return ''
        return `<div style="font-weight:600; margin-bottom:4px;">${data.name}</div>
                <div style="color: #666;">${t('components.analyze.usageLabel')}<span style="color: #722ed1; font-weight:bold;">${data.value}</span> MB</div>`
      }
    },
    grid: {
      top: 10,
      bottom: 20,
      left: 20,
      right: 40, // 右侧留点空间给数值标签
      containLabel: true,
    },
    // 将 X 轴改为数值轴
    xAxis: {
      type: 'value',
      show: false, // 排行榜不需要底部繁杂的刻度线，数值直接写在柱子后面
    },
    // 将 Y 轴改为类目轴
    yAxis: {
      type: 'category',
      data: spaceNames,
      inverse: true, // 核心技巧：反转 Y 轴，让 Top 1 稳居顶部！
      axisLabel: {
        color: '#595959',
        fontSize: 13,
        fontWeight: 500,
        width: 100, // 限制名字最大宽度
        overflow: 'truncate', // 太长的名字自动省略号
      },
      axisLine: { show: false }, // 隐藏轴线
      axisTick: { show: false }, // 隐藏刻度
    },
    series: [
      // 背景槽 (底层)
      {
        type: 'bar',
        barWidth: 16,
        barGap: '-100%', // 让真实柱子和背景槽重叠
        data: backgroundData,
        itemStyle: {
          color: '#f5f5f5', // 极淡的灰色背景
          borderRadius: [0, 8, 8, 0],
        },
        animation: false, // 背景不需要入场动画
        tooltip: { show: false }, // 不触发 tooltip
      },
      // 真实数据 (顶层)
      {
        name: t('components.analyze.spaceUsage'),
        type: 'bar',
        barWidth: 16,
        data: usageData,
        label: {
          show: true,
          position: 'right', // 数值直接显示在柱子右侧
          formatter: '{c} MB',
          color: '#8c8c8c',
          fontSize: 12,
          offset: [8, 0], // 稍微向右偏移一点
        },
        itemStyle: {
          borderRadius: [0, 8, 8, 0],
          // 使用优雅的紫色渐变 (Ant Design 的 Geekblue 衍生)
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#b37feb' },
            { offset: 1, color: '#722ed1' },
          ]),
        },
      },
    ],
  }
})
</script>

<style scoped>
.yuemu-analyze-card {
  border-radius: 12px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02);
}

.yuemu-card-header {
  margin-bottom: 24px;
}

.yuemu-header-title h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.yuemu-chart-container {
  height: 380px; /* 横向排行榜需要稍微多一点的高度，防止柱子太挤 */
  width: 100%;
}
</style>
