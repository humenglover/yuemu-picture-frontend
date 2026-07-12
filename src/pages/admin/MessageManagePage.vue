<template>
  <div id="yuemu-messageManagePage">
    <template v-if="device === DEVICE_TYPE_ENUM.PC">
      <div class="yuemu-pc-container">
        <div class="yuemu-header-panel">
          <a-form layout="inline" :model="searchParams" class="yuemu-search-form" @finish="doSearch">
            <a-form-item>
              <a-input
                v-model:value="searchParams.ip"
                :placeholder="t('pages.admin.messageManagePage.searchIp')"
                allow-clear
                class="yuemu-input"
                style="width: 150px"
              >
                <template #prefix><SearchOutlined class="yuemu-text-secondary" /></template>
              </a-input>
            </a-form-item>
            <a-form-item>
              <a-input
                v-model:value="searchParams.content"
                :placeholder="t('pages.admin.messageManagePage.searchContent')"
                allow-clear
                class="yuemu-input"
                style="width: 200px"
              >
                <template #prefix><SearchOutlined class="yuemu-text-secondary" /></template>
              </a-input>
            </a-form-item>
            <a-form-item>
              <a-button type="primary" html-type="submit" class="yuemu-btn-primary"> {{ t('pages.admin.messageManagePage.search') }} </a-button>
            </a-form-item>
          </a-form>

          <div class="yuemu-action-group">
            <a-button class="yuemu-btn-ghost" @click="toggleSortOrder">
              <SortAscendingOutlined v-if="sortOrder === 'ascend'" />
              <SortDescendingOutlined v-else />
              {{ sortOrder === 'ascend' ? t('pages.admin.messageManagePage.ascendText') : t('pages.admin.messageManagePage.descendText') }}
            </a-button>
            <a-button
              type="primary"
              danger
              class="yuemu-btn-danger"
              v-show="hasSelected"
              @click="batchDeleteSelectedMessages"
            >
              <DeleteOutlined /> 批量删除 ({{ state.selectedRowKeys.length }})
            </a-button>
          </div>
        </div>

        <div class="yuemu-table-wrapper">
          <a-spin tip="Loading..." :spinning="loading">
            <a-table
              :row-selection="rowSelection"
              rowKey="id"
              :columns="columns"
              :data-source="dataList"
              :pagination="false"
              @change="doTableChange"
              class="yuemu-table"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.dataIndex === 'ip'">
                  <span class="yuemu-tag yuemu-blue">{{ record.ip || '未知' }}</span>
                </template>
                <template v-else-if="column.dataIndex === 'content'">
                  <a-tooltip :title="record.content">
                    <div class="yuemu-ellipsis-text" style="max-width: 350px;">
                      {{ record.content || '--' }}
                    </div>
                  </a-tooltip>
                </template>
                <template v-else-if="column.dataIndex === 'createTime'">
                  <span class="yuemu-text-secondary">
                    {{ dayjs(record.createTime).format('YYYY-MM-DD HH:mm:ss') }}
                  </span>
                </template>
                <template v-else-if="column.key === 'action'">
                  <div class="yuemu-action-buttons">
                    <a-button type="text" class="yuemu-btn-text-red" @click="showDeleteConfirm(record)"> {{ t('pages.admin.messageManagePage.delete') }} </a-button>
                  </div>
                </template>
              </template>
            </a-table>
          </a-spin>
        </div>

        <div class="yuemu-pagination-container">
          <a-pagination
            :current="searchParams.current"
            :page-size-options="pcPageSizeOptions"
            :total="total"
            :show-total="(total) => `共 ${total} 条留言`"
            show-size-changer
            :page-size="searchParams.pageSize"
            @change="onPaginationChange"
          />
        </div>
      </div>
    </template>

    <template v-else>
      <div class="yuemu-mobile-container">
        <div class="yuemu-sticky-header">
          <div class="yuemu-header-top">
            <h1 class="yuemu-page-title"> {{ t('pages.admin.messageManagePage.title') }} </h1>
          </div>
          <div class="yuemu-search-bar-wrapper">
            <van-search
              v-model="searchParams.content"
              :placeholder="t('pages.admin.messageManagePage.searchContent')"
              class="yuemu-ios-search"
              shape="round"
              @search="doSearch"
            />
          </div>
          <div class="yuemu-mobile-filter-row">
            <div class="yuemu-pill-btn" @click="toggleSortOrder">
              <SortAscendingOutlined v-if="sortOrder === 'ascend'" />
              <SortDescendingOutlined v-else />
              {{ sortOrder === 'ascend' ? '时间Ascending' : '时间Descending' }}
            </div>
            <div class="yuemu-batch-action-bar" :class="{ 'yuemu-is-active': hasSelected }">
              <span class="yuemu-text-secondary">已选 {{ state.selectedRowKeys.length }} 项</span>
              <van-button size="mini" round type="danger" @click="batchDeleteSelectedMessages"> {{ t('pages.admin.messageManagePage.delete') }} </van-button>
            </div>
          </div>
        </div>

        <div class="yuemu-mobile-content-scroll">
          <div class="yuemu-card-list">
            <van-checkbox-group v-model="state.selectedRowKeys">
              <div v-for="message in dataList" :key="message.id" class="yuemu-data-card">
                <div class="yuemu-card-header">
                  <van-checkbox :name="message.id" class="yuemu-checkbox" @click.stop />
                  <div class="yuemu-main-info">
                    <div class="yuemu-desc-row yuemu-text-secondary" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                      <span class="yuemu-badge yuemu-blue">IP: {{ message.ip }}</span>
                      <span>{{ dayjs(message.createTime).format('MM-DD HH:mm') }}</span>
                    </div>
                  </div>
                </div>

                <div class="yuemu-card-body" style="margin-left: 32px;">
                  <div class="yuemu-message-content-text">
                    {{ message.content }}
                  </div>
                </div>

                <div class="yuemu-card-actions">
                  <button class="yuemu-action-btn yuemu-danger" @click="showDeleteConfirm(message)"> {{ t('pages.admin.messageManagePage.deleteMessage') }} </button>
                </div>
              </div>
            </van-checkbox-group>

            <van-empty v-if="dataList.length === 0 && !loading" :description="t('pages.admin.messageManagePage.emptyMessage')" />
          </div>

          <div class="yuemu-mobile-pagination" v-if="total > 0">
            <div class="yuemu-page-info yuemu-text-secondary">
              <span>{{ t('pages.admin.messageManagePage.totalRecordsText3', { total }) }}</span>
              <span class="yuemu-page-size-trigger" @click="showPageSizeSheet = true">
                {{ searchParams.pageSize }} {{ t('pages.admin.messageManagePage.recordsPerPageText') }}
                <van-icon name="arrow-down" />
              </span>
            </div>
            <van-pagination :prev-text="t('pages.admin.messageManagePage.prevPage')" :next-text="t('pages.admin.messageManagePage.nextPage')"
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
          :cancel-text="t('pages.admin.messageManagePage.cancel')"
          close-on-click-action
          @select="handlePageSizeChange"
          class="yuemu-action-sheet"
          teleport="body"
        />
      </div>
    </template>

    <a-modal
      v-model:open="deleteConfirmVisible"
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
        <h3 class="yuemu-confirm-title"> {{ t('pages.admin.messageManagePage.confirmDeleteTitle') }} </h3>
        <p class="yuemu-confirm-desc">
          「{{ selectedMessage?.content || t('pages.admin.messageManagePage.noContentText') }}」<br>
          {{ t('pages.admin.messageManagePage.deleteWarning') }}
        </p>
        <div class="yuemu-confirm-actions">
          <button class="yuemu-cancel-btn" @click="deleteConfirmVisible = false"> {{ t('pages.admin.messageManagePage.cancel') }} </button>
          <button class="yuemu-danger-btn" @click="confirmDelete"> {{ t('pages.admin.messageManagePage.confirmDelete') }} </button>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import { onMounted, reactive, ref, computed, watch } from 'vue'
