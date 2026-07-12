<template>
  <div id="yuemu-audioManagePage">
    <template v-if="device === DEVICE_TYPE_ENUM.PC">
      <div class="yuemu-pc-container">
        <div class="yuemu-header-panel">
          <div class="yuemu-header-main-row">
            <div class="yuemu-page-info">
              <h1 class="yuemu-page-title">{{ t('pages.admin.audioManagePage.title') }}</h1>
              <p class="yuemu-text-secondary" style="margin: 4px 0 0 0; font-size: 13px;">{{ t('pages.admin.audioManagePage.desc') }}</p>
            </div>
            <div class="yuemu-action-group">
              <a-button class="yuemu-btn-ghost" @click="toggleSortOrder">
                <SortAscendingOutlined v-if="sortOrder === 'ascend'" />
                <SortDescendingOutlined v-else />
                {{ sortOrder === 'ascend' ? t('pages.admin.audioManagePage.timeAsc') : t('pages.admin.audioManagePage.timeDesc') }}
              </a-button>
              <a-button
                v-show="hasSelected"
                type="primary"
                danger
                @click="batchDeleteSelectedAudios"
                class="yuemu-btn-danger"
              >
                <DeleteOutlined /> {{ t('pages.admin.audioManagePage.batchDelete') }}
              </a-button>
            </div>
          </div>

          <div class="yuemu-search-form">
            <a-input
              v-model:value="searchParams.fileName"
              :placeholder="t('pages.admin.audioManagePage.searchPlaceholder')"
              allowClear
              @change="doSearch"
              class="yuemu-input"
              style="width: 280px"
            >
              <template #prefix><SearchOutlined class="yuemu-text-secondary" /></template>
            </a-input>
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
                <template v-if="column.dataIndex === 'fileName'">
                  <a-tooltip :title="record.fileName" placement="topLeft">
                    <div class="yuemu-ellipsis-text"><strong>{{ record.fileName }}</strong></div>
                  </a-tooltip>
                </template>
                <template v-else-if="column.dataIndex === 'fileSize'">
                  <span class="yuemu-tag yuemu-mini yuemu-gray">{{ formatFileSize(record.fileSize) }}</span>
                </template>
                <template v-else-if="column.dataIndex === 'duration'">
                  <span class="yuemu-tag yuemu-mini yuemu-blue">{{ formatDuration(record.duration) }}</span>
                </template>
                <template v-else-if="column.dataIndex === 'audio'">
                  <div class="yuemu-audio-wrapper-pc">
                    <AudioBubble :url="record.fileUrl" :isSelf="false" />
                  </div>
                </template>
                <template v-else-if="column.dataIndex === 'createTime'">
                  <span class="yuemu-text-secondary">
                    {{ dayjs(record.createTime).format('YYYY-MM-DD HH:mm:ss') }}
                  </span>
                </template>
                <template v-else-if="column.key === 'action'">
                  <div class="yuemu-action-buttons">
                    <a-button type="text" class="yuemu-btn-text-red" @click="showDeleteConfirm(record)"> {{ t('pages.admin.audioManagePage.delete') }} </a-button>
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
            :show-total="(total) => t('pages.admin.audioManagePage.totalAudios', { total })"
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
            <h1 class="yuemu-page-title">{{ t('pages.admin.audioManagePage.title') }}</h1>
            <van-button icon="sort" size="small" round class="yuemu-btn-icon-ghost" @click="toggleSortOrder" />
          </div>

          <div class="yuemu-search-bar-wrapper">
            <van-search
              v-model="searchParams.fileName"
              :placeholder="t('pages.admin.audioManagePage.searchPlaceholder')"
              class="yuemu-search"
              shape="round"
              @search="doSearch"
              clearable
            />
          </div>

          <div class="yuemu-batch-action-bar" :class="{ 'yuemu-is-active': hasSelected }">
            <span class="yuemu-text-secondary" style="font-size: 14px;">{{ t('pages.admin.audioManagePage.selectedItems', { count: state.selectedRowKeys.length }) }}</span>
            <div class="yuemu-batch-btns">
              <van-button size="small" round type="danger" @click="batchDeleteSelectedAudios">{{ t('pages.admin.audioManagePage.batchDelete') }}</van-button>
            </div>
          </div>
        </div>

        <div class="yuemu-mobile-content-scroll">
          <van-checkbox-group v-model="state.selectedRowKeys">
            <div class="yuemu-card-list">
              <div v-for="audio in dataList" :key="audio.id" class="yuemu-audio-card">

                <div class="yuemu-card-top">
                  <van-checkbox :name="audio.id" class="yuemu-card-checkbox" icon-size="20px" />
                  <div class="yuemu-title-content">
                    <span class="yuemu-file-name">{{ audio.fileName }}</span>
                    <div class="yuemu-meta-tags">
                      <span class="yuemu-tag yuemu-mini yuemu-gray">{{ formatFileSize(audio.fileSize) }}</span>
                      <span class="yuemu-tag yuemu-mini yuemu-blue">{{ formatDuration(audio.duration) }}</span>
                      <span class="yuemu-time-text">{{ dayjs(audio.createTime).format('YYYY-MM-DD HH:mm') }}</span>
                    </div>
                  </div>
                </div>

                <div class="yuemu-card-player">
                  <AudioBubble :url="audio.fileUrl" :isSelf="false" />
                </div>

                <div class="yuemu-card-bottom">
                  <div class="yuemu-system-info">
                    <div class="yuemu-info-line">UID: {{ audio.userId }}</div>
                    <div class="yuemu-info-line">ID: {{ audio.id }}</div>
                  </div>
                  <van-button
                    size="small"
                    plain
                    type="danger"
                    round
                    class="yuemu-delete-btn"
                    @click="showDeleteConfirm(audio)"
                  > {{ t('pages.admin.audioManagePage.delete') }} </van-button>
                </div>

              </div>
            </div>
          </van-checkbox-group>

          <div class="yuemu-mobile-pagination">
            <div class="yuemu-page-info yuemu-text-secondary">
              <span>{{ t('pages.admin.audioManagePage.total', { total }) }}</span>
              <span class="yuemu-page-size-trigger" @click="showPageSizeSheet = true">
                {{ t('pages.admin.audioManagePage.pageSize', { size: searchParams.pageSize }) }}
                <van-icon name="arrow-down" />
              </span>
            </div>
            <van-pagination :prev-text="t('pages.admin.audioManagePage.prevPage')" :next-text="t('pages.admin.audioManagePage.nextPage')"
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
          :cancel-text="t('pages.admin.audioManagePage.cancel')"
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
        <h3 class="yuemu-confirm-title">{{ t('pages.admin.audioManagePage.confirmDeleteTitle') }}</h3>
        <p class="yuemu-confirm-desc">
          {{ t('pages.admin.audioManagePage.filePrefix') }}{{ selectedAudio?.fileName || t('pages.admin.audioManagePage.unnamed') }}<br>
          {{ t('pages.admin.audioManagePage.deleteWarning') }}
        </p>
        <div class="yuemu-confirm-actions">
          <button class="yuemu-cancel-btn" @click="deleteConfirmVisible = false">{{ t('pages.admin.audioManagePage.cancel') }}</button>
          <button class="yuemu-danger-btn" @click="confirmDelete">{{ t('pages.admin.audioManagePage.confirmDelete') }}</button>
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
  listAudioByPageAdminUsingGet,
  deleteAudioUsingDelete,
  batchDeleteAudioUsingDelete,
} from '@/api/audioFileController'
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
} from '@ant-design/icons-vue'
import AudioBubble from '@/components/AudioBubble.vue'

