<template>
  <div id="yuemu-categoryManagePage">
    <template v-if="device === DEVICE_TYPE_ENUM.PC">
      <div class="yuemu-pc-container">
        <div class="yuemu-header-panel">
          <div class="yuemu-header-main-row">
            <div class="yuemu-page-info">
              <h1 class="yuemu-page-title">{{ t('pages.admin.categoryManagePage.title') }}</h1>
              <p class="yuemu-text-secondary" style="margin: 4px 0 0 0; font-size: 13px;">{{ t('pages.admin.categoryManagePage.desc') }}</p>
            </div>
            <div class="yuemu-action-group">
              <a-button type="primary" class="yuemu-btn-primary" @click="showAddModal">
                <PlusOutlined /> {{ t('pages.admin.categoryManagePage.addCategory') }}
              </a-button>
            </div>
          </div>

          <div class="yuemu-search-form">
            <a-radio-group v-model:value="searchParams.type" @change="handleTypeChange" class="yuemu-radio-group">
              <a-radio-button :value="0">{{ t('pages.admin.categoryManagePage.picCategory') }}</a-radio-button>
              <a-radio-button :value="1">{{ t('pages.admin.categoryManagePage.postCategory') }}</a-radio-button>
              <a-radio-button :value="2">{{ t('pages.admin.categoryManagePage.audioCategory') }}</a-radio-button>
            </a-radio-group>

            <a-input
              v-model:value="searchParams.categoryName"
              :placeholder="t('pages.admin.categoryManagePage.searchPlaceholder')"
              allowClear
              @change="doSearch"
              class="yuemu-input"
              style="width: 240px; margin-left: auto;"
            >
              <template #prefix><SearchOutlined class="yuemu-text-secondary" /></template>
            </a-input>
          </div>
        </div>

        <div class="yuemu-table-wrapper">
          <a-table
            :columns="columns"
            :data-source="categoryList"
            :pagination="false"
            @change="handleTableChange"
            rowKey="id"
            class="yuemu-table"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.dataIndex === 'categoryName'">
                <strong>{{ record.categoryName }}</strong>
              </template>
              <template v-if="column.dataIndex === 'type'">
                <span class="yuemu-tag" :class="'yuemu-type-' + getTypeColor(record.type)">
                  {{ getTypeText(record.type) }}
                </span>
              </template>
              <template v-if="column.dataIndex === 'createTime'">
                <span class="yuemu-text-secondary">
                  {{ dayjs(record.createTime).format('YYYY-MM-DD HH:mm:ss') }}
                </span>
              </template>
              <template v-else-if="column.key === 'action'">
                <div class="yuemu-mac-action-buttons">
                  <a-button type="text" class="yuemu-btn-text-red" @click="showDeleteConfirm(record)"> {{ t('pages.admin.categoryManagePage.delete') }} </a-button>
                </div>
              </template>
            </template>
          </a-table>
        </div>

        <div class="yuemu-pagination">
          <a-pagination
            v-model:current="searchParams.current"
            :page-size-options="pcPageSizeOptions"
            :total="total"
            :show-total="(total) => t('pages.admin.categoryManagePage.totalCategories', { total })"
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
            <h1 class="yuemu-page-title">{{ t('pages.admin.categoryManagePage.title') }}</h1>
            <van-button icon="plus" size="small" type="primary" round class="yuemu-btn-icon" @click="showAddModal" />
          </div>

          <div class="yuemu-mobile-tabs-wrapper">
            <van-tabs v-model:active="searchParams.type" @change="handleTypeChange" class="yuemu-van-tabs">
              <van-tab :name="0" :title="t('pages.admin.categoryManagePage.picCategory')" />
              <van-tab :name="1" :title="t('pages.admin.categoryManagePage.postCategory')" />
              <van-tab :name="2" :title="t('pages.admin.categoryManagePage.audioCategory')" />
            </van-tabs>
          </div>

          <div class="yuemu-search-bar-wrapper">
            <van-search
              v-model="searchParams.categoryName"
              :placeholder="t('pages.admin.categoryManagePage.searchPlaceholder')"
              class="yuemu-search"
              shape="round"
              @search="doSearch"
              clearable
            />
          </div>
        </div>

        <div class="yuemu-mobile-content-scroll">
          <div class="yuemu-card-list">
            <div v-for="category in categoryList" :key="category.id" class="yuemu-category-card">
              <div class="yuemu-card-header">
                <div class="yuemu-main-info">
                  <div class="yuemu-title-row">
                    <span class="yuemu-category-name">{{ category.categoryName }}</span>
                    <span class="yuemu-tag yuemu-mini" :class="'yuemu-type-' + getTypeColor(category.type)">
                      {{ getTypeText(category.type) }}
                    </span>
                  </div>
                  <div class="yuemu-meta-row yuemu-text-secondary">
                    <span>ID: {{ category.id }}</span>
                    <span>{{ dayjs(category.createTime).format('YYYY-MM-DD HH:mm') }}</span>
                  </div>
                </div>
              </div>
              <div class="yuemu-card-actions">
                <button class="yuemu-action-btn yuemu-danger" @click="showDeleteConfirm(category)">{{ t('pages.admin.categoryManagePage.deleteCategory') }}</button>
              </div>
            </div>
          </div>

          <div class="yuemu-mobile-pagination">
            <div class="yuemu-page-info yuemu-text-secondary">
              <span>{{ t('pages.admin.categoryManagePage.total', { total }) }}</span>
              <span class="yuemu-page-size-trigger" @click="showPageSizeSheet = true">
                {{ t('pages.admin.categoryManagePage.pageSize', { size: searchParams.pageSize }) }}
                <van-icon name="arrow-down" />
              </span>
            </div>
            <van-pagination :prev-text="t('pages.admin.categoryManagePage.prevPage')" :next-text="t('pages.admin.categoryManagePage.nextPage')"
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
          :cancel-text="t('pages.admin.categoryManagePage.cancel')"
          close-on-click-action
          @select="handlePageSizeChange"
          class="yuemu-action-sheet"
        />
      </div>
    </template>

    <template v-if="device === DEVICE_TYPE_ENUM.PC">
      <a-modal
        v-model:open="addModalVisible"
        :title="t('pages.admin.categoryManagePage.addCategoryTitle')"
        :footer="null"
        class="yuemu-modal"
        destroyOnClose
      >
        <a-form :model="addForm" ref="addFormRef" class="yuemu-form">
          <div class="yuemu-form-item">
            <label>{{ t('pages.admin.categoryManagePage.categoryType') }} <span class="yuemu-required">*</span></label>
            <a-radio-group v-model:value="addForm.type" class="yuemu-radio-group">
              <a-radio-button :value="0">{{ t('pages.admin.categoryManagePage.picCategory') }}</a-radio-button>
              <a-radio-button :value="1">{{ t('pages.admin.categoryManagePage.postCategory') }}</a-radio-button>
              <a-radio-button :value="2">{{ t('pages.admin.categoryManagePage.audioCategory') }}</a-radio-button>
            </a-radio-group>
          </div>
          <div class="yuemu-form-item">
            <label>{{ t('pages.admin.categoryManagePage.categoryName') }} <span class="yuemu-required">*</span></label>
            <a-input v-model:value="addForm.categoryName" :placeholder="t('pages.admin.categoryManagePage.categoryNamePlaceholder')" class="yuemu-input" />
          </div>
          <div class="yuemu-modal-footer">
            <a-button class="yuemu-btn-ghost" @click="addModalVisible = false">{{ t('pages.admin.categoryManagePage.cancel') }}</a-button>
            <a-button type="primary" class="yuemu-btn-primary" @click="handleAdd">{{ t('pages.admin.categoryManagePage.confirmAdd') }}</a-button>
          </div>
        </a-form>
      </a-modal>
    </template>

    <template v-else>
      <van-dialog
        v-model:show="addModalVisible"
        :title="t('pages.admin.categoryManagePage.addCategoryTitle')"
        show-cancel-button
        :before-close="handleMobileAddDialogClose"
        class="yuemu-van-dialog"
      >
        <van-form ref="mobileAddFormRef" class="yuemu-van-form">
          <van-cell-group inset>
            <van-field
              v-model="addForm.typeText"
              is-link
              readonly
              :label="t('pages.admin.categoryManagePage.categoryType')"
              :placeholder="t('pages.admin.categoryManagePage.pleaseSelect')"
              @click="showAddTypePicker = true"
              :rules="[{ required: true }]"
            />
            <van-field
              v-model="addForm.categoryName"
              :label="t('pages.admin.categoryManagePage.categoryName')"
              :placeholder="t('pages.admin.categoryManagePage.enterName')"
              :rules="[{ required: true }]"
            />
          </van-cell-group>
        </van-form>
      </van-dialog>

      <van-popup v-model:show="showAddTypePicker" round position="bottom" class="yuemu-action-sheet">
        <van-picker
          :columns="[{text:t('pages.admin.categoryManagePage.picCategory'), value:0}, {text:t('pages.admin.categoryManagePage.postCategory'), value:1}, {text:t('pages.admin.categoryManagePage.audioCategory'), value:2}]"
          @confirm="onAddTypeConfirm"
          @cancel="showAddTypePicker = false"
          show-toolbar
          :title="t('pages.admin.categoryManagePage.selectCategoryType')"
        />
      </van-popup>
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
        <h3 class="yuemu-confirm-title">{{ t('pages.admin.categoryManagePage.confirmDeleteTitle') }}</h3>
        <p class="yuemu-confirm-desc">
          {{ t('pages.admin.categoryManagePage.categoryPrefix') }}{{ selectedCategory?.categoryName }}<br>
          {{ t('pages.admin.categoryManagePage.deleteWarning') }}
        </p>
        <div class="yuemu-confirm-actions">
          <button class="yuemu-cancel-btn" @click="deleteConfirmVisible = false">{{ t('pages.admin.categoryManagePage.cancel') }}</button>
          <button class="yuemu-danger-btn" @click="confirmDelete">{{ t('pages.admin.categoryManagePage.confirmDelete') }}</button>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined, SearchOutlined, ExclamationCircleFilled } from '@ant-design/icons-vue'
