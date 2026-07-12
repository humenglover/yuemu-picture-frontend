<template>
  <div id="yuemu-reportManagePage">
    <template v-if="device === DEVICE_TYPE_ENUM.PC">
      <div class="yuemu-pc-container">
        <div class="yuemu-header-panel">
          <a-form layout="inline" :model="searchParams" class="yuemu-search-form" @finish="doSearch">
            <a-form-item>
              <a-input
                v-model:value="searchParams.userId"
                :placeholder="t('pages.admin.reportManagePage.searchUserId')"
                allow-clear
                class="yuemu-input"
                style="width: 140px"
              >
                <template #prefix><SearchOutlined class="yuemu-text-secondary" /></template>
              </a-input>
            </a-form-item>
            <a-form-item>
              <a-select
                v-model:value="searchParams.reportType"
                :placeholder="t('pages.admin.reportManagePage.reportType')"
                allow-clear
                style="width: 130px"
                class="yuemu-select"
                :dropdownClassName="'yuemu-select-dropdown'"
              >
                <a-select-option :value="1"> {{ t('pages.admin.reportManagePage.typeSpam') }} </a-select-option>
                <a-select-option :value="2"> {{ t('pages.admin.reportManagePage.typeViolation') }} </a-select-option>
                <a-select-option :value="3"> {{ t('pages.admin.reportManagePage.typeHarmful') }} </a-select-option>
                <a-select-option :value="4"> {{ t('pages.admin.reportManagePage.typeAttack') }} </a-select-option>
                <a-select-option :value="5"> {{ t('pages.admin.reportManagePage.typePrivacy') }} </a-select-option>
                <a-select-option :value="6"> {{ t('pages.admin.reportManagePage.typeCopyright') }} </a-select-option>
                <a-select-option :value="7"> {{ t('pages.admin.reportManagePage.typeOther') }} </a-select-option>
              </a-select>
            </a-form-item>
            <a-form-item>
              <a-select
                v-model:value="searchParams.status"
                :placeholder="t('pages.admin.reportManagePage.handleStatus')"
                allow-clear
                style="width: 120px"
                class="yuemu-select"
                :dropdownClassName="'yuemu-select-dropdown'"
              >
                <a-select-option :value="0"> {{ t('pages.admin.reportManagePage.statusPending') }} </a-select-option>
                <a-select-option :value="1"> {{ t('pages.admin.reportManagePage.statusHandled') }} </a-select-option>
                <a-select-option :value="2"> {{ t('pages.admin.reportManagePage.statusReject') }} </a-select-option>
              </a-select>
            </a-form-item>
            <a-form-item>
              <a-button type="primary" html-type="submit" class="yuemu-btn-primary">
                Search
              </a-button>
            </a-form-item>
          </a-form>

          <div class="yuemu-action-group">
            <a-button class="yuemu-btn-ghost" @click="toggleSortOrder">
              <SortAscendingOutlined v-if="sortOrder === 'ascend'" />
              <SortDescendingOutlined v-else />
              {{ sortOrder === 'ascend' ? t('pages.admin.reportManagePage.ascendText') : t('pages.admin.reportManagePage.descendText') }}
            </a-button>
          </div>
        </div>

        <div class="yuemu-table-wrapper">
          <a-spin tip="Loading..." :spinning="loading">
            <a-table
              rowKey="id"
              :columns="columns"
              :data-source="dataList"
              :pagination="false"
              @change="doTableChange"
              class="yuemu-table"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.dataIndex === 'userAvatar'">
                  <div class="yuemu-avatar-container" style="width: 36px; height: 36px;">
                    <img :src="record.userAvatar || 'https://gw.alipayobjects.com/zos/antfincdn/XAoskV01e/default_avatar.png'" class="yuemu-avatar-img" />
                  </div>
                  <div class="yuemu-text-secondary" style="font-size: 12px; margin-top: 4px;">{{ record.userName || t('pages.admin.reportManagePage.anonymous') }}</div>
                </template>
                <template v-else-if="column.dataIndex === 'reportTypeText'">
                  <span class="yuemu-tag" :class="getReportTypeClass(record.reportType)">
                    {{ record.reportTypeText }}
                  </span>
                </template>
                <template v-else-if="column.dataIndex === 'targetTypeText'">
                  <span class="yuemu-tag yuemu-blue">{{ record.targetTypeText }}</span>
                </template>
                <template v-else-if="column.dataIndex === 'statusText'">
                  <span class="yuemu-tag" :class="getStatusClass(record.status)">
                    {{ record.statusText }}
                  </span>
                </template>
                <template v-else-if="column.dataIndex === 'screenshotUrls'">
                  <div v-if="record.screenshotUrls && record.screenshotUrls.length > 0" class="yuemu-screenshot-preview-pc">
                    <a-popover v-for="(url, index) in record.screenshotUrls" :key="index" placement="top">
                      <template #content><img :src="url" style="max-width: 200px; border-radius: 8px;" /></template>
                      <img :src="url" class="yuemu-thumb-img" />
                    </a-popover>
                  </div>
                  <span v-else class="yuemu-text-secondary">--</span>
                </template>
                <template v-else-if="column.dataIndex === 'createTime'">
                  <div class="yuemu-text-secondary">{{ dayjs(record.createTime).format('YYYY-MM-DD HH:mm') }}</div>
                </template>
                <template v-else-if="column.dataIndex === 'handleTime'">
                  <div class="yuemu-text-secondary">{{ record.handleTime ? dayjs(record.handleTime).format('YYYY-MM-DD HH:mm') : '--' }}</div>
                </template>
                <template v-else-if="column.key === 'action'">
                  <div class="yuemu-action-buttons">
                    <a-button v-if="record.status === 0" type="text" class="yuemu-btn-text-green" @click="openProcessModal(record)">
                      {{ t('pages.admin.reportManagePage.handleReport') }}
                    </a-button>
                    <a-button v-else type="text" class="yuemu-btn-text-gray" disabled> {{ t('pages.admin.reportManagePage.statusHandled') }} </a-button>
                  </div>
                </template>
              </template>
            </a-table>
          </a-spin>
        </div>

        <div class="yuemu-pagination">
          <a-pagination
            v-model:current="searchParams.current"
            :page-size-options="pcPageSizeOptions"
            :total="total"
            :show-total="(total) => `Total ${total} report records`"
            show-size-changer
            :page-size="searchParams.pageSize"
            @change="onPageChange"
            @showSizeChange="onShowSizeChange"
          />
        </div>
      </div>

      <a-modal
        v-model:open="processModalOpen"
        :title="t('pages.admin.reportManagePage.handleReport')"
        @cancel="processModalOpen = false"
        class="yuemu-modal"
        :footer="null"
      >
        <a-form :model="processForm" layout="vertical" class="yuemu-form">
          <a-form-item :label="t('pages.admin.reportManagePage.handleStatus')">
            <a-select v-model:value="processForm.status" class="yuemu-select" :dropdownClassName="'yuemu-select-dropdown'">
              <a-select-option :value="1"> {{ t('pages.admin.reportManagePage.statusHandled') }} </a-select-option>
              <a-select-option :value="2"> {{ t('pages.admin.reportManagePage.statusReject') }} </a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item :label="t('pages.admin.reportManagePage.handleResult')">
            <a-textarea v-model:value="processForm.handleResult" :placeholder="t('pages.admin.reportManagePage.handleResultPlaceholder')" :rows="4" class="yuemu-input" />
          </a-form-item>
          <div class="yuemu-modal-footer">
            <a-button class="yuemu-btn-ghost" @click="processModalOpen = false"> {{ t('pages.admin.reportManagePage.cancel') }} </a-button>
            <a-button type="primary" class="yuemu-btn-primary" @click="handleProcessReport"> {{ t('pages.admin.reportManagePage.confirmHandle') }} </a-button>
          </div>
        </a-form>
      </a-modal>
    </template>

    <template v-else>
      <div class="yuemu-mobile-container">
        <div class="yuemu-sticky-header">
          <div class="yuemu-header-top">
            <h1 class="yuemu-page-title"> {{ t('pages.admin.reportManagePage.title') }} </h1>
          </div>
          <div class="yuemu-search-bar-wrapper">
            <van-search
              v-model="searchParams.userId"
              :placeholder="t('pages.admin.reportManagePage.searchUserId')"
              class="yuemu-search"
              shape="round"
              @search="doSearch"
            />
          </div>
          <div class="yuemu-dropdown-wrapper">
            <van-dropdown-menu class="yuemu-van-dropdown" :active-color="'var(--link-color)'">
              <van-dropdown-item
                v-model="mobileFilter.reportType"
                :options="mobileReportTypeOptions"
                @change="onMobileFilterChange"
                teleport="body"
              />
              <van-dropdown-item
                v-model="mobileFilter.status"
                :options="mobileStatusOptions"
                @change="onMobileFilterChange"
                teleport="body"
              />
            </van-dropdown-menu>
          </div>
        </div>

        <div class="yuemu-mobile-content-scroll">
          <div class="yuemu-card-list">
            <div v-for="report in dataList" :key="report.id" class="yuemu-data-card">
              <div class="yuemu-card-header">
                <div class="yuemu-avatar-wrap">
                  <img :src="report.userAvatar || 'https://gw.alipayobjects.com/zos/antfincdn/XAoskV01e/default_avatar.png'" alt="avatar"/>
                </div>
                <div class="yuemu-main-info">
                  <div class="yuemu-name-row">
                    <span class="yuemu-name">{{ report.userName || t('pages.admin.reportManagePage.anonymousUser') }}</span>
                    <span class="yuemu-badge" :class="getStatusClass(report.status)">
                      {{ report.statusText }}
                    </span>
                  </div>
                  <div class="yuemu-desc-row yuemu-text-secondary">
                    Reported {{ report.targetTypeText }} (ID: {{ report.targetId }})
                  </div>
                </div>
              </div>

              <div class="yuemu-card-body">
                <div class="yuemu-report-reason-box">
                  <span class="yuemu-tag" :class="getReportTypeClass(report.reportType)" style="margin-right: 8px;">
                    {{ report.reportTypeText }}
                  </span>
                  {{ report.reason || t('pages.admin.reportManagePage.noSpecificReason') }}
                </div>

                <div v-if="report.screenshotUrls && report.screenshotUrls.length > 0" class="yuemu-screenshot-gallery">
                  <div
                    v-for="(url, index) in report.screenshotUrls.slice(0, 3)"
                    :key="index"
                    class="yuemu-gallery-item"
                    @click.stop="previewImage(url)"
                  >
                    <img :src="url" />
                    <div v-if="index === 2 && report.screenshotUrls.length > 3" class="yuemu-more-overlay">
                      +{{ report.screenshotUrls.length - 3 }}
                    </div>
                  </div>
                </div>

                <div v-if="report.status !== 0" class="yuemu-handler-info yuemu-text-secondary">
                  <div v-if="report.handlerName">{{ t('pages.admin.reportManagePage.handlerLabel') }} {{ report.handlerName }}</div>
                  <div v-if="report.handleResult" class="yuemu-handle-result">Result: {{ report.handleResult }}</div>
                </div>

                <div class="yuemu-meta-info yuemu-text-secondary" style="margin-top: 12px; display: flex; justify-content: space-between;">
                  <span>{{ t('pages.admin.reportManagePage.publishLabel') }}: {{ dayjs(report.createTime).format('MM-DD HH:mm') }}</span>
                  <span v-if="report.handleTime">{{ t('pages.admin.reportManagePage.colHandleTimeText') }}: {{ dayjs(report.handleTime).format('MM-DD HH:mm') }}</span>
                </div>
              </div>

              <div class="yuemu-card-actions">
                <button
                  v-if="report.status === 0"
                  class="yuemu-action-btn yuemu-success"
                  @click="openMobileProcessModal(report)"
                > {{ t('pages.admin.reportManagePage.handleReport') }} </button>
                <button
                  v-else
                  class="yuemu-action-btn yuemu-view yuemu-disabled"
                  disabled
                >
                  {{ t('pages.admin.reportManagePage.handleCompletedText') }}
                </button>
              </div>
            </div>
          </div>

          <van-empty v-if="dataList.length === 0 && !loading" :description="t('pages.admin.reportManagePage.emptyRecord')" />

          <div class="yuemu-pagination-container" v-if="total > 0">
            <div class="yuemu-page-info yuemu-text-secondary">
              <span>Total {{ total }} items</span>
              <span class="yuemu-page-size-trigger" @click="showPageSizeSheet = true">
                {{ searchParams.pageSize }} items/page
                <van-icon name="arrow-down" />
              </span>
            </div>
            <van-pagination :prev-text="t('pages.admin.reportManagePage.prevPage')" :next-text="t('pages.admin.reportManagePage.nextPage')"
              v-model="searchParams.current"
              :total-items="total"
              :items-per-page="searchParams.pageSize"
              @change="onMobilePageChange"
              :show-page-size="3"
              force-ellipses
              class="yuemu-van-pagination"
            />
          </div>
        </div>

        <van-action-sheet
          v-model:show="showPageSizeSheet"
          :actions="mobilePageSizeOptions"
          :cancel-text="t('pages.admin.reportManagePage.cancel')"
          close-on-click-action
          @select="handlePageSizeChange"
          class="yuemu-action-sheet"
          teleport="body"
        />

        <van-action-sheet v-model:show="mobileProcessModalOpen" :title="t('pages.admin.reportManagePage.handleReport')" class="yuemu-action-sheet" teleport="body">
          <div class="yuemu-mobile-process-form">
            <div class="yuemu-form-item">
              <label> {{ t('pages.admin.reportManagePage.handleStatus') }} </label>
              <div class="yuemu-segment-control">
                <div class="yuemu-segment-item" :class="{ active: mobileProcessForm.status === 1 }" @click="mobileProcessForm.status = 1"> {{ t('pages.admin.reportManagePage.statusHandled') }} </div>
                <div class="yuemu-segment-item" :class="{ active: mobileProcessForm.status === 2 }" @click="mobileProcessForm.status = 2"> {{ t('pages.admin.reportManagePage.statusReject') }} </div>
              </div>
            </div>
            <div class="yuemu-form-item">
              <label> {{ t('pages.admin.reportManagePage.handleResultDesc') }} </label>
              <textarea v-model="mobileProcessForm.handleResult" :placeholder="t('pages.admin.reportManagePage.inputResult')" rows="3" class="yuemu-textarea"></textarea>
            </div>
            <button class="yuemu-btn-primary yuemu-full-width" style="margin-top: 16px; height: 44px; font-size: 16px;" @click="handleMobileProcessReport">
              提交处理
            </button>
          </div>
        </van-action-sheet>
      </div>
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
        <div class="yuemu-icon-wrap">
          <ExclamationCircleFilled />
        </div>
        <h3 class="yuemu-confirm-title"> {{ t('pages.admin.reportManagePage.confirmActionTitle') }} </h3>
        <p class="yuemu-confirm-desc"> {{ t('pages.admin.reportManagePage.actionWarning') }} </p>
        <div class="yuemu-confirm-actions">
          <button class="yuemu-cancel-btn" @click="confirmDialog = false"> {{ t('pages.admin.reportManagePage.cancel') }} </button>
          <button class="yuemu-danger-btn" @click="handleConfirm"> {{ t('pages.admin.reportManagePage.confirmExecute') }} </button>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import { onMounted, reactive, ref } from 'vue'
