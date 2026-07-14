<template>
  <div id="yuemu-picture-manage-page">
    <template v-if="device === DEVICE_TYPE_ENUM.PC">
      <div class="yuemu-pc-dashboard">
        <header class="yuemu-dashboard-header">
          <div class="yuemu-header-left">
            <h1 class="yuemu-page-title"> {{ t('pages.admin.pictureManagePage.title') }} </h1>
            <p class="yuemu-page-desc"> {{ t('pages.admin.pictureManagePage.desc') }} </p>
          </div>
          <div class="yuemu-header-right">
            <a-button class="yuemu-btn-ghost" @click="toggleSortOrder">
              <SortAscendingOutlined v-if="sortOrder === 'ascend'" />
              <SortDescendingOutlined v-else />
              {{ sortOrder === 'ascend' ? t('pages.admin.pictureManagePage.ascend') : t('pages.admin.pictureManagePage.descend') }}
            </a-button>
            <a-button class="yuemu-btn-ghost" @click="router.push('/add_picture/batch')">
              <UploadOutlined /> {{ t('pages.admin.pictureManagePage.batchImport') }} </a-button>
            <a-button type="primary" class="yuemu-btn-primary" @click="router.push('/add_picture')">
              <PlusOutlined /> {{ t('pages.admin.pictureManagePage.uploadPic') }} </a-button>
          </div>
        </header>

        <div class="yuemu-filter-bar">
          <a-form layout="inline" :model="searchParams" class="yuemu-filter-form" @finish="doSearch">
            <a-form-item>
              <a-input
                v-model:value="searchParams.searchText"
                :placeholder="t('pages.admin.pictureManagePage.searchName')"
                allow-clear
                class="yuemu-input-search"
                style="width: 240px"
              >
                <template #prefix><SearchOutlined class="yuemu-text-secondary" /></template>
              </a-input>
            </a-form-item>
            <a-form-item>
              <a-input v-model:value="searchParams.category" :placeholder="t('pages.admin.pictureManagePage.inputCategory')" allow-clear class="yuemu-input-base" style="width: 130px" />
            </a-form-item>
            <a-form-item>
              <a-input v-model:value="searchParams.tags" :placeholder="t('pages.admin.pictureManagePage.inputTag')" allow-clear class="yuemu-input-base" style="width: 130px" />
            </a-form-item>
            <a-form-item>
              <a-select
                v-model:value="searchParams.reviewStatus"
                :placeholder="t('pages.admin.pictureManagePage.reviewStatus')"
                allow-clear
                :options="PIC_REVIEW_STATUS_OPTIONS"
                class="yuemu-select-base"
                style="width: 130px"
                :dropdownClassName="'yuemu-dark-dropdown'"
              />
            </a-form-item>
            <a-form-item>
              <a-button type="primary" html-type="submit" class="yuemu-btn-primary"> {{ t('pages.admin.pictureManagePage.filter') }} </a-button>
            </a-form-item>

            <a-form-item class="yuemu-flex-right" v-if="hasSelected">
              <a-dropdown :trigger="['click']">
                <a-button danger class="yuemu-btn-danger">
                  <BoldOutlined /> {{ t('pages.admin.pictureManagePage.batchActionText', { count: state.selectedRowKeys.length }) }}
                </a-button>
                <template #overlay>
                  <a-menu class="yuemu-dark-menu">
                    <a-menu-item v-for="option in OPERATION_OPTIONS" :key="option.value" @click="handleBatchOperation(option.value)">
                      {{ option.label }}
                    </a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </a-form-item>
          </a-form>
        </div>

        <div class="yuemu-table-container">
          <a-spin :tip="t('pages.admin.pictureManagePage.loading')" :spinning="loading">
            <a-table
              :row-selection="{ selectedRowKeys: state.selectedRowKeys, onChange: onSelectChange }"
              rowKey="id"
              :columns="columns"
              :data-source="dataList"
              :pagination="false"
              @change="doTableChange"
              class="yuemu-seamless-table"
              :scroll="{ x: 1300 }"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.dataIndex === 'id'">
                  <span class="yuemu-text-mono yuemu-text-secondary">#{{ record.id }}</span>
                </template>

                <template v-if="column.dataIndex === 'url'">
                  <div class="yuemu-thumb-wrapper">
                    <a-image :src="record.url" :fallback="'https://gw.alipayobjects.com/zos/antfincdn/XAoskV01e/default_avatar.png'" class="yuemu-img-thumb" />
                    <div v-if="record.isFeature" class="yuemu-badge-feature"><StarFilled /></div>
                  </div>
                </template>

                <template v-if="column.dataIndex === 'tags'">
                  <div class="yuemu-tag-group">
                    <span v-if="record.category" class="yuemu-badge yuemu-bg-blue">{{ record.category }}</span>
                    <span class="yuemu-badge yuemu-bg-green" v-for="tag in JSON.parse(record.tags || '[]')" :key="tag">{{ tag }}</span>
                  </div>
                </template>

                <template v-if="column.dataIndex === 'picInfo'">
                  <div class="yuemu-meta-stack">
                    <span class="yuemu-meta-item">{{ record.picFormat?.toUpperCase() || 'UNKNOWN' }} · {{ (record.picSize / 1024).toFixed(1) }}KB</span>
                    <span class="yuemu-meta-item">{{ record.picWidth }} × {{ record.picHeight }}</span>
                  </div>
                </template>

                <template v-if="column.dataIndex === 'reviewMessage'">
                  <div class="yuemu-review-stack">
                    <span class="yuemu-badge" :class="getStatusColorClass(record.reviewStatus)">
                      <div class="yuemu-status-dot" :class="getStatusColorClass(record.reviewStatus)"></div>
                      {{ PIC_REVIEW_STATUS_MAP[record.reviewStatus] }}
                    </span>
                    <span v-if="record.reviewMessage" class="yuemu-meta-item" style="margin-top: 6px;">{{ record.reviewMessage }}</span>
                  </div>
                </template>

                <template v-if="column.dataIndex === 'createTime'">
                  <span class="yuemu-text-secondary">{{ dayjs(record.createTime).format('MM-DD HH:mm') }}</span>
                </template>

                <template v-if="column.key === 'action'">
                  <div class="yuemu-action-cell">
                    <button v-if="record.reviewStatus !== PIC_REVIEW_STATUS_ENUM.PASS" class="yuemu-icon-text-btn yuemu-color-success" @click="handleReview(record, PIC_REVIEW_STATUS_ENUM.PASS)"> {{ t('pages.admin.pictureManagePage.pass') }} </button>
                    <button v-if="record.reviewStatus !== PIC_REVIEW_STATUS_ENUM.REJECT" class="yuemu-icon-text-btn yuemu-color-warning" @click="showRejectModal(record)"> {{ t('pages.admin.pictureManagePage.reject') }} </button>
                    <button class="yuemu-icon-text-btn yuemu-color-primary" @click="router.push(`/add_picture?id=${record.id}`)"> {{ t('pages.admin.pictureManagePage.edit') }} </button>
                    <button class="yuemu-icon-text-btn" :class="record.isFeature ? 'yuemu-color-warning' : 'yuemu-color-gray'" @click="handleFeature(record)">
                      {{ record.isFeature ? t('pages.admin.pictureManagePage.cancelFeature') : t('pages.admin.pictureManagePage.setFeature') }}
                    </button>
                    <button class="yuemu-icon-text-btn yuemu-color-danger" @click="showDeleteConfirm(record)"> {{ t('pages.admin.pictureManagePage.delete') }} </button>
                  </div>
                </template>
              </template>
            </a-table>
          </a-spin>
        </div>

        <div class="yuemu-pagination-bar">
          <a-pagination
            :current="searchParams.current"
            :total="total"
            :pageSize="searchParams.pageSize"
            :pageSizeOptions="pcPageSizeOptions"
            show-size-changer
            :showTotal="total => t('pages.admin.pictureManagePage.totalPicText', { t: total })"
            @change="onPaginationChange"
          />
        </div>
      </div>
    </template>

    <template v-else>
      <div class="yuemu-m-container">
        <div class="yuemu-m-sticky-header">
          <div class="yuemu-m-header-main">
            <h1 class="yuemu-m-title"> {{ t('pages.admin.pictureManagePage.mTitle') }} </h1>
            <div class="yuemu-m-actions">
              <van-button icon="plus" size="small" type="primary" round class="yuemu-m-primary-btn" @click="router.push('/add_picture')" />
              <van-button icon="photograph" size="small" round class="yuemu-m-ghost-btn" @click="router.push('/add_picture/batch')" />
            </div>
          </div>

          <div class="yuemu-m-search-row">
            <van-search v-model="searchParams.searchText" :placeholder="t('pages.admin.pictureManagePage.mSearch')" shape="round" class="yuemu-m-search" @search="doSearch" />
            <span class="yuemu-m-sort-btn" @click="toggleSortOrder">
              {{ sortOrder === 'ascend' ? t('pages.admin.pictureManagePage.ascend') : t('pages.admin.pictureManagePage.descend') }} <van-icon :name="sortOrder === 'ascend' ? 'ascending' : 'descending'" />
            </span>
          </div>

          <div class="yuemu-m-batch-bar" :class="{ 'is-active': hasSelected }">
            <span class="yuemu-m-batch-text">{{ t('pages.admin.pictureManagePage.selectedText', { count: state.selectedRowKeys.length }) }}</span>
            <button class="yuemu-m-batch-btn" @click="showActionSheet = true"> {{ t('pages.admin.pictureManagePage.batchAction') }} </button>
          </div>
        </div>

        <div class="yuemu-m-scroll-view">
          <van-checkbox-group v-model="state.selectedRowKeys">
            <div v-for="picture in dataList" :key="picture.id" class="yuemu-m-card">
              <div class="yuemu-m-card-cover" @click="showImagePreview(picture.url)">
                <van-image :src="picture.url" fit="cover" width="100%" height="200" />
                <van-checkbox :name="picture.id" class="yuemu-m-checkbox" @click.stop />
                <div v-if="picture.isFeature" class="yuemu-m-feature-tag"><StarFilled /> {{ t('pages.admin.pictureManagePage.setFeature') }} </div>
                <div class="yuemu-m-status-tag" :class="getStatusColorClass(picture.reviewStatus)">
                  {{ PIC_REVIEW_STATUS_MAP[picture.reviewStatus] }}
                </div>
              </div>

              <div class="yuemu-m-card-info">
                <h3 class="yuemu-m-pic-name">{{ picture.name || t('pages.admin.pictureManagePage.unnamedPic') }}</h3>
                <p class="yuemu-m-pic-desc">{{ picture.introduction || t('pages.admin.pictureManagePage.noDesc') }}</p>

                <div class="yuemu-m-tags">
                  <span class="yuemu-badge yuemu-bg-blue" v-if="picture.category">{{ picture.category }}</span>
                  <span class="yuemu-badge yuemu-bg-gray">{{ picture.picWidth }}x{{ picture.picHeight }}</span>
                  <span class="yuemu-badge yuemu-bg-gray">{{ (picture.picSize / 1024).toFixed(1) }}KB</span>
                </div>
              </div>

              <div class="yuemu-m-card-actions">
                <button v-if="picture.reviewStatus !== PIC_REVIEW_STATUS_ENUM.PASS" class="yuemu-m-action-btn yuemu-color-success" @click="handleReview(picture, PIC_REVIEW_STATUS_ENUM.PASS)"> {{ t('pages.admin.pictureManagePage.pass') }} </button>
                <button v-if="picture.reviewStatus !== PIC_REVIEW_STATUS_ENUM.REJECT" class="yuemu-m-action-btn yuemu-color-warning" @click="showRejectModal(picture)"> {{ t('pages.admin.pictureManagePage.reject') }} </button>
                <button class="yuemu-m-action-btn yuemu-color-primary" @click="router.push(`/add_picture?id=${picture.id}`)"> {{ t('pages.admin.pictureManagePage.edit') }} </button>
                <button class="yuemu-m-action-btn" :class="picture.isFeature ? 'yuemu-color-warning' : 'yuemu-color-gray'" @click="handleFeature(picture)">
                  {{ picture.isFeature ? t('pages.admin.pictureManagePage.cancelFeature') : t('pages.admin.pictureManagePage.setFeature') }}
                </button>
                <button class="yuemu-m-action-btn yuemu-color-danger" @click="showDeleteConfirm(picture)"> {{ t('pages.admin.pictureManagePage.delete') }} </button>
              </div>
            </div>
          </van-checkbox-group>

          <van-empty v-if="dataList.length === 0 && !loading" :description="t('pages.admin.pictureManagePage.emptyGallery')" />

          <div class="yuemu-m-pagination" v-if="total > 0">
            <van-pagination :prev-text="t('pages.admin.pictureManagePage.prevPage')" :next-text="t('pages.admin.pictureManagePage.nextPage')"
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
      </div>

      <van-action-sheet v-model:show="showActionSheet" :actions="mobileOperationOptions" :cancel-text="t('common.cancel')" @select="handleBatchOperation" class="yuemu-dark-action-sheet" teleport="body" />
      <ImagePreview v-model:visible="showPreview" :images="[previewImage]" :initialIndex="0" />
    </template>

    <a-modal v-model:open="rejectModalVisible" :title="t('pages.admin.pictureManagePage.rejectApp')" :footer="null" class="yuemu-apple-modal" centered>
      <div class="yuemu-modal-form">
        <div class="yuemu-form-item">
          <label> {{ t('pages.admin.pictureManagePage.presetReason') }} </label>
          <a-select v-model:value="selectedRejectReason" class="yuemu-select-base" style="width: 100%" @change="handleRejectReasonChange" :dropdownClassName="'yuemu-dark-dropdown'">
            <a-select-option v-for="opt in REJECT_REASON_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</a-select-option>
          </a-select>
        </div>
        <div class="yuemu-form-item">
          <label> {{ t('pages.admin.pictureManagePage.detailDesc') }} </label>
          <a-textarea v-model:value="rejectMessage" :rows="4" class="yuemu-input-base" :placeholder="t('pages.admin.pictureManagePage.rejectPlaceholder')" />
        </div>
        <div class="yuemu-modal-footer">
          <a-button class="yuemu-btn-ghost" @click="rejectModalVisible = false">{{ t('common.cancel') }}</a-button>
          <a-button type="primary" danger class="yuemu-btn-danger" @click="handleRejectConfirm" :loading="rejectLoading"> {{ t('pages.admin.pictureManagePage.confirmReject') }} </a-button>
        </div>
      </div>
    </a-modal>

    <a-modal v-model:open="deleteConfirmVisible" :title="null" :footer="null" :width="360" class="yuemu-apple-modal" centered>
      <div class="yuemu-confirm-content">
        <div class="yuemu-icon-warning"><ExclamationCircleFilled /></div>
        <h3 class="yuemu-confirm-title"> {{ t('pages.admin.pictureManagePage.permanentDelete') }} </h3>
        <p class="yuemu-confirm-desc">「{{ selectedPicture?.name || t('pages.admin.pictureManagePage.unnamedPic') }}」<br> {{ t('pages.admin.pictureManagePage.deleteWarning') }} </p>
        <div class="yuemu-confirm-actions">
          <button class="yuemu-action-cancel" @click="deleteConfirmVisible = false">{{ t('common.cancel') }}</button>
          <button class="yuemu-action-danger" @click="confirmDelete"> {{ t('pages.admin.pictureManagePage.delete') }} </button>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
