<template>
  <div class="yuemu-space-user-analyze">
    <a-card :bordered="false" class="yuemu-analyze-card" :bodyStyle="{ padding: '24px' }">
      <div class="yuemu-card-header">
        <div class="yuemu-header-title">
          <h3>{{ t('components.analyze.userTitle') }}</h3>
          <a-tooltip :title="t('components.analyze.userTooltip')">
            <InfoCircleOutlined class="yuemu-info-icon" />
          </a-tooltip>
        </div>

        <div class="yuemu-header-controls">
          <a-input-search
            v-model:value="searchText"
            :placeholder="t('components.analyze.searchUserPlaceholder')"
            class="yuemu-modern-search"
            :style="{ width: '240px' }"
            allowClear
            @search="doSearch"
          />
          <a-segmented
            v-model:value="timeDimension"
            :options="timeDimensionOptions"
            class="yuemu-modern-segmented"
          />
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
import { getSpaceUserAnalyzeUsingPost } from '@/api/spaceAnalyzeController'
import { message } from 'ant-design-vue'
import { InfoCircleOutlined } from '@ant-design/icons-vue'
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

const timeDimension = ref<'day' | 'week' | 'month'>('day')
const timeDimensionOptions = computed(() => [
  { label: t('components.analyze.day'), value: 'day' },
  { label: t('components.analyze.week'), value: 'week' },
  { label: t('components.analyze.month'), value: 'month' },
])

const userId = ref<string>()
const searchText = ref('')
const doSearch = (value: string) => {
  userId.value = value
}

const dataList = ref<API.SpaceCategoryAnalyzeResponse>([])
const loading = ref(true)

const fetchData = async () => {
  loading.value = true
  const res = await getSpaceUserAnalyzeUsingPost({
    queryAll: props.queryAll,
    queryPublic: props.queryPublic,
    spaceId: props.spaceId,
    timeDimension: timeDimension.value,
    userId: userId.value,
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

// 图表配置
const options = computed(() => {
  const periods = dataList.value.map((item) => item.period)
  const counts = dataList.value.map((item) => item.count)

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#f0f0f0',
      textStyle: { color: '#333' },
      padding: [10, 16],
      extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.08); border-radius: 8px;',
    },
    grid: {
      top: 30,
      bottom: 20,
      left: 10,
      right: 10,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: periods,
      boundaryGap: false,
      axisLabel: {
        color: '#8c8c8c',
        margin: 16,
      },
      axisLine: {
        lineStyle: { color: '#f0f0f0' },
      },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#8c8c8c' },
      splitLine: {
        lineStyle: {
          color: '#f0f0f0',
          type: 'dashed',
        },
      },
    },
    series: [
      {
        name: t('components.analyze.uploadCount'),
        type: 'line',
        data: counts,
        smooth: 0.4,
        symbol: 'circle',
        symbolSize: 6,
        showSymbol: false,
        lineStyle: {
          width: 3,
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#1890ff' },
            { offset: 1, color: '#36cfc9' },
          ]),
          shadowColor: 'rgba(24, 144, 255, 0.2)',
          shadowBlur: 10,
          shadowOffsetY: 4,
        },
        itemStyle: {
          color: '#1890ff',
          borderColor: '#fff',
          borderWidth: 2,
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
            { offset: 1, color: 'rgba(24, 144, 255, 0.01)' },
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.yuemu-header-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.yuemu-header-title h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.yuemu-info-icon {
  color: #9ca3af;
  cursor: pointer;
  transition: color 0.3s;
}

.yuemu-info-icon:hover {
  color: #1890ff;
}

.yuemu-header-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

/* 覆盖 Ant Design 默认样式 */
.yuemu-modern-search :deep(.ant-input-search-button) {
  background-color: #f8fafc;
  border-color: #d9d9d9;
  color: #595959;
}

.yuemu-modern-search :deep(.ant-input-search-button:hover) {
  color: #1890ff;
  border-color: #1890ff;
}

.yuemu-modern-segmented {
  font-weight: 500;
}

.yuemu-chart-container {
  height: 340px;
  width: 100%;
}

@media screen and (max-width: 768px) {
  .yuemu-card-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .yuemu-header-controls {
    width: 100%;
    justify-content: space-between;
  }
  .yuemu-modern-search {
    width: 100% !important;
  }
  .yuemu-chart-container {
    height: 280px;
  }
}
</style>