import {
  listAdminMessagesByPageUsingPost,
  batchAdminOperationMessagesUsingPost,
  deleteMessageUsingPost,
} from '@/api/messageController'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { getDeviceType } from '@/utils/device'
import { DEVICE_TYPE_ENUM } from '@/constants/device'
import {
  SortAscendingOutlined,
  SortDescendingOutlined,
  SearchOutlined,
  ExclamationCircleFilled,
} from '@ant-design/icons-vue'

const device = ref<string>(DEVICE_TYPE_ENUM.PC)

onMounted(async () => {
  device.value = await getDeviceType()
  doSearch()
})

const columns = [
  { title: 'ID', dataIndex: 'id', width: 80 },
  { title: t('pages.admin.messageManagePage.colIpAddressText'), dataIndex: 'ip', width: 140 },
  { title: t('pages.admin.messageManagePage.colContentText'), dataIndex: 'content' },
  { title: t('pages.admin.messageManagePage.colCreateTimeText'), dataIndex: 'createTime', width: 180 },
  { title: t('pages.admin.messageManagePage.colActionText'), key: 'action', width: 100, align: 'right', fixed: 'right' },
]

const dataList = ref<API.Message[]>([])
const total = ref(0)
const loading = ref(false)
const showPageSizeSheet = ref(false)