/* ===== JS 逻辑完全保持不变，仅更新了类名引用 ===== */
import { computed, onMounted, reactive, ref } from 'vue'
import {
  batchOperationPictureUsingPost,
  deletePictureUsingPost,
  doPictureReviewUsingPost,
  listPictureByPageUsingPost,
  setPictureFeatureUsingPost,
} from '@/api/pictureController.ts'
import { message } from 'ant-design-vue'
import ImagePreview from '@/components/ImagePreview.vue'
import {
  BoldOutlined, PlusOutlined, UploadOutlined, SearchOutlined,
  ExclamationCircleFilled, StarOutlined, StarFilled, SortAscendingOutlined, SortDescendingOutlined,
} from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import { PIC_REVIEW_STATUS_ENUM, PIC_REVIEW_STATUS_MAP, PIC_REVIEW_STATUS_OPTIONS } from '../../constants/picture.ts'
import { getDeviceType } from '@/utils/device.ts'
import { DEVICE_TYPE_ENUM } from '@/constants/device.ts'
import { OPERATION_OPTIONS } from '@/constants/operation.ts'
import { REJECT_REASON_OPTIONS, REJECT_REASON_MAP } from '@/constants/review'
import { useRouter } from 'vue-router'

const device = ref<string>('')
const router = useRouter()

