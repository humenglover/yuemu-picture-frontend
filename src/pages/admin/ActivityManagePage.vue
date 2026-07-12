<template>
  <div id="yuemu-activityManagePage">
    <template v-if="device === DEVICE_TYPE_ENUM.PC">
      <div class="pc-container">
        <div class="mac-header-panel">
          <div class="header-main-row">
            <div class="page-info">
              <h1 class="page-title">{{ t('pages.admin.activityManagePage.title') }}</h1>
              <p class="text-secondary" style="margin: 4px 0 0 0; font-size: 13px;">{{ t('pages.admin.activityManagePage.desc') }}</p>
            </div>
            <div class="action-group">
              <a-button type="primary" class="ios-btn-primary" @click="handleCreate">
                <PlusOutlined /> {{ t('pages.admin.activityManagePage.createActivity') }}
              </a-button>
            </div>
          </div>

          <div class="mac-search-form">
            <a-input
              v-model:value="searchParams.searchText"
              :placeholder="t('pages.admin.activityManagePage.searchPlaceholder')"
              allowClear
              @change="doSearch"
              class="mac-input"
              style="width: 240px"
            >
              <template #prefix><SearchOutlined class="text-secondary" /></template>
            </a-input>
            <a-select
              v-model:value="searchParams.status"
              :placeholder="t('pages.admin.activityManagePage.statusPlaceholder')"
              class="mac-select"
              :dropdownClassName="'mac-select-dropdown'"
              allowClear
              @change="doSearch"
              style="width: 140px"
            >
              <a-select-option v-for="opt in ACTIVITY_STATUS_OPTIONS" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </a-select-option>
            </a-select>
          </div>
        </div>

        <div class="mac-table-wrapper">
          <a-spin :tip="t('pages.admin.activityManagePage.loading')" :spinning="loading">
            <a-table
              rowKey="id"
              :columns="columns"
              :data-source="dataList"
              :pagination="false"
              @change="doTableChange"
              class="mac-table"
              :scroll="{ x: 1000 }"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.dataIndex === 'title'">
                  <strong>{{ record.title }}</strong>
                </template>
                <template v-if="column.dataIndex === 'userInfo'">
                  <div class="user-info-cell">
                    <img :src="record.user?.userAvatar || defaultAvatar" class="mini-avatar" />
                    <span>{{ record.user?.userName || t('pages.admin.activityManagePage.unknownUser') }}</span>
                  </div>
                </template>
                <template v-if="column.dataIndex === 'stats'">
                  <span class="text-secondary">{{ record.viewCount || 0 }} {{ t('pages.admin.activityManagePage.views') }}</span>
                </template>
                <template v-if="column.dataIndex === 'status'">
                  <span class="pc-tag" :class="getStatusClass(record.status)">
                    {{ ACTIVITY_STATUS_MAP[record.status] }}
                  </span>
                </template>
                <template v-if="column.dataIndex === 'expireTime'">
                  <div class="expire-time-cell">
                    <span class="text-secondary" style="font-size: 13px;">{{ dayjs(record.expireTime).format('YYYY-MM-DD HH:mm') }}</span>
                    <span class="pc-tag" :class="record.isExpired === 1 ? 'red' : 'green'" style="margin-left: 8px;">
                      {{ record.isExpired === 1 ? t('pages.admin.activityManagePage.expired') : t('pages.admin.activityManagePage.ongoing') }}
                    </span>
                  </div>
                </template>
                <template v-if="column.dataIndex === 'createTime'">
                  <span class="text-secondary">{{ dayjs(record.createTime).format('YYYY-MM-DD HH:mm') }}</span>
                </template>
                <template v-if="column.key === 'action'">
                  <div class="mac-action-buttons">
                    <a-button type="text" class="btn-text-blue" @click="handleView(record)">{{ t('pages.admin.activityManagePage.view') }}</a-button>
                    <a-button type="text" class="btn-text-cyan" @click="handleEdit(record)">{{ t('pages.admin.activityManagePage.edit') }}</a-button>
                    <a-button
                      v-if="record.allowSubmission === 1"
                      type="text"
                      class="btn-text-purple"
                      @click="handleManageSubmissions(record)"
                    >
                      {{ t('pages.admin.activityManagePage.manageSubmissions') }}
                    </a-button>
                    <a-button
                      v-if="record.status !== ACTIVITY_STATUS_ENUM.PASS"
                      type="text"
                      class="btn-text-green"
                      @click="showApproveConfirm(record)"
                    > {{ t('pages.admin.activityManagePage.approve') }} </a-button>
                    <a-button
                      v-if="record.status !== ACTIVITY_STATUS_ENUM.REJECT"
                      type="text"
                      class="btn-text-orange"
                      @click="showRejectModal(record)"
                    > {{ t('pages.admin.activityManagePage.reject') }} </a-button>
                    <a-button type="text" class="btn-text-red" @click="showDeleteConfirm(record)">{{ t('pages.admin.activityManagePage.delete') }}</a-button>
                  </div>
                </template>
              </template>
            </a-table>
          </a-spin>
        </div>

        <div class="mac-pagination">
          <a-pagination
            v-model:current="searchParams.current"
            :page-size-options="['10', '20', '30', '50']"
            :total="total"
            :show-total="(total) => t('pages.admin.activityManagePage.totalActivities', { total })"
            show-size-changer
            :page-size="searchParams.pageSize"
            @change="handlePageChange"
            @showSizeChange="handleSizeChange"
          />
        </div>
      </div>
    </template>

    <template v-else>
      <div class="mobile-container">
        <van-nav-bar
          :title="t('pages.admin.activityManagePage.title')"
          fixed
          placeholder
          class="mobile-nav-bar"
        >
          <template #right>
            <van-icon name="plus" size="20" color="#3b82f6" @click="handleCreate" />
          </template>
        </van-nav-bar>

        <van-sticky offset-top="46">
          <div class="mobile-filter-bar">
            <van-search
              v-model="searchParams.searchText"
              :placeholder="t('pages.admin.activityManagePage.searchPlaceholderMobile')"
              shape="round"
              @search="doSearch"
              clearable
              class="mobile-search"
            />
            <van-dropdown-menu class="mobile-dropdown">
              <van-dropdown-item
                v-model="searchParams.status"
                :options="dropdownOptions"
                @change="doSearch"
              />
            </van-dropdown-menu>
          </div>
        </van-sticky>

        <div class="mobile-content-scroll">
          <van-loading v-if="loading && dataList.length === 0" vertical class="mobile-loading">{{ t('pages.admin.activityManagePage.loading') }}</van-loading>

          <div class="mobile-card-list" v-else>
            <div v-for="activity in dataList" :key="activity.id" class="mobile-card">
              <div class="card-header">
                <div class="title-section">
                  <span class="activity-title">{{ activity.title }}</span>
                  <span class="status-tag" :class="getStatusClass(activity.status)">
                    {{ ACTIVITY_STATUS_MAP[activity.status] }}
                  </span>
                </div>
                <div class="user-section text-secondary">
                  <div class="user-info">
                    <img :src="activity.user?.userAvatar || defaultAvatar" alt="avatar" />
                    <span>{{ activity.user?.userName || t('pages.admin.activityManagePage.unknownUser') }}</span>
                  </div>
                  <span><EyeOutlined /> {{ activity.viewCount || 0 }}</span>
                </div>
              </div>

              <div class="card-body">
                <div class="time-row">
                  <span>{{ t('pages.admin.activityManagePage.publishedAt') }}{{ dayjs(activity.createTime).format('MM-DD HH:mm') }}</span>
                </div>
                <div class="expire-row">
                  <span :class="activity.isExpired === 1 ? 'text-expired' : 'text-active'">
                    {{ t('pages.admin.activityManagePage.deadline') }}{{ dayjs(activity.expireTime).format('YYYY-MM-DD HH:mm') }}
                  </span>
                  <van-tag :type="activity.isExpired === 1 ? 'danger' : 'success'" plain size="medium">
                    {{ activity.isExpired === 1 ? t('pages.admin.activityManagePage.expired') : t('pages.admin.activityManagePage.ongoing') }}
                  </van-tag>
                </div>
              </div>

              <div class="card-actions">
                <van-button size="small" plain type="primary" @click="handleView(activity)">{{ t('pages.admin.activityManagePage.view') }}</van-button>
                <van-button size="small" plain style="color: #06b6d4; border-color: #06b6d4;" @click="handleEdit(activity)">{{ t('pages.admin.activityManagePage.edit') }}</van-button>
                <van-button v-if="activity.allowSubmission === 1" size="small" plain @click="handleManageSubmissions(activity)" style="color: #8b5cf6; border-color: #8b5cf6;">{{ t('pages.admin.activityManagePage.manageSubmissions') }}</van-button>
                <van-button v-if="activity.status !== ACTIVITY_STATUS_ENUM.PASS" size="small" plain type="success" @click="showApproveConfirm(activity)">{{ t('pages.admin.activityManagePage.approve') }}</van-button>
                <van-button v-if="activity.status !== ACTIVITY_STATUS_ENUM.REJECT" size="small" plain type="warning" @click="showRejectModal(activity)">{{ t('pages.admin.activityManagePage.reject') }}</van-button>
                <van-button size="small" plain type="danger" @click="showDeleteConfirm(activity)">{{ t('pages.admin.activityManagePage.delete') }}</van-button>
              </div>
            </div>
          </div>

          <van-empty v-if="!loading && dataList.length === 0" :description="t('pages.admin.activityManagePage.noActivities')" />

          <div class="mobile-pagination-wrapper" v-if="total > 0">
            <van-pagination :prev-text="t('pages.admin.activityManagePage.prevPage')" :next-text="t('pages.admin.activityManagePage.nextPage')"
              v-model="searchParams.current"
              :total-items="total"
              :items-per-page="searchParams.pageSize"
              :show-page-size="5"
              force-ellipses
              @change="handleMobilePageChange"
            />
          </div>
        </div>
      </div>
    </template>

    <template v-if="device === DEVICE_TYPE_ENUM.PC">
      <a-modal
        v-model:open="rejectModalVisible"
        :title="t('pages.admin.activityManagePage.rejectTitle')"
        :footer="null"
        class="mac-modal"
        destroyOnClose
      >
        <div class="mac-form">
          <div class="form-item">
            <label>{{ t('pages.admin.activityManagePage.quickReason') }}</label>
            <a-select
              v-model:value="selectedReason"
              :placeholder="t('pages.admin.activityManagePage.quickReasonPlaceholder')"
              class="mac-select"
              :dropdownClassName="'mac-select-dropdown'"
              @change="handleReasonSelect"
            >
              <a-select-option
                v-for="option in ACTIVITY_REJECT_REASON_OPTIONS"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </a-select-option>
            </a-select>
          </div>
          <div class="form-item">
            <label>{{ t('pages.admin.activityManagePage.detailReason') }} <span class="required">*</span></label>
            <a-textarea
              v-model:value="rejectMessage"
              :placeholder="t('pages.admin.activityManagePage.detailReasonPlaceholder')"
              :rows="4"
              :maxLength="200"
              class="mac-input"
            />
          </div>
          <div class="modal-footer">
            <a-button class="ios-btn-ghost" @click="rejectModalVisible = false">{{ t('pages.admin.activityManagePage.cancel') }}</a-button>
            <a-button type="primary" class="ios-btn-danger" @click="handleRejectConfirm" :loading="confirmLoading">{{ t('pages.admin.activityManagePage.confirmReject') }}</a-button>
          </div>
        </div>
      </a-modal>

      <a-modal
        v-model:open="confirmDialogVisible"
        :title="null"
        :footer="null"
        :width="360"
        class="ios-confirm-modal"
        centered
      >
        <div class="ios-confirm-content">
          <div class="icon-wrap" :class="confirmType">
            <CheckCircleFilled v-if="confirmType === 'approve'" />
            <ExclamationCircleFilled v-else />
          </div>
          <h3 class="confirm-title">{{ confirmTitle }}</h3>
          <p class="confirm-desc">{{ confirmDesc }}</p>
          <div class="ios-confirm-actions">
            <button class="ios-cancel-btn" @click="confirmDialogVisible = false">{{ t('pages.admin.activityManagePage.cancel') }}</button>
            <button class="ios-danger-btn" :class="confirmType" @click="executeConfirm">{{ t('pages.admin.activityManagePage.confirm') }}</button>
          </div>
        </div>
      </a-modal>
    </template>

    <template v-else>
      <van-dialog
        v-model:show="rejectModalVisible"
        :title="t('pages.admin.activityManagePage.rejectTitleMobile')"
        show-cancel-button
        :before-close="handleMobileRejectDialogClose"
      >
        <van-cell-group inset>
          <van-field
            v-model="selectedReasonText"
            is-link
            readonly
            :label="t('pages.admin.activityManagePage.quickReason')"
            :placeholder="t('pages.admin.activityManagePage.pleaseSelect')"
            @click="showReasonPicker = true"
          />
          <van-field
            v-model="rejectMessage"
            :label="t('pages.admin.activityManagePage.detailReason')"
            type="textarea"
            :placeholder="t('pages.admin.activityManagePage.detailReasonPlaceholderMobile')"
            rows="3"
            autosize
          />
        </van-cell-group>
      </van-dialog>

      <van-popup v-model:show="showReasonPicker" round position="bottom">
        <van-picker
          :columns="reasonPickerColumns"
          @confirm="onReasonPickerConfirm"
          @cancel="showReasonPicker = false"
          show-toolbar
          :title="t('pages.admin.activityManagePage.selectReason')"
        />
      </van-popup>

      <van-dialog
        v-model:show="confirmDialogVisible"
        :title="confirmTitle"
        :message="confirmDesc"
        show-cancel-button
        @confirm="executeConfirm"
        :confirm-button-color="confirmType === 'approve' ? '#10b981' : '#ef4444'"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import {
  SearchOutlined,
  PlusOutlined,
  EyeOutlined,
  ExclamationCircleFilled,
  CheckCircleFilled
} from '@ant-design/icons-vue'
import { DEVICE_TYPE_ENUM } from '@/constants/device'
import { getDeviceType } from '@/utils/device'
import { ACTIVITY_REJECT_REASON_OPTIONS, ACTIVITY_REJECT_REASON_MAP } from '@/constants/review'
import { listActivityByPageUsingPost as listActivitiesUsingPost, reviewActivityUsingPost, deleteActivityUsingPost } from '@/api/activityController'

