<template>
  <div id="yuemu-redisMonitorPage">
    <div class="yuemu-page-container">
      <div class="yuemu-header-panel">
        <h2 class="yuemu-page-title"> {{ t('pages.admin.redisCacheMonitorPage.title') }} </h2>
        <a-button type="primary" class="yuemu-btn-primary" @click="refreshData">
          <template #icon><ReloadOutlined /></template>
          Refresh Data
        </a-button>
      </div>

      <div class="yuemu-content-scroll-area">
        <a-row :gutter="[16, 16]">
          <a-col :span="24">
            <div class="yuemu-data-card">
              <div class="yuemu-card-header">
                <span class="yuemu-card-title"> {{ t('pages.admin.redisCacheMonitorPage.basicInfo') }} </span>
              </div>
              <a-descriptions :column="{ xxl: 4, xl: 3, lg: 2, md: 2, sm: 1, xs: 1 }" class="yuemu-descriptions">
                <a-descriptions-item :label="t('pages.admin.redisCacheMonitorPage.redisVersion')">{{ redisInfo.version }}</a-descriptions-item>
                <a-descriptions-item :label="t('pages.admin.redisCacheMonitorPage.runMode')">
                  <span class="yuemu-tag yuemu-blue">{{ redisInfo.mode }}</span>
                </a-descriptions-item>
                <a-descriptions-item :label="t('pages.admin.redisCacheMonitorPage.os')">{{ redisInfo.os }}</a-descriptions-item>
                <a-descriptions-item :label="t('pages.admin.redisCacheMonitorPage.pid')">{{ redisInfo.processId }}</a-descriptions-item>
                <a-descriptions-item :label="t('pages.admin.redisCacheMonitorPage.uptime')">{{ redisInfo.uptime }} {{ t('pages.admin.redisCacheMonitorPage.daysText') }}</a-descriptions-item>
                <a-descriptions-item :label="t('pages.admin.redisCacheMonitorPage.connections')">
                  <span class="yuemu-tag yuemu-green">{{ redisInfo.clients }}</span>
                </a-descriptions-item>
                <a-descriptions-item :label="t('pages.admin.redisCacheMonitorPage.memUsage')">{{ redisInfo.usedMemory }}</a-descriptions-item>
                <a-descriptions-item :label="t('pages.admin.redisCacheMonitorPage.memPeak')">{{ redisInfo.usedMemoryPeak }}</a-descriptions-item>
                <a-descriptions-item :label="t('pages.admin.redisCacheMonitorPage.totalMem')">{{ redisInfo.totalMemory }}</a-descriptions-item>
                <a-descriptions-item :label="t('pages.admin.redisCacheMonitorPage.memFragment')">{{ redisInfo.memoryFragmentation }}</a-descriptions-item>
                <a-descriptions-item :label="t('pages.admin.redisCacheMonitorPage.hitRate')">
                  <span class="yuemu-tag yuemu-orange">{{ redisInfo.hitRate }}</span>
                </a-descriptions-item>
                <a-descriptions-item :label="t('pages.admin.redisCacheMonitorPage.totalCommands')">{{ redisInfo.commandsProcessed }}</a-descriptions-item>
              </a-descriptions>
            </div>
          </a-col>

          <a-col :span="24">
            <div class="yuemu-data-card">
              <div class="yuemu-card-header">
                <span class="yuemu-card-title"> {{ t('pages.admin.redisCacheMonitorPage.keyStats') }} </span>
              </div>
              <a-row :gutter="[16, 16]" class="yuemu-stats-row">
                <a-col :xs="24" :sm="8">
                  <div class="yuemu-stat-widget yuemu-green-theme">
                    <div class="yuemu-stat-icon"><DatabaseOutlined /></div>
                    <div class="yuemu-stat-info">
                      <div class="yuemu-stat-label"> {{ t('pages.admin.redisCacheMonitorPage.totalKeys') }} </div>
                      <div class="yuemu-stat-value">{{ formatNumber(keysStats.totalKeys) }}</div>
                    </div>
                  </div>
                </a-col>
                <a-col :xs="24" :sm="8">
                  <div class="yuemu-stat-widget yuemu-red-theme">
                    <div class="yuemu-stat-icon"><ClockCircleOutlined /></div>
                    <div class="yuemu-stat-info">
                      <div class="yuemu-stat-label"> {{ t('pages.admin.redisCacheMonitorPage.expiredKeys') }} </div>
                      <div class="yuemu-stat-value">{{ formatNumber(keysStats.expiredKeys) }}</div>
                    </div>
                  </div>
                </a-col>
                <a-col :xs="24" :sm="8">
                  <div class="yuemu-stat-widget yuemu-blue-theme">
                    <div class="yuemu-stat-icon"><ThunderboltOutlined /></div>
                    <div class="yuemu-stat-info">
                      <div class="yuemu-stat-label"> {{ t('pages.admin.redisCacheMonitorPage.expKeysPerSec') }} </div>
                      <div class="yuemu-stat-value">{{ Number(keysStats.expiredKeysPerSec || 0).toFixed(2) }}</div>
                    </div>
                  </div>
                </a-col>
              </a-row>
            </div>
          </a-col>

          <a-col :xs="24" :sm="24" :md="12">
            <div class="yuemu-data-card yuemu-chart-card">
              <div class="yuemu-card-header">
                <span class="yuemu-card-title"> {{ t('pages.admin.redisCacheMonitorPage.memStatus') }} </span>
              </div>
              <div ref="memoryChartRef" class="yuemu-chart-container"></div>
            </div>
          </a-col>

          <a-col :xs="24" :sm="24" :md="12">
            <div class="yuemu-data-card yuemu-chart-card">
              <div class="yuemu-card-header">
                <span class="yuemu-card-title">Command Execution Stats (Top 10)</span>
              </div>
              <div ref="commandChartRef" class="yuemu-chart-container"></div>
            </div>
          </a-col>
        </a-row>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { getRedisInfoUsingGet, getKeysStatisticsUsingGet, getMemoryInfoUsingGet } from '@/api/redisCacheMonitorController'