const columns = [
  { title: 'ID', dataIndex: 'id', width: 100 },
  { title: t('pages.admin.pictureManagePage.mediaPreview'), dataIndex: 'url', width: 140 },
  { title: t('pages.admin.pictureManagePage.nameAndDesc'), dataIndex: 'name', width: 200, ellipsis: true },
  { title: t('pages.admin.pictureManagePage.categoryAndTags'), dataIndex: 'tags', width: 220 },
  { title: t('pages.admin.pictureManagePage.picSpec'), dataIndex: 'picInfo', width: 160 },
  { title: t('pages.admin.pictureManagePage.reviewStatus'), dataIndex: 'reviewMessage', width: 180 },
  { title: t('pages.admin.pictureManagePage.uploadTime'), dataIndex: 'createTime', width: 150 },
  { title: t('pages.admin.pictureManagePage.actionArea'), key: 'action', fixed: 'right', width: 260, align: 'right' },
]

const dataList = ref<API.Picture[]>([])
const total = ref(0)
const loading = ref(false)

const searchParams = reactive<API.PictureQueryRequest>({ current: 1, pageSize: 10, sortField: 'createTime', sortOrder: 'descend' })
const sortOrder = ref<'ascend' | 'descend'>('descend')

const state = reactive({ selectedRowKeys: [] as number[] })
const hasSelected = computed(() => state.selectedRowKeys.length > 0)
const onSelectChange = (selectedRowKeys: number[]) => { state.selectedRowKeys = selectedRowKeys }