const defaultAvatar = 'https://gw.alipayobjects.com/zos/antfincdn/XAoskV01e/default_avatar.png'

const ACTIVITY_STATUS_ENUM = { REVIEWING: 0, PASS: 1, REJECT: 2 }
const ACTIVITY_STATUS_MAP: Record<number, string> = { 0: t('pages.admin.activityManagePage.reviewing'), 1: t('pages.admin.activityManagePage.approved'), 2: t('pages.admin.activityManagePage.rejected') }
const ACTIVITY_STATUS_OPTIONS = [
  { get label() { return t('pages.admin.activityManagePage.reviewing') }, value: ACTIVITY_STATUS_ENUM.REVIEWING },
  { get label() { return t('pages.admin.activityManagePage.approved') }, value: ACTIVITY_STATUS_ENUM.PASS },
  { get label() { return t('pages.admin.activityManagePage.rejected') }, value: ACTIVITY_STATUS_ENUM.REJECT },
]

const columns = [
  { get title() { return t('pages.admin.activityManagePage.colTitle') }, dataIndex: 'title', width: 200, ellipsis: true },
  { get title() { return t('pages.admin.activityManagePage.colPublisher') }, dataIndex: 'userInfo', width: 140 },
  { get title() { return t('pages.admin.activityManagePage.colData') }, dataIndex: 'stats', width: 100 },
  { get title() { return t('pages.admin.activityManagePage.colStatus') }, dataIndex: 'status', width: 100 },
  { get title() { return t('pages.admin.activityManagePage.colExpireTime') }, dataIndex: 'expireTime', width: 180 },
  { get title() { return t('pages.admin.activityManagePage.colCreateTime') }, dataIndex: 'createTime', width: 160 },
  { get title() { return t('pages.admin.activityManagePage.colAction') }, key: 'action', width: 280, align: 'right' },
]