import { listReportByPageUsingPost, updateReportUsingPost } from '@/api/reportController.ts'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { getDeviceType } from '@/utils/device.ts'
import { DEVICE_TYPE_ENUM } from '@/constants/device.ts'
import {
  SortAscendingOutlined,
  SortDescendingOutlined,
  SearchOutlined,
  ExclamationCircleFilled
} from '@ant-design/icons-vue'

const device = ref<string>(DEVICE_TYPE_ENUM.PC)
const dataList = ref<any[]>([])
const total = ref(0)
const loading = ref(false)
const showPageSizeSheet = ref(false)
const processModalOpen = ref(false)
const mobileProcessModalOpen = ref(false)
const confirmDialog = ref(false)

const searchParams = reactive<any>({
  current: 1,
  pageSize: 8,
  sortField: 'createTime',
  userId: undefined,
  reportType: undefined,
  status: undefined,
})
const sortOrder = ref<'ascend' | 'descend'>('descend')

const mobileFilter = reactive({
  reportType: '',
  status: '',
})

const processForm = reactive({ id: 0, status: 1, handleResult: '' })
const mobileProcessForm = reactive({ id: 0, status: 1, handleResult: '' })

const columns = [
  { title: 'ID', dataIndex: 'id', width: 80, ellipsis: true },
  { title: t('pages.admin.reportManagePage.colReporter'), dataIndex: 'userAvatar', width: 120 },
  { title: t('pages.admin.reportManagePage.colType'), dataIndex: 'reportTypeText', width: 100 },
  { title: t('pages.admin.reportManagePage.colTarget'), dataIndex: 'targetTypeText', width: 80 },
  { title: t('pages.admin.reportManagePage.colTargetId'), dataIndex: 'targetId', width: 120, ellipsis: true },
  { title: t('pages.admin.reportManagePage.colReason'), dataIndex: 'reason', width: 180, ellipsis: true },
  { title: t('pages.admin.reportManagePage.colScreenshot'), dataIndex: 'screenshotUrls', width: 100 },
  { title: t('pages.admin.reportManagePage.colStatus'), dataIndex: 'statusText', width: 90 },
  { title: t('pages.admin.reportManagePage.colHandleTimeText'), dataIndex: 'handleTime', width: 150 },
  { title: t('pages.admin.reportManagePage.colAction'), key: 'action', width: 100, align: 'right', fixed: 'right' },
]

