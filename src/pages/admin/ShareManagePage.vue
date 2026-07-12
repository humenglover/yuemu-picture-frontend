<template>
  <div id="yuemu-share-manage-page">
    <template v-if="device === DEVICE_TYPE_ENUM.PC">
      <div class="yuemu-pc-container">
        <div class="yuemu-mac-header-panel">
          <a-form layout="inline" :model="searchParams" class="yuemu-mac-search-form" @finish="doSearch">
            <a-form-item>
              <a-input
                v-model:value="searchParams.userId"
                :placeholder="t('pages.admin.shareManagePage.searchUserId')"
                allow-clear
                class="yuemu-mac-input"
                style="width: 140px"
              >
                <template #prefix><SearchOutlined class="yuemu-text-secondary" /></template>
              </a-input>
            </a-form-item>
            <a-form-item>
              <a-input
                v-model:value="searchParams.targetId"
                :placeholder="t('pages.admin.shareManagePage.searchContentId')"
                allow-clear
                class="yuemu-mac-input"
                style="width: 140px"
              >
                <template #prefix><SearchOutlined class="yuemu-text-secondary" /></template>
              </a-input>
            </a-form-item>
            <a-form-item>
              <a-select
                v-model:value="searchParams.targetType"
                :placeholder="t('pages.admin.shareManagePage.contentType')"
                style="width: 120px"
                allow-clear
                class="yuemu-mac-select"
                :dropdownClassName="'yuemu-mac-select-dropdown'"
              >
                <a-select-option :value="1"> {{ t('pages.admin.shareManagePage.picture') }} </a-select-option>
                <a-select-option :value="2"> {{ t('pages.admin.shareManagePage.post') }} </a-select-option>
              </a-select>
            </a-form-item>
            <a-form-item>
              <a-button type="primary" html-type="submit" class="yuemu-ios-btn-primary">
                {{ t('pages.admin.shareManagePage.searchBtn') || 'Search' }}
              </a-button>
            </a-form-item>
          </a-form>

          <div class="yuemu-action-group">
            <a-button class="yuemu-ios-btn-ghost" @click="toggleSortOrder">
              <SortAscendingOutlined v-if="sortOrder === 'ascend'" />
              <SortDescendingOutlined v-else />
              {{ sortOrder === 'ascend' ? t('pages.admin.shareManagePage.ascendText') : t('pages.admin.shareManagePage.descendText') }}
            </a-button>
            <a-button
              type="primary"
              danger
              class="yuemu-ios-btn-danger"
              v-show="hasSelected"
              @click="batchDeleteSelectedShares"
            >
              <DeleteOutlined /> {{ t('pages.admin.shareManagePage.batchDelete') || 'Batch Delete' }} ({{ state.selectedRowKeys.length }})
            </a-button>
          </div>
        </div>

        <div class="yuemu-mac-table-wrapper">
          <a-spin tip="Loading..." :spinning="loading">
            <a-table
              :row-selection="rowSelection"
              rowKey="id"
              :columns="columns"
              :data-source="dataList"
              :pagination="false"
              @change="doTableChange"
              class="yuemu-mac-table"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.dataIndex === 'targetType'">
                  <span class="yuemu-ios-tag" :class="record.targetType === 1 ? 'yuemu-blue' : 'yuemu-purple'">
                    <component :is="record.targetType === 1 ? 'PictureOutlined' : 'FileTextOutlined'" />
                    {{ record.targetType === 1 ? (t('pages.admin.shareManagePage.picture') || 'Picture') : (t('pages.admin.shareManagePage.post') || 'Post') }}
                  </span>
                </template>
                <template v-if="column.dataIndex === 'isShared'">
                  <span class="yuemu-ios-tag" :class="record.isShared ? 'yuemu-green' : 'yuemu-red'">
                    {{ record.isShared ? t('pages.admin.shareManagePage.shared') : t('pages.admin.shareManagePage.canceled') }}
                  </span>
                </template>
                <template v-if="column.dataIndex === 'isRead'">
                  <span class="yuemu-ios-tag" :class="record.isRead ? 'yuemu-gray' : 'yuemu-orange'">
                    {{ record.isRead ? t('pages.admin.shareManagePage.read') : t('pages.admin.shareManagePage.unread') }}
                  </span>
                </template>
                <template v-if="column.dataIndex === 'shareTime'">
                  <span class="yuemu-text-secondary">{{ dayjs(record.shareTime).format('YYYY-MM-DD HH:mm:ss') }}</span>
                </template>
                <template v-else-if="column.key === 'action'">
                  <div class="yuemu-mac-action-buttons">
                    <a-button type="text" class="yuemu-btn-text-blue" @click="viewContent(record)">
                      {{ t('pages.admin.shareManagePage.view') || 'View' }}
                    </a-button>
                    <a-button type="text" class="yuemu-btn-text-red" @click="showDeleteConfirm(record)">
                      {{ t('pages.admin.shareManagePage.delete') || 'Delete' }}
                    </a-button>
                  </div>
                </template>
              </template>
            </a-table>
          </a-spin>
        </div>

        <div class="yuemu-mac-pagination">
          <a-pagination
            v-model:current="searchParams.current"
            :page-size-options="pcPageSizeOptions"
            :total="total"
            :show-total="(total) => t('pages.admin.shareManagePage.totalRecordText', { total })"
            show-size-changer
            :page-size="searchParams.pageSize"
            @change="onPageChange"
            @showSizeChange="onShowSizeChange"
          />
        </div>
      </div>
    </template>

    <template v-else>
      <div class="yuemu-mobile-container">
        <div class="yuemu-ios-sticky-header">
          <div class="yuemu-header-top">
            <h1 class="yuemu-page-title"> {{ t('pages.admin.shareManagePage.title') }} </h1>
          </div>
          <div class="yuemu-search-bar-wrapper">
            <van-search
              v-model="searchParams.userId"
              :placeholder="t('pages.admin.shareManagePage.searchUserId')"
              class="yuemu-ios-search"
              shape="round"
              @search="doSearch"
            />
          </div>
          <div class="yuemu-ios-dropdown-wrapper">
            <van-dropdown-menu class="yuemu-mac-van-dropdown" :active-color="'var(--link-color)'">
              <van-dropdown-item
                v-model="searchParams.targetType"
                :options="mobileTypeOptions"
                @change="doSearch"
                teleport="body"
              />
              <van-dropdown-item
                v-model="sortOrder"
                :options="mobileSortOptions"
                @change="onMobileSortChange"
                teleport="body"
              />
            </van-dropdown-menu>
          </div>
          <div class="yuemu-batch-action-bar" :class="{ 'is-active': hasSelected }">
            <span class="yuemu-text-secondary">{{ t('pages.admin.shareManagePage.selectedItemsText') || 'Selected' }} {{ state.selectedRowKeys.length }}</span>
            <van-button size="mini" round type="danger" @click="batchDeleteSelectedShares"> {{ t('pages.admin.shareManagePage.batchDelete') }} </van-button>
          </div>
        </div>

        <div class="yuemu-mobile-content-scroll">
          <van-checkbox-group v-model="state.selectedRowKeys">
            <div class="yuemu-ios-card-list">
              <div v-for="share in dataList" :key="share.id" class="yuemu-ios-data-card">
                <div class="yuemu-card-header">
                  <van-checkbox :name="share.id" class="yuemu-ios-checkbox" @click.stop />
                  
                  <div class="yuemu-main-info">
                    <div class="yuemu-name-row">
                      <span class="yuemu-name">ID: {{ share.targetId }}</span>
                    </div>
                    <div class="yuemu-desc-row yuemu-text-secondary">
                      User: {{ share.userId }}
                    </div>
                  </div>
                </div>

                <div class="yuemu-card-body">
                  <div class="yuemu-meta-tags">
                    <span class="yuemu-ios-badge" :class="share.targetType === 1 ? 'yuemu-blue' : 'yuemu-purple'">
                      {{ share.targetType === 1 ? (t('pages.admin.shareManagePage.picture') || 'Picture') : (t('pages.admin.shareManagePage.post') || 'Post') }}
                    </span>
                    <span class="yuemu-ios-badge" :class="share.isShared ? 'yuemu-green' : 'yuemu-red'">
                      {{ share.isShared ? t('pages.admin.shareManagePage.shared') : t('pages.admin.shareManagePage.canceled') }}
                    </span>
                    <span class="yuemu-ios-badge" :class="share.isRead ? 'yuemu-gray' : 'yuemu-orange'">
                      {{ share.isRead ? t('pages.admin.shareManagePage.read') : t('pages.admin.shareManagePage.unread') }}
                    </span>
                  </div>
                  <div class="yuemu-meta-info yuemu-text-secondary" style="margin-top: 12px;">
                    <span>{{ dayjs(share.shareTime).format('YYYY-MM-DD HH:mm') }}</span>
                  </div>
                </div>

                <div class="yuemu-card-actions">
                  <button class="yuemu-ios-action-btn yuemu-view" @click="viewContent(share)">
                    {{ t('pages.admin.shareManagePage.view') || 'View' }}
                  </button>
                  <button class="yuemu-ios-action-btn yuemu-danger" @click="showDeleteConfirm(share)">
                    {{ t('pages.admin.shareManagePage.delete') || 'Delete' }}
                  </button>
                </div>
              </div>
            </div>
          </van-checkbox-group>

          <van-empty v-if="dataList.length === 0 && !loading" :description="t('pages.admin.shareManagePage.noShareRecord')" />

          <div class="yuemu-ios-pagination" v-if="total > 0">
            <div class="yuemu-page-info yuemu-text-secondary">
              <span>{{ t('pages.admin.shareManagePage.totalRecordsText2', { total }) }}</span>
              <span class="yuemu-page-size-trigger" @click="showPageSizeSheet = true">
                {{ searchParams.pageSize }} {{ t('pages.admin.shareManagePage.recordsPerPage') }}
                <van-icon name="arrow-down" />
              </span>
            </div>
            <van-pagination :prev-text="t('pages.admin.shareManagePage.prevPage')" :next-text="t('pages.admin.shareManagePage.nextPage')"
              v-model="searchParams.current"
              :total-items="total"
              :items-per-page="searchParams.pageSize"
              @change="onMobilePageChange"
              :show-page-size="3"
              force-ellipses
              class="yuemu-mac-van-pagination"
            />
          </div>
        </div>

        <van-action-sheet
          v-model:show="showPageSizeSheet"
          :actions="mobilePageSizeOptions"
          :cancel-text="t('pages.admin.shareManagePage.cancelBtn') || 'Cancel'"
          close-on-click-action
          @select="handlePageSizeChange"
          class="yuemu-ios-action-sheet"
          teleport="body"
        />
      </div>
    </template>

    <a-modal
      v-model:open="deleteConfirmVisible"
      :title="null"
      :footer="null"
      :width="360"
      class="yuemu-ios-confirm-modal"
      centered
    >
      <div class="yuemu-ios-confirm-content">
        <div class="yuemu-icon-wrap">
          <ExclamationCircleFilled />
        </div>
        <h3 class="yuemu-confirm-title"> {{ t('pages.admin.shareManagePage.confirmDeleteRecord') }} </h3>
        <p class="yuemu-confirm-desc">
          <span v-html="`ID: ${selectedShare?.id}<br>User: ${selectedShare?.userId}<br>` + (t('pages.admin.shareManagePage.deleteWarning1') || 'This action cannot be undone.')"></span>
        </p>
        <div class="yuemu-ios-confirm-actions">
          <button class="yuemu-ios-cancel-btn" @click="deleteConfirmVisible = false">{{ t('pages.admin.shareManagePage.cancelBtn') || 'Cancel' }}</button>
          <button class="yuemu-ios-danger-btn" @click="confirmDelete"> {{ t('pages.admin.shareManagePage.confirmDelete') }} </button>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import { onMounted, reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { getDeviceType } from '@/utils/device.ts'
import { DEVICE_TYPE_ENUM } from '@/constants/device.ts'
import {
  DeleteOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
  SearchOutlined,
  ExclamationCircleFilled,
  PictureOutlined,
  FileTextOutlined
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import {
  listSharesByPageUsingPost,
  batchOperationSharesUsingPost,
} from '@/api/shareRecordController'

const router = useRouter()
const device = ref<string>(DEVICE_TYPE_ENUM.PC)

const columns = [
  { title: 'ID', dataIndex: 'id', width: 80 },
  { title: t('pages.admin.shareManagePage.userId'), dataIndex: 'userId', width: 120 },
  { title: t('pages.admin.shareManagePage.contentId'), dataIndex: 'targetId', width: 120 },
  { title: t('pages.admin.shareManagePage.contentType'), dataIndex: 'targetType', width: 100 },
  { title: t('pages.admin.shareManagePage.shareStatus'), dataIndex: 'isShared', width: 100 },
  { title: t('pages.admin.shareManagePage.readStatus'), dataIndex: 'isRead', width: 100 },
  { title: t('pages.admin.shareManagePage.shareTime'), dataIndex: 'shareTime', width: 180 },
  { title: t('pages.admin.shareManagePage.action'), key: 'action', fixed: 'right', width: 150, align: 'right' },
]

const dataList = ref<API.ShareRecord[]>([])
const total = ref(0)
const loading = ref(false)
const showPageSizeSheet = ref(false)

const pcPageSizeOptions = ['5', '8', '10', '20', '50']
const mobilePageSizeOptions = [
  { name: t('pages.admin.shareManagePage.pageSize10'), value: 10 },
  { name: t('pages.admin.shareManagePage.pageSize20'), value: 20 },
  { name: t('pages.admin.shareManagePage.pageSize30'), value: 30 },
  { name: t('pages.admin.shareManagePage.pageSize50'), value: 50 },
]

const mobileTypeOptions = [
  { text: t('pages.admin.shareManagePage.allTypes'), value: undefined },
  { text: computed(() => t('pages.admin.shareManagePage.picture') || 'Picture').value, value: 1 },
  { text: computed(() => t('pages.admin.shareManagePage.post') || 'Post').value, value: 2 },
]
const mobileSortOptions = [
  { text: t('pages.admin.shareManagePage.timeDescend'), value: 'descend' },
  { text: t('pages.admin.shareManagePage.timeAscend'), value: 'ascend' },
]

const searchParams = reactive<API.ShareAdminRequest>({
  current: 1,
  pageSize: 8,
  sortField: 'shareTime',
  sortOrder: 'descend',
  userId: undefined,
  targetId: undefined,
  targetType: undefined,
})

const sortOrder = ref<'ascend' | 'descend'>('descend')

const fetchData = async () => {
  loading.value = true
  try {
    const res = await listSharesByPageUsingPost(searchParams)
    if (res.data?.code === 0) {
      dataList.value = res.data.data.records || []
      total.value = res.data.data.total || 0
    }
  } catch (error) {
    message.error(t('pages.admin.shareManagePage.fetchListFail'))
  } finally {
    loading.value = false
  }
}

const onShowSizeChange = (current: number, pageSize: number) => {
  searchParams.current = 1
  searchParams.pageSize = pageSize
  fetchData()
}

const onPageChange = (page: number, pageSize: number) => {
  searchParams.current = page
  searchParams.pageSize = pageSize
  fetchData()
}

const doTableChange = (pagination: any, filters: any, sorter: any) => {
  searchParams.current = pagination.current
  searchParams.pageSize = pagination.pageSize
  if (sorter.field && sorter.order) {
    searchParams.sortField = sorter.field
    searchParams.sortOrder = sorter.order === 'ascend' ? 'ascend' : 'descend'
  }
  fetchData()
}

const doSearch = () => {
  searchParams.current = 1
  fetchData()
}

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'ascend' ? 'descend' : 'ascend'
  searchParams.sortOrder = sortOrder.value
  fetchData()
}

const onMobileSortChange = (val: 'ascend' | 'descend') => {
  searchParams.sortOrder = val
  doSearch()
}

const deleteConfirmVisible = ref(false)
const selectedShare = ref<API.ShareRecord | null>(null)

const showDeleteConfirm = (share: API.ShareRecord) => {
  selectedShare.value = share
  deleteConfirmVisible.value = true
}

const confirmDelete = async () => {
  if (!selectedShare.value?.id) return
  try {
    const res = await batchOperationSharesUsingPost({
      ids: [selectedShare.value.id],
      operation: 'delete'
    })
    if (res.data?.code === 0) {
      message.success(t('pages.admin.shareManagePage.deleteSuccess'))
      deleteConfirmVisible.value = false
      fetchData()
    }
  } catch (error) {
    message.error(t('pages.admin.shareManagePage.deleteFail'))
  }
}

const viewContent = (record: API.ShareRecord) => {
  const path = record.targetType === 1 ? `/picture/${record.targetId}` : `/post/${record.targetId}`
  router.push(path)
}

const state = reactive({ selectedRowKeys: [] as number[] })
const onSelectChange = (selectedRowKeys: number[]) => { state.selectedRowKeys = selectedRowKeys }
const hasSelected = computed(() => state.selectedRowKeys.length > 0)

const batchDeleteSelectedShares = async () => {
  if (state.selectedRowKeys.length === 0) return
  try {
    const res = await batchOperationSharesUsingPost({
      ids: state.selectedRowKeys,
      operation: 'delete'
    })
    if (res.data?.code === 0) {
      message.success(t('pages.admin.shareManagePage.batchDeleteSuccess'))
      state.selectedRowKeys = []
      fetchData()
    }
  } catch (error) {
    message.error(t('pages.admin.shareManagePage.opFail'))
  }
}

const rowSelection = computed(() => ({
  selectedRowKeys: state.selectedRowKeys,
  onChange: onSelectChange
}))

const onMobilePageChange = (page: number) => {
  searchParams.current = page
  fetchData()
}

const handlePageSizeChange = (action: { value: number }) => {
  searchParams.current = 1
  searchParams.pageSize = action.value
  fetchData()
  showPageSizeSheet.value = false
}

onMounted(async () => {
  device.value = await getDeviceType()
  fetchData()
})
</script>

<style scoped>
#yuemu-share-manage-page {
  height: 100%;
  box-sizing: border-box;
  background-color: var(--background);
  color: var(--text-primary);
  transition: var(--theme-transition);
}