const device = ref<string>('')

onMounted(async () => {
  device.value = await getDeviceType()
})

const columns = [
  { get title() { return t('pages.admin.audioManagePage.colFileName') }, dataIndex: 'fileName', width: 220 },
  { get title() { return t('pages.admin.audioManagePage.colFileSize') }, dataIndex: 'fileSize', width: 100 },
  { get title() { return t('pages.admin.audioManagePage.colDuration') }, dataIndex: 'duration', width: 100 },
  { get title() { return t('pages.admin.audioManagePage.colAudioPreview') }, dataIndex: 'audio', width: 320 },
  { get title() { return t('pages.admin.audioManagePage.colAudioId') }, dataIndex: 'id', width: 100 },
  { get title() { return t('pages.admin.audioManagePage.colUserId') }, dataIndex: 'userId', width: 100 },
  { get title() { return t('pages.admin.audioManagePage.colCreateTime') }, dataIndex: 'createTime', width: 180 },
  { get title() { return t('pages.admin.audioManagePage.colAction') }, key: 'action', width: 80, align: 'right' },
]

const dataList = ref<API.AudioFile[]>([])
const total = ref(0)
const loading = ref(false)
const showPageSizeSheet = ref(false)

const pcPageSizeOptions = ['10', '20', '30', '50']
const mobilePageSizeOptions = [
  { get name() { return t('pages.admin.audioManagePage.pageSize10') }, value: 10 },
  { get name() { return t('pages.admin.audioManagePage.pageSize20') }, value: 20 },
  { get name() { return t('pages.admin.audioManagePage.pageSize30') }, value: 30 },
  { get name() { return t('pages.admin.audioManagePage.pageSize50') }, value: 50 },
]