const router = useRouter()
const device = ref<string>('')
const loading = ref(false)
const dataList = ref<API.Activity[]>([])
const searchParams = ref({
  searchText: '',
  status: undefined as number | undefined,
  isPublic: false,
  current: 1,
  pageSize: 10, // 移动端和PC端统一共用 pageSize
})
const total = ref(0)

const dropdownOptions = computed(() => {
  return [
    { get text() { return t('pages.admin.activityManagePage.allStatus') }, value: undefined },
    ...ACTIVITY_STATUS_OPTIONS.map(o => ({ text: o.label, value: o.value }))
  ]
})

const reasonPickerColumns = computed(() => {
  return ACTIVITY_REJECT_REASON_OPTIONS.map(o => ({ text: o.label, value: o.value }))
})

const getStatusClass = (status: number) => {
  switch (status) {
    case 0: return 'status-orange'
    case 1: return 'status-green'
    case 2: return 'status-red'
    default: return 'status-gray'
  }
}

onMounted(async () => {
  device.value = await getDeviceType()
  loadData()
})

const loadData = async () => {
  loading.value = true
  try {
    const res = await listActivitiesUsingPost({
      ...searchParams.value,
      current: searchParams.value.current,
      pageSize: searchParams.value.pageSize,
    })
    if (res.data?.data) {
      // 核心修改：无论PC还是移动端，都直接覆盖数组，不再做数据追加（配合分页器）
      dataList.value = res.data.data.records
      total.value = res.data.data.total
    }
  } catch (error: any) {
    message.error(t('pages.admin.activityManagePage.fetchError'))
  } finally {
    loading.value = false
  }
}