const pcPageSizeOptions = ['5', '8', '10', '20', '50']
const mobilePageSizeOptions = [
  { name: '10 items/page', value: 10 },
  { name: '20 items/page', value: 20 },
  { name: '30 items/page', value: 30 },
  { name: '50 items/page', value: 50 },
]

const mobileReportTypeOptions = [
  { text: t('pages.admin.reportManagePage.allTypesText'), value: '' },
  { text: t('pages.admin.reportManagePage.spam'), value: 1 },
  { text: t('pages.admin.reportManagePage.violation'), value: 2 },
  { text: t('pages.admin.reportManagePage.harmful'), value: 3 },
  { text: t('pages.admin.reportManagePage.attack'), value: 4 },
  { text: t('pages.admin.reportManagePage.privacy'), value: 5 },
  { text: t('pages.admin.reportManagePage.copyright'), value: 6 },
  { text: t('pages.admin.reportManagePage.other'), value: 7 },
]

const mobileStatusOptions = [
  { text: t('pages.admin.reportManagePage.allStatusText'), value: '' },
  { text: t('pages.admin.reportManagePage.pendingText'), value: 0 },
  { text: t('pages.admin.reportManagePage.handledText'), value: 1 },
  { text: t('pages.admin.reportManagePage.rejected'), value: 2 },
]

