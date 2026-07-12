<template>
  <div id="yuemu-bugReportManagePage">
    <template v-if="device === DEVICE_TYPE_ENUM.PC">
      <div class="yuemu-pc-container">
        <div class="yuemu-stats-grid">
          <div class="yuemu-stat-card">
            <div class="yuemu-stat-icon" style="background: rgba(59, 130, 246, 0.1); color: #3b82f6;"><BugOutlined /></div>
            <div class="yuemu-stat-info">
              <span class="yuemu-stat-label">{{ t('pages.admin.bugReportManagePage.totalReportsLabel') }}</span>
              <span class="yuemu-stat-value">{{ stats.totalReports || 0 }}</span>
            </div>
          </div>
          <div class="yuemu-stat-card">
            <div class="yuemu-stat-icon" style="background: rgba(245, 158, 11, 0.1); color: #f59e0b;"><ClockCircleOutlined /></div>
            <div class="yuemu-stat-info">
              <span class="yuemu-stat-label">{{ t('pages.admin.bugReportManagePage.pendingCount') }}</span>
              <span class="yuemu-stat-value">{{ stats.pendingReports || 0 }}</span>
            </div>
          </div>
          <div class="yuemu-stat-card">
            <div class="yuemu-stat-icon" style="background: rgba(16, 185, 129, 0.1); color: #10b981;"><CheckCircleOutlined /></div>
            <div class="yuemu-stat-info">
              <span class="yuemu-stat-label">{{ t('pages.admin.bugReportManagePage.solvedCount') }}</span>
              <span class="yuemu-stat-value">{{ stats.solvedReports || 0 }}</span>
            </div>
          </div>
          <div class="yuemu-stat-card">
            <div class="yuemu-stat-icon" style="background: rgba(107, 114, 128, 0.1); color: #6b7280;"><StopOutlined /></div>
            <div class="yuemu-stat-info">
              <span class="yuemu-stat-label">{{ t('pages.admin.bugReportManagePage.ignoredCount') }}</span>
              <span class="yuemu-stat-value">{{ stats.ignoredReports || 0 }}</span>
            </div>
          </div>
        </div>

        <div class="yuemu-header-panel">
          <div class="yuemu-header-main-row">
            <div class="yuemu-page-info">
              <h1 class="yuemu-page-title">{{ t('pages.admin.bugReportManagePage.mainTitle') }}</h1>
              <p class="yuemu-text-secondary" style="margin: 4px 0 0 0; font-size: 13px;">{{ t('pages.admin.bugReportManagePage.mainDesc') }}</p>
            </div>
            <div class="yuemu-action-group">
              <a-button class="yuemu-btn-ghost" @click="refreshList">
                <SyncOutlined :spin="loading" /> {{ t('pages.admin.bugReportManagePage.refreshData') }}
              </a-button>
            </div>
          </div>

          <div class="yuemu-search-form">
            <a-input
              v-model:value="searchParams.title"
              :placeholder="t('pages.admin.bugReportManagePage.searchPlaceholder')"
              allowClear
              @change="handleSearch"
              class="yuemu-input"
              style="width: 240px"
            >
              <template #prefix><SearchOutlined class="yuemu-text-secondary" /></template>
            </a-input>
            <a-select
              v-model:value="searchParams.status"
              :placeholder="t('pages.admin.bugReportManagePage.statusPlaceholder')"
              class="yuemu-select"
              :dropdownClassName="'yuemu-select-dropdown'"
              allowClear
              @change="handleSearch"
              style="width: 140px"
            >
              <a-select-option :value="0">{{ t('pages.admin.bugReportManagePage.pendingCount') }}</a-select-option>
              <a-select-option :value="1">{{ t('pages.admin.bugReportManagePage.solvedCount') }}</a-select-option>
              <a-select-option :value="2">{{ t('pages.admin.bugReportManagePage.ignoredCount') }}</a-select-option>
            </a-select>
          </div>
        </div>

        <div class="yuemu-table-wrapper">
          <a-spin tip="Loading..." :spinning="loading">
            <a-table
              rowKey="id"
              :columns="columns"
              :data-source="reportList"
              :pagination="false"
              @change="handleTableChange"
              class="yuemu-table"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.dataIndex === 'title'">
                  <a-tooltip :title="record.description" placement="topLeft">
                    <div class="yuemu-title-cell">
                      <span class="yuemu-report-title">{{ record.title }}</span>
                      <span class="yuemu-report-desc-mini yuemu-text-secondary">{{ truncateText(record.description, 20) }}</span>
                    </div>
                  </a-tooltip>
                </template>
                <template v-else-if="column.dataIndex === 'priority'">
                  <span class="yuemu-tag yuemu-mini" :class="getPriorityColor(record.priority)">
                    {{ getPriorityText(record.priority) }}
                  </span>
                </template>
                <template v-else-if="column.dataIndex === 'status'">
                  <span class="yuemu-tag yuemu-mini" :class="getStatusColor(record.status)">
                    {{ getStatusText(record.status) }}
                  </span>
                </template>
                <template v-else-if="column.dataIndex === 'createTime'">
                  <span class="yuemu-text-secondary">
                    {{ dayjs(record.createTime).format('YYYY-MM-DD HH:mm') }}
                  </span>
                </template>
                <template v-else-if="column.key === 'action'">
                  <div class="yuemu-action-buttons">
                    <a-button type="text" class="yuemu-btn-text-blue" @click="viewDetail(record)">{{ t('pages.admin.bugReportManagePage.detail') }}</a-button>
                    <a-button
                      v-if="record.status !== 1"
                      type="text"
                      class="yuemu-btn-text-green"
                      @click="showConfirmDialog('solve', record)"
                    >{{ t('pages.admin.bugReportManagePage.solve') }}</a-button>
                    <a-button
                      v-if="record.status !== 2"
                      type="text"
                      class="yuemu-btn-text-orange"
                      @click="showConfirmDialog('ignore', record)"
                    >{{ t('pages.admin.bugReportManagePage.ignore') }}</a-button>
                    <a-button type="text" class="yuemu-btn-text-red" @click="showConfirmDialog('delete', record)">{{ t('pages.admin.bugReportManagePage.delete') }}</a-button>
                  </div>
                </template>
              </template>
            </a-table>
          </a-spin>
        </div>

        <div class="yuemu-pagination">
          <a-pagination
            v-model:current="pagination.current"
            :page-size-options="['10', '20', '50']"
            :total="pagination.total"
            :show-total="(total) => t('pages.admin.bugReportManagePage.totalReports', { total })"
            show-size-changer
            :page-size="pagination.pageSize"
            @change="onPageChange"
          />
        </div>
      </div>
    </template>

    <template v-else>
      <div class="yuemu-mobile-container">
        <div class="yuemu-sticky-header">
          <div class="yuemu-header-top">
            <h1 class="yuemu-page-title">{{ t('pages.admin.bugReportManagePage.title') }}</h1>
            <van-button icon="replay" size="small" round class="yuemu-btn-icon-ghost" @click="refreshList" />
          </div>

          <div class="yuemu-search-bar-wrapper">
            <van-search
              v-model="searchParams.title"
              :placeholder="t('pages.admin.bugReportManagePage.searchPlaceholder')"
              class="yuemu-search"
              shape="round"
              @search="handleSearch"
              clearable
            />
          </div>

          <div class="yuemu-filter-dropdown-row">
            <van-dropdown-menu class="yuemu-van-dropdown">
              <van-dropdown-item
                v-model="searchParams.status"
                :options="[{ get text() { return t('pages.admin.bugReportManagePage.allStatus') }, value: undefined }, ...statusOptions.map(o => ({text: o.text, value: parseInt(o.value)}))]"
                @change="handleSearch"
              />
            </van-dropdown-menu>
          </div>
        </div>

        <div class="yuemu-mobile-stats-scroll">
          <div class="yuemu-m-stat-box yuemu-blue">
            <div class="yuemu-val">{{ stats.totalReports || 0 }}</div>
            <div class="yuemu-lbl">{{ t('pages.admin.bugReportManagePage.totalCount') }}</div>
          </div>
          <div class="yuemu-m-stat-box yuemu-orange">
            <div class="yuemu-val">{{ stats.pendingReports || 0 }}</div>
            <div class="yuemu-lbl">{{ t('pages.admin.bugReportManagePage.pendingCount') }}</div>
          </div>
          <div class="yuemu-m-stat-box yuemu-green">
            <div class="yuemu-val">{{ stats.solvedReports || 0 }}</div>
            <div class="yuemu-lbl">{{ t('pages.admin.bugReportManagePage.solvedCount') }}</div>
          </div>
          <div class="yuemu-m-stat-box yuemu-gray">
            <div class="yuemu-val">{{ stats.ignoredReports || 0 }}</div>
            <div class="yuemu-lbl">{{ t('pages.admin.bugReportManagePage.ignoredCount') }}</div>
          </div>
        </div>

        <div class="yuemu-mobile-content-scroll">
          <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
            <van-list
              v-model:loading="loading"
              :finished="finished"
              :finished-text="t('pages.admin.bugReportManagePage.noMoreReports')"
              @load="loadMore"
            >
              <div class="yuemu-card-list">
                <div v-for="item in reportList" :key="item.id" class="yuemu-report-card" @click="viewDetail(item)">
                  <div class="yuemu-card-header">
                    <div class="yuemu-title-wrap">
                      <span class="yuemu-title-text">{{ item.title }}</span>
                      <span class="yuemu-tag yuemu-mini" :class="getPriorityColor(item.priority)">{{ getPriorityText(item.priority) }}</span>
                    </div>
                    <span class="yuemu-tag yuemu-mini" :class="getStatusColor(item.status)">{{ getStatusText(item.status) }}</span>
                  </div>

                  <div class="yuemu-card-body">
                    <p class="yuemu-desc-text yuemu-text-secondary">{{ item.description }}</p>
                    <div class="yuemu-meta-row yuemu-text-secondary">
                      <span>{{ dayjs(item.createTime).format('YYYY-MM-DD HH:mm') }}</span>
                      <span>ID: {{ item.id }}</span>
                    </div>
                  </div>

                  <div class="yuemu-card-actions" @click.stop>
                    <button class="yuemu-action-btn yuemu-view" @click="viewDetail(item)">{{ t('pages.admin.bugReportManagePage.detail') }}</button>
                    <button v-if="item.status !== 1" class="yuemu-action-btn yuemu-success" @click="showConfirmDialog('solve', item)">{{ t('pages.admin.bugReportManagePage.solve') }}</button>
                    <button v-if="item.status !== 2" class="yuemu-action-btn yuemu-warn" @click="showConfirmDialog('ignore', item)">{{ t('pages.admin.bugReportManagePage.ignore') }}</button>
                    <button class="yuemu-action-btn yuemu-danger" @click="showConfirmDialog('delete', item)">{{ t('pages.admin.bugReportManagePage.delete') }}</button>
                  </div>
                </div>
              </div>
            </van-list>
          </van-pull-refresh>
        </div>
      </div>
    </template>

    <template v-if="device === DEVICE_TYPE_ENUM.PC">
      <a-modal
        v-model:open="detailVisible"
        :title="t('pages.admin.bugReportManagePage.detailTitle')"
        :footer="null"
        width="700px"
        class="yuemu-modal"
        destroyOnClose
      >
        <div class="yuemu-report-detail-pc" v-if="currentReport">
          <div class="yuemu-detail-header">
            <h2 class="yuemu-detail-title">{{ currentReport.title }}</h2>
            <div class="yuemu-detail-tags">
              <span class="yuemu-tag" :class="getStatusColor(currentReport.status)">{{ getStatusText(currentReport.status) }}</span>
              <span class="yuemu-tag" :class="getPriorityColor(currentReport.priority)">{{ getPriorityText(currentReport.priority) }} {{ t('pages.admin.bugReportManagePage.priority') }}</span>
            </div>
          </div>

          <div class="yuemu-detail-meta yuemu-text-secondary">
            <span>{{ t('pages.admin.bugReportManagePage.submittedAt') }}{{ dayjs(currentReport.createTime).format('YYYY-MM-DD HH:mm:ss') }}</span>
            <span v-if="currentReport.solveTime">{{ t('pages.admin.bugReportManagePage.solvedAt') }}{{ dayjs(currentReport.solveTime).format('YYYY-MM-DD HH:mm:ss') }}</span>
          </div>

          <div class="yuemu-detail-section">
            <h3>{{ t('pages.admin.bugReportManagePage.problemDesc') }}</h3>
            <p class="yuemu-content-block">{{ currentReport.description || t('pages.admin.bugReportManagePage.none') }}</p>
          </div>

          <div class="yuemu-detail-section">
            <h3>{{ t('pages.admin.bugReportManagePage.reproduceSteps') }}</h3>
            <pre class="yuemu-content-block yuemu-code-block">{{ currentReport.reproduceSteps || t('pages.admin.bugReportManagePage.none') }}</pre>
          </div>

          <div class="yuemu-detail-grid">
            <div class="yuemu-grid-item">
              <h3>{{ t('pages.admin.bugReportManagePage.expectedResult') }}</h3>
              <p class="yuemu-content-block">{{ currentReport.expectedResult || t('pages.admin.bugReportManagePage.none') }}</p>
            </div>
            <div class="yuemu-grid-item">
              <h3>{{ t('pages.admin.bugReportManagePage.actualResult') }}</h3>
              <p class="yuemu-content-block">{{ currentReport.actualResult || t('pages.admin.bugReportManagePage.none') }}</p>
            </div>
            <div class="yuemu-grid-item">
              <h3>{{ t('pages.admin.bugReportManagePage.deviceInfo') }}</h3>
              <p class="yuemu-content-block">{{ currentReport.deviceInfo || t('pages.admin.bugReportManagePage.unknown') }}</p>
            </div>
            <div class="yuemu-grid-item">
              <h3>{{ t('pages.admin.bugReportManagePage.browserInfo') }}</h3>
              <p class="yuemu-content-block">{{ currentReport.browserInfo || t('pages.admin.bugReportManagePage.unknown') }}</p>
            </div>
          </div>
        </div>
      </a-modal>
    </template>

    <template v-else>
      <van-popup
        v-model:show="detailVisible"
        position="bottom"
        :style="{ height: '85%' }"
        safe-area-inset-bottom
        class="yuemu-van-popup"
        round
        closeable
      >
        <div class="yuemu-popup-header">{{ t('pages.admin.bugReportManagePage.reportDetail') }}</div>
        <div class="yuemu-popup-content" v-if="currentReport">
          <div class="yuemu-detail-header-m">
            <h2>{{ currentReport.title }}</h2>
            <div class="yuemu-tags-m">
              <span class="yuemu-tag yuemu-mini" :class="getStatusColor(currentReport.status)">{{ getStatusText(currentReport.status) }}</span>
              <span class="yuemu-tag yuemu-mini" :class="getPriorityColor(currentReport.priority)">{{ getPriorityText(currentReport.priority) }}</span>
            </div>
          </div>

          <div class="yuemu-detail-group-m">
            <div class="yuemu-group-title">{{ t('pages.admin.bugReportManagePage.basicInfo') }}</div>
            <div class="yuemu-info-row"><span>{{ t('pages.admin.bugReportManagePage.submitTime') }}</span><span>{{ dayjs(currentReport.createTime).format('YYYY-MM-DD HH:mm') }}</span></div>
            <div class="yuemu-info-row" v-if="currentReport.solveTime"><span>{{ t('pages.admin.bugReportManagePage.solveTime') }}</span><span>{{ dayjs(currentReport.solveTime).format('YYYY-MM-DD HH:mm') }}</span></div>
          </div>

          <div class="yuemu-detail-group-m">
            <div class="yuemu-group-title">{{ t('pages.admin.bugReportManagePage.problemDesc') }}</div>
            <div class="yuemu-text-content">{{ currentReport.description || t('pages.admin.bugReportManagePage.none') }}</div>
          </div>

          <div class="yuemu-detail-group-m">
            <div class="yuemu-group-title">{{ t('pages.admin.bugReportManagePage.reproduceSteps') }}</div>
            <pre class="yuemu-text-content yuemu-code-style">{{ currentReport.reproduceSteps || t('pages.admin.bugReportManagePage.none') }}</pre>
          </div>

          <div class="yuemu-detail-group-m">
            <div class="yuemu-group-title">{{ t('pages.admin.bugReportManagePage.expectedAndActual') }}</div>
            <div class="yuemu-text-content"><strong>{{ t('pages.admin.bugReportManagePage.expectedPrefix') }}</strong>{{ currentReport.expectedResult || t('pages.admin.bugReportManagePage.none') }}</div>
            <div class="yuemu-text-content" style="margin-top: 8px;"><strong>{{ t('pages.admin.bugReportManagePage.actualPrefix') }}</strong>{{ currentReport.actualResult || t('pages.admin.bugReportManagePage.none') }}</div>
          </div>

          <div class="yuemu-detail-group-m">
            <div class="yuemu-group-title">{{ t('pages.admin.bugReportManagePage.environmentInfo') }}</div>
            <div class="yuemu-info-row"><span>{{ t('pages.admin.bugReportManagePage.device') }}</span><span>{{ currentReport.deviceInfo || t('pages.admin.bugReportManagePage.unknown') }}</span></div>
            <div class="yuemu-info-row"><span>{{ t('pages.admin.bugReportManagePage.browser') }}</span><span>{{ currentReport.browserInfo || t('pages.admin.bugReportManagePage.unknown') }}</span></div>
          </div>
        </div>
      </van-popup>
    </template>

    <a-modal
      v-if="device === DEVICE_TYPE_ENUM.PC"
      v-model:open="confirmDialog"
      :title="null"
      :footer="null"
      :width="360"
      class="yuemu-confirm-modal"
      centered
    >
      <div class="yuemu-confirm-content">
        <div class="yuemu-icon-wrap" :class="currentOperateType">
          <CheckCircleFilled v-if="currentOperateType === 'solve'" />
          <MinusCircleFilled v-else-if="currentOperateType === 'ignore'" />
          <ExclamationCircleFilled v-else />
        </div>
        <h3 class="yuemu-confirm-title">{{ dialogTitle }}</h3>
        <p class="yuemu-confirm-desc">{{ dialogMessage }}</p>
        <div class="yuemu-confirm-actions">
          <button class="yuemu-cancel-btn" @click="confirmDialog = false">{{ t('pages.admin.bugReportManagePage.cancel') }}</button>
          <button class="yuemu-danger-btn" :class="currentOperateType" @click="handleConfirm">{{ t('pages.admin.bugReportManagePage.confirm') }}</button>
        </div>
      </div>
    </a-modal>

    <van-dialog
      v-else
      v-model:show="confirmDialog"
      :title="dialogTitle"
      :message="dialogMessage"
      show-cancel-button
      @confirm="handleConfirm"
      class="yuemu-van-dialog"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