import { ReloadOutlined, DatabaseOutlined, ClockCircleOutlined, ThunderboltOutlined } from '@ant-design/icons-vue'
import * as echarts from 'echarts'
import { message } from 'ant-design-vue'

const memoryChartRef = ref<HTMLDivElement | null>(null)
const commandChartRef = ref<HTMLDivElement | null>(null)
let memoryChart: echarts.ECharts | null = null
let commandChart: echarts.ECharts | null = null

const redisInfo = ref<any>({})
const keysStats = ref<any>({})
const memoryInfo = ref<any>({})
const loading = ref(false)

const formatMemory = (bytes: number | string) => {
  if (!bytes || bytes === '0') return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  let byteNum = typeof bytes === 'string' ? parseInt(bytes) : bytes;
  if (byteNum === 0) return '0 B';
  const i = Math.floor(Math.log(byteNum) / Math.log(1024));
  return `${(byteNum / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

const formatNumber = (num: number | string) => {
  if (!num) return '0';
  return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
};

const processRedisInfo = (info: any) => {
  if (!info) return {};
  return {
    version: info.redis_version || '-',
    mode: info.redis_mode || 'standalone',
    os: info.os ? info.os.trim() : 'Unknown',
    processId: info.process_id || '-',
    uptime: info.uptime_in_days || '0',
    clients: info.connected_clients || '0',
    usedMemory: formatMemory(info.used_memory || 0),
    usedMemoryPeak: formatMemory(info.used_memory_peak || 0),
    totalMemory: formatMemory(info.total_system_memory || info.used_memory_peak || 0),
    memoryFragmentation: info.mem_fragmentation_ratio ? Number(info.mem_fragmentation_ratio).toFixed(2) : '1.00',
    hitRate: calculateHitRate(info),
    commandsProcessed: formatNumber(info.total_commands_processed || 0),
  };
};

const calculateHitRate = (info: any) => {
  if (!info) return '0%';
  const hits = parseInt(info.keyspace_hits || '0');
  const misses = parseInt(info.keyspace_misses || '0');
  const total = hits + misses;
  if (total === 0) return '0%';
  return ((hits / total) * 100).toFixed(2) + '%';
};

const processMemoryChartData = (memInfo: any) => {
  if (!memInfo) return [];
  const used = parseInt(memInfo.usedMemory || '0');
  const total = Math.max(used * 2, parseInt(memInfo.usedMemoryPeak || '0'));
  const available = Math.max(0, total - used);
  return [
    { name: t('pages.admin.redisCacheMonitorPage.usedMemTextVal'), value: used, itemStyle: { color: '#3b82f6' } },
    { name: t('pages.admin.redisCacheMonitorPage.availMemTextVal'), value: available, itemStyle: { color: '#10b981' } }
  ];
};

const processCommandChartData = (commandStats: any[]) => {
  if (!commandStats || !Array.isArray(commandStats)) return [];
  return commandStats
    .sort((a, b) => parseInt(b.value) - parseInt(a.value))
    .slice(0, 10)
    .map(item => ({
      name: item.name.toUpperCase(),
      value: parseInt(item.value)
    }))
    .reverse();
};

const getTextColor = () => {
  return getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#333';
};
const getSecondaryTextColor = () => {
  return getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#666';
};

const initCharts = () => {
  if (memoryChartRef.value) memoryChart = echarts.init(memoryChartRef.value);
  if (commandChartRef.value) commandChart = echarts.init(commandChartRef.value);
}

const updateCharts = (memData: any[], cmdData: any[]) => {
  const textColor = getTextColor();
  const secondaryTextColor = getSecondaryTextColor();

  if (memoryChart) {
    memoryChart.setOption({
      tooltip: {
        trigger: 'item',
        backgroundColor: 'var(--card-background)',
        borderColor: 'var(--border-color)',
        textStyle: { color: textColor },
        formatter: (params: any) => `${params.name}<br/>${formatMemory(params.value)} (${params.percent}%)`
      },
      legend: { orient: 'horizontal', bottom: 'bottom', textStyle: { color: textColor } },
      series: [{
        name: t('pages.admin.redisCacheMonitorPage.memDistTextVal'),
        type: 'pie',
        radius: ['50%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: 'var(--card-background)', borderWidth: 2 },
        label: { show: false, position: 'center' },
        emphasis: { label: { show: true, fontSize: 18, fontWeight: 'bold', color: textColor } },
        labelLine: { show: false },
        data: memData
      }]
    }, true);
  }

  if (commandChart) {
    commandChart.setOption({
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'var(--card-background)',
        borderColor: 'var(--border-color)',
        textStyle: { color: textColor },
        formatter: (params: any) => `${params[0].name}: ${formatNumber(params[0].value)} ${t('pages.admin.redisCacheMonitorPage.timesUnit')}`
      },
      grid: { left: '3%', right: '8%', bottom: '3%', top: '5%', containLabel: true },
      xAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: 'var(--border-color)', type: 'dashed' } },
        axisLabel: { color: secondaryTextColor }
      },
      yAxis: {
        type: 'category',
        data: cmdData.map(item => item.name),
        axisLine: { lineStyle: { color: 'var(--border-color)' } },
        axisLabel: { color: textColor, fontWeight: '500' }
      },
      series: [{
        name: t('pages.admin.redisCacheMonitorPage.execCountTextVal'),
        type: 'bar',
        barWidth: '60%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
            { offset: 0, color: '#8b5cf6' },
            { offset: 1, color: '#6366f1' }
          ]),
          borderRadius: [0, 4, 4, 0]
        },
        data: cmdData.map(item => item.value)
      }]
    }, true);
  }
}

const fetchData = async () => {
  if (loading.value) return;
  loading.value = true;
  try {
    const [infoRes, keysRes, memoryRes] = await Promise.all([
      getRedisInfoUsingGet(),
      getKeysStatisticsUsingGet(),
      getMemoryInfoUsingGet()
    ])

    let memChartData = [];
    let cmdChartData = [];

    if (infoRes.data?.code === 0) {
      redisInfo.value = processRedisInfo(infoRes.data.data.info);
      if (infoRes.data.data.commandStats) {
        cmdChartData = processCommandChartData(infoRes.data.data.commandStats);
      }
    }
    if (keysRes.data?.code === 0) keysStats.value = keysRes.data.data || {};
    if (memoryRes.data?.code === 0) {
      memoryInfo.value = memoryRes.data.data || {};
      memChartData = processMemoryChartData(memoryInfo.value);
    }
    updateCharts(memChartData, cmdChartData);
  } catch (error) {
    message.error(t('pages.admin.redisCacheMonitorPage.fetchMonitorErrorVal'));
  } finally {
    loading.value = false;
  }
}

const refreshData = () => {
  fetchData();
  message.success(t('pages.admin.redisCacheMonitorPage.dataRefreshedVal'));
}

const handleResize = () => {
  memoryChart?.resize();
  commandChart?.resize();
}

onMounted(() => {
  nextTick(() => {
    initCharts();
    fetchData();
    window.addEventListener('resize', handleResize);
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  memoryChart?.dispose();
  commandChart?.dispose();
})
</script>

<style scoped>
#yuemu-redisMonitorPage {
  height: 100%;
  box-sizing: border-box;
  background-color: var(--background);
  color: var(--text-primary);
  transition: var(--theme-transition);
}

.yuemu-text-secondary { color: var(--text-secondary); }

.yuemu-page-container {
  padding: 16px;
  max-width: 1400px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.yuemu-content-scroll-area {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 24px;
}

.yuemu-header-panel {
  background-color: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 16px 24px;
  box-shadow: 0 4px 16px var(--shadow-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-shrink: 0;
  transition: var(--theme-transition);
}

.yuemu-page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
}

.yuemu-btn-primary {
  background-color: var(--link-color) !important;
  color: var(--text-other) !important;
  border: none !important;
  border-radius: 8px !important;
  font-weight: 500;
  height: 36px;
  display: inline-flex;
  align-items: center;
  transition: var(--theme-transition);
}
.yuemu-btn-primary:hover { background-color: var(--link-hover-color) !important; }

.yuemu-data-card {
  background-color: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 12px var(--shadow-color);
  height: 100%;
  transition: var(--theme-transition);
}

.yuemu-card-header {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}
.yuemu-card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.yuemu-chart-container {
  height: 320px;
  width: 100%;
}

:deep(.yuemu-descriptions .ant-descriptions-item-label) {
  color: var(--text-secondary);
  font-weight: 400;
}
:deep(.yuemu-descriptions .ant-descriptions-item-content) {
  color: var(--text-primary);
  font-weight: 500;
}

.yuemu-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}
.yuemu-tag.yuemu-blue { background-color: rgba(59, 130, 246, 0.1); color: #3b82f6; }
.yuemu-tag.yuemu-green { background-color: rgba(16, 185, 129, 0.1); color: #10b981; }
.yuemu-tag.yuemu-orange { background-color: rgba(245, 158, 11, 0.1); color: #f59e0b; }

.yuemu-stats-row {
  margin-top: 8px;
}
.yuemu-stat-widget {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 12px;
  background-color: var(--hover-background);
  border: 1px solid var(--border-color);
  transition: transform 0.2s;
}
.yuemu-stat-widget:hover {
  transform: translateY(-2px);
}

.yuemu-stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 24px;
}

.yuemu-stat-info {
  display: flex;
  flex-direction: column;
}
.yuemu-stat-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}
.yuemu-stat-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}

.yuemu-green-theme .yuemu-stat-icon { background-color: rgba(16, 185, 129, 0.1); color: #10b981; }
.yuemu-red-theme .yuemu-stat-icon { background-color: rgba(239, 68, 68, 0.1); color: #ef4444; }
.yuemu-blue-theme .yuemu-stat-icon { background-color: rgba(59, 130, 246, 0.1); color: #3b82f6; }

@media screen and (max-width: 768px) {
  .yuemu-page-container { padding: 12px; }
  .yuemu-header-panel { border-radius: 12px; padding: 12px 16px; }
  .yuemu-page-title { font-size: 18px; }
  .yuemu-data-card { padding: 16px; border-radius: 12px; }
  .yuemu-chart-container { height: 280px; }
  .yuemu-btn-primary { padding: 0 12px; font-size: 13px; }
}
</style>