const pcPageSizeOptions = ['5', '8', '10', '20', '50']
const mobilePageSizeOptions = [
  { name: t('pages.admin.messageManagePage.pageSize10Text'), value: 10 },
  { name: t('pages.admin.messageManagePage.pageSize20Text'), value: 20 },
  { name: t('pages.admin.messageManagePage.pageSize30Text'), value: 30 },
  { name: t('pages.admin.messageManagePage.pageSize50Text'), value: 50 },
]

const searchParams = reactive<API.MessageAdminRequest>({
  current: 1,
  pageSize: 10,
  sortField: 'createTime',
})
const sortOrder = ref<'ascend' | 'descend'>('descend')

const fetchData = async () => {
  loading.value = true
  try {
    const res = await listAdminMessagesByPageUsingPost({
      ...searchParams,
      sortOrder: sortOrder.value,
    })
    if (res.data?.code === 0) {
      dataList.value = res.data.data.records || []
      total.value = parseInt(res.data.data.total) || 0
    } else {
      message.error(t('pages.admin.messageManagePage.fetchListErrorText'))
    }
  } catch (error) {
    message.error(t('pages.admin.messageManagePage.fetchListErrorText'))
  } finally {
    loading.value = false
  }
}

const doSearch = () => {
  searchParams.current = 1
  fetchData()
}

watch(
  () => searchParams,
  () => { doSearch() },
  { deep: true, flush: 'post' }
)

const onPaginationChange = (page: number, pageSize: number) => {
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

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'ascend' ? 'descend' : 'ascend'
  fetchData()
}

const deleteConfirmVisible = ref(false)
const selectedMessage = ref<API.Message | null>(null)

const showDeleteConfirm = (msg: API.Message) => {
  selectedMessage.value = msg
  deleteConfirmVisible.value = true
}

const confirmDelete = async () => {
  if (!selectedMessage.value?.id) return
  try {
    const res = await deleteMessageUsingPost({ id: selectedMessage.value.id })
    if (res.data.code === 0) {
      message.success(t('pages.admin.messageManagePage.deleteSuccessText'))
      deleteConfirmVisible.value = false
      fetchData()
    } else {
      message.error(t('pages.admin.messageManagePage.deleteFailText'))
    }
  } catch (error) {
    message.error(t('pages.admin.messageManagePage.deleteErrText'))
  }
}

const state = reactive({ selectedRowKeys: [] as number[] })
const onSelectChange = (selectedRowKeys: number[]) => { state.selectedRowKeys = selectedRowKeys }
const hasSelected = computed(() => state.selectedRowKeys.length > 0)
const rowSelection = computed(() => ({ selectedRowKeys: state.selectedRowKeys, onChange: onSelectChange }))

