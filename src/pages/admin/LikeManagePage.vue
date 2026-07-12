<template>
  <div id="yuemu-likeManagePage">
    <template v-if="device === DEVICE_TYPE_ENUM.PC">
      <div class="yuemu-pc-container">
        <div class="yuemu-header-panel">
          <a-form layout="inline" :model="searchParams" class="yuemu-search-form" @finish="doSearch">
            <a-form-item>
              <a-input
                v-model:value="searchParams.userId"
                :placeholder="t('pages.admin.likeManagePage.searchUserId')"
                allow-clear
                class="yuemu-input"
              >
                <template #prefix><SearchOutlined class="yuemu-search-icon" /></template>
              </a-input>
            </a-form-item>
            <a-form-item>
              <a-input
                v-model:value="searchParams.targetId"
                :placeholder="t('pages.admin.likeManagePage.searchTargetId')"
                allow-clear
                class="yuemu-input"
              >
                <template #prefix><SearchOutlined class="yuemu-search-icon" /></template>
              </a-input>
            </a-form-item>
            <a-form-item>
              <a-select
                v-model:value="searchParams.targetType"
                :placeholder="t('pages.admin.likeManagePage.selectTargetType')"
                allow-clear
                class="yuemu-select"
                :dropdownClassName="'yuemu-select-dropdown'"
                style="width: 140px;"
              >
                <a-select-option :value="1"> {{ t('pages.admin.likeManagePage.picture') }} </a-select-option>
                <a-select-option :value="2"> {{ t('pages.admin.likeManagePage.post') }} </a-select-option>
              </a-select>
            </a-form-item>
            <a-form-item>
              <a-button type="primary" html-type="submit" class="yuemu-btn-primary"> {{ t('pages.admin.likeManagePage.search') }} </a-button>
            </a-form-item>
          </a-form>

          <div class="yuemu-action-group">
            <a-button class="yuemu-btn-ghost" @click="toggleSortOrder">
              <SortAscendingOutlined v-if="sortOrder === 'ascend'" />
              <SortDescendingOutlined v-else />
              {{ sortOrder === 'ascend' ? t('pages.admin.likeManagePage.ascendText') : t('pages.admin.likeManagePage.descendText') }}
            </a-button>
            <a-button
              type="primary"
              danger
              :disabled="!hasSelected"
              @click="batchDeleteSelectedLikes"
              class="yuemu-btn-danger"
              v-show="hasSelected"
            >
              <DeleteOutlined /> {{ t('pages.admin.likeManagePage.batchDelete') }} </a-button>
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
                <template v-if="column.dataIndex === 'targetType'">
                  <div class="yuemu-tag" :class="record.targetType === 1 ? 'yuemu-blue' : 'yuemu-green'">
                    {{ record.targetType === 1 ? t('pages.admin.likeManagePage.picture') : t('pages.admin.likeManagePage.post') }}
                  </div>
                </template>
                <template v-else-if="column.dataIndex === 'isLiked'">
                  <div class="yuemu-tag" :class="record.isLiked ? 'yuemu-red' : 'yuemu-gray'">
                    {{ record.isLiked ? t('pages.admin.likeManagePage.liked') : t('pages.admin.likeManagePage.unliked') }}
                  </div>
                </template>
                <template v-else-if="column.dataIndex === 'firstLikeTime'">
                  <span class="yuemu-text-secondary">
                    {{ dayjs(record.firstLikeTime).format('YYYY-MM-DD HH:mm:ss') }}
                  </span>
                </template>
                <template v-else-if="column.key === 'action'">
                  <div class="yuemu-action-buttons">
                    <a-button
                      type="text"
                      class="yuemu-btn-text-red"
                      @click="showDeleteConfirm(record)"
                    > {{ t('pages.admin.likeManagePage.delete') }} </a-button>
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
            :show-total="(total) => t('pages.admin.likeManagePage.totalRecordText', { total })"
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
            <h1 class="yuemu-page-title"> {{ t('pages.admin.likeManagePage.title') }} </h1>
          </div>
          <div class="yuemu-search-bar-wrapper">
            <van-search
              v-model="searchParams.userId"
              :placeholder="t('pages.admin.likeManagePage.searchUserId')"
              class="yuemu-search"
              shape="round"
              @search="doSearch"
              clearable
            />
            <div class="yuemu-filter-actions">
              <span class="yuemu-sort-text" @click="toggleSortOrder">
                {{ sortOrder === 'ascend' ? t('pages.admin.likeManagePage.ascendText') : t('pages.admin.likeManagePage.descendText') }}
                <van-icon :name="sortOrder === 'ascend' ? 'ascending' : 'descending'" />
              </span>
            </div>
          </div>

          <div class="yuemu-batch-action-bar" :class="{ 'yuemu-is-active': hasSelected }">
            <span class="yuemu-text-secondary">{{ t('pages.admin.likeManagePage.selectedItemsText', { count: state.selectedRowKeys.length }) }}</span>
            <van-button size="mini" round type="danger" @click="batchDeleteSelectedLikes"> {{ t('pages.admin.likeManagePage.batchDelete') }} </van-button>
          </div>
        </div>

        <div class="yuemu-mobile-content-scroll">
          <van-checkbox-group v-model="state.selectedRowKeys">
            <div class="yuemu-card-list">
              <div v-for="like in dataList" :key="like.id" class="yuemu-like-card">
                <div class="yuemu-card-header">
                  <van-checkbox :name="like.id" class="yuemu-checkbox" />
                  <div class="yuemu-like-icon-wrap" :class="like.isLiked ? 'yuemu-liked' : 'yuemu-unliked'">
                    <HeartFilled v-if="like.isLiked" />
                    <HeartOutlined v-else />
                  </div>
                  <div class="yuemu-like-main-info">
                    <div class="yuemu-target-row">
                      <span class="yuemu-target-id">{{ t('pages.admin.likeManagePage.targetPrefix') }}{{ like.targetId }}</span>
                    </div>
                    <div class="yuemu-user-row yuemu-text-secondary">{{ t('pages.admin.likeManagePage.userPrefix') }}{{ like.userId }}</div>
                  </div>
                </div>

                <div class="yuemu-card-body">
                  <div class="yuemu-tags-row">
                     <span class="yuemu-tag yuemu-mini" :class="like.targetType === 1 ? 'yuemu-blue' : 'yuemu-green'">
                        {{ like.targetType === 1 ? t('pages.admin.likeManagePage.picture') : t('pages.admin.likeManagePage.post') }}
                     </span>
                    <span class="yuemu-tag yuemu-mini" :class="like.isLiked ? 'yuemu-red' : 'yuemu-gray'">
                        {{ like.isLiked ? t('pages.admin.likeManagePage.liked') : t('pages.admin.likeManagePage.unliked') }}
                     </span>
                  </div>
                  <div class="yuemu-meta-info yuemu-text-secondary">
                    <div class="yuemu-meta-item yuemu-time">
                      {{ dayjs(like.firstLikeTime).format('YYYY-MM-DD HH:mm:ss') }}
                    </div>
                  </div>
                </div>

                <div class="yuemu-card-actions">
                  <button class="yuemu-action-btn yuemu-danger" @click="showDeleteConfirm(like)"> {{ t('pages.admin.likeManagePage.deleteRecord') }} </button>
                </div>
              </div>
            </div>
          </van-checkbox-group>

          <div class="yuemu-mobile-pagination">
            <div class="yuemu-page-info yuemu-text-secondary">
              <span>{{ t('pages.admin.likeManagePage.totalRecordsText3', { total }) }}</span>
              <span class="yuemu-page-size-trigger" @click="showPageSizeSheet = true">
                {{ searchParams.pageSize }} {{ t('pages.admin.likeManagePage.recordsPerPageText') }}
                <van-icon name="arrow-down" />
              </span>
            </div>
            <van-pagination :prev-text="t('pages.admin.likeManagePage.prevPage')" :next-text="t('pages.admin.likeManagePage.nextPage')"
              v-model="searchParams.current"
              :total-items="total"
              :items-per-page="searchParams.pageSize"
              @change="onMobilePageChange"
              :show-page-size="3"
              force-ellipses
              class="yuemu-pagination-component"
            />
          </div>
        </div>

        <van-action-sheet
          v-model:show="showPageSizeSheet"
          :actions="mobilePageSizeOptions"
          :cancel-text="t('pages.admin.likeManagePage.cancel')"
          close-on-click-action
          @select="handlePageSizeChange"
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
        <h3 class="yuemu-confirm-title"> {{ t('pages.admin.likeManagePage.confirmDeleteTitle') }} </h3>
        <p class="yuemu-confirm-desc">
          <span v-html="`ID: ${selectedLike?.userId}<br>Target: ${selectedLike?.targetId}<br>` + t('pages.admin.likeManagePage.deleteWarning1')"></span>
        </p>
        <div class="yuemu-confirm-actions">
          <button class="yuemu-cancel-btn" @click="deleteConfirmVisible = false"> {{ t('pages.admin.likeManagePage.cancel') }} </button>
          <button class="yuemu-execute-btn" @click="confirmDelete"> {{ t('pages.admin.likeManagePage.confirmDelete') }} </button>
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
  listLikesByPageUsingPost,
  batchOperationLikesUsingPost,
} from '@/api/likeRecordController'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { getDeviceType } from '@/utils/device'
import { DEVICE_TYPE_ENUM } from '@/constants/device'
import {
  DeleteOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
  SearchOutlined,
  ExclamationCircleFilled,
  HeartFilled,
  HeartOutlined
} from '@ant-design/icons-vue'

