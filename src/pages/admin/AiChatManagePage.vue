<template>
  <div id="yuemu-aiChatManagePage">
    <template v-if="device === DEVICE_TYPE_ENUM.PC">
      <div class="yuemu-container">
        <div class="yuemu-header-panel">
          <div class="yuemu-header-main-row">
            <div class="yuemu-page-info">
              <h1 class="yuemu-page-title">{{ t('pages.admin.aiChatManagePage.title') }}</h1>
              <p class="yuemu-text-secondary" style="margin: 4px 0 0 0; font-size: 13px;">{{ t('pages.admin.aiChatManagePage.desc') }}</p>
            </div>
            <div class="yuemu-action-group">
              <a-button class="yuemu-btn-ghost" @click="toggleSortOrder">
                <SortAscendingOutlined v-if="sortOrder === 'ascend'" />
                <SortDescendingOutlined v-else />
                {{ sortOrder === 'ascend' ? t('pages.admin.aiChatManagePage.timeAsc') : t('pages.admin.aiChatManagePage.timeDesc') }}
              </a-button>
              <a-button
                v-show="hasSelected"
                type="primary"
                danger
                @click="batchDeleteSelectedChats"
                class="yuemu-btn-danger"
              >
                <DeleteOutlined /> {{ t('pages.admin.aiChatManagePage.batchDelete') }}
              </a-button>
            </div>
          </div>

          <div class="yuemu-search-form">
            <a-input
              v-model:value="searchParams.userId"
              :placeholder="t('pages.admin.aiChatManagePage.searchPlaceholder')"
              allowClear
              @change="doSearch"
              class="yuemu-input"
              style="width: 240px"
            >
              <template #prefix><SearchOutlined class="yuemu-text-secondary" /></template>
            </a-input>
            <a-select
              v-model:value="searchParams.role"
              :placeholder="t('pages.admin.aiChatManagePage.rolePlaceholder')"
              class="yuemu-select"
              :dropdownClassName="'yuemu-select-dropdown'"
              allowClear
              @change="doSearch"
              style="width: 140px"
            >
              <a-select-option value="user">{{ t('pages.admin.aiChatManagePage.normalUser') }}</a-select-option>
              <a-select-option value="assistant">{{ t('pages.admin.aiChatManagePage.aiAssistant') }}</a-select-option>
            </a-select>
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
                <template v-if="column.dataIndex === 'content'">
                  <a-tooltip :title="record.content" placement="topLeft">
                    <div class="yuemu-ellipsis-text">{{ record.content }}</div>
                  </a-tooltip>
                </template>
                <template v-else-if="column.dataIndex === 'role'">
                  <span class="yuemu-tag yuemu-mini" :class="record.role === 'assistant' ? 'yuemu-purple' : 'yuemu-blue'">
                    {{ record.role === 'assistant' ? t('pages.admin.aiChatManagePage.aiAssistant') : t('pages.admin.aiChatManagePage.normalUser') }}
                  </span>
                </template>
                <template v-else-if="column.dataIndex === 'createTime'">
                  <span class="yuemu-text-secondary">
                    {{ dayjs(record.createTime).format('YYYY-MM-DD HH:mm:ss') }}
                  </span>
                </template>
                <template v-else-if="column.key === 'action'">
                  <div class="yuemu-action-buttons">
                    <a-button
                      type="text"
                      class="yuemu-btn-text-red"
                      @click="showDeleteConfirm(record)"
                    > {{ t('pages.admin.aiChatManagePage.delete') }} </a-button>
                  </div>
                </template>
              </template>
            </a-table>
          </a-spin>
        </div>

        <div class="yuemu-pagination">
          <a-pagination
            v-model:current="searchParams.current"
            :page-size-options="pageSizeOptionsArr"
            :total="total"
            :show-total="(total) => t('pages.admin.aiChatManagePage.totalChats', { total })"
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
        <div class="yuemu-sticky-header">
          <div class="yuemu-header-top">
            <h1 class="yuemu-page-title">{{ t('pages.admin.aiChatManagePage.title') }}</h1>
            <van-button icon="sort" size="small" round class="yuemu-btn-icon-ghost" @click="toggleSortOrder" />
          </div>

          <div class="yuemu-search-bar-wrapper">
            <van-search
              v-model="searchParams.userId"
              :placeholder="t('pages.admin.aiChatManagePage.searchPlaceholder')"
              class="yuemu-search"
              shape="round"
              @search="doSearch"
              clearable
            />
          </div>

          <div class="yuemu-filter-dropdown-row">
            <van-dropdown-menu class="yuemu-van-dropdown" :z-index="1000">
              <van-dropdown-item
                v-model="searchParams.role"
                :options="roleOptions"
                @change="doSearch"
                teleport="body"
              />
            </van-dropdown-menu>
          </div>

          <div class="yuemu-batch-action-bar" :class="{ 'yuemu-is-active': hasSelected }">
            <span class="yuemu-text-secondary">{{ t('pages.admin.aiChatManagePage.selectedItems', { count: state.selectedRowKeys.length }) }}</span>
            <div class="yuemu-batch-btns">
              <van-button size="mini" round type="danger" @click="batchDeleteSelectedChats">{{ t('pages.admin.aiChatManagePage.batchDelete') }}</van-button>
            </div>
          </div>
        </div>

        <div class="yuemu-mobile-content-scroll">
          <van-checkbox-group v-model="state.selectedRowKeys">
            <div class="yuemu-card-list">
              <div v-for="chat in dataList" :key="chat.id" class="yuemu-chat-card">
                <div class="yuemu-card-header">
                  <van-checkbox :name="chat.id" class="yuemu-checkbox" />
                  <div class="yuemu-main-info">
                    <div class="yuemu-role-row">
                      <span class="yuemu-tag yuemu-mini" :class="chat.role === 'assistant' ? 'yuemu-purple' : 'yuemu-blue'">
                        {{ chat.role === 'assistant' ? t('pages.admin.aiChatManagePage.aiAssistant') : t('pages.admin.aiChatManagePage.user') }}
                      </span>
                      <span class="yuemu-text-secondary yuemu-meta-text">{{ dayjs(chat.createTime).format('MM-DD HH:mm') }}</span>
                    </div>
                    <div class="yuemu-meta-row yuemu-text-secondary">
                      <span>Chat ID: {{ chat.id }}</span>
                      <span>User ID: {{ chat.userId }}</span>
                    </div>
                  </div>
                </div>

                <div class="yuemu-card-body">
                  <div class="yuemu-content-bubble" :class="'yuemu-role-' + chat.role">
                    {{ chat.content }}
                  </div>
                </div>

                <div class="yuemu-card-actions">
                  <button class="yuemu-action-btn yuemu-danger" @click="showDeleteConfirm(chat)">{{ t('pages.admin.aiChatManagePage.deleteRecord') }}</button>
                </div>
              </div>
            </div>
          </van-checkbox-group>

          <div class="yuemu-mobile-pagination">
            <div class="yuemu-page-info yuemu-text-secondary">
              <span>{{ t('pages.admin.aiChatManagePage.total', { total }) }}</span>
              <span class="yuemu-page-size-trigger" @click="showPageSizeSheet = true">
                {{ t('pages.admin.aiChatManagePage.pageSize', { size: searchParams.pageSize }) }}
                <van-icon name="arrow-down" />
              </span>
            </div>
            <van-pagination :prev-text="t('pages.admin.aiChatManagePage.prevPage')" :next-text="t('pages.admin.aiChatManagePage.nextPage')"
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
          :actions="pageSizeOptions"
          :cancel-text="t('pages.admin.aiChatManagePage.cancel')"
          close-on-click-action
          @select="onSelectPageSize"
          class="yuemu-action-sheet"
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
        <h3 class="yuemu-confirm-title">{{ t('pages.admin.aiChatManagePage.confirmDeleteTitle') }}</h3>
        <p class="yuemu-confirm-desc">
          {{ selectedChat?.content || t('pages.admin.aiChatManagePage.noContent') }}<br>
          {{ t('pages.admin.aiChatManagePage.deleteWarning') }}
        </p>
        <div class="yuemu-confirm-actions">
          <button class="yuemu-cancel-btn" @click="deleteConfirmVisible = false">{{ t('pages.admin.aiChatManagePage.cancel') }}</button>
          <button class="yuemu-danger-btn" @click="confirmDelete">{{ t('pages.admin.aiChatManagePage.confirmDelete') }}</button>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