import { ref, onMounted, reactive } from 'vue'
import { message } from 'ant-design-vue'
import { getDeviceType } from '@/utils/device'
import { DEVICE_TYPE_ENUM } from '@/constants/device'
import dayjs from 'dayjs'
import {
  SearchOutlined, SyncOutlined, BugOutlined, ClockCircleOutlined,
  CheckCircleOutlined, StopOutlined, ExclamationCircleFilled,
  CheckCircleFilled, MinusCircleFilled
} from '@ant-design/icons-vue'
import {
  listBugReportByPageUsingPost, solveBugReportUsingPost,
  deleteBugReportUsingPost, getBugReportByIdUsingGet,
  ignoreBugReportUsingPost
} from '@/api/bugReportController'

const device = ref<string>('')
const loading = ref(false)
const refreshing = ref(false)
const finished = ref(false)
const reportList = ref<API.BugReportVO[]>([])
const searchParams = reactive({ title: undefined as string | undefined, status: undefined as number | undefined })
const pagination = reactive({ current: 1, pageSize: 10, total: 0 })
const stats = ref({ totalReports: 0, pendingReports: 0, solvedReports: 0, ignoredReports: 0 })
const detailVisible = ref(false)
const currentReport = ref<API.BugReportVO | null>(null)
const confirmDialog = ref(false)
const dialogTitle = ref('')
const dialogMessage = ref('')
const currentOperateRecord = ref<API.BugReportVO | null>(null)
const currentOperateType = ref('')