const device = ref<string>('')
const dataList = ref<API.LikeRecord[]>([])
const total = ref(0)
const loading = ref(false)
const showPageSizeSheet = ref(false)
const deleteConfirmVisible = ref(false)
const selectedLike = ref<API.LikeRecord | null>(null)
const sortOrder = ref<'ascend' | 'descend'>('descend')

const pcPageSizeOptions = ['5', '8', '10', '20', '50']
const mobilePageSizeOptions = [
  { name: t('pages.admin.likeManagePage.pageSize10Text'), value: 10 },
  { name: t('pages.admin.likeManagePage.pageSize20Text'), value: 20 },
  { name: t('pages.admin.likeManagePage.pageSize30Text'), value: 30 },
  { name: t('pages.admin.likeManagePage.pageSize50Text'), value: 50 },
]

const searchParams = reactive<API.LikeAdminRequest>({
  current: 1,
  pageSize: 8,
  sortField: 'firstLikeTime',
  sortOrder: 'descend'
})

const state = reactive({ selectedRowKeys: [] as number[], loading: false })
const hasSelected = computed(() => state.selectedRowKeys.length > 0)

const columns = [
  { title: 'ID', dataIndex: 'id', width: 80 },
  { title: t('pages.admin.likeManagePage.userId'), dataIndex: 'userId', width: 120 },
  { title: t('pages.admin.likeManagePage.targetId'), dataIndex: 'targetId', width: 120 },
  { title: t('pages.admin.likeManagePage.targetType'), dataIndex: 'targetType', width: 100 },
  { title: t('pages.admin.likeManagePage.status'), dataIndex: 'isLiked', width: 100 },
  { title: t('pages.admin.likeManagePage.firstLikeTime'), dataIndex: 'firstLikeTime', width: 180 },
  { title: t('pages.admin.likeManagePage.colActionText'), key: 'action', width: 120, align: 'right' },
]