const fetchData = async () => {
  loading.value = true
  try {
    const res = await listPictureByPageUsingPost({ ...searchParams, sortOrder: sortOrder.value, nullSpaceId: true })
    if (res.data.code === 0 && res.data.data) { dataList.value = res.data.data.records ?? []; total.value = res.data.data.total ?? 0 }
  } catch (error) { message.error(t('pages.admin.pictureManagePage.fetchErrorText')) } finally { loading.value = false }
}

const doTableChange = (pagination: any) => { searchParams.current = pagination.current; searchParams.pageSize = pagination.pageSize; fetchData() }
const onPaginationChange = (page: number, pageSize: number) => { searchParams.current = page; searchParams.pageSize = pageSize; fetchData() }
const doSearch = () => { searchParams.current = 1; fetchData() }

const showActionSheet = ref(false)
const mobileOperationOptions = [
  { name: OPERATION_OPTIONS[0].label, value: OPERATION_OPTIONS[0].value, color: '#ef4444' },
  { name: OPERATION_OPTIONS[1].label, value: OPERATION_OPTIONS[1].value, color: '#10b981' },
  { name: OPERATION_OPTIONS[2].label, value: OPERATION_OPTIONS[2].value, color: '#f59e0b' },
]

const handleBatchOperation = async (action: any) => {
  if (state.selectedRowKeys.length === 0) { message.warning(t('pages.admin.pictureManagePage.plsSelectPicText')); return; }
  try {
    const body = { ids: state.selectedRowKeys, operationType: device.value === DEVICE_TYPE_ENUM.PC ? action : action.value }
    const res = await batchOperationPictureUsingPost(body)
    if (res.data.code === 0) { message.success(t('pages.admin.pictureManagePage.opSuccessText')); state.selectedRowKeys = []; fetchData(); showActionSheet.value = false }
    else { message.error(t('pages.admin.pictureManagePage.opFailText')) }
  } catch (error) { message.error(t('pages.admin.pictureManagePage.opErrText')) }
}

