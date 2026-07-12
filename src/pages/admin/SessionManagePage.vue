<template>
  <div id="yuemu-sessionManagePage">
    <template v-if="device === DEVICE_TYPE_ENUM.PC">
      <div class="yuemu-pc-container">
        <div class="yuemu-header-panel">
          <a-form layout="inline" :model="searchParams" class="yuemu-search-form" @finish="doSearch">
            <a-form-item>
              <a-input
                v-model:value="searchParams.sessionName"
                :placeholder="t('pages.admin.sessionManagePage.searchSessionName')"
                allow-clear
                class="yuemu-input-base"
                style="width: 220px"
              >
                <template #prefix><SearchOutlined class="yuemu-text-secondary" /></template>
              </a-input>
            </a-form-item>
            <a-form-item>
              <a-input
                v-model:value="searchParams.userId"
                :placeholder="t('pages.admin.sessionManagePage.searchUserId')"
                allow-clear
                class="yuemu-input-base"
                style="width: 150px"
              >
                <template #prefix><SearchOutlined class="yuemu-text-secondary" /></template>
              </a-input>
            </a-form-item>
            <a-form-item>
              <a-button type="primary" html-type="submit" class="yuemu-btn-primary"> {{ t('pages.admin.sessionManagePage.retrieve') }} </a-button>
            </a-form-item>
          </a-form>

          <div class="yuemu-action-group">
            <a-button class="yuemu-btn-ghost" @click="toggleSortOrder">
              <SortAscendingOutlined v-if="sortOrder === 'ascend'" />
              <SortDescendingOutlined v-else />
              {{ sortOrder === 'ascend' ? t('pages.admin.sessionManagePage.ascendText') : t('pages.admin.sessionManagePage.descendText') }}
            </a-button>
            <a-button
              type="primary"
              danger
              class="yuemu-btn-danger"
              v-show="hasSelected"
              @click="batchDeleteSelectedSessions"
            >
              <i class="fas fa-trash-alt"></i> 批量删除 ({{ state.selectedRowKeys.length }})
            </a-button>
          </div>
        </div>

        <div class="yuemu-table-wrapper">
          <a-spin :tip="t('pages.admin.sessionManagePage.loadingData')" :spinning="loading">
            <a-table
              :row-selection="rowSelection"
              rowKey="id"
              :columns="columns"
              :data-source="dataList"
              :pagination="false"
              @change="doTableChange"
              class="yuemu-seamless-table"
              :scroll="{ x: 800 }"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.dataIndex === 'id'">
                  <span class="yuemu-text-mono yuemu-text-secondary">#{{ record.id }}</span>
                </template>
                <template v-else-if="column.dataIndex === 'sessionName'">
                  <div class="yuemu-font-semibold">{{ record.sessionName || t('pages.admin.sessionManagePage.unnamedSession') }}</div>
                </template>
                <template v-else-if="column.dataIndex === 'userId'">
                  <span class="yuemu-badge yuemu-bg-blue">{{ record.userId }}</span>
                </template>
                <template v-else-if="column.dataIndex === 'createTime'">
                  <span class="yuemu-text-secondary">{{ dayjs(record.createTime).format('YYYY-MM-DD HH:mm') }}</span>
                </template>
                <template v-else-if="column.dataIndex === 'updateTime'">
                  <span class="yuemu-text-secondary">{{ dayjs(record.updateTime).format('MM-DD HH:mm') }}</span>
                </template>
                <template v-else-if="column.key === 'action'">
                  <div class="yuemu-action-cell">
                    <button class="yuemu-icon-text-btn yuemu-color-primary" @click="viewSessionMessages(record.id)"> {{ t('pages.admin.sessionManagePage.viewMessage') }} </button>
                    <button class="yuemu-icon-text-btn yuemu-color-danger" @click="showDeleteConfirm(record)"> {{ t('pages.admin.sessionManagePage.delete') }} </button>
                  </div>
                </template>
              </template>
            </a-table>
          </a-spin>
        </div>

        <div class="yuemu-pagination-bar">
          <a-pagination
            v-model:current="searchParams.current"
            :page-size-options="pcPageSizeOptions"
            :total="total"
            :show-total="(total) => t('pages.admin.sessionManagePage.totalSessionText', { total })"
            show-size-changer
            :page-size="searchParams.pageSize"
            @change="onPageChange"
            @showSizeChange="onShowSizeChange"
          />
        </div>
      </div>
    </template>

    <template v-else>
      <div class="yuemu-m-container">
        <div class="yuemu-m-sticky-header">
          <div class="yuemu-m-header-main">
            <h1 class="yuemu-m-title"> {{ t('pages.admin.sessionManagePage.title') }} </h1>
          </div>
          <div class="yuemu-m-search-row">
            <van-search
              v-model="searchParams.sessionName"
              :placeholder="t('pages.admin.sessionManagePage.searchSessionPlaceholder')"
              shape="round"
              class="yuemu-m-search"
              @search="doSearch"
              clearable
            />
          </div>
          <div class="yuemu-m-filter-row">
            <div class="yuemu-m-sort-btn" @click="toggleSortOrder">
              {{ sortOrder === 'ascend' ? t('pages.admin.sessionManagePage.timeAscend') : t('pages.admin.sessionManagePage.timeDescend') }} <van-icon :name="sortOrder === 'ascend' ? 'ascending' : 'descending'" />
            </div>
            <div class="yuemu-m-batch-bar" :class="{ 'is-active': hasSelected }">
              <span class="yuemu-m-batch-text">已选 {{ state.selectedRowKeys.length }} 项</span>
              <button class="yuemu-m-batch-btn" @click="batchDeleteSelectedSessions"> {{ t('pages.admin.sessionManagePage.delete') }} </button>
            </div>
          </div>
        </div>

        <div class="yuemu-m-scroll-view">
          <van-checkbox-group v-model="state.selectedRowKeys">
            <div class="yuemu-m-card-list">
              <div v-for="session in dataList" :key="session.id" class="yuemu-m-card">
                <div class="yuemu-m-card-header">
                  <div class="yuemu-m-icon-square yuemu-bg-blue">
                    <i class="fas fa-comment-dots"></i>
                  </div>
                  <div class="yuemu-m-main-info">
                    <span class="yuemu-m-card-title">{{ session.sessionName || t('pages.admin.sessionManagePage.unnamedSession') }}</span>
                    <span class="yuemu-text-secondary" style="font-size: 12px; margin-top: 4px;">更新于 {{ dayjs(session.updateTime).format('MM-DD HH:mm') }}</span>
                  </div>
                  <van-checkbox :name="session.id" class="yuemu-m-checkbox" @click.stop />
                </div>

                <div class="yuemu-m-card-body">
                  <div class="yuemu-m-tags">
                    <span class="yuemu-badge yuemu-bg-gray">ID: {{ session.id }}</span>
                    <span class="yuemu-badge yuemu-bg-gray">UID: {{ session.userId }}</span>
                  </div>
                </div>

                <div class="yuemu-m-card-actions">
                  <button class="yuemu-m-action-btn yuemu-color-primary" @click="viewSessionMessages(session.id)"> {{ t('pages.admin.sessionManagePage.viewChat') }} </button>
                  <button class="yuemu-m-action-btn yuemu-danger" @click="showDeleteConfirm(session)"> {{ t('pages.admin.sessionManagePage.delete') }} </button>
                </div>
              </div>
            </div>
          </van-checkbox-group>

          <van-empty v-if="dataList.length === 0 && !loading" :description="t('pages.admin.sessionManagePage.noSessionRecord')" />

          <div class="yuemu-m-pagination" v-if="total > 0">
            <div class="yuemu-m-page-info yuemu-text-secondary">
              <span>{{ t('pages.admin.sessionManagePage.totalRecordsText2', { total }) }}</span>
              <span class="yuemu-m-page-size-trigger" @click="showPageSizeSheet = true">
                {{ searchParams.pageSize }} {{ t('pages.admin.sessionManagePage.recordsPerPage') }}
                <van-icon name="arrow-down" />
              </span>
            </div>
            <van-pagination :prev-text="t('pages.admin.sessionManagePage.prevPage')" :next-text="t('pages.admin.sessionManagePage.nextPage')"
              v-model="searchParams.current"
              :total-items="total"
              :items-per-page="searchParams.pageSize"
              @change="onMobilePageChange"
              :show-page-size="3"
              force-ellipses
              class="yuemu-dark-van-pagination"
            />
          </div>
        </div>

        <van-action-sheet
          v-model:show="showPageSizeSheet"
          :actions="mobilePageSizeOptions"
          cancel-text="取消"
          close-on-click-action
          @select="handlePageSizeChange"
          class="yuemu-dark-action-sheet"
          teleport="body"
        />
      </div>
    </template>

    <transition name="yuemu-slide-up">
      <div class="yuemu-chat-overlay" v-if="messageModalVisible" @click.self="closeMessageModal">
        <div class="yuemu-chat-panel">
          <div class="yuemu-chat-header">
            <h3> {{ t('pages.admin.sessionManagePage.sessionDetail') }} </h3>
            <button class="yuemu-chat-close-btn" @click="closeMessageModal"><i class="fas fa-times"></i></button>
          </div>

          <div class="yuemu-chat-body">
            <a-spin :spinning="loadingMessages">
              <div v-if="messageList.length === 0 && !loadingMessages" class="yuemu-chat-empty">
                <i class="fas fa-inbox"></i>
                <p> {{ t('pages.admin.sessionManagePage.noMessageRecord') }} </p>
              </div>

              <div class="yuemu-chat-message-list" v-else>
                <div v-for="message in messageList" :key="message.id" class="yuemu-chat-row" :class="message.messageType === 1 ? 'is-user' : 'is-ai'">
                  <div class="yuemu-chat-avatar" v-if="message.messageType !== 1">
                    <i class="fas fa-robot"></i>
                  </div>

                  <div class="yuemu-chat-bubble-group">
                    <div class="yuemu-chat-bubble">
                      {{ message.content }}
                    </div>
                    <div class="yuemu-chat-time">{{ dayjs(message.createTime).format('MM-DD HH:mm') }}</div>
                  </div>

                  <div class="yuemu-chat-avatar" v-if="message.messageType === 1">
                    <i class="fas fa-user"></i>
                  </div>
                </div>
              </div>
            </a-spin>
          </div>
        </div>
      </div>
    </transition>

    <a-modal
      v-model:open="deleteConfirmVisible"
      :title="null"
      :footer="null"
      :width="360"
      class="yuemu-apple-modal"
      centered
    >
      <div class="yuemu-confirm-content">
        <div class="yuemu-icon-warning">
          <ExclamationCircleFilled />
        </div>
        <h3 class="yuemu-confirm-title"> {{ t('pages.admin.sessionManagePage.confirmDeleteSession') }} </h3>
        <p class="yuemu-confirm-desc">
          「{{ selectedSession?.sessionName || t('pages.admin.sessionManagePage.unnamedSession') }}」<br>
          删除后聊天记录将无法找回。
        </p>
        <div class="yuemu-confirm-actions">
          <button class="yuemu-action-cancel" @click="deleteConfirmVisible = false"> {{ t('pages.admin.sessionManagePage.cancel') }} </button>
          <button class="yuemu-action-danger" @click="confirmDelete"> {{ t('pages.admin.sessionManagePage.delete') }} </button>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import { onMounted, reactive, ref, computed } from 'vue'