const doSearch = () => {
  searchParams.value.current = 1
  loadData()
}

// PC端分页变化
const doTableChange = (pag: any) => {
  searchParams.value.current = pag.current
  searchParams.value.pageSize = pag.pageSize
  loadData()
}

// PC端分页变化
const handlePageChange = (page: number, pageSize: number) => {
  searchParams.value.current = page
  searchParams.value.pageSize = pageSize
  loadData()
}

// PC端 pageSize 变化
const handleSizeChange = (current: number, size: number) => {
  searchParams.value.current = 1
  searchParams.value.pageSize = size
  loadData()
}

// 移动端分页变化
const handleMobilePageChange = (page: number) => {
  searchParams.value.current = page
  loadData()
  // 切换分页后，让窗口滚动回顶部
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleCreate = () => { router.push('/activity/edit') }
const handleView = (record: API.Activity) => { router.push(`/activity/detail/${record.id}`) }
const handleEdit = (record: API.Activity) => { router.push(`/activity/edit/${record.id}`) }
const handleManageSubmissions = (record: API.Activity) => { router.push(`/activity/submission/manage?activityId=${record.id}`) }

// ==================== 操作逻辑 ====================
const confirmDialogVisible = ref(false)
const confirmType = ref<'delete'|'approve'>('delete')
const confirmTitle = ref('')
const confirmDesc = ref('')
const currentActivity = ref<API.Activity>()

const showDeleteConfirm = (record: API.Activity) => {
  currentActivity.value = record
  confirmType.value = 'delete'
  confirmTitle.value = t('pages.admin.activityManagePage.confirmDeleteActivityTitle')
  confirmDesc.value = `${t('pages.admin.activityManagePage.activityPrefix')}${record.title}\n${t('pages.admin.activityManagePage.deleteWarning')}`
  confirmDialogVisible.value = true
}

const showApproveConfirm = (record: API.Activity) => {
  currentActivity.value = record
  confirmType.value = 'approve'
  confirmTitle.value = t('pages.admin.activityManagePage.confirmApproveActivityTitle')
  confirmDesc.value = `${t('pages.admin.activityManagePage.activityPrefix')}${record.title}\n${t('pages.admin.activityManagePage.approveWarning')}`
  confirmDialogVisible.value = true
}

const executeConfirm = async () => {
  if (!currentActivity.value) return
  try {
    if (confirmType.value === 'delete') {
      await deleteActivityUsingPost({ id: currentActivity.value.id })
      message.success(t('pages.admin.activityManagePage.deleteSuccess'))
    } else if (confirmType.value === 'approve') {
      await reviewActivityUsingPost({ activityId: currentActivity.value.id, status: ACTIVITY_STATUS_ENUM.PASS })
      message.success(t('pages.admin.activityManagePage.approveSuccess'))
    }
    confirmDialogVisible.value = false
    loadData() // 操作后刷新当前页
  } catch (error: any) {
    message.error(t('pages.admin.activityManagePage.operationFailedPrefix') + error.message)
  }
}

const rejectModalVisible = ref(false)
const rejectMessage = ref('')
const selectedReason = ref('')
const selectedReasonText = ref('')
const confirmLoading = ref(false)
const showReasonPicker = ref(false)

const showRejectModal = (activity: API.Activity) => {
  currentActivity.value = activity
  rejectMessage.value = ''
  selectedReason.value = ''
  selectedReasonText.value = ''
  rejectModalVisible.value = true
}

const handleReasonSelect = (value: string) => {
  selectedReason.value = value
  rejectMessage.value = ACTIVITY_REJECT_REASON_MAP[value] || ''
}

const onReasonPickerConfirm = (selected: { selectedOptions: { text: string, value: string }[] }) => {
  const option = selected.selectedOptions[0]
  if (option) {
    selectedReasonText.value = option.text
    handleReasonSelect(option.value)
  }
  showReasonPicker.value = false
}

const executeReject = async () => {
  if (!currentActivity.value) return
  if (!rejectMessage.value.trim()) {
    message.error(t('pages.admin.activityManagePage.enterDetailReason'))
    throw new Error('No Reason')
  }
  confirmLoading.value = true
  try {
    await reviewActivityUsingPost({
      activityId: currentActivity.value.id,
      status: ACTIVITY_STATUS_ENUM.REJECT,
      message: rejectMessage.value,
    })
    message.success(t('pages.admin.activityManagePage.rejectSuccess'))
    rejectModalVisible.value = false
    loadData() // 操作后刷新当前页
  } catch (error: any) {
    message.error(t('pages.admin.activityManagePage.operationFailed'))
    throw error
  } finally {
    confirmLoading.value = false
  }
}

const handleRejectConfirm = async () => {
  try { await executeReject() } catch (e) {}
}

const handleMobileRejectDialogClose = async (action: string) => {
  if (action === 'confirm') {
    try {
      await executeReject()
      return true
    } catch {
      return false
    }
  }
  return true
}
</script>

<style scoped>
#yuemu-activityManagePage {
  height: 100%;
  box-sizing: border-box;
  background-color: var(--background);
  color: var(--text-primary);
}