const handleReview = async (record: API.Picture, reviewStatus: number) => {
  const reviewMessage = reviewStatus === PIC_REVIEW_STATUS_ENUM.PASS ? t('pages.admin.pictureManagePage.adminPassText') : t('pages.admin.pictureManagePage.adminRejectText')
  const res = await doPictureReviewUsingPost({ id: record.id, reviewStatus, reviewMessage })
  if (res.data.code === 0) { message.success(t('pages.admin.pictureManagePage.opSuccessText')); fetchData() }
  else { message.error(t('pages.admin.pictureManagePage.opFailText')) }
}

const rejectModalVisible = ref(false)
const rejectLoading = ref(false)
const selectedRejectReason = ref('')
const rejectMessage = ref('')
const currentRejectRecord = ref<any>(null)

const showRejectModal = (record: any) => { currentRejectRecord.value = record; selectedRejectReason.value = ''; rejectMessage.value = ''; rejectModalVisible.value = true }
const handleRejectReasonChange = (value: string) => { rejectMessage.value = value !== 'other' ? REJECT_REASON_MAP[value] : '' }
const handleRejectConfirm = async () => {
  if (!rejectMessage.value.trim()) { message.error(t('pages.admin.pictureManagePage.inputRejectReasonText')); return }
  rejectLoading.value = true
  try {
    const res = await doPictureReviewUsingPost({ id: currentRejectRecord.value.id, reviewStatus: PIC_REVIEW_STATUS_ENUM.REJECT, reviewMessage: rejectMessage.value })
    if (res.data.code === 0) { message.success(t('pages.admin.pictureManagePage.rejectedText')); rejectModalVisible.value = false; fetchData() }
    else { message.error(t('pages.admin.pictureManagePage.opFailText')) }
  } finally { rejectLoading.value = false }
}

/* 动态返回类名前缀保持一致 */
const getStatusColorClass = (status: number) => {
  switch (status) {
    case PIC_REVIEW_STATUS_ENUM.REVIEWING: return 'yuemu-bg-orange'
    case PIC_REVIEW_STATUS_ENUM.PASS: return 'yuemu-bg-green'
    case PIC_REVIEW_STATUS_ENUM.REJECT: return 'yuemu-bg-red'
    default: return 'yuemu-bg-gray'
  }
}