import { DEVICE_TYPE_ENUM } from '@/constants/device'
import { getDeviceType } from '@/utils/device'
import {
  addCategoryUsingPost,
  deleteCategoryUsingPost,
  listCategoryVoUsingPost,
} from '@/api/categoryController.ts'
import dayjs from 'dayjs'

type SearchParams = {
  current: number
  pageSize: number
  categoryName?: string
  sortField?: string
  sortOrder?: string
  type: number
}

const device = ref<string>('')

onMounted(async () => {
  device.value = await getDeviceType()
})

const columns = [
  { get title() { return t('pages.admin.categoryManagePage.colId') }, dataIndex: 'id', key: 'id', width: 100 },
  { get title() { return t('pages.admin.categoryManagePage.colCategoryName') }, dataIndex: 'categoryName', key: 'categoryName', width: 250 },
  { get title() { return t('pages.admin.categoryManagePage.colType') }, dataIndex: 'type', key: 'type', width: 150 },
  { get title() { return t('pages.admin.categoryManagePage.colCreateTime') }, dataIndex: 'createTime', key: 'createTime', width: 200 },
  { get title() { return t('pages.admin.categoryManagePage.colAction') }, key: 'action', width: 120, align: 'right' },
]

const searchParams = reactive<SearchParams>({
  current: 1,
  pageSize: 10,
  categoryName: '',
  sortField: 'createTime',
  sortOrder: 'ascend',
  type: 0,
})

