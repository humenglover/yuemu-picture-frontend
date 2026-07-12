<template>
  <div id="yuemu-tag-manage-page">
    <template v-if="device === DEVICE_TYPE_ENUM.PC">
      <div class="yuemu-pc-dashboard">
        <header class="yuemu-dashboard-header">
          <div class="yuemu-header-left">
            <h1 class="yuemu-page-title"> {{ t('pages.admin.tagManagePage.title') }} </h1>
            <p class="yuemu-page-desc"> {{ t('pages.admin.tagManagePage.desc') }} </p>
          </div>
          <div class="yuemu-header-right">
            <a-button type="primary" class="yuemu-btn-primary" @click="showAddModal">
              <PlusOutlined /> {{ t('pages.admin.tagManagePage.createTagBtn') }}
            </a-button>
          </div>
        </header>

        <div class="yuemu-filter-bar">
          <a-form layout="inline" :model="searchParams" class="yuemu-filter-form" @finish="doSearch">
            <a-form-item>
              <a-input
                v-model:value="searchParams.tagName"
                :placeholder="t('pages.admin.tagManagePage.searchTagName')"
                allow-clear
                class="yuemu-input-base"
                style="width: 280px"
              >
                <template #prefix><SearchOutlined class="yuemu-text-secondary" /></template>
              </a-input>
            </a-form-item>
            <a-form-item>
              <a-button type="primary" html-type="submit" class="yuemu-btn-primary">
                {{ t('pages.admin.tagManagePage.searchBtn') }}
              </a-button>
            </a-form-item>
          </a-form>
        </div>

        <div class="yuemu-table-container">
          <a-spin :tip="t('pages.admin.tagManagePage.loadingText')" :spinning="loading">
            <a-table
              rowKey="id"
              :columns="columns"
              :data-source="tagList"
              :pagination="false"
              @change="handleTableChange"
              class="yuemu-seamless-table"
              :scroll="{ x: 800 }"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.dataIndex === 'id'">
                  <span class="yuemu-text-mono yuemu-text-secondary">#{{ record.id }}</span>
                </template>

                <template v-if="column.dataIndex === 'tagName'">
                  <span class="yuemu-badge yuemu-bg-blue">
                    <TagOutlined style="margin-right: 4px;" />
                    {{ record.tagName }}
                  </span>
                </template>

                <template v-if="column.dataIndex === 'createTime'">
                  <span class="yuemu-text-secondary">
                    {{ dayjs(record.createTime).format('YYYY-MM-DD HH:mm:ss') }}
                  </span>
                </template>

                <template v-if="column.key === 'action'">
                  <div class="yuemu-action-cell">
                    <button class="yuemu-icon-text-btn yuemu-color-danger" @click="showDeleteConfirm(record)">{{ t('pages.admin.tagManagePage.deleteBtn') }}</button>
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
            :show-total="(total) => t('pages.admin.tagManagePage.totalTagText', { total })"
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
            <h1 class="yuemu-m-title"> {{ t('pages.admin.tagManagePage.title') }} </h1>
            <div class="yuemu-m-actions">
              <van-button icon="plus" size="small" type="primary" round class="yuemu-m-primary-btn" @click="showAddModal" />
            </div>
          </div>

          <div class="yuemu-m-search-row">
            <van-search
              v-model="searchParams.tagName"
              :placeholder="t('pages.admin.tagManagePage.searchTagName')"
              shape="round"
              class="yuemu-m-search"
              @search="doSearch"
              clearable
            />
          </div>
        </div>

        <div class="yuemu-m-scroll-view">
          <div class="yuemu-m-card-list">
            <div v-for="tag in tagList" :key="tag.id" class="yuemu-m-card">
              <div class="yuemu-m-card-header">
                <div class="yuemu-m-icon-square yuemu-bg-blue">
                  <TagOutlined />
                </div>
                <div class="yuemu-m-main-info">
                  <span class="yuemu-m-card-title">{{ tag.tagName }}</span>
                  <span class="yuemu-text-secondary yuemu-text-mono" style="font-size: 12px; margin-top: 2px;">ID: {{ tag.id }}</span>
                </div>
              </div>

              <div class="yuemu-m-card-body">
                <div class="yuemu-text-secondary" style="font-size: 13px;">
                  <div class="yuemu-tag-time">{{ t('pages.admin.tagManagePage.createdAt') }}{{ dayjs(tag.createTime).format('YYYY-MM-DD HH:mm') }}</div>
                </div>
              </div>

              <div class="yuemu-m-card-actions">
                <button class="yuemu-m-action-btn yuemu-danger" @click="showDeleteConfirm(tag)"> {{ t('pages.admin.tagManagePage.deleteTag') }} </button>
              </div>
            </div>
          </div>

          <van-empty v-if="tagList.length === 0 && !loading" :description="t('pages.admin.tagManagePage.noTagData')" />

          <div class="yuemu-m-pagination" v-if="total > 0">
            <div class="yuemu-m-page-info yuemu-text-secondary">
              <span>{{ t('pages.admin.tagManagePage.totalRecordsText2', { total }) }}</span>
              <span class="yuemu-m-page-size-trigger" @click="showPageSizeSheet = true">
                {{ searchParams.pageSize }} {{ t('pages.admin.tagManagePage.recordsPerPage') }}
                <van-icon name="arrow-down" />
              </span>
            </div>
            <van-pagination :prev-text="t('pages.admin.tagManagePage.prevPage')" :next-text="t('pages.admin.tagManagePage.nextPage')"
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
          :actions="pageSizeOptions"
          :cancel-text="t('pages.admin.tagManagePage.cancelBtn')"
          close-on-click-action
          @select="handlePageSizeChange"
          class="yuemu-dark-action-sheet"
          teleport="body"
        />
      </div>
    </template>

    <a-modal
      v-model:open="addModalVisible"
      :title="t('pages.admin.tagManagePage.addContentTag')"
      :footer="null"
      class="yuemu-apple-modal"
      centered
      width="400px"
    >
      <div class="yuemu-modal-form">
        <div class="yuemu-form-item">
          <label> {{ t('pages.admin.tagManagePage.tagName') }} <span class="yuemu-required">*</span></label>
          <a-input
            v-model:value="addForm.tagName"
            :placeholder="t('pages.admin.tagManagePage.tagNamePlaceholder')"
            class="yuemu-input-base"
            @keyup.enter="handleAdd"
          />
        </div>
        <div class="yuemu-modal-footer">
          <button class="yuemu-btn-secondary" @click="addModalVisible = false">{{ t('pages.admin.tagManagePage.cancelBtn') }}</button>
          <button class="yuemu-btn-primary-gradient" :disabled="!addForm.tagName.trim() || addLoading" @click="handleAdd">
            {{ addLoading ? t('pages.admin.tagManagePage.adding') : t('pages.admin.tagManagePage.confirmAddBtn') }}
          </button>
        </div>
      </div>
    </a-modal>

    <a-modal
      v-model:open="deleteConfirmVisible"
      :title="null"
      :footer="null"
      :width="360"
      class="yuemu-apple-modal"
      centered
    >
      <div class="yuemu-confirm-content">
        <div class="yuemu-icon-warning"><ExclamationCircleFilled /></div>
        <h3 class="yuemu-confirm-title"> {{ t('pages.admin.tagManagePage.permanentDelete') }} </h3>
        <p class="yuemu-confirm-desc">「{{ selectedTag?.tagName }}」<br> {{ t('pages.admin.tagManagePage.deleteWarning') }} </p>
        <div class="yuemu-confirm-actions">
          <button class="yuemu-action-cancel" @click="deleteConfirmVisible = false">{{ t('pages.admin.tagManagePage.cancelBtn') }}</button>
          <button class="yuemu-action-danger" @click="confirmDelete">{{ t('pages.admin.tagManagePage.deleteBtn') }}</button>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import { computed, onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import {
  addTagUsingPost,
  deleteTagUsingPost,
  listTagVoByPageUsingPost,
} from '@/api/tagController.ts'
import dayjs from 'dayjs'
import { PlusOutlined, SearchOutlined, ExclamationCircleFilled, TagOutlined } from '@ant-design/icons-vue'
import { DEVICE_TYPE_ENUM } from '@/constants/device'
import { getDeviceType } from '@/utils/device'

type SearchParams = {
  current: number
  pageSize: number
  tagName?: string
  sortField?: string
  sortOrder?: string
}

const columns = [
  { title: t('pages.admin.tagManagePage.tagId'), dataIndex: 'id', key: 'id', width: 180 },
  { title: t('pages.admin.tagManagePage.colTagName'), dataIndex: 'tagName', key: 'tagName' },
  { title: t('pages.admin.tagManagePage.colCreateTime'), dataIndex: 'createTime', key: 'createTime', width: 220 },
  { title: t('pages.admin.tagManagePage.colAction'), key: 'action', width: 120, align: 'right' },
]

const tagList = ref([])
const total = ref(0)
const loading = ref(false)
const searchParams = reactive<SearchParams>({
  current: 1,
  pageSize: 10,
  sortField: 'createTime',
  sortOrder: 'descend', // 默认按最新创建的降序，体验更好
  tagName: '',
})

const pcPageSizeOptions = ['10', '20', '30', '50']
const pageSizeOptions = [
  { name: t('pages.admin.tagManagePage.pageSize10'), value: 10 },
  { name: t('pages.admin.tagManagePage.pageSize20'), value: 20 },
  { name: t('pages.admin.tagManagePage.pageSize30'), value: 30 },
  { name: t('pages.admin.tagManagePage.pageSize50'), value: 50 },
]

const addModalVisible = ref(false)
const addLoading = ref(false)
const addForm = reactive({ tagName: '' })
const device = ref<string>('')
const showPageSizeSheet = ref(false)

onMounted(async () => {
  device.value = await getDeviceType()
  getTagList()
})

const getTagList = async () => {
  loading.value = true
  try {
    const res = await listTagVoByPageUsingPost({ ...searchParams })
    if (res.data.code === 0 && res.data.data) {
      tagList.value = res.data.data.records
      total.value = parseInt(res.data.data.total)
    } else {
      message.error(t('pages.admin.tagManagePage.fetchListFail'))
    }
  } catch (error) {
    message.error(t('pages.admin.tagManagePage.networkErr'))
  } finally {
    loading.value = false
  }
}

const onShowSizeChange = (current: number, pageSize: number) => {
  searchParams.current = 1
  searchParams.pageSize = pageSize
  getTagList()
}

const onPageChange = (page: number, pageSize: number) => {
  searchParams.current = page
  searchParams.pageSize = pageSize
  getTagList()
}

const handleTableChange = (paginationParam: any, filters: any, sorter: any) => {
  if (sorter && sorter.field && sorter.order) {
    searchParams.sortField = sorter.field
    searchParams.sortOrder = sorter.order === 'ascend' ? 'ascend' : 'descend'
  }
  getTagList()
}

const doSearch = () => {
  searchParams.current = 1
  getTagList()
}

const showAddModal = () => {
  addForm.tagName = ''
  addModalVisible.value = true
}

const handleAdd = async () => {
  const tagNameValue = addForm.tagName.trim()
  if (!tagNameValue) {
    message.warning(t('pages.admin.tagManagePage.inputTagName'))
    return
  }
  if (addLoading.value) return // 防抖处理

  addLoading.value = true
  try {
    const res = await addTagUsingPost({ tagName: tagNameValue })
    if (res.data.code === 0) {
      message.success(t('pages.admin.tagManagePage.addSuccessText'))
      addModalVisible.value = false
      getTagList()
    } else {
      message.error(res.data.message || t('pages.admin.tagManagePage.addFail'))
    }
  } catch (error) {
    message.error(t('pages.admin.tagManagePage.addFailNetwork'))
  } finally {
    addLoading.value = false
  }
}

const deleteConfirmVisible = ref(false)
const selectedTag = ref<API.TagVO | null>(null)

const showDeleteConfirm = (tag: API.TagVO) => {
  selectedTag.value = tag
  deleteConfirmVisible.value = true
}

const confirmDelete = async () => {
  if (!selectedTag.value?.id) return
  try {
    const res = await deleteTagUsingPost({ id: selectedTag.value.id })
    if (res.data.code === 0) {
      message.success(t('pages.admin.tagManagePage.deleteSuccess'))
      deleteConfirmVisible.value = false
      getTagList()
    } else {
      message.error(res.data.message || t('pages.admin.tagManagePage.deleteFailText'))
    }
  } catch (error) {
    message.error(t('pages.admin.tagManagePage.deleteFailRetry'))
  }
}

const onMobilePageChange = (page: number) => {
  searchParams.current = page
  getTagList()
  document.querySelector('.yuemu-m-scroll-view')?.scrollTo({ top: 0, behavior: 'smooth' })
}

const handlePageSizeChange = (action: { value: number }) => {
  searchParams.current = 1
  searchParams.pageSize = action.value
  getTagList()
  showPageSizeSheet.value = false
}
</script>

<style scoped>
/* ==================== 1. 基础全局配置 ==================== */
#yuemu-tag-manage-page {
  min-height: 100vh;
  background-color: var(--background);
  color: var(--text-primary);
  transition: var(--theme-transition);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.yuemu-text-secondary { color: var(--text-secondary); }
.yuemu-text-mono { font-family: monospace; }

/* ==================== 2. PC 端工作台 ==================== */
.yuemu-pc-dashboard {
  padding: 32px 24px;
  max-width: 1400px;
  margin: 0 auto;
}

/* 头部面板 */
.yuemu-dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 24px;
}
.yuemu-page-title { margin: 0; font-size: 26px; font-weight: 800; color: var(--text-primary); letter-spacing: 0.5px; }
.yuemu-page-desc { margin: 4px 0 0 0; font-size: 14px; color: var(--text-secondary); opacity: 0.8; }
.yuemu-header-right { display: flex; gap: 12px; }