import {
  listSessionsByPageUsingPost,
  deleteSessionByIdUsingPost,
  deleteBatchSessionsUsingPost,
} from '@/api/sessionController'
import { listAllMessagesByPageUsingPost } from '@/api/messageQaController'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { getDeviceType } from '@/utils/device'
import { DEVICE_TYPE_ENUM } from '@/constants/device'
import {
  SearchOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
  ExclamationCircleFilled
} from '@ant-design/icons-vue'

const device = ref<string>(DEVICE_TYPE_ENUM.PC)

onMounted(async () => {
  device.value = await getDeviceType()
  fetchData()
})

const columns = [
  { title: t('pages.admin.sessionManagePage.sessionId'), dataIndex: 'id', width: 100 },
  { title: t('pages.admin.sessionManagePage.sessionName'), dataIndex: 'sessionName' },
  { title: t('pages.admin.sessionManagePage.ownerId'), dataIndex: 'userId', width: 150 },
  { title: t('pages.admin.sessionManagePage.createTime'), dataIndex: 'createTime', width: 180 },
  { title: t('pages.admin.sessionManagePage.lastUpdate'), dataIndex: 'updateTime', width: 180 },
  { title: t('pages.admin.sessionManagePage.action'), key: 'action', fixed: 'right', width: 160, align: 'right' },
]