const fetchData = async () => {
  if (device.value === DEVICE_TYPE_ENUM.PC) loading.value = true
  try {
    const res = await listLikesByPageUsingPost({
      ...searchParams,
      sortOrder: sortOrder.value,
    })
    if (res.data?.code === 0) {
      dataList.value = res.data.data.records
      total.value = parseInt(res.data.data.total)
    }
  } catch (error) {
    message.error(t('pages.admin.likeManagePage.fetchErrorText'))
  } finally {
    loading.value = false
  }
}

const doSearch = async () => {
  searchParams.current = 1
  await fetchData()
}

const onShowSizeChange = (current: number, pageSize: number) => {
  searchParams.pageSize = pageSize
  doSearch()
}

const onPageChange = (page: number, pageSize: number) => {
  searchParams.current = page
  searchParams.pageSize = pageSize
  fetchData()
}

const doTableChange = (page: any) => {
  searchParams.current = page.current
  searchParams.pageSize = page.pageSize
  fetchData()
}

const confirmDelete = async () => {
  if (!selectedLike.value?.id) return
  try {
    const res = await batchOperationLikesUsingPost({
      ids: [selectedLike.value.id],
      operation: 'physical'
    })
    if (res.data.code === 0) {
      message.success(t('pages.admin.likeManagePage.deleteSuccessText'))
      deleteConfirmVisible.value = false
      fetchData()
    }
  } catch (error) {
    message.error(t('pages.admin.likeManagePage.deleteFailText'))
  }
}

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'ascend' ? 'descend' : 'ascend'
  searchParams.sortOrder = sortOrder.value
  fetchData()
}