import { ref, reactive, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import {
  SearchOutlined,
  DeleteOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
  ExclamationCircleFilled
} from '@ant-design/icons-vue'
import { getDeviceType } from '@/utils/device'
import { DEVICE_TYPE_ENUM } from '@/constants/device'
import dayjs from 'dayjs'
import { listChatByPageAdminUsingGet, batchDeleteChatUsingDelete } from '@/api/aiChatController'

const device = ref<string>('')

onMounted(async () => {
  device.value = await getDeviceType()
})

const columns = [
  { get title() { return t('pages.admin.aiChatManagePage.colRole') }, dataIndex: 'role', width: 100 },
  { get title() { return t('pages.admin.aiChatManagePage.colContent') }, dataIndex: 'content', width: 400 },
  { get title() { return t('pages.admin.aiChatManagePage.colUserId') }, dataIndex: 'userId', width: 120 },
  { title: 'Chat ID', dataIndex: 'id', width: 120 },
  { get title() { return t('pages.admin.aiChatManagePage.colCreateTime') }, dataIndex: 'createTime', width: 180, sorter: true },
  { get title() { return t('pages.admin.aiChatManagePage.colAction') }, key: 'action', width: 100, align: 'right' }
]

const state = reactive({
  selectedRowKeys: [] as (number | string)[],
  selectedRows: [] as any[]
})

const searchParams = reactive({
  current: 1,
  pageSize: 10,
  userId: undefined as string | undefined,
  role: undefined as string | undefined,
  sortField: 'createTime',
  sortOrder: 'descend'
})

const loading = ref(false)
const dataList = ref<any[]>([])
const total = ref(0)
const pageSizeOptionsArr = ['10', '20', '50', '100']
const showPageSizeSheet = ref(false)
const pageSizeOptions = pageSizeOptionsArr.map(size => ({
  get name() { return t('pages.admin.aiChatManagePage.pageSize', { size }) },
  value: parseInt(size)
}))

const sortOrder = computed(() => searchParams.sortOrder)

const toggleSortOrder = () => {
  searchParams.sortOrder = searchParams.sortOrder === 'ascend' ? 'descend' : 'ascend'
  searchParams.sortField = 'createTime'
  doSearch()
}

const roleOptions = [
  { get text() { return t('pages.admin.aiChatManagePage.allRoles') }, value: undefined },
  { get text() { return t('pages.admin.aiChatManagePage.normalUser') }, value: 'user' },
  { get text() { return t('pages.admin.aiChatManagePage.aiAssistant') }, value: 'assistant' }
]

const rowSelection = computed(() => ({
  selectedRowKeys: state.selectedRowKeys,
  onChange: (selectedRowKeys: any[], selectedRows: any[]) => {
    state.selectedRowKeys = selectedRowKeys
    state.selectedRows = selectedRows
  }
}))

const hasSelected = computed(() => state.selectedRowKeys.length > 0)

const fetchData = async () => {
  if (device.value === DEVICE_TYPE_ENUM.PC) loading.value = true
  try {
    const res = await listChatByPageAdminUsingGet(searchParams)
    if (res.data?.code === 0) {
      dataList.value = res.data.data.records || []
      total.value = res.data.data.total || 0
    } else {
      message.error(t('pages.admin.aiChatManagePage.fetchFailedPrefix') + res.data?.message)
    }
  } catch (error: any) {
    message.error(t('pages.admin.aiChatManagePage.fetchError'))
  } finally {
    loading.value = false
  }
}

const doSearch = () => {
  searchParams.current = 1
  fetchData()
}

const doTableChange = (pagination: any, filters: any, sorter: any) => {
  searchParams.current = pagination.current || searchParams.current
  searchParams.pageSize = pagination.pageSize || searchParams.pageSize
  if (sorter && sorter.field) {
    searchParams.sortField = sorter.field
    searchParams.sortOrder = sorter.order || 'descend'
  }
  fetchData()
}

const onPageChange = (page: number) => {
  searchParams.current = page
  fetchData()
}

const onShowSizeChange = (current: number, size: number) => {
  searchParams.current = 1
  searchParams.pageSize = size
  fetchData()
}

const onMobilePageChange = (page: number) => {
  searchParams.current = page
  fetchData()
}

const onSelectPageSize = (option: any) => {
  searchParams.pageSize = option.value
  searchParams.current = 1
  showPageSizeSheet.value = false
  fetchData()
}

const deleteConfirmVisible = ref(false)
const selectedChat = ref<any>(null)

const showDeleteConfirm = (record: any) => {
  selectedChat.value = record
  deleteConfirmVisible.value = true
}

const confirmDelete = async () => {
  if (!selectedChat.value?.id) return
  try {
    const res = await batchDeleteChatUsingDelete([selectedChat.value.id])
    if (res.data?.code === 0) {
      message.success(t('pages.admin.aiChatManagePage.deleteSuccess'))
      deleteConfirmVisible.value = false
      fetchData()
    } else {
      message.error(t('pages.admin.aiChatManagePage.deleteFailedPrefix') + res.data?.message)
    }
  } catch (error: any) {
    message.error(t('pages.admin.aiChatManagePage.deleteError'))
  }
}

const batchDeleteSelectedChats = async () => {
  if (!hasSelected.value) return
  try {
    const res = await batchDeleteChatUsingDelete(state.selectedRowKeys)
    if (res.data?.code === 0) {
      message.success(t('pages.admin.aiChatManagePage.batchDeleteSuccess'))
      state.selectedRowKeys = []
      state.selectedRows = []
      fetchData()
    } else {
      message.error(t('pages.admin.aiChatManagePage.batchDeleteFailedPrefix') + res.data?.message)
    }
  } catch (error: any) {
    message.error(t('pages.admin.aiChatManagePage.batchDeleteError'))
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
/* ==================== 统一依赖 CSS 变量 ==================== */
#yuemu-aiChatManagePage {
  height: 100%;
  box-sizing: border-box;
  background-color: var(--background);
  color: var(--text-primary);
  transition: var(--theme-transition);
}
.yuemu-text-secondary { color: var(--text-secondary); }

/* ==================== PC 端样式 ==================== */
.yuemu-container {
  padding: 16px;
  max-width: 1400px;
  margin: 0 auto;
  box-sizing: border-box;
}

.yuemu-header-panel {
  background-color: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 16px var(--shadow-color);
  margin-bottom: 24px;
  transition: var(--theme-transition);
}

.yuemu-header-main-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.yuemu-page-title { margin: 0; font-size: 24px; font-weight: 600; color: var(--text-primary); }

.yuemu-search-form { display: flex; gap: 12px; flex-wrap: wrap; }

:deep(.yuemu-input), :deep(.ant-input-affix-wrapper), :deep(.yuemu-select .ant-select-selector) {
  background-color: var(--background) !important;
  color: var(--text-primary) !important;
  border-color: var(--border-color) !important;
  border-radius: 8px !important;
  box-shadow: none !important;
  transition: var(--theme-transition);
}
:deep(.yuemu-input input), :deep(.ant-input-affix-wrapper input) { background-color: transparent !important; color: var(--text-primary) !important; }
:deep(.yuemu-input input::placeholder), :deep(.ant-input-affix-wrapper input::placeholder), :deep(.yuemu-select .ant-select-selection-placeholder) { color: var(--text-secondary) !important; }
:deep(.yuemu-input:focus-within), :deep(.ant-input-affix-wrapper-focused), :deep(.yuemu-select.ant-select-focused .ant-select-selector) { border-color: var(--link-color) !important; }

.yuemu-action-group { display: flex; gap: 12px; align-items: center; }

.yuemu-btn-danger { border-radius: 8px !important; }
.yuemu-btn-ghost { border-radius: 8px !important; border: 1px solid var(--border-color) !important; color: var(--text-primary) !important; background-color: transparent !important; transition: var(--theme-transition); }
.yuemu-btn-ghost:hover { background-color: var(--hover-background) !important; }

.yuemu-table-wrapper {
  background-color: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 16px var(--shadow-color);
  transition: var(--theme-transition);
}

:deep(.yuemu-table) {
  .ant-table { background-color: transparent; color: var(--text-primary); }
  .ant-table-thead > tr > th { background-color: transparent; border-bottom: 1px solid var(--border-color); color: var(--text-secondary); font-weight: 500; }
  .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-color); padding: 16px; color: var(--text-primary); transition: var(--theme-transition); }
  .ant-table-tbody > tr:hover > td { background-color: var(--hover-background) !important; }
  .ant-empty-description { color: var(--text-secondary); }
}