const onMobilePageChange = (page: number) => { searchParams.current = page; fetchData() }
const showPreview = ref(false)
const previewImage = ref('')
const showImagePreview = (url: string) => { previewImage.value = url; showPreview.value = true }
const closePreview = () => { showPreview.value = false }
const pcPageSizeOptions = ['10', '20', '30', '50']

const deleteConfirmVisible = ref(false)
const selectedPicture = ref<API.PictureVO | null>(null)
const showDeleteConfirm = (picture: API.PictureVO) => { selectedPicture.value = picture; deleteConfirmVisible.value = true }
const confirmDelete = async () => {
  if (!selectedPicture.value?.id) return
  try {
    const res = await deletePictureUsingPost({ id: selectedPicture.value.id })
    if (res.data.code === 0) { message.success(t('pages.admin.pictureManagePage.deleteSuccessText')); deleteConfirmVisible.value = false; fetchData() }
  } catch (error) { message.error(t('pages.admin.pictureManagePage.deleteFailText')) }
}

const handleFeature = async (record: API.PictureVO) => {
  try { await setPictureFeatureUsingPost({ id: record.id, isFeature: record.isFeature ? 0 : 1 }); await fetchData() } catch (error) { message.error(t('pages.admin.pictureManagePage.opFailText')) }
}

const toggleSortOrder = () => { sortOrder.value = sortOrder.value === 'ascend' ? 'descend' : 'ascend'; searchParams.sortOrder = sortOrder.value; fetchData() }

onMounted(async () => {
  device.value = await getDeviceType()
  fetchData()
})
</script>

<style scoped>
/* ==================== 1. 基础全局配置 ==================== */
#yuemu-picture-manage-page {
  min-height: 100vh;
  background-color: var(--background);
  color: var(--text-primary);
  transition: var(--theme-transition);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.yuemu-text-secondary { color: var(--text-secondary); }
.yuemu-text-mono { font-family: monospace; font-size: 13px; }