const statusOptions = [{ get text() { return t('pages.admin.bugReportManagePage.pendingCount') }, value: '0' }, { get text() { return t('pages.admin.bugReportManagePage.solvedCount') }, value: '1' }, { get text() { return t('pages.admin.bugReportManagePage.ignoredCount') }, value: '2' }]
const columns = [
  { get title() { return t('pages.admin.bugReportManagePage.colTitle') }, dataIndex: 'title', width: 280 },
  { get title() { return t('pages.admin.bugReportManagePage.colPriority') }, dataIndex: 'priority', width: 100 },
  { get title() { return t('pages.admin.bugReportManagePage.colStatus') }, dataIndex: 'status', width: 100 },
  { get title() { return t('pages.admin.bugReportManagePage.colCreateTime') }, dataIndex: 'createTime', width: 160 },
  { get title() { return t('pages.admin.bugReportManagePage.colAction') }, key: 'action', width: 200, align: 'right' },
]

onMounted(async () => {
  device.value = await getDeviceType()
  fetchReportList()
})

const fetchReportList = async (isLoadMore = false) => {
  if (!isLoadMore) loading.value = true
  try {
    const response = await listBugReportByPageUsingPost({
      current: pagination.current,
      pageSize: pagination.pageSize,
      sortField: 'createTime',
      sortOrder: 'desc',
      title: searchParams.title || undefined,
      status: searchParams.status
    })

    if (response.code === 0 && response.data) {
      const newData = response.data.records || []
      reportList.value = isLoadMore ? [...reportList.value, ...newData] : newData
      pagination.total = response.data.total || 0
      finished.value = reportList.value.length >= pagination.total
      stats.value.totalReports = pagination.total
      stats.value.pendingReports = reportList.value.filter(r => r.status === 0).length
      stats.value.solvedReports = reportList.value.filter(r => r.status === 1).length
      stats.value.ignoredReports = reportList.value.filter(r => r.status === 2).length
    }
  } catch (error) {
    message.error(t('pages.admin.bugReportManagePage.fetchListError'))
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

const refreshList = () => { pagination.current = 1; finished.value = false; fetchReportList() }
const onRefresh = () => { pagination.current = 1; finished.value = false; fetchReportList() }
const loadMore = () => {
  if (reportList.value.length >= pagination.total) { finished.value = true; return }
  pagination.current++; fetchReportList(true)
}

const handleSearch = () => { pagination.current = 1; finished.value = false; fetchReportList() }
const onPageChange = (page: number, pageSize: number) => { pagination.current = page; pagination.pageSize = pageSize; fetchReportList() }
const handleTableChange = (pag: any) => { pagination.current = pag.current; pagination.pageSize = pag.pageSize; fetchReportList() }

const truncateText = (text: string, len: number) => text && text.length > len ? text.slice(0, len) + '...' : text
const getStatusText = (status: number) => status === 0 ? t('pages.admin.bugReportManagePage.pendingCount') : status === 1 ? t('pages.admin.bugReportManagePage.solvedCount') : t('pages.admin.bugReportManagePage.ignoredCount')
const getStatusColor = (status: number) => status === 0 ? 'yuemu-orange' : status === 1 ? 'yuemu-green' : 'yuemu-gray'
const getPriorityText = (p: number) => p === 0 ? t('pages.admin.bugReportManagePage.priorityLow') : p === 1 ? t('pages.admin.bugReportManagePage.priorityMedium') : p === 2 ? t('pages.admin.bugReportManagePage.priorityHigh') : t('pages.admin.bugReportManagePage.priorityUrgent')
const getPriorityColor = (p: number) => p === 0 ? 'yuemu-gray' : p === 1 ? 'yuemu-blue' : p === 2 ? 'yuemu-orange' : 'yuemu-red'

const viewDetail = async (record: API.BugReportVO) => {
  try {
    const response = await getBugReportByIdUsingGet({ id: record.id })
    if (response.code === 0 && response.data) { currentReport.value = response.data; detailVisible.value = true }
  } catch (error) { message.error(t('pages.admin.bugReportManagePage.fetchDetailError')) }
}

const showConfirmDialog = (type: string, record: API.BugReportVO) => {
  currentOperateRecord.value = record; currentOperateType.value = type
  if (type === 'solve') { dialogTitle.value = t('pages.admin.bugReportManagePage.confirmSolve'); dialogMessage.value = t('pages.admin.bugReportManagePage.confirmSolveMsg', { title: truncateText(record.title, 15) }) }
  else if (type === 'ignore') { dialogTitle.value = t('pages.admin.bugReportManagePage.confirmIgnore'); dialogMessage.value = t('pages.admin.bugReportManagePage.confirmIgnoreMsg', { title: truncateText(record.title, 15) }) }
  else { dialogTitle.value = t('pages.admin.bugReportManagePage.confirmDelete'); dialogMessage.value = t('pages.admin.bugReportManagePage.confirmDeleteMsg', { title: truncateText(record.title, 15) }) }
  confirmDialog.value = true
}

const handleConfirm = async () => {
  if (!currentOperateRecord.value) return
  try {
    let res; const record = currentOperateRecord.value
    if (currentOperateType.value === 'solve') res = await solveBugReportUsingPost({ id: record.id })
    else if (currentOperateType.value === 'ignore') res = await ignoreBugReportUsingPost({ id: record.id })
    else res = await deleteBugReportUsingPost({ id: record.id })
    if (res?.code === 0) { message.success(t('pages.admin.bugReportManagePage.operationSuccess')); fetchReportList() }
  } catch (error) { message.error(t('pages.admin.bugReportManagePage.operationError')) }
  finally { confirmDialog.value = false; currentOperateRecord.value = null; currentOperateType.value = '' }
}
</script>

<style scoped>
#yuemu-bugReportManagePage { height: 100%; background-color: var(--background); color: var(--text-primary); }
.yuemu-text-secondary { color: var(--text-secondary); }

.yuemu-pc-container { padding: 16px; max-width: 1400px; margin: 0 auto; }
.yuemu-stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
.yuemu-stat-card { background-color: var(--card-background); border: 1px solid var(--border-color); border-radius: 16px; padding: 20px; display: flex; align-items: center; gap: 16px; box-shadow: 0 4px 12px var(--shadow-color); transition: transform 0.2s; }
.yuemu-stat-card:hover { transform: translateY(-2px); }
.yuemu-stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
.yuemu-stat-info { display: flex; flex-direction: column; gap: 4px; }
.yuemu-stat-label { font-size: 13px; color: var(--text-secondary); }
.yuemu-stat-value { font-size: 24px; font-weight: 700; color: var(--text-primary); line-height: 1; }

.yuemu-header-panel { background-color: var(--card-background); border: 1px solid var(--border-color); border-radius: 16px; padding: 24px; box-shadow: 0 4px 16px var(--shadow-color); margin-bottom: 24px; }
.yuemu-header-main-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.yuemu-page-title { margin: 0; font-size: 24px; font-weight: 600; }
.yuemu-search-form { display: flex; gap: 12px; flex-wrap: wrap; }

:deep(.yuemu-input), :deep(.ant-input-affix-wrapper), :deep(.yuemu-select .ant-select-selector) {
  background-color: var(--background) !important; color: var(--text-primary) !important; border-color: var(--border-color) !important; border-radius: 8px !important;
}

.yuemu-btn-ghost { border-radius: 8px !important; border: 1px solid var(--border-color) !important; color: var(--text-primary) !important; background-color: transparent !important; }
.yuemu-table-wrapper { background-color: var(--card-background); border: 1px solid var(--border-color); border-radius: 16px; padding: 20px; box-shadow: 0 4px 16px var(--shadow-color); }

.yuemu-title-cell { display: flex; flex-direction: column; gap: 4px; cursor: pointer;}
.yuemu-report-title { font-weight: 500; }
.yuemu-report-desc-mini { font-size: 12px; }

.yuemu-tag { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; border: 1px solid transparent; }
.yuemu-mini { padding: 2px 8px; font-size: 11px; }
.yuemu-blue { background-color: rgba(59, 130, 246, 0.1); color: #3b82f6; }
.yuemu-green { background-color: rgba(16, 185, 129, 0.1); color: #10b981; }
.yuemu-red { background-color: rgba(239, 68, 68, 0.1); color: #ef4444; }
.yuemu-orange { background-color: rgba(245, 158, 11, 0.1); color: #f59e0b; }
.yuemu-gray { background-color: var(--hover-background); color: var(--text-secondary); border-color: var(--border-color); }

.yuemu-action-buttons { display: flex; justify-content: flex-end; gap: 4px; }
.yuemu-btn-text-blue { color: var(--link-color) !important; }
.yuemu-btn-text-green { color: #10b981 !important; }
.yuemu-btn-text-orange { color: #f59e0b !important; }
.yuemu-btn-text-red { color: var(--comment-delete-hover-color) !important; }

.yuemu-pagination { margin-top: 24px; display: flex; justify-content: flex-end; }

.yuemu-report-detail-pc { display: flex; flex-direction: column; gap: 24px; }
.yuemu-detail-header { display: flex; flex-direction: column; gap: 12px; border-bottom: 1px solid var(--border-color); padding-bottom: 16px; }
.yuemu-detail-title { margin: 0; font-size: 20px; font-weight: 600; }
.yuemu-detail-tags { display: flex; gap: 8px; }
.yuemu-detail-meta { display: flex; gap: 24px; font-size: 13px; }
.yuemu-detail-section h3 { font-size: 14px; color: var(--text-secondary); margin: 0 0 8px 0; }
.yuemu-content-block { background: var(--background); padding: 16px; border-radius: 8px; border: 1px solid var(--border-color); font-size: 14px; line-height: 1.6; word-break: break-word;}
.yuemu-code-block { font-family: monospace; white-space: pre-wrap; margin: 0; }
.yuemu-detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

.yuemu-mobile-container { height: 100%; background-color: var(--background); display: flex; flex-direction: column; }
.yuemu-sticky-header { position: sticky; top: 0; z-index: 100; background-color: var(--header-background); border-bottom: 1px solid var(--border-color); padding: 16px 16px 8px; backdrop-filter: blur(15px); }
.yuemu-header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.yuemu-btn-icon-ghost { background-color: transparent !important; color: var(--text-secondary) !important; border: 1px solid var(--border-color) !important; width: 32px; height: 32px; }

:deep(.yuemu-search .van-search__content) { background-color: var(--hover-background); border: 1px solid var(--border-color); }

.yuemu-mobile-stats-scroll { display: flex; gap: 12px; padding: 16px; overflow-x: auto; scrollbar-width: none; }
.yuemu-mobile-stats-scroll::-webkit-scrollbar { display: none; }
.yuemu-m-stat-box { flex: 0 0 auto; width: 80px; padding: 12px; border-radius: 12px; display: flex; flex-direction: column; align-items: center; gap: 4px; background: var(--card-background); border: 1px solid var(--border-color); }
.yuemu-m-stat-box .yuemu-val { font-size: 18px; font-weight: 700; }
.yuemu-m-stat-box .yuemu-lbl { font-size: 11px; color: var(--text-secondary); }

.yuemu-mobile-content-scroll { flex: 1; padding: 0 16px 32px; overflow-y: auto; }
.yuemu-report-card { background-color: var(--card-background); border: 1px solid var(--border-color); border-radius: 16px; padding: 16px; box-shadow: 0 4px 12px var(--shadow-color); margin-bottom: 16px; }
.yuemu-title-wrap { display: flex; flex-direction: column; gap: 6px; flex: 1; padding-right: 12px;}
.yuemu-title-text { font-size: 16px; font-weight: 600; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;}

.yuemu-card-actions { display: flex; gap: 8px; border-top: 1px solid var(--border-color); padding-top: 12px; }
.yuemu-action-btn { flex: 1; padding: 8px 0; border-radius: 8px; border: 1px solid var(--border-color); font-size: 13px; background-color: var(--card-background); color: var(--text-primary); }

.yuemu-popup-header { padding: 16px; text-align: center; font-size: 16px; font-weight: 600; border-bottom: 1px solid var(--border-color); }
.yuemu-popup-content { padding: 16px; overflow-y: auto; flex: 1; }
.yuemu-detail-group-m { margin-bottom: 20px; }
.yuemu-group-title { font-size: 13px; color: var(--text-secondary); margin-bottom: 8px; font-weight: 500;}
.yuemu-info-row { display: flex; justify-content: space-between; font-size: 14px; padding: 8px 0; border-bottom: 1px solid var(--border-color); }
.yuemu-text-content { font-size: 14px; line-height: 1.6; background: var(--background); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color); word-break: break-word;}
.yuemu-code-style { font-family: monospace; white-space: pre-wrap; margin: 0; }

.yuemu-confirm-content { text-align: center; padding-top: 10px; }
.yuemu-confirm-actions { display: flex; border-top: 1px solid var(--border-color); margin: 0 -24px -24px; }
.yuemu-confirm-actions button { flex: 1; height: 50px; border: none; font-size: 16px; font-weight: 500; cursor: pointer; background: transparent; color: var(--text-primary); }
.yuemu-cancel-btn { border-right: 1px solid var(--border-color) !important; border-bottom-left-radius: 16px; }
.yuemu-danger-btn { border-bottom-right-radius: 16px; }
.yuemu-danger-btn.solve { color: #10b981; }
.yuemu-danger-btn.ignore { color: #f59e0b; }
.yuemu-danger-btn.delete { color: var(--comment-delete-hover-color); }

:deep(.yuemu-van-dialog) { background-color: var(--card-background) !important; color: var(--text-primary) !important; border-radius: 16px; }
</style>