const dataList = ref<API.RagSessionVO[]>([])
const total = ref(0)
const loading = ref(false)
const showPageSizeSheet = ref(false)

const pcPageSizeOptions = ['5', '8', '10', '20', '50']
const mobilePageSizeOptions = [
  { name: t('pages.admin.sessionManagePage.pageSize10'), value: 10 },
  { name: t('pages.admin.sessionManagePage.pageSize20'), value: 20 },
  { name: t('pages.admin.sessionManagePage.pageSize30'), value: 30 },
  { name: t('pages.admin.sessionManagePage.pageSize50'), value: 50 },
]

const searchParams = reactive<API.SessionQueryRequest>({
  current: 1,
  pageSize: 10,
  sortField: 'updateTime', // 默认按最后更新时间排序更合理
})
const sortOrder = ref<'ascend' | 'descend'>('descend')

const fetchData = async () => {
  loading.value = true
  try {
    const res = await listSessionsByPageUsingPost({
      ...searchParams,
      sortOrder: sortOrder.value,
    })
    if (res.data?.code === 0) {
      dataList.value = res.data.data.records || []
      total.value = parseInt(res.data.data.total) || 0
    }
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
  fetchData()
}

const deleteConfirmVisible = ref(false)
const selectedSession = ref<API.RagSessionVO | null>(null)

const showDeleteConfirm = (session: API.RagSessionVO) => {
  selectedSession.value = session
  deleteConfirmVisible.value = true
}

const confirmDelete = async () => {
  if (!selectedSession.value?.id) return
  const res = await deleteSessionByIdUsingPost({ id: selectedSession.value.id })
  if (res.data.code === 0) {
    message.success(t('pages.admin.sessionManagePage.deletedPermanently'))
    deleteConfirmVisible.value = false
    fetchData()
  }
}

const state = reactive({ selectedRowKeys: [] as number[] })
const onSelectChange = (selectedRowKeys: number[]) => { state.selectedRowKeys = selectedRowKeys }
const hasSelected = computed(() => state.selectedRowKeys.length > 0)

const batchDeleteSelectedSessions = async () => {
  if (state.selectedRowKeys.length === 0) return
  const deleteRequests = state.selectedRowKeys.map(id => ({ id }))
  const res = await deleteBatchSessionsUsingPost(deleteRequests)
  if (res.data.code === 0) {
    message.success(`成功删除 ${state.selectedRowKeys.length} 个会话`)
    state.selectedRowKeys = []
    fetchData()
  }
}

const rowSelection = computed(() => ({ selectedRowKeys: state.selectedRowKeys, onChange: onSelectChange }))

const onMobilePageChange = (page: number) => {
  searchParams.current = page
  fetchData()
  document.querySelector('.yuemu-m-scroll-view')?.scrollTo({ top: 0, behavior: 'smooth' })
}

const handlePageSizeChange = (action: { value: number }) => {
  searchParams.current = 1
  searchParams.pageSize = action.value
  fetchData()
  showPageSizeSheet.value = false
}

// ----------------- 自定义聊天弹窗逻辑 -----------------
const messageModalVisible = ref(false)
const messageList = ref<API.RagMessageVO[]>([])
const loadingMessages = ref(false)

const viewSessionMessages = async (sessionId: number) => {
  loadingMessages.value = true
  messageModalVisible.value = true
  // 阻止底层页面滚动（适用于移动端体验）
  document.body.style.overflow = 'hidden'
  try {
    const res = await listAllMessagesByPageUsingPost({
      sessionId,
      pageSize: 50, // 设定一个合理值拉取聊天历史（后端限制最大 pageSize 为 50）
      sortField: 'createTime',
      sortOrder: 'ascend' // 聊天气泡按创建时间升序排列
    })
    if (res.data?.code === 0) {
      messageList.value = res.data.data?.records || []
    }
  } finally {
    loadingMessages.value = false
  }
}

const closeMessageModal = () => {
  messageModalVisible.value = false
  messageList.value = []
  document.body.style.overflow = '' // 恢复滚动
}
</script>

<style scoped>
/* ==================== 1. 基础全局配置 ==================== */
#yuemu-sessionManagePage {
  min-height: 100vh;
  background-color: var(--background);
  color: var(--text-primary);
  transition: var(--theme-transition);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.yuemu-text-secondary { color: var(--text-secondary); }
.yuemu-text-mono { font-family: monospace; }
.yuemu-font-semibold { font-weight: 600; }

/* ==================== 2. PC 端工作台 ==================== */
.yuemu-pc-container {
  padding: 32px 24px;
  max-width: 1400px;
  margin: 0 auto;
}

/* 检索过滤栏 */
.yuemu-header-panel {
  background: var(--card-background);
  border-radius: 16px;
  padding: 20px 24px;
  border: 1px solid var(--border-color);
  box-shadow: 0 4px 20px var(--shadow-color);
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}
.yuemu-search-form { display: flex; gap: 12px; }

/* UI 组件覆写 */
.yuemu-btn-primary { background: var(--link-color) !important; color: #fff !important; border: none !important; border-radius: 8px !important; font-weight: 500; height: 36px; padding: 0 16px; box-shadow: 0 4px 12px rgba(var(--link-color-rgb), 0.25); }
.yuemu-btn-primary:hover { filter: brightness(1.1); }
.yuemu-btn-ghost { background: var(--hover-background) !important; border: 1px solid var(--border-color) !important; color: var(--text-primary) !important; border-radius: 8px !important; height: 36px; }
.yuemu-btn-danger { background: rgba(239,68,68,0.1) !important; color: #ef4444 !important; border: none !important; border-radius: 8px !important; }

:deep(.yuemu-input-base), :deep(.yuemu-input-base > .ant-input) {
  background-color: var(--hover-background) !important; border: 1px solid var(--border-color) !important; color: var(--text-primary) !important; border-radius: 8px !important; box-shadow: none !important; transition: all 0.3s;
}
:deep(.yuemu-input-base.ant-input-affix-wrapper) { background-color: var(--hover-background) !important; }
:deep(.yuemu-input-base.ant-input-affix-wrapper > input.ant-input) { background-color: transparent !important; border: none !important; color: var(--text-primary) !important; }
:deep(.yuemu-input-base:hover), :deep(.yuemu-input-base.ant-input-affix-wrapper:hover), :deep(.yuemu-input-base:focus-within) { border-color: var(--link-color) !important; }
:deep(.ant-input::placeholder), :deep(.ant-input-affix-wrapper input::placeholder) { color: var(--text-secondary) !important; opacity: 0.6; }

.yuemu-action-group { display: flex; gap: 12px; align-items: center; }

/* 表格容器 */
.yuemu-table-wrapper {
  background: var(--card-background);
  border-radius: 20px;
  border: 1px solid var(--border-color);
  padding: 8px;
  box-shadow: 0 8px 30px var(--shadow-color);
}

:deep(.yuemu-seamless-table) {
  .ant-table { background: transparent !important; color: var(--text-primary) !important; }
  .ant-table-thead > tr > th { background: transparent !important; border-bottom: 1px solid var(--border-color) !important; color: var(--text-secondary) !important; font-weight: 600; font-size: 13px; text-transform: uppercase; }
  .ant-table-thead > tr > th::before { display: none !important; }
  .ant-table-tbody > tr > td { background: transparent !important; border-bottom: 1px solid var(--border-color) !important; padding: 16px !important; transition: background 0.3s; }
  .ant-table-tbody > tr:hover > td { background: var(--hover-background) !important; }
}

.yuemu-badge { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 6px; font-size: 13px; font-weight: 500; gap: 4px; }
.yuemu-bg-blue { background: rgba(59, 130, 246, 0.15); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.2); }
.yuemu-bg-gray { background: var(--hover-background); color: var(--text-secondary); border: 1px solid var(--border-color); }

.yuemu-action-cell { display: flex; flex-wrap: wrap; gap: 4px; justify-content: flex-end; }
.yuemu-icon-text-btn { background: transparent; border: none; padding: 4px 12px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; transition: 0.2s; }
.yuemu-icon-text-btn:hover { background: var(--hover-background); }
.yuemu-color-primary { color: var(--link-color); }
.yuemu-color-danger { color: #ef4444; }

.yuemu-pagination-bar { margin-top: 24px; display: flex; justify-content: flex-end; }
:deep(.ant-pagination-item), :deep(.ant-pagination-prev), :deep(.ant-pagination-next) { background: transparent !important; border-color: var(--border-color) !important; }
:deep(.ant-pagination-item a) { color: var(--text-primary) !important; }
:deep(.ant-pagination-item-active) { border-color: var(--link-color) !important; background: var(--hover-background) !important; }
:deep(.ant-pagination-item-active a) { color: var(--link-color) !important; }

/* ==================== 3. 移动端 Feed 瀑布流 ==================== */
.yuemu-m-container { min-height: 100vh; display: flex; flex-direction: column; }

.yuemu-m-sticky-header {
  position: sticky; top: 0; z-index: 90; padding: 12px 16px;
  background: rgba(var(--header-background-rgb, 255,255,255), 0.85);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-color);
}
@media (prefers-color-scheme: dark) { .yuemu-m-sticky-header { background: rgba(30,30,30,0.85); } }

.yuemu-m-header-main { margin-bottom: 12px; }
.yuemu-m-title { font-size: 24px; font-weight: 800; color: var(--text-primary); margin: 0; }

.yuemu-m-search-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
:deep(.yuemu-m-search) { flex: 1; padding: 0 !important; background: transparent !important; }
:deep(.van-search__content) { background: var(--hover-background) !important; border: 1px solid var(--border-color); border-radius: 12px; }
:deep(.van-field__control) { color: var(--text-primary) !important; }
:deep(.van-field__control::placeholder) { color: var(--text-secondary) !important; }
:deep(.yuemu-m-search .van-icon) { color: var(--text-secondary) !important; }

.yuemu-m-filter-row { display: flex; justify-content: space-between; align-items: center; }
.yuemu-m-sort-btn { font-size: 13px; color: var(--link-color); font-weight: 600; }

.yuemu-m-batch-bar { height: 0; opacity: 0; overflow: hidden; display: flex; align-items: center; gap: 12px; transition: 0.3s; }
.yuemu-m-batch-bar.is-active { height: auto; opacity: 1; overflow: visible; }
.yuemu-m-batch-text { font-size: 13px; color: var(--text-secondary); }
.yuemu-m-batch-btn { background: rgba(239,68,68,0.1); color: #ef4444; border: none; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }

.yuemu-m-scroll-view { flex: 1; overflow-y: auto; padding: 16px; }
.yuemu-m-card-list { display: flex; flex-direction: column; gap: 16px; }

.yuemu-m-card {
  background: var(--card-background); border: 1px solid var(--border-color);
  border-radius: 20px; padding: 16px; box-shadow: 0 4px 12px var(--shadow-color);
}
.yuemu-m-card-header { display: flex; gap: 12px; align-items: center; margin-bottom: 16px; position: relative;}
.yuemu-m-checkbox { position: absolute; right: 0; top: 0; }
.yuemu-m-icon-square { width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0; display: flex; justify-content: center; align-items: center; font-size: 20px; }
.yuemu-m-main-info { flex: 1; display: flex; flex-direction: column; }
.yuemu-m-card-title { font-size: 16px; font-weight: 700; color: var(--text-primary); margin-right: 24px;} /* 避开checkbox */

.yuemu-m-card-body { margin-bottom: 16px; }
.yuemu-m-tags { display: flex; flex-wrap: wrap; gap: 8px; }

.yuemu-m-card-actions { display: flex; gap: 8px; border-top: 1px solid var(--border-color); padding-top: 16px; }
.yuemu-m-action-btn { flex: 1; padding: 8px 0; border-radius: 10px; border: 1px solid var(--border-color); background: var(--card-background); font-size: 13px; font-weight: 600; }
.yuemu-danger { color: #ef4444; border-color: rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.05); }

/* 分页 */
.yuemu-m-pagination { margin-top: 24px; padding-bottom: 20px; }
.yuemu-m-page-info { display: flex; justify-content: center; align-items: center; gap: 12px; font-size: 12px; margin-bottom: 12px; }
.yuemu-m-page-size-trigger { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; background: var(--hover-background); border-radius: 12px; cursor: pointer; color: var(--link-color); border: 1px solid var(--border-color); }
:deep(.yuemu-dark-van-pagination .van-pagination__item) { background: transparent; border: 1px solid var(--border-color); color: var(--text-primary); }
:deep(.yuemu-dark-van-pagination .van-pagination__item--active) { background: var(--link-color); color: #fff; border-color: var(--link-color); border-radius: 8px; }


/* ==================== 4. 纯 DIV 打造的高级聊天预览弹层 ==================== */

/* 外层蒙版 */
.yuemu-chat-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background-color: rgba(0, 0, 0, 0.5); /* 无论深浅模式都是暗色遮罩 */
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 主面板容器 */
.yuemu-chat-panel {
  background-color: var(--card-background);
  width: 100%;
  max-width: 640px;
  height: 80vh;
  max-height: 800px;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border-color);
  overflow: hidden;
}

/* 弹层头部 */
.yuemu-chat-header {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background-color: var(--card-background);
  border-bottom: 1px solid var(--border-color);
}

.yuemu-chat-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.yuemu-chat-close-btn {
  background: transparent;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: var(--text-secondary);
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: 0.2s;
}
.yuemu-chat-close-btn:hover { background: var(--hover-background); color: var(--text-primary); }

/* 聊天内容区 */
.yuemu-chat-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background-color: var(--background); /* 聊天室背景通常用全局底色更舒服 */
}

/* 隐藏 AntD Spin 的高度塌陷 */
:deep(.yuemu-chat-body .ant-spin-nested-loading),
:deep(.yuemu-chat-body .ant-spin-container) {
  height: 100%;
}

.yuemu-chat-empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  opacity: 0.6;
}
.yuemu-chat-empty i { font-size: 48px; margin-bottom: 16px; }

.yuemu-chat-message-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 聊天气泡布局 */
.yuemu-chat-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
}

.yuemu-chat-row.is-user { justify-content: flex-end; }
.yuemu-chat-row.is-ai { justify-content: flex-start; }

.yuemu-chat-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: var(--hover-background);
  border: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  font-size: 16px;
  flex-shrink: 0;
}
.is-user .yuemu-chat-avatar { color: var(--link-color); background-color: rgba(var(--link-color-rgb), 0.1); border-color: rgba(var(--link-color-rgb), 0.2); }