const batchDeleteSelectedMessages = async () => {
  if (state.selectedRowKeys.length === 0) return
  try {
    const res = await batchAdminOperationMessagesUsingPost({
      ids: state.selectedRowKeys,
      operation: 'delete'
    })
    if (res.data.code === 0) {
      message.success(t('pages.admin.messageManagePage.batchDeleteSuccessText'))
      state.selectedRowKeys = []
      fetchData()
    } else {
      message.error(t('pages.admin.messageManagePage.batchDeleteFailText'))
    }
  } catch (error) {
    message.error(t('pages.admin.messageManagePage.batchDeleteErrText'))
  }
}

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
</script>

<style scoped>
#yuemu-messageManagePage {
  height: 100%;
  box-sizing: border-box;
  background-color: var(--background);
  color: var(--text-primary);
  transition: var(--theme-transition);
}

.yuemu-text-secondary { color: var(--text-secondary); }
.yuemu-ellipsis-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* ==================== PC 端样式 ==================== */
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

:deep(.yuemu-input) {
  background-color: transparent !important;
  color: var(--text-primary) !important;
  border-color: var(--border-color) !important;
  border-radius: 8px !important;
  box-shadow: none !important;
}
:deep(.yuemu-input input) { background-color: transparent !important; color: var(--text-primary) !important; }
:deep(.yuemu-input:focus-within) { border-color: var(--link-color) !important; }

.yuemu-btn-primary { background-color: var(--link-color) !important; color: var(--text-other) !important; border: none !important; border-radius: 8px !important; font-weight: 500; transition: var(--theme-transition); }
.yuemu-btn-ghost { border-radius: 8px !important; border: 1px solid var(--border-color) !important; color: var(--text-primary) !important; background-color: transparent !important; }
.yuemu-btn-danger { border-radius: 8px !important; }

.yuemu-action-group { display: flex; gap: 12px; align-items: center; }

.yuemu-table-wrapper {
  background-color: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 16px var(--shadow-color);
  transition: var(--theme-transition);
}

:deep(.yuemu-table) {
  .ant-table, .ant-table-container { background-color: transparent !important; color: var(--text-primary) !important; }
  .ant-table-thead > tr > th { background-color: transparent !important; border-bottom: 1px solid var(--border-color) !important; color: var(--text-secondary) !important; }
  .ant-table-tbody > tr > td { background-color: transparent !important; border-bottom: 1px solid var(--border-color) !important; color: var(--text-primary) !important; }
  .ant-table-tbody > tr:hover > td { background-color: var(--hover-background) !important; }
}

.yuemu-tag { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 500; }
.yuemu-tag.yuemu-blue { background-color: rgba(59, 130, 246, 0.1); color: #3b82f6; }

.yuemu-action-buttons { display: flex; justify-content: flex-end; gap: 4px; }
.yuemu-btn-text-red { color: #ef4444 !important; }

.yuemu-pagination-container { margin-top: 24px; display: flex; justify-content: flex-end; }
:deep(.ant-pagination-item) { background-color: transparent !important; border-color: var(--border-color) !important; }
:deep(.ant-pagination-item-active) { background-color: var(--hover-background) !important; border-color: var(--link-color) !important; }


/* ==================== 移动端样式 ==================== */
.yuemu-mobile-container { height: 100%; background-color: var(--background); display: flex; flex-direction: column; }

.yuemu-sticky-header { position: sticky; top: 0; z-index: 1000; padding: 16px 16px 0; }
.yuemu-sticky-header::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background-color: var(--header-background); border-bottom: 1px solid var(--border-color);
  backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px); z-index: -1;
}

.yuemu-header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.yuemu-page-title { margin: 0; font-size: 24px; font-weight: 700; color: var(--text-primary); }