const batchDeleteSelectedLikes = async () => {
  if (state.selectedRowKeys.length === 0) return
  try {
    const res = await batchOperationLikesUsingPost({
      ids: state.selectedRowKeys,
      operation: 'physical'
    })
    if (res.data.code === 0) {
      message.success(t('pages.admin.likeManagePage.batchDeleteSuccessText'))
      state.selectedRowKeys = []
      fetchData()
    }
  } catch (error) {
    message.error(t('pages.admin.likeManagePage.batchDeleteFailText'))
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
}

const rowSelection = computed(() => ({
  selectedRowKeys: state.selectedRowKeys,
  onChange: (keys: number[]) => { state.selectedRowKeys = keys },
}))

onMounted(async () => {
  device.value = await getDeviceType()
  fetchData()
})
</script>

<style scoped>
#yuemu-likeManagePage {
  height: 100%;
  box-sizing: border-box;
  background-color: var(--background);
  color: var(--text-primary);
  transition: var(--theme-transition);
}

.yuemu-text-secondary { color: var(--text-secondary); }
.yuemu-search-icon { color: var(--text-secondary); }

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
}

.yuemu-search-form { display: flex; gap: 12px; }

:deep(.yuemu-input), :deep(.ant-input-affix-wrapper), :deep(.yuemu-select .ant-select-selector) {
  background-color: transparent !important;
  color: var(--text-primary) !important;
  border-color: var(--border-color) !important;
  border-radius: 8px !important;
  box-shadow: none !important;
}

.yuemu-action-group { display: flex; gap: 12px; align-items: center; }

.yuemu-btn-primary {
  background-color: var(--link-color) !important;
  color: var(--text-other) !important;
  border: none !important;
  border-radius: 8px !important;
}

.yuemu-btn-ghost {
  border-radius: 8px !important;
  border: 1px solid var(--border-color) !important;
  color: var(--text-primary) !important;
  background-color: transparent !important;
}

.yuemu-table-wrapper {
  background-color: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 16px var(--shadow-color);
}

:deep(.yuemu-table) {
  .ant-table { background-color: transparent; color: var(--text-primary); }
  .ant-table-thead > tr > th { background-color: transparent; border-bottom: 1px solid var(--border-color); color: var(--text-secondary); }
  .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-color); padding: 16px; }
  .ant-table-tbody > tr:hover > td { background-color: var(--hover-background) !important; }
}