const fetchData = async () => {
  loading.value = true
  try {
    const res = await listReportByPageUsingPost({
      ...searchParams,
      sortOrder: sortOrder.value,
    })
    if (res.data?.code === 0) {
      dataList.value = res.data.data.records || []
      total.value = parseInt(res.data.data.total) || 0
    }
  } catch (error) {
    message.error(t('pages.admin.reportManagePage.fetchReportError'))
  } finally {
    loading.value = false
  }
}

const doSearch = () => { searchParams.current = 1; fetchData() }
const onShowSizeChange = (c: number, size: number) => { searchParams.current = 1; searchParams.pageSize = size; fetchData() }
const onPageChange = (page: number, size: number) => { searchParams.current = page; searchParams.pageSize = size; fetchData() }
const doTableChange = (p: any, f: any, s: any) => {
  if (s.field && s.order) { searchParams.sortField = s.field; searchParams.sortOrder = s.order; }
  fetchData()
}

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'ascend' ? 'descend' : 'ascend'
  searchParams.sortOrder = sortOrder.value
  fetchData()
}

const onMobileFilterChange = () => {
  searchParams.reportType = mobileFilter.reportType === '' ? undefined : mobileFilter.reportType;
  searchParams.status = mobileFilter.status === '' ? undefined : mobileFilter.status;
  doSearch();
}
const onMobilePageChange = (page: number) => { searchParams.current = page; fetchData() }
const handlePageSizeChange = (action: { value: number }) => { searchParams.pageSize = action.value; doSearch(); showPageSizeSheet.value = false }