.yuemu-text-secondary { color: var(--text-secondary); }

.yuemu-pc-container {
  padding: 16px;
  max-width: 1400px;
  margin: 0 auto;
}

.yuemu-mac-header-panel {
  background-color: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 20px 24px;
  box-shadow: 0 4px 16px var(--shadow-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 16px;
}

.yuemu-mac-search-form { display: flex; gap: 12px; }

:deep(.yuemu-mac-select .ant-select-selector),
:deep(.yuemu-mac-input) {
  background-color: transparent !important;
  color: var(--text-primary) !important;
  border-color: var(--border-color) !important;
  border-radius: 8px !important;
}

.yuemu-ios-btn-primary {
  background-color: var(--link-color) !important;
  color: var(--text-other) !important;
  border-radius: 8px !important;
}

.yuemu-ios-btn-ghost {
  border-radius: 8px !important;
  border: 1px solid var(--border-color) !important;
  color: var(--text-primary) !important;
}

.yuemu-mac-table-wrapper {
  background-color: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 20px;
}

:deep(.yuemu-mac-table) {
  .ant-table { background: transparent; color: var(--text-primary); }
  .ant-table-thead > tr > th {
    background: transparent;
    border-bottom: 1px solid var(--border-color);
    color: var(--text-secondary);
  }
  .ant-table-thead > tr > th::before { display: none !important; }
  .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-color); padding: 16px; }
  .ant-table-tbody > tr:hover > td { background-color: var(--hover-background) !important; }
  .ant-table-cell-fix-left, .ant-table-cell-fix-right { background-color: var(--card-background) !important; }
}