.yuemu-tag {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}
.yuemu-mini { padding: 2px 8px; font-size: 11px; }
.yuemu-blue { background-color: rgba(59, 130, 246, 0.1); color: #3b82f6; }
.yuemu-green { background-color: rgba(16, 185, 129, 0.1); color: #10b981; }
.yuemu-red { background-color: rgba(239, 68, 68, 0.1); color: #ef4444; }
.yuemu-gray { background-color: var(--hover-background); color: var(--text-secondary); }

.yuemu-action-buttons { display: flex; justify-content: flex-end; }
.yuemu-btn-text-red { color: var(--comment-delete-hover-color) !important; }

.yuemu-pagination { margin-top: 24px; display: flex; justify-content: flex-end; }

.yuemu-mobile-container { height: 100%; display: flex; flex-direction: column; }
.yuemu-sticky-header {
  position: sticky; top: 0; z-index: 100;
  background-color: var(--header-background);
  border-bottom: 1px solid var(--border-color);
  backdrop-filter: blur(15px);
  padding: 16px 16px 8px;
}
.yuemu-header-top { margin-bottom: 12px; }
.yuemu-page-title { margin: 0; font-size: 24px; font-weight: 700; }

.yuemu-search-bar-wrapper { display: flex; align-items: center; gap: 12px; }
:deep(.yuemu-search) { flex: 1; }

.yuemu-filter-actions { font-size: 14px; color: var(--link-color); }

.yuemu-batch-action-bar {
  display: flex; justify-content: space-between; align-items: center;
  height: 0; opacity: 0; overflow: hidden; transition: all 0.3s ease;
}
.yuemu-batch-action-bar.yuemu-is-active { height: 44px; opacity: 1; margin-top: 8px; border-top: 1px solid var(--border-color); }

.yuemu-mobile-content-scroll { flex: 1; padding: 12px 16px 32px; overflow-y: auto; }
.yuemu-card-list { display: flex; flex-direction: column; gap: 16px; }

.yuemu-like-card {
  background-color: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 16px; padding: 16px;
  box-shadow: 0 4px 12px var(--shadow-color);
}

.yuemu-card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.yuemu-like-icon-wrap {
  width: 40px; height: 40px; border-radius: 50%;
  display: flex; justify-content: center; align-items: center; font-size: 20px;
}
.yuemu-liked { background-color: rgba(239, 68, 68, 0.1); color: #ef4444; }
.yuemu-unliked { background-color: var(--hover-background); color: var(--text-secondary); }

.yuemu-like-main-info { flex: 1; min-width: 0; }
.yuemu-target-id { font-size: 15px; font-weight: 600; display: block; overflow: hidden; text-overflow: ellipsis; }
.yuemu-user-row { font-size: 13px; margin-top: 2px; }

.yuemu-tags-row { margin-bottom: 8px; display: flex; gap: 6px; }
.yuemu-meta-info { font-size: 12px; }

.yuemu-card-actions {
  display: flex; gap: 8px; margin-top: 16px;
  padding-top: 12px; border-top: 1px solid var(--border-color);
}
.yuemu-action-btn {
  flex: 1; padding: 8px 0; border-radius: 8px; border: 1px solid var(--border-color);
  font-size: 13px; font-weight: 500; background-color: var(--card-background);
}
.yuemu-danger { color: var(--comment-delete-hover-color); }

.yuemu-mobile-pagination { margin-top: 24px; }
.yuemu-page-info { display: flex; justify-content: center; align-items: center; gap: 12px; margin-bottom: 12px; }
.yuemu-page-size-trigger {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 10px; background-color: var(--hover-background);
  border-radius: 12px; color: var(--link-color); border: 1px solid var(--border-color);
}

:deep(.yuemu-confirm-modal) {
  .ant-modal-content { background-color: var(--card-background); border: 1px solid var(--border-color); border-radius: 16px; padding: 0; }
  .ant-modal-body { padding: 24px; }
}
.yuemu-confirm-content { text-align: center; padding-top: 10px; }
.yuemu-icon-wrap { font-size: 44px; color: var(--comment-delete-hover-color); margin-bottom: 12px; }
.yuemu-confirm-title { font-size: 17px; font-weight: 600; margin-bottom: 8px; }
.yuemu-confirm-desc { font-size: 13px; color: var(--text-secondary); margin-bottom: 20px; line-height: 1.4; }

.yuemu-confirm-actions { display: flex; border-top: 1px solid var(--border-color); margin: 0 -24px -24px; }
.yuemu-confirm-actions button {
  flex: 1; background: transparent; border: none; height: 50px; font-size: 16px; font-weight: 500; cursor: pointer;
}
.yuemu-cancel-btn { color: var(--text-primary); border-right: 1px solid var(--border-color) !important; border-bottom-left-radius: 16px; }
.yuemu-execute-btn { color: var(--comment-delete-hover-color); font-weight: 600; border-bottom-right-radius: 16px; }
</style>