/* 检索过滤栏 */
.yuemu-filter-bar {
  background: var(--card-background);
  border-radius: 16px;
  padding: 16px 20px;
  border: 1px solid var(--border-color);
  box-shadow: 0 4px 20px var(--shadow-color);
  margin-bottom: 24px;
}
.yuemu-filter-form { display: flex; flex-wrap: wrap; gap: 12px; width: 100%; }

/* ==================== 3. 基础 UI 组件覆写 (核心暗色适配) ==================== */
/* 按钮 */
.yuemu-btn-primary {
  background: var(--link-color) !important; color: #fff !important; border: none !important; border-radius: 8px !important; font-weight: 500; height: 36px; padding: 0 16px; box-shadow: 0 4px 12px rgba(var(--link-color-rgb), 0.25);
}
.yuemu-btn-primary:hover { filter: brightness(1.1); }

/* 输入框 */
:deep(.yuemu-input-base), :deep(.yuemu-input-base > .ant-input) {
  background-color: var(--hover-background) !important;
  border: 1px solid var(--border-color) !important;
  color: var(--text-primary) !important;
  border-radius: 8px !important;
  box-shadow: none !important;
  transition: all 0.3s;
}
:deep(.yuemu-input-base.ant-input-affix-wrapper) { background-color: var(--hover-background) !important; }
:deep(.yuemu-input-base.ant-input-affix-wrapper > input.ant-input) { background-color: transparent !important; border: none !important; color: var(--text-primary) !important; }
:deep(.yuemu-input-base:hover), :deep(.yuemu-input-base.ant-input-affix-wrapper:hover), :deep(.yuemu-input-base:focus-within) {
  border-color: var(--link-color) !important;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1) !important;
}
:deep(.ant-input::placeholder), :deep(.ant-input-affix-wrapper input::placeholder) { color: var(--text-secondary) !important; opacity: 0.6; }
:deep(.ant-input-clear-icon) { color: var(--text-secondary) !important; background-color: transparent !important; }
:deep(.ant-input-clear-icon:hover) { color: var(--text-primary) !important; }