/* ==================== 2. PC 端工作台 ==================== */
.yuemu-pc-dashboard {
  padding: 32px 24px;
  max-width: 1500px;
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
.yuemu-flex-right { margin-left: auto; margin-right: 0; }

/* ==================== 3. 基础 UI 组件覆写 (核心暗色适配) ==================== */

/* 按钮系 */
.yuemu-btn-primary { background: var(--link-color) !important; color: #fff !important; border: none !important; border-radius: 8px !important; font-weight: 500; height: 36px; padding: 0 16px; box-shadow: 0 4px 12px rgba(var(--link-color-rgb), 0.25); }
.yuemu-btn-primary:hover { filter: brightness(1.1); }
.yuemu-btn-ghost { background: var(--hover-background) !important; border: 1px solid var(--border-color) !important; color: var(--text-primary) !important; border-radius: 8px !important; height: 36px; }
.yuemu-btn-danger { background: rgba(239,68,68,0.1) !important; color: #ef4444 !important; border: none !important; border-radius: 8px !important; }

/* 输入框与下拉框 */
:deep(.yuemu-input-search), :deep(.yuemu-input-base), :deep(.yuemu-select-base .ant-select-selector) {
  border: 1px solid var(--border-color) !important;
  color: var(--text-primary) !important;
  border-radius: 8px !important;
  box-shadow: none !important;
  transition: all 0.3s;
}
:deep(.yuemu-input-search:hover), :deep(.yuemu-input-base:focus-within), :deep(.yuemu-select-base:hover .ant-select-selector) {
  border-color: var(--link-color) !important;
}
:deep(.ant-input::placeholder), :deep(.ant-select-selection-placeholder) { color: var(--text-secondary) !important; opacity: 0.6; }

/* 彻底解决暗色下弹层与菜单白边 */
@media (prefers-color-scheme: dark) {
  .yuemu-dark-dropdown, .ant-select-dropdown, .ant-dropdown-menu {
    background-color: #262626 !important;
    border: 1px solid #3a3a3a !important;
    box-shadow: 0 6px 16px rgba(0,0,0,0.5) !important;
  }
  .ant-select-item, .ant-dropdown-menu-item { color: #e5e5e5 !important; }
  .ant-select-item-option-hover, .ant-select-item-option-active, .ant-dropdown-menu-item:hover { background-color: #383838 !important; }

  /* 弹窗适配 */
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

  /* 表头：去边框，加底色 */
  .ant-table-thead > tr > th {
    background: transparent !important;
    border-bottom: 1px solid var(--border-color) !important;
    color: var(--text-secondary) !important;
    font-weight: 600; font-size: 13px; text-transform: uppercase;
  }
  .ant-table-thead > tr > th::before { display: none !important; }

  /* 表行：无感分割线，悬浮微光 */
  .ant-table-tbody > tr > td {
    background: transparent !important;
    border-bottom: 1px solid var(--border-color) !important;
    padding: 16px !important;
    transition: background 0.3s;
  }
  .ant-table-tbody > tr:hover > td,
  .ant-table-tbody > tr:hover > .ant-table-cell-fix-left,
  .ant-table-tbody > tr:hover > .ant-table-cell-fix-right {
    background: var(--hover-background) !important;
  }
  .ant-table-cell-fix-left, .ant-table-cell-fix-right { background: var(--card-background) !important; }
}

/* ==================== 5. 表格内视觉元素 ==================== */
.yuemu-thumb-wrapper { position: relative; display: inline-block; }
.yuemu-img-thumb { border-radius: 10px; object-fit: cover; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border: 1px solid var(--border-color); height: 60px !important; width: 90px !important;}
.yuemu-badge-feature { position: absolute; top: -6px; right: -6px; background: #f59e0b; color: #fff; width: 20px; height: 20px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 10px; border: 2px solid var(--card-background); }

.yuemu-tag-group { display: flex; flex-wrap: wrap; gap: 6px; }
.yuemu-badge { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 6px; font-size: 12px; font-weight: 500; gap: 6px;}

/* 高级色彩标签 */
.yuemu-bg-blue { background: rgba(59, 130, 246, 0.15); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.2); }
.yuemu-bg-green { background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); }
.yuemu-bg-red { background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); }
.yuemu-bg-orange { background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.2); }
.yuemu-bg-gray { background: var(--hover-background); color: var(--text-secondary); border: 1px solid var(--border-color); }
.yuemu-status-dot { width: 6px; height: 6px; border-radius: 50%; }
.yuemu-status-dot.yuemu-bg-green { background: #10b981; box-shadow: 0 0 6px #10b981; }
.yuemu-status-dot.yuemu-bg-red { background: #ef4444; }
.yuemu-status-dot.yuemu-bg-orange { background: #f59e0b; }

.yuemu-meta-stack { display: flex; flex-direction: column; gap: 4px; }
.yuemu-meta-item { font-size: 12px; color: var(--text-secondary); background: var(--hover-background); padding: 2px 6px; border-radius: 4px; display: inline-block; width: max-content; }
.yuemu-review-stack { display: flex; flex-direction: column; align-items: flex-start; }

.yuemu-action-cell { display: flex; flex-wrap: wrap; gap: 4px; justify-content: flex-end; }
.yuemu-icon-text-btn { background: transparent; border: none; padding: 4px 8px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; transition: 0.2s; }
.yuemu-icon-text-btn:hover { background: var(--hover-background); }
.yuemu-color-primary { color: var(--link-color); }
.yuemu-color-success { color: #10b981; }
.yuemu-color-warning { color: #f59e0b; }
.yuemu-color-danger { color: #ef4444; }
.yuemu-color-gray { color: var(--text-secondary); }

/* 分页 */
.yuemu-pagination-bar { margin-top: 24px; display: flex; justify-content: flex-end; }
:deep(.ant-pagination-item), :deep(.ant-pagination-prev), :deep(.ant-pagination-next) { background: transparent !important; border-color: var(--border-color) !important; }
:deep(.ant-pagination-item a) { color: var(--text-primary) !important; }
:deep(.ant-pagination-item-active) { border-color: var(--link-color) !important; background: var(--hover-background) !important; }

/* ==================== 6. 移动端 Feed 瀑布流 ==================== */
.yuemu-m-container { min-height: 100vh; display: flex; flex-direction: column; }

.yuemu-m-sticky-header {
  position: sticky; top: 0; z-index: 100;
  padding: 12px 16px;
  background: rgba(var(--header-background-rgb, 255,255,255), 0.85); /* 需要全局变量支持RGB或使用纯色 fallback */
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-color);
}
@media (prefers-color-scheme: dark) { .yuemu-m-sticky-header { background: rgba(30,30,30,0.85); } }

.yuemu-m-header-main { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.yuemu-m-title { font-size: 22px; font-weight: 800; color: var(--text-primary); margin: 0; }
.yuemu-m-actions { display: flex; gap: 10px; }
.yuemu-m-primary-btn { background: var(--link-color) !important; border: none !important; width: 32px; height: 32px; }
.yuemu-m-ghost-btn { background: var(--hover-background) !important; color: var(--text-primary) !important; border: 1px solid var(--border-color) !important; width: 32px; height: 32px; }

.yuemu-m-search-row { display: flex; align-items: center; gap: 12px; }
:deep(.yuemu-m-search) { flex: 1; padding: 0 !important; background: transparent !important; }
:deep(.van-search__content) { background: var(--card-background) !important; border: 1px solid var(--border-color); border-radius: 12px; }
:deep(.van-field__control) { color: var(--text-primary) !important; }

.yuemu-m-sort-btn { font-size: 13px; color: var(--link-color); font-weight: 600; display: flex; align-items: center; gap: 2px; }

.yuemu-m-batch-bar { height: 0; opacity: 0; overflow: hidden; display: flex; justify-content: space-between; align-items: center; transition: 0.3s; }
.yuemu-m-batch-bar.is-active { height: 40px; opacity: 1; margin-top: 10px; border-top: 1px solid var(--border-color); padding-top: 8px;}
.yuemu-m-batch-text { font-size: 13px; color: var(--text-secondary); }
.yuemu-m-batch-btn { background: rgba(239,68,68,0.1); color: #ef4444; border: none; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }

.yuemu-m-scroll-view { flex: 1; overflow-y: auto; padding: 16px; }

.yuemu-m-card {
  background: var(--card-background); border: 1px solid var(--border-color);
  border-radius: 20px; overflow: hidden; margin-bottom: 20px;
  box-shadow: 0 4px 12px var(--shadow-color);
}

.yuemu-m-card-cover { position: relative; height: 200px; background: #000; }
.yuemu-m-checkbox { position: absolute; top: 12px; left: 12px; z-index: 10; background: rgba(255,255,255,0.9); border-radius: 50%; padding: 2px; }
.yuemu-m-feature-tag { position: absolute; top: 12px; right: 12px; background: rgba(245, 158, 11, 0.9); color: #fff; font-size: 11px; padding: 4px 8px; border-radius: 12px; backdrop-filter: blur(4px); font-weight: 600; }
.yuemu-m-status-tag { position: absolute; bottom: 12px; right: 12px; font-size: 11px; padding: 4px 10px; border-radius: 12px; backdrop-filter: blur(6px); font-weight: 600; }
/* 移动端状态毛玻璃 */
.yuemu-m-status-tag.yuemu-bg-green { background: rgba(16, 185, 129, 0.85); color: #fff; }
.yuemu-m-status-tag.yuemu-bg-orange { background: rgba(245, 158, 11, 0.85); color: #fff; }
.yuemu-m-status-tag.yuemu-bg-red { background: rgba(239, 68, 68, 0.85); color: #fff; }

.yuemu-m-card-info { padding: 16px; }
.yuemu-m-pic-name { font-size: 17px; font-weight: 700; margin: 0 0 6px 0; color: var(--text-primary); }
.yuemu-m-pic-desc { font-size: 13px; color: var(--text-secondary); margin: 0 0 12px 0; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.yuemu-m-tags { display: flex; flex-wrap: wrap; gap: 8px; }

.yuemu-m-card-actions { display: flex; flex-wrap: wrap; gap: 8px; padding: 0 16px 16px; }
.yuemu-m-action-btn { flex: 1; min-width: 70px; padding: 8px 0; border-radius: 10px; border: 1px solid var(--border-color); background: var(--hover-background); font-size: 13px; font-weight: 600; }

:deep(.yuemu-dark-van-pagination .van-pagination__item) { background: transparent; border: 1px solid var(--border-color); color: var(--text-primary); }
:deep(.yuemu-dark-van-pagination .van-pagination__item--active) { background: var(--link-color); color: #fff; border-color: var(--link-color); }

/* ==================== 7. Apple 风格弹窗 ==================== */
:deep(.yuemu-apple-modal .ant-modal-content) { background: var(--card-background); border-radius: 20px; padding: 0; overflow: hidden; border: 1px solid var(--border-color); }
:deep(.yuemu-apple-modal .ant-modal-header) { background: var(--card-background); padding: 20px 24px; border-bottom: 1px solid var(--border-color); }
:deep(.yuemu-apple-modal .ant-modal-title) { font-weight: 700; font-size: 18px; text-align: center; }

.yuemu-modal-form { padding: 20px 24px; }
.yuemu-form-item { margin-bottom: 16px; }
.yuemu-form-item label { display: block; font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 8px; }
.yuemu-modal-footer { display: flex; gap: 12px; margin-top: 24px; }
.yuemu-modal-footer .ant-btn { flex: 1; height: 42px; border-radius: 12px; font-weight: 600; font-size: 15px; }

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