const searchParams = reactive({
  current: 1,
  pageSize: 10,
  sortField: 'createTime',
  sortOrder: 'descend',
  fileName: '',
})

const sortOrder = computed(() => searchParams.sortOrder)

const fetchData = async () => {
  if (device.value === DEVICE_TYPE_ENUM.PC) loading.value = true
  try {
    const res = await listAudioByPageAdminUsingGet(searchParams)
    if (res.data?.code === 0) {
      dataList.value = res.data.data.records
      total.value = res.data.data.total
    }
  } catch (error) {
    message.error(t('pages.admin.audioManagePage.fetchError'))
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

const doTableChange = () => { fetchData() }

const doSearch = async () => {
  searchParams.current = 1
  await fetchData()
}

onMounted(async () => { await doSearch() })

const deleteConfirmVisible = ref(false)
const selectedAudio = ref<API.AudioFile | null>(null)

const showDeleteConfirm = (audio: API.AudioFile) => {
  selectedAudio.value = audio
  deleteConfirmVisible.value = true
}

const confirmDelete = async () => {
  if (!selectedAudio.value?.id) return
  try {
    const res = await deleteAudioUsingDelete({ id: selectedAudio.value.id })
    if (res.data?.code === 0) {
      message.success(t('pages.admin.audioManagePage.deleteSuccess'))
      deleteConfirmVisible.value = false
      fetchData()
    } else {
      message.error(t('pages.admin.audioManagePage.deleteFailedPrefix') + res.data?.message)
    }
  } catch (error) {
    message.error(t('pages.admin.audioManagePage.deleteError'))
  }
}

const toggleSortOrder = () => {
  searchParams.sortOrder = searchParams.sortOrder === 'ascend' ? 'descend' : 'ascend'
  fetchData()
}

const state = reactive({ selectedRowKeys: [] as number[] })
const onSelectChange = (selectedRowKeys: number[]) => { state.selectedRowKeys = selectedRowKeys }
const hasSelected = computed(() => state.selectedRowKeys.length > 0)

const batchDeleteSelectedAudios = async () => {
  if (state.selectedRowKeys.length === 0) return
  try {
    const res = await batchDeleteAudioUsingDelete(state.selectedRowKeys)
    if (res.data?.code === 0) {
      message.success(t('pages.admin.audioManagePage.batchDeleteSuccess'))
      state.selectedRowKeys = []
      fetchData()
    } else {
      message.error(t('pages.admin.audioManagePage.batchDeleteError'))
    }
  } catch (error) {
    message.error(t('pages.admin.audioManagePage.batchDeleteException'))
  }
}

const rowSelection = computed(() => ({
  selectedRowKeys: state.selectedRowKeys,
  onChange: onSelectChange,
}))

const onMobilePageChange = async (page: number) => {
  searchParams.current = page
  await fetchData()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handlePageSizeChange = async (action: { value: number }) => {
  searchParams.current = 1
  searchParams.pageSize = action.value
  showPageSizeSheet.value = false
  await fetchData()
}

const formatFileSize = (size: number) => {
  if (!size) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let index = 0
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024
    index++
  }
  return `${size.toFixed(2)} ${units[index]}`
}

const formatDuration = (duration: number) => {
  if (!duration) return '0:00'
  const minutes = Math.floor(duration / 60)
  const seconds = duration % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
</script>

<style scoped>
#yuemu-audioManagePage {
  height: 100%;
  box-sizing: border-box;
  background-color: var(--background);
  color: var(--text-primary);
  transition: var(--theme-transition);
}
.yuemu-text-secondary { color: var(--text-secondary); }

/* ==================== PC 端样式 ==================== */
.yuemu-pc-container { padding: 16px; max-width: 1400px; margin: 0 auto; box-sizing: border-box; }
.yuemu-header-panel { background-color: var(--card-background); border: 1px solid var(--border-color); border-radius: 16px; padding: 24px; box-shadow: 0 4px 16px var(--shadow-color); margin-bottom: 24px; transition: var(--theme-transition); }
.yuemu-header-main-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.yuemu-page-title { margin: 0; font-size: 24px; font-weight: 600; color: var(--text-primary); }
.yuemu-search-form { display: flex; gap: 12px; flex-wrap: wrap; }
:deep(.yuemu-input), :deep(.ant-input-affix-wrapper) { background-color: var(--background) !important; color: var(--text-primary) !important; border-color: var(--border-color) !important; border-radius: 8px !important; box-shadow: none !important; transition: var(--theme-transition); }
:deep(.yuemu-input input), :deep(.ant-input-affix-wrapper input) { background-color: transparent !important; color: var(--text-primary) !important; }
:deep(.yuemu-input input::placeholder), :deep(.ant-input-affix-wrapper input::placeholder) { color: var(--text-secondary) !important; }
:deep(.yuemu-input:focus-within), :deep(.ant-input-affix-wrapper-focused) { border-color: var(--link-color) !important; }
.yuemu-action-group { display: flex; gap: 12px; align-items: center; }
.yuemu-btn-danger { border-radius: 8px !important; }
.yuemu-btn-ghost { border-radius: 8px !important; border: 1px solid var(--border-color) !important; color: var(--text-primary) !important; background-color: transparent !important; transition: var(--theme-transition); }
.yuemu-btn-ghost:hover { background-color: var(--hover-background) !important; }
.yuemu-table-wrapper { background-color: var(--card-background); border: 1px solid var(--border-color); border-radius: 16px; padding: 20px; box-shadow: 0 4px 16px var(--shadow-color); transition: var(--theme-transition); }
:deep(.yuemu-table) {
  .ant-table { background-color: transparent; color: var(--text-primary); }
  .ant-table-thead > tr > th { background-color: transparent; border-bottom: 1px solid var(--border-color); color: var(--text-secondary); font-weight: 500; }
  .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-color); padding: 16px; color: var(--text-primary); transition: var(--theme-transition); }
  .ant-table-tbody > tr:hover > td { background-color: var(--hover-background) !important; }
  .ant-empty-description { color: var(--text-secondary); }
}
.yuemu-ellipsis-text { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: pointer; }
.yuemu-audio-wrapper-pc { max-width: 300px; }
.yuemu-tag { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; border: 1px solid transparent; }
.yuemu-tag.yuemu-mini { padding: 2px 8px; font-size: 11px; }
.yuemu-tag.yuemu-blue { background-color: rgba(59, 130, 246, 0.1); color: #3b82f6; border-color: rgba(59, 130, 246, 0.2); }
.yuemu-tag.yuemu-gray { background-color: var(--hover-background); color: var(--text-secondary); border-color: var(--border-color); }
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

.yuemu-search-bar-wrapper { margin-bottom: 4px; }
:deep(.yuemu-search) { padding: 0 !important; background-color: transparent !important; }
:deep(.yuemu-search .van-search__content) { background-color: var(--hover-background); border: 1px solid var(--border-color); }
:deep(.van-field__control) { color: var(--text-primary) !important; }
:deep(.van-field__control::placeholder) { color: var(--text-secondary) !important; }

.yuemu-batch-action-bar {
  display: flex; justify-content: space-between; align-items: center;
  height: 0; opacity: 0; overflow: hidden; transition: all 0.3s ease;
}
.yuemu-batch-action-bar.yuemu-is-active {
  height: 44px; opacity: 1; margin-top: 8px; border-top: 1px solid var(--border-color);
}

.yuemu-mobile-content-scroll { flex: 1; padding: 12px 16px 32px; overflow-y: auto; }
.yuemu-mobile-card-list { display: flex; flex-direction: column; gap: 16px; margin-top: 8px; }

.yuemu-mobile-audio-card {
  background-color: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.03);
  transition: var(--theme-transition);
}

.yuemu-card-top {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.yuemu-card-checkbox {
  margin-top: 2px;
}

.yuemu-title-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.yuemu-file-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.4;
  word-break: break-all;
}

.yuemu-meta-tags {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.yuemu-time-text {
  font-size: 12px;
  color: var(--text-secondary);
}

.yuemu-card-player {
  margin-bottom: 12px;
  width: 100%;
  overflow: hidden;
}

.yuemu-card-bottom {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  border-top: 1px solid var(--border-color);
  padding-top: 12px;
  margin-top: 4px;
}

.yuemu-system-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 11px;
  color: var(--text-secondary);
  flex: 1;
  min-width: 0;
  padding-right: 12px;
}

.yuemu-info-line {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.yuemu-delete-btn {
  flex-shrink: 0;
  height: 28px !important;
  padding: 0 16px !important;
}

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