/* 弹层黑夜模式 */
@media (prefers-color-scheme: dark) {
  .yuemu-apple-modal .ant-modal-content { background: #1f1f1f !important; border: 1px solid #333 !important; color: #fff !important; }
  .yuemu-apple-modal .ant-modal-header { background: #1f1f1f !important; border-bottom: 1px solid #333 !important; }
  .yuemu-apple-modal .ant-modal-title { color: #fff !important; }
  .ant-modal-close { color: #999 !important; }
}

/* ==================== 4. 表格无界感重构 ==================== */
.yuemu-table-container {
  background: var(--card-background);
  border-radius: 20px;
  border: 1px solid var(--border-color);
  padding: 8px;
  box-shadow: 0 8px 30px var(--shadow-color);
}

:deep(.yuemu-seamless-table) {
  .ant-table { background: transparent !important; color: var(--text-primary) !important; }
  .ant-table-thead > tr > th {
    background: transparent !important; border-bottom: 1px solid var(--border-color) !important; color: var(--text-secondary) !important; font-weight: 600; font-size: 13px; text-transform: uppercase;
  }
  .ant-table-thead > tr > th::before { display: none !important; }
  .ant-table-tbody > tr > td {
    background: transparent !important; border-bottom: 1px solid var(--border-color) !important; padding: 16px !important; transition: background 0.3s;
  }
  .ant-table-tbody > tr:hover > td { background: var(--hover-background) !important; }
}

/* 小标签设计 */
.yuemu-badge { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 6px; font-size: 13px; font-weight: 500; gap: 4px; }
.yuemu-bg-blue { background: rgba(59, 130, 246, 0.15); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.2); }

.yuemu-action-cell { display: flex; flex-wrap: wrap; gap: 4px; justify-content: flex-end; }
.yuemu-icon-text-btn { background: transparent; border: none; padding: 4px 12px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; transition: 0.2s; }
.yuemu-icon-text-btn:hover { background: var(--hover-background); }
.yuemu-color-danger { color: #ef4444; }

/* 分页 */
.yuemu-pagination-bar { margin-top: 24px; display: flex; justify-content: flex-end; }
:deep(.ant-pagination-item), :deep(.ant-pagination-prev), :deep(.ant-pagination-next) { background: transparent !important; border-color: var(--border-color) !important; }
:deep(.ant-pagination-item a) { color: var(--text-primary) !important; }
:deep(.ant-pagination-item-active) { border-color: var(--link-color) !important; background: var(--hover-background) !important; }
:deep(.ant-pagination-item-active a) { color: var(--link-color) !important; }
:deep(.ant-select-selector) { background: transparent !important; border-color: var(--border-color) !important; color: var(--text-primary) !important;}
:deep(.ant-pagination-options-quick-jumper input) { background: transparent !important; border-color: var(--border-color) !important; color: var(--text-primary) !important;}

/* ==================== 5. 移动端 Feed 瀑布流 ==================== */
.yuemu-m-container { min-height: 100vh; display: flex; flex-direction: column; }

.yuemu-m-sticky-header {
  position: sticky; top: 0; z-index: 100; padding: 12px 16px;
  background: rgba(var(--header-background-rgb, 255,255,255), 0.85);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-color);
}
@media (prefers-color-scheme: dark) { .yuemu-m-sticky-header { background: rgba(30,30,30,0.85); } }

.yuemu-m-header-main { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.yuemu-m-title { font-size: 24px; font-weight: 800; color: var(--text-primary); margin: 0; }
.yuemu-m-actions { display: flex; gap: 10px; }
.yuemu-m-primary-btn { background: var(--link-color) !important; border: none !important; width: 32px; height: 32px; box-shadow: 0 2px 8px var(--shadow-color); }

.yuemu-m-search-row { display: flex; align-items: center; gap: 12px; }
:deep(.yuemu-m-search) { flex: 1; padding: 0 !important; background: transparent !important; }
:deep(.van-search__content) { background: var(--hover-background) !important; border: 1px solid var(--border-color); border-radius: 12px; }
:deep(.van-field__control) { color: var(--text-primary) !important; }
:deep(.van-field__control::placeholder) { color: var(--text-secondary) !important; }
:deep(.yuemu-m-search .van-icon) { color: var(--text-secondary) !important; }

.yuemu-m-scroll-view { flex: 1; overflow-y: auto; padding: 16px; }
.yuemu-m-card-list { display: flex; flex-direction: column; gap: 16px; }

.yuemu-m-card {
  background: var(--card-background); border: 1px solid var(--border-color);
  border-radius: 20px; padding: 16px; box-shadow: 0 4px 12px var(--shadow-color);
}
.yuemu-m-card-header { display: flex; gap: 12px; align-items: center; margin-bottom: 12px; }
.yuemu-m-icon-square {
  width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
  display: flex; justify-content: center; align-items: center; font-size: 20px;
}
.yuemu-m-main-info { flex: 1; display: flex; flex-direction: column; }
.yuemu-m-card-title { font-size: 17px; font-weight: 700; color: var(--text-primary); }

.yuemu-m-card-body { margin-bottom: 16px; }

.yuemu-m-card-actions { display: flex; gap: 8px; border-top: 1px solid var(--border-color); padding-top: 16px; }
.yuemu-m-action-btn { flex: 1; padding: 8px 0; border-radius: 10px; border: 1px solid var(--border-color); background: var(--card-background); font-size: 13px; font-weight: 600; }
.yuemu-m-action-btn.yuemu-danger { color: #ef4444; border-color: rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.05); }

/* 移动端分页 */
.yuemu-m-pagination { margin-top: 24px; padding-bottom: 20px; }
.yuemu-m-page-info { display: flex; justify-content: center; align-items: center; gap: 12px; font-size: 12px; margin-bottom: 12px; }
.yuemu-m-page-size-trigger { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; background: var(--hover-background); border-radius: 12px; cursor: pointer; color: var(--link-color); border: 1px solid var(--border-color); }
:deep(.yuemu-dark-van-pagination .van-pagination__item) { background: transparent; border: 1px solid var(--border-color); color: var(--text-primary); }
:deep(.yuemu-dark-van-pagination .van-pagination__item--active) { background: var(--link-color); color: #fff; border-color: var(--link-color); border-radius: 8px; }



/* ==================== 6. Apple 风格表单弹窗 ==================== */
:deep(.yuemu-apple-modal .ant-modal-content) { background: var(--card-background); border-radius: 20px; padding: 0; overflow: hidden; border: 1px solid var(--border-color); }
:deep(.yuemu-apple-modal .ant-modal-header) { background: var(--card-background); padding: 20px 24px; border-bottom: 1px solid var(--border-color); }
:deep(.yuemu-apple-modal .ant-modal-title) { font-weight: 700; font-size: 18px; text-align: center; }

.yuemu-modal-form { padding: 24px; }
.yuemu-form-item { margin-bottom: 16px; }
.yuemu-form-item label { display: block; font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 8px; }
.yuemu-required { color: #ef4444; }

.yuemu-modal-footer { display: flex; gap: 12px; margin-top: 32px; }
.yuemu-btn-secondary { flex: 1; padding: 12px; border-radius: 14px; background: var(--hover-background); color: var(--text-primary); font-weight: 600; border: 1px solid var(--border-color); cursor: pointer; }
.yuemu-btn-primary-gradient { flex: 2; padding: 12px; border-radius: 14px; background: linear-gradient(135deg, var(--link-color), var(--link-hover-color)); color: #fff; font-weight: 600; border: none; box-shadow: 0 4px 15px rgba(var(--link-color-rgb), 0.3); cursor: pointer; }
.yuemu-btn-primary-gradient:disabled { opacity: 0.6; cursor: not-allowed; }

.yuemu-confirm-content { text-align: center; padding: 24px; }
.yuemu-icon-warning { font-size: 48px; color: #ef4444; margin-bottom: 16px; }
.yuemu-confirm-title { font-size: 18px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px; }
.yuemu-confirm-desc { font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 24px; }
.yuemu-confirm-actions { display: flex; border-top: 1px solid var(--border-color); margin: 0 -24px -24px; }
.yuemu-action-cancel, .yuemu-action-danger { flex: 1; height: 50px; background: transparent; border: none; font-size: 16px; font-weight: 600; cursor: pointer; }
.yuemu-action-cancel { color: var(--text-primary); border-right: 1px solid var(--border-color); }
.yuemu-action-danger { color: #ef4444; }
.yuemu-action-cancel:hover, .yuemu-action-danger:hover { background: var(--hover-background); }
</style>