const categoryList = ref([])
const total = ref(0)
const pcPageSizeOptions = ['10', '20', '30', '50']
const pageSizeOptions = [
  { get name() { return t('pages.admin.categoryManagePage.pageSize10') }, value: 10 },
  { get name() { return t('pages.admin.categoryManagePage.pageSize20') }, value: 20 },
  { get name() { return t('pages.admin.categoryManagePage.pageSize30') }, value: 30 },
  { get name() { return t('pages.admin.categoryManagePage.pageSize50') }, value: 50 },
]

const getCategoryList = async () => {
  try {
    const res = await listCategoryVoUsingPost({ ...searchParams })
    if (res.data.code === 0 && res.data.data) {
      categoryList.value = res.data.data.records
      total.value = res.data.data.total
    } else {
      message.error(t('pages.admin.categoryManagePage.fetchError'))
    }
  } catch (error) {
    message.error(t('pages.admin.categoryManagePage.fetchError'))
  }
}

onMounted(() => { getCategoryList() })

const onShowSizeChange = (current: number, pageSize: number) => {
  searchParams.current = 1
  searchParams.pageSize = pageSize
  getCategoryList()
}

const onPageChange = (page: number, pageSize: number) => {
  searchParams.current = page
  searchParams.pageSize = pageSize
  getCategoryList()
}

