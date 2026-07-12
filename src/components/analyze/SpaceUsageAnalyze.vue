<template>
  <div class="yuemu-space-user-analyze">
    <a-card :title="t('components.analyze.usageTitle')" :bordered="false" class="yuemu-modern-transparent-card">
      <template #extra>
        <a-tooltip :title="t('components.analyze.usageTooltip')">
          <InfoCircleOutlined class="yuemu-info-icon" />
        </a-tooltip>
      </template>

      <div class="yuemu-usage-dashboard">
        <div class="yuemu-usage-stat-box">
          <div class="yuemu-stat-header">
            <span class="yuemu-stat-name">{{ t('components.analyze.storageSpace') }}</span>
          </div>
          <div class="yuemu-chart-wrapper">
            <a-progress
              type="dashboard"
              :percent="data.sizeUsageRatio ?? 0"
              :strokeColor="{ '0%': '#4facfe', '100%': '#00f2fe' }"
              :strokeWidth="10"
              :gapDegree="75"
              class="yuemu-custom-progress"
            />
          </div>
          <div class="yuemu-stat-values">
            <span class="yuemu-used">{{ formatSize(data.usedSize || 0) }}</span>
            <span class="yuemu-divider">/</span>
            <span class="yuemu-total">{{ data.maxSize ? formatSize(data.maxSize) : t('components.analyze.unlimited') }}</span>
          </div>
        </div>

        <div class="yuemu-vertical-divider"></div>

        <div class="yuemu-usage-stat-box">
          <div class="yuemu-stat-header">
            <span class="yuemu-stat-name">{{ t('components.analyze.imageCount') }}</span>
          </div>
          <div class="yuemu-chart-wrapper">
            <a-progress
              type="dashboard"
              :percent="data.countUsageRatio ?? 0"
              :strokeColor="{ '0%': '#43e97b', '100%': '#38f9d7' }"
              :strokeWidth="10"
              :gapDegree="75"
              class="yuemu-custom-progress"
            />
          </div>
          <div class="yuemu-stat-values">
            <span class="yuemu-used">{{ data.usedCount || 0 }}</span>
            <span class="yuemu-divider">/</span>
            <span class="yuemu-total">{{ data.maxCount ?? t('components.analyze.unlimited') }}</span>
          </div>
        </div>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { getSpaceUsageAnalyzeUsingPost } from '@/api/spaceAnalyzeController.ts'
import { message } from 'ant-design-vue'
import { formatSize } from '@/utils'
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

const data = ref<API.SpaceUsageAnalyzeResponse>({})
const loading = ref(true)

const fetchData = async () => {
  loading.value = true
  const res = await getSpaceUsageAnalyzeUsingPost({
    queryAll: props.queryAll,
    queryPublic: props.queryPublic,
    spaceId: props.spaceId,
  })
  if (res.data.code === 0 && res.data.data) {
    data.value = res.data.data
  } else {
    message.error(t('components.analyze.fetchDataFailed') + res.data.message)
  }
  loading.value = false
}

watchEffect(() => {
  fetchData()
})
</script>

<style scoped>
.yuemu-space-user-analyze {
  width: 100%;
}

.yuemu-modern-transparent-card {
  background: transparent !important;
}

.yuemu-modern-transparent-card :deep(.ant-card-body) {
  padding: 16px 0 0 0 !important;
}

.yuemu-modern-transparent-card :deep(.ant-card-head) {
  border-bottom: none !important;
}

.yuemu-info-icon {
  color: var(--text-tertiary, #999);
  font-size: 16px;
  cursor: pointer;
  transition: color 0.2s;
}

.yuemu-info-icon:hover {
  color: var(--link-color, #007AFF);
}

.yuemu-usage-dashboard {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 10px 0;
}

.yuemu-usage-stat-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.yuemu-stat-header {
  margin-bottom: 8px;
}

.yuemu-stat-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  letter-spacing: 0.5px;
}

.yuemu-chart-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
}

.yuemu-stat-values {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-top: 4px;
}

.yuemu-used {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.yuemu-divider {
  font-size: 16px;
  color: var(--text-tertiary, #999);
}

.yuemu-total {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
}

.yuemu-vertical-divider {
  width: 1px;
  height: 120px;
  background: var(--border-color, #E5E5EA);
  opacity: 0.8;
}

.yuemu-custom-progress :deep(.ant-progress-circle-trail) {
  stroke: var(--border-color, #E5E5EA) !important;
}

.yuemu-custom-progress :deep(.ant-progress-text) {
  color: var(--text-primary) !important;
  font-weight: 700 !important;
  font-size: 22px !important;
}

@media screen and (max-width: 480px) {
  .yuemu-usage-dashboard {
    flex-direction: column;
    gap: 32px;
    padding: 16px 0;
  }

  .yuemu-vertical-divider {
    display: none;
  }

  .yuemu-custom-progress :deep(.ant-progress-inner) {
    width: 140px !important;
    height: 140px !important;
  }
}
</style>