.yuemu-search-bar-wrapper { margin-bottom: 8px; }
:deep(.yuemu-ios-search) { padding: 0 !important; background-color: transparent !important; }
:deep(.yuemu-ios-search .van-search__content) { background-color: var(--hover-background); border: 1px solid var(--border-color); }

.yuemu-mobile-filter-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.yuemu-pill-btn { display: inline-flex; align-items: center; gap: 4px; padding: 4px 12px; background-color: var(--hover-background); border: 1px solid var(--border-color); border-radius: 14px; font-size: 13px; }

.yuemu-batch-action-bar { display: flex; align-items: center; gap: 12px; opacity: 0; transition: opacity 0.3s; }
.yuemu-batch-action-bar.yuemu-is-active { opacity: 1; }

.yuemu-mobile-content-scroll { flex: 1; padding: 12px 16px 32px; overflow-y: auto; }
.yuemu-card-list { display: flex; flex-direction: column; gap: 16px; }

.yuemu-data-card { background-color: var(--card-background); border: 1px solid var(--border-color); border-radius: 16px; padding: 16px; box-shadow: 0 4px 12px var(--shadow-color); transition: var(--theme-transition); }

.yuemu-card-header { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
.yuemu-main-info { flex: 1; min-width: 0; }

.yuemu-card-body { margin-bottom: 16px; }
.yuemu-message-content-text { font-size: 15px; color: var(--text-primary); line-height: 1.5; word-wrap: break-word; }

.yuemu-badge { font-size: 11px; padding: 2px 8px; border-radius: 4px; font-weight: 500; }
.yuemu-badge.yuemu-blue { background-color: rgba(59, 130, 246, 0.1); color: #3b82f6; }

.yuemu-card-actions { display: flex; gap: 8px; padding-top: 12px; border-top: 1px solid var(--border-color); }
.yuemu-action-btn { flex: 1; padding: 8px 0; border-radius: 8px; border: 1px solid var(--border-color); font-size: 13px; font-weight: 500; background-color: var(--card-background); color: var(--text-primary); }
.yuemu-action-btn.yuemu-danger { color: #ef4444; border-color: rgba(239, 68, 68, 0.3); background-color: rgba(239, 68, 68, 0.05); }

.yuemu-mobile-pagination { margin-top: 24px; }
.yuemu-page-info { display: flex; justify-content: center; align-items: center; gap: 12px; font-size: 12px; margin-bottom: 12px; }
.yuemu-page-size-trigger { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; background-color: var(--hover-background); border-radius: 12px; cursor: pointer; color: var(--link-color); border: 1px solid var(--border-color); }
:deep(.yuemu-van-pagination .van-pagination__item--active) { background-color: var(--link-color); color: var(--text-other); border-radius: 8px; }

:deep(.yuemu-action-sheet) { background-color: var(--card-background); color: var(--text-primary); }

/* 弹窗样式 */
:deep(.yuemu-confirm-modal) {
  .ant-modal-content { background-color: var(--card-background); border: 1px solid var(--border-color); border-radius: 16px; padding: 0; }
  .ant-modal-body { padding: 24px; }
}

.yuemu-confirm-content { text-align: center; padding-top: 10px; }
.yuemu-icon-wrap { font-size: 44px; color: #ef4444; margin-bottom: 12px; }
.yuemu-confirm-title { font-size: 17px; font-weight: 600; margin-bottom: 8px; color: var(--text-primary); }
.yuemu-confirm-desc { font-size: 13px; color: var(--text-secondary); margin-bottom: 20px; line-height: 1.4; }

.yuemu-confirm-actions { display: flex; border-top: 1px solid var(--border-color); margin: 0 -24px -24px; }
.yuemu-confirm-actions button { flex: 1; background-color: transparent; border: none; height: 50px; font-size: 16px; font-weight: 500; cursor: pointer; }
.yuemu-cancel-btn { color: var(--text-primary); border-right: 1px solid var(--border-color) !important; }
.yuemu-danger-btn { color: #ef4444; font-weight: 600 !important; }
</style>