.yuemu-chat-bubble-group {
  display: flex;
  flex-direction: column;
  max-width: 75%;
}
.is-user .yuemu-chat-bubble-group { align-items: flex-end; }
.is-ai .yuemu-chat-bubble-group { align-items: flex-start; }

.yuemu-chat-bubble {
  padding: 12px 16px;
  font-size: 15px;
  line-height: 1.5;
  word-break: break-word;
  box-shadow: 0 2px 8px var(--shadow-color);
}

.is-user .yuemu-chat-bubble {
  background-color: var(--link-color);
  color: #fff;
  border-radius: 18px 18px 4px 18px; /* 右下角直角 */
}

.is-ai .yuemu-chat-bubble {
  background-color: var(--card-background);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 18px 18px 18px 4px; /* 左下角直角 */
}

.yuemu-chat-time {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 6px;
  padding: 0 4px;
}

/* 弹层滑入动画 */
.yuemu-slide-up-enter-active,
.yuemu-slide-up-leave-active {
  transition: opacity 0.3s ease;
}
.yuemu-slide-up-enter-active .yuemu-chat-panel,
.yuemu-slide-up-leave-active .yuemu-chat-panel {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.yuemu-slide-up-enter-from,
.yuemu-slide-up-leave-to {
  opacity: 0;
}
.yuemu-slide-up-enter-from .yuemu-chat-panel,
.yuemu-slide-up-leave-to .yuemu-chat-panel {
  transform: translateY(40px) scale(0.98);
}

/* 移动端覆盖：聊天弹窗全屏化 */
@media screen and (max-width: 768px) {
  .yuemu-chat-panel {
    width: 100%;
    height: 100%;
    max-height: 100vh;
    border-radius: 0;
    border: none;
  }
  .yuemu-slide-up-enter-from .yuemu-chat-panel,
  .yuemu-slide-up-leave-to .yuemu-chat-panel {
    transform: translateY(100vh);
  }
  .yuemu-chat-bubble-group {
    max-width: 85%; /* 手机上气泡宽一点 */
  }
  .yuemu-chat-header {
    padding-top: 16px; /* 适配刘海屏 */
  }
  .yuemu-chat-body {
    padding-bottom: max(24px, env(safe-area-inset-bottom)); /* 适配底部黑条 */
  }
}

/* ==================== 5. Apple 风格表单弹窗 (删除确认等) ==================== */
:deep(.yuemu-apple-modal .ant-modal-content) { background: var(--card-background); border-radius: 20px; padding: 0; overflow: hidden; border: 1px solid var(--border-color); }
:deep(.yuemu-apple-modal .ant-modal-header) { background: var(--card-background); padding: 20px 24px; border-bottom: 1px solid var(--border-color); }

.yuemu-confirm-content { text-align: center; padding: 24px; }
.yuemu-icon-warning { font-size: 48px; color: #ef4444; margin-bottom: 16px; }
.yuemu-confirm-title { font-size: 18px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px; }
.yuemu-confirm-desc { font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 24px; }
.yuemu-confirm-actions { display: flex; border-top: 1px solid var(--border-color); margin: 0 -24px -24px; }
.yuemu-action-cancel, .yuemu-action-danger { flex: 1; height: 50px; background: transparent; border: none; font-size: 16px; font-weight: 600; cursor: pointer; transition: 0.2s; }
.yuemu-action-cancel { color: var(--text-primary); border-right: 1px solid var(--border-color); }
.yuemu-action-danger { color: #ef4444; }
.yuemu-action-cancel:hover, .yuemu-action-danger:hover { background: var(--hover-background); }
</style>