const handleTableChange = (paginationParam: any) => {
  searchParams.current = paginationParam.current
  searchParams.pageSize = paginationParam.pageSize
  if (paginationParam.sortField && paginationParam.sortOrder) {
    searchParams.sortField = paginationParam.sortField
    searchParams.sortOrder = paginationParam.sortOrder === 'ascend' ? 'ascend' : 'descend'
  }
  getCategoryList()
}

const doSearch = () => {
  searchParams.current = 1
  getCategoryList()
}

const handleTypeChange = () => {
  searchParams.current = 1
  getCategoryList()
}

const addModalVisible = ref(false)
const addForm = reactive({
  categoryName: '',
  type: 0,
  get typeText() { return t('pages.admin.categoryManagePage.picCategory') }
})

const showAddModal = () => {
  addForm.categoryName = ''
  addForm.type = searchParams.type
  addForm.typeText = getTypeText(searchParams.type)
  addModalVisible.value = true
}

const handleAdd = async () => {
  if (!addForm.categoryName.trim()) {
    message.error(t('pages.admin.categoryManagePage.enterCategoryName'))
    return false
  }
  try {
    const res = await addCategoryUsingPost({ categoryName: addForm.categoryName.trim(), type: addForm.type })
    if (res.data.code === 0) {
      message.success(t('pages.admin.categoryManagePage.addSuccess'))
      addModalVisible.value = false
      getCategoryList()
      return true
    } else {
      message.error(res.data.message || t('pages.admin.categoryManagePage.addFailed'))
      return false
    }
  } catch (error) {
    message.error(t('pages.admin.categoryManagePage.addError'))
    return false
  }
}

const showAddTypePicker = ref(false)
const mobileAddFormRef = ref()
const onAddTypeConfirm = (selected: { text: string, value: number }) => {
  addForm.type = selected.value
  addForm.typeText = selected.text
  showAddTypePicker.value = false
}
const handleMobileAddDialogClose = async (action: string) => {
  if (action === 'confirm') {
    try {
      await mobileAddFormRef.value?.validate()
      const success = await handleAdd()
      return success
    } catch {
      message.error(t('pages.admin.categoryManagePage.fillInfo'))
      return false
    }
  }
  return true
}

const deleteConfirmVisible = ref(false)
const selectedCategory = ref<API.CategoryVO | null>(null)

const showDeleteConfirm = (category: API.CategoryVO) => {
  selectedCategory.value = category
  deleteConfirmVisible.value = true
}

const confirmDelete = async () => {
  if (!selectedCategory.value?.id) return
  try {
    const res = await deleteCategoryUsingPost({ categoryId: selectedCategory.value.id })
    if (res.data.code === 0) {
      message.success(t('pages.admin.categoryManagePage.deleteSuccess'))
      deleteConfirmVisible.value = false
      getCategoryList()
    } else {
      message.error(t('pages.admin.categoryManagePage.deleteFailedPrefix') + res.data.message)
    }
  } catch (error) {
    message.error(t('pages.admin.categoryManagePage.deleteError'))
  }
}

const showPageSizeSheet = ref(false)

const onMobilePageChange = (page: number) => {
  searchParams.current = page
  getCategoryList()
}

const handlePageSizeChange = (action: { value: number }) => {
  searchParams.current = 1
  searchParams.pageSize = action.value
  showPageSizeSheet.value = false
  getCategoryList()
}

const getTypeColor = (type: number) => {
  switch (type) {
    case 0: return 'blue'
    case 1: return 'green'
    case 2: return 'purple'
    default: return 'gray'
  }
}