.yuemu-ios-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
}
.yuemu-ios-tag.yuemu-blue { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
.yuemu-ios-tag.yuemu-purple { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
.yuemu-ios-tag.yuemu-green { background: rgba(16, 185, 129, 0.1); color: #10b981; }
.yuemu-ios-tag.yuemu-red { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
.yuemu-ios-tag.yuemu-orange { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
.yuemu-ios-tag.yuemu-gray { background: var(--hover-background); color: var(--text-secondary); border: 1px solid var(--border-color); }

.yuemu-mac-action-buttons { display: flex; justify-content: flex-end; gap: 4px; }
.yuemu-btn-text-blue { color: var(--link-color) !important; }
.yuemu-btn-text-red { color: #ef4444 !important; }

.yuemu-mac-pagination { margin-top: 24px; display: flex; justify-content: flex-end; }
:deep(.ant-pagination-item) { background: transparent !important; border-color: var(--border-color) !important; }
:deep(.ant-pagination-item-active) { background: var(--hover-background) !important; border-color: var(--link-color) !important; }

.yuemu-mobile-container { height: 100%; background-color: var(--background); display: flex; flex-direction: column; }
.yuemu-ios-sticky-header { position: sticky; top: 0; z-index: 1000; padding: 16px 16px 0; }
.yuemu-ios-sticky-header::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: var(--header-background); border-bottom: 1px solid var(--border-color);
  backdrop-filter: blur(15px); z-index: -1;
}

.yuemu-page-title { font-size: 24px; font-weight: 700; color: var(--text-primary); margin: 0; }
.yuemu-batch-action-bar {
  display: flex; justify-content: space-between; align-items: center;
  height: 0; opacity: 0; overflow: hidden; transition: all 0.3s;
}
.yuemu-batch-action-bar.is-active { height: 44px; opacity: 1; border-top: 1px solid var(--border-color); }

.yuemu-ios-card-list { display: flex; flex-direction: column; gap: 16px; padding: 12px 16px; }
.yuemu-ios-data-card {
  background: var(--card-background); border: 1px solid var(--border-color);
  border-radius: 16px; padding: 16px; box-shadow: 0 4px 12px var(--shadow-color);
}

.yuemu-meta-tags { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }

.yuemu-icon-wrap-tag {
  width: 44px; height: 44px; border-radius: 12px;
  display: flex; justify-content: center; align-items: center; font-size: 20px;
}
.yuemu-icon-wrap-tag.yuemu-blue { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
.yuemu-icon-wrap-tag.yuemu-purple { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }

.yuemu-ios-badge {
  font-size: 11px; padding: 2px 8px; border-radius: 4px; font-weight: 500;
  background: var(--hover-background); color: var(--text-secondary);
}
.yuemu-ios-badge.yuemu-blue { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
.yuemu-ios-badge.yuemu-green { background: rgba(16, 185, 129, 0.1); color: #10b981; }

.yuemu-card-actions { display: flex; gap: 8px; padding-top: 12px; border-top: 1px solid var(--border-color); }
.yuemu-ios-action-btn {
  flex: 1; padding: 8px 0; border-radius: 8px; border: 1px solid var(--border-color);
  font-size: 13px; font-weight: 500; background: var(--card-background); color: var(--text-primary);
}
.yuemu-ios-action-btn.yuemu-view { color: var(--link-color); border-color: var(--link-color); }
.yuemu-ios-action-btn.yuemu-danger { color: #ef4444; border-color: rgba(239, 68, 68, 0.3); }

.yuemu-ios-pagination { margin-top: 24px; padding-bottom: 20px; }
.yuemu-page-size-trigger {
  padding: 4px 10px; background: var(--hover-background); border-radius: 12px;
  color: var(--link-color); border: 1px solid var(--border-color);
}

:deep(.yuemu-ios-confirm-modal) {
  .ant-modal-content { background: var(--card-background); border-radius: 16px; padding: 0; }
  .ant-modal-body { padding: 24px; }
}

.yuemu-ios-confirm-content { text-align: center; }
.yuemu-icon-wrap { font-size: 44px; color: #ef4444; margin-bottom: 12px; }
.yuemu-ios-confirm-actions { display: flex; border-top: 1px solid var(--border-color); margin: 20px -24px -24px; }
.yuemu-ios-confirm-actions button {
  flex: 1; height: 50px; border: none; background: transparent; font-size: 16px; cursor: pointer;
}
.yuemu-ios-cancel-btn { color: var(--text-primary); border-right: 1px solid var(--border-color) !important; }
.yuemu-ios-danger-btn { color: #ef4444; font-weight: 600 !important; }

:deep(.ant-input-affix-wrapper), :deep(.ant-input), :deep(.ant-select-selector) {
  background-color: transparent !important; color: var(--text-primary) !important; border-color: var(--border-color) !important;
}
</style>