.text-secondary { color: var(--text-secondary); }

/* 状态标签通用样式 */
.pc-tag {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
}
.status-orange { color: #ed6a0c; background-color: rgba(237, 106, 12, 0.1); }
.status-green { color: #07c160; background-color: rgba(7, 193, 96, 0.1); }
.status-red { color: #ee0a24; background-color: rgba(238, 10, 36, 0.1); }
.status-gray { color: var(--text-secondary); background-color: var(--hover-background); }

/* ==================== 移动端样式重构 ==================== */
.mobile-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  overflow-x: hidden;
}

.mobile-nav-bar {
  --van-nav-bar-background: var(--card-background);
  --van-nav-bar-icon-color: #3b82f6;
  --van-nav-bar-text-color: var(--text-primary);
}

.mobile-filter-bar {
  display: flex;
  background: var(--card-background);
  border-bottom: 1px solid var(--border-color);
  box-shadow: 0 2px 4px var(--shadow-color);
}

.mobile-search {
  flex: 1;
  padding: 8px 12px;
}

.mobile-dropdown {
  width: 110px;
  --van-dropdown-menu-box-shadow: none;
  --van-dropdown-menu-height: 50px;
}
:deep(.van-dropdown-menu__bar) { box-shadow: none !important; }

.mobile-content-scroll {
  padding: 12px;
  padding-bottom: env(safe-area-inset-bottom, 24px);
}

.mobile-loading {
  margin-top: 40px;
  text-align: center;
}

.mobile-card-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mobile-card {
  background: var(--card-background);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px var(--shadow-color);
}

.card-header { margin-bottom: 12px; }
.title-section { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }

.activity-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.4;
  flex: 1;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  margin-right: 12px;
}

.status-tag {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
  flex-shrink: 0;
}

.user-section { display: flex; justify-content: space-between; align-items: center; font-size: 13px; }
.user-info { display: flex; align-items: center; gap: 6px; }
.user-info img { width: 20px; height: 20px; border-radius: 50%; object-fit: cover; }

.card-body {
  background: var(--hover-background);
  padding: 10px 12px;
  border-radius: 8px;
  margin-bottom: 14px;
  font-size: 13px;
}

.time-row { margin-bottom: 6px; color: var(--text-secondary); }
.expire-row { display: flex; justify-content: space-between; align-items: center; }
.text-expired { color: #ee0a24; }
.text-active { color: var(--text-primary); }

.card-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
.card-actions .van-button { flex: 1 1 auto; min-width: 80px; border-radius: 6px; padding: 0 12px; height: 30px; }

/* 移动端分页器专属样式 */
.mobile-pagination-wrapper {
  margin-top: 20px;
  margin-bottom: 24px;
  padding: 0 12px;
}
:deep(.mobile-pagination-wrapper .van-pagination__item) {
  color: #3b82f6;
  background-color: var(--card-background);
  border-radius: 4px;
  margin: 0 2px;
  border: 1px solid var(--border-color);
}
:deep(.mobile-pagination-wrapper .van-pagination__item--active) {
  background-color: #3b82f6;
  color: #fff;
  border-color: #3b82f6;
}

/* ==================== PC 端样式 ==================== */
.pc-container { padding: 16px; max-width: 1400px; margin: 0 auto; box-sizing: border-box; }
.mac-header-panel { background-color: var(--card-background); border: 1px solid var(--border-color); border-radius: 16px; padding: 24px; margin-bottom: 24px; }
.header-main-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-title { margin: 0; font-size: 24px; font-weight: 600; }
.mac-search-form { display: flex; gap: 12px; flex-wrap: wrap; }
.mac-table-wrapper { background-color: var(--card-background); border: 1px solid var(--border-color); border-radius: 16px; padding: 20px; }
.user-info-cell { display: flex; align-items: center; gap: 8px; }
.mini-avatar { width: 28px; height: 28px; border-radius: 50%; border: 1px solid var(--border-color); object-fit: cover;}
.expire-time-cell { display: flex; align-items: center; }
.mac-action-buttons { display: flex; justify-content: flex-end; gap: 4px; }
.mac-pagination { margin-top: 24px; display: flex; justify-content: flex-end; }
.btn-text-blue { color: #3b82f6 !important; }
.btn-text-cyan { color: #06b6d4 !important; }
.btn-text-purple { color: #8b5cf6 !important; }
.btn-text-green { color: #10b981 !important; }
.btn-text-orange { color: #f59e0b !important; }
.btn-text-red { color: #ef4444 !important; }

/* PC 弹窗样式 */
:deep(.mac-modal .ant-modal-content), :deep(.ios-confirm-modal .ant-modal-content) { border-radius: 16px; padding: 0; }
:deep(.mac-modal .ant-modal-header) { border-bottom: 1px solid var(--border-color); padding: 20px 24px; margin-bottom: 0;}
:deep(.mac-modal .ant-modal-title) { font-size: 18px; font-weight: 600; }
:deep(.mac-modal .ant-modal-body) { padding: 24px; }
.mac-form .form-item { margin-bottom: 16px; }
.mac-form label { display: block; font-size: 13px; margin-bottom: 6px; font-weight: 500;}
.mac-form .required { color: #ef4444; }
.modal-footer { display: flex; gap: 12px; margin-top: 24px; }
.modal-footer .ant-btn { flex: 1; height: 40px; border-radius: 10px; font-size: 15px; }
.ios-confirm-content { text-align: center; padding-top: 10px; }
.icon-wrap { font-size: 44px; margin-bottom: 12px; }
.icon-wrap.delete { color: #ef4444; }
.icon-wrap.approve { color: #10b981; }
.confirm-title { font-size: 17px; font-weight: 600; margin: 0 0 8px 0; }
.confirm-desc { font-size: 13px; color: var(--text-secondary); margin: 0 0 20px 0; line-height: 1.4; white-space: pre-wrap;}
.ios-confirm-actions { display: flex; border-top: 1px solid var(--border-color); margin: 0 -24px -24px; }
.ios-confirm-actions button { flex: 1; background-color: transparent; border: none; height: 50px; font-size: 16px; font-weight: 500; cursor: pointer; }
.ios-cancel-btn { border-right: 1px solid var(--border-color) !important; border-bottom-left-radius: 16px; color: var(--text-primary); }
.ios-danger-btn.delete { color: #ef4444; border-bottom-right-radius: 16px; }
.ios-danger-btn.approve { color: #10b981; border-bottom-right-radius: 16px; }
</style>