const getTypeText = (type: number) => {
  switch (type) {
    case 0: return t('pages.admin.categoryManagePage.picCategory')
    case 1: return t('pages.admin.categoryManagePage.postCategory')
    case 2: return t('pages.admin.categoryManagePage.audioCategory')
    default: return t('pages.admin.categoryManagePage.unknownType')
  }
}
</script>

<style scoped>
#yuemu-categoryManagePage {
  height: 100%;
  box-sizing: border-box;
  background-color: var(--background);
  color: var(--text-primary);
  transition: var(--theme-transition);
}
.yuemu-text-secondary { color: var(--text-secondary); }

/* ==================== PC 端样式 ==================== */
.yuemu-pc-container {
  padding: 16px;
  max-width: 1200px;
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

.yuemu-search-form { display: flex; align-items: center; flex-wrap: wrap; }

:deep(.yuemu-input), :deep(.ant-input-affix-wrapper) {
  background-color: var(--background) !important;
  color: var(--text-primary) !important;
  border-color: var(--border-color) !important;
  border-radius: 8px !important;
  box-shadow: none !important;
  transition: var(--theme-transition);
}
:deep(.yuemu-input input), :deep(.ant-input-affix-wrapper input) { background-color: transparent !important; color: var(--text-primary) !important; }
:deep(.yuemu-input input::placeholder), :deep(.ant-input-affix-wrapper input::placeholder) { color: var(--text-secondary) !important; }
:deep(.yuemu-input:focus-within), :deep(.ant-input-affix-wrapper-focused) { border-color: var(--link-color) !important; }

:deep(.yuemu-radio-group) {
  display: inline-flex;
  background-color: var(--background);
  padding: 4px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
}
:deep(.yuemu-radio-group .ant-radio-button-wrapper) {
  background-color: transparent;
  border: none !important;
  color: var(--text-secondary);
  border-radius: 6px !important;
  box-shadow: none !important;
  font-weight: 500;
  transition: all 0.2s ease;
}
:deep(.yuemu-radio-group .ant-radio-button-wrapper::before) { display: none !important; }
:deep(.yuemu-radio-group .ant-radio-button-wrapper-checked) {
  background-color: var(--card-background) !important;
  color: var(--text-primary) !important;
  box-shadow: 0 2px 8px var(--shadow-color) !important;
}

.yuemu-btn-primary { background-color: var(--link-color) !important; color: var(--text-other) !important; border: none !important; border-radius: 8px !important; font-weight: 500; transition: var(--theme-transition); }
.yuemu-btn-primary:hover { background-color: var(--link-hover-color) !important; }
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
.yuemu-tag.yuemu-type-blue { background-color: rgba(59, 130, 246, 0.1); color: #3b82f6; border-color: rgba(59, 130, 246, 0.2); }
.yuemu-tag.yuemu-type-green { background-color: rgba(16, 185, 129, 0.1); color: #10b981; border-color: rgba(16, 185, 129, 0.2); }
.yuemu-tag.yuemu-type-purple { background-color: rgba(168, 85, 247, 0.1); color: #a855f7; border-color: rgba(168, 85, 247, 0.2); }

.yuemu-mac-action-buttons { display: flex; justify-content: flex-end; gap: 4px; }
.yuemu-btn-text-red { color: var(--comment-delete-hover-color) !important; }

.yuemu-pagination { margin-top: 24px; display: flex; justify-content: flex-end; }
:deep(.ant-pagination-item) { background-color: transparent; border-color: var(--border-color); }
:deep(.ant-pagination-item-active) { background-color: var(--hover-background); border-color: var(--link-color); }

/* ==================== 移动端样式 ==================== */
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
.yuemu-btn-icon { background-color: var(--link-color) !important; border: none !important; width: 32px; height: 32px; }

.yuemu-mobile-tabs-wrapper { margin: 0 -16px 12px; }
:deep(.yuemu-van-tabs .van-tabs__nav) { background-color: transparent; }
:deep(.yuemu-van-tabs .van-tab--active) { color: var(--text-primary); font-weight: 600; }
:deep(.yuemu-van-tabs .van-tabs__line) { background-color: var(--link-color); bottom: 20px; width: 24px; }

.yuemu-search-bar-wrapper { margin-bottom: 4px; }
:deep(.yuemu-search) { padding: 0 !important; background-color: transparent !important; }
:deep(.yuemu-search .van-search__content) { background-color: var(--hover-background); border: 1px solid var(--border-color); }

.yuemu-mobile-content-scroll { flex: 1; padding: 12px 16px 32px; overflow-y: auto; }
.yuemu-card-list { display: flex; flex-direction: column; gap: 16px; }

.yuemu-category-card {
  background-color: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 4px 12px var(--shadow-color);
  transition: var(--theme-transition);
}

.yuemu-card-header { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 16px; }
.yuemu-main-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
.yuemu-title-row { display: flex; align-items: center; justify-content: space-between; }
.yuemu-category-name { font-size: 16px; font-weight: 600; color: var(--text-primary); }
.yuemu-meta-row { display: flex; justify-content: space-between; font-size: 13px; }

.yuemu-card-actions {
  display: flex; gap: 8px; border-top: 1px solid var(--border-color); padding-top: 12px;
}
.yuemu-action-btn {
  flex: 1; padding: 8px 0; border-radius: 8px; border: 1px solid var(--border-color);
  font-size: 13px; font-weight: 500; background-color: var(--card-background); color: var(--text-primary);
}
.yuemu-action-btn.yuemu-danger { color: var(--comment-delete-hover-color); }

.yuemu-mobile-pagination { margin-top: 24px; }
.yuemu-page-info { display: flex; justify-content: center; align-items: center; gap: 12px; font-size: 12px; margin-bottom: 12px; }
.yuemu-page-size-trigger { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; background-color: var(--hover-background); border-radius: 12px; color: var(--link-color); border: 1px solid var(--border-color); }
:deep(.yuemu-van-pagination .van-pagination__item--active) { background-color: var(--link-color); color: var(--text-other); }

:deep(.yuemu-action-sheet) { background-color: var(--card-background); color: var(--text-primary); }
:deep(.yuemu-action-sheet .van-action-sheet__item) { background-color: var(--card-background); color: var(--text-primary); border-bottom: 1px solid var(--border-color); }

/* ==================== 统一弹窗 ==================== */
:deep(.yuemu-modal .ant-modal-content), :deep(.yuemu-confirm-modal .ant-modal-content) {
  background-color: var(--card-background); border: 1px solid var(--border-color); border-radius: 16px; padding: 0;
}
:deep(.yuemu-modal .ant-modal-header) { background-color: var(--card-background); border-bottom: 1px solid var(--border-color); }

.yuemu-form .yuemu-form-item { margin-bottom: 16px; }
.yuemu-form label { display: block; font-size: 13px; color: var(--text-secondary); margin-bottom: 6px; }
.yuemu-form .yuemu-required { color: var(--comment-delete-hover-color); }
.yuemu-modal-footer { display: flex; gap: 12px; margin-top: 24px; }

:deep(.yuemu-van-dialog) { background-color: var(--card-background) !important; color: var(--text-primary) !important; }
:deep(.yuemu-van-form .van-cell) { background-color: var(--background); color: var(--text-primary); border-bottom: 1px solid var(--border-color); }

.yuemu-confirm-content { text-align: center; padding-top: 10px; }
.yuemu-icon-wrap { font-size: 44px; color: var(--comment-delete-hover-color); margin-bottom: 12px; }
.yuemu-confirm-title { font-size: 17px; font-weight: 600; margin-bottom: 8px; color: var(--text-primary); }
.yuemu-confirm-desc { font-size: 13px; color: var(--text-secondary); margin-bottom: 20px; line-height: 1.4; }

.yuemu-confirm-actions { display: flex; border-top: 1px solid var(--border-color); margin: 0 -24px -24px; }
.yuemu-confirm-actions button { flex: 1; background-color: transparent; border: none; height: 50px; font-size: 16px; font-weight: 500; cursor: pointer; }
.yuemu-cancel-btn { color: var(--text-primary); border-right: 1px solid var(--border-color) !important; }
.yuemu-danger-btn { color: var(--comment-delete-hover-color); font-weight: 600 !important; }
</style>