const getReportTypeClass = (type: number) => {
  const map: Record<number, string> = { 1:'yuemu-orange', 2:'yuemu-red', 3:'yuemu-red', 4:'yuemu-purple', 5:'yuemu-blue', 6:'yuemu-gray', 7:'yuemu-gray' }
  return map[type] || 'yuemu-gray'
}
const getStatusClass = (status: number) => {
  if (status === 0) return 'yuemu-orange'
  if (status === 1) return 'yuemu-green'
  if (status === 2) return 'yuemu-red'
  return 'yuemu-gray'
}

const openProcessModal = (report: any) => {
  processForm.id = report.id; processForm.status = 1; processForm.handleResult = '';
  processModalOpen.value = true;
}
const handleProcessReport = async () => {
  try {
    const res = await updateReportUsingPost(processForm)
    if (res.data.code === 0) { message.success(t('pages.admin.reportManagePage.handleSuccessText')); processModalOpen.value = false; fetchData() }
  } catch (error) { message.error(t('pages.admin.reportManagePage.handleExceptionText')) }
}

const openMobileProcessModal = (report: any) => {
  mobileProcessForm.id = report.id; mobileProcessForm.status = 1; mobileProcessForm.handleResult = '';
  mobileProcessModalOpen.value = true;
}
const handleMobileProcessReport = async () => {
  if(!mobileProcessForm.handleResult) { message.warning(t('pages.admin.reportManagePage.fillHandleResultText')); return; }
  try {
    const res = await updateReportUsingPost(mobileProcessForm)
    if (res.data.code === 0) { message.success(t('pages.admin.reportManagePage.handleSuccessText')); mobileProcessModalOpen.value = false; fetchData() }
  } catch (error) { message.error(t('pages.admin.reportManagePage.handleExceptionText')) }
}