.yuemu-ellipsis-text {
  max-width: 350px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

.yuemu-tag {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid transparent;
}
.yuemu-tag.yuemu-mini { padding: 2px 8px; font-size: 11px; }
.yuemu-tag.yuemu-blue { background-color: rgba(59, 130, 246, 0.1); color: #3b82f6; border-color: rgba(59, 130, 246, 0.2); }
.yuemu-tag.yuemu-purple { background-color: rgba(168, 85, 247, 0.1); color: #a855f7; border-color: rgba(168, 85, 247, 0.2); }

.yuemu-action-buttons { display: flex; justify-content: flex-end; gap: 4px; }
.yuemu-btn-text-red { color: var(--comment-delete-hover-color) !important; }
.yuemu-action-buttons .ant-btn { font-size: 13px; border-radius: 6px; padding: 4px 8px; height: auto;}
.yuemu-action-buttons .ant-btn:hover { background-color: var(--hover-background); }

.yuemu-pagination { margin-top: 24px; display: flex; justify-content: flex-end; }
:deep(.ant-pagination-item) { background-color: transparent; border-color: var(--border-color); }
:deep(.ant-pagination-item a) { color: var(--text-primary); }
:deep(.ant-pagination-item-active) { background-color: var(--hover-background); border-color: var(--link-color); }
:deep(.ant-pagination-item-active a) { color: var(--link-color); }
:deep(.ant-pagination-prev .ant-pagination-item-link), :deep(.ant-pagination-next .ant-pagination-item-link) { background-color: transparent; color: var(--text-primary); border-color: var(--border-color); }
:deep(.ant-pagination-total-text) { color: var(--text-secondary); }

:deep(.yuemu-select-dropdown) { background-color: var(--card-background) !important; border: 1px solid var(--border-color); }
:deep(.yuemu-select-dropdown .ant-select-item) { color: var(--text-primary); }
:deep(.yuemu-select-dropdown .ant-select-item-option-active:not(.ant-select-item-option-disabled)) { background-color: var(--hover-background); }
:deep(.yuemu-select-dropdown .ant-select-item-option-selected:not(.ant-select-item-option-disabled)) { background-color: rgba(59, 130, 246, 0.1); color: var(--link-color); }


/* ==================== 移动端展示 ==================== */
.yuemu-mobile-container {
  height: 100%;
  background-color: var(--background);
  display: flex;
  flex-direction: column;
}

.yuemu-sticky-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background-color: var(--header-background);
  border-bottom: 1px solid var(--border-color);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  padding: 16px 16px 8px;
}
.yuemu-header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.yuemu-btn-icon-ghost { background-color: transparent !important; color: var(--text-secondary) !important; border: 1px solid var(--border-color) !important; width: 32px; height: 32px; }

.yuemu-search-bar-wrapper { margin-bottom: 12px; }
:deep(.yuemu-search) { padding: 0 !important; background-color: transparent !important; }
:deep(.yuemu-search .van-search__content) { background-color: var(--hover-background); border: 1px solid var(--border-color); }
:deep(.van-field__control) { color: var(--text-primary) !important; }
:deep(.van-field__control::placeholder) { color: var(--text-secondary) !important; }

.yuemu-filter-dropdown-row { margin: 0 -16px; }
:deep(.yuemu-van-dropdown .van-dropdown-menu__bar) { background-color: transparent !important; box-shadow: none !important; height: 40px; }
:deep(.yuemu-van-dropdown .van-dropdown-menu__title) { color: var(--text-primary) !important; }



.yuemu-batch-action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 0;
  opacity: 0;
  overflow: hidden;
  transition: all 0.3s ease;
}
.yuemu-batch-action-bar.yuemu-is-active {
  height: 44px;
  opacity: 1;
  margin-top: 8px;
  border-top: 1px solid var(--border-color);
}
.yuemu-batch-btns { display: flex; gap: 8px; }

.yuemu-mobile-content-scroll { flex: 1; padding: 12px 16px 32px; overflow-y: auto; }
.yuemu-card-list { display: flex; flex-direction: column; gap: 16px; }

.yuemu-chat-card {
  background-color: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 4px 12px var(--shadow-color);
  transition: var(--theme-transition);
}

.yuemu-card-header { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
.yuemu-main-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
.yuemu-role-row { display: flex; justify-content: space-between; align-items: center; }
.yuemu-meta-text { font-size: 12px; }
.yuemu-meta-row { display: flex; justify-content: space-between; font-size: 12px; }

.yuemu-card-body { margin-bottom: 16px; }
.yuemu-content-bubble {
  font-size: 14px;
  line-height: 1.6;
  padding: 12px;
  border-radius: 12px;
  word-break: break-word;
  background-color: var(--hover-background);
  border: 1px solid var(--border-color);
}
.yuemu-content-bubble.yuemu-role-assistant {
  background-color: rgba(168, 85, 247, 0.05);
  border-color: rgba(168, 85, 247, 0.2);
}

.yuemu-card-actions {
  display: flex; gap: 8px; border-top: 1px solid var(--border-color); padding-top: 12px;
}
.yuemu-action-btn {
  flex: 1; padding: 8px 0; border-radius: 8px; border: 1px solid var(--border-color);
  font-size: 13px; font-weight: 500; background-color: var(--card-background); color: var(--text-primary);
  transition: var(--theme-transition);
}
.yuemu-action-btn:active { opacity: 0.7; }
.yuemu-action-btn.yuemu-danger { color: var(--comment-delete-hover-color); }

.yuemu-mobile-pagination { margin-top: 24px; }
.yuemu-page-info { display: flex; justify-content: center; align-items: center; gap: 12px; font-size: 12px; margin-bottom: 12px; }
.yuemu-page-size-trigger { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; background-color: var(--hover-background); border-radius: 12px; cursor: pointer; color: var(--link-color); border: 1px solid var(--border-color); }
:deep(.yuemu-van-pagination) {
  .van-pagination__item { color: var(--text-primary); background-color: transparent; border: 1px solid var(--border-color); }
  .van-pagination__item--active { background-color: var(--link-color); color: var(--text-other); border-color: var(--link-color); border-radius: 8px; }
}

:deep(.yuemu-action-sheet) { background-color: var(--card-background); color: var(--text-primary); }
:deep(.yuemu-action-sheet .van-action-sheet__item) { background-color: var(--card-background); color: var(--text-primary); border-bottom: 1px solid var(--border-color); }
:deep(.yuemu-action-sheet .van-action-sheet__cancel) { background-color: var(--card-background); color: var(--text-secondary); border-top: 8px solid var(--background); }

/* ==================== 统一确认删除弹窗 ==================== */
:deep(.yuemu-confirm-modal) {
  .ant-modal-content { background-color: var(--card-background); border: 1px solid var(--border-color); border-radius: 16px; padding: 0; }
  .ant-modal-body { padding: 24px; }
}
.yuemu-confirm-content { text-align: center; padding-top: 10px; }
.yuemu-icon-wrap { font-size: 44px; color: var(--comment-delete-hover-color); margin-bottom: 12px; }
.yuemu-confirm-title { font-size: 17px; font-weight: 600; margin: 0 0 8px 0; color: var(--text-primary); }
.yuemu-confirm-desc { font-size: 13px; color: var(--text-secondary); margin: 0 0 20px 0; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }

.yuemu-confirm-actions { display: flex; border-top: 1px solid var(--border-color); margin: 0 -24px -24px; }
.yuemu-confirm-actions button { flex: 1; background-color: transparent; border: none; height: 50px; font-size: 16px; font-weight: 500; cursor: pointer; transition: var(--theme-transition); }
.yuemu-confirm-actions button:hover { background-color: var(--hover-background); }
.yuemu-cancel-btn { color: var(--text-primary); border-right: 1px solid var(--border-color) !important; border-bottom-left-radius: 16px; }
.yuemu-danger-btn { color: var(--comment-delete-hover-color); font-weight: 600 !important; border-bottom-right-radius: 16px; }
</style>