const previewImage = (url: string) => {
  window.open(url, '_blank');
}

const handleConfirm = () => { confirmDialog.value = false; }

onMounted(async () => {
  device.value = await getDeviceType()
  fetchData()
})
</script>

<style scoped>
#yuemu-reportManagePage {
  height: 100%;
  box-sizing: border-box;
  background-color: var(--background);
  color: var(--text-primary);
  transition: var(--theme-transition);
}

.yuemu-text-secondary { color: var(--text-secondary); }
.yuemu-ellipsis-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.yuemu-pc-container {
  padding: 16px;
  max-width: 1400px;
  margin: 0 auto;
  box-sizing: border-box;
}

.yuemu-header-panel {
  background-color: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 20px 24px;
  box-shadow: 0 4px 16px var(--shadow-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
  transition: var(--theme-transition);
}

.yuemu-search-form { display: flex; gap: 12px; }

:deep(.yuemu-select .ant-select-selector),
:deep(.yuemu-input), :deep(.yuemu-textarea) {
  background-color: transparent !important;
  color: var(--text-primary) !important;
  border-color: var(--border-color) !important;
  border-radius: 8px !important;
  box-shadow: none !important;
  transition: var(--theme-transition);
}

.yuemu-btn-primary { background-color: var(--link-color) !important; color: var(--text-other) !important; border: none !important; border-radius: 8px !important; font-weight: 500; }
.yuemu-btn-ghost { border-radius: 8px !important; border: 1px solid var(--border-color) !important; color: var(--text-primary) !important; background-color: transparent !important; }

.yuemu-table-wrapper {
  background-color: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 16px var(--shadow-color);
}

:deep(.yuemu-table) {
  .ant-table, .ant-table-container, .ant-table-content { background-color: transparent !important; color: var(--text-primary) !important; }
  .ant-table-thead > tr > th { background-color: transparent !important; border-bottom: 1px solid var(--border-color) !important; color: var(--text-secondary) !important; }
  .ant-table-thead > tr > th::before { display: none !important; }
  .ant-table-tbody > tr > td { background-color: transparent !important; border-bottom: 1px solid var(--border-color) !important; color: var(--text-primary) !important; }
  .ant-table-tbody > tr:hover > td { background-color: var(--hover-background) !important; }
  .ant-table-cell-fix-left, .ant-table-cell-fix-right { background-color: var(--card-background) !important; }
}

.yuemu-avatar-container { border-radius: 50%; overflow: hidden; border: 1px solid var(--border-color); }
.yuemu-avatar-img { width: 100%; height: 100%; object-fit: cover; }
.yuemu-screenshot-preview-pc { display: flex; gap: 4px; }
.yuemu-thumb-img { width: 30px; height: 30px; object-fit: cover; border-radius: 4px; cursor: zoom-in; border: 1px solid var(--border-color); }

.yuemu-tag { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 500; }
.yuemu-blue { background-color: rgba(59, 130, 246, 0.1); color: #3b82f6; }
.yuemu-green { background-color: rgba(16, 185, 129, 0.1); color: #10b981; }
.yuemu-red { background-color: rgba(239, 68, 68, 0.1); color: #ef4444; }
.yuemu-orange { background-color: rgba(245, 158, 11, 0.1); color: #f59e0b; }
.yuemu-purple { background-color: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
.yuemu-gray { background-color: var(--hover-background); color: var(--text-secondary); border: 1px solid var(--border-color); }

.yuemu-action-buttons { display: flex; justify-content: flex-end; gap: 4px; }
.yuemu-btn-text-green { color: #10b981 !important; border-radius: 6px; }

.yuemu-pagination { margin-top: 24px; display: flex; justify-content: flex-end; }
:deep(.ant-pagination-item) { background-color: transparent !important; border-color: var(--border-color) !important; }
:deep(.ant-pagination-item-active) { background-color: var(--hover-background) !important; border-color: var(--link-color) !important; }

.yuemu-mobile-container { height: 100%; background-color: var(--background); display: flex; flex-direction: column; }
.yuemu-sticky-header { position: sticky; top: 0; z-index: 1000; padding: 16px 16px 0; background-color: var(--header-background); border-bottom: 1px solid var(--border-color); backdrop-filter: blur(15px); }
.yuemu-header-top { margin-bottom: 8px; }
.yuemu-page-title { margin: 0; font-size: 24px; font-weight: 700; color: var(--text-primary); }

.yuemu-search-bar-wrapper { margin-bottom: 4px; }
:deep(.yuemu-search) { padding: 0 !important; background-color: transparent !important; }
:deep(.yuemu-search .van-search__content) { background-color: var(--hover-background); border: 1px solid var(--border-color); }

.yuemu-dropdown-wrapper { margin: 0 -16px; position: relative; z-index: 1001; }
:deep(.yuemu-van-dropdown .van-dropdown-menu__bar) { background-color: transparent !important; box-shadow: none !important; }

.yuemu-mobile-content-scroll { flex: 1; padding: 12px 16px 32px; overflow-y: auto; }
.yuemu-card-list { display: flex; flex-direction: column; gap: 16px; }
.yuemu-data-card { background-color: var(--card-background); border: 1px solid var(--border-color); border-radius: 16px; padding: 16px; box-shadow: 0 4px 12px var(--shadow-color); }

.yuemu-card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.yuemu-avatar-wrap { width: 44px; height: 44px; border-radius: 50%; overflow: hidden; border: 1px solid var(--border-color); flex-shrink: 0; }
.yuemu-avatar-wrap img { width: 100%; height: 100%; object-fit: cover; }
.yuemu-name-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.yuemu-name { font-size: 16px; font-weight: 600; color: var(--text-primary); }

.yuemu-report-reason-box { background-color: var(--hover-background); padding: 10px 12px; border-radius: 8px; font-size: 14px; margin-bottom: 12px; border: 1px solid var(--border-color); }
.yuemu-screenshot-gallery { display: flex; gap: 8px; margin-bottom: 12px; }
.yuemu-gallery-item { width: 60px; height: 60px; border-radius: 8px; overflow: hidden; position: relative; border: 1px solid var(--border-color); }
.yuemu-more-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.5); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 600; }
.yuemu-handler-info { font-size: 13px; background: rgba(59, 130, 246, 0.05); padding: 8px 12px; border-radius: 6px; border-left: 3px solid var(--link-color); }

.yuemu-badge { font-size: 11px; padding: 2px 8px; border-radius: 4px; font-weight: 500; }
.yuemu-card-actions { display: flex; gap: 8px; padding-top: 12px; border-top: 1px solid var(--border-color); }
.yuemu-action-btn { flex: 1; padding: 8px 0; border-radius: 8px; border: 1px solid var(--border-color); font-size: 13px; font-weight: 500; background-color: var(--card-background); color: var(--text-primary); }
.yuemu-success { color: #10b981; border-color: rgba(16, 185, 129, 0.3); background-color: rgba(16, 185, 129, 0.05); }

.yuemu-pagination-container { margin-top: 24px; }
.yuemu-page-info { display: flex; justify-content: center; align-items: center; gap: 12px; font-size: 12px; margin-bottom: 12px; }
.yuemu-page-size-trigger { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; background-color: var(--hover-background); border-radius: 12px; cursor: pointer; color: var(--link-color); border: 1px solid var(--border-color); }

:deep(.yuemu-action-sheet) { background-color: var(--card-background); color: var(--text-primary); }
.yuemu-mobile-process-form { padding: 16px; }
.yuemu-form-item { margin-bottom: 20px; }
.yuemu-segment-control { display: flex; background: var(--hover-background); border-radius: 8px; padding: 2px; }
.yuemu-segment-item { flex: 1; text-align: center; padding: 8px 0; font-size: 14px; border-radius: 6px; color: var(--text-primary); }
.yuemu-segment-item.active { background: var(--card-background); font-weight: 600; color: var(--link-color); }
.yuemu-textarea { width: 100%; box-sizing: border-box; border-radius: 8px; padding: 12px; font-size: 14px; border: 1px solid var(--border-color); background: transparent; color: var(--text-primary); resize: none; }

:deep(.yuemu-modal) {
  .ant-modal-content { background-color: var(--card-background); border: 1px solid var(--border-color); border-radius: 16px; padding: 0; }
  .ant-modal-header { background-color: var(--card-background); border-bottom: 1px solid var(--border-color); padding: 20px 24px; }
}

.yuemu-modal-footer { display: flex; gap: 12px; margin-top: 24px; }
.yuemu-modal-footer .ant-btn { flex: 1; height: 40px; border-radius: 10px; font-size: 15px; }

:deep(.yuemu-confirm-modal) {
  .ant-modal-content { background-color: var(--card-background); border: 1px solid var(--border-color); border-radius: 16px; padding: 0; }
  .ant-modal-body { padding: 24px; }
}
.yuemu-confirm-content { text-align: center; padding-top: 10px; }
.yuemu-icon-wrap { font-size: 44px; color: #ef4444; margin-bottom: 12px; }
.yuemu-confirm-title { font-size: 17px; font-weight: 600; margin: 0 0 8px 0; color: var(--text-primary); }
.yuemu-confirm-desc { font-size: 13px; color: var(--text-secondary); margin: 0 0 20px 0; line-height: 1.4; }

.yuemu-confirm-actions { display: flex; border-top: 1px solid var(--border-color); margin: 0 -24px -24px; }
.yuemu-confirm-actions button { flex: 1; background-color: transparent; border: none; height: 50px; font-size: 16px; font-weight: 500; cursor: pointer; color: var(--text-primary); }
.yuemu-cancel-btn { border-right: 1px solid var(--border-color) !important; border-bottom-left-radius: 16px; }
.yuemu-danger-btn { color: #ef4444; font-weight: 600 !important; border-bottom-right-radius: 16px; }
</style>
